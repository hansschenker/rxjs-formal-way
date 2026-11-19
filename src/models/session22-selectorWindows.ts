import type { Action, Notification, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { acquire, emit, failWith, finish, invoke, natural, release, sessionMetadata, sourceRef } from './session21-common.js';

export type SelectorWindowKind = 'windowToggle' | 'windowWhen';
export type SelectorWindowParameters = Readonly<{ operator: SelectorWindowKind; closingInput: 'Observable' }>;
export type SelectorWindowRecord = Readonly<{
  id: number; status: 'open' | 'complete' | 'error' | 'invalid'; closingLive: boolean;
}>;
export type SelectorWindowConsumer = Readonly<{ observerId: string; windowId: number }>;
export type SelectorWindowMemory = Readonly<{
  nextId: number; sourceLive: boolean; openingsLive: boolean; pending?: number;
  windows: readonly SelectorWindowRecord[];
  consumers: readonly SelectorWindowConsumer[]; usedObservers: readonly string[];
}>;
export type SelectorWindowState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (SelectorWindowMemory & Readonly<{ phase: 'Active' | 'Selecting' }>)
  | (SelectorWindowMemory & Readonly<{ phase: 'Stopped'; reason: 'complete' | 'error' | 'cancel'; error?: unknown }>);
export type SelectorWindowEvent<T, O = unknown> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' | 'openings.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error' | 'openings.error' | 'callback.throw'; error: unknown }>
  | Readonly<{ type: 'openings.next'; value: O }>
  | Readonly<{ type: 'callback.return' }>
  | Readonly<{ type: 'closing.next' | 'closing.complete'; windowId: number }>
  | Readonly<{ type: 'closing.error'; windowId: number; error: unknown }>
  | Readonly<{ type: 'window.subscribe'; windowId: number; observerId: string }>
  | Readonly<{ type: 'window.unsubscribe'; observerId: string }>;
export type SelectorWindowModel<T, O = unknown> = OperatorModel<
  SelectorWindowParameters, SelectorWindowState, SelectorWindowEvent<T, O>, Action<unknown>
>;

const ref = (id: string, generation: number): ResourceRef => ({ id, generation });
const openingRef = ref('openings', 0);
const closingRef = (id: number): ResourceRef => ref('closing', id);
const childRef = (id: string): ResourceRef => ref('windowObserver:' + id, 0);
const childNotification = (id: string, notification: Notification<unknown>): Action<unknown> =>
  ({ type: 'notify', target: 'windowObserver:' + id, notification });
const present = (s: SelectorWindowState): s is Exclude<SelectorWindowState, { phase: 'Unsubscribed' }> =>
  s.phase !== 'Unsubscribed';
const windowOf = (s: SelectorWindowMemory, id: number): SelectorWindowRecord | undefined =>
  natural(id) ? s.windows.find(x => x.id === id) : undefined;
const newObserver = (s: SelectorWindowMemory, observerId: string): boolean =>
  typeof observerId === 'string' && !!observerId.trim() && !s.usedObservers.includes(observerId);
const openWindows = (s: SelectorWindowMemory): readonly SelectorWindowRecord[] =>
  s.windows.filter(w => w.status === 'open');
const notifyWindow = (s: SelectorWindowMemory, id: number, notification: Notification<never>): readonly Action<unknown>[] =>
  s.consumers.filter(c => c.windowId === id).flatMap(c => [
    childNotification(c.observerId, notification), release(childRef(c.observerId)),
  ]);
const closeResources = (s: SelectorWindowMemory): Action<unknown>[] => [
  ...(s.sourceLive ? [release(sourceRef)] : []),
  ...(s.openingsLive ? [release(openingRef)] : []),
  ...s.windows.filter(w => w.closingLive).map(w => release(closingRef(w.id))),
];
const liveStatus = (s: SelectorWindowMemory, reason: 'complete' | 'error' | 'cancel', toggle: boolean) =>
  s.windows.map(w => w.status === 'open' ?
    { ...w, closingLive: false, status: reason === 'cancel' ? (toggle ? 'invalid' as const : 'open' as const) : reason } : w);
const stop = (s: SelectorWindowMemory, reason: 'complete' | 'error' | 'cancel', toggle: boolean, error?: unknown): SelectorWindowState => ({
  ...s, phase: 'Stopped', reason,
  ...(reason === 'error' ? { error } : {}),
  sourceLive: false, openingsLive: false, pending: undefined,
  windows: liveStatus(s, reason, toggle),
  consumers: reason === 'cancel' ? s.consumers : [],
});

export function createSelectorWindowModel<T, O = unknown>(operator: SelectorWindowKind): SelectorWindowModel<T, O> {
  const toggle = operator === 'windowToggle';
  const p: SelectorWindowParameters = { operator, closingInput: 'Observable' };
  type S = SelectorWindowState;
  type E = SelectorWindowEvent<T, O>;
  type R = Rule<SelectorWindowParameters, S, E, Action<unknown>>;
  const rules: R[] = [];
  const add = (
    id: string, from: S['phase'], event: E['type'], to: S['phase'], guard: string,
    actions: readonly string[], nextState: string, explanation: string,
    enabled: (s: S, e: E) => boolean,
    react: (s: S, e: E) => Readonly<{ state: S; actions: readonly Action<unknown>[] }>,
  ): void => rules.push({
    description: { id: 'S22-' + operator.toUpperCase() + '-' + id, from, event, to, guard, actions,
      nextState, explanation, obligations: ['S22-' + operator.toUpperCase() + '-' + id] },
    enabled, react,
  });
  const selecting = (s: SelectorWindowState): s is Extract<SelectorWindowState,{phase:'Active'|'Selecting'}> =>
    s.phase === 'Active' || s.phase === 'Selecting';
  const terminal = (s: SelectorWindowMemory, reason: 'complete' | 'error' | 'cancel', error?: unknown): readonly Action<unknown>[] => {
    const notification = reason === 'complete' ? { kind: 'C' as const } : { kind: 'E' as const, error };
    return [
      ...(reason === 'cancel' ? [] : openWindows(s).flatMap(w => notifyWindow(s, w.id, notification))),
      ...(reason === 'complete' ? [finish] : reason === 'error' ? [failWith(error)] : []),
      ...closeResources(s),
    ];
  };

  add('START', 'Unsubscribed', 'subscribe', toggle ? 'Active' : 'Selecting',
    'new result subscriber; no prior source connection',
    toggle ? ['subscribe openings first', 'subscribe source second'] :
      ['emit first live handle before source', 'invoke initial closing selector'],
    toggle ? 'No windows exist until opening notification arrives.' :
      'First handle is already published; selector must return its closing Observable before source acquisition.',
    'Both exports are cold. The order of opening/closing setup is observable and must not be rearranged.',
    s => s.phase === 'Unsubscribed',
    () => toggle ? {
      state: { phase: 'Active', nextId: 0, windows: [], consumers: [], usedObservers: [],
        sourceLive: true, openingsLive: true },
      actions: [acquire(openingRef), acquire(sourceRef)],
    } : {
      state: { phase: 'Selecting', nextId: 1, windows: [{ id: 0, status: 'open', closingLive: false }],
        consumers: [], usedObservers: [], pending: 0, sourceLive: false, openingsLive: false },
      actions: [emit({ windowId: 0 }), invoke('selector', 0, undefined)],
    });

  if (toggle) {
    add('OPENINGS-NEXT', 'Active', 'openings.next', 'Selecting',
      'openings subscription live, next window id is safe',
      ['construct new Subject', 'invoke closingSelector(openingValue) before publishing handle'],
      'New window is open internally but not yet published until selector succeeds.',
      'The opening payload goes to the selector, not to downstream. Selector errors abort before window announcement.',
      s => s.phase === 'Active' && s.openingsLive && s.nextId < Number.MAX_SAFE_INTEGER,
      (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'openings.next') throw Error('expected opening next');
        const id = s.nextId;
        return { state: { ...s, phase: 'Selecting', nextId: id + 1, pending: id,
          windows: [...s.windows, { id, status: 'open', closingLive: false }] },
          actions: [invoke('selector', id, e.value)] };
      });
    add('OPENINGS-COMPLETE', 'Active', 'openings.complete', 'Active',
      'opening subscription live',
      ['release openings only'],
      'Existing windows and source continue without further opening opportunities.',
      'Completion of the opening stream is not completion of the windowToggle output.',
      s => s.phase === 'Active' && s.openingsLive,
      s => { if (s.phase !== 'Active') throw Error('expected opener complete');
        return { state: { ...s, openingsLive: false }, actions: [release(openingRef)] }; });
    add('OPENINGS-ERROR', 'Active', 'openings.error', 'Stopped',
      'opening subscription live',
      ['error every open child, then outer', 'release source/openings/closings'],
      'All live windows terminate with error; completed windows stay completed.',
      'Errors are forwarded without buffer-like flush semantics.',
      s => s.phase === 'Active' && s.openingsLive,
      (s, e) => { if (s.phase !== 'Active' || e.type !== 'openings.error') throw Error('expected opener error');
        return { state: stop(s, 'error', true, e.error), actions: terminal(s, 'error', e.error) }; });
  }

  add('SELECTOR-RETURN', 'Selecting', 'callback.return', 'Active',
    'one pending selector invocation has produced an Observable',
    toggle ? ['publish new window handle', 'subscribe its closing Observable'] :
      ['subscribe new closing Observable', 'subscribe source when first window is initialized'],
    'Current window now owns a live closing subscription.',
    toggle ? 'windowToggle calls selector before emitting, then subscribes to the closing notifier after emitting.' :
      'windowWhen emits the window first, then selects/subscribes its notifier; source connects only after the first closing selection.',
    s => s.phase === 'Selecting' && s.pending !== undefined,
    s => {
      if (s.phase !== 'Selecting' || s.pending === undefined) throw Error('expected selector outcome');
      const id = s.pending;
      return { state: { ...s, phase: 'Active', pending: undefined, sourceLive: true,
        windows: s.windows.map(w => w.id === id ? { ...w, closingLive: true } : w) },
        actions: toggle ? [emit({ windowId: id }), acquire(closingRef(id))] :
          [acquire(closingRef(id)), ...(s.sourceLive ? [] : [acquire(sourceRef)])] };
    });

  add('SELECTOR-THROW', 'Selecting', 'callback.throw', 'Stopped',
    'one pending selector invocation throws',
    ['error attached consumers of all open windows', 'error outer with same error identity', 'release all live subscriptions'],
    'No new window is announced if toggle selector failed; when selector failed after announcing, its handle receives error.',
    'The failure is correlated to the currently pending selector generation and terminates the entire result.',
    s => s.phase === 'Selecting' && s.pending !== undefined,
    (s, e) => { if (s.phase !== 'Selecting' || e.type !== 'callback.throw') throw Error('expected selector failure');
      return { state: stop(s, 'error', toggle, e.error), actions: terminal(s, 'error', e.error) }; });

  add('SOURCE-NEXT', 'Active', 'source.next', 'Active',
    'source subscription live, all callbacks resolved',
    ['deliver original payload to each currently open window observer'],
    'No values are buffered or replayed; windows remain open.',
    'Overlapping toggle windows each receive the same source value. windowWhen owns at most one open window.',
    s => s.phase === 'Active' && s.sourceLive,
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'source.next') throw Error('expected source next');
      return { state: s, actions: openWindows(s).flatMap(w =>
        s.consumers.filter(c => c.windowId === w.id).map(c => childNotification(c.observerId, { kind: 'N', value: e.value }))) }; });

  add('SOURCE-COMPLETE', 'Active', 'source.complete', 'Stopped',
    'source is live',
    ['complete all current window observers before outer completion', 'release all owned resources'],
    'All open windows now remember completion; prior completed handles stay completed.',
    'No fresh window is opened on terminal source completion.',
    s => s.phase === 'Active' && s.sourceLive,
    s => { if (s.phase !== 'Active') throw Error('expected source complete');
      return { state: stop(s, 'complete', toggle), actions: terminal(s, 'complete') }; });

  for (const type of ['source.error', 'closing.error'] as const) {
    add(type === 'source.error' ? 'SOURCE-ERROR' : 'CLOSING-ERROR', 'Active', type, 'Stopped',
      type === 'source.error' ? 'source live' : 'addressed window owns a live closing notifier',
      ['error all currently open child observers before outer', 'dispose source and notifiers'],
      'Terminal failures preserve original identity and discard all outstanding live-window obligations.',
      'A single closing notifier failure fails the entire operator, not only its own window.',
      (s, e) => s.phase === 'Active' &&
        (type === 'source.error' ? s.sourceLive :
          e.type === 'closing.error' && natural(e.windowId) && windowOf(s, e.windowId)?.closingLive === true),
      (s, e) => { if (s.phase !== 'Active' || (e.type !== 'source.error' && e.type !== 'closing.error')) throw Error('expected error');
        return { state: stop(s, 'error', toggle, e.error), actions: terminal(s, 'error', e.error) }; });
  }

  add('CANCEL-ACTIVE', 'Active', 'cancel', 'Stopped',
    'outer result is connected',
    ['unsubscribe source and notifiers without output'],
    toggle ? 'Current open Subjects are invalidated by windowToggle finalizer; existing child subscriptions remain orphaned.' :
      'Current window Subject is left open and silent after windowWhen finalization; child observers remain orphaned.',
    'Neither cancellation path invents next, complete or error.',
    s => s.phase === 'Active',
    s => { if (s.phase !== 'Active') throw Error('expected cancel');
      return { state: stop(s, 'cancel', toggle), actions: terminal(s, 'cancel') }; });

  add('CANCEL-SELECTING', 'Selecting', 'cancel', 'Stopped',
    'cancellation checkpoint between selector call and supplied outcome',
    ['unsubscribe currently connected inputs silently'],
    'Previously emitted/attached child consumers do not receive synthetic completion.',
    'This state is an explicit formal microstep, not cancellation inside executing JS callback.',
    s => s.phase === 'Selecting',
    s => { if (s.phase !== 'Selecting') throw Error('expected cancel selecting');
      return { state: stop(s, 'cancel', toggle), actions: terminal(s, 'cancel') }; });

  const closingEnabled = (s: S, e: E): boolean => s.phase === 'Active' &&
    (e.type === 'closing.next' || e.type === 'closing.complete') &&
    natural(e.windowId) && windowOf(s, e.windowId)?.closingLive === true;
  for (const type of ['closing.next', 'closing.complete'] as const) {
    if (toggle && type === 'closing.complete') {
      add('CLOSING-COMPLETE', 'Active', type, 'Active',
        'closing Observable completed without next',
        ['release its own closing subscription only'],
        'Window remains open until source terminal, rather than closing on notifier completion.',
        'toggle closing completion does not act as a rotation signal.',
        closingEnabled,
        (s, e) => { if (s.phase !== 'Active' || e.type !== 'closing.complete') throw Error('expected toggle closing complete');
          return { state: { ...s, windows: s.windows.map(w => w.id === e.windowId ? { ...w, closingLive: false } : w) },
            actions: [release(closingRef(e.windowId))] }; });
    } else if (toggle) {
      add('CLOSING-NEXT', 'Active', type, 'Active',
        'addressed window has a live closing notifier',
        ['complete only that window', 'release only that closing notifier subscription'],
        'Other overlapping windows and their observers stay live.',
        'closing.next ends its own window, not all windows. No buffer array is emitted downstream.',
        closingEnabled,
        (s, e) => { if (s.phase !== 'Active' || e.type !== 'closing.next') throw Error('expected toggle closing next');
          return { state: { ...s,
              windows: s.windows.map(w => w.id === e.windowId ? { ...w, status: 'complete', closingLive: false } : w),
              consumers: s.consumers.filter(c => c.windowId !== e.windowId) },
            actions: [...notifyWindow(s, e.windowId, { kind: 'C' }), release(closingRef(e.windowId))] }; });
    } else {
      add(type === 'closing.next' ? 'CLOSING-NEXT' : 'CLOSING-COMPLETE',
        'Active', type, 'Selecting', 'current closing Observable not yet consumed',
        ['complete old window', 'cancel previous closing notifier', 'emit next window', 'invoke fresh closing selector'],
        'The prior window is completed and a new one is published immediately; selector awaits a fresh Observable.',
        'windowWhen treats BOTH closing next and closing completion as rotation signals, unlike windowToggle.',
        closingEnabled,
        (s, e) => { if (s.phase !== 'Active' || (e.type !== 'closing.next' && e.type !== 'closing.complete')) throw Error('expected when closing');
          const id = s.nextId;
          return { state: { ...s, phase: 'Selecting', pending: id, nextId: id + 1,
              windows: [...s.windows.map(w => w.id === e.windowId ? { ...w, status: 'complete' as const, closingLive: false } : w),
                { id, status: 'open' as const, closingLive: false }],
              consumers: s.consumers.filter(c => c.windowId !== e.windowId) },
            actions: [release(closingRef(e.windowId)), ...notifyWindow(s, e.windowId, { kind: 'C' }),
              emit({ windowId: id }), invoke('selector', id, undefined)] }; });
    }
  }

  for (const phase of ['Active', 'Selecting', 'Stopped'] as const) {
    add('OBSERVE-OPEN-' + phase.toUpperCase(), phase, 'window.subscribe', phase,
      'fresh consumer ID references an open window, which after stop is legal only for windowWhen cancellation',
      ['connect one live child observer without replay or another source connection'],
      'The same Subject is shared by all consumers of that window.',
      'An observer connecting to a live window does not start or preserve the source.',
      (s, e) => s.phase === phase && e.type === 'window.subscribe' && newObserver(s, e.observerId) &&
        windowOf(s, e.windowId)?.status === 'open',
      (s, e) => { if (!present(s) || e.type !== 'window.subscribe') throw Error('expected child subscribe');
        return { state: { ...s, consumers: [...s.consumers, { observerId: e.observerId, windowId: e.windowId }],
          usedObservers: [...s.usedObservers, e.observerId] }, actions: [acquire(childRef(e.observerId))] }; });
    add('OBSERVE-COMPLETE-' + phase.toUpperCase(), phase, 'window.subscribe', phase,
      'fresh consumer references a completed prior window',
      ['subscribe child, immediately notify completion then teardown'],
      'Completed Subject remembers terminal status but does not replay values.',
      'A late window observer does not restart source or reenter selector.',
      (s, e) => s.phase === phase && e.type === 'window.subscribe' && newObserver(s, e.observerId) &&
        windowOf(s, e.windowId)?.status === 'complete',
      (s, e) => { if (!present(s) || e.type !== 'window.subscribe') throw Error('expected completed child');
        return { state: { ...s, usedObservers: [...s.usedObservers, e.observerId] },
          actions: [acquire(childRef(e.observerId)), childNotification(e.observerId, { kind: 'C' }), release(childRef(e.observerId))] }; });
    if (phase === 'Stopped') {
      add('OBSERVE-ERROR-STOPPED', 'Stopped', 'window.subscribe', 'Stopped',
        'fresh consumer references a window that failed during termination',
        ['subscribe child, immediately notify same retained error and release'],
        'Failure remains available to late child subscribers without value replay.',
        'This rule is legal only after source/openings/closing/selector failure.',
        (s, e) => s.phase === 'Stopped' && s.reason === 'error' && e.type === 'window.subscribe' &&
          newObserver(s, e.observerId) && windowOf(s, e.windowId)?.status === 'error',
        (s, e) => { if (s.phase !== 'Stopped' || e.type !== 'window.subscribe') throw Error('expected late error');
          return { state: { ...s, usedObservers: [...s.usedObservers, e.observerId] },
            actions: [acquire(childRef(e.observerId)),
              childNotification(e.observerId, { kind: 'E', error: s.error }), release(childRef(e.observerId))] }; });
    }
    add('OBSERVER-CANCEL-' + phase.toUpperCase(), phase, 'window.unsubscribe', phase,
      'named live child subscription is active',
      ['teardown only the named child observer'],
      'Source and peer child ownership is unchanged.',
      'An orphaned child subscriber after cancellation can still close itself.',
      (s, e) => s.phase === phase && e.type === 'window.unsubscribe' &&
        s.consumers.some(c => c.observerId === e.observerId),
      (s, e) => { if (!present(s) || e.type !== 'window.unsubscribe') throw Error('expected child unsubscribe');
        return { state: { ...s, consumers: s.consumers.filter(c => c.observerId !== e.observerId) },
          actions: [release(childRef(e.observerId))] }; });
  }

  const basis = sessionMetadata({
    operator,
    id: operator + '-observable-selector',
    purpose: toggle ? 'Publish live overlapping windows driven by openings and their independent closing selectors.' :
      'Publish successive nonoverlapping live windows; each fresh notifier next or completion closes and replaces the current window.',
    signature: toggle ?
      'windowToggle : (OpeningSignal, OpeningValue → ClosingSignal) → T* → Observable<T>*' :
      'windowWhen : (() → ClosingSignal) → T* → Observable<T>*',
    conditions: toggle ? [
      'Each opening invokes a selector, then publishes one window and connects its own closing notifier.',
      'The first closing next completes only its window; closing completion without next does not close it.',
      'Source values flow to all currently open windows; source complete/error closes or errors each before the outer.',
    ] : [
      'The first window handle is published before source connection, then each closing notifier is selected and connected.',
      'Either closing next or closing complete immediately rotates to a fresh window and selects its new closing notifier.',
      'Each source value flows only into the current window; source complete/error propagates first to inner then outer.',
    ],
    parameters: toggle ? 'One Observable openings stream; valid Observable closing selector result per opening.' :
      'Valid Observable closing selector result per window, no scheduler.',
    callbacks: 'Closing selector invocation and its explicit return/throw are correlated microsteps; callback bodies not executed by model.',
    time: 'Source and notifier events supply ordering; no clock or scheduler is introduced. Equal-time dispatch order must be supplied.',
    sharing: 'The outer is cold, independent per result subscription. Each emitted window is a live shared Subject without replay.',
    reentrancy: 'Atomic ordered post-initialization reactions; selector return/throw represented as explicit correlated input. Synchronous notifier emissions during subscribe and callback reentrancy are excluded.',
    initialization: toggle ? 'Acquire openings first, then source. No initial window.' :
      'Emit initial live window, invoke selector, subscribe closing, then acquire source after selection.',
    exclusions: ['Promise/Iterable closing conversions, invalid notifier inputs, immediate synchronous closings during setup.',
      'Reentrant closingSelector and observer callbacks, downstream cancellation inside an action word.',
      'Subject prototype identity and imperative Subject.next/error/complete access (Observable-facing profile only).',
      'Finite tests do not imply unrestricted equivalence.'],
    controls: ['Unsubscribed', 'Active', 'Selecting', 'Stopped'],
    testStem: 'session22-selectorWindows',
    resources: [
      ...(toggle ? [{ id: 'openings', kind: 'subscription' as const, owner: 'outer result' }] : []),
      { id: 'closing:*', kind: 'subscription', owner: 'selected active window' },
      { id: 'selector', kind: 'callback', owner: 'window selection' },
      { id: 'windowObserver:*', kind: 'subscription', owner: 'independent child observer' },
    ],
    inputs: [
      { type: 'callback.return', origin: 'callback', category: 'callback', description: 'The pending selector returned a valid Observable.' },
      { type: 'callback.throw', origin: 'callback', category: 'callback', description: 'The pending selector threw.' },
      { type: 'closing.next', origin: 'inner', category: 'notification', description: 'Addressed window closing Observable produced a value.' },
      { type: 'closing.complete', origin: 'inner', category: 'notification', description: 'Addressed window closing Observable finished with no prior next.' },
      { type: 'closing.error', origin: 'inner', category: 'notification', description: 'Addressed window closing Observable failed.' },
      { type: 'window.subscribe', origin: 'inner', category: 'lifecycle', description: 'Independent consumer attaches to retained handle.' },
      { type: 'window.unsubscribe', origin: 'inner', category: 'lifecycle', description: 'Named child observer closes.' },
      ...(toggle ? [
        { type: 'openings.next', origin: 'outer' as const, category: 'notification' as const, description: 'Opening stream begins a new window.' },
        { type: 'openings.complete', origin: 'outer' as const, category: 'notification' as const, description: 'Opening stream finishes; source remains live.' },
        { type: 'openings.error', origin: 'outer' as const, category: 'notification' as const, description: 'Opening stream fails.' },
      ] : []),
    ],
    actionTypes: ['subscribe', 'unsubscribe', 'notify', 'invoke-callback'],
    additionalSources: ['src/internal/Subject.ts', 'src/internal/operators/OperatorSubscriber.ts'],
  });
  return {
    metadata: { ...basis,
      controls: basis.controls.map(c => c.id === 'Stopped' ?
        { ...c, terminal: false, description: 'Outer stopped, but completed historical handles and orphaned consumer subscriptions may still be observable.' } : c),
      evidence: { ...basis.evidence, modelTests: ['tests/session22-selectorWindows-model.test.mjs'],
        runtimeTests: ['tests/session22-selectorWindows-rxjs.test.mjs'],
        record: 'evidence/SESSION-22.md', scenarios: 'docs/SESSION-22-SELECTOR-WINDOWS.md', coverage: 'docs/SESSION-22-SELECTOR-WINDOWS.md' } },
    parameters: p, rules, initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => {
      if (!present(s)) return [];
      const errors: string[] = [];
      if (!natural(s.nextId) || s.windows.length !== s.nextId ||
          s.windows.some((w,i) => w.id !== i || !['open','complete','error','invalid'].includes(w.status) ||
            (w.status !== 'open' && w.closingLive)))
        errors.push('Window identity, status and closing lease are inconsistent.');
      if (s.phase === 'Selecting' && (s.pending === undefined || windowOf(s, s.pending)?.status !== 'open' ||
          windowOf(s, s.pending)?.closingLive)) errors.push('Selecting must own an unconnected pending open window.');
      if (s.phase === 'Active' && s.pending !== undefined)
        errors.push('Active execution cannot retain pending selector ID.');
      if (s.phase !== 'Stopped' && s.windows.some(w => w.status === 'error' || w.status === 'invalid'))
        errors.push('Only terminated windows can be failed or invalidated.');
      if (s.phase !== 'Stopped' && !toggle && openWindows(s).length !== 1)
        errors.push('windowWhen must have exactly one current open window.');
      if (s.phase === 'Stopped' && (s.sourceLive || s.openingsLive || s.windows.some(w => w.closingLive)))
        errors.push('Stopped result cannot retain upstream resources.');
      if (s.phase === 'Stopped' && s.reason !== 'cancel' && s.consumers.length)
        errors.push('Error/completion must close all attached child observers.');
      if (new Set(s.usedObservers).size !== s.usedObservers.length ||
          s.usedObservers.some(id => typeof id !== 'string' || !id.trim()))
        errors.push('Child observer IDs must be unique nonempty strings.');
      if (new Set(s.consumers.map(c => c.observerId)).size !== s.consumers.length ||
          s.consumers.some(c => !s.usedObservers.includes(c.observerId) ||
            !['open','invalid'].includes(windowOf(s, c.windowId)?.status ?? 'missing')))
        errors.push('Open or orphaned child observer registry malformed.');
      return errors;
    },
    validateReaction: (_before, e, reaction) => [
      ...validateActionWord(reaction.actions),
      ...(e.type === 'cancel' && reaction.actions.some(a => a.type === 'notify') ?
        ['Cancellation cannot notify child or outer observers.'] : []),
      ...(e.type === 'source.next' && reaction.actions.some(a =>
        a.type === 'notify' && a.target === 'downstream') ? ['Source values may notify children, not the outer handle stream.'] : []),
      ...(e.type === 'window.unsubscribe' && reaction.actions.some(a =>
        a.type !== 'unsubscribe' || a.resource.id !== 'windowObserver:' + e.observerId) ?
        ['A window observer can only close its own subscription.'] : []),
    ],
  };
}
export const createWindowToggleModel = <T,O=unknown>(): SelectorWindowModel<T,O> =>
  createSelectorWindowModel<T,O>('windowToggle');
export const createWindowWhenModel = <T>(): SelectorWindowModel<T> =>
  createSelectorWindowModel<T,unknown>('windowWhen');

export const windowToggleExample: readonly TimedEvent<SelectorWindowEvent<string,string>>[] = [
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'openings.next',value:'first'}},
  {time:1,event:{type:'callback.return'}},
  {time:1,event:{type:'window.subscribe',windowId:0,observerId:'A'}},
  {time:2,event:{type:'source.next',value:'one'}},
  {time:3,event:{type:'openings.next',value:'second'}},
  {time:3,event:{type:'callback.return'}},
  {time:3,event:{type:'window.subscribe',windowId:1,observerId:'B'}},
  {time:4,event:{type:'source.next',value:'two'}},
  {time:5,event:{type:'closing.next',windowId:0}},
  {time:6,event:{type:'source.next',value:'three'}},
  {time:7,event:{type:'source.complete'}},
];
export const windowToggleCompleteExample: readonly TimedEvent<SelectorWindowEvent<string,string>>[] = [
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'openings.next',value:'first'}},
  {time:1,event:{type:'callback.return'}},
  {time:1,event:{type:'window.subscribe',windowId:0,observerId:'A'}},
  {time:2,event:{type:'closing.complete',windowId:0}},
  {time:3,event:{type:'openings.complete'}},
  {time:4,event:{type:'source.next',value:'still-open'}},
  {time:5,event:{type:'source.complete'}},
];
export const windowWhenExample: readonly TimedEvent<SelectorWindowEvent<string>>[] = [
  {time:0,event:{type:'subscribe'}},
  {time:0,event:{type:'window.subscribe',windowId:0,observerId:'A'}},
  {time:0,event:{type:'callback.return'}},
  {time:1,event:{type:'source.next',value:'one'}},
  {time:2,event:{type:'closing.next',windowId:0}},
  {time:2,event:{type:'window.subscribe',windowId:1,observerId:'B'}},
  {time:2,event:{type:'callback.return'}},
  {time:3,event:{type:'source.next',value:'two'}},
  {time:4,event:{type:'source.complete'}},
];
export const windowWhenCompleteExample: readonly TimedEvent<SelectorWindowEvent<string>>[] = [
  {time:0,event:{type:'subscribe'}},
  {time:0,event:{type:'callback.return'}},
  {time:1,event:{type:'closing.complete',windowId:0}},
  {time:1,event:{type:'window.subscribe',windowId:1,observerId:'A'}},
  {time:1,event:{type:'callback.return'}},
  {time:2,event:{type:'source.next',value:'two'}},
  {time:3,event:{type:'cancel'}},
  {time:4,event:{type:'window.subscribe',windowId:1,observerId:'late'}},
  {time:5,event:{type:'window.unsubscribe',observerId:'A'}},
  {time:5,event:{type:'window.unsubscribe',observerId:'late'}},
];
