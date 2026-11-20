import type { Action, Notification, OperatorModel, ResourceRef, Rule, TimedEvent, Trace } from '../schema.js';
import { runTrace, validateActionWord } from '../runner.js';
import { acquire, emit, failWith, finish, invoke, natural, release, sameResource, sessionMetadata, sourceRef } from './session21-common.js';

export type ToggleWindowToken = Readonly<{ windowId: number }>;
export type ToggleWindowRecord = Readonly<{
  windowId: number; status: 'pending' | 'open' | 'complete' | 'error' | 'disposed';
  announced: boolean; closingLive: boolean; error?: unknown;
}>;
export type ToggleWindowConsumer = Readonly<{ observerId: string; windowId: number }>;
export type WindowToggleParameters = Readonly<{ closing: 'valid-Observable-result'; setup: 'post-setup-notifications' }>;
export type WindowToggleMemory = Readonly<{
  nextWindowId: number; openingLive: boolean; windows: readonly ToggleWindowRecord[];
  consumers: readonly ToggleWindowConsumer[]; usedObservers: readonly string[];
}>;
export type WindowToggleStop = 'source-complete' | 'source-error' | 'opening-error' | 'closing-error' | 'selector-error' | 'cancel';
export type WindowToggleState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (WindowToggleMemory & Readonly<{ phase: 'Active' }>)
  | (WindowToggleMemory & Readonly<{ phase: 'Selecting'; pending: number }>)
  | (WindowToggleMemory & Readonly<{ phase: 'Stopped'; reason: WindowToggleStop }>);
export type WindowToggleEvent<T, O = unknown> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' | 'opening.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'opening.next'; value: O }>
  | Readonly<{ type: 'source.error' | 'opening.error'; error: unknown }>
  | Readonly<{ type: 'selector.return'; resource: ResourceRef }>
  | Readonly<{ type: 'selector.throw'; resource: ResourceRef; error: unknown }>
  | Readonly<{ type: 'closing.next' | 'closing.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'closing.error'; resource: ResourceRef; error: unknown }>
  | Readonly<{ type: 'window.subscribe'; observerId: string; windowId: number }>
  | Readonly<{ type: 'window.unsubscribe'; observerId: string }>;
export type WindowToggleModel<T, O = unknown> = OperatorModel<WindowToggleParameters, WindowToggleState, WindowToggleEvent<T, O>, Action<unknown>>;

const openingRef: ResourceRef = { id: 'opening', generation: 0 };
const closingRef = (id: number): ResourceRef => ({ id: 'closing', generation: id });
const selectorRef = (id: number): ResourceRef => ({ id: 'closingSelector', generation: id });
const observerRef = (id: string): ResourceRef => ({ id: 'windowObserver:' + id, generation: 0 });
const notify = (id: string, notification: Notification<unknown>): Action<unknown> =>
  ({ type: 'notify', target: observerRef(id).id, notification });
const hasMemory = (s: WindowToggleState): s is Exclude<WindowToggleState, { phase: 'Unsubscribed' }> => s.phase !== 'Unsubscribed';
const at = (s: WindowToggleMemory, id: number): ToggleWindowRecord | undefined => natural(id) ? s.windows[id] : undefined;
const fresh = (s: WindowToggleMemory, id: string): boolean => typeof id === 'string' && !!id.trim() && !s.usedObservers.includes(id);
const endConsumers = (s: WindowToggleMemory, id: number, terminal: Notification<never>): readonly Action<unknown>[] =>
  s.consumers.filter(c => c.windowId === id).flatMap(c => [notify(c.observerId, terminal), release(observerRef(c.observerId))]);
const endWindows = (s: WindowToggleMemory, terminal: Notification<never>): readonly Action<unknown>[] =>
  s.windows.filter(w => w.status === 'open').flatMap(w => endConsumers(s, w.windowId, terminal));
const detachInputs = (s: WindowToggleMemory): readonly Action<unknown>[] => [
  ...(s.openingLive ? [release(openingRef)] : []), release(sourceRef),
  ...s.windows.filter(w => w.closingLive).map(w => release(closingRef(w.windowId))),
];
const stop = (s: WindowToggleMemory, reason: WindowToggleStop, error?: unknown): WindowToggleState => {
  const disposal = reason === 'cancel' || reason === 'opening-error';
  return { phase: 'Stopped', reason, nextWindowId: s.nextWindowId, openingLive: false,
    usedObservers: s.usedObservers, consumers: disposal ? s.consumers : [],
    windows: s.windows.map(w => w.status === 'complete' ? w : {
      ...w, closingLive: false,
      status: disposal ? 'disposed' : reason === 'source-complete' ? 'complete' : 'error',
      ...(!disposal && reason !== 'source-complete' ? { error } : {}),
    }),
  };
};

/** Events describe actual external notifications and synchronous selector outcomes; no effect runs here. */
export function createWindowToggleModel<T, O = unknown>(): WindowToggleModel<T, O> {
  type S = WindowToggleState; type E = WindowToggleEvent<T, O>;
  const rules: Rule<WindowToggleParameters, S, E, Action<unknown>>[] = [];
  const add = (name: string, from: S['phase'], event: E['type'], to: S['phase'], guard: string,
    actions: readonly string[], nextState: string, explanation: string,
    enabled: (s: S, e: E) => boolean,
    react: (s: S, e: E) => Readonly<{ state: S; actions: readonly Action<unknown>[] }>): void => {
    const id = 'S22-WINDOWTOGGLE-' + name;
    rules.push({ description: { id, from, event, to, guard, actions, nextState, explanation, obligations: [id] }, enabled, react });
  };
  const matchingSelector = (s: S, e: E): boolean => s.phase === 'Selecting' &&
    (e.type === 'selector.return' || e.type === 'selector.throw') && sameResource(e.resource, selectorRef(s.pending));
  const closingWindow = (s: S, e: E): ToggleWindowRecord | undefined =>
    s.phase === 'Active' && (e.type === 'closing.next' || e.type === 'closing.complete' || e.type === 'closing.error') &&
    e.resource.id === 'closing' ? at(s, e.resource.generation) : undefined;
  const liveClosing = (s: S, e: E): boolean => closingWindow(s, e)?.closingLive === true;

  add('START', 'Unsubscribed', 'subscribe', 'Active', 'first result connection',
    ['subscribe opening signal', 'subscribe source; emit no initial window'],
    'Active, no windows or consumers; opening signal is live.',
    'Openings are acquired before source. Construction is inert; only opening next can request a window.',
    s => s.phase === 'Unsubscribed', () => ({ state: { phase: 'Active', nextWindowId: 0, openingLive: true,
      windows: [], consumers: [], usedObservers: [] }, actions: [acquire(openingRef), acquire(sourceRef)] }));
  add('OPEN', 'Active', 'opening.next', 'Selecting', 'opening signal is live and next identity can advance safely',
    ['create unannounced window record', 'invoke closingSelector with exact opening payload'],
    'Selecting with one pending window identity; no handle has been emitted for it.',
    'The implementation creates its Subject before calling the selector, but announces it only after successful conversion.',
    s => s.phase === 'Active' && s.openingLive && s.nextWindowId < Number.MAX_SAFE_INTEGER,
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'opening.next') throw Error('expected opening next');
      const id = s.nextWindowId;
      return { state: { ...s, phase: 'Selecting', pending: id, nextWindowId: id + 1,
        windows: [...s.windows, { windowId: id, status: 'pending', announced: false, closingLive: false }] },
        actions: [invoke('closingSelector', id, e.value)] }; });
  add('SELECTOR-RETURN', 'Selecting', 'selector.return', 'Active', 'matching synchronous selector returns a valid Observable',
    ['announce Observable handle', 'subscribe its closing signal'],
    'Pending window becomes open, announced and attached to its uniquely identified closing subscription.',
    'The outcome abstracts the valid Observable result; its subscription occurrence is identified by the window generation.',
    matchingSelector, (s, _e) => { if (s.phase !== 'Selecting') throw Error('expected pending selector');
      const { pending, phase: _phase, ...memory } = s;
      return { state: { ...memory, phase: 'Active', windows: s.windows.map(w => w.windowId === pending ?
        { ...w, status: 'open', announced: true, closingLive: true } : w) },
        actions: [emit({ windowId: pending } satisfies ToggleWindowToken), acquire(closingRef(pending))] }; });
  add('SELECTOR-THROW', 'Selecting', 'selector.throw', 'Stopped', 'matching synchronous selector throws',
    ['error open window consumers', 'error outer result', 'release opening, source and live closings'],
    'Stopped with retained errored handles; failed pending window was never announced.',
    'The private new Subject is failed too, but no public observer can attach to that unannounced identity.',
    matchingSelector, (s, e) => { if (s.phase !== 'Selecting' || e.type !== 'selector.throw') throw Error('expected selector throw');
      return { state: stop(s, 'selector-error', e.error), actions: [...endWindows(s, { kind: 'E', error: e.error }), failWith(e.error), ...detachInputs(s)] }; });
  add('SOURCE-NEXT', 'Active', 'source.next', 'Active', 'source is connected between atomic reactions',
    ['send the same value to each open window consumer in window creation and observer attachment order'],
    'All window and closing state remains unchanged.',
    'No current windows means the source value is dropped. Windows multicast live values without replay or buffering.',
    s => s.phase === 'Active', (s, e) => { if (s.phase !== 'Active' || e.type !== 'source.next') throw Error('expected source next');
      return { state: s, actions: s.windows.filter(w => w.status === 'open').flatMap(w =>
        s.consumers.filter(c => c.windowId === w.windowId).map(c => notify(c.observerId, { kind: 'N', value: e.value }))) }; });
  add('CLOSING-NEXT', 'Active', 'closing.next', 'Active', 'addressed closing subscription is live',
    ['complete this window consumers', 'release this closing subscription'],
    'Window retains completion; other windows, source and opening signal are unchanged.',
    'A closing value is a control signal; it is not forwarded as a source value.',
    liveClosing, (s, e) => { if (s.phase !== 'Active' || e.type !== 'closing.next') throw Error('expected closing next');
      const id = e.resource.generation;
      return { state: { ...s, windows: s.windows.map(w => w.windowId === id ? { ...w, status: 'complete', closingLive: false } : w),
        consumers: s.consumers.filter(c => c.windowId !== id) },
        actions: [...endConsumers(s, id, { kind: 'C' }), release(closingRef(id))] }; });
  add('CLOSING-COMPLETE', 'Active', 'closing.complete', 'Active', 'addressed closing subscription is live',
    ['release this closing subscription only'], 'Window stays open without a live closing signal.',
    'RxJS 7.8.2 installs noop for closing completion. Empty completion does not close a window.',
    liveClosing, (s, e) => { if (s.phase !== 'Active' || e.type !== 'closing.complete') throw Error('expected closing complete');
      return { state: { ...s, windows: s.windows.map(w => w.windowId === e.resource.generation ? { ...w, closingLive: false } : w) },
        actions: [release(closingRef(e.resource.generation))] }; });
  add('OPENING-COMPLETE', 'Active', 'opening.complete', 'Active', 'opening subscription is live',
    ['release opening subscription only'], 'No more windows can open; source and current windows continue.',
    'Opening completion is not output completion and does not implicitly close any current window.',
    s => s.phase === 'Active' && s.openingLive, s => { if (s.phase !== 'Active') throw Error('expected active opening');
      return { state: { ...s, openingLive: false }, actions: [release(openingRef)] }; });
  for (const type of ['source.error', 'closing.error'] as const) add(type === 'source.error' ? 'SOURCE-ERROR' : 'CLOSING-ERROR',
    'Active', type, 'Stopped', type === 'source.error' ? 'source is connected' : 'addressed closing subscription is live',
    ['error every open window consumer before outer error', 'release opening, source and remaining closings'],
    'Stopped; failed windows retain their exact error for late observers; completed windows remain completed.',
    'Source and closing errors use handleError, which drains the window array before source finalization.',
    type === 'source.error' ? s => s.phase === 'Active' : liveClosing,
    (s, e) => { if (s.phase !== 'Active' || (e.type !== 'source.error' && e.type !== 'closing.error')) throw Error('expected error');
      return { state: stop(s, e.type === 'source.error' ? 'source-error' : 'closing-error', e.error),
        actions: [...endWindows(s, { kind: 'E', error: e.error }), failWith(e.error), ...detachInputs(s)] }; });
  add('SOURCE-COMPLETE', 'Active', 'source.complete', 'Stopped', 'source is connected',
    ['complete all open window consumers before outer completion', 'release opening, source and live closings'],
    'Stopped; every announced window retains completion and can complete late consumers.',
    'The implementation removes each Subject from its active array before completing the outer result.',
    s => s.phase === 'Active', s => { if (s.phase !== 'Active') throw Error('expected source complete');
      return { state: stop(s, 'source-complete'), actions: [...endWindows(s, { kind: 'C' }), finish, ...detachInputs(s)] }; });
  add('OPENING-ERROR', 'Active', 'opening.error', 'Stopped', 'opening subscription is live',
    ['error outer result only', 'release opening, source and live closings; dispose current Subjects silently'],
    'Stopped; current handles are disposed and existing child subscriptions remain orphaned.',
    'Opening errors use the default subscriber path, not handleError. Current window consumers receive no error or complete.',
    s => s.phase === 'Active' && s.openingLive, (s, e) => { if (s.phase !== 'Active' || e.type !== 'opening.error') throw Error('expected opening error');
      return { state: stop(s, 'opening-error'), actions: [failWith(e.error), ...detachInputs(s)] }; });
  add('CANCEL', 'Active', 'cancel', 'Stopped', 'outer consumer cancels between reactions',
    ['release opening, source and live closings; dispose current Subjects silently'],
    'Stopped; attached child Subscriptions remain independently closeable and current handles reject late subscription.',
    'Subject.unsubscribe is not Subject.complete. Historical completed windows are not disposed.',
    s => s.phase === 'Active', s => { if (s.phase !== 'Active') throw Error('expected cancel');
      return { state: stop(s, 'cancel'), actions: detachInputs(s) }; });

  for (const phase of ['Active', 'Stopped'] as const) {
    if (phase === 'Active') add('OBSERVE-OPEN', phase, 'window.subscribe', phase, 'fresh observer names an announced open window',
      ['acquire one child observer connection without replay'], 'Consumer is attached; no upstream lease is added.',
      'Window consumers share values only inside this outer execution; they do not own the source connection.',
      (s, e) => s.phase === 'Active' && e.type === 'window.subscribe' && fresh(s, e.observerId) && at(s, e.windowId)?.status === 'open',
      (s, e) => { if (s.phase !== 'Active' || e.type !== 'window.subscribe') throw Error('expected child attach');
        return { state: { ...s, consumers: [...s.consumers, { observerId: e.observerId, windowId: e.windowId }], usedObservers: [...s.usedObservers, e.observerId] },
          actions: [acquire(observerRef(e.observerId))] }; });
    for (const terminal of phase === 'Active' ? ['complete'] as const : ['complete', 'error'] as const) {
      add('OBSERVE-' + terminal.toUpperCase() + '-' + phase.toUpperCase(), phase, 'window.subscribe', phase,
        'fresh observer names an announced ' + terminal + ' window',
        ['acquire observer', 'deliver retained terminal notification without value replay', 'release observer'],
        'No consumer remains attached; the historical handle retains its terminal state.',
        'Only announced handles are addressable; a selector failure never exposes its private pending window.',
        (s, e) => s.phase === phase && e.type === 'window.subscribe' && fresh(s, e.observerId) &&
          at(s, e.windowId)?.status === terminal && at(s, e.windowId)?.announced === true,
        (s, e) => { if (!hasMemory(s) || e.type !== 'window.subscribe') throw Error('expected late attach');
          const w = at(s, e.windowId)!;
          return { state: { ...s, usedObservers: [...s.usedObservers, e.observerId] }, actions: [acquire(observerRef(e.observerId)),
            notify(e.observerId, terminal === 'complete' ? { kind: 'C' } : { kind: 'E', error: w.error }), release(observerRef(e.observerId))] }; });
    }
    add('OBSERVER-CLOSE-' + phase.toUpperCase(), phase, 'window.unsubscribe', phase,
      'addressed child observer still owns a subscription', ['release only the addressed observer'],
      'Other children and upstream resources are unchanged.', 'Orphaned consumers after disposal remain independently owned.',
      (s, e) => s.phase === phase && e.type === 'window.unsubscribe' && s.consumers.some(c => c.observerId === e.observerId),
      (s, e) => { if (!hasMemory(s) || e.type !== 'window.unsubscribe') throw Error('expected child close');
        return { state: { ...s, consumers: s.consumers.filter(c => c.observerId !== e.observerId) }, actions: [release(observerRef(e.observerId))] }; });
  }

  const base = sessionMetadata({ operator: 'windowToggle', id: 'windowToggle-signals',
    purpose: 'Open live multicast windows from an opening signal and close each from its own selector-created signal.',
    signature: 'Cω: windowToggle : (O* × (O! → C*)) → T* → (T*)*',
    conditions: ['No initial window; each successful opening reaction announces one handle.',
      'Source values go to every currently open window; opening and closing payloads are control inputs.',
      'Closing next closes its own window; closing complete only disconnects that signal.',
      'Source/closing/selector failure errors current windows; opening failure disposes them silently.'],
    parameters: 'Valid Observable opening signal; synchronous closingSelector returns a valid Observable. Fresh safe-integer window generations.',
    callbacks: 'Selector invocation carries the exact opening payload. Correlated return/throw is supplied synchronously; the model never executes user code.',
    time: 'No clock or timer. Sources supply time; input order resolves equal-time events. runWindowToggleTrace enforces selector outcome at invocation envelope time.',
    initialization: 'Acquire opening signal, then source; assume neither acquisition emits before setup returns. No initial window is emitted.',
    sharing: 'Each outer connection owns its opening/source/closing subscriptions. Each window multicasts live values without replay; children hold no upstream lease.',
    exclusions: ['Setup-time synchronous opening/source/closing emissions and arbitrary callback/observer reentrancy.',
      'Foreign ObservableInput conversions, invalid closing-selector returns, direct Subject mutation and non-safe generation overflow.',
      'Late subscription to disposed handles throws synchronously and is characterized natively outside the legal model event alphabet.'],
    controls: ['Unsubscribed', 'Active', 'Selecting', 'Stopped'], testStem: 'session22-windowToggle', differential: true,
    resources: [{ id: 'opening', kind: 'subscription', owner: 'outer execution' },
      { id: 'closing', kind: 'subscription', owner: 'outer execution; one generation per window' },
      { id: 'closingSelector', kind: 'callback', owner: 'opening reaction; correlated by window generation' },
      { id: 'windowObserver:*', kind: 'subscription', owner: 'independent window consumer' }],
    inputs: [
      { type: 'opening.next', origin: 'outer', category: 'notification', description: 'Opening signal carries the selector input.' },
      { type: 'opening.complete', origin: 'outer', category: 'notification', description: 'No future openings; existing windows persist.' },
      { type: 'opening.error', origin: 'outer', category: 'notification', description: 'Outer error with silent current-window disposal.' },
      { type: 'selector.return', origin: 'callback', category: 'callback', description: 'Matching synchronous valid Observable result.' },
      { type: 'selector.throw', origin: 'callback', category: 'callback', description: 'Matching synchronous selector failure.' },
      { type: 'closing.next', origin: 'inner', category: 'notification', description: 'Identified closing signal closes its window.' },
      { type: 'closing.complete', origin: 'inner', category: 'notification', description: 'Identified closing signal completes without closing its window.' },
      { type: 'closing.error', origin: 'inner', category: 'notification', description: 'One closing signal fails all live windows and the result.' },
      { type: 'window.subscribe', origin: 'inner', category: 'lifecycle', description: 'Independent consumer attaches to an announced usable window.' },
      { type: 'window.unsubscribe', origin: 'inner', category: 'lifecycle', description: 'Independent consumer closes its own connection.' },
    ], actionTypes: ['subscribe', 'unsubscribe', 'notify', 'invoke-callback'],
    additionalSources: ['src/internal/Subject.ts', 'src/internal/Subscription.ts'],
  });
  return {
    metadata: { ...base, controls: base.controls.map(c => c.id === 'Stopped' ?
      { ...c, terminal: false, description: 'Outer execution stopped; retained terminal handles and orphaned child subscriptions remain observable.' } : c),
      evidence: { ...base.evidence, record: 'evidence/SESSION-22.md', scenarios: 'docs/SESSION-22-TOGGLE-WINDOWS.md', coverage: 'docs/SESSION-22-TOGGLE-WINDOWS.md' } },
    parameters: { closing: 'valid-Observable-result', setup: 'post-setup-notifications' },
    rules, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      const issues: string[] = [];
      if (!natural(s.nextWindowId) || s.windows.length !== s.nextWindowId) issues.push('Window generations must be consecutive safe integers.');
      if (typeof s.openingLive !== 'boolean') issues.push('Opening liveness must be Boolean.');
      if (s.phase === 'Selecting' && (!s.openingLive || s.pending !== s.nextWindowId - 1 || !natural(s.pending))) issues.push('Selecting must own the latest opening generation.');
      if (s.phase === 'Stopped' && (!['source-complete','source-error','opening-error','closing-error','selector-error','cancel'].includes(s.reason) || s.openingLive)) issues.push('Stopped executions cannot own the opening signal.');
      if (s.phase === 'Stopped' && s.reason === 'selector-error' &&
          (!s.nextWindowId || at(s, s.nextWindowId - 1)?.announced !== false || at(s, s.nextWindowId - 1)?.status !== 'error'))
        issues.push('Selector failure requires its final unannounced failed window.');
      for (const [id, w] of s.windows.entries()) {
        if (w.windowId !== id || !['pending','open','complete','error','disposed'].includes(w.status) || typeof w.announced !== 'boolean' || typeof w.closingLive !== 'boolean') issues.push('Invalid window identity or record.');
        if (w.status === 'pending' ? s.phase !== 'Selecting' || s.pending !== id || w.announced : !w.announced && !(s.phase === 'Stopped' && s.reason === 'selector-error' && id === s.nextWindowId - 1 && w.status === 'error')) issues.push('Only the current selector can own an unannounced window.');
        if (w.closingLive && w.status !== 'open') issues.push('Closing subscriptions belong only to open windows.');
        if ((w.status === 'error') !== Object.hasOwn(w, 'error')) issues.push('Failed windows must retain the exact error, even undefined.');
        if (s.phase !== 'Stopped' && (w.status === 'error' || w.status === 'disposed')) issues.push('Live execution cannot contain failed/disposed windows.');
        if (s.phase === 'Stopped') {
          if (w.closingLive || w.status === 'open' || w.status === 'pending') issues.push('Stopped execution cannot retain live windows or closing signals.');
          const disposal = s.reason === 'cancel' || s.reason === 'opening-error';
          if (disposal ? !['complete','disposed'].includes(w.status) : s.reason === 'source-complete' ? w.status !== 'complete' : !['complete','error'].includes(w.status)) issues.push('Window terminal state conflicts with outer stop reason.');
        }
      }
      if (s.phase === 'Selecting' && at(s, s.pending)?.status !== 'pending') issues.push('Selecting must have exactly one pending record.');
      if (new Set(s.usedObservers).size !== s.usedObservers.length || s.usedObservers.some(id => typeof id !== 'string' || !id.trim())) issues.push('Observer identities must be unique nonempty strings.');
      if (new Set(s.consumers.map(c => c.observerId)).size !== s.consumers.length || s.consumers.some(c => {
        const w = at(s, c.windowId); return !s.usedObservers.includes(c.observerId) || !w?.announced || !['open','disposed'].includes(w.status);
      })) issues.push('Attached consumers require one announced open or disposed handle and a registered identity.');
      return issues;
    },
    validateReaction: (_s, e, r) => [
      ...validateActionWord(r.actions),
      ...(e.type === 'cancel' && r.actions.some(a => a.type === 'notify') ? ['Cancellation must be silent.'] : []),
      ...((e.type === 'opening.complete' || e.type === 'closing.complete') && r.actions.some(a => a.type !== 'unsubscribe') ? ['Signal completion only releases that signal.'] : []),
    ],
  };
}

/** Selector reactions are synchronous; equal-time array order is still explicit. A pending prefix is legal. */
export function runWindowToggleTrace<T, O>(model: WindowToggleModel<T, O>, inputs: readonly TimedEvent<WindowToggleEvent<T, O>>[],
  options: Readonly<{ executionId: string; maxSteps?: number }>): Trace<WindowToggleState, WindowToggleEvent<T, O>, Action<unknown>> {
  const trace = runTrace(model, inputs, options);
  for (const [i, step] of trace.steps.entries()) if (step.before.phase === 'Selecting' && trace.steps[i - 1]?.time !== step.time)
    throw new Error('windowToggle selector outcome must share its invocation envelope time');
  return trace;
}

export const windowToggleExample: readonly TimedEvent<WindowToggleEvent<string, string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'opening.next', value: 'first' } },
  { time: 1, event: { type: 'selector.return', resource: selectorRef(0) } },
  { time: 1, event: { type: 'window.subscribe', observerId: 'A', windowId: 0 } },
  { time: 2, event: { type: 'opening.next', value: 'second' } },
  { time: 2, event: { type: 'selector.return', resource: selectorRef(1) } },
  { time: 2, event: { type: 'window.subscribe', observerId: 'B', windowId: 1 } },
  { time: 3, event: { type: 'source.next', value: 'shared' } },
  { time: 4, event: { type: 'closing.next', resource: closingRef(0) } },
  { time: 5, event: { type: 'source.next', value: 'second-only' } },
  { time: 6, event: { type: 'source.complete' } },
];
export const windowToggleEmptyCloseExample: readonly TimedEvent<WindowToggleEvent<string, string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'opening.next', value: 'open' } },
  { time: 1, event: { type: 'selector.return', resource: selectorRef(0) } },
  { time: 1, event: { type: 'window.subscribe', observerId: 'A', windowId: 0 } },
  { time: 2, event: { type: 'closing.complete', resource: closingRef(0) } },
  { time: 3, event: { type: 'opening.complete' } },
  { time: 4, event: { type: 'source.next', value: 'still-live' } },
  { time: 5, event: { type: 'source.complete' } },
];
export const windowToggleCancelExample: readonly TimedEvent<WindowToggleEvent<string, string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'opening.next', value: 'open' } },
  { time: 1, event: { type: 'selector.return', resource: selectorRef(0) } },
  { time: 1, event: { type: 'window.subscribe', observerId: 'A', windowId: 0 } },
  { time: 2, event: { type: 'source.next', value: 'last' } },
  { time: 3, event: { type: 'cancel' } },
  { time: 4, event: { type: 'window.unsubscribe', observerId: 'A' } },
];
