import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import {
  checkedActions, notifyComplete, notifyError, notifyNext,
  sameValueZero, session4Metadata, subscribeSource, unsubscribeSource,
  subscribeFlush, unsubscribeFlush, validIndex,
} from './session4-common.js';

export type DistinctParameters = Readonly<{ selected: boolean; withFlushes: boolean }>;
type Memory<K> = Readonly<{ keys: readonly K[]; index: number; flushOpen: boolean }>;
export type DistinctState<T, K> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (Readonly<{ phase: 'Active' }> & Memory<K>)
  | (Readonly<{ phase: 'Selecting'; input: T; callId: number }> & Memory<K>)
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'selector-error' | 'flush-error' | 'cancel' }>;
export type DistinctEvent<T, K> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' | 'flush.next' | 'flush.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error' | 'flush.error'; error: unknown }>
  | Readonly<{ type: 'key.return'; resource: ResourceRef; value: K }>
  | Readonly<{ type: 'key.throw'; resource: ResourceRef; error: unknown }>;
export type DistinctModel<T, K> = OperatorModel<DistinctParameters, DistinctState<T, K>, DistinctEvent<T, K>, Action<T>>;
const newKey = (keys: readonly unknown[], value: unknown): boolean => !keys.some(k => sameValueZero(k, value));
const selectionMatches = <T, K>(s: DistinctState<T, K>, e: DistinctEvent<T, K>): boolean =>
  s.phase === 'Selecting' && 'resource' in e && e.resource.id === 'select' && e.resource.generation === s.callId;
const selectResource = (index: number): ResourceRef => ({ id: 'select', generation: index });
const active = <T, K>(keys: readonly K[], index: number, flushOpen: boolean): DistinctState<T, K> =>
  ({ phase: 'Active', keys, index, flushOpen });
const closed = <T, K>(reason: Extract<DistinctState<T, K>, { phase: 'Closed' }>['reason']): DistinctState<T, K> =>
  ({ phase: 'Closed', reason });
const releases = (withFlushes: boolean, flushOpen: boolean) =>
  withFlushes && flushOpen ? [unsubscribeSource, unsubscribeFlush] : [unsubscribeSource];

export function createDistinctModel<T, K = T>(options: Partial<DistinctParameters> = {}): DistinctModel<T, K> {
  const parameters: DistinctParameters = { selected: options.selected ?? false, withFlushes: options.withFlushes ?? false };
  const { selected, withFlushes } = parameters;
  const witness = (tag: string): readonly string[] => ['S4-DISTINCT-' + tag];
  const rules: readonly Rule<DistinctParameters, DistinctState<T, K>, DistinctEvent<T, K>, Action<T>>[] = [
    {
      description: { id: 'DISTINCT-INIT', from: 'Unsubscribed', event: 'subscribe', guard: 'fresh result subscription',
        to: 'Active', actions: ['subscribe source', 'subscribe flush notifier if configured; source first'],
        nextState: 'active with empty Set and optional flush subscription', obligations: witness('INIT'),
        explanation: 'Each result subscription begins with its own empty set. When a flush notifier is supplied, source subscription happens before notifier subscription in the scoped post-setup trace.' },
      enabled: () => true,
      react: (_s, _e, p) => ({ state: active<T, K>([], 0, p.withFlushes),
        actions: p.withFlushes ? [subscribeSource, subscribeFlush] : [subscribeSource] }),
    },
    {
      description: { id: 'DISTINCT-SELECT', from: 'Active', event: 'source.next', guard: 'selector configured and index is valid',
        to: 'Selecting', actions: ['request a correlated key selection with the original value'],
        nextState: 'selecting a key with existing Set retained', obligations: witness('SELECT'),
        explanation: 'When a user keySelector is provided, invoke it for EVERY source value, even values ultimately discarded. This operation is synchronous; thrown selectors are terminal.' },
      enabled: (s, _e, p) => p.selected && s.phase === 'Active' && s.index < Number.MAX_SAFE_INTEGER,
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid key request');
        return { state: { phase: 'Selecting', keys: s.keys, index: s.index + 1, flushOpen: s.flushOpen, callId: s.index, input: e.value },
          actions: [{ type: 'invoke-callback', index: s.index, resource: selectResource(s.index), value: e.value }] };
      },
    },
    {
      description: { id: 'DISTINCT-DIRECT-PASS', from: 'Active', event: 'source.next',
        guard: 'no key selector and Set does not contain incoming value under SameValueZero',
        to: 'Active', actions: ['add original value to Set before forwarding it'],
        nextState: 'active with enlarged Set', obligations: witness('DIRECT'),
        explanation: 'Without a keySelector, distinct compares source values using Set membership. A previously unseen value is added before forwarding the ORIGINAL value; NaN equals NaN in a Set.' },
      enabled: (s, e, p) => !p.selected && s.phase === 'Active' && e.type === 'source.next' && s.index < Number.MAX_SAFE_INTEGER && newKey(s.keys, e.value),
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid direct distinct pass');
        return { state: active<T, K>([...s.keys, e.value as unknown as K], s.index + 1, s.flushOpen), actions: [notifyNext(e.value)] };
      },
    },
    {
      description: { id: 'DISTINCT-DIRECT-DROP', from: 'Active', event: 'source.next',
        guard: 'no key selector and Set already contains incoming value under SameValueZero',
        to: 'Active', actions: [], nextState: 'active with unchanged Set and increased index',
        obligations: witness('DIRECT'), explanation: 'Any repeated key is dropped, even if other values occurred in between. Only flush notifications can clear historical Set membership.' },
      enabled: (s, e, p) => !p.selected && s.phase === 'Active' && e.type === 'source.next' && s.index < Number.MAX_SAFE_INTEGER && !newKey(s.keys, e.value),
      react: (s, _e) => {
        if (s.phase !== 'Active') throw new Error('invalid direct distinct drop');
        return { state: active<T, K>(s.keys, s.index + 1, s.flushOpen), actions: [] };
      },
    },
    {
      description: { id: 'DISTINCT-KEY-PASS', from: 'Selecting', event: 'key.return',
        guard: 'matching selection and previously unseen key under SameValueZero',
        to: 'Active', actions: ['add selected key then forward original source value'],
        nextState: 'active with enlarged keyed Set', obligations: witness('KEY'),
        explanation: 'A selector result absent from the Set is remembered, and the original source value (not the key) is forwarded unchanged.' },
      enabled: (s, e) => selectionMatches(s, e) && s.phase === 'Selecting' && e.type === 'key.return' && newKey(s.keys, e.value),
      react: (s, e) => {
        if (s.phase !== 'Selecting' || e.type !== 'key.return') throw new Error('invalid selected pass');
        return { state: active<T, K>([...s.keys, e.value], s.index, s.flushOpen), actions: [notifyNext(s.input)] };
      },
    },
    {
      description: { id: 'DISTINCT-KEY-DROP', from: 'Selecting', event: 'key.return',
        guard: 'matching selection and previously seen key under SameValueZero',
        to: 'Active', actions: [], nextState: 'active with unchanged Set',
        obligations: witness('KEY'), explanation: 'A selected key already in the Set suppresses the source value. It does not replace or delete any remembered key.' },
      enabled: (s, e) => selectionMatches(s, e) && s.phase === 'Selecting' && e.type === 'key.return' && !newKey(s.keys, e.value),
      react: (s, _e) => {
        if (s.phase !== 'Selecting') throw new Error('invalid selected drop');
        return { state: active<T, K>(s.keys, s.index, s.flushOpen), actions: [] };
      },
    },
    {
      description: { id: 'DISTINCT-KEY-ERROR', from: 'Selecting', event: 'key.throw', guard: 'matching selector invocation',
        to: 'Closed', actions: ['forward exact selector error', 'release source and active notifier'],
        nextState: 'closed by selector error', obligations: witness('THROW'),
        explanation: 'A throwing keySelector ends the stream immediately. The original input is not forwarded and both owned subscriptions are released.' },
      enabled: selectionMatches,
      react: (s, e, p) => {
        if (s.phase !== 'Selecting' || e.type !== 'key.throw') throw new Error('invalid selected error');
        return { state: closed<T, K>('selector-error'), actions: [notifyError(e.error), ...releases(p.withFlushes, s.flushOpen)] };
      },
    },
    {
      description: { id: 'DISTINCT-FLUSH', from: 'Active', event: 'flush.next', guard: 'notifier still active',
        to: 'Active', actions: ['clear the Set without forwarding the flush value'],
        nextState: 'active with empty Set', obligations: witness('FLUSH'),
        explanation: 'Each flush notifier next clears the entire remembered key set. It does not produce a downstream next or complete notification.' },
      enabled: s => s.phase === 'Active' && s.flushOpen,
      react: (s) => {
        if (s.phase !== 'Active') throw new Error('invalid flush');
        return { state: active<T, K>([], s.index, s.flushOpen), actions: [] };
      },
    },
    {
      description: { id: 'DISTINCT-FLUSH-COMPLETE', from: 'Active', event: 'flush.complete', guard: 'notifier still active',
        to: 'Active', actions: ['release notifier subscription without completing downstream or clearing the Set'],
        nextState: 'active, with the existing Set but no future flush events',
        obligations: witness('FLUSH'), explanation: 'Flush notifier completion is ignored as a downstream lifecycle event. Existing keys remain; the notifier subscription closes.' },
      enabled: s => s.phase === 'Active' && s.flushOpen,
      react: s => {
        if (s.phase !== 'Active') throw new Error('invalid flush completion');
        return { state: active<T, K>(s.keys, s.index, false), actions: [unsubscribeFlush] };
      },
    },
    {
      description: { id: 'DISTINCT-FLUSH-ERROR', from: 'Active', event: 'flush.error', guard: 'notifier still active',
        to: 'Closed', actions: ['forward exact notifier error', 'release both subscriptions'],
        nextState: 'closed after notifier error', obligations: witness('FLUSH'),
        explanation: 'A flush notifier error propagates downstream, immediately tearing down the source and notifier. It is not treated as a harmless reset.' },
      enabled: s => s.phase === 'Active' && s.flushOpen,
      react: (_s, e) => {
        if (e.type !== 'flush.error') throw new Error('invalid flush error');
        return { state: closed<T, K>('flush-error'), actions: [notifyError(e.error), unsubscribeSource, unsubscribeFlush] };
      },
    },
    {
      description: { id: 'DISTINCT-COMPLETE', from: 'Active', event: 'source.complete', guard: 'no pending selector',
        to: 'Closed', actions: ['complete result; release source and active notifier'],
        nextState: 'closed after source completion', obligations: witness('LIFECYCLE'),
        explanation: 'When the source completes, distinct does not emit its Set. It completes and releases any still-active flush subscription.' },
      enabled: () => true,
      react: (s, _e, p) => {
        if (s.phase !== 'Active') throw new Error('invalid source completion');
        return { state: closed<T, K>('complete'), actions: [notifyComplete, ...releases(p.withFlushes, s.flushOpen)] };
      },
    },
    {
      description: { id: 'DISTINCT-ERROR', from: 'Active', event: 'source.error', guard: 'no pending selector',
        to: 'Closed', actions: ['forward exact source error; release source and active notifier'],
        nextState: 'closed after source error', obligations: witness('LIFECYCLE'),
        explanation: 'Source errors terminate without clearing or emitting the remembered Set. The source and notifier are released.' },
      enabled: () => true,
      react: (s, e, p) => {
        if (s.phase !== 'Active' || e.type !== 'source.error') throw new Error('invalid source error');
        return { state: closed<T, K>('source-error'), actions: [notifyError(e.error), ...releases(p.withFlushes, s.flushOpen)] };
      },
    },
    {
      description: { id: 'DISTINCT-CANCEL', from: 'Active', event: 'cancel', guard: 'between completed source reactions',
        to: 'Closed', actions: ['release source and active notifier without downstream completion'],
        nextState: 'closed by cancellation', obligations: witness('LIFECYCLE'),
        explanation: 'Downstream unsubscription releases both owned subscriptions. Cancellation is not a completion event.' },
      enabled: () => true,
      react: (s, _e, p) => {
        if (s.phase !== 'Active') throw new Error('invalid cancellation');
        return { state: closed<T, K>('cancel'), actions: releases(p.withFlushes, s.flushOpen) };
      },
    },
  ];
  return {
    parameters, rules,
    metadata: session4Metadata({
      schemaVersion: '1.1', id: `distinct-${selected ? 'selected' : 'direct'}-${withFlushes ? 'flush' : 'permanent'}`,
      operator: 'distinct',
      purpose: 'Forward values whose selected key is not in the Set of ANY previously forwarded keys since the last flush.',
      cardinality: { signature: 'distinct : T* x Flush*? -> T*', conditions: [
        'At most one original value is forwarded per source value; no key is replayed or emitted.',
        'Set membership is SameValueZero, unlike the default strict comparator of distinctUntilChanged.',
        'Optional flush.next clears history. Source completion/error/cancellation ends output independently.',
      ] },
      scope: {
        parameters: `selected=${selected}, withFlushes=${withFlushes}. Full Set for finite trace prefixes.`,
        callbacks: 'An optional keySelector is modeled by an external correlated key.return/key.throw; no user callback runs in guards. Without it, key is the original value and membership is checked directly.',
        time: 'No scheduling or clock. Flush and source timestamps/order come from external deliveries; equal-time tie order is explicit.',
        reentrancy: 'Non-reentrant source, notifier and observers; post-setup notifier subscription after source subscription.',
        exclusions: ['Arbitrary nested deliveries, source completion during synchronous notifier wiring, and throwing observers/finalizers.',
          'Unbounded keys for infinite sources, safe-integer overflow, generalized ObservableInput flush conversions, and production effect interpretation.'],
      },
      initialization: { control: 'Unsubscribed', event: 'subscribe',
        sourceSubscription: 'Subscribe to source; optionally subscribe to flushes after source connection in this non-reentrant post-setup profile.' },
      ownership: { state: 'subscription-local', sharing: 'No sharing introduced; each subscription owns its own Set and notifier subscription.',
        reset: 'Flush next clears Set, notifier completion retains Set, source termination closes the execution.',
        resources: [{ id: 'source', kind: 'subscription', owner: 'result execution' },
          ...(withFlushes ? [{ id: 'flush' as const, kind: 'subscription' as const, owner: 'result execution' }] : []),
          ...(selected ? [{ id: 'select' as const, kind: 'callback' as const, owner: 'result execution' }] : [])] },
      dispatch: { policy: 'atomic-non-reentrant',
        actionSemantics: 'The set stores opaque key references; no cloning or hashing of payload content. Selector phases resolve before later source/notifier delivery.',
        cancellationCheckpoints: ['After a complete value reaction; release both live subscriptions without notifying downstream.'] },
      inputs: [
        { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'fresh result subscription' },
        { type: 'source.next', origin: 'source', category: 'notification', description: 'source emits an original value' },
        { type: 'key.return', origin: 'callback', category: 'callback', description: 'keySelector returns a key' },
        { type: 'key.throw', origin: 'callback', category: 'callback', description: 'keySelector throws' },
        { type: 'flush.next', origin: 'inner', category: 'notification', description: 'flush notifier emits a value and resets the key Set' },
        { type: 'flush.complete', origin: 'inner', category: 'notification', description: 'flush notifier completes without resetting or ending result' },
        { type: 'flush.error', origin: 'inner', category: 'notification', description: 'flush notifier errors downstream' },
        { type: 'source.complete', origin: 'source', category: 'notification', description: 'source completes' },
        { type: 'source.error', origin: 'source', category: 'notification', description: 'source errors' },
        { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream cancels' },
      ],
      actionTypes: ['subscribe', 'unsubscribe', 'notify', ...(selected ? ['invoke-callback' as const] : [])],
      controls: [
        { id: 'Unsubscribed', description: 'not yet subscribed', terminal: false },
        { id: 'Active', description: 'source live; key Set retained; notifier may be active', terminal: false },
        { id: 'Selecting', description: 'pending correlated keySelector outcome', terminal: false },
        { id: 'Closed', description: 'terminated or cancelled', terminal: true },
      ],
      sourcePaths: ['src/internal/operators/distinct.ts','src/internal/operators/OperatorSubscriber.ts','src/internal/observable/innerFrom.ts'],
    }),
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: (s, p) => {
      if (s.phase === 'Unsubscribed') return [];
      if (s.phase === 'Closed') return ['complete','source-error','selector-error','flush-error','cancel'].includes(s.reason) ? [] : ['invalid closed reason'];
      if (!validIndex(s.index) || s.index > Number.MAX_SAFE_INTEGER) return ['invalid key event index'];
      if (new Set(s.keys).size !== s.keys.length) return ['duplicate SameValueZero keys in Set state'];
      if (s.flushOpen && !p.withFlushes) return ['flush active without configured notifier'];
      if (s.phase === 'Selecting' && (!p.selected || !validIndex(s.callId) || s.callId + 1 !== s.index || !Object.hasOwn(s, 'input'))) return ['invalid pending key selection'];
      return [];
    },
    validateReaction: (_before, _event, result, p) => {
      const errors = checkedActions(result.actions, ['source', ...(p.withFlushes ? ['flush'] : []), ...(p.selected ? ['select'] : [])]);
      if (result.actions.some(a => a.type === 'notify' && a.notification.kind === 'N') &&
          result.actions.filter(a => a.type === 'notify').length !== 1) errors.push('distinct emits at most one value per input');
      return errors;
    },
  };
}

export const distinctExample: readonly TimedEvent<DistinctEvent<number, number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 1 } },
  { time: 2, event: { type: 'source.next', value: 1 } },
  { time: 3, event: { type: 'source.next', value: 2 } },
  { time: 4, event: { type: 'flush.next' } },
  { time: 5, event: { type: 'source.next', value: 1 } },
  { time: 6, event: { type: 'flush.complete' } },
  { time: 7, event: { type: 'source.next', value: 1 } },
  { time: 8, event: { type: 'source.complete' } },
];
