import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, zipAll } from 'rxjs';
import { runTrace } from '../dist/runner.js';
import { createZipAllModel } from '../dist/models/session23-zipAll.js';

// Native runs first. The real Subscriber.closed flags admit events; no model
// state, transition, prediction or readiness calculation controls native execution.
const observeNative = (count, arrangement, outerEnding, seed, commands, ending, payload, fault) => {
  const history = [], actual = [], inners = []; let outer, result, now = 0, acquired = 0, values = 0;
  const record = action => actual.push({ time: now, action });
  const connect = resource => record({ type: 'subscribe', resource });
  const release = resource => record({ type: 'unsubscribe', resource });
  const notify = notification => record({ type: 'notify', target: 'downstream', notification });
  const accept = (event, perform) => { history.push({ time: now, event }); perform(); };
  const outerRef = { id: 'outer', generation: 0 };
  const outer$ = new Observable(s => { outer = s; connect(outerRef); return () => release(outerRef); });
  const sharedToken = Object.freeze({ producer: 'same' });
  const tokens = Array.from({ length: count }, (_, i) => arrangement === 'duplicate' ? sharedToken : Object.freeze({ producer: i }));
  const producers = new Map();
  for (const token of tokens) if (!producers.has(token)) producers.set(token, new Observable(s => {
    const index = acquired++, resource = { id: 'inner', generation: index };
    inners[index] = s; connect(resource); return () => release(resource);
  }));
  accept({ type: 'subscribe' }, () => { result = outer$.pipe(zipAll()).subscribe({
    next: value => notify({ kind: 'N', value }), error: error => notify({ kind: 'E', error }), complete: () => notify({ kind: 'C' }),
  }); });
  for (const [i, token] of tokens.entries()) { now = i + 1; accept({ type: 'outer.next', value: token }, () => outer.next(producers.get(token))); }
  assert.equal(acquired, 0, 'No inner producer can start during collection');
  now = 10;
  if (outerEnding === 'error') accept({ type: 'outer.error', error: fault }, () => outer.error(fault));
  else if (outerEnding === 'cancel') accept({ type: 'cancel' }, () => result.unsubscribe());
  else accept({ type: 'outer.complete' }, () => outer.complete());
  const send = index => {
    if (!inners[index] || inners[index].closed) return;
    const value = [undefined, payload, null][values++ % 3];
    accept({ type: 'inner.next', index, value }, () => inners[index].next(value));
  };
  const complete = index => {
    if (inners[index] && !inners[index].closed) accept({ type: 'inner.complete', index }, () => inners[index].complete());
  };
  const error = index => {
    if (inners[index] && !inners[index].closed) accept({ type: 'inner.error', index, error: fault }, () => inners[index].error(fault));
  };
  now = 11;
  if (seed !== 'none') { send(0); send(0); }
  if (seed === 'first-completed') complete(0);
  for (const [i, command] of commands.entries()) {
    now = 12 + i;
    if (command === 'first.next') send(0);
    else if (command === 'last.next') send(count - 1);
    else if (command === 'middle.next') send(Math.floor(count / 2));
    else if (command === 'first.complete') complete(0);
    else if (command === 'last.complete') complete(count - 1);
  }
  now = 20;
  if (ending === 'first.error') error(0);
  else if (ending === 'last.complete') complete(count - 1);
  else if (ending === 'all.complete') for (let i = 0; i < count; i++) complete(i);
  else if (!result.closed) accept({ type: 'cancel' }, () => result.unsubscribe());
  now = 21;
  if (!result.closed) accept({ type: 'cancel' }, () => result.unsubscribe());
  assert.equal(result.closed, true); assert.equal(outer.closed, true); assert.ok(inners.every(s => s.closed));
  return { history, actual };
};

test('S23 DIFF zipAll: 9024 native-first executions compare the collection barrier, FIFO drain and ordered lifetimes', () => {
  const payload = Object.freeze({ opaque: 'value' }), fault = Object.freeze({ opaque: 'error' });
  const alphabet = ['first.next', 'last.next', 'middle.next', 'first.complete', 'last.complete'];
  let comparisons = 0;
  const compare = (count, arrangement, outerEnding, seed, commands, ending) => {
    const observed = observeNative(count, arrangement, outerEnding, seed, commands, ending, payload, fault);
    const trace = runTrace(createZipAllModel(), observed.history, { executionId: 'zipAll-diff-' + comparisons });
    const predicted = trace.steps.flatMap(step => step.actions.map(action => ({ time: step.time, action })));
    assert.deepEqual(predicted, observed.actual, JSON.stringify({ count, arrangement, outerEnding, seed, commands, ending }));
    assert.equal(trace.state.phase, 'Closed');
    for (const { action } of observed.actual) if (action.type === 'notify') {
      if (action.notification.kind === 'E') assert.equal(action.notification.error, fault);
      if (action.notification.kind === 'N') for (const value of action.notification.value) if (value != null) assert.equal(value, payload);
    }
    comparisons++;
  };
  for (const count of [0, 1, 2, 3]) for (const arrangement of ['distinct', 'duplicate'])
    for (const ending of ['complete', 'error', 'cancel']) compare(count, arrangement, ending, 'none', [], 'cancel');
  assert.equal(comparisons, 24);
  for (const count of [1, 2, 3]) for (const arrangement of ['distinct', 'duplicate'])
    for (const seed of ['none', 'first-two', 'first-completed'])
      for (const a of alphabet) for (const b of alphabet) for (const c of alphabet)
        for (const ending of ['first.error', 'last.complete', 'all.complete', 'cancel'])
          compare(count, arrangement, 'complete', seed, [a, b, c], ending);
  assert.equal(comparisons, 9024);
  console.log('SESSION23_ZIPALL_COMPARISONS', comparisons);
});
