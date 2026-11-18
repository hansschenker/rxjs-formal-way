import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent, Trace } from '../schema.js';
import { runTrace } from '../runner.js';
import { acquire, release, sourceRef, emit, finish, failWith, invoke, natural, sameResource,
  sessionMetadata, namedRule, checkActions } from './session21-common.js';
import type { CloseReason, SourceEvent } from './session21-common.js';

export type ClockOperator = 'timeInterval' | 'timestamp';
export type ClockParameters = Readonly<{ operator: ClockOperator; clock: 'supplied-finite-now' }>;
export type ClockState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'ReadingStart'; read: 0 }>
  | Readonly<{ phase: 'Listening'; previous: number | null; nextRead: number }>
  | Readonly<{ phase: 'ReadingNext'; previous: number | null; read: number; value: T }>
  | Readonly<{ phase: 'Closed'; reason: CloseReason }>;
export type ClockEvent<T> = SourceEvent<T>
  | Readonly<{ type: 'clock.return'; resource: ResourceRef; reading: number }>
  | Readonly<{ type: 'clock.throw'; resource: ResourceRef; error: unknown }>;
export type ClockOutput<T> = Readonly<{ value: T; interval: number }> | Readonly<{ value: T; timestamp: number }>;
export type ClockModel<T> = OperatorModel<ClockParameters, ClockState<T>, ClockEvent<T>, Action<unknown>>;
const clockRef = (operator: ClockOperator, read: number): ResourceRef => ({ id: operator + '.now', generation: read });
const finiteReading = (reading: number): boolean => Number.isFinite(reading);

/** Read requests are descriptions. Only the external provider supplies a reading or throws. */
export function createClockModel<T>(operator: ClockOperator): ClockModel<T> {
  if (operator !== 'timeInterval' && operator !== 'timestamp') throw new TypeError('invalid clock operator');
  const interval = operator === 'timeInterval';
  type S = ClockState<T>; type E = ClockEvent<T>; type A = Action<unknown>;
  const rule = namedRule<ClockParameters, S, E>;
  const request = (read: number): A => invoke(operator + '.now', read, undefined);
  const pending = (s: S): s is Extract<S, { phase: 'ReadingStart' | 'ReadingNext' }> => s.phase === 'ReadingStart' || s.phase === 'ReadingNext';
  const matches = (s: S, e: E): boolean => pending(s) && (e.type === 'clock.return' || e.type === 'clock.throw')
    && sameResource(e.resource, clockRef(operator, s.read));
  const rules: Rule<ClockParameters, S, E, A>[] = [];
  if (interval) {
    rules.push(rule(operator, 'START-READ', 'Unsubscribed', 'subscribe', 'ReadingStart', 'first result connection',
      ['request scheduler.now before source acquisition'], 'ReadingStart for read zero; no source subscription exists yet.',
      'The first interval starts at this connection, so a baseline reading is required before acquiring the source.', () => true,
      () => ({ state: { phase: 'ReadingStart', read: 0 }, actions: [request(0)] })));
    rules.push(rule(operator, 'START-RETURN', 'ReadingStart', 'clock.return', 'Listening', 'matching initial read returns a finite number',
      ['subscribe source'], 'Listening with previous=reading and nextRead=1.',
      'A baseline does not itself produce a value; it belongs to this result subscription.',
      (s, e) => matches(s, e) && e.type === 'clock.return' && finiteReading(e.reading),
      (_s, e) => { if (e.type !== 'clock.return') throw Error('expected clock return');
        return { state: { phase: 'Listening', previous: e.reading, nextRead: 1 }, actions: [acquire(sourceRef)] }; }));
    rules.push(rule(operator, 'START-THROW', 'ReadingStart', 'clock.throw', 'Closed', 'matching initial read throws',
      ['forward exact provider error without acquiring source'], 'Closed error; no source resource requires release.',
      'The operate setup catches a failed baseline reading before source.subscribe is reached.', matches,
      (_s, e) => { if (e.type !== 'clock.throw') throw Error('expected clock throw');
        return { state: { phase: 'Closed', reason: 'error' }, actions: [failWith(e.error)] }; }));
  } else {
    rules.push(rule(operator, 'START', 'Unsubscribed', 'subscribe', 'Listening', 'first result connection',
      ['subscribe source; do not read provider yet'], 'Listening with previous=null and nextRead=0.',
      'timestamp reads only when a source value arrives; construction and connection do not request a timestamp.', () => true,
      () => ({ state: { phase: 'Listening', previous: null, nextRead: 0 }, actions: [acquire(sourceRef)] })));
  }
  rules.push(rule(operator, 'NEXT-READ', 'Listening', 'source.next', 'ReadingNext', 'source is live and next read index can advance safely',
    ['retain exact value and request provider.now'], 'ReadingNext with the source value and correlated read index retained.',
    'No scheduler task is created. The read is part of the synchronous reaction to this value.',
    s => s.phase === 'Listening' && s.nextRead < Number.MAX_SAFE_INTEGER,
    (s, e) => { if (s.phase !== 'Listening' || e.type !== 'source.next') throw Error('expected live source next');
      return { state: { phase: 'ReadingNext', previous: s.previous, read: s.nextRead, value: e.value }, actions: [request(s.nextRead)] }; }));
  rules.push(rule(operator, 'NEXT-RETURN', 'ReadingNext', 'clock.return', 'Listening',
    interval ? 'matching read is finite and reading minus previous remains finite' : 'matching read is finite',
    [interval ? 'emit a fresh record containing the same value and reading minus previous' : 'emit a fresh record containing the same value and supplied timestamp'],
    interval ? 'Listening with previous replaced by this reading and nextRead advanced.' : 'Listening with no historical reading retained and nextRead advanced.',
    interval ? 'A decreasing provider produces a negative interval; no elapsed-time monotonicity is invented.' : 'The provider reading is copied as supplied, independently of the trace-envelope time.',
    (s, e) => matches(s, e) && s.phase === 'ReadingNext' && e.type === 'clock.return'
      && finiteReading(e.reading) && (!interval || (s.previous !== null && finiteReading(e.reading - s.previous))),
    (s, e) => { if (s.phase !== 'ReadingNext' || e.type !== 'clock.return') throw Error('expected next clock return');
      const value: ClockOutput<T> = interval ? { value: s.value, interval: e.reading - s.previous! } : { value: s.value, timestamp: e.reading };
      return { state: { phase: 'Listening', previous: interval ? e.reading : null, nextRead: s.read + 1 }, actions: [emit(value)] }; }));
  rules.push(rule(operator, 'NEXT-THROW', 'ReadingNext', 'clock.throw', 'Closed', 'matching next-value read throws',
    ['forward exact provider error', 'release source without forwarding pending value'], 'Closed error; pending value and baseline are discarded.',
    'The OperatorSubscriber catches a provider failure inside next and closes the existing source connection.', matches,
    (_s, e) => { if (e.type !== 'clock.throw') throw Error('expected clock throw');
      return { state: { phase: 'Closed', reason: 'error' }, actions: [failWith(e.error), release(sourceRef)] }; }));
  rules.push(rule(operator, 'COMPLETE', 'Listening', 'source.complete', 'Closed', 'source completes while no read is pending',
    ['complete downstream', 'release source; perform no clock read'], 'Closed complete with no retained memory.',
    'Terminal notifications are forwarded without time decoration.', () => true,
    () => ({ state: { phase: 'Closed', reason: 'complete' }, actions: [finish, release(sourceRef)] })));
  rules.push(rule(operator, 'ERROR', 'Listening', 'source.error', 'Closed', 'source fails while no read is pending',
    ['forward exact source error', 'release source; perform no clock read'], 'Closed error with no retained memory.',
    'A source error does not request the clock or wrap the error payload.', () => true,
    (_s, e) => { if (e.type !== 'source.error') throw Error('expected source error');
      return { state: { phase: 'Closed', reason: 'error' }, actions: [failWith(e.error), release(sourceRef)] }; }));
  rules.push(rule(operator, 'CANCEL', 'Listening', 'cancel', 'Closed', 'consumer cancels between source reactions',
    ['release source silently; perform no clock read'], 'Closed cancel; memory discarded.',
    'Closing a connection is neither a decorated value nor a terminal notification.', () => true,
    () => ({ state: { phase: 'Closed', reason: 'cancel' }, actions: [release(sourceRef)] })));
  return {
    metadata: sessionMetadata({ operator, id: operator + '-external-clock',
      purpose: interval ? 'Pair each source value with the supplied-clock difference since connection or the preceding value.' : 'Pair each source value with the provider reading taken during that value reaction.',
      signature: operator + ' : Cω(' + (interval ? 'SchedulerClock' : 'TimestampProvider') + ') → T* → ' + (interval ? '{value:T,interval:number}*' : '{value:T,timestamp:number}*'),
      conditions: ['Each successful read produces one fresh wrapper around the unchanged source payload.', 'Provider failure replaces the pending value with its exact error; source terminals and cancellation do not read time.', 'Neither operator schedules work or delays notifications.'],
      parameters: 'One valid, synchronous external now provider. Finite numeric readings; finite differences for timeInterval. Provider readings may be negative, fractional, repeated or decreasing.',
      callbacks: 'Each provider.now request is an explicit invocation with no arguments. A correlated return or throw is supplied; the pure machine never calls a provider.',
      time: 'Trace-envelope time is finite, nonnegative and nondecreasing. Provider readings are separate data and may move backwards. runClockTrace enforces same-envelope-time provider outcomes; no timer is introduced.',
      exclusions: ['Nonfinite provider readings and numeric-overflow differences.', 'Clock-provider receiver/getter mutations, reentrant provider/observer actions, and consumer cancellation during a pending read.', 'Source delivery during acquisition is characterized natively; action ordering here assumes setup has returned.', ...(interval ? ['TimeInterval class/prototype identity: the model exposes its value/interval structural projection; native tests separately inspect actual constructor identity.'] : [])],
      controls: ['Unsubscribed', ...(interval ? ['ReadingStart'] : []), 'Listening', 'ReadingNext', 'Closed'],
      inputs: [
        { type: 'clock.return', origin: 'environment', category: 'time', description: 'Finite value returned by the currently pending synchronous provider read.' },
        { type: 'clock.throw', origin: 'environment', category: 'time', description: 'Opaque error thrown by the currently pending synchronous provider read.' },
      ], resources: [{ id: operator + '.now', kind: 'callback', owner: 'synchronous result-reaction read' }],
      actionTypes: ['subscribe', 'unsubscribe', 'notify', 'invoke-callback'],
      additionalSources: interval ? ['src/internal/util/lift.ts'] : ['src/internal/operators/map.ts', 'src/internal/scheduler/dateTimestampProvider.ts'],
      testStem: 'session21-clock', differential: true,
      initialization: interval ? 'First result connection requests a baseline reading, then acquires source only if that read succeeds.' : 'First result connection acquires source directly; there is no initial clock read.',
    }), parameters: { operator, clock: 'supplied-finite-now' }, rules,
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      const errors: string[] = [];
      if (s.phase === 'ReadingStart' && (!interval || s.read !== 0)) errors.push('Only timeInterval has initial read zero.');
      if (s.phase === 'Listening' || s.phase === 'ReadingNext') {
        const read = s.phase === 'Listening' ? s.nextRead : s.read;
        if (!natural(read) || (interval && read < 1)) errors.push('Invalid clock invocation counter.');
        if (s.phase === 'ReadingNext' && read >= Number.MAX_SAFE_INTEGER) errors.push('Pending read cannot advance its counter.');
        if (interval ? s.previous === null || !finiteReading(s.previous) : s.previous !== null) errors.push('Invalid operator-specific historical reading.');
      }
      return errors;
    },
    validateReaction: (_s, e, r) => [
      ...checkActions(e, r.state.phase, r.actions),
      ...(r.actions.some(a => a.type === 'schedule' || a.type === 'cancel-timer') ? ['Clock decoration cannot schedule work.'] : []),
    ],
  };
}
export const createTimeIntervalModel = <T>(): ClockModel<T> => createClockModel<T>('timeInterval');
export const createTimestampModel = <T>(): ClockModel<T> => createClockModel<T>('timestamp');

/** Provider readings are data; only their invocation/outcome microsteps share envelope time. */
export function runClockTrace<T>(model: ClockModel<T>, inputs: readonly TimedEvent<ClockEvent<T>>[], options: Readonly<{ executionId: string; maxSteps?: number }>): Trace<ClockState<T>, ClockEvent<T>, Action<unknown>> {
  const trace = runTrace(model, inputs, options);
  let pendingAt: number | null = null;
  for (const step of trace.steps) {
    if (step.event.type === 'clock.return' || step.event.type === 'clock.throw') {
      if (step.time !== pendingAt) throw new Error('Synchronous clock outcome must share its invocation envelope time.');
      pendingAt = null;
    }
    if (step.actions.some(a => a.type === 'invoke-callback')) pendingAt = step.time;
  }
  return trace;
}
export const timeIntervalExample: readonly TimedEvent<ClockEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 0, event: { type: 'clock.return', resource: clockRef('timeInterval', 0), reading: 100 } },
  { time: 2, event: { type: 'source.next', value: 'A' } },
  { time: 2, event: { type: 'clock.return', resource: clockRef('timeInterval', 1), reading: 103 } },
  { time: 5, event: { type: 'source.next', value: 'B' } },
  { time: 5, event: { type: 'clock.return', resource: clockRef('timeInterval', 2), reading: 101 } },
  { time: 6, event: { type: 'source.complete' } },
];
export const timestampExample: readonly TimedEvent<ClockEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 2, event: { type: 'source.next', value: 'A' } },
  { time: 2, event: { type: 'clock.return', resource: clockRef('timestamp', 0), reading: 103 } },
  { time: 5, event: { type: 'source.next', value: 'B' } },
  { time: 5, event: { type: 'clock.return', resource: clockRef('timestamp', 1), reading: 101 } },
  { time: 6, event: { type: 'source.complete' } },
];
