import type { Action, Notification, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { acquire, emit, failWith, finish, natural, release, sessionMetadata, sourceRef } from './session21-common.js';

/**
 * A token denotes an emitted Observable handle, not the Subject or a buffer.
 * Values are delivered to observers only while their named window is open.
 */
export type CountWindowToken = Readonly<{ windowId: number }>;
export type CountWindowRecord = Readonly<{
  windowId: number;
  openedAt: number;
  status: 'open' | 'complete' | 'error';
}>;
export type CountWindowConsumer = Readonly<{ observerId: string; windowId: number }>;
export type WindowCountParameters = Readonly<{ windowSize: number; startEvery: number }>;
export type WindowCountMemory = Readonly<{
  seen: number;
  nextWindowId: number;
  windows: readonly CountWindowRecord[];
  consumers: readonly CountWindowConsumer[];
  usedObservers: readonly string[];
}>;
export type WindowCountState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (WindowCountMemory & Readonly<{ phase: 'Active' }>)
  | (WindowCountMemory & Readonly<{ phase: 'Stopped'; reason: 'complete' | 'error' | 'cancel'; error?: unknown }>);
export type WindowCountEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'window.subscribe'; observerId: string; windowId: number }>
  | Readonly<{ type: 'window.unsubscribe'; observerId: string }>;
export type WindowCountModel<T> = OperatorModel<
  WindowCountParameters, WindowCountState, WindowCountEvent<T>, Action<unknown>
>;

const consumerRef = (id: string): ResourceRef => ({ id: 'windowObserver:' + id, generation: 0 });
const delivered = (id: string, notification: Notification<unknown>): Action<unknown> =>
  ({ type: 'notify', target: consumerRef(id).id, notification });
const known = (s: WindowCountState): s is Exclude<WindowCountState, { phase: 'Unsubscribed' }> => s.phase !== 'Unsubscribed';
const record = (s: WindowCountMemory, id: number): CountWindowRecord | undefined =>
  natural(id) ? s.windows.find(w => w.windowId === id) : undefined;
const fresh = (s: WindowCountMemory, id: string): boolean =>
  typeof id === 'string' && !!id.trim() && !s.usedObservers.includes(id);
const live = (s: WindowCountMemory): readonly CountWindowRecord[] => s.windows.filter(w => w.status === 'open');
const closeConsumers = (s: WindowCountMemory, windowId: number, terminal: Notification<never>): Action<unknown>[] =>
  s.consumers.filter(c => c.windowId === windowId).flatMap(c =>
    [delivered(c.observerId, terminal), release(consumerRef(c.observerId))]);
const terminalConsumers = (s: WindowCountMemory, terminal: Notification<never>): readonly Action<unknown>[] =>
  live(s).flatMap(w => closeConsumers(s, w.windowId, terminal));
const sourceClosed = (s: WindowCountMemory, reason: 'complete' | 'error', error?: unknown): WindowCountState => ({
  ...s, phase: 'Stopped', reason, ...(reason === 'error' ? { error } : {}),
  consumers: [],
  windows: s.windows.map(w => w.status !== 'open' ? w : { ...w, status: reason }),
});

export function createWindowCountModel<T>(windowSize: number, startWindowEvery: number = 0): WindowCountModel<T> {
  const startEvery = startWindowEvery === 0 ? windowSize : startWindowEvery;
  if (!Number.isSafeInteger(windowSize) || windowSize <= 0 ||
      !Number.isSafeInteger(startEvery) || startEvery <= 0) {
    throw new RangeError('windowCount scoped model requires positive safe-integer window size and stride');
  }
  type S = WindowCountState;
  type E = WindowCountEvent<T>;
  type R = Rule<WindowCountParameters, S, E, Action<unknown>>;
  const p: WindowCountParameters = { windowSize, startEvery };
  const rules: R[] = [];
  const add = (
    id: string, from: S['phase'], event: E['type'], to: S['phase'],
    guard: string, actions: readonly string[], nextState: string, explanation: string,
    enabled: (s: S, e: E) => boolean,
    react: (s: S, e: E) => Readonly<{ state: S; actions: readonly Action<unknown>[] }>,
  ): void => {
    rules.push({
      description: { id: 'S22-WINDOWCOUNT-' + id, from, event, to, guard, actions, nextState,
        explanation, obligations: ['S22-WINDOWCOUNT-' + id] },
      enabled, react,
    });
  };

  add('START', 'Unsubscribed', 'subscribe', 'Active', 'no upstream connection exists',
    ['emit initial Observable handle 0', 'subscribe to source'],
    'Window zero is open and empty before the source is connected.',
    'Construction is inert. Initial handle is emitted before the source subscription, enabling immediate child attachment.',
    s => s.phase === 'Unsubscribed',
    () => ({ state: { phase: 'Active', seen: 0, nextWindowId: 1,
      windows: [{ windowId: 0, openedAt: 0, status: 'open' }], consumers: [], usedObservers: [] },
      actions: [emit({ windowId: 0 } satisfies CountWindowToken), acquire(sourceRef)] }));

  add('NEXT', 'Active', 'source.next', 'Active', 'safe source count and window identity',
    ['send source value to each open window observer', 'complete oldest due window', 'open next window after delivery at stride boundary'],
    'Count advances; windows are completed or opened without replaying values.',
    'RxJS 7.8.2 closes when (old count - windowSize + 1) is a nonnegative stride multiple. A new handle opens AFTER the value at each stride boundary, possibly empty at completion.',
    s => s.phase === 'Active' && s.seen < Number.MAX_SAFE_INTEGER && s.nextWindowId < Number.MAX_SAFE_INTEGER,
    (s, e) => {
      if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('expected source next');
      const open = live(s);
      const deliveries = open.flatMap(w => s.consumers.filter(c => c.windowId === w.windowId)
        .map(c => delivered(c.observerId, { kind: 'N', value: e.value })));
      const index = s.seen;
      const threshold = index - windowSize + 1;
      const shouldClose = threshold >= 0 && threshold % startEvery === 0;
      const oldest = shouldClose ? open[0] : undefined;
      const endings = oldest ? closeConsumers(s, oldest.windowId, { kind: 'C' }) : [];
      const seen = index + 1;
      const opening = seen % startEvery === 0;
      const id = s.nextWindowId;
      const windows = [
        ...s.windows.map(w => oldest?.windowId === w.windowId ? { ...w, status: 'complete' as const } : w),
        ...(opening ? [{ windowId: id, openedAt: seen, status: 'open' as const }] : []),
      ];
      const consumers = oldest ? s.consumers.filter(c => c.windowId !== oldest.windowId) : s.consumers;
      return { state: { ...s, seen, nextWindowId: id + (opening ? 1 : 0), windows, consumers },
        actions: [...deliveries, ...endings, ...(opening ? [emit({ windowId: id } satisfies CountWindowToken)] : [])] };
    });

  add('SOURCE-COMPLETE', 'Active', 'source.complete', 'Stopped', 'source is live',
    ['complete each open child before outer completion', 'complete outer result', 'release source'],
    'All remaining open handles remember completion; completed historical handles are unchanged.',
    'Completion does not emit another window. It completes even the empty window opened on the last source next.',
    s => s.phase === 'Active',
    s => { if (s.phase !== 'Active') throw new Error('expected source completion');
      return { state: sourceClosed(s, 'complete'),
        actions: [...terminalConsumers(s, { kind: 'C' }), finish, release(sourceRef)] }; });

  add('SOURCE-ERROR', 'Active', 'source.error', 'Stopped', 'source is live',
    ['error each open child with same error identity', 'error outer result', 'release source'],
    'Open handles retain the terminal error for late observers; earlier completed windows remain completed.',
    'No replacement error or buffer flush; notification order is each child then the outer subscriber.',
    s => s.phase === 'Active',
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'source.error') throw new Error('expected source error');
      return { state: sourceClosed(s, 'error', e.error),
        actions: [...terminalConsumers(s, { kind: 'E', error: e.error }), failWith(e.error), release(sourceRef)] }; });

  add('CANCEL', 'Active', 'cancel', 'Stopped', 'outer subscriber cancels between events',
    ['release source subscription silently'],
    'Current open Subjects and their consumer subscriptions remain orphaned, unlike window(boundaries).',
    'windowCount finalization clears its internal array but does not complete, error, or unsubscribe its Subject windows. Late window observers can still attach to these silent Subjects.',
    s => s.phase === 'Active',
    s => { if (s.phase !== 'Active') throw new Error('expected cancel');
      return { state: { ...s, phase: 'Stopped', reason: 'cancel' }, actions: [release(sourceRef)] }; });

  for (const phase of ['Active', 'Stopped'] as const) {
    add('OBSERVE-OPEN-' + phase.toUpperCase(), phase, 'window.subscribe', phase,
      'fresh observer ID names an open window; after stop, only cancelled windows stay open',
      ['acquire one named window observer subscription, no replay'],
      'Observer joins the specified live Subject; no additional source subscription is made.',
      'Each window is a multicast Subject exposed as an Observable; consumers hold no upstream lease.',
      (s, e) => s.phase === phase && e.type === 'window.subscribe' &&
        fresh(s, e.observerId) && record(s, e.windowId)?.status === 'open',
      (s, e) => { if (!known(s) || e.type !== 'window.subscribe') throw new Error('expected observer');
        return { state: { ...s,
          consumers: [...s.consumers, { observerId: e.observerId, windowId: e.windowId }],
          usedObservers: [...s.usedObservers, e.observerId] },
          actions: [acquire(consumerRef(e.observerId))] }; });

    add('OBSERVE-COMPLETE-' + phase.toUpperCase(), phase, 'window.subscribe', phase,
      'fresh observer ID names a completed window',
      ['subscribe and synchronously complete the new window observer', 'release observer subscription'],
      'No consumer remains attached; this completed Subject does not replay any values.',
      'Historical completed windows retain the completion notification even after the outer source has stopped.',
      (s, e) => s.phase === phase && e.type === 'window.subscribe' &&
        fresh(s, e.observerId) && record(s, e.windowId)?.status === 'complete',
      (s, e) => { if (!known(s) || e.type !== 'window.subscribe') throw new Error('expected completed observer');
        return { state: { ...s, usedObservers: [...s.usedObservers, e.observerId] },
          actions: [acquire(consumerRef(e.observerId)), delivered(e.observerId, { kind: 'C' }),
            release(consumerRef(e.observerId))] }; });

    if (phase === 'Stopped') add('OBSERVE-ERROR-' + phase.toUpperCase(), phase, 'window.subscribe', phase,
      'fresh observer names a failed window, which can occur only after source error',
      ['subscribe and immediately replay terminal error only', 'release observer subscription'],
      'Observer is terminated with the same error identity; no value replay.',
      'A Subject retains its terminal failure for late observers, distinct from cancellation.',
      (s, e) => s.phase === phase && e.type === 'window.subscribe' &&
        fresh(s, e.observerId) && record(s, e.windowId)?.status === 'error',
      (s, e) => { if (!known(s) || e.type !== 'window.subscribe' || s.phase !== 'Stopped' || s.reason !== 'error') throw new Error('expected failed observer');
        return { state: { ...s, usedObservers: [...s.usedObservers, e.observerId] },
          actions: [acquire(consumerRef(e.observerId)),
            delivered(e.observerId, { kind: 'E', error: s.error }), release(consumerRef(e.observerId))] }; });

    add('OBSERVER-UNSUBSCRIBE-' + phase.toUpperCase(), phase, 'window.unsubscribe', phase,
      'addressed observer owns an open window subscription',
      ['release only the addressed child subscription'],
      'Window and all other consumers are unchanged; source lifetime remains independently owned.',
      'After outer cancellation, orphaned window observers can still unsubscribe independently.',
      (s, e) => s.phase === phase && e.type === 'window.unsubscribe' &&
        s.consumers.some(c => c.observerId === e.observerId),
      (s, e) => { if (!known(s) || e.type !== 'window.unsubscribe') throw new Error('expected unsubscribe');
        return { state: { ...s, consumers: s.consumers.filter(c => c.observerId !== e.observerId) },
          actions: [release(consumerRef(e.observerId))] }; });
  }

  const metadata = sessionMetadata({
    operator: 'windowCount', id: 'windowCount-' + windowSize + '-stride-' + startEvery,
    purpose: 'Rotate count-limited live multicast windows with overlapping, contiguous and gapped source-index policies.',
    signature: 'windowCount : (windowSize:Count,startEvery:Count) → T* → Observable<T>*',
    conditions: [
      'Exactly one initial window handle plus one handle after every startEvery source values; handles can be empty.',
      'Every source value is sent to all currently open windows; the oldest closes when its configured count is reached.',
      'For startEvery < windowSize windows overlap; for equality they are adjacent; for startEvery > windowSize gaps occur.',
      'Source completion closes remaining windows before outer complete; source error errors them before outer error.',
    ],
    parameters: 'Positive safe integer windowSize, positive safe integer effective stride (zero argument normalized to windowSize); no count overflow.',
    callbacks: 'No callback. Source values are opaque, retain identity, and are never buffered by this operator.',
    time: 'Only source event order controls windows; no scheduler is introduced. Explicit event sequence resolves equal-time input order.',
    reentrancy: 'Atomic post-setup source notifications, with child attachment between reactions. Synchronous producer/reentrant observer mutation excluded.',
    initialization: 'Announce initial window zero synchronously, then acquire the source. Construction does not subscribe.',
    sharing: 'Result subscriptions are cold and independent. Each inner window is live multicast, no replay; window consumers do not keep the source connected.',
    exclusions: ['Fractional, negative, non-finite or overflowing window size/stride/count; zero windowSize.',
      'Synchronous source notifications during initial subscription setup and reentrant window-consumer callbacks.',
      'Imperative access to Subject implementation, throwing observer teardowns and unmodeled foreign ObservableInput conversions.'],
    controls: ['Unsubscribed', 'Active', 'Stopped'], testStem: 'session22-windowCount',
    resources: [{ id: 'windowObserver:*', kind: 'subscription', owner: 'independent window consumer' }],
    inputs: [
      { type: 'window.subscribe', origin: 'inner', category: 'lifecycle', description: 'Independent observer attaches to an open or previously terminated window token.' },
      { type: 'window.unsubscribe', origin: 'inner', category: 'lifecycle', description: 'Named window consumer closes its own connection.' },
    ],
    additionalSources: ['src/internal/Subject.ts', 'src/internal/Observable.ts'],
  });
  const m = {
    ...metadata, evidence: { ...metadata.evidence,
      record: 'evidence/SESSION-22.md',
      scenarios: 'docs/SESSION-22-COUNT-WINDOWS.md',
      coverage: 'docs/SESSION-22-COUNT-WINDOWS.md' },
    controls: metadata.controls.map(c => c.id === 'Stopped' ?
      { ...c, terminal: false, description: 'Outer execution ended; completed/failed windows and orphaned consumers remain observable.' } : c),
    dispatch: { ...metadata.dispatch,
      actionSemantics: 'Addressed child notifications precede outer notices. Count closure and new-handle emission are ordered. Tokens stand for Observable handles, not materialized buffers.' },
  };
  return {
    metadata: m, parameters: p, rules, initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => {
      if (!known(s)) return [];
      const errors: string[] = [];
      if (!natural(s.seen) || !natural(s.nextWindowId) || s.nextWindowId < 1 || s.windows.length !== s.nextWindowId)
        errors.push('Seen and window identities must be nonnegative consecutive safe integers.');
      if (s.windows.length && (s.windows[0]?.windowId !== 0 || s.windows[0]?.openedAt !== 0))
        errors.push('Initial handle zero must exist.');
      for (const [id, w] of s.windows.entries()) {
        if (w.windowId !== id || !natural(w.openedAt) || w.openedAt > s.seen ||
            w.openedAt % startEvery !== 0 || !['open','complete','error'].includes(w.status))
          errors.push('Window registry contains an impossible identity/start/status.');
        if (s.phase === 'Active' && (w.status === 'error' || (w.status === 'open') !== (w.openedAt + windowSize > s.seen)))
          errors.push('Active window lifetime contradicts source count.');
        if (s.phase === 'Stopped' && s.reason !== 'cancel' && w.status === 'open')
          errors.push('Terminated window must not be open after complete/error.');
        if (s.phase === 'Stopped' && s.reason === 'cancel' && w.status === 'error')
          errors.push('Cancellation cannot fail a window.');
        if (s.phase === 'Stopped' && s.reason === 'complete' && w.status === 'error')
          errors.push('Completion cannot fail a window.');
      }
      if (new Set(s.usedObservers).size !== s.usedObservers.length || s.usedObservers.some(id => typeof id !== 'string' || !id.trim()))
        errors.push('Observer IDs must be unique nonempty strings.');
      if (new Set(s.consumers.map(c => c.observerId)).size !== s.consumers.length ||
          s.consumers.some(c => !s.usedObservers.includes(c.observerId) || record(s, c.windowId)?.status !== 'open'))
        errors.push('All attached observers must belong to open windows and be registered exactly once.');
      if (s.phase === 'Stopped' && s.reason !== 'cancel' && s.consumers.length)
        errors.push('Completed and errored executions cannot retain live child consumers.');
      return errors;
    },
    validateReaction: (before, event, reaction) => {
      const errors = [...validateActionWord(reaction.actions)];
      if (event.type === 'cancel' && reaction.actions.some(a => a.type === 'notify'))
        errors.push('Cancellation must not emit or complete any window or the outer stream.');
      if (event.type === 'window.unsubscribe' && reaction.actions.some(a => a.type !== 'unsubscribe' ||
          a.resource.id !== consumerRef(event.observerId).id))
        errors.push('A child unsubscribe cannot affect source or peer window ownership.');
      if (event.type === 'source.next' && before.phase === 'Active' &&
          (reaction.state.phase !== 'Active' || reaction.state.seen !== before.seen + 1))
        errors.push('Each source value increments the observed count exactly once.');
      return errors;
    },
  };
}

export const windowCountExample: readonly TimedEvent<WindowCountEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 0, event: { type: 'window.subscribe', observerId: 'A', windowId: 0 } },
  { time: 1, event: { type: 'source.next', value: 'one' } },
  { time: 1, event: { type: 'window.subscribe', observerId: 'B', windowId: 1 } },
  { time: 2, event: { type: 'source.next', value: 'two' } },
  { time: 3, event: { type: 'source.next', value: 'three' } },
  { time: 3, event: { type: 'window.subscribe', observerId: 'C', windowId: 3 } },
  { time: 4, event: { type: 'source.complete' } },
  { time: 5, event: { type: 'window.subscribe', observerId: 'late', windowId: 3 } },
];
export const windowCountGapExample: readonly TimedEvent<WindowCountEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 0, event: { type: 'window.subscribe', observerId: 'A', windowId: 0 } },
  { time: 1, event: { type: 'source.next', value: 'first' } },
  { time: 2, event: { type: 'source.next', value: 'second' } },
  { time: 3, event: { type: 'source.next', value: 'gap' } },
  { time: 3, event: { type: 'window.subscribe', observerId: 'B', windowId: 1 } },
  { time: 4, event: { type: 'source.next', value: 'fourth' } },
  { time: 5, event: { type: 'source.complete' } },
];
export const windowCountCancelExample: readonly TimedEvent<WindowCountEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 0, event: { type: 'window.subscribe', observerId: 'A', windowId: 0 } },
  { time: 1, event: { type: 'source.next', value: 'one' } },
  { time: 2, event: { type: 'cancel' } },
  { time: 3, event: { type: 'window.subscribe', observerId: 'late', windowId: 0 } },
  { time: 4, event: { type: 'window.unsubscribe', observerId: 'A' } },
  { time: 4, event: { type: 'window.unsubscribe', observerId: 'late' } },
];
