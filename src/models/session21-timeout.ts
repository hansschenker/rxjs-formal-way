import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent, Trace } from '../schema.js';
import { runTrace } from '../runner.js';
import { acquire, release, emit, finish, failWith, invoke, natural, sameResource, sourceRef,
  sessionMetadata, namedRule, callbackInputs, checkActions } from './session21-common.js';
import type { CloseReason } from './session21-common.js';

/** A numeric first is relative; {at} represents an already-resolved absolute Date deadline. */
export type TimeoutFirst = number | Readonly<{ at: number }>;
export type TimeoutOptions = Readonly<{ first?: TimeoutFirst; each?: number; withMode?: 'default' | 'factory'; meta?: unknown }>;
export type TimeoutParameters = Readonly<{
  operator: 'timeout' | 'timeoutWith'; first: TimeoutFirst | null; each: number | null;
  withMode: 'default' | 'factory' | 'constant'; fallbackToken: string | null; meta: unknown;
}>;
export type TimeoutTimer = Readonly<{ generation: number; due: number }>;
export type TimeoutInfo = Readonly<{ meta: unknown; seen: number; lastValue: null }>;
export type TimeoutState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Source'; clock: number; seen: number; lastValue: T | null; nextGeneration: number; timer: TimeoutTimer | null }>
  | Readonly<{ phase: 'Choosing'; clock: number; seen: number }>
  | Readonly<{ phase: 'Fallback'; clock: number; token: string }>
  | Readonly<{ phase: 'Closed'; clock: number; reason: CloseReason }>;
export type TimeoutEvent<T, R = T> = Readonly<{ now: number }> & (
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'timer.fire'; resource: ResourceRef }>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; token: string }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>
  | Readonly<{ type: 'fallback.next'; resource: ResourceRef; value: R }>
  | Readonly<{ type: 'fallback.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'fallback.error'; resource: ResourceRef; error: unknown }>
);
export type TimeoutModel<T, R = T> = OperatorModel<TimeoutParameters, TimeoutState<T>, TimeoutEvent<T, R>, Action<unknown>>;
const timerRef = (generation: number): ResourceRef => ({ id: 'timeoutTimer', generation });
const factoryRef: ResourceRef = { id: 'timeoutFactory', generation: 0 };
const fallbackRef: ResourceRef = { id: 'fallback', generation: 0 };
const positiveDuration = (value: number): boolean => natural(value) && value >= 1 && value <= 1000;
const validFirst = (first: TimeoutFirst | null): boolean => first === null || (typeof first === 'number'
  ? positiveDuration(first) : typeof first === 'object' && natural(first.at) && first.at > 0);

/** Pure watchdog policy. It never executes a clock, factory, producer or scheduler. */
function createTimeoutPolicyModel<T, R>(parameters: TimeoutParameters): TimeoutModel<T, R> {
  const { operator, first, each, withMode, fallbackToken, meta } = parameters;
  if (!validFirst(first) || (each !== null && !positiveDuration(each)) || (first === null && each === null)) {
    throw new RangeError('Use first/each durations in 1..1000 or a positive safe absolute first time.');
  }
  if (withMode !== 'default' && withMode !== 'factory' && withMode !== 'constant') throw new TypeError('Invalid timeout binding.');
  if (operator === 'timeout' && withMode === 'constant') throw new TypeError('Use timeoutWith for the constant binding.');
  if (operator === 'timeoutWith' && (withMode !== 'constant' || !fallbackToken)) throw new TypeError('timeoutWith requires its constant Observable token.');
  type S = TimeoutState<T>; type E = TimeoutEvent<T, R>; type A = Action<unknown>;
  type Source = Extract<S, { phase: 'Source' }>;
  const source = (s: S): s is Source => s.phase === 'Source';
  const closed = (now: number, reason: CloseReason): S => ({ phase: 'Closed', clock: now, reason });
  const timeOk = (s: S, e: E): boolean => natural(e.now) && (s.phase === 'Unsubscribed' || e.now >= s.clock);
  const initialDelay = (now: number): number => first === null ? each! : typeof first === 'number' ? first : first.at - now;
  const cancelTimer = (timer: TimeoutTimer): A => ({ type: 'cancel-timer', resource: timerRef(timer.generation) });
  const schedule = (generation: number, delay: number): A => ({ type: 'schedule', resource: timerRef(generation), delay });
  const sourceCleanup = (s: Source): readonly A[] => [release(sourceRef), ...(s.timer ? [cancelTimer(s.timer)] : [])];
  const currentTimer = (s: S, e: E): boolean => source(s) && s.timer !== null && e.type === 'timer.fire'
    && sameResource(e.resource, timerRef(s.timer.generation)) && e.now >= s.timer.due;
  const currentFactory = (s: S, e: E): boolean => s.phase === 'Choosing'
    && (e.type === 'callback.return' || e.type === 'callback.throw') && e.now === s.clock && sameResource(e.resource, factoryRef);
  const currentFallback = (_s: S, e: E): boolean => 'resource' in e && sameResource(e.resource, fallbackRef);
  const rules: Rule<TimeoutParameters, S, E, A>[] = [];
  const add = (name: string, from: S['phase'], event: E['type'], to: S['phase'], guard: string,
    actions: readonly string[], nextState: string, explanation: string,
    enabled: (s: S, e: E) => boolean, react: (s: S, e: E) => { state: S; actions: readonly A[] }): void => {
    rules.push(namedRule<TimeoutParameters, S, E>(operator, name, from, event, to,
      guard + '; supplied time is a nondecreasing safe integer', actions, nextState, explanation,
      (s, e) => timeOk(s, e) && enabled(s, e), react));
  };
  add('START', 'Unsubscribed', 'subscribe', 'Source', 'first connection; initial deadline remains future and representable',
    ['subscribe source', 'schedule initial watchdog'], 'Source with seen=0, lastValue=null and timer generation zero.',
    'The source is acquired before initial scheduling. This profile requires nonemitting, non-time-advancing source setup.',
    (_s, e) => initialDelay(e.now) > 0 && natural(e.now + initialDelay(e.now)),
    (_s, e) => ({ state: { phase: 'Source', clock: e.now, seen: 0, lastValue: null, nextGeneration: 1,
      timer: { generation: 0, due: e.now + initialDelay(e.now) } }, actions: [acquire(sourceRef), schedule(0, initialDelay(e.now))] }));
  for (const armed of [true, false]) {
    // With each configured, every admitted source value leaves an active timer; no unarmed branch is reachable.
    if (!armed && each !== null) continue;
    add(armed ? 'NEXT-CANCEL-TIMER' : 'NEXT-UNARMED', 'Source', 'source.next', 'Source',
      armed ? 'a current timer is active' : 'first-only watchdog was already satisfied',
      [...(armed ? ['cancel current timer before delivery'] : []), 'forward exact source value', ...(each !== null ? ['schedule fresh each watchdog'] : [])],
      each !== null ? 'Seen advances, lastValue becomes input, and the fresh timer uses now+each.' : 'Seen advances and no watchdog remains after the first value.',
      'A first-only deadline is removed by the first next. Relative each deadlines restart after each accepted value; source values do not inherit an absolute first deadline.',
      (s, e) => source(s) && (s.timer !== null) === armed && s.seen < Number.MAX_SAFE_INTEGER
        && (each === null || (s.nextGeneration < Number.MAX_SAFE_INTEGER && natural(e.now + each))),
      (s, e) => { if (!source(s) || e.type !== 'source.next') throw Error('Expected source value.');
        return { state: { phase: 'Source', clock: e.now, seen: s.seen + 1, lastValue: e.value,
          nextGeneration: s.nextGeneration + (each !== null ? 1 : 0),
          timer: each === null ? null : { generation: s.nextGeneration, due: e.now + each } },
          actions: [...(s.timer ? [cancelTimer(s.timer)] : []), emit(e.value), ...(each !== null ? [schedule(s.nextGeneration, each)] : [])] }; });
  }
  add('SOURCE-COMPLETE', 'Source', 'source.complete', 'Closed', 'source completes before watchdog delivery',
    ['complete result', 'release source', 'cancel any current timer'], 'Closed complete; no fallback acquisition.',
    'Successful empty completion is not a timeout. A deadline alone is not a delivered event.', source,
    (s, e) => { if (!source(s)) throw Error('Expected source.'); return { state: closed(e.now, 'complete'), actions: [finish, ...sourceCleanup(s)] }; });
  add('SOURCE-ERROR', 'Source', 'source.error', 'Closed', 'source fails before watchdog delivery',
    ['forward exact source error', 'release source', 'cancel any current timer'], 'Closed error; no factory or fallback.',
    'Source errors preserve their payload and are not replaced by TimeoutError.', source,
    (s, e) => { if (!source(s) || e.type !== 'source.error') throw Error('Expected source error.');
      return { state: closed(e.now, 'error'), actions: [failWith(e.error), ...sourceCleanup(s)] }; });
  add('CANCEL-SOURCE', 'Source', 'cancel', 'Closed', 'consumer closes while source owns the connection',
    ['release source', 'cancel any current timer; emit nothing'], 'Closed cancel; no timeout factory or fallback.',
    'Cancellation owns teardown, not a terminal notification.', source,
    (s, e) => { if (!source(s)) throw Error('Expected source.'); return { state: closed(e.now, 'cancel'), actions: sourceCleanup(s) }; });
  add('EXPIRE', 'Source', 'timer.fire', withMode === 'constant' ? 'Fallback' : 'Choosing',
    'current timer generation fires at or after its deadline',
    ['release original source', 'cancel current timer during source finalization', withMode === 'constant' ? 'subscribe configured fallback Observable' : 'invoke timeout factory with meta, seen and cleared lastValue'],
    withMode === 'constant' ? 'Fallback owns the result; the source and all watchdogs are released.' : 'Choosing awaits one same-time correlated factory outcome; no source/timer remains.',
    'RxJS 7.8.2 finalizes the source before building factory info: lastValue is null even after source values, while seen and meta survive.', currentTimer,
    (s, e) => { if (!source(s)) throw Error('Expected source expiry.');
      const cleanup = sourceCleanup(s);
      return withMode === 'constant'
        ? { state: { phase: 'Fallback', clock: e.now, token: fallbackToken! }, actions: [...cleanup, acquire(fallbackRef)] }
        : { state: { phase: 'Choosing', clock: e.now, seen: s.seen }, actions: [...cleanup, invoke('timeoutFactory', 0, { meta, seen: s.seen, lastValue: null } satisfies TimeoutInfo)] }; });
  if (withMode !== 'constant') {
    if (withMode === 'factory') {
      add('FACTORY-RETURN', 'Choosing', 'callback.return', 'Fallback', 'matching factory returns a valid Observable token at invocation time',
        ['subscribe returned fallback Observable'], 'Fallback with no timeout timer.',
        'The timeout watchdog applies only to the original source; the replacement is not timed again.',
        (s, e) => currentFactory(s, e) && e.type === 'callback.return' && typeof e.token === 'string' && e.token.length > 0,
        (_s, e) => { if (e.type !== 'callback.return') throw Error('Expected factory return.');
          return { state: { phase: 'Fallback', clock: e.now, token: e.token }, actions: [acquire(fallbackRef)] }; });
    }
    add('FACTORY-THROW', 'Choosing', 'callback.throw', 'Closed', 'matching factory throws at invocation time',
      ['forward exact thrown error'], 'Closed error; original source and timer were already released.',
      withMode === 'default' ? 'The external default binding supplies a fresh pinned TimeoutError; the pure model does not construct its prototype.' : 'A custom factory throw reaches the error channel without a fallback connection.', currentFactory,
      (_s, e) => { if (e.type !== 'callback.throw') throw Error('Expected factory throw.');
        return { state: closed(e.now, 'error'), actions: [failWith(e.error)] }; });
  }
  if (withMode !== 'default') {
    add('FALLBACK-NEXT', 'Fallback', 'fallback.next', 'Fallback', 'notification belongs to the live fallback generation',
      ['forward exact fallback value without scheduling'], 'Same fallback token; source stays disconnected.',
      'Replacement values can differ in type from original source values and are not inspected.', currentFallback,
      (s, e) => { if (s.phase !== 'Fallback' || e.type !== 'fallback.next') throw Error('Expected fallback value.');
        return { state: { ...s, clock: e.now }, actions: [emit(e.value)] }; });
    for (const terminal of ['complete', 'error'] as const) {
      add('FALLBACK-' + terminal.toUpperCase(), 'Fallback', terminal === 'complete' ? 'fallback.complete' : 'fallback.error', 'Closed', 'notification belongs to live fallback',
        [terminal === 'complete' ? 'complete result' : 'forward exact fallback error', 'release fallback'], 'Closed ' + terminal + '; no source or timer exists.',
        'The replacement determines the final result lifetime after timeout.', currentFallback,
        (_s, e) => ({ state: closed(e.now, terminal), actions: [e.type === 'fallback.error' ? failWith(e.error) : finish, release(fallbackRef)] }));
    }
    add('CANCEL-FALLBACK', 'Fallback', 'cancel', 'Closed', 'consumer closes the replacement connection',
      ['release fallback silently'], 'Closed cancel; do not release original source twice.',
      'The currently owned connection alone is cancelled.', () => true,
      (_s, e) => ({ state: closed(e.now, 'cancel'), actions: [release(fallbackRef)] }));
  }
  const firstText = first === null ? 'none' : typeof first === 'number' ? 'relative-' + first : 'absolute-' + first.at;
  return {
    metadata: sessionMetadata({ operator, id: operator + '-first-' + firstText + '-each-' + (each ?? 'none') + '-' + withMode,
      purpose: 'Watch the original source for missing timely values, then release it and fail or connect to a replacement.',
      signature: operator === 'timeout' ? 'timeout : Cω(First,Each,Scheduler,With,Meta) → T* → (T ∪ R)*' : 'timeoutWith : Cω(Due,Replacement,Scheduler) → T* → (T ∪ R)*',
      conditions: ['Source values are forwarded unchanged before timeout.', 'First controls only the first value; positive each restarts after every source value.', 'The source is released before factory/fallback handoff; replacement values are not subject to another watchdog.'],
      parameters: 'first=' + firstText + ', each=' + (each ?? 'none') + ', binding=' + withMode + '. Relative durations are integers 1..1000; absolute first time must be a future safe integer at subscription.',
      callbacks: withMode === 'constant' ? 'No user callback: the deprecated alias captures one constant Observable description.' : 'One explicit same-time timeout factory outcome. Default binding must supply a genuine pinned TimeoutError; custom binding returns a valid Observable token or throws.',
      time: 'Supplied nonnegative safe integer now; deferred FIFO scheduler; current generation fires at or after due. Event/envelope times agree. Equal-time input order controls races; source arrival after a deadline can still win if timer delivery is late.',
      exclusions: ['Synchronous source or fallback notification during subscription acquisition; source setup advancing the clock.', 'Nonpositive/fractional/nonfinite relative durations, expired absolute dates, synchronous queueScheduler, scheduler exceptions and platform timing precision.', 'Promise/Iterable conversions, invalid fallback inputs, factory reentrancy and throwing producer teardown.', 'Default TimeoutError prototype construction is assumed for the supplied factory outcome and checked independently natively.'],
      controls: ['Unsubscribed', 'Source', ...(withMode !== 'constant' ? ['Choosing'] : []), ...(withMode !== 'default' ? ['Fallback'] : []), 'Closed'],
      inputs: [
        { type: 'timer.fire', origin: 'timer', category: 'time', description: 'Current watchdog action executes at supplied now.' },
        ...(withMode !== 'constant' ? callbackInputs : []),
        ...(withMode !== 'default' ? [
          { type: 'fallback.next' as const, origin: 'inner' as const, category: 'notification' as const, description: 'Current replacement emits a value.' },
          { type: 'fallback.complete' as const, origin: 'inner' as const, category: 'notification' as const, description: 'Current replacement completes.' },
          { type: 'fallback.error' as const, origin: 'inner' as const, category: 'notification' as const, description: 'Current replacement fails.' },
        ] : []),
      ],
      resources: [{ id: 'timeoutTimer', kind: 'timer', owner: 'original-source watchdog generation' },
        ...(withMode !== 'constant' ? [{ id: 'timeoutFactory', kind: 'callback' as const, owner: 'one expiry reaction' }] : []),
        ...(withMode !== 'default' ? [{ id: 'fallback', kind: 'subscription' as const, owner: 'replacement result connection' }] : [])],
      actionTypes: ['subscribe', 'unsubscribe', 'notify', 'schedule', 'cancel-timer', ...(withMode !== 'constant' ? ['invoke-callback' as const] : [])],
      additionalSources: ['src/internal/operators/timeout.ts', 'src/internal/util/executeSchedule.ts'],
      testStem: 'session21-timeout', differential: true,
    }), parameters, rules, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      const errors: string[] = [];
      if (s.phase !== 'Unsubscribed' && !natural(s.clock)) errors.push('Invalid supplied clock.');
      if (s.phase === 'Source') {
        if (!natural(s.seen) || !natural(s.nextGeneration) || s.nextGeneration < 1) errors.push('Invalid source counters.');
        if (s.nextGeneration !== (each === null ? 1 : s.seen + 1)) errors.push('Timer counter must reflect admitted source values.');
        if (s.seen === 0 && s.lastValue !== null) errors.push('Unseen source has no retained value.');
        if (s.timer === null && (each !== null || s.seen === 0)) errors.push('Only satisfied first-only policy may be unarmed.');
        if (each === null && s.seen > 0 && s.timer !== null) errors.push('Satisfied first-only policy cannot retain a watchdog.');
        if (s.timer && (!natural(s.timer.generation) || !natural(s.timer.due) || s.timer.due <= s.clock || s.timer.generation + 1 !== s.nextGeneration)) errors.push('Invalid active watchdog identity/deadline.');
      }
      if (s.phase === 'Choosing' && (withMode === 'constant' || !natural(s.seen) || (each === null && s.seen !== 0))) errors.push('Invalid factory phase.');
      if (s.phase === 'Fallback' && (withMode === 'default' || !s.token || (withMode === 'constant' && s.token !== fallbackToken))) errors.push('Invalid replacement phase/token.');
      return errors;
    },
    validateReaction: (s, e, r) => [
      ...checkActions(e, r.state.phase, r.actions),
      ...(s.phase === 'Fallback' && r.actions.some(a => a.type === 'schedule') ? ['Replacement must never start a watchdog.'] : []),
      ...(e.type === 'timer.fire' && r.actions[0]?.type !== 'unsubscribe' ? ['Timeout releases original source before handoff.'] : []),
    ],
  };
}

export function createTimeoutModel<T, R = T>(options: TimeoutOptions = { each: 4 }): TimeoutModel<T, R> {
  return createTimeoutPolicyModel<T, R>({ operator: 'timeout', first: options.first ?? null, each: options.each ?? null,
    withMode: options.withMode ?? 'default', fallbackToken: null, meta: options.meta ?? null });
}
/** Numeric due is each; {at} is the public Date overload's first-only policy. */
export function createTimeoutWithModel<T, R = T>(due: TimeoutFirst = 4, fallbackToken = 'fallback'): TimeoutModel<T, R> {
  if (typeof fallbackToken !== 'string' || fallbackToken.length === 0) throw new TypeError('A nonempty fallback Observable token is required.');
  return createTimeoutPolicyModel<T, R>({ operator: 'timeoutWith', first: typeof due === 'number' ? null : due,
    each: typeof due === 'number' ? due : null, withMode: 'constant', fallbackToken, meta: null });
}
export function runTimeoutTrace<T, R>(model: TimeoutModel<T, R>, inputs: readonly TimedEvent<TimeoutEvent<T, R>>[],
  options: Readonly<{ executionId: string; maxSteps?: number }>): Trace<TimeoutState<T>, TimeoutEvent<T, R>, Action<unknown>> {
  for (const input of inputs) if (input.time !== input.event.now) throw new Error('Timeout event and envelope clocks must agree.');
  return runTrace(model, inputs, options);
}
export const timeoutExample: readonly TimedEvent<TimeoutEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe', now: 0 } }, { time: 1, event: { type: 'source.next', now: 1, value: 'A' } },
  { time: 3, event: { type: 'source.next', now: 3, value: 'B' } }, { time: 4, event: { type: 'source.complete', now: 4 } },
];
export const timeoutFirstExample: readonly TimedEvent<TimeoutEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe', now: 0 } }, { time: 1, event: { type: 'source.next', now: 1, value: 'A' } },
  { time: 9, event: { type: 'source.next', now: 9, value: 'B' } }, { time: 10, event: { type: 'source.complete', now: 10 } },
];
export const timeoutFirstEachExample: readonly TimedEvent<TimeoutEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe', now: 0 } }, { time: 1, event: { type: 'source.next', now: 1, value: 'A' } },
  { time: 4, event: { type: 'timer.fire', now: 4, resource: timerRef(1) } },
  { time: 4, event: { type: 'callback.return', now: 4, resource: factoryRef, token: 'fallback' } },
  { time: 5, event: { type: 'fallback.next', now: 5, resource: fallbackRef, value: 'R' } },
  { time: 7, event: { type: 'fallback.complete', now: 7, resource: fallbackRef } },
];
export const timeoutAbsoluteExample: readonly TimedEvent<TimeoutEvent<string>>[] = [
  { time: 2, event: { type: 'subscribe', now: 2 } }, { time: 5, event: { type: 'timer.fire', now: 5, resource: timerRef(0) } },
  { time: 5, event: { type: 'callback.return', now: 5, resource: factoryRef, token: 'fallback' } },
  { time: 6, event: { type: 'fallback.next', now: 6, resource: fallbackRef, value: 'R' } },
  { time: 8, event: { type: 'fallback.complete', now: 8, resource: fallbackRef } },
];
export const timeoutWithExample: readonly TimedEvent<TimeoutEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe', now: 0 } }, { time: 1, event: { type: 'source.next', now: 1, value: 'A' } },
  { time: 5, event: { type: 'timer.fire', now: 5, resource: timerRef(1) } },
  { time: 6, event: { type: 'fallback.next', now: 6, resource: fallbackRef, value: 'R' } },
  { time: 8, event: { type: 'fallback.complete', now: 8, resource: fallbackRef } },
];
export const timeoutWithDateExample: readonly TimedEvent<TimeoutEvent<string>>[] = timeoutAbsoluteExample.filter(input => input.event.type !== 'callback.return');
