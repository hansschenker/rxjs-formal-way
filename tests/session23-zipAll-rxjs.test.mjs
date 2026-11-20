import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY, NEVER, Observable, Subject, of, zipAll } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

// Literal native observations. This file imports no canonical model or generated prediction.
const rig = (count = 2, project) => {
  const log = [], inners = []; let outer;
  const outer$ = new Observable(s => { outer = s; log.push(['+', 'outer']); return () => log.push(['-', 'outer']); });
  const sources = Array.from({ length: count }, (_, i) => new Observable(s => {
    inners[i] = s; log.push(['+', i]); return () => log.push(['-', i]);
  }));
  const result = outer$.pipe(zipAll(project)).subscribe({ next: v => log.push(['N', v]), error: e => log.push(['E', e]), complete: () => log.push(['C']) });
  const collect = () => { for (const source of sources) outer.next(source); };
  const activate = () => { collect(); outer.complete(); };
  return { log, inners, sources, outer, result, collect, activate };
};
const notes = log => log.filter(x => ['N', 'E', 'C'].includes(x[0]));

test('S23 RXJS zipAll: construction is inert and result connections have independent collection lifetimes', () => {
  let starts = 0, stops = 0;
  const source = new Observable(() => { starts++; return () => stops++; });
  const result = source.pipe(zipAll()); assert.equal(starts, 0);
  const a = result.subscribe(), b = result.subscribe(); assert.equal(starts, 2);
  a.unsubscribe(); assert.equal(stops, 1); assert.equal(b.closed, false); b.unsubscribe(); assert.equal(stops, 2);
});

test('S23 RXJS zipAll: inner acquisition waits for outer complete and precedes outer producer release', () => {
  const r = rig(); r.collect(); assert.deepEqual(r.log, [['+', 'outer']]); assert.equal(r.inners.length, 0);
  r.outer.complete(); assert.deepEqual(r.log, [['+', 'outer'], ['+', 0], ['+', 1], ['-', 'outer']]); r.result.unsubscribe();
});

test('S23 RXJS zipAll: a non-completing outer never starts its collected descriptions', () => {
  let starts = 0; const outer = new Subject(), sub = outer.pipe(zipAll()).subscribe();
  outer.next(new Observable(() => { starts++; })); outer.next(NEVER);
  assert.equal(starts, 0); assert.equal(sub.closed, false); sub.unsubscribe(); assert.equal(starts, 0);
});

test('S23 RXJS zipAll: early values from live inner producers are missed before the collection barrier', () => {
  const outer = new Subject(), a = new Subject(), b = new Subject(), values = [];
  const sub = outer.pipe(zipAll()).subscribe(v => values.push(v));
  outer.next(a); outer.next(b); a.next('missed-A'); b.next('missed-B');
  outer.complete(); b.next('B'); assert.deepEqual(values, []); a.next('A');
  assert.deepEqual(values, [['A', 'B']]); sub.unsubscribe();
});

test('S23 RXJS zipAll: empty outer completes without emitting an empty tuple before its producer teardown', () => {
  const r = rig(0); r.outer.complete();
  assert.deepEqual(r.log, [['+', 'outer'], ['C'], ['-', 'outer']]); assert.equal(r.result.closed, true);
});

test('S23 RXJS zipAll: repeated identical inner descriptions acquire independent subscriptions', () => {
  const subscriptions = [], out = [], outer = new Subject();
  const same = new Observable(s => { subscriptions.push(s); });
  const sub = outer.pipe(zipAll()).subscribe(v => out.push(v)); outer.next(same); outer.next(same); outer.complete();
  assert.equal(subscriptions.length, 2); assert.notEqual(subscriptions[0], subscriptions[1]);
  subscriptions[0].next('first'); subscriptions[1].next('second'); assert.deepEqual(out, [['first', 'second']]); sub.unsubscribe();
});

test('S23 RXJS zipAll: faster arrivals queue in FIFO order instead of replacing earlier values', () => {
  const r = rig(); r.activate(); r.inners[0].next('A'); r.inners[0].next('B'); r.inners[1].next(1); r.inners[1].next(2);
  assert.deepEqual(notes(r.log), [['N', ['A', 1]], ['N', ['B', 2]]]); r.result.unsubscribe();
});

test('S23 RXJS zipAll: completed-input queues drain and final success follows remaining producer cleanup', () => {
  const r = rig(3); r.activate(); r.inners[0].next('A'); r.inners[0].next('B'); r.inners[0].complete();
  assert.equal(r.result.closed, false); assert.deepEqual(r.log.at(-1), ['-', 0]);
  r.inners[1].next(1); r.inners[2].next(true); r.inners[1].next(2); r.inners[2].next(false);
  assert.deepEqual(r.log.slice(-5), [['N', ['A', 1, true]], ['N', ['B', 2, false]], ['-', 1], ['-', 2], ['C']]);
  assert.equal(r.result.closed, true);
});

test('S23 RXJS zipAll: empty completion cancels every live input before downstream success', () => {
  const r = rig(3); r.activate(); r.inners[0].next('discarded'); r.inners[1].complete();
  assert.deepEqual(r.log.slice(-4), [['-', 0], ['-', 1], ['-', 2], ['C']]);
  assert.deepEqual(notes(r.log), [['C']]);
});

test('S23 RXJS zipAll: inner error is unchanged and precedes ordered producer teardown', () => {
  const fault = Object.freeze({ fault: 'inner' }), r = rig(3); r.activate(); r.inners[0].next('unmatched'); r.inners[1].error(fault);
  assert.deepEqual(r.log.slice(-4), [['E', fault], ['-', 0], ['-', 1], ['-', 2]]); assert.equal(notes(r.log)[0][1], fault);
});

test('S23 RXJS zipAll: outer error discards descriptions and never connects inner producers', () => {
  const fault = Object.freeze({ fault: 'outer' }), r = rig(); r.collect(); r.outer.error(fault);
  assert.deepEqual(r.log, [['+', 'outer'], ['E', fault], ['-', 'outer']]); assert.equal(r.inners.length, 0);
});

test('S23 RXJS zipAll: cancellation before outer completion never activates collected inputs', () => {
  const r = rig(); r.collect(); r.result.unsubscribe();
  assert.deepEqual(r.log, [['+', 'outer'], ['-', 'outer']]); assert.equal(r.inners.length, 0);
});

test('S23 RXJS zipAll: cancellation during join releases only live producers and emits no terminal', () => {
  const r = rig(3); r.activate(); r.inners[0].next('held'); r.inners[0].complete(); r.result.unsubscribe();
  assert.deepEqual(r.log.slice(-3), [['-', 0], ['-', 1], ['-', 2]]); assert.deepEqual(notes(r.log), []);
  assert.ok(r.inners.every(s => s.closed));
});

test('S23 RXJS zipAll: one collected stream emits singleton arrays', () => {
  const r = rig(1); r.activate(); r.inners[0].next('A'); r.inners[0].next('B'); r.inners[0].complete();
  assert.deepEqual(notes(r.log), [['N', ['A']], ['N', ['B']], ['C']]);
  assert.deepEqual(r.log.slice(-2), [['-', 0], ['C']]);
});

test('S23 RXJS zipAll: undefined and null are values, object members retain identity, arrays are fresh', () => {
  const value = Object.freeze({ opaque: true }), r = rig(); r.activate();
  r.inners[0].next(undefined); r.inners[0].next(value); r.inners[1].next(null); r.inners[1].next(value);
  const values = notes(r.log).map(n => n[1]);
  assert.deepEqual(values[0], [undefined, null]); assert.equal(values[1][0], value); assert.equal(values[1][1], value); assert.notEqual(values[0], values[1]);
  r.result.unsubscribe();
});

test('S23 RXJS zipAll: virtual time makes the collection barrier, FIFO outputs and teardown frames explicit', () => {
  new TestScheduler((actual, expected) => assert.deepEqual(actual, expected)).run(({ hot, cold, expectObservable, expectSubscriptions }) => {
    const a = cold('-a-b-|'), b = cold('--1---2---|');
    const outer = hot('-x-y--|', { x: a, y: b });
    expectObservable(outer.pipe(zipAll())).toBe('--------u---(v|)', { u: ['a', '1'], v: ['b', '2'] });
    expectSubscriptions(outer.subscriptions).toBe('^-----!');
    expectSubscriptions(a.subscriptions).toBe('------^----!');
    expectSubscriptions(b.subscriptions).toBe('------^-----!');
  });
});

test('S23 RXJS zipAll native-only: synchronous inner setup stops later acquisition after an empty first input', () => {
  const log = [], outer = new Subject();
  const empty = new Observable(s => { log.push('first+'); s.complete(); return () => log.push('first-'); });
  const later = new Observable(() => { log.push('later+'); });
  outer.pipe(zipAll()).subscribe({ complete: () => log.push('complete') });
  outer.next(empty); outer.next(later); outer.complete();
  assert.deepEqual(log, ['first+', 'first-', 'complete']);
});

test('S23 RXJS zipAll native-only: synchronous outer and inner values zip and drain without deferred scheduling', () => {
  const result = [];
  of(of('A', 'B', 'C'), of(1, 2)).pipe(zipAll()).subscribe({ next: v => result.push(['N', v]), complete: () => result.push(['C']) });
  assert.deepEqual(result, [['N', ['A', 1]], ['N', ['B', 2]], ['C']]);
  const empty = []; EMPTY.pipe(zipAll()).subscribe({ next: v => empty.push(v), complete: () => empty.push('C') }); assert.deepEqual(empty, ['C']);
});

test('S23 RXJS zipAll native-only: optional projector receives tuple members in order and can return undefined', () => {
  const calls = [], value = Object.freeze({ opaque: true });
  const r = rig(2, (...args) => { calls.push(args); return undefined; }); r.activate(); r.inners[0].next(value); r.inners[1].next(null);
  assert.deepEqual(calls, [[value, null]]); assert.equal(calls[0][0], value); assert.deepEqual(notes(r.log), [['N', undefined]]); r.result.unsubscribe();
});

test('S23 RXJS zipAll native-only: projector throw preserves identity and tears down live inputs', () => {
  const fault = Object.freeze({ fault: 'projector' }), r = rig(2, () => { throw fault; });
  r.activate(); r.inners[0].next(1); r.inners[1].next(2);
  assert.deepEqual(r.log.slice(-3), [['E', fault], ['-', 0], ['-', 1]]); assert.equal(r.result.closed, true);
});
