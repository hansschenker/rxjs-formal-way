import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, EMPTY, NEVER, of, defer, concat, throwError, scan, take, filter, retry, share } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { createSeededScanModel, createUnseededScanModel } from '../dist/models/scan.js';
import { observeScanModel } from './helpers/scan-driver.mjs';

// Independent observation path: actual RxJS; never calls the reference model.
function observeRxjs({ hasSeed, seed }, reducer, values, ending = 'complete', simultaneous = false) {
  const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b));
  const observations = [];
  let upstream;
  const source = new Observable(subscriber => {
    upstream = subscriber;
    observations.push({ time: scheduler.frame, kind: 'subscribe' });
    return () => observations.push({ time: scheduler.frame, kind: 'unsubscribe' });
  });
  const callback = (accumulator, value, index) => {
    observations.push({ time: scheduler.frame, kind: 'call', accumulator, value, index });
    return reducer(accumulator, value, index);
  };
  const subscription = source.pipe(hasSeed ? scan(callback, seed) : scan(callback)).subscribe({
    next: value => observations.push({ time: scheduler.frame, kind: 'N', value }),
    error: error => observations.push({ time: scheduler.frame, kind: 'E', error }),
    complete: () => observations.push({ time: scheduler.frame, kind: 'C' }),
  });
  values.forEach((value, i) => scheduler.schedule(() => upstream.next(value), simultaneous ? 1 : i + 1));
  scheduler.schedule(() => ending === 'cancel' ? subscription.unsubscribe() : ending === 'error'
    ? upstream.error('source-fault') : upstream.complete(), simultaneous ? 1 : values.length + 1);
  scheduler.flush();
  return observations;
}
const valuesOf = rows => rows.filter(x => x.kind === 'N').map(x => x.value);
const callsOf = rows => rows.filter(x => x.kind === 'call').map(({ accumulator, value, index }) => [accumulator, value, index]);
const collect = observable => {
  const values = []; let terminal = null;
  observable.subscribe({ next: x => values.push(x), error: error => { terminal = { error }; }, complete: () => { terminal = 'complete'; } });
  return { values, terminal };
};

test('M02B-SCAN-01: construction is lazy and subscription emits no seed', () => {
  let subscriptions = 0, calls = 0; const output = [];
  const source = new Observable(() => { subscriptions++; });
  const stream = source.pipe(scan((a, x) => { calls++; return a + x; }, 42));
  assert.equal(subscriptions, 0); assert.equal(calls, 0);
  const subscription = stream.subscribe(x => output.push(x));
  assert.equal(subscriptions, 1); assert.equal(calls, 0); assert.deepEqual(output, []);
  subscription.unsubscribe();
});
test('M02B-SCAN-02: empty sources complete without a seed emission or reducer call', () => {
  let calls = 0; const reducer = () => { calls++; return 9; };
  for (const operator of [scan(reducer), scan(reducer, 0), scan(reducer, undefined)]) {
    assert.deepEqual(collect(EMPTY.pipe(operator)), { values: [], terminal: 'complete' });
  }
  assert.equal(calls, 0);
});
test('M02B-SCAN-03: explicitly supplied undefined seed differs from an omitted seed', () => {
  const calls = []; const reducer = (a, x, i) => { calls.push([a, x, i]); return 'reduced'; };
  assert.deepEqual(collect(of(7).pipe(scan(reducer, undefined))).values, ['reduced']);
  assert.deepEqual(calls, [[undefined, 7, 0]]); calls.length = 0;
  assert.deepEqual(collect(of(7).pipe(scan(reducer))).values, [7]);
  assert.deepEqual(calls, []);
});
test('M02B-SCAN-04: seeded accumulation passes prior result and zero-based source indices', () => {
  const rows = observeRxjs({ hasSeed: true, seed: 0 }, (a, x) => a + x, [1, 2, 3]);
  assert.deepEqual(valuesOf(rows), [1, 3, 6]);
  assert.deepEqual(callsOf(rows), [[0, 1, 0], [1, 2, 1], [3, 3, 2]]);
  assert.deepEqual(rows.slice(-2), [{ time: 4, kind: 'C' }, { time: 4, kind: 'unsubscribe' }]);
});
test('M02B-SCAN-05: unseeded first value bypasses reducer; first reducer index is one', () => {
  const rows = observeRxjs({ hasSeed: false }, (a, x) => a + x, [1, 2, 3]);
  assert.deepEqual(valuesOf(rows), [1, 3, 6]);
  assert.deepEqual(callsOf(rows), [[1, 2, 1], [3, 3, 2]]);
});
test('M02B-SCAN-06: undefined first value is stored rather than treated as missing', () => {
  const input = {}; const calls = [];
  const result = collect(of(undefined, input).pipe(scan((a, x, i) => { calls.push([a, x, i]); return x; })));
  assert.deepEqual(result.values, [undefined, input]);
  assert.deepEqual(calls, [[undefined, input, 1]]);
  assert.equal(result.values[1], input);
});
test('M02B-SCAN-07: repeated identical accumulation references are emitted without suppression', () => {
  const seed = {}; const result = collect(of(1, 2, 3).pipe(scan(a => a, seed)));
  assert.equal(result.values.length, 3);
  assert.ok(result.values.every(x => x === seed));
});
test('M02B-SCAN-08: undefined reducer results remain stored for the next invocation', () => {
  const rows = observeRxjs({ hasSeed: true, seed: 10 }, () => undefined, [1, 2]);
  assert.deepEqual(valuesOf(rows), [undefined, undefined]);
  assert.deepEqual(callsOf(rows), [[10, 1, 0], [undefined, 2, 1]]);
});
test('M02B-SCAN-09: thrown reducer values error once and stop later invocations', () => {
  for (const fault of [undefined, null, new Error('sentinel'), {}]) {
    for (const hasSeed of [false, true]) {
      let calls = 0; const reducer = () => { calls++; throw fault; };
      const rows = observeRxjs({ hasSeed, seed: 0 }, reducer, [1, 2, 3]);
      assert.equal(calls, 1);
      assert.deepEqual(valuesOf(rows), hasSeed ? [] : [1]);
      assert.equal(rows.filter(x => x.kind === 'E').length, 1);
      assert.equal(rows.find(x => x.kind === 'E').error, fault);
      assert.equal(rows.filter(x => x.kind === 'C').length, 0);
      assert.equal(rows.at(-1).kind, 'unsubscribe');
    }
  }
});
test('M02B-SCAN-10: completion adds no final accumulation and releases upstream', () => {
  for (const hasSeed of [false, true]) {
    const rows = observeRxjs({ hasSeed, seed: 0 }, (a, x) => a + x, [1, 2]);
    assert.deepEqual(valuesOf(rows), [1, 3]);
    assert.deepEqual(rows.slice(-2), [{ time: 3, kind: 'C' }, { time: 3, kind: 'unsubscribe' }]);
  }
});
test('M02B-SCAN-11: source errors bypass reducer before or after accumulated values', () => {
  for (const hasSeed of [false, true]) for (const values of [[], [1, 2]]) {
    const rows = observeRxjs({ hasSeed, seed: 0 }, (a, x) => a + x, values, 'error');
    assert.deepEqual(rows.slice(-2), [{ time: values.length + 1, kind: 'E', error: 'source-fault' }, { time: values.length + 1, kind: 'unsubscribe' }]);
    assert.equal(rows.filter(x => x.kind === 'C').length, 0);
    assert.equal(callsOf(rows).length, hasSeed ? values.length : Math.max(0, values.length - 1));
  }
});
test('M02B-SCAN-12: cancellation is silent and releases upstream before and after values', () => {
  for (const hasSeed of [false, true]) for (const values of [[], [1, 2]]) {
    const rows = observeRxjs({ hasSeed, seed: 0 }, (a, x) => a + x, values, 'cancel');
    assert.equal(rows.at(-1).kind, 'unsubscribe');
    assert.equal(rows.filter(x => x.kind === 'C' || x.kind === 'E').length, 0);
    assert.equal(valuesOf(rows).length, values.length);
  }
});
test('M02B-SCAN-13: hot input gives subscriptions separate indices and accumulation bindings', () => {
  const source = new Subject(), calls = [], a = [], b = [];
  const stream = source.pipe(scan((acc, x, index) => { calls.push(index); return acc + x; }, 0));
  const first = stream.subscribe(x => a.push(x)); source.next(1);
  const second = stream.subscribe(x => b.push(x)); source.next(2); source.next(3);
  assert.deepEqual(a, [1, 3, 6]); assert.deepEqual(b, [2, 5]);
  assert.deepEqual(calls, [0, 1, 0, 2, 1]); first.unsubscribe(); second.unsubscribe();
});
test('M02B-SCAN-14: immutable updates preserve a shared seed reference without sharing accumulations', () => {
  const seed = Object.freeze({ total: 0 }); const starts = [];
  const stream = of(1, 2).pipe(scan((a, x, i) => { if (i === 0) starts.push(a); return { total: a.total + x }; }, seed));
  const a = collect(stream).values, b = collect(stream).values;
  assert.ok(starts.every(x => x === seed)); assert.equal(starts.length, 2);
  assert.deepEqual(a, [{ total: 1 }, { total: 3 }]); assert.deepEqual(b, a);
  assert.notEqual(a[0], b[0]); assert.equal(seed.total, 0);
});
test('M02B-SCAN-15: mutable seed aliasing is real, not an automatic per-subscription clone', () => {
  // Runtime characterization of an ownership boundary, outside immutable differential scenarios.
  const seed = { total: 0 };
  const stream = of(1).pipe(scan((a, x) => { a.total += x; return a; }, seed));
  const first = collect(stream).values[0]; assert.equal(first.total, 1);
  const second = collect(stream).values[0]; assert.equal(second.total, 2);
  assert.equal(first, seed); assert.equal(second, seed); assert.equal(first.total, 2);
});
test('M02B-SCAN-16: downstream take stops cooperative synchronous production and accumulation', () => {
  let produced = 0, reduced = 0, released = 0;
  const source = new Observable(s => {
    for (const value of [1, 2, 3, 4]) { if (s.closed) break; produced++; s.next(value); }
    if (!s.closed) s.complete();
    return () => { released++; };
  });
  assert.deepEqual(collect(source.pipe(scan((a, x) => { reduced++; return a + x; }, 0), take(2))).values, [1, 3]);
  assert.equal(produced, 2); assert.equal(reduced, 2); assert.equal(released, 1);
});
test('M02B-SCAN-17: retry recreates upstream scan bookkeeping for a fresh subscription', () => {
  let attempts = 0; const indices = [], fault = {};
  const source = defer(() => { attempts++; return concat(of(1, 2), throwError(() => fault)); });
  const result = collect(source.pipe(scan((a, x, i) => { indices.push(i); return a + x; }, 0), retry(1)));
  assert.deepEqual(result.values, [1, 3, 1, 3]); assert.deepEqual(indices, [0, 1, 0, 1]);
  assert.equal(result.terminal.error, fault); assert.equal(attempts, 2);
});
test('M02B-SCAN-18: share placement determines whether accumulated execution is shared', () => {
  for (const sharedAccumulator of [false, true]) {
    const input = new Subject(); let calls = 0; const a = [], b = [];
    const accumulation = scan((s, x) => { calls++; return s + x; }, 0);
    const result = sharedAccumulator ? input.pipe(accumulation, share()) : input.pipe(share(), accumulation);
    const sa = result.subscribe(x => a.push(x)); input.next(1);
    const sb = result.subscribe(x => b.push(x)); input.next(2);
    assert.deepEqual(a, [1, 3]); assert.deepEqual(b, sharedAccumulator ? [3] : [2]);
    assert.equal(calls, sharedAccumulator ? 2 : 3); sa.unsubscribe(); sb.unsubscribe();
  }
});
test('M02B-SCAN-19: seed type may differ from input and returned accumulation types', () => {
  const seed = { prefix: 's' }, calls = [];
  const output = collect(of(1, 2).pipe(scan((acc, x, i) => {
    calls.push([acc, x, i]); return `${typeof acc === 'object' ? acc.prefix : acc}:${x}`;
  }, seed)));
  assert.deepEqual(output.values, ['s:1', 's:1:2']);
  assert.equal(calls[0][0], seed); assert.equal(calls[1][0], 's:1');
});
test('M02B-SCAN-20: Observable accumulation results are payloads, not inner subscriptions', () => {
  let subscriptions = 0; const inner = new Observable(() => { subscriptions++; });
  const output = collect(of(1, 2).pipe(scan(() => inner, undefined)));
  assert.equal(output.values.length, 2); assert.ok(output.values.every(x => x === inner));
  assert.equal(subscriptions, 0);
});
test('M02B-SCAN-21: never-emitting source does not emit its seed before cancellation', () => {
  const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b));
  scheduler.run(({ expectObservable }) => {
    expectObservable(NEVER.pipe(scan((a, x) => a + x, 10)), '-----!').toBe('');
  });
});
test('M02B-SCAN-22: filter then scan uses local input indices and downstream take cancels', () => {
  const indices = [], passed = [];
  const output = collect(of(1, 2, 3, 4, 5).pipe(
    filter(x => { passed.push(x); return x % 2 === 1; }),
    scan((a, x, i) => { indices.push(i); return a + x; }, 0), take(2),
  ));
  assert.deepEqual(output.values, [1, 4]); assert.deepEqual(indices, [0, 1]); assert.deepEqual(passed, [1, 2, 3]);
});
test('M02B-SCAN-23: 1860 bounded comparisons include reducer arguments, notifications and lifetimes', () => {
  const profiles = [
    { hasSeed: true, seed: 0, reducer: (a, x) => a + x },
    { hasSeed: true, seed: 10, reducer: (a, x) => a - x },
    { hasSeed: false, reducer: (a, x) => a + x },
    { hasSeed: true, seed: 0, reducer: (a, x, i) => a + x + i * 10 },
    { hasSeed: false, reducer: (a, x, i) => a + x + i * 10 },
    { hasSeed: true, seed: undefined, reducer: (a, x, i) => `${String(a)}:${x}:${i}` },
    { hasSeed: true, seed: 0, reducer: () => undefined },
    { hasSeed: false, reducer: () => undefined },
    { hasSeed: true, seed: 0, reducer: (a, x, i) => { if (i === 1) throw 'reducer-fault'; return a + x; } },
    { hasSeed: false, reducer: (a, x, i) => { if (i === 1) throw 'reducer-fault'; return a + x; } },
  ];
  const words = [[]]; let layer = [[]];
  for (let length = 1; length <= 4; length++) { layer = layer.flatMap(prefix => [0, 1].map(x => [...prefix, x])); words.push(...layer); }
  let compared = 0;
  for (const [p, profile] of profiles.entries()) for (const word of words) for (const end of ['complete', 'error', 'cancel']) for (const simultaneous of [false, true]) {
    const model = profile.hasSeed ? createSeededScanModel(profile.seed) : createUnseededScanModel();
    const expected = observeScanModel(model, profile.reducer, word, end, simultaneous).observations;
    const actual = observeRxjs(profile, profile.reducer, word, end, simultaneous);
    assert.deepEqual(actual, expected, JSON.stringify({ p, word, end, simultaneous })); compared++;
  }
  assert.equal(compared, 1860);
});
