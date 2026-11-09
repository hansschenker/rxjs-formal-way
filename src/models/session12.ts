import type {
  Action, Control, InputDescriptor, ModelMetadata, OperatorModel, ResourceRef, Rule, RuleDescription, TimedEvent
} from '../schema.js';
import { actionErrors, source, subscribe, unsubscribe, next, complete, error, natural, pinnedRevision } from './session10-common.js';

type CloseReason = 'complete' | 'source-error' | 'inner-error' | 'project-error' | 'predicate-error' | 'empty' | 'cancel';
type SourceEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;

const closed = (reason: CloseReason) => ({ phase: 'Closed' as const, reason });
const same = (a: ResourceRef, b: ResourceRef): boolean => a.id === b.id && a.generation === b.generation;
const callbackRef = (id: string, generation: number): ResourceRef => ({ id, generation });

const baseInputs: readonly InputDescriptor[] = [
  { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'begin a fresh lazy execution' },
  { type: 'source.next', origin: 'source', category: 'notification', description: 'source delivers an opaque value' },
  { type: 'source.complete', origin: 'source', category: 'notification', description: 'source completes successfully' },
  { type: 'source.error', origin: 'source', category: 'notification', description: 'source fails with its original error object' },
  { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream unsubscribes silently' },
];

const controls = (extra: readonly Control[] = []): readonly Control[] => [
  { id: 'Unsubscribed', description: 'cold description; nothing connected yet', terminal: false },
  { id: 'Active', description: 'source connected with subscription-local state', terminal: false },
  ...extra,
  { id: 'Closed', description: 'terminal execution; no later model events are legal', terminal: true },
];

const desc = (
  operator: string, id: string, from: string, event: string, to: string,
  guard: string, actions: readonly string[], explanation: string
): RuleDescription => ({
  id: operator.toUpperCase() + '-' + id,
  from, event, to, guard, actions,
  nextState: to === 'Closed' ? 'terminal state with no owned live work' : 'updated control and memory',
  obligations: ['S12-' + operator.toUpperCase() + '-' + id],
  explanation,
});

type MetaInput = Readonly<{
  id: string;
  operator: string;
  purpose: string;
  signature: string;
  conditions: readonly string[];
  parameters: string;
  callbacks: string;
  time: string;
  reentrancy: string;
  exclusions: readonly string[];
  resources: readonly Readonly<{ id: string; kind: 'subscription' | 'timer' | 'callback'; owner: string }>[];
  inputs: readonly InputDescriptor[];
  actionTypes: readonly Action<unknown>['type'][];
  controls: readonly Control[];
  paths: readonly string[];
  initialization?: string;
  sharing?: string;
}>;

const metadata = (m: MetaInput): ModelMetadata => ({
  schemaVersion: '1.1',
  rxjsVersion: '7.8.2',
  id: m.id,
  operator: m.operator,
  purpose: m.purpose,
  cardinality: {
    signature: m.signature,
    conditions: [
      ...m.conditions,
      'Cω counts next values; terminal notifications, cancellation and resource release are separate obligations.',
    ],
  },
  scope: {
    parameters: m.parameters,
    callbacks: m.callbacks,
    time: m.time,
    reentrancy: m.reentrancy,
    exclusions: m.exclusions,
  },
  initialization: {
    control: 'Unsubscribed',
    event: 'subscribe',
    sourceSubscription: m.initialization ?? 'Acquire one source subscription only when the result is subscribed.',
  },
  ownership: {
    state: 'subscription-local',
    sharing: m.sharing ?? 'No sharing is introduced; each result subscription owns independent state and resources.',
    reset: 'A fresh result subscription starts from Unsubscribed; Closed rejects all later model events.',
    resources: m.resources,
  },
  dispatch: {
    policy: 'atomic-non-reentrant',
    actionSemantics: 'Commit next state, then interpret ordered actions. Callback actions are requests to external user functions, never executed by the pure model.',
    cancellationCheckpoints: ['Between fully resolved reactions; cancellation releases owned work and emits no synthetic completion.'],
  },
  inputs: m.inputs,
  actionTypes: m.actionTypes,
  controls: m.controls,
  sources: m.paths.map(path => ({
    url: 'https://github.com/ReactiveX/rxjs/blob/' + pinnedRevision + '/' + path,
    revision: pinnedRevision,
    purpose: 'Pinned RxJS 7.8.2 behavior and teardown evidence',
  })),
  evidence: {
    modelTests: ['tests/session12-model.test.mjs'],
    runtimeTests: ['tests/session12-rxjs.test.mjs'],
    status: 'source-inspected',
    record: 'evidence/SESSION-12.md',
  },
});

/* expand: recursive projection of source AND recursively produced values. Scoped to unbounded or concurrency=1, no scheduler. */
export type ExpandParameters = Readonly<{ concurrent: 1 | 'unbounded'; projectId: 'project'; scheduler: 'none' }>;
type ExpandMemory<T> = Readonly<{
  index: number;
  active: readonly ResourceRef[];
  queue: readonly T[];
}>;
export type ExpandState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (Readonly<{ phase: 'Active' | 'Draining' }> & ExpandMemory<T>)
  | (Readonly<{ phase: 'Calling'; resume: 'Active' | 'Draining'; value: T; callId: number }> & ExpandMemory<T>)
  | Readonly<{ phase: 'Closed'; reason: CloseReason }>;
export type ExpandEvent<T, Source = string> =
  | Readonly<{ type: 'subscribe' | 'outer.complete' | 'cancel' }>
  | Readonly<{ type: 'outer.next'; value: T }>
  | Readonly<{ type: 'outer.error'; error: unknown }>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; value: Source }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>
  | Readonly<{ type: 'inner.next'; resource: ResourceRef; value: T }>
  | Readonly<{ type: 'inner.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'inner.error'; resource: ResourceRef; error: unknown }>;
export type ExpandModel<T, Source = string> =
  OperatorModel<ExpandParameters, ExpandState<T>, ExpandEvent<T, Source>, Action<T, T>>;

const outer: ResourceRef = { id: 'outer', generation: 0 };
const limit = (p: ExpandParameters): number => p.concurrent === 'unbounded' ? Infinity : 1;
const expandInputs: readonly InputDescriptor[] = [
  { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'connect a fresh recursive expansion execution' },
  { type: 'outer.next', origin: 'outer', category: 'notification', description: 'original source produces a value eligible for expansion' },
  { type: 'outer.complete', origin: 'outer', category: 'notification', description: 'original source completes; admitted recursive work may remain' },
  { type: 'outer.error', origin: 'outer', category: 'notification', description: 'original source errors' },
  { type: 'callback.return', origin: 'callback', category: 'callback', description: 'correlated projection returns an Observable source token' },
  { type: 'callback.throw', origin: 'callback', category: 'callback', description: 'correlated projection throws' },
  { type: 'inner.next', origin: 'inner', category: 'notification', description: 'active recursive inner emits a value that is fed back into expansion' },
  { type: 'inner.complete', origin: 'inner', category: 'notification', description: 'an active recursive inner completes' },
  { type: 'inner.error', origin: 'inner', category: 'notification', description: 'an active recursive inner errors' },
  { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'release outer and active recursive inners silently' },
];

export function createExpandModel<T, Source = string>(concurrent: 1 | 'unbounded' = 'unbounded'): ExpandModel<T, Source> {
  const p: ExpandParameters = { concurrent, projectId: 'project', scheduler: 'none' };
  type S = ExpandState<T>;
  type E = ExpandEvent<T, Source>;
  type A = Action<T, T>;
  type R = Rule<ExpandParameters, S, E, A>;
  const rules: R[] = [];
  const add = (
    id: string, from: string, event: string, to: string, guard: string,
    actions: string[], explanation: string, enabled: R['enabled'], react: R['react']
  ) => rules.push({ description: desc('expand', id, from, event, to, guard, actions, explanation), enabled, react });
  const mem = (s: Extract<S, { phase: 'Active' | 'Draining' | 'Calling' }>): ExpandMemory<T> =>
    ({ index: s.index, active: s.active, queue: s.queue });
  const connected = (s: S): s is Extract<S, { phase: 'Active' | 'Draining' }> =>
    s.phase === 'Active' || s.phase === 'Draining';
  const outerOpen = (s: S): boolean => s.phase === 'Active' || (s.phase === 'Calling' && s.resume === 'Active');
  const matchingInner = (s: S, e: E): boolean =>
    connected(s) && (e.type === 'inner.next' || e.type === 'inner.complete' || e.type === 'inner.error') &&
    s.active.some(r => same(r, e.resource));
  const call = (s: ExpandMemory<T>, resume: 'Active' | 'Draining', value: T): { state: S; actions: A[] } => ({
    state: { phase: 'Calling', resume, ...s, index: s.index + 1, value, callId: s.index },
    actions: [
      next(value) as A,
      { type: 'invoke-callback', resource: callbackRef('project', s.index), value, index: s.index } as A,
    ],
  });
  const canAdmit = (s: Extract<S, { phase: 'Active' | 'Draining' }>) => s.active.length < limit(p) && s.index < Number.MAX_SAFE_INTEGER;
  const cleanup = (s: Extract<S, { phase: 'Active' | 'Draining' | 'Calling' }>): A[] => [
    ...(outerOpen(s) ? [{ type: 'unsubscribe', resource: outer } as A] : []),
    ...s.active.map(resource => ({ type: 'unsubscribe', resource } as A)),
  ];
  const matchCall = (s: S, e: E): boolean =>
    s.phase === 'Calling' && (e.type === 'callback.return' || e.type === 'callback.throw') &&
    e.resource.id === 'project' && e.resource.generation === s.callId;

  add('INIT', 'Unsubscribed', 'subscribe', 'Active', 'fresh execution',
    ['subscribe outer source'], 'Expansion is lazy; projection has not run yet.',
    () => true, () => ({ state: { phase: 'Active', index: 0, active: [], queue: [] }, actions: [{ type: 'subscribe', resource: outer } as A] }));

  add('OUTER-ADMIT', 'Active', 'outer.next', 'Calling', 'capacity available',
    ['emit input first', 'invoke projection with zero-based expansion index'],
    'expand differs from mergeMap: every admitted input is itself emitted before its projection is subscribed.',
    s => s.phase === 'Active' && canAdmit(s),
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'outer.next') throw new Error('invalid expand outer admission'); return call(mem(s), 'Active', e.value); });

  if (concurrent === 1) {
    add('OUTER-QUEUE', 'Active', 'outer.next', 'Active', 'one inner already active',
      ['enqueue input without emitting yet'], 'With concurrency one, saturated inputs wait; expand output is delayed until admission.',
      s => s.phase === 'Active' && s.active.length === 1,
      (s, e) => { if (s.phase !== 'Active' || e.type !== 'outer.next') throw new Error('invalid expand queue'); return { state: { ...s, queue: [...s.queue, e.value] }, actions: [] }; });
  }

  for (const phase of ['Active', 'Draining'] as const) {
    add('INNER-ADMIT-' + phase.toUpperCase(), phase, 'inner.next', 'Calling', 'known inner and expansion capacity available',
      ['emit recursive value', 'feed recursive value into projection'],
      'An inner value becomes a new expansion input; it is not merely forwarded.',
      (s, e) => s.phase === phase && matchingInner(s, e) && canAdmit(s),
      (s, e) => { if (s.phase !== phase || e.type !== 'inner.next') throw new Error('invalid recursive admission'); return call(mem(s), phase, e.value); });
    if (concurrent === 1) {
      add('INNER-QUEUE-' + phase.toUpperCase(), phase, 'inner.next', phase, 'known inner while concurrency slot occupied',
        ['enqueue recursive value without output'], 'At concurrency one the parent inner keeps the slot until completion.',
        (s, e) => s.phase === phase && matchingInner(s, e) && s.active.length === 1,
        (s, e) => { if (s.phase !== phase || e.type !== 'inner.next') throw new Error('invalid recursive queue'); return { state: { ...s, queue: [...s.queue, e.value] }, actions: [] }; });
    }
  }

  add('PROJECT-RETURN', 'Calling', 'callback.return', 'Active', 'correlated projection return while outer open',
    ['subscribe returned inner occurrence'], 'Each successful projection creates one independently identified inner subscription occurrence.',
    (s, e) => s.phase === 'Calling' && s.resume === 'Active' && matchCall(s, e),
    (s) => { if (s.phase !== 'Calling') throw new Error('invalid project return'); const inner = callbackRef('inner', s.callId);
      return { state: { phase: 'Active', ...mem(s), active: [...s.active, inner] }, actions: [{ type: 'subscribe', resource: inner } as A] }; });

  add('PROJECT-RETURN-DRAINING', 'Calling', 'callback.return', 'Draining', 'correlated projection return after outer completion',
    ['subscribe returned inner occurrence'], 'Recursive work remains legal after the original outer has completed.',
    (s, e) => s.phase === 'Calling' && s.resume === 'Draining' && matchCall(s, e),
    (s) => { if (s.phase !== 'Calling') throw new Error('invalid draining return'); const inner = callbackRef('inner', s.callId);
      return { state: { phase: 'Draining', ...mem(s), active: [...s.active, inner] }, actions: [{ type: 'subscribe', resource: inner } as A] }; });

  add('PROJECT-THROW', 'Calling', 'callback.throw', 'Closed', 'correlated projection throws',
    ['error downstream', 'release all owned subscriptions'], 'Projection exceptions terminate expansion immediately.',
    (s, e) => matchCall(s, e) && e.type === 'callback.throw',
    (s, e) => { if (s.phase !== 'Calling' || e.type !== 'callback.throw') throw new Error('invalid project throw'); return { state: closed('project-error'), actions: [error(e.error) as A, ...cleanup(s)] }; });

  for (const phase of ['Active', 'Draining'] as const) {
    add('INNER-COMPLETE-' + phase.toUpperCase(), phase, 'inner.complete', phase, 'known inner completes and no buffered value is waiting',
      ['release completed inner'], 'Completion removes only that inner occurrence; other recursive work remains.',
      (s, e) => s.phase === phase && matchingInner(s, e) && (s.queue.length === 0 || concurrent === 'unbounded'),
      (s, e) => { if (s.phase !== phase || e.type !== 'inner.complete') throw new Error('invalid inner complete');
        const active = s.active.filter(r => !same(r, e.resource));
        if (phase === 'Draining' && active.length === 0 && s.queue.length === 0) return { state: closed('complete'), actions: [{ type: 'unsubscribe', resource: e.resource } as A, complete as A] };
        return { state: { ...s, active }, actions: [{ type: 'unsubscribe', resource: e.resource } as A] }; });

    if (concurrent === 1) {
      add('INNER-DRAIN-' + phase.toUpperCase(), phase, 'inner.complete', 'Calling', 'known inner completes with queued value',
        ['release completed inner', 'emit oldest queued value', 'invoke projection for that value'],
        'The FIFO buffer is drained only after capacity becomes available.',
        (s, e) => s.phase === phase && matchingInner(s, e) && s.queue.length > 0,
        (s, e) => { if (s.phase !== phase || e.type !== 'inner.complete') throw new Error('invalid expand drain');
          const active = s.active.filter(r => !same(r, e.resource));
          const [head, ...tail] = s.queue;
          const begun = call({ index: s.index, active, queue: tail }, phase, head as T);
          return { state: begun.state, actions: [{ type: 'unsubscribe', resource: e.resource } as A, ...begun.actions] }; });
    }

    add('INNER-ERROR-' + phase.toUpperCase(), phase, 'inner.error', 'Closed', 'known inner errors',
      ['forward exact error', 'release outer if open and all active inners'], 'Any admitted recursive inner error is terminal.',
      (s, e) => s.phase === phase && matchingInner(s, e) && e.type === 'inner.error',
      (s, e) => { if (s.phase !== phase || e.type !== 'inner.error') throw new Error('invalid inner error'); return { state: closed('inner-error'), actions: [error(e.error) as A, ...cleanup(s)] }; });
  }

  add('OUTER-COMPLETE', 'Active', 'outer.complete', 'Draining', 'recursive work remains active or queued',
    ['release outer and wait'], 'Outer completion is not completion of expansion while recursive work remains.',
    s => s.phase === 'Active' && (s.active.length > 0 || s.queue.length > 0),
    s => { if (s.phase !== 'Active') throw new Error('invalid outer completion'); return { state: { phase: 'Draining', ...mem(s) }, actions: [{ type: 'unsubscribe', resource: outer } as A] }; });

  add('OUTER-COMPLETE-IDLE', 'Active', 'outer.complete', 'Closed', 'no recursive work remains',
    ['release outer', 'complete downstream'], 'The result completes when outer is done and no recursive work is live or buffered.',
    s => s.phase === 'Active' && s.active.length === 0 && s.queue.length === 0,
    () => ({ state: closed('complete'), actions: [{ type: 'unsubscribe', resource: outer } as A, complete as A] }));

  add('OUTER-ERROR', 'Active', 'outer.error', 'Closed', 'outer errors',
    ['forward exact error', 'release outer and all active inners'], 'Outer error cancels recursive work.',
    s => s.phase === 'Active',
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'outer.error') throw new Error('invalid outer error'); return { state: closed('source-error'), actions: [error(e.error) as A, ...cleanup(s)] }; });

  for (const phase of ['Active', 'Draining'] as const) {
    add('CANCEL-' + phase.toUpperCase(), phase, 'cancel', 'Closed', 'downstream closes',
      ['release owned subscriptions silently'], 'Cancellation drops buffered recursive values and never synthesizes completion.',
      s => s.phase === phase,
      s => { if (s.phase !== phase) throw new Error('invalid cancel'); return { state: closed('cancel'), actions: cleanup(s) }; });
  }
  add('CANCEL-CALLING', 'Calling', 'cancel', 'Closed', 'downstream closes between callback request and outcome',
    ['release owned subscriptions silently'], 'The pending callback outcome is ignored after cancellation in this scoped model.',
    s => s.phase === 'Calling',
    s => { if (s.phase !== 'Calling') throw new Error('invalid calling cancel'); return { state: closed('cancel'), actions: cleanup(s) }; });

  return {
    parameters: p,
    rules,
    metadata: metadata({
      id: 'expand-' + concurrent,
      operator: 'expand',
      purpose: 'Emit each admitted value, project it to an inner Observable, and recursively feed inner values back through the same expansion policy.',
      signature: 'expand : (T! x Index! -> T*) -> T* -> T*',
      conditions: [
        'Every admitted outer or recursive inner value is emitted before its projection is subscribed.',
        concurrent === 1 ? 'Concurrency one queues saturated values FIFO and delays their output until admission.' : 'Unbounded profile admits every value immediately; no expansion queue is formed.',
        'Outer completion waits for all admitted recursive inners and buffered values.',
      ],
      parameters: concurrent === 1 ? 'concurrent=1; scheduler omitted' : 'default unbounded concurrency; scheduler omitted',
      callbacks: 'Projection is external: one correlated project(value,index) invocation per admitted value; modeled returns name Observable source tokens.',
      time: 'No scheduler in the accepted profiles. Source/inner delivery order supplies time.',
      reentrancy: 'Atomic non-reentrant projection outcomes and inner notifications; synchronous setup-time inner emissions are characterized only by native tests, not forced into the pure event model.',
      exclusions: ['Deprecated scheduler argument, arbitrary ObservableInput conversion, concurrency values other than 1 or unbounded.',
        'Projection/observer/finalizer reentrancy and cancellation inside notification delivery.'],
      resources: [
        { id: 'outer', kind: 'subscription', owner: 'current result subscription' },
        { id: 'inner', kind: 'subscription', owner: 'one occurrence per admitted projection' },
        { id: 'project', kind: 'callback', owner: 'correlated projection invocation' },
      ],
      inputs: expandInputs,
      actionTypes: ['subscribe', 'unsubscribe', 'invoke-callback', 'notify'],
      controls: controls([
        { id: 'Draining', description: 'outer completed; recursive inner work remains', terminal: false },
        { id: 'Calling', description: 'one projection outcome is pending', terminal: false },
      ]),
      paths: ['src/internal/operators/expand.ts', 'src/internal/operators/mergeInternals.ts', 'src/internal/operators/OperatorSubscriber.ts'],
      initialization: 'Acquire only the original outer source; recursive inner subscriptions arise from admitted projection returns.',
    }),
    initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => {
      const errors: string[] = [];
      if ((s.phase === 'Active' || s.phase === 'Draining' || s.phase === 'Calling') && (!natural(s.index) || s.index > Number.MAX_SAFE_INTEGER)) errors.push('invalid expansion index');
      if ((s.phase === 'Active' || s.phase === 'Draining' || s.phase === 'Calling') && new Set(s.active.map(r => r.generation)).size !== s.active.length) errors.push('duplicate inner generation');
      if ((s.phase === 'Active' || s.phase === 'Draining' || s.phase === 'Calling') && concurrent === 1 && s.active.length > 1) errors.push('concurrency one exceeded');
      return errors;
    },
    validateReaction: (_s, _e, out) => actionErrors(out.actions),
  };
}

export const expandExample: readonly TimedEvent<ExpandEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'outer.next', value: 1 } },
  { time: 1, event: { type: 'callback.return', resource: callbackRef('project', 0), value: 'inner-0' } },
  { time: 2, event: { type: 'inner.next', resource: callbackRef('inner', 0), value: 2 } },
  { time: 2, event: { type: 'callback.return', resource: callbackRef('project', 1), value: 'inner-1' } },
  { time: 3, event: { type: 'outer.complete' } },
  { time: 4, event: { type: 'inner.complete', resource: callbackRef('inner', 0) } },
  { time: 5, event: { type: 'inner.complete', resource: callbackRef('inner', 1) } },
];

/* finalize: pass source notifications unchanged; invoke teardown callback exactly once after terminal teardown or explicit cancellation. */
export type FinalizeParameters = Readonly<{ callbackId: 'finalize' }>;
export type FinalizeState =
  | Readonly<{ phase: 'Unsubscribed' | 'Active' }>
  | Readonly<{ phase: 'Closed'; reason: CloseReason }>;
export type FinalizeEvent<T> = SourceEvent<T>;
export type FinalizeModel<T> = OperatorModel<FinalizeParameters, FinalizeState, FinalizeEvent<T>, Action<T, undefined>>;

export function createFinalizeModel<T>(): FinalizeModel<T> {
  type S = FinalizeState; type E = FinalizeEvent<T>; type A = Action<T, undefined>;
  const invoke: A = { type: 'invoke-callback', resource: callbackRef('finalize', 0), value: undefined, index: 0 };
  const rules: Rule<FinalizeParameters, S, E, A>[] = [
    { description: desc('finalize', 'INIT', 'Unsubscribed', 'subscribe', 'Active', 'fresh execution',
        ['subscribe source'], 'The finalizer is registered for this result subscription.'),
      enabled: () => true, react: () => ({ state: { phase: 'Active' }, actions: [subscribe(source) as A] }) },
    { description: desc('finalize', 'PASS', 'Active', 'source.next', 'Active', 'source live',
        ['forward exact value'], 'finalize never transforms next values.'),
      enabled: () => true, react: (_s, e) => { if (e.type !== 'source.next') throw new Error('invalid finalize value'); return { state: { phase: 'Active' }, actions: [next(e.value) as A] }; } },
    { description: desc('finalize', 'COMPLETE', 'Active', 'source.complete', 'Closed', 'source completes',
        ['complete downstream', 'release source', 'invoke finalizer once'], 'The callback runs as teardown after terminal notification.'),
      enabled: () => true, react: () => ({ state: closed('complete'), actions: [complete as A, unsubscribe(source) as A, invoke] }) },
    { description: desc('finalize', 'ERROR', 'Active', 'source.error', 'Closed', 'source errors',
        ['error downstream', 'release source', 'invoke finalizer once'], 'Error identity is preserved; the finalizer still runs.'),
      enabled: () => true, react: (_s, e) => { if (e.type !== 'source.error') throw new Error('invalid finalize error'); return { state: closed('source-error'), actions: [error(e.error) as A, unsubscribe(source) as A, invoke] }; } },
    { description: desc('finalize', 'CANCEL', 'Active', 'cancel', 'Closed', 'explicit unsubscribe',
        ['release source', 'invoke finalizer once'], 'Explicit cancellation is silent downstream but still executes the finalizer.'),
      enabled: () => true, react: () => ({ state: closed('cancel'), actions: [unsubscribe(source) as A, invoke] }) },
  ];
  return {
    parameters: { callbackId: 'finalize' },
    rules,
    metadata: metadata({
      id: 'finalize-teardown-callback',
      operator: 'finalize',
      purpose: 'Mirror the source exactly and invoke a zero-argument teardown callback once on complete, error, or explicit unsubscribe.',
      signature: 'finalize : (() -> Unit) -> T* -> T*',
      conditions: ['All next values and terminal notifications retain source identity/order.', 'The callback itself contributes no stream value and its return value is ignored.'],
      parameters: 'One zero-argument callback; no other options.',
      callbacks: 'The finalizer is represented as an invoke-callback action with no meaningful input value; callback return is not a stream event.',
      time: 'No scheduler or timer. Finalization is part of subscription teardown ordering.',
      reentrancy: 'The pure model treats finalizer invocation as an atomic teardown action and excludes callback reentry/throws.',
      exclusions: ['Throwing finalizer behavior, nested unsubscription from observer handlers, deprecated synchronous error handling details.'],
      resources: [
        { id: 'source', kind: 'subscription', owner: 'current result subscription' },
        { id: 'finalize', kind: 'callback', owner: 'registered teardown callback for this result subscription' },
      ],
      inputs: baseInputs,
      actionTypes: ['subscribe', 'unsubscribe', 'invoke-callback', 'notify'],
      controls: controls(),
      paths: ['src/internal/operators/finalize.ts', 'src/internal/Subscriber.ts', 'src/internal/Subscription.ts'],
    }),
    initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => ['Unsubscribed', 'Active', 'Closed'].includes(s.phase) ? [] : ['invalid finalize phase'],
    validateReaction: (_s, _e, out) => actionErrors(out.actions),
  };
}

export const finalizeExample: readonly TimedEvent<FinalizeEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 1 } },
  { time: 2, event: { type: 'source.complete' } },
];

/* Shared first-match predicate state for find, findIndex and predicate-enabled first. */
type SearchState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; index: number }>
  | Readonly<{ phase: 'Calling'; index: number; value: T }>
  | Readonly<{ phase: 'Closed'; reason: CloseReason }>;
type SearchEvent<T> = SourceEvent<T>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; value: unknown }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>;
const predicateInputs: readonly InputDescriptor[] = [
  ...baseInputs,
  { type: 'callback.return', origin: 'callback', category: 'callback', description: 'correlated predicate returns a truthy/falsy result' },
  { type: 'callback.throw', origin: 'callback', category: 'callback', description: 'correlated predicate throws' },
];
const matchPredicate = <T>(s: SearchState<T>, e: SearchEvent<T>): boolean =>
  s.phase === 'Calling' && (e.type === 'callback.return' || e.type === 'callback.throw') &&
  same(e.resource, callbackRef('predicate', s.index));

export type FindParameters = Readonly<{ predicateId: 'predicate'; notFound: 'undefined' }>;
export type FindState<T> = SearchState<T>;
export type FindEvent<T> = SearchEvent<T>;
export type FindModel<T> = OperatorModel<FindParameters, FindState<T>, FindEvent<T>, Action<T | undefined, T>>;

export function createFindModel<T>(): FindModel<T> {
  type S = FindState<T>; type E = FindEvent<T>; type A = Action<T | undefined, T>;
  const rules: Rule<FindParameters, S, E, A>[] = [
    { description: desc('find', 'INIT', 'Unsubscribed', 'subscribe', 'Active', 'fresh execution',
        ['subscribe source with predicate index zero'], 'find evaluates each source value until the first match.'),
      enabled: () => true, react: () => ({ state: { phase: 'Active', index: 0 }, actions: [subscribe(source) as A] }) },
    { description: desc('find', 'CALL', 'Active', 'source.next', 'Calling', 'valid zero-based index',
        ['invoke predicate with original value/index'], 'The pure model requests predicate outcome without executing user logic.'),
      enabled: s => s.phase === 'Active' && natural(s.index) && s.index < Number.MAX_SAFE_INTEGER,
      react: (s, e) => { if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid find call'); return {
        state: { phase: 'Calling', index: s.index, value: e.value },
        actions: [{ type: 'invoke-callback', resource: callbackRef('predicate', s.index), value: e.value, index: s.index } as A],
      }; } },
    { description: desc('find', 'MATCH', 'Calling', 'callback.return', 'Closed', 'correlated truthy result',
        ['emit original matched value', 'complete', 'release source'], 'The predicate result is control; the original input value is the output.'),
      enabled: (s, e) => matchPredicate(s, e) && e.type === 'callback.return' && Boolean(e.value),
      react: s => { if (s.phase !== 'Calling') throw new Error('invalid find match'); return { state: closed('complete'), actions: [next(s.value) as A, complete as A, unsubscribe(source) as A] }; } },
    { description: desc('find', 'MISS', 'Calling', 'callback.return', 'Active', 'correlated falsy result',
        ['advance predicate index silently'], 'Rejected values are not retained.'),
      enabled: (s, e) => matchPredicate(s, e) && e.type === 'callback.return' && !Boolean(e.value),
      react: s => { if (s.phase !== 'Calling') throw new Error('invalid find miss'); return { state: { phase: 'Active', index: s.index + 1 }, actions: [] }; } },
    { description: desc('find', 'THROW', 'Calling', 'callback.throw', 'Closed', 'correlated predicate throw',
        ['error downstream', 'release source'], 'Predicate throws are terminal errors, not a failed match.'),
      enabled: (s, e) => matchPredicate(s, e) && e.type === 'callback.throw',
      react: (_s, e) => { if (e.type !== 'callback.throw') throw new Error('invalid find throw'); return { state: closed('predicate-error'), actions: [error(e.error) as A, unsubscribe(source) as A] }; } },
    { description: desc('find', 'NOT-FOUND', 'Active', 'source.complete', 'Closed', 'no value matched',
        ['emit undefined', 'complete', 'release source'], 'Unlike first, find succeeds with undefined when no match exists.'),
      enabled: () => true, react: () => ({ state: closed('complete'), actions: [next(undefined) as A, complete as A, unsubscribe(source) as A] }) },
    { description: desc('find', 'SOURCE-ERROR', 'Active', 'source.error', 'Closed', 'source errors',
        ['forward exact error', 'release source'], 'Source error suppresses the not-found value.'),
      enabled: () => true, react: (_s, e) => { if (e.type !== 'source.error') throw new Error('invalid find source error'); return { state: closed('source-error'), actions: [error(e.error) as A, unsubscribe(source) as A] }; } },
    { description: desc('find', 'CANCEL', 'Active', 'cancel', 'Closed', 'downstream closes',
        ['release source silently'], 'Cancellation emits neither undefined nor completion.'),
      enabled: () => true, react: () => ({ state: closed('cancel'), actions: [unsubscribe(source) as A] }) },
  ];
  return {
    parameters: { predicateId: 'predicate', notFound: 'undefined' }, rules,
    metadata: metadata({
      id: 'find-first-match',
      operator: 'find',
      purpose: 'Emit the first source value whose indexed predicate is truthy; emit undefined if the source completes without a match.',
      signature: 'find : (T! x Index! -> Boolean!) -> T* -> T?',
      conditions: ['At most one source value is emitted; a finite no-match source emits one undefined value then completes.', 'First truthy result short-circuits source work.'],
      parameters: 'Required predicate; deprecated thisArg and BooleanConstructor specialization excluded from the canonical profile.',
      callbacks: 'One correlated predicate(value,index,source) outcome per tested value; source object identity is runtime-tested separately.',
      time: 'No timer; source order determines predicate index and first-match selection.',
      reentrancy: 'One pending predicate outcome at a time; source events during Calling are outside the non-reentrant profile.',
      exclusions: ['Deprecated thisArg overload, arbitrary predicate reentry, observer/finalizer exceptions.'],
      resources: [{ id: 'source', kind: 'subscription', owner: 'current result subscription' }, { id: 'predicate', kind: 'callback', owner: 'one invocation per tested source value' }],
      inputs: predicateInputs, actionTypes: ['subscribe', 'unsubscribe', 'invoke-callback', 'notify'],
      controls: controls([{ id: 'Calling', description: 'one predicate outcome is pending', terminal: false }]),
      paths: ['src/internal/operators/find.ts', 'src/internal/operators/OperatorSubscriber.ts'],
    }),
    initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => (s.phase === 'Active' || s.phase === 'Calling') && !natural(s.index) ? ['invalid find index'] : [],
    validateReaction: (_s, e, out) => {
      const errors = [...actionErrors(out.actions)];
      if (e.type === 'source.next') {
        const emitted = out.actions.find(a => a.type === 'notify' && a.notification.kind === 'N');
        if (emitted && emitted.type === 'notify' && emitted.notification.kind === 'N' && emitted.notification.value !== undefined && !Object.is(emitted.notification.value, e.value)) errors.push('find changed payload identity');
      }
      return errors;
    },
  };
}

export const findExample: readonly TimedEvent<FindEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 1 } },
  { time: 1, event: { type: 'callback.return', resource: callbackRef('predicate', 0), value: false } },
  { time: 2, event: { type: 'source.next', value: 2 } },
  { time: 2, event: { type: 'callback.return', resource: callbackRef('predicate', 1), value: true } },
];

export type FindIndexParameters = Readonly<{ predicateId: 'predicate'; notFound: -1 }>;
export type FindIndexState<T> = SearchState<T>;
export type FindIndexEvent<T> = SearchEvent<T>;
export type FindIndexModel<T> = OperatorModel<FindIndexParameters, FindIndexState<T>, FindIndexEvent<T>, Action<number, T>>;

export function createFindIndexModel<T>(): FindIndexModel<T> {
  type S = FindIndexState<T>; type E = FindIndexEvent<T>; type A = Action<number, T>;
  const rules: Rule<FindIndexParameters, S, E, A>[] = [
    { description: desc('findIndex', 'INIT', 'Unsubscribed', 'subscribe', 'Active', 'fresh execution',
        ['subscribe source with index zero'], 'findIndex evaluates source values in order.'),
      enabled: () => true, react: () => ({ state: { phase: 'Active', index: 0 }, actions: [subscribe(source) as A] }) },
    { description: desc('findIndex', 'CALL', 'Active', 'source.next', 'Calling', 'valid zero-based index',
        ['invoke predicate'], 'Predicate receives original value and current source index.'),
      enabled: s => s.phase === 'Active' && natural(s.index) && s.index < Number.MAX_SAFE_INTEGER,
      react: (s, e) => { if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid findIndex call'); return {
        state: { phase: 'Calling', index: s.index, value: e.value },
        actions: [{ type: 'invoke-callback', resource: callbackRef('predicate', s.index), value: e.value, index: s.index } as A],
      }; } },
    { description: desc('findIndex', 'MATCH', 'Calling', 'callback.return', 'Closed', 'correlated truthy result',
        ['emit current index', 'complete', 'release source'], 'The output is the zero-based position of the first matching value.'),
      enabled: (s, e) => matchPredicate(s, e) && e.type === 'callback.return' && Boolean(e.value),
      react: s => { if (s.phase !== 'Calling') throw new Error('invalid findIndex match'); return { state: closed('complete'), actions: [next(s.index) as A, complete as A, unsubscribe(source) as A] }; } },
    { description: desc('findIndex', 'MISS', 'Calling', 'callback.return', 'Active', 'correlated falsy result',
        ['advance index silently'], 'A rejected value consumes its index.'),
      enabled: (s, e) => matchPredicate(s, e) && e.type === 'callback.return' && !Boolean(e.value),
      react: s => { if (s.phase !== 'Calling') throw new Error('invalid findIndex miss'); return { state: { phase: 'Active', index: s.index + 1 }, actions: [] }; } },
    { description: desc('findIndex', 'THROW', 'Calling', 'callback.throw', 'Closed', 'correlated predicate throw',
        ['error downstream', 'release source'], 'Predicate errors do not become -1.'),
      enabled: (s, e) => matchPredicate(s, e) && e.type === 'callback.throw',
      react: (_s, e) => { if (e.type !== 'callback.throw') throw new Error('invalid findIndex throw'); return { state: closed('predicate-error'), actions: [error(e.error) as A, unsubscribe(source) as A] }; } },
    { description: desc('findIndex', 'NOT-FOUND', 'Active', 'source.complete', 'Closed', 'no value matched',
        ['emit -1', 'complete', 'release source'], 'No match is a successful -1 result, not an error.'),
      enabled: () => true, react: () => ({ state: closed('complete'), actions: [next(-1) as A, complete as A, unsubscribe(source) as A] }) },
    { description: desc('findIndex', 'SOURCE-ERROR', 'Active', 'source.error', 'Closed', 'source errors',
        ['forward exact error', 'release source'], 'Source error suppresses -1.'),
      enabled: () => true, react: (_s, e) => { if (e.type !== 'source.error') throw new Error('invalid findIndex source error'); return { state: closed('source-error'), actions: [error(e.error) as A, unsubscribe(source) as A] }; } },
    { description: desc('findIndex', 'CANCEL', 'Active', 'cancel', 'Closed', 'downstream closes',
        ['release source silently'], 'Cancellation emits no sentinel.'),
      enabled: () => true, react: () => ({ state: closed('cancel'), actions: [unsubscribe(source) as A] }) },
  ];
  return {
    parameters: { predicateId: 'predicate', notFound: -1 }, rules,
    metadata: metadata({
      id: 'findIndex-first-match',
      operator: 'findIndex',
      purpose: 'Emit the zero-based index of the first source value whose predicate is truthy; emit -1 if no match exists.',
      signature: 'findIndex : (T! x Index! -> Boolean!) -> T* -> Number!',
      conditions: ['Finite successful execution emits exactly one integer: first matching index or -1.', 'First truthy result short-circuits source work.'],
      parameters: 'Required predicate; deprecated thisArg and BooleanConstructor specialization excluded.',
      callbacks: 'One correlated predicate outcome per tested value.',
      time: 'No timer; source order defines index.',
      reentrancy: 'One pending predicate result at a time.',
      exclusions: ['Deprecated thisArg overload, callback reentry, observer/finalizer exceptions.'],
      resources: [{ id: 'source', kind: 'subscription', owner: 'current result subscription' }, { id: 'predicate', kind: 'callback', owner: 'one invocation per tested value' }],
      inputs: predicateInputs, actionTypes: ['subscribe', 'unsubscribe', 'invoke-callback', 'notify'],
      controls: controls([{ id: 'Calling', description: 'one predicate outcome is pending', terminal: false }]),
      paths: ['src/internal/operators/findIndex.ts', 'src/internal/operators/find.ts', 'src/internal/operators/OperatorSubscriber.ts'],
    }),
    initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => (s.phase === 'Active' || s.phase === 'Calling') && !natural(s.index) ? ['invalid findIndex index'] : [],
    validateReaction: (_s, _e, out) => actionErrors(out.actions),
  };
}

export const findIndexExample: readonly TimedEvent<FindIndexEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 4 } },
  { time: 1, event: { type: 'callback.return', resource: callbackRef('predicate', 0), value: false } },
  { time: 2, event: { type: 'source.next', value: 8 } },
  { time: 2, event: { type: 'callback.return', resource: callbackRef('predicate', 1), value: true } },
];

export type FirstParameters<D> = Readonly<{ predicate: boolean; hasDefault: boolean; defaultValue: D; predicateId: 'predicate' }>;
export type FirstState<T> = SearchState<T>;
export type FirstEvent<T> = SearchEvent<T>;
export type FirstModel<T, D = T> = OperatorModel<FirstParameters<D>, FirstState<T>, FirstEvent<T>, Action<T | D, T>>;

export function createFirstModel<T, D = T>(withPredicate = false, defaultValue?: D): FirstModel<T, D> {
  const hasDefault = arguments.length >= 2;
  const p: FirstParameters<D> = { predicate: withPredicate, hasDefault, defaultValue: defaultValue as D, predicateId: 'predicate' };
  type S = FirstState<T>; type E = FirstEvent<T>; type A = Action<T | D, T>;
  const emptyError = () => Object.assign(new Error('no elements in sequence'), { name: 'EmptyError' });
  const rules: Rule<FirstParameters<D>, S, E, A>[] = [
    { description: desc('first', 'INIT', 'Unsubscribed', 'subscribe', 'Active', 'fresh execution',
        ['subscribe source'], 'First waits for the first admissible value.'),
      enabled: () => true, react: () => ({ state: { phase: 'Active', index: 0 }, actions: [subscribe(source) as A] }) },
    { description: desc('first', 'DIRECT', 'Active', 'source.next', 'Closed', 'predicate omitted',
        ['emit first source value', 'complete', 'release source'], 'Without a predicate, the first source value terminates immediately.'),
      enabled: (_s, _e, q) => !q.predicate,
      react: (_s, e) => { if (e.type !== 'source.next') throw new Error('invalid first direct'); return { state: closed('complete'), actions: [next(e.value) as A, complete as A, unsubscribe(source) as A] }; } },
    { description: desc('first', 'CALL', 'Active', 'source.next', 'Calling', 'predicate supplied and index valid',
        ['invoke predicate'], 'With a predicate, first tests values until the first truthy result.'),
      enabled: (s, _e, q) => q.predicate && s.phase === 'Active' && natural(s.index) && s.index < Number.MAX_SAFE_INTEGER,
      react: (s, e) => { if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid first call'); return {
        state: { phase: 'Calling', index: s.index, value: e.value },
        actions: [{ type: 'invoke-callback', resource: callbackRef('predicate', s.index), value: e.value, index: s.index } as A],
      }; } },
    { description: desc('first', 'MATCH', 'Calling', 'callback.return', 'Closed', 'correlated truthy predicate result',
        ['emit original matched value', 'complete', 'release source'], 'The first matching source value is forwarded unchanged.'),
      enabled: (s, e, q) => q.predicate && matchPredicate(s, e) && e.type === 'callback.return' && Boolean(e.value),
      react: s => { if (s.phase !== 'Calling') throw new Error('invalid first match'); return { state: closed('complete'), actions: [next(s.value) as A, complete as A, unsubscribe(source) as A] }; } },
    { description: desc('first', 'MISS', 'Calling', 'callback.return', 'Active', 'correlated falsy predicate result',
        ['advance predicate index silently'], 'Rejected values are skipped but consume their source index.'),
      enabled: (s, e, q) => q.predicate && matchPredicate(s, e) && e.type === 'callback.return' && !Boolean(e.value),
      react: s => { if (s.phase !== 'Calling') throw new Error('invalid first miss'); return { state: { phase: 'Active', index: s.index + 1 }, actions: [] }; } },
    { description: desc('first', 'THROW', 'Calling', 'callback.throw', 'Closed', 'correlated predicate throw',
        ['error downstream', 'release source'], 'Predicate exceptions remain errors.'),
      enabled: (s, e, q) => q.predicate && matchPredicate(s, e) && e.type === 'callback.throw',
      react: (_s, e) => { if (e.type !== 'callback.throw') throw new Error('invalid first throw'); return { state: closed('predicate-error'), actions: [error(e.error) as A, unsubscribe(source) as A] }; } },
    { description: desc('first', 'EMPTY-DEFAULT', 'Active', 'source.complete', 'Closed', 'no admissible value and explicit default supplied',
        ['emit default', 'complete', 'release source'], 'Explicit undefined is still a supplied default when argument two exists.'),
      enabled: (_s, _e, q) => q.hasDefault,
      react: (_s, _e, q) => ({ state: closed('complete'), actions: [next(q.defaultValue) as A, complete as A, unsubscribe(source) as A] }) },
    { description: desc('first', 'EMPTY-ERROR', 'Active', 'source.complete', 'Closed', 'no admissible value and no default',
        ['error with EmptyError', 'release source'], 'Unlike find, first has an error policy for no matching value unless a default was supplied.'),
      enabled: (_s, _e, q) => !q.hasDefault,
      react: () => ({ state: closed('empty'), actions: [error(emptyError()) as A, unsubscribe(source) as A] }) },
    { description: desc('first', 'SOURCE-ERROR', 'Active', 'source.error', 'Closed', 'source errors',
        ['forward exact error', 'release source'], 'Source failure suppresses default and EmptyError synthesis.'),
      enabled: () => true, react: (_s, e) => { if (e.type !== 'source.error') throw new Error('invalid first source error'); return { state: closed('source-error'), actions: [error(e.error) as A, unsubscribe(source) as A] }; } },
    { description: desc('first', 'CANCEL', 'Active', 'cancel', 'Closed', 'downstream closes',
        ['release source silently'], 'Cancellation emits no default and no EmptyError.'),
      enabled: () => true, react: () => ({ state: closed('cancel'), actions: [unsubscribe(source) as A] }) },
  ];
  return {
    parameters: p, rules,
    metadata: metadata({
      id: 'first-' + (withPredicate ? 'predicate' : 'direct') + (hasDefault ? '-default' : '-required'),
      operator: 'first',
      purpose: 'Emit the first source value, or first predicate match; on successful exhaustion emit an explicit default or error with EmptyError.',
      signature: 'first(P?,D?) : T* -> (T|D)?',
      conditions: ['At most one next value is emitted.', 'Predicate mode short-circuits on first truthy result; direct mode short-circuits on first source value.'],
      parameters: (withPredicate ? 'predicate supplied' : 'predicate omitted') + '; ' + (hasDefault ? 'explicit default supplied' : 'no default supplied'),
      callbacks: withPredicate ? 'One correlated predicate outcome per tested value.' : 'No predicate callback in this profile.',
      time: 'No timer; first admissible source position controls output.',
      reentrancy: withPredicate ? 'One pending predicate outcome at a time.' : 'Direct source next is handled atomically.',
      exclusions: ['Type-guard/BooleanConstructor specialization, deprecated overload nuances, callback/observer/finalizer reentry.'],
      resources: [
        { id: 'source', kind: 'subscription', owner: 'current result subscription' },
        { id: 'predicate', kind: 'callback', owner: 'present only when predicate profile is selected' },
      ],
      inputs: predicateInputs,
      actionTypes: ['subscribe', 'unsubscribe', 'invoke-callback', 'notify'],
      controls: controls([{ id: 'Calling', description: 'predicate outcome pending in predicate profile', terminal: false }]),
      paths: ['src/internal/operators/first.ts', 'src/internal/operators/filter.ts', 'src/internal/operators/take.ts', 'src/internal/operators/defaultIfEmpty.ts', 'src/internal/operators/throwIfEmpty.ts'],
    }),
    initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => (s.phase === 'Active' || s.phase === 'Calling') && !natural(s.index) ? ['invalid first index'] : [],
    validateReaction: (_s, _e, out) => actionErrors(out.actions),
  };
}

export const firstExample: readonly TimedEvent<FirstEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 1 } },
  { time: 1, event: { type: 'callback.return', resource: callbackRef('predicate', 0), value: false } },
  { time: 2, event: { type: 'source.next', value: 3 } },
  { time: 2, event: { type: 'callback.return', resource: callbackRef('predicate', 1), value: true } },
];
