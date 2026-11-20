import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, withLatestFrom } from 'rxjs';
import { runTrace } from '../dist/runner.js';
import { createWithLatestFromModel } from '../dist/models/session22-withLatestFrom.js';

// Native subscriptions own readiness and liveness. No model decides native events.
const observeNative = (inputCount, seed, commands, ending, payload, fault) => {
  const inputs = [], actual = [], auxiliaries = [];
  let source, outer, now = 0, valueIndex = 0;
  const record = action => actual.push({ time: now, action });
  const resource = id => ({ id, generation: 0 });
  const acquire = id => record({ type: 'subscribe', resource: resource(id) });
  const release = id => record({ type: 'unsubscribe', resource: resource(id) });
  const notify = notification => record({ type: 'notify', target: 'downstream', notification });
  const accept = (event, operation) => { inputs.push({ time: now, event }); operation(); };
  const source$ = new Observable(s => { source = s; acquire('source'); return () => release('source'); });
  const other$ = Array.from({ length: inputCount }, (_, index) => new Observable(s => {
    auxiliaries[index] = s; acquire('aux:' + index); return () => release('aux:' + index);
  }));
  accept({ type: 'subscribe' }, () => {
    outer = source$.pipe(withLatestFrom(...other$)).subscribe({
      next: value => notify({ kind: 'N', value }), error: error => notify({ kind: 'E', error }),
      complete: () => notify({ kind: 'C' }),
    });
  });
  const auxNext = index => {
    if (auxiliaries[index].closed) return;
    const value = [undefined, payload, null][valueIndex++ % 3];
    accept({ type: 'aux.next', index, value }, () => auxiliaries[index].next(value));
  };
  const auxComplete = index => {
    if (!auxiliaries[index].closed)
      accept({ type: 'aux.complete', index }, () => auxiliaries[index].complete());
  };
  if (seed === 'ready') for (let i = 0; i < inputCount; i++) auxNext(i);
  if (seed === 'empty-first') auxComplete(0);
  for (const [i, command] of commands.entries()) {
    now = i + 1;
    if (command === 'source' && !source.closed) {
      const value = [payload, undefined, null][valueIndex++ % 3];
      accept({ type: 'source.next', value }, () => source.next(value));
    } else if (command === 'first') auxNext(0);
    else if (command === 'last') auxNext(inputCount - 1);
    else if (command === 'first.complete') auxComplete(0);
    else if (command === 'last.complete') auxComplete(inputCount - 1);
  }
  now = 4;
  if (ending === 'complete') accept({ type: 'source.complete' }, () => source.complete());
  else if (ending === 'source.error') accept({ type: 'source.error', error: fault }, () => source.error(fault));
  else if (ending === 'aux.error') {
    const index = auxiliaries.findIndex(sub => !sub.closed);
    if (index !== -1) accept({ type: 'aux.error', index, error: fault }, () => auxiliaries[index].error(fault));
  } else accept({ type: 'cancel' }, () => outer.unsubscribe());
  now = 5;
  if (!outer.closed) accept({ type: 'cancel' }, () => outer.unsubscribe());
  assert.equal(outer.closed, true); assert.equal(source.closed, true);
  assert.ok(auxiliaries.every(sub => sub.closed));
  return { inputs, actual };
};

test('S22 DIFF withLatestFrom: 4500 finite executions compare readiness, cached terminals and exact release order', () => {
  const alphabet = ['source', 'first', 'last', 'first.complete', 'last.complete'];
  const payload = Object.freeze({ opaque: 'value' }), fault = Object.freeze({ opaque: 'error' });
  let comparisons = 0;
  for (const count of [1, 2, 3]) for (const seed of ['none', 'ready', 'empty-first'])
    for (const a of alphabet) for (const b of alphabet) for (const c of alphabet)
      for (const ending of ['complete', 'source.error', 'aux.error', 'cancel']) {
        const { inputs, actual } = observeNative(count, seed, [a, b, c], ending, payload, fault);
        const trace = runTrace(createWithLatestFromModel(count), inputs,
          { executionId: 'withLatestFrom-diff-' + comparisons });
        const predicted = trace.steps.flatMap(step => step.actions.map(action => ({ time: step.time, action })));
        assert.deepEqual(predicted, actual, JSON.stringify({ count, seed, commands: [a, b, c], ending }));
        assert.equal(trace.state.phase, 'Closed');
        for (const { action } of actual) if (action.type === 'notify') {
          if (action.notification.kind === 'E') assert.equal(action.notification.error, fault);
          if (action.notification.kind === 'N') for (const member of action.notification.value)
            if (member != null) assert.equal(member, payload);
        }
        comparisons++;
      }
  assert.equal(comparisons, 4500);
  console.log('SESSION22_WITHLATESTFROM_COMPARISONS', comparisons);
});
