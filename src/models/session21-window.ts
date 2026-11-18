import type { Action, Notification, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { acquire, emit, failWith, finish, namedRule, natural, release, sessionMetadata, sourceRef } from './session21-common.js';

/** Tokens name emitted Observable handles; they are not Observable implementations. */
export type WindowToken = Readonly<{ windowId: number }>;
export type WindowRecord = Readonly<{ windowId: number; status: 'open' | 'complete' | 'invalid' }>;
export type WindowConsumer = Readonly<{ observerId: string; windowId: number }>;
export type WindowParameters = Readonly<{
  boundaries: 'Observable'; consumerAccess: 'Observable-only'; sourceSetup: 'post-setup';
}>;
export type WindowMemory = Readonly<{
  current: number; boundaryLive: boolean; windows: readonly WindowRecord[];
  consumers: readonly WindowConsumer[]; usedObservers: readonly string[];
}>;
export type WindowState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (WindowMemory & Readonly<{ phase: 'Active' }>)
  | (WindowMemory & Readonly<{ phase: 'Stopped'; reason: 'complete' | 'error' | 'cancel' }>);
export type WindowEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' | 'boundary.next' | 'boundary.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error' | 'boundary.error'; error: unknown }>
  | Readonly<{ type: 'window.subscribe'; windowId: number; observerId: string }>
  | Readonly<{ type: 'window.unsubscribe'; observerId: string }>;
export type WindowModel<T> = OperatorModel<WindowParameters, WindowState, WindowEvent<T>, Action<unknown>>;

const boundaryRef: ResourceRef = { id: 'boundary', generation: 0 };
const consumerRef = (id: string): ResourceRef => ({ id: 'windowObserver:' + id, generation: 0 });
const deliver = (id: string, notification: Notification<unknown>): Action<unknown> =>
  ({ type: 'notify', target: 'windowObserver:' + id, notification });
const present = (s: WindowState): s is Exclude<WindowState, { phase: 'Unsubscribed' }> => s.phase !== 'Unsubscribed';
const freshObserver = (s: WindowMemory, id: string): boolean => typeof id === 'string' && id.trim().length > 0 && !s.usedObservers.includes(id);
const windowStatus = (s: WindowMemory, id: number): WindowRecord['status'] | undefined =>
  natural(id) ? s.windows.find(w => w.windowId === id)?.status : undefined;
const terminateConsumers = (s: WindowMemory, notification: Notification<never>): readonly Action<unknown>[] =>
  s.consumers.flatMap(c => [deliver(c.observerId, notification), release(consumerRef(c.observerId))]);
const releaseInputs = (s: WindowMemory): readonly Action<unknown>[] =>
  [release(sourceRef), ...(s.boundaryLive ? [release(boundaryRef)] : [])];
const invalidated = (s: WindowMemory): readonly WindowRecord[] =>
  s.windows.map(w => w.windowId === s.current ? { ...w, status: 'invalid' as const } : w);

/**
 * Extended observation model: Stopped means the outer/source execution ended.
 * Completed historical handles and orphaned consumer subscriptions remain observable.
 */
export function createWindowModel<T>(): WindowModel<T> {
  type S = WindowState; type E = WindowEvent<T>;
  const rule = namedRule<WindowParameters, S, E>;
  const rules: Rule<WindowParameters, S, E, Action<unknown>>[] = [
    rule('window', 'START', 'Unsubscribed', 'subscribe', 'Active', 'first result connection',
      ['emit initial window handle', 'acquire source', 'acquire boundary Observable'],
      'Window zero is open; both inputs are owned; no window consumer is attached yet.',
      'The initial window precedes either input subscription. Subsequent modeled events begin after setup returns.',
      () => true,
      () => ({ state: { phase: 'Active', current: 0, boundaryLive: true, windows: [{ windowId: 0, status: 'open' }], consumers: [], usedObservers: [] },
        actions: [emit({ windowId: 0 }), acquire(sourceRef), acquire(boundaryRef)] })),
    rule('window', 'SOURCE-NEXT', 'Active', 'source.next', 'Active', 'source is live',
      ['deliver original value to current window consumers in attachment order'],
      'The same window remains open; values are not buffered or retained for late consumers.',
      'A window is a live multicast stream. Source values sent before an observer attaches are not replayed.',
      s => s.phase === 'Active',
      (s, e) => { if (s.phase !== 'Active' || e.type !== 'source.next') throw Error('expected active source value');
        return { state: s, actions: s.consumers.map(c => deliver(c.observerId, { kind: 'N', value: e.value })) }; }),
    rule('window', 'BOUNDARY-NEXT', 'Active', 'boundary.next', 'Active', 'boundary is live and next window identity is a safe integer',
      ['complete each current consumer and release its subscription', 'emit next window handle'],
      'Previous window remains a completed historical handle; a new empty current window has no consumers.',
      'Every boundary next rotates the window, even if no source value arrived. Boundary payloads are ignored.',
      s => s.phase === 'Active' && s.boundaryLive && s.current < Number.MAX_SAFE_INTEGER,
      s => { if (s.phase !== 'Active') throw Error('expected active boundary');
        const current = s.current + 1;
        return { state: { ...s, current, consumers: [], windows: [...s.windows.map(w => ({ ...w, status: 'complete' as const })), { windowId: current, status: 'open' }] },
          actions: [...terminateConsumers(s, { kind: 'C' }), emit({ windowId: current })] }; }),
    rule('window', 'BOUNDARY-COMPLETE', 'Active', 'boundary.complete', 'Active', 'boundary is live',
      ['release boundary input only'], 'Current window and source remain live; no further boundary events are legal.',
      'Boundary completion is a no-op for window/result notifications. It does not close the current window.',
      s => s.phase === 'Active' && s.boundaryLive,
      s => { if (s.phase !== 'Active') throw Error('expected active boundary completion');
        return { state: { ...s, boundaryLive: false }, actions: [release(boundaryRef)] }; }),
    rule('window', 'SOURCE-COMPLETE', 'Active', 'source.complete', 'Stopped', 'source completes successfully',
      ['complete current consumers and release their subscriptions', 'complete outer result', 'release source and any live boundary', 'invalidate current handle during operator teardown'],
      'Outer execution stopped; older rotated handles remain completed; current handle is invalidated.',
      'Current-window completion precedes outer completion. Final operator teardown unsubscribes the current Subject itself.',
      s => s.phase === 'Active',
      s => { if (s.phase !== 'Active') throw Error('expected source completion');
        return { state: { ...s, phase: 'Stopped', reason: 'complete', boundaryLive: false, windows: invalidated(s), consumers: [] },
          actions: [...terminateConsumers(s, { kind: 'C' }), finish, ...releaseInputs(s)] }; }),
    ...(['source.error', 'boundary.error'] as const).map(type => rule('window', type === 'source.error' ? 'SOURCE-ERROR' : 'BOUNDARY-ERROR', 'Active', type, 'Stopped',
      type === 'source.error' ? 'source is live' : 'boundary is live',
      ['error current consumers and release their subscriptions', 'error outer result with identical payload', 'release source and any live boundary', 'invalidate current handle'],
      'Outer execution stopped with error; older completed handles are unchanged.',
      'Both input failures reach current-window consumers before the outer observer. The error payload is never replaced.',
      s => s.phase === 'Active' && (type === 'source.error' || s.boundaryLive),
      (s, e) => { if (s.phase !== 'Active' || (e.type !== 'source.error' && e.type !== 'boundary.error')) throw Error('expected input error');
        return { state: { ...s, phase: 'Stopped', reason: 'error', boundaryLive: false, windows: invalidated(s), consumers: [] },
          actions: [...terminateConsumers(s, { kind: 'E', error: e.error }), failWith(e.error), ...releaseInputs(s)] }; })),
    rule('window', 'CANCEL', 'Active', 'cancel', 'Stopped', 'outer consumer cancels the result',
      ['release source and any live boundary', 'invalidate current handle without notifying or closing existing consumer subscriptions'],
      'Outer execution stopped; its current consumers are orphaned until they unsubscribe themselves.',
      'Subject.unsubscribe is not Subject.complete. Window consumers do not hold a lease that preserves the original source.',
      s => s.phase === 'Active',
      s => { if (s.phase !== 'Active') throw Error('expected active cancellation');
        return { state: { ...s, phase: 'Stopped', reason: 'cancel', boundaryLive: false, windows: invalidated(s) }, actions: releaseInputs(s) }; }),
    rule('window', 'OBSERVER-LIVE', 'Active', 'window.subscribe', 'Active', 'fresh observer identity names the current open window',
      ['acquire addressed window-consumer subscription; replay nothing'],
      'Observer joins the current multicast window after existing consumers.',
      'Attaching a window observer does not acquire another source or boundary subscription.',
      (s, e) => s.phase === 'Active' && e.type === 'window.subscribe' && freshObserver(s, e.observerId) && windowStatus(s, e.windowId) === 'open',
      (s, e) => { if (s.phase !== 'Active' || e.type !== 'window.subscribe') throw Error('expected live observer');
        return { state: { ...s, consumers: [...s.consumers, { observerId: e.observerId, windowId: e.windowId }], usedObservers: [...s.usedObservers, e.observerId] },
          actions: [acquire(consumerRef(e.observerId))] }; }),
  ];
  for (const phase of ['Active', 'Stopped'] as const) {
    rules.push(rule('window', 'OBSERVER-COMPLETE-' + phase.toUpperCase(), phase, 'window.subscribe', phase,
      'fresh observer identity names a previously rotated completed handle',
      ['attempt addressed window subscription', 'complete observer immediately', 'release its subscription'],
      'No active consumer or source lease is added; observer identity is recorded as used.',
      'Retired completed windows remember completion but never replay values. The final current handle is separately invalidated and excluded from this legal event.',
      (s, e) => present(s) && e.type === 'window.subscribe' && freshObserver(s, e.observerId) && windowStatus(s, e.windowId) === 'complete',
      (s, e) => { if (!present(s) || e.type !== 'window.subscribe') throw Error('expected completed-handle observer');
        return { state: { ...s, usedObservers: [...s.usedObservers, e.observerId] },
          actions: [acquire(consumerRef(e.observerId)), deliver(e.observerId, { kind: 'C' }), release(consumerRef(e.observerId))] }; }));
    rules.push(rule('window', 'OBSERVER-UNSUBSCRIBE-' + phase.toUpperCase(), phase, 'window.unsubscribe', phase,
      'addressed consumer subscription remains open', ['release only that consumer subscription'],
      'Consumer is removed; source/boundary ownership and the current window do not change.',
      phase === 'Stopped' ? 'An outer-cancelled Subject leaves already attached Subscription objects open until consumers close them.' : 'Consumer cancellation is local to that window observer; it never closes the shared window or outer source.',
      (s, e) => present(s) && e.type === 'window.unsubscribe' && s.consumers.some(c => c.observerId === e.observerId),
      (s, e) => { if (!present(s) || e.type !== 'window.unsubscribe') throw Error('expected observer cancellation');
        return { state: { ...s, consumers: s.consumers.filter(c => c.observerId !== e.observerId) }, actions: [release(consumerRef(e.observerId))] }; }));
  }
  const base = sessionMetadata({ operator: 'window', id: 'window-observable-boundaries',
    purpose: 'Emit an initial live window and rotate it on boundary next; route source values into the current multicast window.',
    signature: 'window : Cω(BoundarySignal) → T* → Observable<T>*',
    conditions: ['One initial handle is emitted on result connection, followed by one handle for every accepted boundary next.', 'Each window exposes only source values observed while it is current and that consumer is attached.', 'Boundary complete does not complete the result; outer cancellation does not complete its current window consumers.'],
    parameters: 'Valid Observable boundary input; observers use only the Observable-facing interface of emitted handles.',
    callbacks: 'No user callback; payloads and boundary notification values are opaque.',
    time: 'Source, boundary and consumer events supply trace time. Equal-time order is explicit input order; no clock, buffer or scheduler is introduced.',
    reentrancy: 'Atomic non-reentrant reactions after source/boundary setup returns. Consumer attachment is an explicit event between reactions; synchronous setup and callback-driven reentry are characterized separately.',
    initialization: 'Emit window zero, subscribe source, then subscribe boundary. Model inputs after subscribe assume both setup calls returned without synchronous delivery.',
    sharing: 'Each result subscription owns its own source/boundary subscriptions and windows. Each emitted window is live multicast without replay; its consumers never retain the original source after outer cancellation.',
    exclusions: ['Promise/Iterable or invalid boundary conversion.', 'Synchronous source/boundary notifications during setup and consumer attachment/cancellation inside an action word.', 'Imperative next/error/complete access on the later Subject objects; the model specifies their Observable-facing behavior.', 'Subscription to the invalidated final current handle is outside the modeled legal alphabet; native tests separately verify ObjectUnsubscribedError.', 'Physical Subject/Observable prototype identity and observer-thrown errors.'],
    controls: ['Unsubscribed', 'Active', 'Stopped'], testStem: 'session21-window', differential: true,
    inputs: [
      { type: 'boundary.next', origin: 'inner', category: 'notification', description: 'Current boundary subscription emits; payload is ignored.' },
      { type: 'boundary.complete', origin: 'inner', category: 'notification', description: 'Boundary stops without closing the current window.' },
      { type: 'boundary.error', origin: 'inner', category: 'notification', description: 'Boundary fails with an opaque error payload.' },
      { type: 'window.subscribe', origin: 'inner', category: 'lifecycle', description: 'A fresh addressed consumer attaches to a known open or previously rotated completed window.' },
      { type: 'window.unsubscribe', origin: 'inner', category: 'lifecycle', description: 'An attached or orphaned consumer closes its own subscription.' },
    ],
    resources: [{ id: 'boundary', kind: 'subscription', owner: 'outer result execution' }, { id: 'windowObserver:*', kind: 'subscription', owner: 'independent window consumer' }],
    additionalSources: ['src/internal/Subject.ts', 'src/internal/Observable.ts', 'src/internal/util/ObjectUnsubscribedError.ts'],
  });
  return {
    metadata: { ...base, dispatch: { ...base.dispatch, actionSemantics: 'Notifications are addressed to outer downstream or explicit window observers. Tokens identify emitted handles; initial/later prototype differences are normalized. Subject invalidation is state, not a fabricated consumer-unsubscribe action.' },
      controls: base.controls.map(c => c.id === 'Stopped' ? { ...c, terminal: false, description: 'Outer/source execution ended; retained completed handles and orphaned consumer subscriptions remain observable through their own lifecycle events.' } : c) },
    parameters: { boundaries: 'Observable', consumerAccess: 'Observable-only', sourceSetup: 'post-setup' },
    rules, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      if (!present(s)) return [];
      const errors: string[] = [];
      if (!natural(s.current) || s.windows.length !== s.current + 1) errors.push('Window identities must form a consecutive registry.');
      if (typeof s.boundaryLive !== 'boolean') errors.push('Boundary ownership must be explicit.');
      for (const [i, w] of s.windows.entries()) {
        if (w.windowId !== i || w.status !== (i === s.current ? s.phase === 'Active' ? 'open' : 'invalid' : 'complete')) errors.push('Invalid current or historical window status.');
      }
      if (new Set(s.usedObservers).size !== s.usedObservers.length || s.usedObservers.some(id => typeof id !== 'string' || !id.trim())) errors.push('Observer identities must be unique nonempty strings.');
      if (new Set(s.consumers.map(c => c.observerId)).size !== s.consumers.length || s.consumers.some(c => c.windowId !== s.current || !s.usedObservers.includes(c.observerId))) errors.push('Invalid current consumer registry.');
      if (s.phase === 'Stopped' && (s.boundaryLive || (s.reason !== 'cancel' && s.consumers.length > 0))) errors.push('Stopped source owns no boundary; only cancellation can leave orphaned consumers.');
      return errors;
    },
    validateReaction: (_s, e, r) => [
      ...validateActionWord(r.actions),
      ...(e.type === 'cancel' && r.actions.some(a => a.type === 'notify') ? ['Outer cancellation must remain silent for all consumers.'] : []),
      ...(e.type === 'window.unsubscribe' && r.actions.some(a => a.type !== 'unsubscribe' || a.resource.id !== 'windowObserver:' + e.observerId) ? ['Consumer cancellation cannot affect another resource.'] : []),
    ],
  };
}

export const windowExample: readonly TimedEvent<WindowEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 0, event: { type: 'window.subscribe', windowId: 0, observerId: 'A' } },
  { time: 1, event: { type: 'source.next', value: 'one' } },
  { time: 2, event: { type: 'boundary.next' } },
  { time: 2, event: { type: 'window.subscribe', windowId: 1, observerId: 'B' } },
  { time: 3, event: { type: 'source.next', value: 'two' } },
  { time: 4, event: { type: 'source.complete' } },
  { time: 5, event: { type: 'window.subscribe', windowId: 0, observerId: 'late' } },
];
export const windowBoundaryCompleteExample: readonly TimedEvent<WindowEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'window.subscribe', windowId: 0, observerId: 'A' } },
  { time: 2, event: { type: 'boundary.complete' } },
  { time: 3, event: { type: 'source.next', value: 'still-live' } },
  { time: 4, event: { type: 'source.complete' } },
];
export const windowCancelExample: readonly TimedEvent<WindowEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 0, event: { type: 'window.subscribe', windowId: 0, observerId: 'A' } },
  { time: 1, event: { type: 'source.next', value: 'one' } },
  { time: 2, event: { type: 'cancel' } },
  { time: 3, event: { type: 'window.unsubscribe', observerId: 'A' } },
];
