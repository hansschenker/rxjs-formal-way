import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, of, EMPTY, skip, takeWhile, skipWhile, takeUntil, skipUntil, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { createSkipModel, createTakeWhileModel, createSkipWhileModel, createTakeUntilModel, createSkipUntilModel } from '../dist/index.js';
import { at, fault, driveUnary, driveUntil, unaryWords, untilWords, scheduleWord } from './helpers/session05-model.mjs';
import { runUnaryNative, runUntilNative } from './helpers/session05-native.mjs';

const notifications = log => log.filter(x => ['N', 'C', 'E'].includes(x[1]));
const sourceCalls = log => log.filter(x => x[1] === 'call');
const unaryCheck = (name, model, inputs, options = {}) => {
  const native = runUnaryNative(name, inputs, options);
  const predicted = driveUnary(model, inputs, options.predicate);
  assert.deepEqual(native.log, predicted.log);
  return native.log;
};
const untilCheck = (name, inputs, initial = null) => {
  const native = runUntilNative(name, inputs, initial);
  assert.deepEqual(native.log, driveUntil(name === 'takeUntil' ? createTakeUntilModel() : createSkipUntilModel(), inputs, initial).log);
  return native;
};

test('S5-SKIP-01: construction is lazy; skip zero still subscribes; empty input completes', () => {
  let subscriptions = 0;
  const stream = new Observable(s => { subscriptions++; s.complete(); }).pipe(skip(0));
  assert.equal(subscriptions, 0);
  stream.subscribe();
  assert.equal(subscriptions, 1);
  assert.deepEqual(unaryCheck('skip', createSkipModel(0), scheduleWord(['C']), { count: 0 }), [
    [0, 'subscribe', 'source', 0], [1, 'C'], [1, 'unsubscribe', 'source', 0],
  ]);
});

test('S5-SKIP-02: first count values are dropped; later values are unchanged and unbuffered', () => {
  for (const count of [0, 1, 2, 4]) {
    const log = unaryCheck('skip', createSkipModel(count), scheduleWord([0, 1, 2, 'C']), { count });
    assert.deepEqual(notifications(log), [...[0, 1, 2].slice(count).map((value, i) => [count + i + 1, 'N', value]), [4, 'C']]);
  }
});

test('S5-SKIP-03: completion below count, source errors and cancellation remain distinct', () => {
  for (const token of ['C', 'E', 'X']) {
    const log = unaryCheck('skip', createSkipModel(5), scheduleWord([0, token]), { count: 5 });
    assert.deepEqual(notifications(log), token === 'C' ? [[2, 'C']] : token === 'E' ? [[2, 'E', fault]] : []);
    assert.deepEqual(log.at(-1), [2, 'unsubscribe', 'source', 0]);
  }
});

for (const name of ['takeWhile', 'skipWhile']) {
  const make = name === 'takeWhile' ? createTakeWhileModel : createSkipWhileModel;
  test(`S5-${name.toUpperCase()}-01: lazy initialization and empty completion do not invoke predicate`, () => {
    let calls = 0, subscriptions = 0;
    const source = new Observable(s => { subscriptions++; s.complete(); });
    const p = () => { calls++; return true; };
    const stream = source.pipe(name === 'takeWhile' ? takeWhile(p) : skipWhile(p));
    assert.equal(subscriptions, 0);
    stream.subscribe();
    assert.equal(subscriptions, 1);
    assert.equal(calls, 0);
    assert.deepEqual(notifications(unaryCheck(name, make(), scheduleWord(['C']))), [[1, 'C']]);
  });
  test(`S5-${name.toUpperCase()}-02: predicate receives original inputs and sequential zero-based indices`, () => {
    const log = unaryCheck(name, make(), scheduleWord([0, 1, 2, 'C']), { predicate: () => true });
    assert.deepEqual(sourceCalls(log), [[1, 'call', 'predicate', 0, 0], [2, 'call', 'predicate', 1, 1], [3, 'call', 'predicate', 2, 2]]);
  });
  test(`S5-${name.toUpperCase()}-03: first falsy result selects the documented prefix or suffix policy`, () => {
    const log = unaryCheck(name, make(), scheduleWord([0, 2, 1, 'C']), { predicate: x => x < 2 });
    assert.deepEqual(notifications(log), name === 'takeWhile' ? [[1, 'N', 0], [2, 'C']] : [[2, 'N', 2], [3, 'N', 1], [4, 'C']]);
  });
  test(`S5-${name.toUpperCase()}-05: thrown values preserve identity and stop later calls without completion`, () => {
    for (const thrown of [undefined, null, fault]) {
      const predicate = (_value, index) => { if (index === 1) throw thrown; return true; };
      const log = unaryCheck(name, make(), scheduleWord([0, 1, 2, 'C']), { predicate });
      assert.equal(sourceCalls(log).length, 2);
      const terminal = notifications(log).at(-1);
      assert.equal(terminal[1], 'E');
      assert.ok(Object.is(terminal[2], thrown));
      assert.deepEqual(log.at(-1), [2, 'unsubscribe', 'source', 0]);
    }
  });
  test(`S5-${name.toUpperCase()}-06: terminals and cancellation bypass the predicate in testing and open states`, () => {
    for (const token of ['C', 'E', 'X']) for (const opened of [false, true]) {
      if (name === 'takeWhile' && opened) continue;
      const log = unaryCheck(name, make(), scheduleWord([0, token]), { predicate: () => !opened });
      assert.deepEqual(notifications(log).filter(x => x[1] !== 'N'), token === 'C' ? [[2, 'C']] : token === 'E' ? [[2, 'E', fault]] : []);
      assert.equal(sourceCalls(log).length, 1);
    }
  });
}

test('S5-TAKEWHILE-INCLUSIVE: false includes one boundary value before completion; throws include none', () => {
  const log = unaryCheck('takeWhile', createTakeWhileModel(true), scheduleWord([0, 2, 1, 'C']), { inclusive: true, predicate: x => x < 2 });
  assert.deepEqual(notifications(log), [[1, 'N', 0], [2, 'N', 2], [2, 'C']]);
  const thrown = unaryCheck('takeWhile', createTakeWhileModel(true), scheduleWord([0]), { inclusive: true, predicate: () => { throw fault; } });
  assert.deepEqual(notifications(thrown), [[1, 'E', fault]]);
});

test('S5-SKIPWHILE-04: opened gate bypasses even a predicate that would throw on later values', () => {
  const predicate = (x, i) => { if (i > 1) throw fault; return x < 2; };
  const log = unaryCheck('skipWhile', createSkipWhileModel(), scheduleWord([0, 2, 0, 'C']), { predicate });
  assert.deepEqual(notifications(log), [[2, 'N', 2], [3, 'N', 0], [4, 'C']]);
  assert.equal(sourceCalls(log).length, 2);
});

test('S5-UNARY-IDENTITY: no cloning or strict-boolean reinterpretation of truthy/falsy outcomes', () => {
  for (const value of [undefined, NaN, Object.freeze({ token: 1 })]) {
    const input = [at(1, 'source.next', { value }), at(2, 'source.complete')];
    for (const [name, model, options] of [
      ['skip', createSkipModel(0), { count: 0 }],
      ['takeWhile', createTakeWhileModel(), { predicate: () => ({ truthy: true }) }],
      ['skipWhile', createSkipWhileModel(), { predicate: () => 0 }],
    ]) assert.ok(Object.is(notifications(unaryCheck(name, model, input, options))[0][2], value));
  }
});

test('S5-UNARY-SYNC: completion and downstream take stop cooperative synchronous production', () => {
  for (const inclusive of [false, true]) {
    const attempted = [], values = [];
    new Observable(s => { for (let x = 0; x < 10 && !s.closed; x++) { attempted.push(x); s.next(x); } }).pipe(takeWhile(x => x < 2, inclusive)).subscribe(x => values.push(x));
    assert.deepEqual(attempted, [0, 1, 2]);
    assert.deepEqual(values, inclusive ? [0, 1, 2] : [0, 1]);
  }
  for (const gate of [skip(2), skipWhile(x => x < 2)]) {
    const attempted = [], values = [];
    new Observable(s => { for (let x = 0; x < 10 && !s.closed; x++) { attempted.push(x); s.next(x); } }).pipe(gate, take(1)).subscribe(x => values.push(x));
    assert.deepEqual(attempted, [0, 1, 2]);
    assert.deepEqual(values, [2]);
  }
});

test('S5-UNARY-OWNERSHIP: hot producer does not share per-subscription counters or gates', () => {
  for (const gate of [skip(1), skipWhile((_v, index) => index < 1)]) {
    const source = new Subject(), stream = source.pipe(gate), a = [], b = [];
    stream.subscribe(v => a.push(v)); source.next('a'); stream.subscribe(v => b.push(v)); source.next('b'); source.next('c'); source.complete();
    assert.deepEqual(a, ['b', 'c']); assert.deepEqual(b, ['c']);
  }
  const source = new Subject(), stream = source.pipe(takeWhile((_v, index) => index < 1)), a = [], b = [];
  stream.subscribe(v => a.push(v)); source.next('a'); stream.subscribe(v => b.push(v)); source.next('b'); source.next('c');
  assert.deepEqual(a, ['a']); assert.deepEqual(b, ['b']);
});

for (const name of ['takeUntil', 'skipUntil']) {
  test(`S5-${name.toUpperCase()}-SETUP: notifier connects first; synchronous next and empty completion have different effects`, () => {
    const live = untilCheck(name, []);
    assert.deepEqual(live.log, [[0, 'subscribe', 'notifier', 0], [0, 'subscribe', 'source', 0]]);
    const signalled = untilCheck(name, scheduleWord([1, 'C']), at(0, 'notifier.next', { value: false }).event);
    assert.deepEqual(notifications(signalled.log), name === 'takeUntil' ? [[0, 'C']] : [[1, 'N', 1], [2, 'C']]);
    assert.deepEqual(signalled.sourceWasClosed, name === 'takeUntil' ? [] : [false]);
    const empty = untilCheck(name, scheduleWord([1, 'C']), at(0, 'notifier.complete').event);
    assert.deepEqual(notifications(empty.log), name === 'takeUntil' ? [[1, 'N', 1], [2, 'C']] : [[2, 'C']]);
  });
  test(`S5-${name.toUpperCase()}-VALUES: value flow before and after notifier is independent of its payload`, () => {
    const value = Object.freeze({ source: 'payload' });
    const inputs = [at(1, 'source.next', { value }), at(2, 'notifier.next', { value: undefined }), at(3, 'source.next', { value }), at(4, 'source.complete')];
    const r = untilCheck(name, inputs);
    assert.deepEqual(notifications(r.log), name === 'takeUntil' ? [[1, 'N', value], [2, 'C']] : [[3, 'N', value], [4, 'C']]);
    assert.ok(Object.is(notifications(r.log)[0][2], value));
  });
  test(`S5-${name.toUpperCase()}-SIGNAL: first next releases notifier; later notifier attempts have no effect`, () => {
    for (const signal of [false, 0, null, undefined]) {
      const r = untilCheck(name, [at(1, 'notifier.next', { value: signal }), at(2, 'notifier.error', { error: fault }), at(3, 'source.next', { value: 'a' }), at(4, 'source.complete')]);
      assert.deepEqual(notifications(r.log), name === 'takeUntil' ? [[1, 'C']] : [[3, 'N', 'a'], [4, 'C']]);
      assert.equal(r.log.filter(x => x[1] === 'unsubscribe' && x[2] === 'notifier').length, 1);
    }
  });
  test(`S5-${name.toUpperCase()}-EMPTY: notifier complete alone neither completes downstream nor opens the gate`, () => {
    const r = untilCheck(name, [at(1, 'notifier.complete'), at(2, 'source.next', { value: 1 }), at(3, 'source.complete')]);
    assert.deepEqual(notifications(r.log), name === 'takeUntil' ? [[2, 'N', 1], [3, 'C']] : [[3, 'C']]);
    assert.deepEqual(r.log.at(-1), [3, 'unsubscribe', 'source', 0]);
  });
  test(`S5-${name.toUpperCase()}-ERROR: notifier errors preserve identity, including the synchronous setup case`, () => {
    const live = untilCheck(name, [at(1, 'notifier.error', { error: fault }), at(2, 'source.next', { value: 1 })]);
    assert.deepEqual(live.log.slice(2), [[1, 'E', fault], [1, 'unsubscribe', 'notifier', 0], [1, 'unsubscribe', 'source', 0]]);
    const sync = untilCheck(name, [], at(0, 'notifier.error', { error: fault }).event);
    assert.deepEqual(notifications(sync.log), [[0, 'E', fault]]);
    assert.deepEqual(sync.sourceWasClosed, name === 'skipUntil' ? [true] : []);
    if (name === 'skipUntil') assert.deepEqual(sync.log.slice(-2), [[0, 'subscribe', 'source', 0], [0, 'unsubscribe', 'source', 0]]);
  });
  test(`S5-${name.toUpperCase()}-TERMINAL: source termination or cancellation releases resources in registration order`, () => {
    for (const token of ['C', 'E', 'X']) for (const prefix of [[], ['c'], ...(name === 'skipUntil' ? [['n']] : [])]) {
      const word = [...prefix, token], r = untilCheck(name, scheduleWord(word));
      assert.deepEqual(notifications(r.log), token === 'C' ? [[word.length, 'C']] : token === 'E' ? [[word.length, 'E', fault]] : []);
      assert.deepEqual(r.log.at(-1), [word.length, 'unsubscribe', 'source', 0]);
      assert.equal(r.log.filter(x => x[1] === 'unsubscribe' && x[2] === 'notifier').length, 1);
    }
  });
}

test('S5-UNTIL-TIE: source and notifier at one timestamp obey delivery order', () => {
  const value = at(1, 'source.next', { value: 7 }), signal = at(1, 'notifier.next', { value: 0 });
  assert.deepEqual(notifications(untilCheck('takeUntil', [value, signal]).log), [[1, 'N', 7], [1, 'C']]);
  assert.deepEqual(notifications(untilCheck('takeUntil', [signal, value]).log), [[1, 'C']]);
  assert.deepEqual(notifications(untilCheck('skipUntil', [value, signal]).log), []);
  assert.deepEqual(notifications(untilCheck('skipUntil', [signal, value]).log), [[1, 'N', 7]]);
});

test('S5-UNTIL-MARBLES: independent native diagrams check notifier and source subscription windows', () => {
  new TestScheduler((a, e) => assert.deepEqual(a, e)).run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('-a-b-c-d-|'), notifier = cold('----n----|');
    expectObservable(source.pipe(takeUntil(notifier))).toBe('-a-b|');
    expectSubscriptions(source.subscriptions).toBe('^---!');
    expectSubscriptions(notifier.subscriptions).toBe('^---!');
  });
  new TestScheduler((a, e) => assert.deepEqual(a, e)).run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('-a-b-c-d-|'), notifier = cold('----n----|');
    expectObservable(source.pipe(skipUntil(notifier))).toBe('-----c-d-|');
    expectSubscriptions(source.subscriptions).toBe('^--------!');
    expectSubscriptions(notifier.subscriptions).toBe('^---!');
  });
});

test('S5-UNTIL-SYNC: source completion before signal is forwarded, and opening can precede synchronous source values', () => {
  const takeValues = [], skipValues = [], openValues = [];
  of(1, 2).pipe(takeUntil(EMPTY)).subscribe({ next: x => takeValues.push(x), complete: () => takeValues.push('C') });
  of(1, 2).pipe(skipUntil(EMPTY)).subscribe({ next: x => skipValues.push(x), complete: () => skipValues.push('C') });
  of(1, 2).pipe(skipUntil(of(false))).subscribe({ next: x => openValues.push(x), complete: () => openValues.push('C') });
  assert.deepEqual(takeValues, [1, 2, 'C']); assert.deepEqual(skipValues, ['C']); assert.deepEqual(openValues, [1, 2, 'C']);
});

test('S5-UNTIL-OWNERSHIP: each result subscription owns source and notifier subscriptions', () => {
  for (const select of [takeUntil, skipUntil]) {
    let sourceCount = 0, notifierCount = 0, releasedSource = 0, releasedNotifier = 0;
    const source = new Observable(() => { sourceCount++; return () => releasedSource++; });
    const notifier = new Observable(() => { notifierCount++; return () => releasedNotifier++; });
    const stream = source.pipe(select(notifier));
    const a = stream.subscribe(), b = stream.subscribe();
    assert.equal(sourceCount, 2); assert.equal(notifierCount, 2);
    a.unsubscribe(); assert.equal(releasedSource, 1); assert.equal(releasedNotifier, 1); assert.equal(b.closed, false);
    b.unsubscribe(); assert.equal(releasedSource, 2); assert.equal(releasedNotifier, 2);
  }
});

test('S5-DIFFERENTIAL: bounded schedules compare notifications, predicate calls, times and resource release', t => {
  let unaryCount = 0, untilCount = 0;
  const words = unaryWords(4);
  assert.equal(words.length, 241);
  const predicates = [() => true, x => x < 2, (_x, index) => { if (index === 1) throw fault; return true; }];
  const configurations = [0, 1, 3].map(count => ({ name: 'skip', make: () => createSkipModel(count), options: { count } }));
  for (const predicate of predicates) {
    for (const inclusive of [false, true]) configurations.push({ name: 'takeWhile', make: () => createTakeWhileModel(inclusive), options: { predicate, inclusive } });
    configurations.push({ name: 'skipWhile', make: createSkipWhileModel, options: { predicate } });
  }
  for (const config of configurations) for (const word of words) for (const ties of [false, true]) {
    unaryCheck(config.name, config.make(), scheduleWord(word, ties), config.options); unaryCount++;
  }
  for (const name of ['takeUntil', 'skipUntil']) for (const word of untilWords(name, 4)) for (const ties of [false, true]) {
    untilCheck(name, scheduleWord(word, ties)); untilCount++;
  }
  assert.equal(unaryCount, 5784);
  assert.equal(untilCount, 994);
  t.diagnostic(`Session 5: ${unaryCount} unary + ${untilCount} notifier = ${unaryCount + untilCount} bounded model/RxJS comparisons.`);
});
