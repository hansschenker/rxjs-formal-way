import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, EMPTY, window, mergeMap, map, ObjectUnsubscribedError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

// Literal native observations: this file imports no canonical model or runner.
const fixture = () => {
  const log = [], windows = [], inners = new Map(); let source, boundary, outer;
  const source$ = new Observable(s => { source = s; log.push('source+'); return () => log.push('source-'); });
  const boundary$ = new Observable(s => { boundary = s; log.push('boundary+'); return () => log.push('boundary-'); });
  const result = source$.pipe(window(boundary$));
  const connect = () => outer = result.subscribe({ next: w => { const id = windows.length; windows.push(w); log.push(['window', id]); }, error: e => log.push(['outerE', e]), complete: () => log.push('outerC') });
  const attach = (id, index = windows.length - 1) => {
    log.push(id + '+');
    const sub = windows[index].subscribe({ next: v => log.push([id, 'N', v]), error: e => log.push([id, 'E', e]), complete: () => log.push([id, 'C']) });
    sub.add(() => log.push(id + '-')); inners.set(id, sub); return sub;
  };
  return { log, windows, inners, source$, boundary$, result, connect, attach, get source() { return source; }, get boundary() { return boundary; }, get outer() { return outer; } };
};

test('S21 RX window: construction is lazy; initial handle precedes source then boundary acquisition', () => {
  const f = fixture(); assert.deepEqual(f.log, []); f.connect();
  assert.deepEqual(f.log, [['window', 0], 'source+', 'boundary+']); f.outer.unsubscribe();
});

test('S21 RX window: live multicast consumers receive identical values without replay or outer value forwarding', () => {
  const f = fixture(), payload = {}; f.connect(); f.source.next('missed'); f.attach('A'); f.attach('B');
  for (const value of [undefined, null, payload]) f.source.next(value);
  assert.deepEqual(f.log.slice(3), ['A+', 'B+', ['A', 'N', undefined], ['B', 'N', undefined], ['A', 'N', null], ['B', 'N', null], ['A', 'N', payload], ['B', 'N', payload]]);
  assert.equal(f.log.at(-1)[2], payload); f.source.complete();
});

test('S21 RX window: boundary next completes old observers before publishing a fresh window', () => {
  const f = fixture(); f.connect(); f.attach('A'); f.attach('B'); f.log.length = 0; f.boundary.next('ignored');
  assert.deepEqual(f.log, [['A', 'C'], 'A-', ['B', 'C'], 'B-', ['window', 1]]);
  f.attach('C'); f.source.next(7); assert.deepEqual(f.log.at(-1), ['C', 'N', 7]); f.source.complete();
});

test('S21 RX window: consecutive boundaries create and complete empty windows', () => {
  const f = fixture(); f.connect(); f.attach('A'); f.boundary.next(); f.attach('B'); f.boundary.next();
  assert.equal(f.windows.length, 3); assert.equal(f.inners.get('A').closed, true); assert.equal(f.inners.get('B').closed, true);
  assert.deepEqual(f.log.filter(x => Array.isArray(x) && x[1] === 'N'), []); f.source.complete();
});

test('S21 RX window: boundary completion does not close current window or outer result', () => {
  const f = fixture(); f.connect(); const child = f.attach('A'); f.log.length = 0; f.boundary.complete();
  assert.deepEqual(f.log, ['boundary-']); assert.equal(f.outer.closed, false); assert.equal(child.closed, false);
  f.source.next('later'); f.source.complete();
  assert.deepEqual(f.log, ['boundary-', ['A', 'N', 'later'], ['A', 'C'], 'A-', 'outerC', 'source-']);
});

test('S21 RX window: successful source terminal reaches current window before outer and source-boundary teardown', () => {
  const f = fixture(); f.connect(); const child = f.attach('A'); f.log.length = 0; f.source.complete();
  assert.deepEqual(f.log, [['A', 'C'], 'A-', 'outerC', 'source-', 'boundary-']);
  assert.equal(child.closed, true); assert.equal(f.outer.closed, true);
});

for (const which of ['source', 'boundary']) test(`S21 RX window: ${which} error preserves identity and window-before-outer cleanup`, () => {
  const f = fixture(), fault = {}; f.connect(); f.attach('A'); f.log.length = 0; f[which].error(fault);
  assert.deepEqual(f.log, [['A', 'E', fault], 'A-', ['outerE', fault], 'source-', 'boundary-']);
  assert.equal(f.log[0][2], fault); assert.equal(f.log[2][1], fault);
});

test('S21 RX window: outer cancellation disconnects inputs but leaves existing child subscriptions open and silent', () => {
  const f = fixture(); f.connect(); const child = f.attach('A'); f.log.length = 0; f.outer.unsubscribe();
  assert.deepEqual(f.log, ['source-', 'boundary-']); assert.equal(child.closed, false);
  f.source.next('stale'); f.boundary.next(); f.source.complete(); assert.deepEqual(f.log, ['source-', 'boundary-']);
  child.unsubscribe(); child.unsubscribe(); assert.deepEqual(f.log, ['source-', 'boundary-', 'A-']);
});

test('S21 RX window: closing all window observers does not disconnect or terminate the source window', () => {
  const f = fixture(); f.connect(); const a = f.attach('A'); f.log.length = 0; a.unsubscribe();
  f.source.next('missed'); f.attach('B'); f.source.next('future');
  assert.deepEqual(f.log, ['A-', 'B+', ['B', 'N', 'future']]); assert.equal(f.outer.closed, false); f.source.complete();
});

test('S21 RX window: older rotated handles complete late subscribers without replay before and after outer stop', () => {
  const f = fixture(); f.connect(); f.source.next('never replayed'); f.boundary.next(); f.log.length = 0;
  assert.equal(f.attach('A', 0).closed, true); f.source.error('source-failure'); assert.equal(f.attach('B', 0).closed, true);
  assert.deepEqual(f.log, ['A+', ['A', 'C'], 'A-', ['outerE', 'source-failure'], 'source-', 'boundary-', 'B+', ['B', 'C'], 'B-']);
});

test('S21 RX window: invalidated initial and later handles throw ObjectUnsubscribedError on late subscription', () => {
  for (const rotate of [false, true]) for (const ending of ['cancel', 'complete', 'error']) {
    const f = fixture(); f.connect(); if (rotate) f.boundary.next();
    if (ending === 'cancel') f.outer.unsubscribe(); else if (ending === 'complete') f.source.complete(); else f.source.error('E');
    let callbackError = false;
    assert.throws(() => f.windows.at(-1).subscribe({ error: () => callbackError = true }), ObjectUnsubscribedError);
    assert.equal(callbackError, false, 'This setup-time exception escapes subscribe even when an error handler is provided.');
  }
});

test('S21 RX window: initial handle conceals Subject methods; later handles expose the Subject implementation', () => {
  const f = fixture(); f.connect(); f.boundary.next();
  assert.equal(f.windows[0] instanceof Observable, true); assert.equal(f.windows[0] instanceof Subject, false); assert.equal(typeof f.windows[0].next, 'undefined');
  assert.equal(f.windows[1] instanceof Subject, true); assert.equal(typeof f.windows[1].next, 'function'); f.source.complete();
});

test('S21 RX window: independent outer subscriptions create separate windows and source-boundary connections', () => {
  const source = new Subject(), boundary = new Subject(); let sources = 0, boundaries = 0;
  const source$ = new Observable(s => { sources++; return source.subscribe(s); });
  const boundary$ = new Observable(s => { boundaries++; return boundary.subscribe(s); });
  const result = source$.pipe(window(boundary$)), a = [], b = [];
  const first = result.subscribe(w => a.push(w)), second = result.subscribe(w => b.push(w));
  assert.equal(sources, 2); assert.equal(boundaries, 2); assert.notEqual(a[0], b[0]);
  first.unsubscribe(); const seen = []; b[0].subscribe(v => seen.push(v)); source.next('live');
  assert.deepEqual(seen, ['live']); source.complete(); assert.equal(second.closed, true);
});

test('S21 RX window: synchronous source completion still attempts boundary setup with an already closed subscriber', () => {
  const log = [];
  const source = new Observable(s => { log.push('source+'); s.next('V'); s.complete(); return () => log.push('source-'); });
  const boundary = new Observable(s => { log.push(['boundary+', s.closed]); return () => log.push('boundary-'); });
  source.pipe(window(boundary)).subscribe({ next: w => { log.push('window'); w.subscribe({ next: v => log.push(v), complete: () => log.push('windowC') }); }, complete: () => log.push('outerC') });
  assert.deepEqual(log, ['window', 'source+', 'V', 'windowC', 'outerC', 'source-', ['boundary+', true], 'boundary-']);
});

test('S21 RX window: synchronous EMPTY boundary leaves a continuing source in its initial window', () => {
  const source = new Subject(), out = []; let outerDone = false;
  const sub = source.pipe(window(EMPTY)).subscribe({ next: w => w.subscribe(v => out.push(v)), complete: () => outerDone = true });
  source.next(1); source.next(2); assert.deepEqual(out, [1, 2]); assert.equal(outerDone, false);
  source.complete(); assert.equal(sub.closed, true); assert.equal(outerDone, true);
});

test('S21 RX window: virtual-time golden history pins equal-frame source-before-boundary ordering and input lifetimes', () => {
  const scheduler = new TestScheduler((actual, expected) => assert.deepEqual(actual, expected));
  scheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('-a-b-c-|'), boundary = cold('---x-|');
    const result = source.pipe(window(boundary), mergeMap((w, id) => w.pipe(map(value => ({ id, value })))));
    expectObservable(result).toBe('-a-b-c-|', { a: { id: 0, value: 'a' }, b: { id: 0, value: 'b' }, c: { id: 1, value: 'c' } });
    expectSubscriptions(source.subscriptions).toBe('^------!'); expectSubscriptions(boundary.subscriptions).toBe('^----!');
  });
});
