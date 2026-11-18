import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable } from 'rxjs';
import { timeInterval, timestamp } from 'rxjs/operators';
import { createClockModel, runClockTrace } from '../dist/models/session21-clock.js';

// RxJS makes every behavior decision. The observer and provider only record it.
const sourceRef = { id: 'source', generation: 0 };
const stampAction = (time, action) => ({ time, action });
function observeNative(operator, values, readings, ending, throwAt) {
  const inputs = [], observed = []; let time = 0, calls = 0, sink;
  const providerFault = {}, sourceFault = {};
  const record = action => observed.push(stampAction(time, action));
  const event = event => inputs.push({ time, event });
  const provider = {
    now() {
      const index = calls++, resource = { id: operator + '.now', generation: index };
      record({ type: 'invoke-callback', resource, index, value: undefined });
      if (index === throwAt) { event({ type: 'clock.throw', resource, error: providerFault }); throw providerFault; }
      const reading = readings[index]; assert.equal(typeof reading, 'number');
      event({ type: 'clock.return', resource, reading }); return reading;
    },
    schedule() { assert.fail('clock annotation unexpectedly scheduled work'); },
  };
  const source = new Observable(subscriber => {
    sink = subscriber; record({ type: 'subscribe', resource: sourceRef });
    return () => record({ type: 'unsubscribe', resource: sourceRef });
  });
  event({ type: 'subscribe' });
  const sub = source.pipe(operator === 'timeInterval' ? timeInterval(provider) : timestamp(provider)).subscribe({
    next(value) {
      // Explicit observation abstraction: native TimeInterval prototype is excluded,
      // while payload reference identity and its numerical fields are retained.
      const wrapper = operator === 'timeInterval' ? { value: value.value, interval: value.interval } : { value: value.value, timestamp: value.timestamp };
      record({ type: 'notify', target: 'downstream', notification: { kind: 'N', value: wrapper } });
    },
    error(error) { record({ type: 'notify', target: 'downstream', notification: { kind: 'E', error } }); },
    complete() { record({ type: 'notify', target: 'downstream', notification: { kind: 'C' } }); },
  });
  for (const [i, value] of values.entries()) {
    time = [2, 2, 5][i];
    if (!sink || sink.closed) continue;
    event({ type: 'source.next', value }); sink.next(value);
  }
  time = 8;
  if (!sub.closed) {
    if (ending === 'complete') { event({ type: 'source.complete' }); sink.complete(); }
    else if (ending === 'error') { event({ type: 'source.error', error: sourceFault }); sink.error(sourceFault); }
    else { event({ type: 'cancel' }); sub.unsubscribe(); }
  }
  assert.equal(sub.closed, true);
  return { inputs, observed };
}
const payload = {};
const words = [[], [undefined], [null], [payload], [payload, payload], ['A', undefined, null]];
const clocks = [[10, 12, 17, 20], [5, 3, -1, -1], [2.5, 2.5, 2.25, -0.25], [-0, 0, -0, 0]];
for (const operator of ['timeInterval', 'timestamp']) {
  test(`S21 CLOCK DIFF ${operator}: 288 finite executions compare readings, values, errors and source lifetime`, () => {
    let count = 0;
    for (const values of words) for (const readings of clocks) for (const ending of ['complete', 'error', 'cancel']) for (const throwAt of [-1, 0, 1, 2]) {
      const actual = observeNative(operator, values, readings, ending, throwAt);
      const trace = runClockTrace(createClockModel(operator), actual.inputs, { executionId: operator + '-' + count });
      const predicted = trace.steps.flatMap(step => step.actions.map(action => stampAction(step.time, action)));
      assert.deepEqual(predicted, actual.observed, `${operator} case ${count}`);
      assert.equal(trace.state.phase, 'Closed');
      const emitted = actual.observed.filter(x => x.action.type === 'notify' && x.action.notification.kind === 'N');
      for (const [i, output] of emitted.entries()) assert.equal(output.action.notification.value.value, values[i]);
      count++;
    }
    assert.equal(count, 288);
    console.log('SESSION21_CLOCK_COMPARISONS', operator, count);
  });
}
