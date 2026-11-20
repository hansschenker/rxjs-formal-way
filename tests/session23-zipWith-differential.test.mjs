import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, zipWith } from 'rxjs';
import { runTrace } from '../dist/runner.js';
import { createZipWithModel } from '../dist/models/session23-zipWith.js';

// Native subscribers alone admit notifications. No canonical state drives this execution.
const observeNative = (count, seed, commands, ending, payload, fault) => {
  const inputs = [], actual = [], slots = [];
  let outer, now = 0, ordinal = 0;
  const record = action => actual.push({ time: now, action });
  const resource = index => ({ id: 'input:' + index, generation: 0 });
  const sources = Array.from({ length: count }, (_, index) => new Observable(subscriber => {
    slots[index] = subscriber;
    record({ type: 'subscribe', resource: resource(index) });
    return () => record({ type: 'unsubscribe', resource: resource(index) });
  }));
  const accept = (event, operation) => { inputs.push({ time: now, event }); operation(); };
  accept({ type: 'subscribe' }, () => {
    outer = sources[0].pipe(zipWith(...sources.slice(1))).subscribe({
      next: value => record({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } }),
      error: error => record({ type: 'notify', target: 'downstream', notification: { kind: 'E', error } }),
      complete: () => record({ type: 'notify', target: 'downstream', notification: { kind: 'C' } }),
    });
  });
  const send = (kind, index) => {
    if (outer.closed || slots[index].closed) return;
    if (kind === 'next') {
      const value = [undefined, payload, null, ordinal][ordinal++ % 4];
      accept({ type: 'input.next', index, value }, () => slots[index].next(value));
    } else if (kind === 'complete') {
      accept({ type: 'input.complete', index }, () => slots[index].complete());
    } else accept({ type: 'input.error', index, error: fault }, () => slots[index].error(fault));
  };
  if (seed === 'ahead-first' || seed === 'drain-first') { send('next', 0); send('next', 0); }
  if (seed === 'ahead-last') { send('next', count - 1); send('next', count - 1); }
  if (seed === 'drain-first') send('complete', 0);
  for (const [i, command] of commands.entries()) {
    now = 1 + Math.floor(i / 2); // Equal-time commands retain their explicit order.
    const [position, kind = 'next'] = command.split('.');
    const index = position === 'first' ? 0 : position === 'last' ? count - 1 : Math.floor(count / 2);
    send(kind, index);
  }
  now = 3;
  if (ending === 'complete-first') send('complete', 0);
  else if (ending === 'complete-last') send('complete', count - 1);
  else if (ending === 'error-live') {
    const index = slots.findLastIndex(s => !s.closed); if (index !== -1) send('error', index);
  } else if (!outer.closed) accept({ type: 'cancel' }, () => outer.unsubscribe());
  now = 4;
  if (!outer.closed) accept({ type: 'cancel' }, () => outer.unsubscribe());
  assert.equal(outer.closed, true); assert.ok(slots.every(s => s.closed));
  return { inputs, actual };
};

test('S23 DIFF ZIPWITH: 10368 finite executions compare FIFO drain, terminals, time and ordered resource lifetimes', () => {
  const alphabet = ['first', 'middle', 'last', 'first.complete', 'middle.complete', 'last.complete'];
  const payload = Object.freeze({ value: 'opaque' }), fault = Object.freeze({ fault: 'opaque' });
  let comparisons = 0;
  for (const count of [1, 2, 3]) for (const seed of ['none', 'ahead-first', 'ahead-last', 'drain-first'])
    for (const a of alphabet) for (const b of alphabet) for (const c of alphabet)
      for (const ending of ['complete-first', 'complete-last', 'error-live', 'cancel']) {
        const { inputs, actual } = observeNative(count, seed, [a, b, c], ending, payload, fault);
        // At most five unmatched values can arise in these schedules; model bound eight is not a native policy.
        const trace = runTrace(createZipWithModel(count, 8), inputs, { executionId: 'zipWith-diff-' + comparisons });
        const predicted = trace.steps.flatMap(step => step.actions.map(action => ({ time: step.time, action })));
        assert.deepEqual(predicted, actual, JSON.stringify({ count, seed, commands: [a, b, c], ending }));
        assert.equal(trace.state.phase, 'Closed');
        for (const { action } of actual) if (action.type === 'notify') {
          if (action.notification.kind === 'E') assert.equal(action.notification.error, fault);
          if (action.notification.kind === 'N') for (const value of action.notification.value)
            if (value && typeof value === 'object') assert.equal(value, payload);
        }
        comparisons++;
      }
  assert.equal(comparisons, 10368);
  console.log('SESSION23_ZIPWITH_COMPARISONS', comparisons);
});
