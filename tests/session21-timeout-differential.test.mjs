import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject } from 'rxjs';
import { timeout, timeoutWith } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { createTimeoutModel, createTimeoutWithModel, runTimeoutTrace } from '../dist/models/session21-timeout.js';

const resource = (id, generation = 0) => ({ id, generation });
const sourceRef = resource('source'), fallbackRef = resource('fallback'), factoryRef = resource('timeoutFactory');
const fault = Object.freeze({ fault: 'source' }), replacementFault = Object.freeze({ fault: 'replacement' });
const factoryFault = Object.freeze({ fault: 'factory' }), opaqueValue = Object.freeze({ value: 'opaque' });
const meta = Object.freeze({ request: 'deadline' });
const notification = item => ({ type: 'notify', target: 'downstream', notification: item });
const predicted = trace => trace.steps.flatMap(step => step.actions.map(action => ({ time: step.time, ...action })));
const outputs = log => log.filter(action => action.type === 'notify');

// Runtime decisions below are exclusively RxJS decisions. The model sees the recorded
// live external events and callback outcomes only after the native run is complete.
function nativeRun({ config, alias, values, ending, fallbackMode }, instrumented) {
  const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b));
  const actual = [], inputs = []; let generation = 0, sourceSink, connection;
  const write = action => actual.push({ time: scheduler.frame, ...action });
  const add = event => inputs.push({ time: scheduler.frame, event: { ...event, now: scheduler.frame } });
  const supplied = instrumented ? {
    now: () => scheduler.now(),
    schedule(work, delay = 0, state) {
      const ref = resource('timeoutTimer', generation++);
      write({ type: 'schedule', resource: ref, delay });
      const action = scheduler.schedule(function (value) { add({ type: 'timer.fire', resource: ref }); work.call(this, value); }, delay, state);
      const unsubscribe = action.unsubscribe.bind(action); let recorded = false;
      action.unsubscribe = () => { if (!recorded) { recorded = true; write({ type: 'cancel-timer', resource: ref }); } unsubscribe(); };
      return action;
    },
  } : scheduler;
  const subject = new Subject();
  const source = new Observable(sink => {
    sourceSink = sink; write({ type: 'subscribe', resource: sourceRef });
    const inner = subject.subscribe(sink);
    return () => { inner.unsubscribe(); write({ type: 'unsubscribe', resource: sourceRef }); };
  });
  const replacement = new Observable(sink => {
    write({ type: 'subscribe', resource: fallbackRef });
    const tasks = [];
    const later = fallbackMode === 'silent' ? 10 : 1;
    tasks.push(scheduler.schedule(() => {
      if (!sink.closed) { add({ type: 'fallback.next', resource: fallbackRef, value: opaqueValue }); sink.next(opaqueValue); }
    }, later));
    if (fallbackMode !== 'silent') tasks.push(scheduler.schedule(() => {
      if (!sink.closed) {
        if (fallbackMode === 'error') { add({ type: 'fallback.error', resource: fallbackRef, error: replacementFault }); sink.error(replacementFault); }
        else { add({ type: 'fallback.complete', resource: fallbackRef }); sink.complete(); }
      }
    }, 3));
    return () => { tasks.forEach(task => task.unsubscribe()); write({ type: 'unsubscribe', resource: fallbackRef }); };
  });
  const withFactory = info => {
    write({ type: 'invoke-callback', resource: factoryRef, index: 0, value: info });
    if (fallbackMode === 'throw') { add({ type: 'callback.throw', resource: factoryRef, error: factoryFault }); throw factoryFault; }
    add({ type: 'callback.return', resource: factoryRef, token: 'replacement' });
    return replacement;
  };
  scheduler.schedule(() => {
    add({ type: 'subscribe' });
    const options = config ? { ...config, ...(typeof config.first === 'object' ? { first: new Date(config.first.at) } : {}), meta, scheduler: supplied, with: withFactory } : null;
    const due = typeof alias === 'object' ? new Date(alias.at) : alias;
    const operator = alias !== undefined ? timeoutWith(due, replacement, supplied) : timeout(options);
    connection = source.pipe(operator).subscribe({
      next: value => write(notification({ kind: 'N', value })),
      error: error => write(notification({ kind: 'E', error })), complete: () => write(notification({ kind: 'C' })),
    });
  }, 2);
  for (const [time, value] of values) scheduler.schedule(() => {
    if (sourceSink && !sourceSink.closed) { add({ type: 'source.next', value }); subject.next(value); }
  }, time);
  scheduler.schedule(() => {
    if (ending === 'X') { if (connection && !connection.closed) { add({ type: 'cancel' }); connection.unsubscribe(); } }
    else if (sourceSink && !sourceSink.closed) {
      if (ending === 'C') { add({ type: 'source.complete' }); subject.complete(); }
      else { add({ type: 'source.error', error: fault }); subject.error(fault); }
    }
  }, 9);
  scheduler.schedule(() => { if (!connection.closed) { add({ type: 'cancel' }); connection.unsubscribe(); } }, 24);
  scheduler.flush();
  return { actual, inputs };
}
function compare(spec) {
  const measured = nativeRun(spec, true), plain = nativeRun(spec, false);
  assert.deepEqual(outputs(measured.actual), outputs(plain.actual), 'Scheduler observation must preserve ordinary native outputs.');
  const model = spec.alias !== undefined ? createTimeoutWithModel(spec.alias, 'replacement')
    : createTimeoutModel({ ...spec.config, withMode: 'factory', meta });
  assert.deepEqual(predicted(runTimeoutTrace(model, measured.inputs, { executionId: 'timeout-native-comparison' })), measured.actual, JSON.stringify(spec));
}
const words = [[], [[3, 'A']], [[3, 'A'], [4, 'B']], [[3, undefined], [5, null]], [[5, opaqueValue]], [[7, 'equal-time']]];
const configs = [{ each: 2 }, { each: 4 }, { first: 3 }, { first: { at: 7 } }, { first: 5, each: 2 }, { first: { at: 8 }, each: 3 }];
test('S21 DIFF timeout: 432 bounded runs compare source, timer, factory and replacement action words', () => {
  let comparisons = 0;
  for (const config of configs) for (const values of words) for (const ending of ['C', 'E', 'X'])
    for (const fallbackMode of ['complete', 'error', 'silent', 'throw']) {
      compare({ config, values, ending, fallbackMode }); comparisons++;
    }
  assert.equal(comparisons, 432); console.log('SESSION21_TIMEOUT_COMPARISONS', comparisons);
});
test('S21 DIFF timeoutWith: 216 bounded runs compare numeric/date alias policy and replacement lifetimes', () => {
  let comparisons = 0;
  for (const alias of [2, 4, { at: 7 }, { at: 9 }]) for (const values of words) for (const ending of ['C', 'E', 'X'])
    for (const fallbackMode of ['complete', 'error', 'silent']) {
      compare({ alias, values, ending, fallbackMode }); comparisons++;
    }
  assert.equal(comparisons, 216); console.log('SESSION21_TIMEOUTWITH_COMPARISONS', comparisons);
});
