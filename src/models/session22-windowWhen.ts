import type { Action, Notification, OperatorModel, ResourceRef, Rule, TimedEvent, Trace } from '../schema.js';
import { runTrace, validateActionWord } from '../runner.js';
import { acquire, emit, failWith, finish, invoke, natural, release, sessionMetadata, sourceRef } from './session21-common.js';

export type WindowWhenParameters = Readonly<{ closing: 'deferred-observable'; factory: 'explicit-synchronous-outcomes' }>;
export type WindowWhenToken = Readonly<{ windowId: number }>;
export type WindowWhenRecord =
  | Readonly<{ windowId: number; status: 'open' }>
  | Readonly<{ windowId: number; status: 'complete' }>
  | Readonly<{ windowId: number; status: 'error'; error: unknown }>;
export type WindowWhenConsumer = Readonly<{ observerId: string; windowId: number }>;
export type WindowWhenMemory = Readonly<{
  current: number;
  windows: readonly WindowWhenRecord[];
  consumers: readonly WindowWhenConsumer[];
  usedObservers: readonly string[];
}>;
export type WindowWhenState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (WindowWhenMemory & Readonly<{ phase: 'Selecting'; sourceConnected: boolean }>)
  | (WindowWhenMemory & Readonly<{ phase: 'Active' }>)
  | (WindowWhenMemory & Readonly<{ phase: 'Stopped'; reason: 'complete' | 'source-error' | 'closing-error' | 'factory-error' | 'cancel' }>);
export type WindowWhenEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'closing.next' | 'closing.complete' | 'factory.return'; generation: number }>
  | Readonly<{ type: 'closing.error' | 'factory.throw'; generation: number; error: unknown }>
  | Readonly<{ type: 'window.subscribe'; observerId: string; windowId: number }>
  | Readonly<{ type: 'window.unsubscribe'; observerId: string }>;
export type WindowWhenModel<T> = OperatorModel<WindowWhenParameters, WindowWhenState, WindowWhenEvent<T>, Action<unknown>>;

const closingRef = (generation: number): ResourceRef => ({ id: 'closing', generation });
const consumerRef = (id: string): ResourceRef => ({ id: 'windowObserver:' + id, generation: 0 });
const notify = (id: string, notification: Notification<unknown>): Action<unknown> =>
  ({ type: 'notify', target: consumerRef(id).id, notification });
const known = (s: WindowWhenState): s is Exclude<WindowWhenState, { phase: 'Unsubscribed' }> => s.phase !== 'Unsubscribed';
const getWindow = (s: WindowWhenMemory, id: number): WindowWhenRecord | undefined => natural(id) ? s.windows[id] : undefined;
const fresh = (s: WindowWhenMemory, id: string): boolean => typeof id === 'string' && !!id.trim() && !s.usedObservers.includes(id);
const endConsumers = (s: WindowWhenMemory, notification: Notification<never>): readonly Action<unknown>[] =>
  s.consumers.flatMap(c => [notify(c.observerId, notification), release(consumerRef(c.observerId))]);
const rememberTerminal = (s: WindowWhenMemory, terminal: 'complete' | 'error', error?: unknown): readonly WindowWhenRecord[] =>
  s.windows.map(w => w.windowId !== s.current ? w : terminal === 'complete'
    ? { windowId: w.windowId, status: 'complete' }
    : { windowId: w.windowId, status: 'error', error });
// Initial closer is registered before source. Replacement closers are registered after source.
const disconnect = (s: WindowWhenMemory): readonly Action<unknown>[] => s.current === 0
  ? [release(closingRef(0)), release(sourceRef)]
  : [release(sourceRef), release(closingRef(s.current))];

export function createWindowWhenModel<T>(): WindowWhenModel<T> {
  type S = WindowWhenState; type E = WindowWhenEvent<T>;
  const parameters: WindowWhenParameters = { closing: 'deferred-observable', factory: 'explicit-synchronous-outcomes' };
  const rules: Rule<WindowWhenParameters, S, E, Action<unknown>>[] = [];
  const add = (
    name: string, from: S['phase'], event: E['type'], to: S['phase'], guard: string,
    actions: readonly string[], nextState: string, explanation: string,
    enabled: (s: S, e: E) => boolean,
    react: (s: S, e: E) => Readonly<{ state: S; actions: readonly Action<unknown>[] }>,
  ): void => { const id = 'S22-WINDOWWHEN-' + name;
    rules.push({ description: { id, from, event, to, guard, actions, nextState, explanation, obligations: [id] }, enabled, react }); };

  add('START', 'Unsubscribed', 'subscribe', 'Selecting', 'no result connection exists',
    ['emit initial window handle zero', 'invoke closing selector zero with no argument'],
    'Initial window is open; source and closing connections await the synchronous factory outcome.',
    'The initial handle and closing selector precede source acquisition. Construction itself does no work.',
    s => s.phase === 'Unsubscribed',
    () => ({ state: { phase: 'Selecting', sourceConnected: false, current: 0,
      windows: [{ windowId: 0, status: 'open' }], consumers: [], usedObservers: [] },
      actions: [emit({ windowId: 0 } satisfies WindowWhenToken), invoke('closingSelector', 0, undefined)] }));

  add('FACTORY-RETURN', 'Selecting', 'factory.return', 'Active', 'outcome belongs to the current synchronous invocation',
    ['acquire closing subscription occurrence', 'acquire source only for initial setup'],
    'One closing occurrence watches the open window; source is connected exactly once.',
    'A valid returned Observable is abstracted by its subscription occurrence, regardless of producer identity.',
    (s, e) => s.phase === 'Selecting' && e.type === 'factory.return' && e.generation === s.current,
    (s, e) => { if (s.phase !== 'Selecting' || e.type !== 'factory.return') throw Error('expected factory return');
      const { sourceConnected, ...memory } = s;
      return { state: { ...memory, phase: 'Active' },
        actions: [acquire(closingRef(s.current)), ...(!sourceConnected ? [acquire(sourceRef)] : [])] }; });

  add('FACTORY-THROW', 'Selecting', 'factory.throw', 'Stopped', 'throw belongs to the current synchronous invocation',
    ['remember error on newly announced window', 'error outer', 'release source, or record closed-source acquisition attempt during initial setup'],
    'New window retains the exact error; old windows remain completed.',
    'Initial selector failure still reaches source.subscribe with an already closed subscriber. This non-notifying setup attempt acquires and immediately releases the source.',
    (s, e) => s.phase === 'Selecting' && e.type === 'factory.throw' && e.generation === s.current,
    (s, e) => { if (s.phase !== 'Selecting' || e.type !== 'factory.throw') throw Error('expected factory throw');
      const { sourceConnected, ...memory } = s;
      return { state: { ...memory, phase: 'Stopped', reason: 'factory-error',
        windows: rememberTerminal(s, 'error', e.error), consumers: [] },
        actions: [failWith(e.error), ...(sourceConnected ? [release(sourceRef)] : [acquire(sourceRef), release(sourceRef)])] }; });

  add('SOURCE-NEXT', 'Active', 'source.next', 'Active', 'source connection is live',
    ['forward identical payload to every observer of the current window in attachment order'],
    'No values are buffered and no closing state changes.',
    'Late observers miss earlier values. The outer sequence contains window handles, not source payloads.',
    s => s.phase === 'Active',
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'source.next') throw Error('expected source next');
      return { state: s, actions: s.consumers.map(c => notify(c.observerId, { kind: 'N', value: e.value })) }; });

  for (const type of ['closing.next', 'closing.complete'] as const) {
    add(type === 'closing.next' ? 'CLOSING-NEXT' : 'CLOSING-COMPLETE', 'Active', type, 'Selecting',
      'current closing generation; next window identity remains a safe integer',
      ['unsubscribe old closing occurrence', 'complete and release old window consumers', 'emit successor handle', 'invoke next closing selector'],
      'Old window remembers completion; a new empty window awaits its factory result.',
      'Both next and empty completion rotate. Unsubscribing the old closer precedes child completion and replacement factory invocation.',
      (s, e) => s.phase === 'Active' && (e.type === 'closing.next' || e.type === 'closing.complete') &&
        e.generation === s.current && s.current < Number.MAX_SAFE_INTEGER,
      s => { if (s.phase !== 'Active') throw Error('expected rotation');
        const current = s.current + 1;
        return { state: { ...s, phase: 'Selecting', sourceConnected: true, current,
          windows: [...rememberTerminal(s, 'complete'), { windowId: current, status: 'open' }], consumers: [] },
          actions: [release(closingRef(s.current)), ...endConsumers(s, { kind: 'C' }),
            emit({ windowId: current } satisfies WindowWhenToken), invoke('closingSelector', current, undefined)] }; });
  }

  add('SOURCE-COMPLETE', 'Active', 'source.complete', 'Stopped', 'source connection is live',
    ['complete current children', 'complete outer', 'disconnect inputs in subscription ownership order'],
    'Every retained window is completed; no replacement window is created.',
    'Initial closing teardown precedes source; after a rotation, source teardown precedes the replacement closer.',
    s => s.phase === 'Active',
    s => { if (s.phase !== 'Active') throw Error('expected completion');
      return { state: { ...s, phase: 'Stopped', reason: 'complete', windows: rememberTerminal(s, 'complete'), consumers: [] },
        actions: [...endConsumers(s, { kind: 'C' }), finish, ...disconnect(s)] }; });

  for (const type of ['source.error', 'closing.error'] as const) {
    add(type === 'source.error' ? 'SOURCE-ERROR' : 'CLOSING-ERROR', 'Active', type, 'Stopped',
      'live source, or matching current closing generation',
      ['error current children with original payload', 'error outer', 'disconnect inputs in subscription ownership order'],
      'Current handle remembers failure; older handles retain successful completion.',
      'Closing failure terminates the outer execution; it does not rotate or invoke the factory again.',
      (s, e) => s.phase === 'Active' && (e.type === 'source.error' || e.type === 'closing.error' && e.generation === s.current),
      (s, e) => { if (s.phase !== 'Active' || (e.type !== 'source.error' && e.type !== 'closing.error')) throw Error('expected error');
        return { state: { ...s, phase: 'Stopped', reason: e.type === 'source.error' ? 'source-error' : 'closing-error',
          windows: rememberTerminal(s, 'error', e.error), consumers: [] },
          actions: [...endConsumers(s, { kind: 'E', error: e.error }), failWith(e.error), ...disconnect(s)] }; });
  }

  add('CANCEL', 'Active', 'cancel', 'Stopped', 'outer connection closes between complete reactions',
    ['disconnect inputs silently in subscription ownership order'],
    'Current Subject stays open but orphaned; existing child subscriptions remain independently owned.',
    'windowWhen finalization drops its reference without completing or unsubscribing the window Subject. Late observers can still attach without receiving values.',
    s => s.phase === 'Active',
    s => { if (s.phase !== 'Active') throw Error('expected cancellation');
      return { state: { ...s, phase: 'Stopped', reason: 'cancel' }, actions: disconnect(s) }; });

  for (const phase of ['Active', 'Stopped'] as const) {
    for (const status of ['open', 'complete', 'error'] as const) {
      if (phase === 'Active' && status === 'error') continue;
      add('OBSERVE-' + status.toUpperCase() + '-' + phase.toUpperCase(), phase, 'window.subscribe', phase,
        'fresh observer identity names a retained ' + status + ' window',
        status === 'open' ? ['acquire child observer, no replay'] : ['acquire child observer', 'deliver retained terminal only', 'release child observer'],
        status === 'open' ? 'Child is attached independently to the open Subject.' : 'No child remains attached to a terminated Subject.',
        'Retained handles remain observable after outer termination; they do not keep the original source connected.',
        (s, e) => s.phase === phase && e.type === 'window.subscribe' && fresh(s, e.observerId) && getWindow(s, e.windowId)?.status === status,
        (s, e) => { if (!known(s) || e.type !== 'window.subscribe') throw Error('expected window observer');
          const w = getWindow(s, e.windowId)!;
          const memory = { ...s, usedObservers: [...s.usedObservers, e.observerId] };
          if (w.status === 'open') return { state: { ...memory, consumers: [...s.consumers, { observerId: e.observerId, windowId: e.windowId }] }, actions: [acquire(consumerRef(e.observerId))] };
          return { state: memory, actions: [acquire(consumerRef(e.observerId)),
            notify(e.observerId, w.status === 'complete' ? { kind: 'C' } : { kind: 'E', error: w.error }), release(consumerRef(e.observerId))] }; });
    }
    add('OBSERVER-UNSUBSCRIBE-' + phase.toUpperCase(), phase, 'window.unsubscribe', phase,
      'named observer owns a live child subscription', ['release only that child subscription'],
      'All peers, window handles and upstream connections are unchanged.',
      'Orphaned consumers can unsubscribe after outer cancellation.',
      (s, e) => s.phase === phase && e.type === 'window.unsubscribe' && s.consumers.some(c => c.observerId === e.observerId),
      (s, e) => { if (!known(s) || e.type !== 'window.unsubscribe') throw Error('expected child unsubscribe');
        return { state: { ...s, consumers: s.consumers.filter(c => c.observerId !== e.observerId) }, actions: [release(consumerRef(e.observerId))] }; });
  }

  const basis = sessionMetadata({
    operator: 'windowWhen', id: 'windowWhen-deferred-closing',
    purpose: 'Route values through successive live windows; each fresh closing signal ends the current window on next or complete.',
    signature: 'windowWhen : (() → U*) → T* → (T*)*',
    conditions: ['One initial window plus one successor for each admitted closing next or completion.',
      'Only current-window consumers receive source values; windows and values are not replayed.',
      'Source completion/error ends current children before outer; outer cancellation leaves orphaned child Subjects.'],
    parameters: 'No numeric parameters. A synchronous closing factory returns a valid Observable whose acquisition is non-notifying, or throws an opaque error.',
    callbacks: 'Factory requests have generation equal to the new window identity. Explicit return/throw must match the current invocation at the same envelope time.',
    time: 'No timer is introduced. Source and closing streams provide notification times. Equal-time ordering is explicit; runWindowWhenTrace enforces same-time factory outcomes.',
    reentrancy: 'Atomic non-reentrant reactions; child attachment occurs between completed reactions. Source and closing acquisition do not synchronously notify.',
    initialization: 'Emit initial handle; invoke selector; acquire returned closing Observable; acquire source last. Initial selector throw still attempts source setup with a closed subscriber.',
    sharing: 'Independent outer subscriptions have separate windows and closing occurrences. Inner windows are live multicast without replay; inner consumers hold no upstream lease.',
    exclusions: ['Synchronous closing notifications during subscription, recursively empty closing streams, and reentrant factory/observer/source setup.',
      'Child attachment during the synchronous handle-announcement/factory reaction; native tests characterize this separately.',
      'ObservableInput conversion beyond valid Observable values, imperative Subject mutation and source setup that emits despite a closed subscriber.'],
    controls: ['Unsubscribed', 'Selecting', 'Active', 'Stopped'], testStem: 'session22-windowWhen', differential: true,
    inputs: [
      { type: 'factory.return', origin: 'callback', category: 'callback', description: 'Current selector returns a valid closing Observable.' },
      { type: 'factory.throw', origin: 'callback', category: 'callback', description: 'Current selector throws an opaque error.' },
      { type: 'closing.next', origin: 'inner', category: 'notification', description: 'Current closing occurrence emits; payload is ignored.' },
      { type: 'closing.complete', origin: 'inner', category: 'notification', description: 'Current closing occurrence completes and rotates.' },
      { type: 'closing.error', origin: 'inner', category: 'notification', description: 'Current closing occurrence fails the execution.' },
      { type: 'window.subscribe', origin: 'inner', category: 'lifecycle', description: 'A fresh named observer attaches to a retained handle.' },
      { type: 'window.unsubscribe', origin: 'inner', category: 'lifecycle', description: 'A live named child observer closes its own subscription.' },
    ],
    resources: [{ id: 'closing', kind: 'subscription', owner: 'outer execution; current generation' },
      { id: 'closingSelector', kind: 'callback', owner: 'current synchronous window-opening reaction' },
      { id: 'windowObserver:*', kind: 'subscription', owner: 'independent window consumer' }],
    actionTypes: ['notify', 'subscribe', 'unsubscribe', 'invoke-callback'],
    additionalSources: ['src/internal/Subject.ts', 'src/internal/Subscription.ts'],
  });
  return {
    parameters, metadata: { ...basis, evidence: { ...basis.evidence, record: 'evidence/SESSION-22.md',
      scenarios: 'docs/SESSION-22-WHEN-WINDOWS.md', coverage: 'docs/SESSION-22-WHEN-WINDOWS.md' },
      controls: basis.controls.map(c => c.id === 'Stopped' ? { ...c, terminal: false,
        description: 'Outer stopped; retained handles and independently owned orphan consumers remain observable.' } : c) },
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase, rules,
    validateState: s => {
      if (!known(s)) return [];
      const errors: string[] = [];
      if (!natural(s.current) || s.windows.length !== s.current + 1) errors.push('Window identities must be consecutive through current.');
      for (const [id, w] of s.windows.entries()) {
        if (w.windowId !== id || !['open', 'complete', 'error'].includes(w.status)) errors.push('Invalid window identity/status.');
        if (id < s.current && w.status !== 'complete') errors.push('Every historical window must remember completion.');
        if (id === s.current) {
          const expected = s.phase !== 'Stopped' || s.reason === 'cancel' ? 'open' : s.reason === 'complete' ? 'complete' : 'error';
          if (w.status !== expected) errors.push('Current window status must match outer control and reason.');
          if (w.status === 'error' && !Object.hasOwn(w, 'error')) errors.push('Failed handle must retain its error, including undefined.');
        }
      }
      if (s.phase === 'Selecting' && (s.sourceConnected !== (s.current > 0) || s.consumers.length)) errors.push('Selecting must reflect initial/replacement source ownership and have no child consumers.');
      if (s.phase === 'Stopped' && !['complete', 'source-error', 'closing-error', 'factory-error', 'cancel'].includes(s.reason)) errors.push('Invalid stop reason.');
      if (new Set(s.usedObservers).size !== s.usedObservers.length || s.usedObservers.some(id => typeof id !== 'string' || !id.trim())) errors.push('Observer identities must be unique nonempty strings.');
      if (new Set(s.consumers.map(c => c.observerId)).size !== s.consumers.length || s.consumers.some(c =>
        c.windowId !== s.current || getWindow(s, c.windowId)?.status !== 'open' || !s.usedObservers.includes(c.observerId))) errors.push('Live consumers must own the current open window.');
      return errors;
    },
    validateReaction: (_before, event, reaction) => [
      ...validateActionWord(reaction.actions),
      ...(event.type === 'cancel' && reaction.actions.some(a => a.type === 'notify') ? ['Cancellation must not notify outer or children.'] : []),
      ...(event.type === 'window.unsubscribe' && reaction.actions.some(a => a.type !== 'unsubscribe' || a.resource.id !== consumerRef(event.observerId).id) ? ['Child cancellation affects only the named child.'] : []),
    ],
  };
}

export function runWindowWhenTrace<T>(model: WindowWhenModel<T>, inputs: readonly TimedEvent<WindowWhenEvent<T>>[], options: Readonly<{ executionId: string; maxSteps?: number }>): Trace<WindowWhenState, WindowWhenEvent<T>, Action<unknown>> {
  const trace = runTrace(model, inputs, options);
  let invokedAt: number | null = null;
  for (const step of trace.steps) {
    if (step.event.type === 'factory.return' || step.event.type === 'factory.throw') {
      if (step.time !== invokedAt) throw Error('Synchronous closing factory outcome must share its invocation envelope time.');
      invokedAt = null;
    }
    if (step.actions.some(a => a.type === 'invoke-callback')) invokedAt = step.time;
  }
  return trace;
}

export const windowWhenExample: readonly TimedEvent<WindowWhenEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } }, { time: 0, event: { type: 'factory.return', generation: 0 } },
  { time: 0, event: { type: 'window.subscribe', windowId: 0, observerId: 'A' } },
  { time: 1, event: { type: 'source.next', value: 'one' } },
  { time: 2, event: { type: 'closing.next', generation: 0 } }, { time: 2, event: { type: 'factory.return', generation: 1 } },
  { time: 2, event: { type: 'window.subscribe', windowId: 1, observerId: 'B' } },
  { time: 3, event: { type: 'source.next', value: 'two' } }, { time: 4, event: { type: 'source.complete' } },
  { time: 5, event: { type: 'window.subscribe', windowId: 0, observerId: 'late' } },
];
export const windowWhenCompleteExample: readonly TimedEvent<WindowWhenEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } }, { time: 0, event: { type: 'factory.return', generation: 0 } },
  { time: 1, event: { type: 'closing.complete', generation: 0 } }, { time: 1, event: { type: 'factory.return', generation: 1 } },
  { time: 1, event: { type: 'window.subscribe', windowId: 1, observerId: 'current' } },
  { time: 2, event: { type: 'source.next', value: 'after-empty-closing' } }, { time: 3, event: { type: 'source.complete' } },
];
export const windowWhenCancelExample: readonly TimedEvent<WindowWhenEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } }, { time: 0, event: { type: 'factory.return', generation: 0 } },
  { time: 0, event: { type: 'window.subscribe', windowId: 0, observerId: 'A' } },
  { time: 1, event: { type: 'source.next', value: 'before-close' } }, { time: 2, event: { type: 'cancel' } },
  { time: 3, event: { type: 'window.subscribe', windowId: 0, observerId: 'late' } },
  { time: 4, event: { type: 'window.unsubscribe', observerId: 'A' } }, { time: 4, event: { type: 'window.unsubscribe', observerId: 'late' } },
];
