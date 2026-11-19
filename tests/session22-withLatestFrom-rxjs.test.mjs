import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, EMPTY, withLatestFrom } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

// Truly independent RxJS observations: no formal models, manifests, or runners.
const setup = () => {
  const src = new Subject(), a = new Subject(), b = new Subject(), log = [];
  let srcOn = 0, srcOff = 0, aOn = 0, aOff = 0, bOn = 0, bOff = 0;
  const wrap = (name, subject, on, off) => new Observable(o => {
    log.push(name + '+'); on();
    const sub = subject.subscribe(o);
    return () => { sub.unsubscribe(); off(); log.push(name + '-'); };
  });
  const src$ = wrap('src', src, () => srcOn++, () => srcOff++);
  const a$ = wrap('a', a, () => aOn++, () => aOff++);
  const b$ = wrap('b', b, () => bOn++, () => bOff++);
  const result = src$.pipe(withLatestFrom(a$, b$));
  let subscription;
  const connect = () => subscription = result.subscribe({
    next: v => log.push(['N', v]), error: err => log.push(['E', err]),
    complete: () => log.push('C'),
  });
  return { src, a, b, log, result, connect, get subscription() { return subscription; },
    counters: () => ({ srcOn, srcOff, aOn, aOff, bOn, bOff }) };
};

test('S22 RX withLatestFrom: lazy operator subscribes to every auxiliary before the source', () => {
  const f = setup(); assert.deepEqual(f.log, []); f.connect();
  assert.deepEqual(f.log, ['a+', 'b+', 'src+']);
  assert.deepEqual(f.counters(), { srcOn: 1, srcOff: 0, aOn: 1, aOff: 0, bOn: 1, bOff: 0 });
  f.subscription.unsubscribe();
});

test('S22 RX withLatestFrom: readiness gates and drops early source values', () => {
  const f = setup(); f.connect(); f.log.length = 0;
  f.src.next('early'); f.a.next(1); f.src.next('still-early');
  f.b.next(2); f.src.next('first');
  assert.deepEqual(f.log, [['N', ['first', 1, 2]]]); f.src.complete();
});

test('S22 RX withLatestFrom: auxiliary values change cache but do not trigger outputs', () => {
  const f = setup(); f.connect(); f.a.next('a'); f.b.next('b');
  f.log.length = 0; f.a.next('new'); f.b.next('latest');
  assert.deepEqual(f.log, []);
  f.src.next('trigger');
  assert.deepEqual(f.log, [['N', ['trigger', 'new', 'latest']]]); f.src.complete();
});

test('S22 RX withLatestFrom: undefined is a present value and identities are preserved', () => {
  const f = setup(), payload = { hello: true }, out = []; f.result.subscribe(x => out.push(x));
  f.a.next(undefined); f.b.next(payload); f.src.next(null);
  assert.deepEqual(out, [[null, undefined, payload]]);
  assert.equal(out[0][2], payload); f.src.complete();
});

test('S22 RX withLatestFrom: completed auxiliary retains its latest value', () => {
  const f = setup(); f.connect(); f.a.next('persist'); f.a.complete();
  f.b.next(4); f.log.length = 0; f.src.next('now');
  assert.deepEqual(f.log, [['N', ['now', 'persist', 4]]]); f.src.complete();
});

test('S22 RX withLatestFrom: auxiliary completes without value; source can continue but never emits', () => {
  const src = new Subject(), log = [], secondary = new Subject();
  const sub = src.pipe(withLatestFrom(EMPTY, secondary)).subscribe({
    next: x => log.push(x), complete: () => log.push('C'),
  });
  secondary.next('ready'); src.next('discarded'); assert.deepEqual(log, []);
  assert.equal(sub.closed, false); src.complete();
  assert.deepEqual(log, ['C']);
});

test('S22 RX withLatestFrom: source completion releases auxiliaries even if never ready', () => {
  const f = setup(); f.connect(); f.log.length = 0;
  f.src.complete();
  assert.deepEqual(f.log, ['C', 'a-', 'b-', 'src-']);
  assert.deepEqual(f.counters(), { srcOn: 1, srcOff: 1, aOn: 1, aOff: 1, bOn: 1, bOff: 1 });
});

test('S22 RX withLatestFrom: auxiliary error propagates identical object and releases all subscriptions', () => {
  const f = setup(), fault = {}; f.connect(); f.log.length = 0; f.b.error(fault);
  assert.deepEqual(f.log[0], ['E', fault]);
  assert.equal(f.log[0][1], fault);
  assert.deepEqual(f.counters(), { srcOn: 1, srcOff: 1, aOn: 1, aOff: 1, bOn: 1, bOff: 1 });
});

test('S22 RX withLatestFrom: source error preserves identity', () => {
  const f = setup(), err = {}; f.connect(); f.log.length = 0; f.src.error(err);
  assert.equal(f.log[0][1], err);
  assert.equal(f.subscription.closed, true);
});

test('S22 RX withLatestFrom: downstream cancellation disconnects all without output or completion', () => {
  const f = setup(); f.connect(); f.log.length = 0;
  f.subscription.unsubscribe();
  assert.deepEqual(f.log, ['a-', 'b-', 'src-']);
  f.src.next(1); f.a.next(2); f.b.next(3);
  assert.deepEqual(f.log, ['a-', 'b-', 'src-']);
});

test('S22 RX withLatestFrom: separate result subscriptions each have their own input connections', () => {
  const f = setup(), x = [], y = [];
  const a = f.result.subscribe(t => x.push(t)), b = f.result.subscribe(t => y.push(t));
  assert.equal(f.counters().srcOn, 2); assert.equal(f.counters().aOn, 2);
  f.a.next('A'); f.b.next('B'); f.src.next('C');
  assert.deepEqual(x, [['C', 'A', 'B']]); assert.deepEqual(y, [['C', 'A', 'B']]);
  a.unsubscribe(); assert.equal(f.counters().srcOff, 1);
  f.src.next('D'); assert.deepEqual(y.at(-1), ['D', 'A', 'B']);
  b.unsubscribe();
});

test('S22 RX withLatestFrom: single auxiliary produces pairs; all tuples are fresh arrays', () => {
  const s = new Subject(), a = new Subject(), out = [];
  const sub = s.pipe(withLatestFrom(a)).subscribe(v => out.push(v));
  a.next(1); s.next('a'); s.next('b');
  assert.deepEqual(out, [['a', 1], ['b', 1]]);
  assert.notEqual(out[0], out[1]); sub.unsubscribe();
});

test('S22 RX withLatestFrom: synchronous setup subscribes aux first, then source; retained prior value may enable immediate source', () => {
  const log = [];
  const aux = new Observable(o => { log.push('aux+'); o.next('seed'); o.complete(); return () => log.push('aux-'); });
  const source = new Observable(o => { log.push('source+'); o.next('value'); o.complete(); return () => log.push('source-'); });
  source.pipe(withLatestFrom(aux)).subscribe({ next: x => log.push(['N', x]), complete: () => log.push('C') });
  assert.deepEqual(log, ['aux+', 'aux-', 'source+', ['N', ['value', 'seed']], 'C', 'source-']);
});

test('S22 RX withLatestFrom: virtual scheduler confirms source-only readiness and auxiliary lifetimes', () => {
  const scheduler = new TestScheduler((actual, expected) => assert.deepEqual(actual, expected));
  scheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('-a-b-c-d-|', { a: 'A', b: 'B', c: 'C', d: 'D' });
    const first = cold('--x---y-|', { x: 1, y: 2 });
    const second = cold('----q---|', { q: 'q' });
    const joined = source.pipe(withLatestFrom(first, second));
    expectObservable(joined).toBe('-----c-d-|', {
      c: ['C', 1, 'q'], d: ['D', 2, 'q'],
    });
    expectSubscriptions(source.subscriptions).toBe('^--------!');
    expectSubscriptions(first.subscriptions).toBe('^-------!');
    expectSubscriptions(second.subscriptions).toBe('^-------!');
  });
});
