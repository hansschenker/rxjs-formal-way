import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, debounceTime, take, share } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { createDebounceTimeModel } from '../dist/models/debounceTime.js';
import { observeDebounceModel, binaryWords } from './helpers/debounce-driver.mjs';
import { observeDebounceRx } from './helpers/debounce-rxjs-driver.mjs';

const next = (time, value) => ({ type: 'source.next', time, value });
const complete = time => ({ type: 'source.complete', time });
const error = (time, value = 'fault') => ({ type: 'source.error', time, error: value });
const cancel = time => ({ type: 'cancel', time });
const notifications = xs => xs.filter(x => ['N', 'E', 'C'].includes(x.kind));
const withoutTimers = xs => xs.filter(x => !x.kind.startsWith('timer.'));
function compare(dueTime, events, options = {}) {
  const expected = observeDebounceModel(createDebounceTimeModel(dueTime), events, options);
  const actual = observeDebounceRx(dueTime, events, options);
  assert.deepEqual(actual.observations, expected.observations);
  assert.equal(actual.closed, true); assert.equal(actual.liveTimers, 0); assert.equal(expected.activeTimer, null);
  return actual.observations;
}

test('M02C-RX-01: lazy construction and empty completion allocate no timer', () => {
  let connections = 0, scheduled = 0;
  const clock = new TestScheduler(assert.deepEqual);
  const scheduler = { now: () => clock.now(), schedule: (...args) => { scheduled++; return clock.schedule(...args); } };
  const source = new Observable(s => { connections++; s.complete(); });
  const output = source.pipe(debounceTime(3, scheduler));
  assert.equal(connections, 0); output.subscribe(); assert.equal(connections, 1); assert.equal(scheduled, 0);
  assert.deepEqual(notifications(compare(3, [complete(1)])), [{ time: 1, kind: 'C' }]);
});
test('M02C-RX-02: one value emits at its deadline, not on arrival', () => {
  const xs = compare(3, [next(1, 'a'), complete(8)]);
  assert.deepEqual(notifications(xs), [{ time: 4, kind: 'N', value: 'a' }, { time: 8, kind: 'C' }]);
  assert.deepEqual(xs.filter(x => x.kind.startsWith('timer.')).map(x => [x.time, x.kind, x.generation, x.delay]), [
    [1, 'timer.schedule', 0, 3], [4, 'timer.fire', 0, undefined], [4, 'timer.cancel', 0, undefined],
  ]);
});
test('M02C-RX-03: replacement does not cancel/restart the task at every next', () => {
  const xs = compare(3, [next(1, 'a'), next(3, 'b'), complete(8)]);
  assert.deepEqual(notifications(xs), [{ time: 6, kind: 'N', value: 'b' }, { time: 8, kind: 'C' }]);
  assert.deepEqual(xs.filter(x => x.kind === 'timer.schedule'), [
    { time: 1, kind: 'timer.schedule', generation: 0, delay: 3 },
    { time: 4, kind: 'timer.schedule', generation: 1, delay: 2 },
  ]);
});
test('M02C-RX-04: repeated activity can require several remaining-duration rearms', () => {
  const xs = compare(3, [next(1, 'a'), next(3, 'b'), next(5, 'c'), next(7, 'd'), complete(12)]);
  assert.deepEqual(notifications(xs), [{ time: 10, kind: 'N', value: 'd' }, { time: 12, kind: 'C' }]);
  assert.equal(xs.filter(x => x.kind === 'timer.schedule').length, 4);
});
test('M02C-RX-05: completion flushes before the deadline and cancels future work', () => {
  const xs = compare(10, [next(1, 'a'), next(2, 'b'), complete(3)]);
  assert.deepEqual(xs.slice(-4), [
    { time: 3, kind: 'timer.cancel', generation: 0 }, { time: 3, kind: 'N', value: 'b' },
    { time: 3, kind: 'C' }, { time: 3, kind: 'unsubscribe' },
  ]);
  assert.equal(xs.some(x => x.kind === 'timer.fire'), false);
});
test('M02C-RX-06: completion while idle emits no extra value', () => {
  for (const es of [[complete(1)], [next(1, 'a'), complete(8)]]) {
    const xs = compare(3, es); assert.equal(xs.at(-2).kind, 'C'); assert.equal(xs.at(-1).kind, 'unsubscribe');
  }
});
test('M02C-RX-07: source error discards pending output and preserves arbitrary error identity', () => {
  for (const fault of [undefined, null, {}, new Error('sentinel')]) {
    for (const es of [[error(2, fault)], [next(1, 'a'), { type: 'source.error', time: 2, error: fault }]]) {
      // Avoid default-argument conversion of undefined in the first case.
      es[es.length - 1].error = fault;
      const xs = compare(3, es), ns = notifications(xs);
      assert.equal(ns.length, 1); assert.equal(ns[0].kind, 'E'); assert.equal(ns[0].error, fault);
    }
  }
});
test('M02C-RX-08: cancellation discards pending output without a terminal notification', () => {
  for (const es of [[cancel(2)], [next(1, 'a'), cancel(2)]]) assert.deepEqual(notifications(compare(3, es)), []);
});
test('M02C-RX-09: cancellation after a rearm releases the current generation', () => {
  const xs = compare(3, [next(1, 'a'), next(3, 'b'), cancel(5)]);
  assert.deepEqual(xs.at(-1), { time: 5, kind: 'timer.cancel', generation: 1 });
  assert.deepEqual(notifications(xs), []);
});
test('M02C-RX-10: zero delay coalesces a queued burst but is not universally identity', () => {
  const es = [next(1, 'a'), next(1, 'b'), complete(2)];
  assert.deepEqual(notifications(compare(0, es)), [{ time: 1, kind: 'N', value: 'b' }, { time: 2, kind: 'C' }]);
  assert.deepEqual(notifications(compare(0, es, { insertion: 'chained' })), [
    { time: 1, kind: 'N', value: 'a' }, { time: 1, kind: 'N', value: 'b' }, { time: 2, kind: 'C' },
  ]);
});
test('M02C-RX-11: equal-time source versus timer order is explicit and observable', () => {
  const es = [next(1, 'a'), next(4, 'b'), complete(9)];
  assert.deepEqual(notifications(compare(3, es)), [{ time: 7, kind: 'N', value: 'b' }, { time: 9, kind: 'C' }]);
  assert.deepEqual(notifications(compare(3, es, { insertion: 'chained' })), [
    { time: 4, kind: 'N', value: 'a' }, { time: 7, kind: 'N', value: 'b' }, { time: 9, kind: 'C' },
  ]);
});
test('M02C-RX-12: undefined, null, NaN and object payloads survive timing unchanged', () => {
  for (const value of [undefined, null, NaN, {}]) assert.ok(Object.is(notifications(compare(3, [next(1, value), complete(8)]))[0].value, value));
});
test('M02C-RX-13: completion flush is an exception to a minimum output-gap claim', () => {
  const xs = notifications(compare(3, [next(1, 'a'), next(5, 'b'), complete(6)]));
  assert.deepEqual(xs, [{ time: 4, kind: 'N', value: 'a' }, { time: 6, kind: 'N', value: 'b' }, { time: 6, kind: 'C' }]);
  assert.ok(xs[1].time - xs[0].time < 3);
});
test('M02C-RX-14: independent literal marbles verify output and source subscription', () => {
  new TestScheduler((a, b) => assert.deepEqual(a, b)).run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('-a-b------|');
    expectObservable(source.pipe(debounceTime(3))).toBe('------b---|');
    expectSubscriptions(source.subscriptions).toBe('^---------!');
  });
});
test('M02C-RX-15: a deliberately late wake-up may emit late or rearm after a newer input', () => {
  const lateBy = generation => generation === 0 ? 5 : 0;
  assert.deepEqual(notifications(compare(3, [next(1, 'a'), complete(12)], { lateBy })), [
    { time: 9, kind: 'N', value: 'a' }, { time: 12, kind: 'C' },
  ]);
  assert.deepEqual(notifications(compare(3, [next(1, 'a'), next(8, 'b'), complete(14)], { lateBy })), [
    { time: 11, kind: 'N', value: 'b' }, { time: 14, kind: 'C' },
  ]);
});
test('M02C-RX-16: completion, error and cancel tied with timer have distinct policies', () => {
  for (const terminal of [complete(4), error(4), cancel(4)]) {
    const eager = notifications(compare(3, [next(1, 'a'), terminal]));
    const timerFirst = notifications(compare(3, [next(1, 'a'), terminal], { insertion: 'chained' }));
    if (terminal.type === 'source.complete') assert.deepEqual(eager, timerFirst);
    else { assert.equal(eager.some(x => x.kind === 'N'), false); assert.equal(timerFirst[0].kind, 'N'); }
  }
});
test('M02C-RX-17: hot input still gives subscriptions independent pending timers', () => {
  const clock = new TestScheduler(assert.deepEqual), source = new Subject(), a = [], b = [];
  const output = source.pipe(debounceTime(3, clock));
  output.subscribe(x => a.push([clock.now(), x]));
  clock.schedule(() => source.next('a'), 1);
  clock.schedule(() => output.subscribe(x => b.push([clock.now(), x])), 2);
  clock.schedule(() => source.next('b'), 5);
  clock.schedule(() => source.complete(), 9); clock.flush();
  assert.deepEqual(a, [[4, 'a'], [8, 'b']]); assert.deepEqual(b, [[8, 'b']]);
});
test('M02C-RX-18: downstream take cancels upstream after the first debounced value', () => {
  new TestScheduler((a, b) => assert.deepEqual(a, b)).run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('-a-----b----|');
    expectObservable(source.pipe(debounceTime(3), take(1))).toBe('----(a|)');
    expectSubscriptions(source.subscriptions).toBe('^---!');
  });
});
test('M02C-RX-19: synchronous completing source flushes the last value without waiting', () => {
  const clock = new TestScheduler(assert.deepEqual), received = [];
  new Observable(s => { s.next(1); s.next(2); s.complete(); }).pipe(debounceTime(10, clock)).subscribe({
    next: x => received.push([clock.now(), 'N', x]), complete: () => received.push([clock.now(), 'C']),
  });
  assert.deepEqual(received, [[0, 'N', 2], [0, 'C']]); clock.flush();
  assert.equal(received.length, 2);
});
test('M02C-RX-20: explicit sharing shares one debounced execution', () => {
  const clock = new TestScheduler(assert.deepEqual), subject = new Subject(); let acquired = 0, released = 0;
  const source = new Observable(s => { acquired++; const inner = subject.subscribe(s); return () => { inner.unsubscribe(); released++; }; });
  const shared = source.pipe(debounceTime(3, clock), share()), a = [], b = [];
  const sa = shared.subscribe(x => a.push(x)), sb = shared.subscribe(x => b.push(x));
  assert.equal(acquired, 1); clock.schedule(() => subject.next('x'), 1); clock.flush();
  assert.deepEqual(a, ['x']); assert.deepEqual(b, ['x']);
  sa.unsubscribe(); assert.equal(released, 0); sb.unsubscribe(); assert.equal(released, 1);
});
test('M02C-RX-21: repeated identical values reset silence rather than being deduplicated', () => {
  assert.deepEqual(notifications(compare(3, [next(1, 'a'), next(3, 'a'), complete(8)])), [
    { time: 6, kind: 'N', value: 'a' }, { time: 8, kind: 'C' },
  ]);
});
test('M02C-RX-22: 5022 comparisons include timer operations and native-scheduler transparency', () => {
  let comparisons = 0;
  for (const due of [0, 2, 4]) for (const values of binaryWords(4)) for (const spacing of [0, 2, 5])
    for (const ending of ['complete', 'error', 'cancel']) for (const offset of [0, 1, 6]) for (const insertion of ['eager', 'chained']) {
      const es = values.map((value, i) => next(1 + i * spacing, value));
      const end = (es.at(-1)?.time ?? 1) + offset;
      es.push(ending === 'complete' ? complete(end) : ending === 'error' ? error(end) : cancel(end));
      const actual = compare(due, es, { insertion });
      const native = observeDebounceRx(due, es, { insertion, trackTimers: false });
      assert.deepEqual(withoutTimers(actual), native.observations);
      comparisons++;
    }
  assert.equal(comparisons, 5022);
});
