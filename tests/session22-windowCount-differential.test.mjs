import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, windowCount } from 'rxjs';
import { runTrace } from '../dist/runner.js';
import { createWindowCountModel } from '../dist/models/session22-windowCount.js';

// Execute RxJS first. Native handles and Subscription.closed decide legal commands.
const observeNative = (size, stride, initial, commands, ending, payload, fault) => {
  const inputs = [], actual = [], handles = [], consumers = new Map();
  let source, outer, now = 0, serial = 0, values = 0;
  const record = action => actual.push({ time: now, action });
  const resource = id => ({ id, generation: 0 });
  const acquire = id => record({ type: 'subscribe', resource: resource(id) });
  const release = id => record({ type: 'unsubscribe', resource: resource(id) });
  const notify = (target, notification) => record({ type: 'notify', target, notification });
  const accept = (event, operation) => { inputs.push({ time: now, event }); operation(); };
  const source$ = new Observable(s => { source = s; acquire('source'); return () => release('source'); });
  accept({ type: 'subscribe' }, () => {
    outer = source$.pipe(windowCount(size, stride)).subscribe({
      next: handle => { const windowId = handles.length; handles.push(handle);
        notify('downstream', { kind: 'N', value: { windowId } }); },
      error: error => notify('downstream', { kind: 'E', error }),
      complete: () => notify('downstream', { kind: 'C' }),
    });
  });
  const attach = windowId => {
    const observerId = 'o' + serial++, target = 'windowObserver:' + observerId;
    accept({ type: 'window.subscribe', windowId, observerId }, () => {
      acquire(target);
      const sub = handles[windowId].subscribe({
        next: value => notify(target, { kind: 'N', value }),
        error: error => notify(target, { kind: 'E', error }),
        complete: () => notify(target, { kind: 'C' }),
      });
      sub.add(() => release(target)); consumers.set(observerId, sub);
    });
  };
  const detach = observerId => accept({ type: 'window.unsubscribe', observerId },
    () => consumers.get(observerId).unsubscribe());
  for (let i = 0; i < initial; i++) attach(0);
  for (const [i, command] of commands.entries()) {
    now = i + 1;
    if (command === 'next' && !source.closed) {
      const value = [undefined, payload, null][values++ % 3];
      accept({ type: 'source.next', value }, () => source.next(value));
    } else if (command === 'attach') attach(handles.length - 1);
    else if (command === 'detach') {
      const first = [...consumers].find(([, sub]) => !sub.closed);
      if (first) detach(first[0]);
    }
  }
  now = 4; if (handles.length > 1) attach(0);
  now = 5;
  if (ending === 'complete') accept({ type: 'source.complete' }, () => source.complete());
  else if (ending === 'error') accept({ type: 'source.error', error: fault }, () => source.error(fault));
  else accept({ type: 'cancel' }, () => outer.unsubscribe());
  now = 6;
  for (let id = 0; id < handles.length; id++) attach(id);
  now = 7;
  for (const [id, sub] of consumers) if (!sub.closed) detach(id);
  assert.equal(outer.closed, true); assert.equal(source.closed, true);
  assert.ok([...consumers.values()].every(sub => sub.closed));
  return { inputs, actual };
};

test('S22 DIFF windowCount: 2916 finite executions compare overlap, gaps, retained windows and ordered cleanup', () => {
  const alphabet = ['next', 'attach', 'detach'];
  const payload = Object.freeze({ opaque: 'value' }), fault = Object.freeze({ opaque: 'error' });
  let comparisons = 0;
  for (const size of [1, 2, 3]) for (const stride of [1, 2, 3, 4])
    for (const initial of [0, 1, 2]) for (const a of alphabet) for (const b of alphabet)
      for (const c of alphabet) for (const ending of ['complete', 'error', 'cancel']) {
        const { inputs, actual } = observeNative(size, stride, initial, [a, b, c], ending, payload, fault);
        const trace = runTrace(createWindowCountModel(size, stride), inputs,
          { executionId: 'windowCount-diff-' + comparisons });
        const predicted = trace.steps.flatMap(step => step.actions.map(action => ({ time: step.time, action })));
        assert.deepEqual(predicted, actual, JSON.stringify({ size, stride, initial, commands: [a, b, c], ending }));
        assert.equal(trace.state.phase, 'Stopped'); assert.deepEqual(trace.state.consumers, []);
        for (const { action } of actual) if (action.type === 'notify') {
          if (action.notification.kind === 'E') assert.equal(action.notification.error, fault);
          if (action.target !== 'downstream' && action.notification.kind === 'N' &&
              action.notification.value != null) assert.equal(action.notification.value, payload);
        }
        comparisons++;
      }
  assert.equal(comparisons, 2916);
  console.log('SESSION22_WINDOWCOUNT_COMPARISONS', comparisons);
});
