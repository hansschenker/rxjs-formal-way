import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, share, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { createShareModel } from '../dist/models/share.js';
import { observeShareModel } from './helpers/session2-share-driver.mjs';
import { observeShareRx } from './helpers/session2-share-rxjs-driver.mjs';
import { words } from './helpers/session2-flatten-driver.mjs';

function fixture(options = {}) {
  const sinks = [], log = []; let generation = 0;
  const shared = new Observable(s => {
    const g = generation++; sinks.push(s); log.push(['connect', g]);
    return () => log.push(['disconnect', g]);
  }).pipe(share(options));
  const join = name => shared.subscribe({ next: x => log.push([name, 'N', x]), error: e => log.push([name, 'E', e]), complete: () => log.push([name, 'C']) });
  return { shared, sinks, log, join };
}

test('S2-SHARE-01: construction is lazy and overlapping subscribers acquire one connection', () => {
  const f = fixture(); assert.deepEqual(f.log, []);
  const a = f.join('A'), b = f.join('B'); assert.deepEqual(f.log, [['connect', 0]]);
  a.unsubscribe(); assert.deepEqual(f.log, [['connect', 0]]); b.unsubscribe();
  assert.deepEqual(f.log, [['connect', 0], ['disconnect', 0]]);
});
test('S2-SHARE-02: joining is not replay', () => {
  const f = fixture(), a = f.join('A'); f.sinks[0].next('past'); const b = f.join('B'); f.sinks[0].next('future');
  assert.deepEqual(f.log, [['connect', 0], ['A', 'N', 'past'], ['A', 'N', 'future'], ['B', 'N', 'future']]); a.unsubscribe(); b.unsubscribe();
});
test('S2-SHARE-03: addressed values preserve payload identity and registration order', () => {
  const f = fixture(), a = f.join('A'), b = f.join('B'); a.unsubscribe(); const c = f.join('C');
  for (const value of [undefined, null, NaN, {}, () => {}]) {
    f.sinks[0].next(value); const last = f.log.slice(-2);
    assert.equal(last[0][0], 'B'); assert.equal(last[1][0], 'C'); assert.ok(Object.is(last[0][2], value)); assert.ok(Object.is(last[1][2], value));
  }
  b.unsubscribe(); c.unsubscribe();
});
test('S2-SHARE-04: one cancellation does not complete observers or disconnect remaining subscribers', () => {
  const f = fixture(), a = f.join('A'), b = f.join('B'); a.unsubscribe(); f.sinks[0].next('x');
  assert.deepEqual(f.log, [['connect', 0], ['B', 'N', 'x']]); assert.equal(a.closed, true); assert.equal(b.closed, false); b.unsubscribe();
});
test('S2-SHARE-05: last live subscriber resets and a later subscription reconnects', () => {
  const f = fixture(), a = f.join('A'); a.unsubscribe(); const b = f.join('B');
  assert.deepEqual(f.log, [['connect', 0], ['disconnect', 0], ['connect', 1]]); assert.equal(f.sinks[0].closed, true); b.unsubscribe();
});
test('S2-SHARE-06: ref-count reset disabled retains connection without subscribers or replay', () => {
  const f = fixture({ resetOnRefCountZero: false }), a = f.join('A'); a.unsubscribe(); f.sinks[0].next('missed');
  const b = f.join('B'); f.sinks[0].next('seen'); assert.deepEqual(f.log, [['connect', 0], ['B', 'N', 'seen']]);
  b.unsubscribe(); assert.equal(f.sinks[0].closed, false); f.sinks[0].complete(); assert.deepEqual(f.log.at(-1), ['disconnect', 0]);
});
test('S2-SHARE-07: completion policy distinguishes reset from retained termination', () => {
  for (const resetOnComplete of [false, true]) {
    const f = fixture({ resetOnComplete }), a = f.join('A'), b = f.join('B'); f.sinks[0].complete();
    assert.equal(a.closed, true); assert.equal(b.closed, true);
    assert.deepEqual(f.log, [['connect', 0], ['A', 'C'], ['B', 'C'], ['disconnect', 0]]);
    const c = f.join('C'); assert.deepEqual(f.log.at(-1), resetOnComplete ? ['connect', 1] : ['C', 'C']); c.unsubscribe();
  }
});
test('S2-SHARE-08: error policy preserves arbitrary error identity or permits a fresh connection', () => {
  for (const resetOnError of [false, true]) for (const fault of [undefined, null, {}, new Error('fault')]) {
    const f = fixture({ resetOnError }), a = f.join('A'); f.sinks[0].error(fault); assert.equal(a.closed, true);
    assert.equal(f.log[1][2], fault); const b = f.join('B');
    if (resetOnError) assert.deepEqual(f.log.at(-1), ['connect', 1]); else { assert.equal(b.closed, true); assert.equal(f.log.at(-1)[2], fault); }
    b.unsubscribe();
  }
});
test('S2-SHARE-09: retained terminals notify late subscribers without reconnecting or replaying values', () => {
  const f = fixture({ resetOnError: false, resetOnComplete: false }), a = f.join('A'); f.sinks[0].next('past'); f.sinks[0].complete();
  const b = f.join('B'), c = f.join('C'); assert.equal(a.closed && b.closed && c.closed, true);
  assert.deepEqual(f.log.slice(-2), [['B', 'C'], ['C', 'C']]); assert.equal(f.sinks.length, 1);
});
test('S2-SHARE-STALE: emissions attempted by an old disconnected source are suppressed', () => {
  const f = fixture(), a = f.join('A'); a.unsubscribe(); const b = f.join('B');
  f.sinks[0].next('stale'); f.sinks[1].next('current'); assert.deepEqual(f.log.at(-1), ['B', 'N', 'current']);
  assert.equal(f.log.some(x => x[2] === 'stale'), false); b.unsubscribe();
});
test('S2-SHARE-INSTANCE: sharing belongs to each resulting Observable, not the reusable operator function', () => {
  const op = share(); let first = 0, second = 0;
  const a = new Observable(() => { first++; }).pipe(op), b = new Observable(() => { second++; }).pipe(op);
  const subs = [a.subscribe(), a.subscribe(), b.subscribe(), b.subscribe()];
  assert.equal(first, 1); assert.equal(second, 1); for (const s of subs) s.unsubscribe();
});
test('S2-SHARE-RESET-NOT-RETRY: resetting does not revive terminated subscriptions', () => {
  const f = fixture(), a = f.join('A'); f.sinks[0].error('oops'); const b = f.join('B'); f.sinks[1].next('new');
  assert.equal(a.closed, true); assert.deepEqual(f.log.at(-1), ['B', 'N', 'new']); assert.equal(f.log.some(x => x[0] === 'A' && x[2] === 'new'), false); b.unsubscribe();
});
test('S2-SHARE-SYNC: default reset reconnects for successive synchronous completed subscriptions', () => {
  let connections = 0;
  const shared = new Observable(s => { connections++; s.next(1); s.complete(); }).pipe(share());
  const seen = []; shared.subscribe(x => seen.push(x)); shared.subscribe(x => seen.push(x));
  assert.equal(connections, 2); assert.deepEqual(seen, [1, 1]);
});
test('S2-SHARE-TAKE: last-subscriber cancellation stops a cooperative synchronous source', () => {
  const produced = []; let releases = 0;
  const source = new Observable(s => { for (let i = 0; i < 4 && !s.closed; i++) { produced.push(i); s.next(i); } return () => releases++; });
  source.pipe(share(), take(1)).subscribe(); assert.deepEqual(produced, [0]); assert.equal(releases, 1);
});
test('S2-SHARE-TIME: native subscription marbles verify shared source lifetime', () => {
  const clock = new TestScheduler(assert.deepEqual);
  clock.run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('-a-b-c-d-|'), shared = source.pipe(share());
    expectObservable(shared, '^----!').toBe('-a-b-');
    expectObservable(shared, '--^----!').toBe('---b-c-');
    expectSubscriptions(source.subscriptions).toBe('^------!');
  });
});
test('S2-SHARE-DIFF: 6248 bounded command words check all eight boolean reset configurations', () => {
  let count = 0;
  for (const resetOnError of [false, true]) for (const resetOnComplete of [false, true]) for (const resetOnRefCountZero of [false, true]) {
    const config = { resetOnError, resetOnComplete, resetOnRefCountZero };
    for (const word of words(['join', 'leave', 'next', 'complete', 'error'], 4)) {
      const expected = observeShareModel(createShareModel(config), word), actual = observeShareRx(config, word);
      assert.deepEqual(actual.observations, expected.observations, JSON.stringify({ config, word }));
      assert.equal(actual.connected, false); assert.equal(expected.connected, false); assert.equal(actual.liveSubscribers, 0); count++;
    }
  }
  assert.equal(count, 6248);
});
