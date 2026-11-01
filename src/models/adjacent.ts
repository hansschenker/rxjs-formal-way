import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import {
  checkedActions, notifyComplete, notifyError, notifyNext, session4Metadata,
  sourceRef, subscribeSource, unsubscribeSource, validIndex,
} from './session4-common.js';

export type AdjacentOperator = 'distinctUntilChanged' | 'distinctUntilKeyChanged';
export type AdjacentParameters = Readonly<{
  operator: AdjacentOperator; keyMode: 'identity' | 'selected' | 'property';
  property?: string; compareMode: 'strict' | 'custom';
}>;
type Memory<K> = Readonly<{ index: number; hasPrevious: boolean; previousKey?: K }>;
export type AdjacentState<T, K> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (Readonly<{ phase: 'Active' }> & Memory<K>)
  | (Readonly<{ phase: 'Selecting'; callId: number; input: T }> & Memory<K>)
  | Readonly<{ phase: 'Comparing'; index: number; callId: number; input: T; previousKey: K; key: K }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'selector-error' | 'comparator-error' | 'cancel' }>;
export type AdjacentEvent<T, K> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'key.return'; resource: ResourceRef; value: K }>
  | Readonly<{ type: 'key.throw'; resource: ResourceRef; error: unknown }>
  | Readonly<{ type: 'compare.return'; resource: ResourceRef; same: unknown }>
  | Readonly<{ type: 'compare.throw'; resource: ResourceRef; error: unknown }>;
export type AdjacentModel<T, K> = OperatorModel<AdjacentParameters, AdjacentState<T, K>, AdjacentEvent<T, K>, Action<T>>;

const keyMatch = <T, K>(state: AdjacentState<T, K>, event: AdjacentEvent<T, K>): boolean =>
  state.phase === 'Selecting' && ('resource' in event) &&
  event.resource.id === 'key' && event.resource.generation === state.callId;
const compareMatch = <T, K>(state: AdjacentState<T, K>, event: AdjacentEvent<T, K>): boolean =>
  state.phase === 'Comparing' && ('resource' in event) &&
  event.resource.id === 'compare' && event.resource.generation === state.callId;
const closed = <T, K>(reason: Extract<AdjacentState<T, K>, { phase: 'Closed' }>['reason']): AdjacentState<T, K> =>
  ({ phase: 'Closed', reason });
const active = <T, K>(index: number, hasPrevious: boolean, previousKey?: K): AdjacentState<T, K> =>
  ({ phase: 'Active', index, hasPrevious, ...(hasPrevious ? { previousKey } : {}) });
const selectorRef = (index: number): ResourceRef => ({ id: 'key', generation: index });
const comparatorRef = (index: number): ResourceRef => ({ id: 'compare', generation: index });
const witnessed = (operator: AdjacentOperator, tag: string): readonly string[] =>
  [`S4-${operator.toUpperCase()}-${tag}`];

function createAdjacentModel<T, K>(parameters: AdjacentParameters): AdjacentModel<T, K> {
  const { operator, keyMode, compareMode } = parameters;
  const prefix = operator.toUpperCase();
  const witness = (tag: string) => witnessed(operator, tag);
  const rules: readonly Rule<AdjacentParameters, AdjacentState<T, K>, AdjacentEvent<T, K>, Action<T>>[] = [
    {
      description: { id: prefix + '-INIT', from: 'Unsubscribed', event: 'subscribe', guard: 'fresh execution', to: 'Active',
        actions: ['subscribe to the source; remember no previous emitted key'], nextState: 'active with no previous key and index zero',
        obligations: witness('INIT'), explanation: 'Subscription starts one independent comparison history. No values are emitted until the source sends one.' },
      enabled: () => true,
      react: () => ({ state: active<T, K>(0, false), actions: [subscribeSource] }),
    },
    {
      description: { id: prefix + '-SELECT', from: 'Active', event: 'source.next', guard: 'source index below safe-integer bound', to: 'Selecting',
        actions: ['resolve the incoming key (a synthetic identity/property microstep unless the user supplied a selector)'],
        nextState: 'one key resolution pending; previous emitted key retained', obligations: witness('SELECT'),
        explanation: 'Every source value selects a key, including the first and every value later suppressed. Without a user selector this is an identity or property-access microstep; it is not an extra RxJS event or asynchronous task.' },
      enabled: s => s.phase === 'Active' && s.index < Number.MAX_SAFE_INTEGER,
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid adjacent source event');
        return { state: { phase: 'Selecting', index: s.index + 1, callId: s.index, input: e.value, hasPrevious: s.hasPrevious,
          ...(s.hasPrevious ? { previousKey: s.previousKey } : {}) },
          actions: [{ type: 'invoke-callback', resource: selectorRef(s.index), index: s.index, value: e.value }] };
      },
    },
    {
      description: { id: prefix + '-FIRST', from: 'Selecting', event: 'key.return', guard: 'matching key resolution and no prior emitted key',
        to: 'Active', actions: ['store the selected key before forwarding the original value'], nextState: 'active remembering the first emitted key',
        obligations: witness('FIRST'), explanation: 'The first source value is always forwarded; its selected key is saved before the notification is sent. A key selector, when configured, still runs for this first value.' },
      enabled: (s, e) => keyMatch(s, e) && s.phase === 'Selecting' && !s.hasPrevious,
      react: (s, e) => {
        if (s.phase !== 'Selecting' || e.type !== 'key.return') throw new Error('invalid first key outcome');
        return { state: active<T, K>(s.index, true, e.value), actions: [notifyNext(s.input)] };
      },
    },
    {
      description: { id: prefix + '-COMPARE', from: 'Selecting', event: 'key.return', guard: 'matching key resolution and a prior emitted key',
        to: 'Comparing', actions: ['compare previous emitted key with incoming key'], nextState: 'one comparison outcome pending',
        obligations: witness('COMPARE'), explanation: 'Subsequent source values compare with the key of the last FORWARDED value, not necessarily the immediately preceding input. The comparator receives previous key first, current key second.' },
      enabled: (s, e) => keyMatch(s, e) && s.phase === 'Selecting' && s.hasPrevious,
      react: (s, e) => {
        if (s.phase !== 'Selecting' || e.type !== 'key.return') throw new Error('invalid comparison request');
        const previousKey = s.previousKey as K;
        return { state: { phase: 'Comparing', index: s.index, callId: s.callId, input: s.input, previousKey, key: e.value },
          actions: [{ type: 'invoke-callback', resource: comparatorRef(s.callId), index: s.callId,
            value: { previous: previousKey, current: e.value } }] };
      },
    },
    {
      description: { id: prefix + '-CHANGE', from: 'Comparing', event: 'compare.return', guard: 'matching comparison with falsy equality result',
        to: 'Active', actions: ['replace the stored key before forwarding the original value'],
        nextState: 'active with new previous emitted key', obligations: witness('CHANGE'),
        explanation: 'When the comparator says the keys differ, forward the original value and replace the remembered key before downstream delivery.' },
      enabled: (s, e) => compareMatch(s, e) && e.type === 'compare.return' && !e.same,
      react: (s, e) => {
        if (s.phase !== 'Comparing' || e.type !== 'compare.return') throw new Error('invalid comparison change');
        return { state: active<T, K>(s.index, true, s.key), actions: [notifyNext(s.input)] };
      },
    },
    {
      description: { id: prefix + '-SAME', from: 'Comparing', event: 'compare.return', guard: 'matching comparison with truthy equality result',
        to: 'Active', actions: [], nextState: 'active keeping the previous FORWARDED key',
        obligations: witness('SAME'), explanation: 'When the comparator says equal, emit nothing and do not replace the previous emitted key. Future values compare against the last value actually forwarded.' },
      enabled: (s, e) => compareMatch(s, e) && e.type === 'compare.return' && Boolean(e.same),
      react: (s, e) => {
        if (s.phase !== 'Comparing' || e.type !== 'compare.return') throw new Error('invalid comparison drop');
        return { state: active<T, K>(s.index, true, s.previousKey), actions: [] };
      },
    },
    {
      description: { id: prefix + '-SELECT-ERROR', from: 'Selecting', event: 'key.throw', guard: 'matching key resolution',
        to: 'Closed', actions: ['forward selector error unchanged', 'release source'], nextState: 'closed on key-selection failure',
        obligations: witness('THROW'), explanation: 'If selecting the key throws, forward the exact error and release the source. No input value or completion follows.' },
      enabled: keyMatch,
      react: (_s, e) => {
        if (e.type !== 'key.throw') throw new Error('invalid key error');
        return { state: closed<T, K>('selector-error'), actions: [notifyError(e.error), unsubscribeSource] };
      },
    },
    {
      description: { id: prefix + '-COMPARE-ERROR', from: 'Comparing', event: 'compare.throw', guard: 'matching comparator outcome',
        to: 'Closed', actions: ['forward comparator error unchanged', 'release source'], nextState: 'closed on comparison failure',
        obligations: witness('THROW'), explanation: 'A comparator error terminates the stream immediately and releases the source without a final value.' },
      enabled: compareMatch,
      react: (_s, e) => {
        if (e.type !== 'compare.throw') throw new Error('invalid compare error');
        return { state: closed<T, K>('comparator-error'), actions: [notifyError(e.error), unsubscribeSource] };
      },
    },
    {
      description: { id: prefix + '-COMPLETE', from: 'Active', event: 'source.complete', guard: 'no unresolved synchronous key or comparison',
        to: 'Closed', actions: ['complete downstream', 'release source'], nextState: 'closed after source completion',
        obligations: witness('LIFECYCLE'), explanation: 'Source completion forwards completion without emitting a stored value, then releases the source subscription.' },
      enabled: () => true,
      react: () => ({ state: closed<T, K>('complete'), actions: [notifyComplete, unsubscribeSource] }),
    },
    {
      description: { id: prefix + '-ERROR', from: 'Active', event: 'source.error', guard: 'no unresolved synchronous key or comparison',
        to: 'Closed', actions: ['forward source error unchanged', 'release source'], nextState: 'closed after source error',
        obligations: witness('LIFECYCLE'), explanation: 'A source error passes through unchanged, then source resources are released; no completion follows.' },
      enabled: () => true,
      react: (_s, e) => {
        if (e.type !== 'source.error') throw new Error('invalid adjacent source error');
        return { state: closed<T, K>('source-error'), actions: [notifyError(e.error), unsubscribeSource] };
      },
    },
    {
      description: { id: prefix + '-CANCEL', from: 'Active', event: 'cancel', guard: 'cancellation between resolved source values',
        to: 'Closed', actions: ['release source without downstream terminal'], nextState: 'closed by cancellation',
        obligations: witness('LIFECYCLE'), explanation: 'Downstream cancellation releases source ownership without producing a completion notification.' },
      enabled: () => true,
      react: () => ({ state: closed<T, K>('cancel'), actions: [unsubscribeSource] }),
    },
  ];
  const m = session4Metadata({
    id: `${operator}-${keyMode}-${compareMode}`, operator,
    purpose: operator === 'distinctUntilKeyChanged'
      ? 'Forward the first item and later items whose selected property differs from the previous FORWARDED item.'
      : 'Forward the first item and later items whose selected key differs from the previous FORWARDED key.',
    cardinality: { signature: `${operator} : T* -> T*`, conditions: [
      'At most one original value is emitted per source value. The first is emitted if its key selection succeeds.',
      'Errors and cancellation may truncate output; comparator equality is not suppression based on every past key.',
    ] },
    scope: {
      parameters: `Key mode ${keyMode}, comparator mode ${compareMode}${parameters.property ? ', property ' + parameters.property : ''}.`,
      callbacks: 'Key selection and comparator outcomes are external correlated microsteps, not functions executed inside model guards. Default identity/property selection and strict comparison are synthetic model steps, not physical user callback calls.',
      time: 'No timers or scheduler introduced. Inputs supply timestamps and tie order; key and comparator microsteps resolve synchronously at the same time.',
      reentrancy: 'Non-reentrant source and observer delivery; only plain stable property values are modeled for distinctUntilKeyChanged.',
      exclusions: ['Arbitrary reentrant observer/callback behavior and subscriber cancellation DURING an unresolved callback.',
        'Mutation/getter side effects between property comparisons, prototype proxies or throwing property access unless represented as explicit key errors.',
        'Unbounded invocation-counter overflow, a production callback effect interpreter, deprecated overloads not selected here.'],
    },
    initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: 'One source connection; empty comparison memory.' },
    ownership: { state: 'subscription-local', sharing: 'Does not multicast. Each result subscription owns its own last-emitted key.',
      reset: 'Fresh subscribe starts with no previous key; closed executions are not reused.',
      resources: [{ id: 'source', kind: 'subscription', owner: 'result subscription' },
        { id: 'key', kind: 'callback', owner: 'symbolic synchronous key resolution' },
        { id: 'compare', kind: 'callback', owner: 'symbolic synchronous comparator result' }] },
    dispatch: { policy: 'atomic-non-reentrant', actionSemantics: 'One source.next requests its key, then optionally a comparison; both phases complete before the next source event.',
      cancellationCheckpoints: ['After key/comparison resolution; cancellation releases upstream without notification.'] },
    inputs: [
      { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'downstream starts a fresh execution' },
      { type: 'source.next', origin: 'source', category: 'notification', description: 'a new source payload arrives' },
      { type: 'key.return', origin: 'callback', category: 'callback', description: 'the selected key is available for this source value' },
      { type: 'key.throw', origin: 'callback', category: 'callback', description: 'key selection throws' },
      { type: 'compare.return', origin: 'callback', category: 'callback', description: 'the equality test returns a truthy or falsy result' },
      { type: 'compare.throw', origin: 'callback', category: 'callback', description: 'comparison throws' },
      { type: 'source.complete', origin: 'source', category: 'notification', description: 'source completes' },
      { type: 'source.error', origin: 'source', category: 'notification', description: 'source fails' },
      { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream cancels' },
    ],
    actionTypes: ['subscribe', 'unsubscribe', 'invoke-callback', 'notify'],
    controls: [
      { id: 'Unsubscribed', description: 'no source connection or remembered key', terminal: false },
      { id: 'Active', description: 'source live, optionally retaining last forwarded key', terminal: false },
      { id: 'Selecting', description: 'key resolution in progress', terminal: false },
      { id: 'Comparing', description: 'equality decision in progress', terminal: false },
      { id: 'Closed', description: 'terminal or cancelled; further input forbidden', terminal: true },
    ],
    sourcePaths: [
      `src/internal/operators/${operator}.ts`,
      ...(operator === 'distinctUntilKeyChanged' ? ['src/internal/operators/distinctUntilChanged.ts'] : []),
      'src/internal/operators/OperatorSubscriber.ts',
    ],
    schemaVersion: '1.1',
  });
  return {
    parameters, metadata: m, rules,
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      if (s.phase === 'Closed') return ['complete', 'source-error', 'selector-error', 'comparator-error', 'cancel'].includes(s.reason) ? [] : ['invalid closing reason'];
      if (!validIndex(s.index) || s.index > Number.MAX_SAFE_INTEGER) return ['invalid source index'];
      if (s.phase === 'Comparing') return validIndex(s.callId) && s.callId + 1 === s.index ? [] : ['invalid comparison call identity'];
      if (s.hasPrevious && !Object.hasOwn(s, 'previousKey')) return ['missing previous key (undefined is a valid stored key)'];
      if (!s.hasPrevious && Object.hasOwn(s, 'previousKey')) return ['unexpected previous key'];
      if (s.phase === 'Selecting' && (!validIndex(s.callId) || s.callId + 1 !== s.index || !Object.hasOwn(s, 'input'))) return ['invalid key invocation'];
      return [];
    },
    validateReaction: (before, event, result) => {
      const errors = checkedActions(result.actions, ['source', 'key', 'compare']);
      if (before.phase === 'Active' && event.type === 'source.next' && result.actions.filter(a => a.type === 'invoke-callback').length !== 1) errors.push('source.next must resolve one key');
      if (event.type === 'compare.return' && result.actions.some(a => a.type === 'notify' && a.notification.kind === 'N') !== !Boolean(event.same)) errors.push('wrong compare forwarding policy');
      return errors;
    },
  };
}

export function createDistinctUntilChangedModel<T, K = T>(
  options: Readonly<{ keyMode?: 'identity' | 'selected'; compareMode?: 'strict' | 'custom' }> = {},
): AdjacentModel<T, K> {
  return createAdjacentModel<T, K>({ operator: 'distinctUntilChanged', keyMode: options.keyMode ?? 'identity', compareMode: options.compareMode ?? 'strict' });
}
export function createDistinctUntilKeyChangedModel<T, K = unknown>(
  property = 'code', compareMode: 'strict' | 'custom' = 'strict',
): AdjacentModel<T, K> {
  if (!property.trim()) throw new TypeError('property must be nonempty');
  return createAdjacentModel<T, K>({ operator: 'distinctUntilKeyChanged', keyMode: 'property', property, compareMode });
}

export const distinctUntilChangedExample: readonly TimedEvent<AdjacentEvent<number, number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 1 } },
  { time: 1, event: { type: 'key.return', resource: selectorRef(0), value: 1 } },
  { time: 2, event: { type: 'source.next', value: 1 } },
  { time: 2, event: { type: 'key.return', resource: selectorRef(1), value: 1 } },
  { time: 2, event: { type: 'compare.return', resource: comparatorRef(1), same: true } },
  { time: 3, event: { type: 'source.next', value: 2 } },
  { time: 3, event: { type: 'key.return', resource: selectorRef(2), value: 2 } },
  { time: 3, event: { type: 'compare.return', resource: comparatorRef(2), same: false } },
  { time: 4, event: { type: 'source.complete' } },
];
export const distinctUntilKeyChangedExample: readonly TimedEvent<AdjacentEvent<{ code: string }, string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: { code: 'a' } } },
  { time: 1, event: { type: 'key.return', resource: selectorRef(0), value: 'a' } },
  { time: 2, event: { type: 'source.next', value: { code: 'a' } } },
  { time: 2, event: { type: 'key.return', resource: selectorRef(1), value: 'a' } },
  { time: 2, event: { type: 'compare.return', resource: comparatorRef(1), same: true } },
  { time: 3, event: { type: 'source.next', value: { code: 'b' } } },
  { time: 3, event: { type: 'key.return', resource: selectorRef(2), value: 'b' } },
  { time: 3, event: { type: 'compare.return', resource: comparatorRef(2), same: false } },
  { time: 4, event: { type: 'source.complete' } },
];
