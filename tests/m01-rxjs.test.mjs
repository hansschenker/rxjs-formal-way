import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, Subscription, defer, of, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { createTakeModel, stepModel, runTrace } from '../dist/index.js';
const scheduler = () => new TestScheduler((actual, expected) => assert.deepEqual(actual, expected));

test('M01-RX-01: zero count completes without acquiring the source', () => {
  let subscriptions = 0; const result = [];
  defer(() => { subscriptions++; return of('x'); }).pipe(take(0)).subscribe({ next: x => result.push(x), complete: () => result.push('complete') });
  assert.equal(subscriptions, 0); assert.deepEqual(result, ['complete']);
});
test('M01-RX-02: values, synthesized completion and subscription lifetime match literal marbles', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('-a-b-c-|');
    expectObservable(source.pipe(take(2))).toBe('-a-(b|)');
    expectSubscriptions(source.subscriptions).toBe('^--!');
  });
});
test('M01-RX-03: early source completion, with or without a preceding value', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    for (const marbles of ['---|', '-a-|']) {
      const source = cold(marbles);
      expectObservable(source.pipe(take(3))).toBe(marbles);
      expectSubscriptions(source.subscriptions).toBe('^--!');
    }
  });
});
test('M01-RX-04: early source error preserves its identity and releases upstream', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const error = new Error('source');
    for (const marbles of ['---#', '-a-#']) {
      const source = cold(marbles, undefined, error);
      expectObservable(source.pipe(take(3))).toBe(marbles, undefined, error);
      expectSubscriptions(source.subscriptions).toBe('^--!');
    }
  });
});
test('M01-RX-05: downstream cancellation releases upstream without completion', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('-a---b-|');
    expectObservable(source.pipe(take(3)), '----!').toBe('-a-');
    expectSubscriptions(source.subscriptions).toBe('^---!');
  });
});
test('M01-RX-06: synchronous cooperative producer stops at the quota', () => {
  const produced = [], delivered = []; let releases = 0;
  new Observable(subscriber => {
    for (let i = 0; i < 5 && !subscriber.closed; i++) { produced.push(i); subscriber.next(i); }
    return () => { releases++; };
  }).pipe(take(2)).subscribe({ next: x => delivered.push(x), complete: () => delivered.push('C') });
  assert.deepEqual(produced, [0, 1]); assert.deepEqual(delivered, [0, 1, 'C']); assert.equal(releases, 1);
});
test('M01-RX-07: terminal notification precedes source finalization in the scoped trace', () => {
  const input = new Subject(), log = [];
  const source = new Observable(sub => {
    log.push('subscribe'); const s = input.subscribe(sub);
    return () => { log.push('release'); s.unsubscribe(); };
  });
  source.pipe(take(1)).subscribe({ next: x => log.push(x), complete: () => log.push('complete') });
  input.next('a'); input.next('late'); input.complete();
  assert.deepEqual(log, ['subscribe', 'a', 'complete', 'release']);
});
test('M01-RX-08: a hot producer still gives each take subscription its own counter', () => {
  const source = new Subject(), sharedInput = source.pipe(take(2)), a = [], b = [];
  sharedInput.subscribe({ next: x => a.push(x), complete: () => a.push('C') });
  source.next(1);
  sharedInput.subscribe({ next: x => b.push(x), complete: () => b.push('C') });
  source.next(2); source.next(3);
  assert.deepEqual(a, [1, 2, 'C']); assert.deepEqual(b, [2, 3, 'C']);
});
test('M01-RX-09: equal-time delivery preserves value order and opaque payload identity', () => {
  const marker = {}; const values = [];
  of(undefined, marker, 3).pipe(take(2)).subscribe(x => values.push(x));
  assert.deepEqual(values, [undefined, marker]); assert.equal(values[1], marker);
});
test('M01-RX-10: cancellation is idempotent; late source attempts have no downstream effect', () => {
  let input; let releases = 0; const values = [];
  const subscription = new Observable(sub => { input = sub; return () => { releases++; }; }).pipe(take(2))
    .subscribe({ next: x => values.push(x), complete: () => values.push('C'), error: e => values.push(e) });
  subscription.unsubscribe(); subscription.unsubscribe();
  input.next('late'); input.complete();
  assert.deepEqual(values, []); assert.equal(releases, 1);
});

const words = maximum => {
  const all = [[]]; let level = [[]];
  for (let size = 1; size <= maximum; size++) {
    level = level.flatMap(prefix => ['a', 'b'].map(value => [...prefix, value])); all.push(...level);
  }
  return all;
};
const modelLog = (count, values, ending) => {
  const m = createTakeModel(count);
  const inputs = [{ time: 0, event: { type: 'subscribe' } }];
  let state = stepModel(m, m.initialState(), inputs[0].event).state;
  const pending = values.map((value, i) => ({ time: i + 1, event: { type: 'source.next', value } }));
  pending.push({ time: values.length + 1, event: ending === 'error' ? { type: 'source.error', error: 'E' } : { type: ending === 'cancel' ? 'cancel' : 'source.complete' } });
  for (const input of pending) {
    if (state.phase === 'Closed') break; // cancelled/detached source has no admissible delivery
    inputs.push(input); state = stepModel(m, state, input.event).state;
  }
  return runTrace(m, inputs, { executionId: 'bounded' }).steps.flatMap(s => s.actions.map(a =>
    a.type === 'notify' ? [s.time, a.notification] : [s.time, a.type]));
};
const rxjsLog = (count, values, ending) => {
  const clock = scheduler(), result = [];
  const source = new Observable(sub => {
    result.push([clock.now(), 'subscribe']);
    const tasks = new Subscription();
    values.forEach((value, i) => tasks.add(clock.schedule(() => sub.next(value), i + 1)));
    if (ending !== 'cancel') tasks.add(clock.schedule(() => ending === 'error' ? sub.error('E') : sub.complete(), values.length + 1));
    return () => { result.push([clock.now(), 'unsubscribe']); tasks.unsubscribe(); };
  });
  const connection = source.pipe(take(count)).subscribe({
    next: value => result.push([clock.now(), { kind: 'N', value }]),
    error: error => result.push([clock.now(), { kind: 'E', error }]),
    complete: () => result.push([clock.now(), { kind: 'C' }]),
  });
  if (ending === 'cancel') clock.schedule(() => connection.unsubscribe(), values.length + 1);
  clock.flush(); return result;
};

test('M01-RX-11: 465 bounded model/RxJS trace comparisons include source lifetime', () => {
  let comparisons = 0;
  for (let count = 0; count <= 4; count++) for (const values of words(4)) for (const ending of ['complete', 'error', 'cancel']) {
    assert.deepEqual(rxjsLog(count, values, ending), modelLog(count, values, ending), JSON.stringify({ count, values, ending }));
    comparisons++;
  }
  assert.equal(comparisons, 465);
});
