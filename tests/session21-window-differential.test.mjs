import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, window } from 'rxjs';
import { runTrace } from '../dist/runner.js';
import { createWindowModel } from '../dist/models/session21-window.js';

/** Native execution is recorded first. No model state or action controls this adapter. */
const observeNative = (initialConsumers, commands, ending, payload, fault) => {
  const inputs = [], actual = [], handles = [], consumers = new Map();
  let source, boundary, outer, now = 0, serial = 0, values = 0;
  const record = action => actual.push({ time: now, action });
  const resource = id => ({ id, generation: 0 });
  const acquire = id => record({ type: 'subscribe', resource: resource(id) });
  const release = id => record({ type: 'unsubscribe', resource: resource(id) });
  const notify = (target, notification) => record({ type: 'notify', target, notification });
  const accept = (event, operation) => { inputs.push({ time: now, event }); operation(); };
  const source$ = new Observable(s => { source = s; acquire('source'); return () => release('source'); });
  const boundary$ = new Observable(s => { boundary = s; acquire('boundary'); return () => release('boundary'); });
  accept({ type: 'subscribe' }, () => {
    outer = source$.pipe(window(boundary$)).subscribe({
      next: handle => { const windowId = handles.length; handles.push(handle); notify('downstream', { kind: 'N', value: { windowId } }); },
      error: error => notify('downstream', { kind: 'E', error }), complete: () => notify('downstream', { kind: 'C' }),
    });
  });
  const attach = windowId => {
    const observerId = 'o' + serial++, target = 'windowObserver:' + observerId;
    accept({ type: 'window.subscribe', windowId, observerId }, () => {
      acquire(target);
      const sub = handles[windowId].subscribe({ next: value => notify(target, { kind: 'N', value }), error: error => notify(target, { kind: 'E', error }), complete: () => notify(target, { kind: 'C' }) });
      sub.add(() => release(target)); consumers.set(observerId, sub);
    });
  };
  const close = observerId => accept({ type: 'window.unsubscribe', observerId }, () => consumers.get(observerId).unsubscribe());
  for (let i = 0; i < initialConsumers; i++) attach(0);
  const dispatch = command => {
    if (command === 'next' && !source.closed) {
      const value = [undefined, payload, null][values++ % 3];
      accept({ type: 'source.next', value }, () => source.next(value));
    } else if (command === 'boundary' && !boundary.closed) accept({ type: 'boundary.next' }, () => boundary.next('ignored'));
    else if (command === 'boundary.complete' && !boundary.closed) accept({ type: 'boundary.complete' }, () => boundary.complete());
    else if (command === 'attach' && !outer.closed) attach(handles.length - 1);
    else if (command === 'detach') {
      const first = [...consumers].find(([, sub]) => !sub.closed); if (first) close(first[0]);
    } else if (command === 'source.complete' && !source.closed) accept({ type: 'source.complete' }, () => source.complete());
    else if (command === 'source.error' && !source.closed) accept({ type: 'source.error', error: fault }, () => source.error(fault));
    else if (command === 'boundary.error' && !boundary.closed) accept({ type: 'boundary.error', error: fault }, () => boundary.error(fault));
    else if (command === 'cancel' && !outer.closed) accept({ type: 'cancel' }, () => outer.unsubscribe());
  };
  for (const [i, command] of commands.entries()) { now = i + 1; dispatch(command); }
  now = 4; if (handles.length > 1) attach(0); // A genuinely retained, completed old native handle.
  now = 5; dispatch(ending);
  now = 6; dispatch('cancel'); // A prior boundary completion may have made boundary.error inert.
  now = 7; for (const [id, sub] of consumers) if (!sub.closed) close(id);
  now = 8; if (handles.length > 1) attach(0); // Historical handles remain usable after outer teardown.
  assert.equal(outer.closed, true); assert.equal(source.closed, true); assert.equal(boundary.closed, true);
  assert.ok([...consumers.values()].every(s => s.closed));
  return { inputs, actual };
};

test('S21 DIFF window: 1500 finite schedules compare handles, multicast delivery and independent subscription lifetimes', () => {
  const alphabet = ['next', 'boundary', 'boundary.complete', 'attach', 'detach'];
  const endings = ['source.complete', 'source.error', 'boundary.error', 'cancel'];
  const payload = Object.freeze({ opaque: 'value' }), fault = Object.freeze({ opaque: 'error' });
  let comparisons = 0;
  for (const initial of [0, 1, 2]) for (const a of alphabet) for (const b of alphabet) for (const c of alphabet) for (const ending of endings) {
    const { inputs, actual } = observeNative(initial, [a, b, c], ending, payload, fault);
    const trace = runTrace(createWindowModel(), inputs, { executionId: 'window-diff-' + comparisons });
    const predicted = trace.steps.flatMap(step => step.actions.map(action => ({ time: step.time, action })));
    assert.deepEqual(predicted, actual, JSON.stringify({ initial, commands: [a, b, c], ending }));
    assert.equal(trace.state.phase, 'Stopped'); assert.deepEqual(trace.state.consumers, []);
    for (const item of actual) if (item.action.type === 'notify' && item.action.notification.kind === 'N' && item.action.target !== 'downstream' && item.action.notification.value !== undefined && item.action.notification.value !== null) assert.equal(item.action.notification.value, payload);
    comparisons++;
  }
  assert.equal(comparisons, 1500);
  console.log('SESSION21_WINDOW_COMPARISONS', comparisons);
});
