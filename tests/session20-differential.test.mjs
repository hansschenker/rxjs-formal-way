import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject } from 'rxjs';
import { takeLast, tap, throttle, throttleTime, throwIfEmpty } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { runTrace } from '../dist/runner.js';
import { createTakeLastModel, createThrowIfEmptyModel } from '../dist/models/session20-terminal.js';
import { createTapModel, allTapHooks } from '../dist/models/session20-tap.js';
import { createThrottleModel, createThrottleTimeModel, runThrottleTrace } from '../dist/models/session20-throttle.js';

// These adapters observe actual RxJS. They never call model transitions to decide what native RxJS should do.
// Both sides receive the same external commands and actual opaque callback outcomes.
const resource = (id, generation = 0) => ({ id, generation });
const sourceRef = resource('source');
const notify = notification => ({ type: 'notify', target: 'downstream', notification });
const invoke = (id, index, value) => ({ type: 'invoke-callback', resource: resource(id, index), index, value });
const predicted = trace => trace.steps.flatMap(s => s.actions.map(action => ({ time: s.time, ...action })));
const outputOnly = log => log.filter(a => a.type === 'notify');
const fault = Object.freeze({ fault: 'source' });
const hookFault = Object.freeze({ fault: 'hook' });
function recordObserver(write) {
  return { next: value => write(notify({ kind: 'N', value })), error: error => write(notify({ kind: 'E', error })), complete: () => write(notify({ kind: 'C' })) };
}
function recordedSource(write) {
  const subject = new Subject();
  let sink;
  const observable = new Observable(subscriber => {
    sink = subscriber; write({ type: 'subscribe', resource: sourceRef });
    const subscription = subject.subscribe(subscriber);
    return () => { subscription.unsubscribe(); write({ type: 'unsubscribe', resource: sourceRef }); };
  });
  return { observable, subject, live: () => Boolean(sink && !sink.closed) };
}
function scalarRun(kind, values, end, option) {
  let now = 0, index = 0;
  const inputs = [{ time: now, event: { type: 'subscribe' } }], actual = [];
  const write = action => actual.push({ time: now, ...action });
  const add = event => inputs.push({ time: now, event });
  const source = recordedSource(write);
  let model, operator;
  if (kind === 'takeLast') { model = createTakeLastModel(option); operator = takeLast(option); }
  if (kind === 'throwIfEmpty') {
    model = createThrowIfEmptyModel('custom');
    operator = throwIfEmpty(() => {
      write(invoke('errorFactory', 0, undefined));
      if (option === 'throw') { add({ type: 'callback.throw', resource: resource('errorFactory'), error: hookFault }); throw hookFault; }
      add({ type: 'callback.return', resource: resource('errorFactory'), value: hookFault }); return hookFault;
    });
  }
  if (kind === 'tap') {
    model = createTapModel();
    const handler = (hook, value) => {
      const current = index; write(invoke('tap.' + hook, current, value));
      if (option === hook) { add({ type: 'callback.throw', resource: resource('tap.' + hook, current), error: hookFault }); throw hookFault; }
      add({ type: 'callback.return', resource: resource('tap.' + hook, current) });
      if (hook === 'next') index++;
    };
    operator = tap({
      subscribe: () => write(invoke('tap.subscribe', 0, undefined)),
      next: value => handler('next', value), error: error => handler('error', error), complete: () => handler('complete', undefined),
      unsubscribe: () => write(invoke('tap.unsubscribe', 0, undefined)), finalize: () => write(invoke('tap.finalize', 0, undefined)),
    });
  }
  const connection = source.observable.pipe(operator).subscribe(recordObserver(write));
  for (const value of values) {
    now++;
    if (source.live()) { add({ type: 'source.next', value }); source.subject.next(value); }
  }
  now++;
  if (end === 'cancel') { if (!connection.closed) { add({ type: 'cancel' }); connection.unsubscribe(); } }
  else if (source.live()) {
    add(end === 'complete' ? { type: 'source.complete' } : { type: 'source.error', error: fault });
    end === 'complete' ? source.subject.complete() : source.subject.error(fault);
  }
  assert.deepEqual(predicted(runTrace(model, inputs, { executionId: kind + '-native-comparison' })), actual,
    JSON.stringify({ kind, values, end, option }));
}
const words = [[], ['A'], ['A', 'B'], ['A', 'B', 'C'], [undefined, null], [fault, fault]];
test('S20 DIFF terminal/tap: 198 bounded comparisons include callbacks, exact payloads and ordered teardown', () => {
  let comparisons = 0;
  for (const values of words) for (const end of ['complete', 'error', 'cancel']) {
    for (const count of [-1, 0, 1, 2, 4]) { scalarRun('takeLast', values, end, count); comparisons++; }
    for (const outcome of ['return', 'throw']) { scalarRun('throwIfEmpty', values, end, outcome); comparisons++; }
    for (const throwHook of [null, 'next', 'error', 'complete']) { scalarRun('tap', values, end, throwHook); comparisons++; }
  }
  assert.equal(comparisons, 198); console.log('SESSION20_SCALAR_COMPARISONS', comparisons);
});

function signalRun(options, commands, throwOn = -1) {
  let now = 0, generation = 0;
  const inputs = [{ time: 0, event: { type: 'subscribe', now: 0 } }], actual = [], durations = [];
  const write = action => actual.push({ time: now, ...action });
  const add = event => inputs.push({ time: now, event: { ...event, now } });
  const source = recordedSource(write);
  const result = source.observable.pipe(throttle(value => {
    const g = generation++, selector = resource('durationSelector', g);
    write(invoke('durationSelector', g, value));
    if (g === throwOn) { add({ type: 'callback.throw', resource: selector, error: hookFault }); throw hookFault; }
    const subject = new Subject(); const entry = { subject, sink: null, g }; durations.push(entry);
    const duration = new Observable(subscriber => {
      entry.sink = subscriber; write({ type: 'subscribe', resource: resource('duration', g) });
      const connection = subject.subscribe(subscriber);
      return () => { connection.unsubscribe(); write({ type: 'unsubscribe', resource: resource('duration', g) }); };
    });
    add({ type: 'callback.return', resource: selector, token: 'duration-' + g });
    return duration;
  }, options)).subscribe(recordObserver(write));
  for (const command of commands) {
    now++;
    if (command === 'N' && source.live()) { add({ type: 'source.next', value: 'V' + now }); source.subject.next('V' + now); }
    if ((command === 'C' || command === 'E') && source.live()) {
      add(command === 'C' ? { type: 'source.complete' } : { type: 'source.error', error: fault });
      command === 'C' ? source.subject.complete() : source.subject.error(fault);
    }
    if (command === 'X' && !result.closed) { add({ type: 'cancel' }); result.unsubscribe(); }
    if (['D', 'F', 'G'].includes(command)) {
      const entry = durations.find(d => d.sink && !d.sink.closed);
      if (entry) {
        const type = command === 'D' ? 'duration.next' : command === 'F' ? 'duration.complete' : 'duration.error';
        add({ type, resource: resource('duration', entry.g), ...(command === 'G' ? { error: fault } : {}) });
        command === 'D' ? entry.subject.next('ignored') : command === 'F' ? entry.subject.complete() : entry.subject.error(fault);
      }
    }
  }
  if (!result.closed) { now++; add({ type: 'cancel' }); result.unsubscribe(); }
  assert.deepEqual(predicted(runThrottleTrace(createThrottleModel(options), inputs, { executionId: 'signal-native-comparison' })), actual,
    JSON.stringify({ options, commands, throwOn }));
}
test('S20 DIFF throttle: 720 bounded external schedules compare selector calls, source/duration lifetimes and output order', () => {
  let comparisons = 0;
  const prefixes = ['','N','NN','ND','NF'];
  for (const leading of [false, true]) for (const trailing of [false, true]) {
    for (const prefix of prefixes) for (const event of ['N','D','F','G']) for (const ending of ['C','E','X','CD','CF','CG','NDC','NDX']) {
      signalRun({ leading, trailing }, [...prefix, ...event, ...ending]); comparisons++;
    }
    for (const commands of ['NC','NNC','NDNC','NDNDC','NFDNC']) for (const throwOn of [0,1,2,3]) {
      signalRun({ leading, trailing }, [...commands], throwOn); comparisons++;
    }
  }
  assert.equal(comparisons, 720); console.log('SESSION20_SIGNAL_COMPARISONS', comparisons);
});

// Observing scheduler actions does not select outputs. RxJS itself allocates, fires and cancels them.
function timedRun(options, commands, duration, instrumented) {
  const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b));
  const actual = [], inputs = []; let generation = 0;
  const write = action => actual.push({ time: scheduler.frame, ...action });
  const add = event => inputs.push({ time: scheduler.frame, event: { ...event, now: scheduler.frame } });
  const source = recordedSource(write);
  const supplied = instrumented ? {
    now: () => scheduler.now(),
    schedule(work, delay = 0, state) {
      const g = generation++, ref = resource('throttleTimer', g);
      write({ type: 'schedule', resource: ref, delay });
      const action = scheduler.schedule(function (value) { add({ type: 'timer.fire', resource: ref }); work.call(this, value); }, delay, state);
      const unsubscribe = action.unsubscribe.bind(action); let recorded = false;
      action.unsubscribe = () => { if (!recorded) { recorded = true; write({ type: 'cancel-timer', resource: ref }); } unsubscribe(); };
      return action;
    },
  } : scheduler;
  let connection;
  // Subscription intentionally starts at frame 2; timer deadlines are not anchored to global zero.
  scheduler.schedule(() => { add({ type: 'subscribe' }); connection = source.observable.pipe(throttleTime(duration, supplied, options)).subscribe(recordObserver(write)); }, 2);
  for (const [time, kind, value] of commands) scheduler.schedule(() => {
    if (kind === 'X') { if (connection && !connection.closed) { add({ type: 'cancel' }); connection.unsubscribe(); } }
    else if (source.live()) {
      if (kind === 'N') { add({ type: 'source.next', value }); source.subject.next(value); }
      else { add(kind === 'C' ? { type: 'source.complete' } : { type: 'source.error', error: fault }); kind === 'C' ? source.subject.complete() : source.subject.error(fault); }
    }
  }, time);
  scheduler.schedule(() => { if (!connection.closed) { add({ type: 'cancel' }); connection.unsubscribe(); } }, 30);
  scheduler.flush();
  if (instrumented) assert.deepEqual(predicted(runThrottleTrace(createThrottleTimeModel(duration, options), inputs, { executionId: 'timer-native-comparison' })), actual,
    JSON.stringify({ options, commands, duration }));
  return outputOnly(actual);
}
test('S20 DIFF throttleTime: 144 scheduler comparisons preserve native output while checking timer generations and cancellation', () => {
  let comparisons = 0;
  for (const leading of [false,true]) for (const trailing of [false,true]) for (const duration of [1,2,4])
    for (const ending of ['C','E','X']) for (const times of [[3],[3,4],[3,5,7],[3,3,6]]) {
      const commands = [...times.map((time,i) => [time,'N',i]), [9,ending]];
      const options = { leading, trailing };
      assert.deepEqual(timedRun(options, commands, duration, true), timedRun(options, commands, duration, false)); comparisons++;
    }
  assert.equal(comparisons, 144); console.log('SESSION20_TIMER_COMPARISONS', comparisons);
});
