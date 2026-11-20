import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, of, zipWith, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

// Native-only observation harness: this file imports no canonical model.
const controlled = (count = 3) => {
  const log = [], inputs = [];
  const sources = Array.from({ length: count }, (_, index) => new Observable(s => {
    inputs[index] = s; log.push(['S', index]); return () => log.push(['U', index]);
  }));
  const outer = sources[0].pipe(zipWith(...sources.slice(1))).subscribe({
    next: value => log.push(['N', value]), error: error => log.push(['E', error]), complete: () => log.push(['C']),
  });
  return { log, inputs, outer, next: (i, x) => inputs[i].next(x), complete: i => inputs[i].complete(),
    error: (i, e) => inputs[i].error(e), cancel: () => outer.unsubscribe() };
};
const notifications = log => log.filter(x => ['N', 'E', 'C'].includes(x[0]));

test('S23 ZIPWITH RXJS: construction is lazy and connection acquires source then arguments', () => {
  const log = [];
  const source = i => new Observable(() => { log.push(['S', i]); return () => log.push(['U', i]); });
  const result = source(0).pipe(zipWith(source(1), source(2)));
  assert.deepEqual(log, []);
  const connection = result.subscribe();
  assert.deepEqual(log, [['S', 0], ['S', 1], ['S', 2]]);
  connection.unsubscribe();
  assert.deepEqual(log.slice(3), [['U', 0], ['U', 1], ['U', 2]]);
});

test('S23 ZIPWITH RXJS: faster input retains every unmatched value in FIFO order', () => {
  const r = controlled();
  r.next(0, 'A1'); r.next(0, 'A2'); r.next(0, 'A3');
  r.next(1, 'B1'); r.next(2, 'C1'); r.next(2, 'C2'); r.next(1, 'B2');
  assert.deepEqual(notifications(r.log), [['N', ['A1', 'B1', 'C1']], ['N', ['A2', 'B2', 'C2']]]);
  assert.equal(r.outer.closed, false); r.cancel();
});

test('S23 ZIPWITH RXJS: any input can trigger the next tuple when it supplies the missing member', () => {
  for (const last of [0, 1, 2]) {
    const r = controlled();
    for (const i of [0, 1, 2].filter(i => i !== last)) r.next(i, 'v' + i);
    assert.deepEqual(notifications(r.log), []);
    r.next(last, 'v' + last);
    assert.deepEqual(notifications(r.log), [['N', ['v0', 'v1', 'v2']]]); r.cancel();
  }
});

test('S23 ZIPWITH RXJS: completed input releases immediately and its last buffered tuple triggers completion', () => {
  const r = controlled();
  r.next(0, 'A1'); r.next(0, 'A2'); r.complete(0);
  r.next(1, 'B1'); r.next(2, 'C1'); r.next(1, 'B2'); r.next(2, 'C2');
  assert.deepEqual(r.log, [['S', 0], ['S', 1], ['S', 2], ['U', 0],
    ['N', ['A1', 'B1', 'C1']], ['N', ['A2', 'B2', 'C2']], ['C'], ['U', 1], ['U', 2]]);
  assert.equal(r.outer.closed, true);
});

test('S23 ZIPWITH RXJS: completed buffered input can wait forever for a silent companion', () => {
  const r = controlled(2); r.next(0, 'held'); r.complete(0);
  assert.deepEqual(r.log, [['S', 0], ['S', 1], ['U', 0]]);
  assert.equal(r.outer.closed, false); assert.equal(r.inputs[1].closed, false);
  r.cancel(); assert.deepEqual(r.log.at(-1), ['U', 1]);
});

test('S23 ZIPWITH RXJS: any input completing empty ends result and releases all live inputs in registration order', () => {
  for (const i of [0, 1, 2]) {
    const r = controlled(); r.complete(i);
    assert.deepEqual(r.log, [['S', 0], ['S', 1], ['S', 2], ['C'], ['U', 0], ['U', 1], ['U', 2]]);
    assert.ok(r.inputs.every(s => s.closed));
  }
});

test('S23 ZIPWITH RXJS: errors preserve identity, discard pending tuples and release live inputs', () => {
  const fault = Object.freeze({ fault: 'opaque' });
  for (const i of [0, 1, 2]) {
    const r = controlled(); r.next(0, 'unmatched'); r.error(i, fault);
    assert.deepEqual(r.log, [['S', 0], ['S', 1], ['S', 2], ['E', fault], ['U', 0], ['U', 1], ['U', 2]]);
    assert.equal(r.log[3][1], fault);
  }
});

test('S23 ZIPWITH RXJS: cancellation drops unmatched values silently and releases only live inputs', () => {
  const r = controlled(); r.next(1, 'retained'); r.complete(1); r.next(0, 'waiting'); r.cancel();
  assert.deepEqual(r.log, [['S', 0], ['S', 1], ['S', 2], ['U', 1], ['U', 0], ['U', 2]]);
  assert.equal(r.outer.closed, true);
});

test('S23 ZIPWITH RXJS: closed inputs and result ignore attempted late delivery', () => {
  const r = controlled(2); r.complete(1); const before = [...r.log];
  r.next(0, 'late'); r.next(1, 'late'); r.complete(0); r.cancel();
  assert.deepEqual(r.log, before);
});

test('S23 ZIPWITH RXJS: undefined, null and object references are values and emitted tuples are fresh', () => {
  const value = Object.freeze({ id: 'opaque' }); const r = controlled(2);
  r.next(0, undefined); r.next(1, value); r.next(0, null); r.next(1, value);
  const ns = notifications(r.log).map(x => x[1]);
  assert.deepEqual(ns, [[undefined, value], [null, value]]);
  assert.notEqual(ns[0], ns[1]); assert.equal(ns[0][1], value); assert.equal(ns[1][1], value); r.cancel();
});

test('S23 ZIPWITH RXJS: two result connections own separate input subscriptions and buffers', () => {
  const sourceSlots = [], otherSlots = [], outA = [], outB = [];
  const source = new Observable(s => { sourceSlots.push(s); });
  const other = new Observable(s => { otherSlots.push(s); });
  const result = source.pipe(zipWith(other));
  const a = result.subscribe(v => outA.push(v)); const b = result.subscribe(v => outB.push(v));
  assert.equal(sourceSlots.length, 2); assert.equal(otherSlots.length, 2);
  sourceSlots[0].next('A'); otherSlots[1].next(2);
  assert.deepEqual(outA, []); assert.deepEqual(outB, []);
  otherSlots[0].next(1); sourceSlots[1].next('B');
  assert.deepEqual(outA, [['A', 1]]); assert.deepEqual(outB, [['B', 2]]);
  a.unsubscribe(); assert.equal(sourceSlots[1].closed, false); b.unsubscribe();
});

test('S23 ZIPWITH RXJS: repeated producer description creates distinct indexed connections', () => {
  const slots = [], out = [], releases = [];
  const source = new Observable(s => { const index = slots.length; slots.push(s); return () => releases.push(index); });
  const connection = source.pipe(zipWith(source)).subscribe(v => out.push(v));
  assert.equal(slots.length, 2); slots[0].next('left'); slots[1].next('right');
  assert.deepEqual(out, [['left', 'right']]); connection.unsubscribe(); assert.deepEqual(releases, [0, 1]);
});

test('S23 ZIPWITH RXJS: virtual source time determines tuples and completed-buffer draining lifetime', () => {
  new TestScheduler((actual, expected) => assert.deepEqual(actual, expected)).run(({ hot, expectObservable, expectSubscriptions }) => {
    const source = hot('--a-b-|'); const other = hot('-----x---y---|');
    expectObservable(source.pipe(zipWith(other))).toBe('-----u---(v|)', { u: ['a', 'x'], v: ['b', 'y'] });
    expectSubscriptions(source.subscriptions).toBe('^-----!');
    expectSubscriptions(other.subscriptions).toBe('^--------!');
  });
});

test('S23 ZIPWITH RXJS: equal-time completion order remains observable in connection teardown', () => {
  const observe = completeFirst => {
    const scheduler = new TestScheduler(() => {}); const log = []; const slots = [];
    const sources = [0, 1].map(i => new Observable(s => { slots[i] = s; log.push([scheduler.frame, 'S', i]); return () => log.push([scheduler.frame, 'U', i]); }));
    sources[0].pipe(zipWith(sources[1])).subscribe({ next: v => log.push([scheduler.frame, 'N', v]), complete: () => log.push([scheduler.frame, 'C']) });
    scheduler.schedule(() => slots[0].next('a'), 1);
    const complete = () => slots[0].complete(), next = () => slots[1].next('b');
    scheduler.schedule(completeFirst ? complete : next, 5); scheduler.schedule(completeFirst ? next : complete, 5);
    scheduler.flush(); return log.filter(x => x[0] === 5);
  };
  assert.deepEqual(observe(true), [[5, 'U', 0], [5, 'N', ['a', 'b']], [5, 'C'], [5, 'U', 1]]);
  assert.deepEqual(observe(false), [[5, 'N', ['a', 'b']], [5, 'C'], [5, 'U', 0], [5, 'U', 1]]);
});

test('S23 ZIPWITH RXJS: zero auxiliary inputs emits singleton arrays for every source value', () => {
  const value = Object.freeze({ value: 1 }); const output = [];
  of(undefined, null, value).pipe(zipWith()).subscribe({ next: v => output.push(['N', v]), complete: () => output.push(['C']) });
  assert.deepEqual(output, [['N', [undefined]], ['N', [null]], ['N', [value]], ['C']]);
  assert.equal(output[2][1][0], value);
});

test('S23 ZIPWITH RXJS NATIVE-ONLY: synchronous empty source prevents later input acquisition', () => {
  const log = [];
  const source = new Observable(s => { log.push('source acquire'); s.complete(); return () => log.push('source release'); });
  const other = new Observable(() => { log.push('other acquire'); });
  source.pipe(zipWith(other)).subscribe({ complete: () => log.push('complete') });
  assert.deepEqual(log, ['source acquire', 'complete', 'source release']);
});

test('S23 ZIPWITH RXJS NATIVE-ONLY: synchronous completed queues and take1 preserve physical setup teardown', () => {
  const log = [];
  const source = (i, values) => new Observable(s => {
    log.push(['S', i]); for (const v of values) { if (s.closed) break; s.next(v); } s.complete(); return () => log.push(['U', i]);
  });
  source(0, [1, 2]).pipe(zipWith(source(1, ['a', 'b']), source(2, [true, false])), take(1)).subscribe({
    next: v => log.push(['N', v]), complete: () => log.push(['C']),
  });
  assert.deepEqual(log, [['S', 0], ['U', 0], ['S', 1], ['U', 1], ['S', 2], ['N', [1, 'a', true]], ['C'], ['U', 2]]);
});

test('S23 ZIPWITH RXJS NATIVE-ONLY: one array argument supplies iterable values and does not flatten Observable descriptions', () => {
  let innerConnections = 0;
  const a = new Observable(() => { innerConnections++; }), b = new Observable(() => { innerConnections++; });
  const out = []; of(1, 2).pipe(zipWith([a, b])).subscribe(v => out.push(v));
  assert.deepEqual(out, [[1, a], [2, b]]); assert.equal(innerConnections, 0);
});
