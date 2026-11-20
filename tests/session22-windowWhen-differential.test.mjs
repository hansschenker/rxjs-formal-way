import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, windowWhen } from 'rxjs';
import { createWindowWhenModel, runWindowWhenTrace } from '../dist/models/session22-windowWhen.js';

/** Record native RxJS first; no canonical state/action influences this adapter. */
const observeNative = (initialConsumers, commands, ending, payload, fault, initialThrow = false) => {
  const inputs = [], actual = [], handles = [], closers = [], consumers = new Map();
  let source, outer, now = 0, observerSerial = 0, calls = 0, values = 0, failFactory = initialThrow;
  const record = action => actual.push({ time: now, action });
  const resource = (id, generation = 0) => ({ id, generation });
  const acquire = (id, generation = 0) => record({ type: 'subscribe', resource: resource(id, generation) });
  const release = (id, generation = 0) => record({ type: 'unsubscribe', resource: resource(id, generation) });
  const notify = (target, notification) => record({ type: 'notify', target, notification });
  const accept = (event, operation) => { inputs.push({ time: now, event }); operation(); };
  const source$ = new Observable(s => { source = s; acquire('source'); return () => release('source'); });
  accept({ type: 'subscribe' }, () => {
    outer = source$.pipe(windowWhen(() => {
      const generation = calls++;
      record({ type: 'invoke-callback', resource: resource('closingSelector', generation), index: generation, value: undefined });
      if (failFactory) {
        inputs.push({ time: now, event: { type: 'factory.throw', generation, error: fault } });
        throw fault;
      }
      inputs.push({ time: now, event: { type: 'factory.return', generation } });
      return new Observable(s => { closers[generation] = s; acquire('closing', generation); return () => release('closing', generation); });
    })).subscribe({
      next: handle => { const windowId = handles.length; handles.push(handle); notify('downstream', { kind: 'N', value: { windowId } }); },
      error: error => notify('downstream', { kind: 'E', error }), complete: () => notify('downstream', { kind: 'C' }),
    });
  });
  const attach = windowId => {
    const observerId = 'o' + observerSerial++, target = 'windowObserver:' + observerId;
    accept({ type: 'window.subscribe', observerId, windowId }, () => {
      acquire(target);
      const sub = handles[windowId].subscribe({ next: value => notify(target, { kind: 'N', value }),
        error: error => notify(target, { kind: 'E', error }), complete: () => notify(target, { kind: 'C' }) });
      sub.add(() => release(target)); consumers.set(observerId, sub);
    });
  };
  const detach = observerId => accept({ type: 'window.unsubscribe', observerId }, () => consumers.get(observerId).unsubscribe());
  for (let i = 0; i < initialConsumers; i++) attach(0);
  const dispatch = command => {
    const generation = closers.findLastIndex(s => s && !s.closed), currentCloser = generation >= 0 ? closers[generation] : undefined;
    if (command === 'value' && !source.closed) {
      const value = [undefined, payload, null][values++ % 3];
      accept({ type: 'source.next', value }, () => source.next(value));
    } else if ((command === 'next' || command === 'factoryThrow') && currentCloser) {
      if (command === 'factoryThrow') failFactory = true;
      accept({ type: 'closing.next', generation }, () => currentCloser.next('ignored'));
    } else if (command === 'complete' && currentCloser) accept({ type: 'closing.complete', generation }, () => currentCloser.complete());
    else if (command === 'attach') attach(handles.length - 1);
    else if (command === 'detach') {
      const live = [...consumers].find(([, sub]) => !sub.closed); if (live) detach(live[0]);
    } else if (command === 'source.complete' && !source.closed) accept({ type: 'source.complete' }, () => source.complete());
    else if (command === 'source.error' && !source.closed) accept({ type: 'source.error', error: fault }, () => source.error(fault));
    else if (command === 'closing.error' && currentCloser) accept({ type: 'closing.error', generation, error: fault }, () => currentCloser.error(fault));
    else if (command === 'cancel' && !outer.closed) accept({ type: 'cancel' }, () => outer.unsubscribe());
  };
  for (const [index, command] of commands.entries()) { now = index + 1; dispatch(command); }
  now = 4; if (handles.length > 1) attach(0);
  now = 5; dispatch(ending);
  now = 6; dispatch('cancel');
  now = 7; attach(handles.length - 1); // Actual retained handle after error/completion/cancellation.
  if (handles.length > 1) attach(0);
  now = 8; for (const [id, sub] of consumers) if (!sub.closed) detach(id);
  assert.equal(outer.closed, true); assert.equal(source.closed, true);
  assert.ok(closers.every(s => s.closed)); assert.ok([...consumers.values()].every(s => s.closed));
  return { inputs, actual };
};

test('S22 DIFF windowWhen: 1876 finite native-first executions compare windows, factories and ordered resource lifetimes', () => {
  const alphabet = ['value', 'next', 'complete', 'attach', 'detach'];
  const endings = ['source.complete', 'source.error', 'closing.error', 'cancel', 'factoryThrow'];
  const payload = Object.freeze({ opaque: 'value' }), fault = Object.freeze({ opaque: 'fault' });
  let comparisons = 0;
  const compare = (initial, commands, ending, initialThrow = false) => {
    const { inputs, actual } = observeNative(initial, commands, ending, payload, fault, initialThrow);
    const trace = runWindowWhenTrace(createWindowWhenModel(), inputs, { executionId: 'windowWhen-diff-' + comparisons });
    const predicted = trace.steps.flatMap(step => step.actions.map(action => ({ time: step.time, action })));
    assert.deepEqual(predicted, actual, JSON.stringify({ initial, commands, ending, initialThrow }));
    assert.equal(trace.state.phase, 'Stopped'); assert.deepEqual(trace.state.consumers, []);
    for (const { action } of actual) {
      if (action.type === 'notify' && action.notification.kind === 'N' && action.target !== 'downstream' && action.notification.value !== undefined && action.notification.value !== null)
        assert.equal(action.notification.value, payload);
      if (action.type === 'notify' && action.notification.kind === 'E') assert.equal(action.notification.error, fault);
    }
    comparisons++;
  };
  for (const initial of [0, 1, 2]) for (const a of alphabet) for (const b of alphabet) for (const c of alphabet) for (const ending of endings)
    compare(initial, [a, b, c], ending);
  compare(0, [], 'cancel', true);
  assert.equal(comparisons, 1876);
  console.log('SESSION22_WINDOWWHEN_COMPARISONS', comparisons);
});
