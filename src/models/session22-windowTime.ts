import type { Action, Notification, OperatorModel, ResourceRef, Rule, TimedEvent, Trace } from '../schema.js';
import { runTrace, validateActionWord } from '../runner.js';
import { acquire, emit, failWith, finish, natural, release, sessionMetadata, sourceRef } from './session21-common.js';

export type TimedWindowToken = Readonly<{ windowId: number }>;
export type TimedWindowRecord = Readonly<{
  windowId: number; openedAt: number; seen: number;
  status: 'open' | 'complete' | 'error'; deadline: number | null;
}>;
export type TimedWindowConsumer = Readonly<{ observerId: string; windowId: number }>;
export type WindowTimeParameters = Readonly<{ span: number; creationInterval: number | null; maxSize: number | null }>;
export type WindowTimeMemory = Readonly<{
  now: number; nextWindowId: number; windows: readonly TimedWindowRecord[];
  consumers: readonly TimedWindowConsumer[]; usedObservers: readonly string[];
  creation: Readonly<{ tick: number; due: number }> | null;
}>;
export type WindowTimeState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (WindowTimeMemory & Readonly<{ phase: 'Active' }>)
  | (WindowTimeMemory & Readonly<{ phase: 'Stopped'; reason: 'complete' | 'error' | 'cancel'; error?: unknown }>);
export type WindowTimeEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete'; now: number }>
  | Readonly<{ type: 'source.next'; value: T; now: number }>
  | Readonly<{ type: 'source.error'; error: unknown; now: number }>
  | Readonly<{ type: 'timer.window'; resource: Readonly<{ id: 'windowClose'; generation: number }>; now: number }>
  | Readonly<{ type: 'timer.creation'; resource: Readonly<{ id: 'windowCreation'; generation: 0 }>; tick: number; now: number }>
  | Readonly<{ type: 'window.subscribe'; observerId: string; windowId: number; now: number }>
  | Readonly<{ type: 'window.unsubscribe'; observerId: string; now: number }>;
export type WindowTimeModel<T> = OperatorModel<WindowTimeParameters, WindowTimeState, WindowTimeEvent<T>, Action<unknown>>;

const creator: ResourceRef = { id: 'windowCreation', generation: 0 };
const closeRef = (id: number): ResourceRef => ({ id: 'windowClose', generation: id });
const consumerRef = (id: string): ResourceRef => ({ id: 'windowObserver:' + id, generation: 0 });
const schedule = (resource: ResourceRef, delay: number): Action<unknown> => ({ type: 'schedule', resource, delay });
const cancelTimer = (resource: ResourceRef): Action<unknown> => ({ type: 'cancel-timer', resource });
const delivered = (id: string, notification: Notification<unknown>): Action<unknown> =>
  ({ type: 'notify', target: consumerRef(id).id, notification });
const known = (s: WindowTimeState): s is Exclude<WindowTimeState, { phase: 'Unsubscribed' }> => s.phase !== 'Unsubscribed';
const live = (s: WindowTimeMemory): readonly TimedWindowRecord[] => s.windows.filter(w => w.status === 'open');
const windowAt = (s: WindowTimeMemory, id: number): TimedWindowRecord | undefined => natural(id) ? s.windows[id] : undefined;
const fresh = (s: WindowTimeMemory, id: string): boolean => typeof id === 'string' && !!id.trim() && !s.usedObservers.includes(id);
const endConsumers = (s: WindowTimeMemory, windowId: number, terminal: Notification<never>): Action<unknown>[] =>
  s.consumers.filter(c => c.windowId === windowId).flatMap(c => [delivered(c.observerId, terminal), release(consumerRef(c.observerId))]);

/** Timers are external inputs. Null interval restarts on close; null maxSize is unbounded. */
export function createWindowTimeModel<T>(span: number, creationInterval: number | null = null, maxSize: number | null = null): WindowTimeModel<T> {
  const boundedPositive = (n: number): boolean => Number.isSafeInteger(n) && n >= 1 && n <= 1000;
  if (!boundedPositive(span) || (creationInterval !== null && !boundedPositive(creationInterval)) ||
      (maxSize !== null && !boundedPositive(maxSize))) throw new RangeError('windowTime requires positive integers 1..1000; null interval/maxSize select restart/unbounded policies');
  const p: WindowTimeParameters = { span, creationInterval, maxSize };
  type S = WindowTimeState; type E = WindowTimeEvent<T>;
  const validNow = (s: S, now: number): boolean => natural(now) && now <= Number.MAX_SAFE_INTEGER - Math.max(span, creationInterval ?? 0) && (!known(s) || now >= s.now);
  const openWindow = (s: WindowTimeMemory, now: number): Readonly<{ memory: WindowTimeMemory; actions: readonly Action<unknown>[] }> => {
    const windowId = s.nextWindowId;
    return { memory: { ...s, now, nextWindowId: windowId + 1,
      windows: [...s.windows, { windowId, openedAt: now, seen: 0, status: 'open', deadline: now + span }] },
      actions: [emit({ windowId } satisfies TimedWindowToken), schedule(closeRef(windowId), span)] };
  };
  const closeWindow = (s: WindowTimeMemory, windowId: number, now: number): Readonly<{ memory: WindowTimeMemory; actions: readonly Action<unknown>[] }> => {
    const memory: WindowTimeMemory = { ...s, now,
      windows: s.windows.map(w => w.windowId === windowId ? { ...w, status: 'complete', deadline: null } : w),
      consumers: s.consumers.filter(c => c.windowId !== windowId) };
    const actions = [...endConsumers(s, windowId, { kind: 'C' }), cancelTimer(closeRef(windowId))];
    if (creationInterval !== null) return { memory, actions };
    const next = openWindow(memory, now);
    return { memory: next.memory, actions: [...actions, ...next.actions] };
  };
  const stopInputs = (s: WindowTimeMemory): readonly Action<unknown>[] =>
    [...(s.creation ? [cancelTimer(creator)] : []),
      ...live(s).filter(w => w.windowId === 0).map(w => cancelTimer(closeRef(w.windowId))),
      release(sourceRef), ...live(s).filter(w => w.windowId > 0).map(w => cancelTimer(closeRef(w.windowId)))];
  const rules: Rule<WindowTimeParameters, S, E, Action<unknown>>[] = [];
  const add = (name: string, from: S['phase'], event: E['type'], to: S['phase'], guard: string,
    actions: readonly string[], nextState: string, explanation: string,
    enabled: (s: S, e: E) => boolean,
    react: (s: S, e: E) => Readonly<{ state: S; actions: readonly Action<unknown>[] }>): void => {
    const id = 'S22-WINDOWTIME-' + name;
    rules.push({ description: { id, from, event, to, guard, actions, nextState, explanation, obligations: [id] },
      enabled: (s, e) => validNow(s, e.now) && enabled(s, e), react });
  };

  add('START', 'Unsubscribed', 'subscribe', 'Active', 'first connection; safe supplied scheduler time',
    ['schedule recurring creation if configured', 'emit initial window handle', 'schedule its close', 'acquire source'],
    'One empty window is live; its deadline is now + span.',
    'Construction is inert. Periodic creation is scheduled before the initial window; window handle and close timer precede source acquisition.',
    s => s.phase === 'Unsubscribed', (s, e) => {
      const initial: WindowTimeMemory = { now: e.now, nextWindowId: 0, windows: [], consumers: [], usedObservers: [],
        creation: creationInterval === null ? null : { tick: 0, due: e.now + creationInterval } };
      const next = openWindow(initial, e.now);
      return { state: { ...next.memory, phase: 'Active' }, actions: [
        ...(creationInterval === null ? [] : [schedule(creator, creationInterval)]), ...next.actions, acquire(sourceRef)] };
    });
  add('NEXT', 'Active', 'source.next', 'Active', 'source is live; counts and possible new window identity remain safe',
    ['for each current window in order: deliver source value', 'complete and cancel any window reaching maxSize', 'restart immediately only in sequential mode'],
    'Per-window counts advance; a restarted window does not receive the value that closed its predecessor.',
    'RxJS snapshots its active record list, then delivers and closes one record at a time. Overlapping windows can therefore see another window complete before receiving the same value.',
    s => s.phase === 'Active' && s.nextWindowId < Number.MAX_SAFE_INTEGER && live(s).every(w => w.seen < Number.MAX_SAFE_INTEGER),
    (s, e) => {
      if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('expected live source value');
      let memory: WindowTimeMemory = { ...s, now: e.now };
      const actions: Action<unknown>[] = [];
      for (const w of live(s)) {
        actions.push(...memory.consumers.filter(c => c.windowId === w.windowId).map(c => delivered(c.observerId, { kind: 'N', value: e.value })));
        const seen = w.seen + 1;
        memory = { ...memory, windows: memory.windows.map(x => x.windowId === w.windowId ? { ...x, seen } : x) };
        if (maxSize !== null && seen >= maxSize) {
          const next = closeWindow(memory, w.windowId, e.now); memory = next.memory; actions.push(...next.actions);
        }
      }
      return { state: { ...memory, phase: 'Active' }, actions };
    });
  add('WINDOW-TIMER', 'Active', 'timer.window', 'Active', 'current live window timer generation; now is at or after its deadline',
    ['complete addressed window observers', 'cancel its timer', 'restart and schedule successor only in sequential mode'],
    'The specified window completes without replay; historical completed handles remain usable.',
    'A deadline is data, not an automatic transition. Old generations and early timer delivery are rejected.',
    (s, e) => s.phase === 'Active' && e.type === 'timer.window' && e.resource.id === 'windowClose' &&
      natural(e.resource.generation) && windowAt(s, e.resource.generation)?.status === 'open' &&
      windowAt(s, e.resource.generation)?.deadline !== null && e.now >= (windowAt(s, e.resource.generation)?.deadline ?? Infinity) &&
      s.nextWindowId < Number.MAX_SAFE_INTEGER,
    (s, e) => {
      if (s.phase !== 'Active' || e.type !== 'timer.window') throw new Error('expected live window timer');
      const next = closeWindow(s, e.resource.generation, e.now);
      return { state: { ...next.memory, phase: 'Active' }, actions: next.actions };
    });
  if (creationInterval !== null) add('CREATION-TIMER', 'Active', 'timer.creation', 'Active',
    'configured recurring creation timer, matching tick and generation, now at or after due',
    ['emit new window handle', 'schedule that window close', 'reschedule recurring creation timer'],
    'Creation tick advances and its next deadline is now + creationInterval; previous windows are unchanged.',
    'The recurring creation task is one logical resource. Its explicit tick distinguishes firings; window timer generations are window identities.',
    (s, e) => s.phase === 'Active' && e.type === 'timer.creation' && s.creation !== null &&
      e.resource.id === 'windowCreation' && e.resource.generation === 0 && e.tick === s.creation.tick &&
      e.now >= s.creation.due && s.nextWindowId < Number.MAX_SAFE_INTEGER,
    (s, e) => {
      if (s.phase !== 'Active' || e.type !== 'timer.creation' || s.creation === null) throw new Error('expected recurring creation');
      const next = openWindow({ ...s, creation: { tick: s.creation.tick + 1, due: e.now + creationInterval } }, e.now);
      return { state: { ...next.memory, phase: 'Active' }, actions: [...next.actions, schedule(creator, creationInterval)] };
    });

  for (const reason of ['complete', 'error'] as const) add('SOURCE-' + reason.toUpperCase(), 'Active', reason === 'complete' ? 'source.complete' : 'source.error', 'Stopped',
    'source is live', ['terminate every active window in creation order', 'terminate outer result', 'cancel creation and initial-window timers', 'release source', 'cancel later-window timers'],
    'All current handles remember the source terminal; historical completed handles retain completion.',
    'Inner terminals precede the outer terminal. Cleanup follows registration: creation timer, initial-window timer if still live, source, then later-window timers.',
    s => s.phase === 'Active', (s, e) => {
      if (s.phase !== 'Active') throw new Error('expected source terminal');
      const error = e.type === 'source.error' ? e.error : undefined;
      const terminal: Notification<never> = reason === 'error' ? { kind: 'E', error } : { kind: 'C' };
      return { state: { ...s, phase: 'Stopped', reason, ...(reason === 'error' ? { error } : {}), now: e.now, creation: null, consumers: [],
        windows: s.windows.map(w => w.status === 'open' ? { ...w, status: reason, deadline: null } : w) },
        actions: [...live(s).flatMap(w => endConsumers(s, w.windowId, terminal)), reason === 'error' ? failWith(error) : finish,
          ...stopInputs(s)] };
    });
  add('CANCEL', 'Active', 'cancel', 'Stopped', 'outer connection is live',
    ['release timers and source in registration order without notifications'],
    'Open window Subjects and their child subscriptions become silent orphans; historical handles remain usable.',
    'windowTime clears its record registry on disposal but does not complete or unsubscribe the Subjects. Child connections hold no upstream lease.',
    s => s.phase === 'Active', (s, e) => {
      if (s.phase !== 'Active') throw new Error('expected cancellation');
      return { state: { ...s, phase: 'Stopped', reason: 'cancel', now: e.now, creation: null,
        windows: s.windows.map(w => ({ ...w, deadline: null })) }, actions: stopInputs(s) };
    });

  for (const phase of ['Active', 'Stopped'] as const) {
    add('OBSERVE-OPEN-' + phase.toUpperCase(), phase, 'window.subscribe', phase,
      'fresh observer identity names an open window', ['acquire independent window observer without replay'],
      'Observer joins the addressed multicast Subject, including a silent orphan after outer cancellation.',
      'Attaching a child never creates or retains a source/timer connection.',
      (s, e) => s.phase === phase && e.type === 'window.subscribe' && fresh(s, e.observerId) && windowAt(s, e.windowId)?.status === 'open',
      (s, e) => {
        if (!known(s) || e.type !== 'window.subscribe') throw new Error('expected child attachment');
        return { state: { ...s, now: e.now, usedObservers: [...s.usedObservers, e.observerId],
          consumers: [...s.consumers, { observerId: e.observerId, windowId: e.windowId }] }, actions: [acquire(consumerRef(e.observerId))] };
      });
    add('OBSERVE-COMPLETE-' + phase.toUpperCase(), phase, 'window.subscribe', phase,
      'fresh observer identity names a completed window', ['acquire child observer', 'deliver completion immediately', 'release child observer'],
      'Observer identity is recorded but no live child subscription remains.',
      'A completed Subject remembers its terminal notification without replaying source values.',
      (s, e) => s.phase === phase && e.type === 'window.subscribe' && fresh(s, e.observerId) && windowAt(s, e.windowId)?.status === 'complete',
      (s, e) => {
        if (!known(s) || e.type !== 'window.subscribe') throw new Error('expected completed handle');
        return { state: { ...s, now: e.now, usedObservers: [...s.usedObservers, e.observerId] },
          actions: [acquire(consumerRef(e.observerId)), delivered(e.observerId, { kind: 'C' }), release(consumerRef(e.observerId))] };
      });
    add('DETACH-' + phase.toUpperCase(), phase, 'window.unsubscribe', phase,
      'named child observer is attached', ['release only the addressed child observer'],
      'Other consumers, source ownership and timer ownership do not change.',
      'Orphaned child subscriptions can be disposed independently after the outer execution stops.',
      (s, e) => s.phase === phase && e.type === 'window.unsubscribe' && s.consumers.some(c => c.observerId === e.observerId),
      (s, e) => {
        if (!known(s) || e.type !== 'window.unsubscribe') throw new Error('expected child disposal');
        return { state: { ...s, now: e.now, consumers: s.consumers.filter(c => c.observerId !== e.observerId) }, actions: [release(consumerRef(e.observerId))] };
      });
  }
  add('OBSERVE-ERROR-STOPPED', 'Stopped', 'window.subscribe', 'Stopped',
    'fresh observer names a window failed by the source', ['acquire child observer', 'deliver retained error by identity', 'release child observer'],
    'Failed handle remains failed; no source values are replayed.',
    'Error retention differs from both historical completion and silent orphaning on cancellation.',
    (s, e) => s.phase === 'Stopped' && s.reason === 'error' && e.type === 'window.subscribe' && fresh(s, e.observerId) && windowAt(s, e.windowId)?.status === 'error',
    (s, e) => {
      if (s.phase !== 'Stopped' || e.type !== 'window.subscribe') throw new Error('expected failed handle');
      return { state: { ...s, now: e.now, usedObservers: [...s.usedObservers, e.observerId] },
        actions: [acquire(consumerRef(e.observerId)), delivered(e.observerId, { kind: 'E', error: s.error }), release(consumerRef(e.observerId))] };
    });

  const basis = sessionMetadata({
    operator: 'windowTime', id: 'windowTime-' + span + '-' + (creationInterval ?? 'restart') + '-max-' + (maxSize ?? 'unbounded'),
    purpose: 'Route source values through live multicast windows closed by supplied scheduler events or per-window counts.',
    signature: 'windowTime : (Span, Interval? , Count?) → T* → (T*)*',
    conditions: ['One initial handle; sequential mode starts a new window whenever the previous window closes.',
      'Periodic mode opens independently on creation ticks; windows overlap, abut or leave gaps according to span and interval.',
      'Source next goes to each current window and can close it at maxSize; the closing value never enters its sequential successor.',
      'Source terminals reach windows before the outer observer; outer cancellation leaves open child Subjects silent and uncompleted.'],
    parameters: 'Positive safe-integer span, interval and finite maxSize in 1..1000. Null interval selects restart-on-close; null maxSize is unbounded. Finite safe-integer supplied scheduler time and counters without overflow.',
    callbacks: 'No user function is invoked. Opaque source values retain identity. Emitted tokens denote Observable handles, not collected arrays.',
    time: 'Deferred FIFO scheduler profile. Inputs carry supplied now; runWindowTimeTrace enforces now equals trace-envelope time. Explicit timer identities/ticks and input order decide same-time reactions. Delayed timer delivery is admissible at or after its due time.',
    initialization: 'Optional creation timer, initial handle, its close timer, then source acquisition. No synchronous source delivery or clock advancement during setup.',
    sharing: 'Each outer execution owns independent source/timer resources. Each inner window is live multicast without replay; consumers hold no upstream lease.',
    reentrancy: 'Atomic non-reentrant reactions. Consumers attach between reactions; callbacks that subscribe, cancel or emit during a current reaction are characterized separately if tested.',
    exclusions: ['Zero/negative/fractional/non-finite durations, invalid overload normalization and synchronous scheduler execution.',
      'Setup-time source delivery, arbitrary reentrancy, subject implementation mutation and clock/counter overflow.',
      'Scheduler-specific physical Action allocation; recurring creation is normalized to one logical timer with explicit firing ticks.'],
    controls: ['Unsubscribed', 'Active', 'Stopped'], testStem: 'session22-windowTime', differential: true,
    inputs: [
      { type: 'timer.window', origin: 'timer', category: 'time', description: 'Current window close timer delivers its generation at or after its deadline.' },
      { type: 'timer.creation', origin: 'timer', category: 'time', description: 'The configured recurring creation task delivers its current firing tick.' },
      { type: 'window.subscribe', origin: 'inner', category: 'lifecycle', description: 'Fresh observer attaches to an emitted current or historical window.' },
      { type: 'window.unsubscribe', origin: 'inner', category: 'lifecycle', description: 'One child observer closes its independent connection.' },
    ],
    resources: [{ id: 'windowCreation', kind: 'timer', owner: 'outer execution, recurring logical task' },
      { id: 'windowClose', kind: 'timer', owner: 'window record; generation is window identity' },
      { id: 'windowObserver:*', kind: 'subscription', owner: 'independent window consumer' }],
    actionTypes: ['subscribe', 'unsubscribe', 'notify', 'schedule', 'cancel-timer'],
    additionalSources: ['src/internal/util/executeSchedule.ts', 'src/internal/Subject.ts', 'src/internal/Subscription.ts'],
  });
  return {
    metadata: { ...basis, evidence: { ...basis.evidence, record: 'evidence/SESSION-22.md',
      scenarios: 'docs/SESSION-22-TIMED-WINDOWS.md', coverage: 'docs/SESSION-22-TIMED-WINDOWS.md' },
      controls: basis.controls.map(c => c.id === 'Stopped' ? { ...c, terminal: false,
        description: 'Outer stopped; completed/failed historical handles and orphan child subscriptions remain observable.' } : c) },
    parameters: p, rules, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      const issues: string[] = [];
      if (!natural(s.now) || s.now > Number.MAX_SAFE_INTEGER - Math.max(span, creationInterval ?? 0) ||
          !natural(s.nextWindowId) || s.nextWindowId < 1 || s.windows.length !== s.nextWindowId)
        issues.push('Window registry and scheduler time must use safe nonnegative consecutive identities.');
      if (s.phase !== 'Active' && s.phase !== 'Stopped') issues.push('Unknown windowTime control.');
      if (s.phase === 'Active') {
        if (creationInterval === null && (s.creation !== null || live(s).length !== 1)) issues.push('Sequential mode owns exactly one live window and no creation timer.');
        if (creationInterval !== null && (s.creation === null || !natural(s.creation.tick) || s.creation.tick !== s.nextWindowId - 1 ||
            !natural(s.creation.due) || s.creation.due !== (s.windows[s.windows.length - 1]?.openedAt ?? NaN) + creationInterval)) issues.push('Periodic creation timer and tick must match emitted handles.');
      } else if (s.creation !== null || !['complete', 'error', 'cancel'].includes(s.reason)) issues.push('Stopped state owns no creation timer and needs a legal reason.');
      let previousOpening = -1;
      for (const [id, w] of s.windows.entries()) {
        if (w.windowId !== id || !natural(w.openedAt) || w.openedAt > Number.MAX_SAFE_INTEGER - span || w.openedAt > s.now || w.openedAt < previousOpening || !natural(w.seen) ||
            !['open', 'complete', 'error'].includes(w.status) || (maxSize !== null && w.seen > maxSize)) issues.push('Invalid timed-window registry entry.');
        previousOpening = w.openedAt;
        if (s.phase === 'Active' && (w.status === 'error' || (w.status === 'open' &&
            (w.deadline !== w.openedAt + span || (maxSize !== null && w.seen >= maxSize))))) issues.push('Active window must retain its exact close deadline and a sublimit count.');
        if ((w.status !== 'open' || s.phase === 'Stopped') && w.deadline !== null) issues.push('Only an active open window owns a close deadline.');
        if (s.phase === 'Stopped' && ((s.reason !== 'cancel' && w.status === 'open') || (s.reason !== 'error' && w.status === 'error')))
          issues.push('Window terminal state contradicts outer stopping reason.');
      }
      if (new Set(s.usedObservers).size !== s.usedObservers.length || s.usedObservers.some(id => typeof id !== 'string' || !id.trim())) issues.push('Observer identities must be fresh nonempty strings.');
      if (new Set(s.consumers.map(c => c.observerId)).size !== s.consumers.length || s.consumers.some(c =>
          !s.usedObservers.includes(c.observerId) || windowAt(s, c.windowId)?.status !== 'open')) issues.push('Every child connection belongs to one open window and one known unique observer.');
      if (s.phase === 'Stopped' && s.reason !== 'cancel' && s.consumers.length) issues.push('Terminated windows cannot retain child consumers.');
      return issues;
    },
    validateReaction: (before, event, result) => [
      ...validateActionWord(result.actions),
      ...(event.type === 'cancel' && result.actions.some(a => a.type === 'notify') ? ['Cancellation cannot notify windows or outer.'] : []),
      ...(event.type === 'window.unsubscribe' && result.actions.some(a => a.type !== 'unsubscribe' || a.resource.id !== consumerRef(event.observerId).id) ? ['Child disposal cannot affect other resources.'] : []),
      ...(before.phase === 'Stopped' && result.actions.some(a => a.type === 'schedule' || (a.type === 'subscribe' && a.resource.id === 'source')) ? ['Stopped outer executions cannot reacquire source/timer resources.'] : []),
    ],
  };
}

export function runWindowTimeTrace<T>(model: WindowTimeModel<T>, inputs: readonly TimedEvent<WindowTimeEvent<T>>[],
  options: Readonly<{ executionId: string; maxSteps?: number }>): Trace<WindowTimeState, WindowTimeEvent<T>, Action<unknown>> {
  for (const input of inputs) if (input.time !== input.event.now) throw new Error('windowTime supplied now must equal its trace-envelope time');
  return runTrace(model, inputs, options);
}

export const windowTimeExample: readonly TimedEvent<WindowTimeEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe', now: 0 } },
  { time: 0, event: { type: 'window.subscribe', observerId: 'A', windowId: 0, now: 0 } },
  { time: 1, event: { type: 'source.next', value: 'one', now: 1 } },
  { time: 4, event: { type: 'timer.window', resource: { id: 'windowClose', generation: 0 }, now: 4 } },
  { time: 4, event: { type: 'window.subscribe', observerId: 'B', windowId: 1, now: 4 } },
  { time: 5, event: { type: 'source.next', value: 'two', now: 5 } },
  { time: 6, event: { type: 'source.complete', now: 6 } },
];
export const windowTimeOverlapExample: readonly TimedEvent<WindowTimeEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe', now: 0 } },
  { time: 0, event: { type: 'window.subscribe', observerId: 'A', windowId: 0, now: 0 } },
  { time: 1, event: { type: 'source.next', value: 'one', now: 1 } },
  { time: 2, event: { type: 'timer.creation', resource: { id: 'windowCreation', generation: 0 }, tick: 0, now: 2 } },
  { time: 2, event: { type: 'window.subscribe', observerId: 'B', windowId: 1, now: 2 } },
  { time: 3, event: { type: 'source.next', value: 'two', now: 3 } },
  { time: 4, event: { type: 'timer.creation', resource: { id: 'windowCreation', generation: 0 }, tick: 1, now: 4 } },
  { time: 5, event: { type: 'source.complete', now: 5 } },
];
export const windowTimeGapExample: readonly TimedEvent<WindowTimeEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe', now: 0 } },
  { time: 0, event: { type: 'window.subscribe', observerId: 'A', windowId: 0, now: 0 } },
  { time: 1, event: { type: 'source.next', value: 'first', now: 1 } },
  { time: 2, event: { type: 'timer.window', resource: { id: 'windowClose', generation: 0 }, now: 2 } },
  { time: 3, event: { type: 'source.next', value: 'gap', now: 3 } },
  { time: 4, event: { type: 'timer.creation', resource: { id: 'windowCreation', generation: 0 }, tick: 0, now: 4 } },
  { time: 4, event: { type: 'window.subscribe', observerId: 'B', windowId: 1, now: 4 } },
  { time: 5, event: { type: 'source.next', value: 'last', now: 5 } },
  { time: 6, event: { type: 'source.complete', now: 6 } },
];
export const windowTimeCancelExample: readonly TimedEvent<WindowTimeEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe', now: 0 } },
  { time: 0, event: { type: 'window.subscribe', observerId: 'A', windowId: 0, now: 0 } },
  { time: 1, event: { type: 'source.next', value: 'last', now: 1 } },
  { time: 2, event: { type: 'cancel', now: 2 } },
  { time: 3, event: { type: 'window.subscribe', observerId: 'late', windowId: 0, now: 3 } },
  { time: 4, event: { type: 'window.unsubscribe', observerId: 'A', now: 4 } },
  { time: 4, event: { type: 'window.unsubscribe', observerId: 'late', now: 4 } },
];
