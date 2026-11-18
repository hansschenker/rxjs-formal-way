import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent, Trace } from '../schema.js';
import { runTrace } from '../runner.js';
import { acquire, release, sourceRef, emit, finish, failWith, invoke, natural, sameResource,
  sessionMetadata, namedRule, callbackInputs, checkActions } from './session20-common.js';
import type { CloseReason } from './session20-common.js';

export type ThrottleMode = 'throttle' | 'throttleTime';
export type ThrottleOptions = Readonly<{ leading?: boolean; trailing?: boolean }>;
export type ThrottleParameters = Readonly<{ mode: ThrottleMode; leading: boolean; trailing: boolean; duration: number | null }>;
export type ThrottleMemory<T> = Readonly<{ clock: number; nextGeneration: number; hasValue: boolean; value: T | null }>;
export type ThrottleState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (ThrottleMemory<T> & Readonly<{ phase: 'Open' }>)
  | (ThrottleMemory<T> & Readonly<{ phase: 'Selecting'; generation: number; argument: T }>)
  | (ThrottleMemory<T> & Readonly<{ phase: 'Throttled' | 'Waiting'; generation: number; due: number | null; token: string | null }>)
  | Readonly<{ phase: 'Closed'; clock: number; reason: CloseReason }>;
export type ThrottleEvent<T> = Readonly<{ now: number }> & (
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; token: string }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>
  | Readonly<{ type: 'duration.next' | 'duration.complete' | 'timer.fire'; resource: ResourceRef }>
  | Readonly<{ type: 'duration.error'; resource: ResourceRef; error: unknown }>
);
export type ThrottleModel<T> = OperatorModel<ThrottleParameters, ThrottleState<T>, ThrottleEvent<T>, Action<unknown>>;
const durationRef = (generation: number): ResourceRef => ({ id: 'duration', generation });
const timerRef = (generation: number): ResourceRef => ({ id: 'throttleTimer', generation });
const selectorRef = (generation: number): ResourceRef => ({ id: 'durationSelector', generation });

/** One policy kernel; signal and timer profiles expose only their reachable event/rule alphabets. */
export function createThrottlePolicyModel<T>(mode: ThrottleMode, options: ThrottleOptions = {}, duration: number | null = null): ThrottleModel<T> {
  if (mode !== 'throttle' && mode !== 'throttleTime') throw new TypeError('invalid throttle mode');
  if (mode === 'throttleTime' && (duration === null || !natural(duration) || duration < 1 || duration > 1000)) throw new RangeError('throttleTime model duration must be an integer in 1..1000');
  if (mode === 'throttle' && duration !== null) throw new TypeError('signal throttle has no duration number');
  const { leading = true, trailing = false } = options;
  if (typeof leading !== 'boolean' || typeof trailing !== 'boolean') throw new TypeError('leading and trailing must be booleans');
  const timed = mode === 'throttleTime';
  const parameters: ThrottleParameters = { mode, leading, trailing, duration };
  type S = ThrottleState<T>; type E = ThrottleEvent<T>; type A = Action<unknown>;
  type Memory = ThrottleMemory<T>;
  type Gate = Memory & Readonly<{ phase: 'Throttled' | 'Waiting'; generation: number; due: number | null; token: string | null }>;
  const gate = (s: S): s is Gate => s.phase === 'Throttled' || s.phase === 'Waiting';
  const memory = (s: Memory, now: number): Memory => ({ clock: now, nextGeneration: s.nextGeneration, hasValue: s.hasValue, value: s.value });
  const cleared = (s: Memory, now: number): Memory => ({ ...memory(s, now), hasValue: false, value: null });
  const closed = (now: number, reason: CloseReason): S => ({ phase: 'Closed', clock: now, reason });
  const stop = (s: Gate): A => timed ? { type: 'cancel-timer', resource: timerRef(s.generation) } : release(durationRef(s.generation));
  const canBegin = (s: Memory, now: number): boolean => s.nextGeneration < Number.MAX_SAFE_INTEGER
    && (!timed || natural(now + duration!));
  const begin = (s: Memory, argument: T, now: number, prefix: readonly A[] = []): { state: S; actions: readonly A[] } => {
    const generation = s.nextGeneration;
    const next: Memory = { ...memory(s, now), nextGeneration: generation + 1 };
    return timed
      ? { state: { ...next, phase: 'Throttled', generation, due: now + duration!, token: null },
          actions: [...prefix, { type: 'schedule', resource: timerRef(generation), delay: duration! }] }
      : { state: { ...next, phase: 'Selecting', generation, argument },
          actions: [...prefix, invoke('durationSelector', generation, argument)] };
  };
  const timeOk = (s: S, e: E): boolean => natural(e.now) && (s.phase === 'Unsubscribed' || e.now >= s.clock);
  const currentDuration = (s: S, e: E): boolean => gate(s) && 'resource' in e
    && sameResource(e.resource, timed ? timerRef(s.generation) : durationRef(s.generation))
    && (!timed || (s.due !== null && e.now >= s.due));
  const currentSelector = (s: S, e: E): boolean => s.phase === 'Selecting'
    && (e.type === 'callback.return' || e.type === 'callback.throw') && e.now === s.clock
    && sameResource(e.resource, selectorRef(s.generation));
  const rules: Rule<ThrottleParameters, S, E, A>[] = [];
  const add = (name: string, from: S['phase'], event: E['type'], to: S['phase'], guard: string,
    actions: readonly string[], nextState: string, explanation: string,
    enabled: (s: S, e: E) => boolean, react: (s: S, e: E) => { state: S; actions: readonly A[] }): void => {
    rules.push(namedRule<ThrottleParameters, S, E>(mode, name, from, event, to,
      guard + '; valid nondecreasing supplied time', actions, nextState, explanation,
      (s, e) => timeOk(s, e) && enabled(s, e), react));
  };
  add('START', 'Unsubscribed', 'subscribe', 'Open', 'first result connection', ['subscribe source; create no duration yet'],
    'Open with empty pending memory and next duration generation zero.', 'The first value, not subscription itself, starts throttling.',
    () => true, (_s, e) => ({ state: { phase: 'Open', clock: e.now, nextGeneration: 0, hasValue: false, value: null }, actions: [acquire(sourceRef)] }));
  add('OPEN-NEXT', 'Open', 'source.next', timed ? 'Throttled' : 'Selecting', 'no active duration; leading=' + leading,
    [...(leading ? ['clear pending presence and emit the incoming value'] : ['remember incoming value without output']), timed ? 'schedule the next duration action' : 'invoke duration selector with that value'],
    leading ? 'Duration generation advances; pending memory is empty after leading output.' : 'Duration generation advances; this value is pending for a possible trailing output.',
    'A leading emission precedes duration selection/acquisition. With leading=false the same source value still starts a duration.',
    (s, e) => s.phase === 'Open' && canBegin(s, e.now),
    (s, e) => { if (s.phase !== 'Open' || e.type !== 'source.next') throw Error('expected open next');
      const m = leading ? cleared(s, e.now) : { ...memory(s, e.now), hasValue: true, value: e.value };
      return begin(m, e.value, e.now, leading ? [emit(e.value)] : []); });
  if (!timed) {
    add('SELECTOR-RETURN', 'Selecting', 'callback.return', 'Throttled', 'current selector invocation returns a valid Observable token at the same time',
      ['subscribe returned duration Observable'], 'Throttled with the current generation, returned token and unchanged pending memory.',
      'The returned Observable describes the duration. Each accepted invocation creates a separate duration subscription, even when the token is reused.',
      (s, e) => currentSelector(s, e) && e.type === 'callback.return' && typeof e.token === 'string' && e.token.length > 0,
      (s, e) => { if (s.phase !== 'Selecting' || e.type !== 'callback.return') throw Error('expected selector return');
        return { state: { ...memory(s, e.now), phase: 'Throttled', generation: s.generation, due: null, token: e.token }, actions: [acquire(durationRef(s.generation))] }; });
    add('SELECTOR-THROW', 'Selecting', 'callback.throw', 'Closed', 'current selector invocation throws at the same time',
      ['forward exact selector error', 'release source'], 'Closed error; do not acquire a duration.',
      'A leading value may already have been observed before the selector fails.', currentSelector,
      (_s, e) => { if (e.type !== 'callback.throw') throw Error('expected selector throw');
        return { state: closed(e.now, 'error'), actions: [failWith(e.error), release(sourceRef)] }; });
  }
  add('REMEMBER', 'Throttled', 'source.next', 'Throttled', 'a duration is active', ['replace pending value without restarting duration or emitting'],
    'Same duration generation/deadline; pending presence=true with newest payload.',
    'Busy source values update latest memory. They do not call the selector or postpone the current timer.',
    s => s.phase === 'Throttled',
    (s, e) => { if (s.phase !== 'Throttled' || e.type !== 'source.next') throw Error('expected throttled next');
      return { state: { ...s, clock: e.now, hasValue: true, value: e.value }, actions: [] }; });
  const endEvent = timed ? 'timer.fire' : 'duration.next';
  if (trailing) {
    add('END-EMIT-RESTART', 'Throttled', endEvent, timed ? 'Throttled' : 'Selecting', 'current duration ends with a pending value and trailing=true',
      ['release current duration', 'clear pending presence and emit latest value', timed ? 'schedule a fresh duration' : 'invoke selector for emitted trailing value'],
      'Pending memory is empty; a new duration generation starts while source remains live.',
      'A trailing output starts another throttle duration. It is not merely an audit-style return to idle.',
      (s, e) => s.phase === 'Throttled' && currentDuration(s, e) && s.hasValue && canBegin(s, e.now),
      (s, e) => { if (s.phase !== 'Throttled') throw Error('expected live duration');
        return begin(cleared(s, e.now), s.value as T, e.now, [stop(s), emit(s.value)]); });
  }
  add('END-OPEN', 'Throttled', endEvent, 'Open', trailing ? 'current duration ends without a pending value' : 'current duration ends; trailing=false',
    ['release current duration; emit nothing'], 'Open with no active duration; preserve any un-emitted internal memory until replaced.',
    'No trailing emission means no automatic new duration. A later source value starts the next duration.',
    (s, e) => s.phase === 'Throttled' && currentDuration(s, e) && (!trailing || !s.hasValue),
    (s, e) => { if (s.phase !== 'Throttled') throw Error('expected duration');
      return { state: { ...memory(s, e.now), phase: 'Open' }, actions: [stop(s)] }; });
  if (!timed) {
    add('DURATION-EMPTY', 'Throttled', 'duration.complete', 'Open', 'current duration completes without a next',
      ['release completed duration; do not flush pending value'], 'Open; the pending reference is retained internally, not emitted.',
      'Duration complete uses cleanupThrottling, not endThrottling: next and complete are distinct control signals.', currentDuration,
      (s, e) => { if (s.phase !== 'Throttled') throw Error('expected duration completion');
        return { state: { ...memory(s, e.now), phase: 'Open' }, actions: [stop(s)] }; });
  }
  add('COMPLETE-OPEN', 'Open', 'source.complete', 'Closed', 'source completes with no active duration',
    ['complete result without flushing retained value', 'release source'], 'Closed complete; all pending memory discarded.',
    'There is no active duration to justify waiting, even if an empty duration previously left internal pending memory.', s => s.phase === 'Open',
    (_s, e) => ({ state: closed(e.now, 'complete'), actions: [finish, release(sourceRef)] }));
  if (trailing) {
    add('COMPLETE-WAIT', 'Throttled', 'source.complete', 'Waiting', 'trailing=true and a value is pending behind a live duration',
      ['release completed source; keep duration live'], 'Waiting with source closed, one duration owned and latest value retained.',
      'Source completion is not an immediate flush. The pending trailing value still waits for the duration signal.',
      s => s.phase === 'Throttled' && s.hasValue,
      (s, e) => { if (s.phase !== 'Throttled') throw Error('expected duration');
        return { state: { ...s, phase: 'Waiting', clock: e.now }, actions: [release(sourceRef)] }; });
    add('WAIT-END', 'Waiting', endEvent, 'Closed', 'current duration ends after source completion',
      ['release current duration', 'emit the retained trailing value', 'complete result; do not start another duration'],
      'Closed complete; source was already released, duration and memory are now gone.',
      'The trailing value precedes final completion, but source termination prevents restarting a duration.', currentDuration,
      (s, e) => { if (s.phase !== 'Waiting') throw Error('expected waiting');
        return { state: closed(e.now, 'complete'), actions: [stop(s), emit(s.value), finish] }; });
    if (!timed) {
      add('WAIT-EMPTY', 'Waiting', 'duration.complete', 'Closed', 'current duration completes without next after source completion',
        ['complete result without trailing output', 'release completed duration'], 'Closed complete; pending value discarded.',
        'Empty duration completion can finish the waiting result, but it never substitutes for a next-triggered flush. The completion handler precedes its own finalization.', currentDuration,
        (s, e) => { if (s.phase !== 'Waiting') throw Error('expected waiting');
          return { state: closed(e.now, 'complete'), actions: [finish, stop(s)] }; });
    }
  }
  add('COMPLETE-NOW', 'Throttled', 'source.complete', 'Closed', trailing ? 'there is no pending value' : 'trailing=false',
    ['complete result immediately', 'release source', 'release active duration'], 'Closed complete; no pending value is emitted.',
    'A lone leading value does not require waiting for its duration to expire.',
    s => s.phase === 'Throttled' && (!trailing || !s.hasValue),
    (s, e) => { if (s.phase !== 'Throttled') throw Error('expected duration');
      return { state: closed(e.now, 'complete'), actions: [finish, release(sourceRef), stop(s)] }; });
  for (const phase of ['Open', 'Throttled'] as const) {
    add('SOURCE-ERROR-' + phase.toUpperCase(), phase, 'source.error', 'Closed', 'source fails',
      ['forward exact source error', 'release source and any active duration without flushing'], 'Closed error; pending value discarded.',
      'Failure is never delayed until a duration ends.', () => true,
      (s, e) => { if (e.type !== 'source.error') throw Error('expected source error');
        return { state: closed(e.now, 'error'), actions: [failWith(e.error), release(sourceRef), ...(gate(s) ? [stop(s)] : [])] }; });
  }
  const cancellable: readonly ('Open' | 'Throttled' | 'Waiting')[] = trailing ? ['Open', 'Throttled', 'Waiting'] : ['Open', 'Throttled'];
  for (const phase of cancellable) {
    add('CANCEL-' + phase.toUpperCase(), phase, 'cancel', 'Closed', 'consumer cancels this execution',
      ['release only still-owned source/duration resources; emit nothing'], 'Closed cancel; clear all memory.',
      'Cancellation during completion-waiting releases only the duration; the source has already ended.', () => true,
      (s, e) => ({ state: closed(e.now, 'cancel'), actions: [...(s.phase === 'Waiting' ? [] : [release(sourceRef)]), ...(gate(s) ? [stop(s)] : [])] }));
  }
  if (!timed) {
    for (const phase of (trailing ? ['Throttled', 'Waiting'] : ['Throttled']) as readonly ('Throttled' | 'Waiting')[]) {
      add('DURATION-ERROR-' + phase.toUpperCase(), phase, 'duration.error', 'Closed', 'currently owned duration fails',
        ['forward exact duration error', 'release still-live source and duration without flushing'], 'Closed error; pending value discarded.',
        'Duration errors use the error channel, including after the source has already completed.', currentDuration,
        (s, e) => { if (!gate(s) || e.type !== 'duration.error') throw Error('expected duration error');
          return { state: closed(e.now, 'error'), actions: [failWith(e.error), ...(s.phase === 'Waiting' ? [] : [release(sourceRef)]), stop(s)] }; });
    }
  }
  return {
    metadata: sessionMetadata({ operator: mode, id: mode + '-' + Number(leading) + Number(trailing) + (timed ? '-' + duration : ''),
      purpose: 'Select leading and/or latest trailing source values using one active ' + (timed ? 'scheduled duration.' : 'duration Observable.'),
      signature: mode + ' : Cω(' + (timed ? 'Duration,Scheduler' : 'DurationSignal') + ',Leading,Trailing) → T* → T*',
      conditions: ['Source values only are forwarded; duration payloads are ignored.', 'Busy values do not extend a duration. A trailing output starts another duration while the source is live.', 'Source completion waits only when trailing output is enabled, a value is pending and a duration is active.', 'With both flags false, no next notification is emitted.'],
      parameters: 'leading=' + leading + ', trailing=' + trailing + '. ' + (timed ? 'Positive integer duration 1..1000 with a deferred FIFO virtual scheduler.' : 'Valid Observable-returning duration selector; every returned token identifies its producer description.'),
      callbacks: timed ? 'No user callback. A scheduled duration is a source of timer.fire inputs.' : 'Selector invocation and correlated return/throw are explicit. Its payload is the value that starts a duration, including a trailing output.',
      time: 'All event times are supplied nonnegative safe integers. Equal-time order is input order. ' + (timed ? 'timer.fire must name the current generation and occur at or after its deadline; lateness does not backdate output. No progress occurs merely because a deadline exists.' : 'Source and duration Observables supply time; selector outcomes remain at invocation time. No internal clock is created.'),
      exclusions: timed ? ['Zero/negative/fractional durations, synchronous queueScheduler, custom scheduler exceptions and platform timing precision.']
        : ['Promise/Iterable conversion and invalid duration inputs.', 'Synchronous duration delivery during subscription acquisition; separately characterized natively.'],
      controls: ['Unsubscribed', 'Open', ...(!timed ? ['Selecting'] : []), 'Throttled', ...(trailing ? ['Waiting'] : []), 'Closed'],
      inputs: timed ? [{ type: 'timer.fire', origin: 'timer', category: 'time', description: 'Current scheduled duration action executes at supplied now.' }]
        : [...callbackInputs,
          { type: 'duration.next', origin: 'inner', category: 'notification', description: 'Current duration emits its first next; payload is irrelevant.' },
          { type: 'duration.complete', origin: 'inner', category: 'notification', description: 'Current duration completes without a next.' },
          { type: 'duration.error', origin: 'inner', category: 'notification', description: 'Current duration fails with an opaque error.' }],
      resources: timed ? [{ id: 'throttleTimer', kind: 'timer', owner: 'current duration generation' }]
        : [{ id: 'duration', kind: 'subscription', owner: 'result execution' }, { id: 'durationSelector', kind: 'callback', owner: 'duration acquisition microstep' }],
      actionTypes: timed ? ['subscribe', 'unsubscribe', 'notify', 'schedule', 'cancel-timer'] : ['subscribe', 'unsubscribe', 'notify', 'invoke-callback'],
      additionalSources: timed ? ['src/internal/operators/throttle.ts', 'src/internal/observable/timer.ts'] : [],
    }), parameters, rules, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      const errors: string[] = [];
      if (s.phase !== 'Unsubscribed' && !natural(s.clock)) errors.push('Invalid supplied clock.');
      if (s.phase === 'Open' || s.phase === 'Selecting' || gate(s)) {
        if (!natural(s.nextGeneration) || typeof s.hasValue !== 'boolean') errors.push('Invalid generation or presence.');
        if (!s.hasValue && s.value !== null) errors.push('Absent pending value must clear its reference.');
        if (s.phase !== 'Open' && (!natural(s.generation) || s.generation + 1 !== s.nextGeneration)) errors.push('Active generation does not match next counter.');
      }
      if (s.phase === 'Selecting' && timed) errors.push('Timer profile never calls a duration selector.');
      if (s.phase === 'Waiting' && (!trailing || !s.hasValue)) errors.push('Only a pending trailing value permits waiting.');
      if (gate(s)) {
        if (timed && (s.token !== null || s.due === null || !natural(s.due))) errors.push('Timer profile requires a due time and no Observable token.');
        if (!timed && (s.due !== null || typeof s.token !== 'string' || s.token.length === 0)) errors.push('Signal profile requires a valid token and no deadline.');
      }
      return errors;
    },
    validateReaction: (s, e, r) => [
      ...checkActions(e, r.state.phase, r.actions),
      ...(s.phase === 'Throttled' && e.type === 'source.next' && r.actions.length ? ['Busy source values cannot output or restart duration.'] : []),
      ...(e.type === 'duration.complete' && r.actions.some(a => a.type === 'notify' && a.notification.kind === 'N') ? ['Duration completion is not a trailing flush.'] : []),
      ...(!leading && !trailing && r.actions.some(a => a.type === 'notify' && a.notification.kind === 'N') ? ['Both flags false forbids every next.'] : []),
      ...(s.phase === 'Waiting' && r.actions.some(a => a.type === 'subscribe' || a.type === 'schedule' || a.type === 'invoke-callback') ? ['Source-completed waiting cannot restart a duration.'] : []),
    ],
  };
}
export const createThrottleModel = <T>(options: ThrottleOptions = {}): ThrottleModel<T> => createThrottlePolicyModel<T>('throttle', options);
export const createThrottleTimeModel = <T>(duration = 4, options: ThrottleOptions = {}): ThrottleModel<T> => createThrottlePolicyModel<T>('throttleTime', options, duration);
export function runThrottleTrace<T>(model: ThrottleModel<T>, inputs: readonly TimedEvent<ThrottleEvent<T>>[], options: Readonly<{ executionId: string; maxSteps?: number }>): Trace<ThrottleState<T>, ThrottleEvent<T>, Action<unknown>> {
  if (inputs.some(x => x.event.now !== x.time)) throw new Error('Event now must match its trace envelope time.');
  return runTrace(model, inputs, options);
}
export function throttleExample(mode: ThrottleMode, options: ThrottleOptions = {}): readonly TimedEvent<ThrottleEvent<string>>[] {
  const trailing = options.trailing ?? false;
  const inputs: TimedEvent<ThrottleEvent<string>>[] = [
    { time: 0, event: { type: 'subscribe', now: 0 } },
    { time: 1, event: { type: 'source.next', value: 'A', now: 1 } },
  ];
  if (mode === 'throttle') inputs.push({ time: 1, event: { type: 'callback.return', resource: selectorRef(0), token: 'duration-A', now: 1 } });
  inputs.push({ time: 2, event: { type: 'source.next', value: 'B', now: 2 } }, { time: 3, event: { type: 'source.complete', now: 3 } });
  if (trailing) inputs.push({ time: 5, event: { type: mode === 'throttle' ? 'duration.next' : 'timer.fire', resource: mode === 'throttle' ? durationRef(0) : timerRef(0), now: 5 } });
  return inputs;
}
