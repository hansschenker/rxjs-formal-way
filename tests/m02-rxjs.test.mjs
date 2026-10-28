import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, Subscription, map, filter, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { createMapModel, createFilterModel } from '../dist/index.js';
import { observeModel, words } from './helpers/value-driver.mjs';

/** Actual RxJS observations, independent of model rules, guards and renderers. */
function observeRxjs(operator, callback, values, ending = 'complete', simultaneous = false) {
  const observations = [];
  const scheduler = new TestScheduler((actual, expected) => assert.deepEqual(actual, expected));
  const stamp = observation => observations.push({ time: scheduler.now(), ...observation });
  const end = simultaneous ? 1 : values.length + 1;
  const source = new Observable(subscriber => {
    stamp({ kind: 'subscribe' });
    const work = new Subscription();
    for (const [index, value] of values.entries()) {
      work.add(scheduler.schedule(() => subscriber.next(value), simultaneous ? 1 : index + 1));
    }
    if (ending !== 'cancel') work.add(scheduler.schedule(() => {
      if (ending === 'error') subscriber.error('source-fault'); else subscriber.complete();
    }, end));
    return () => { work.unsubscribe(); stamp({ kind: 'unsubscribe' }); };
  });
  const subscription = source.pipe(operator((value, index) => {
    stamp({ kind: 'call', value, index });
    return callback(value, index);
  })).subscribe({ next: value => stamp({ kind: 'N', value }), error: error => stamp({ kind: 'E', error }), complete: () => stamp({ kind: 'C' }) });
  if (ending === 'cancel') scheduler.schedule(() => subscription.unsubscribe(), end);
  scheduler.flush();
  assert.equal(subscription.closed, true);
  return observations;
}
const notifications = trace => trace.filter(item => ['N', 'E', 'C'].includes(item.kind));
const outputs = trace => trace.filter(item => item.kind === 'N').map(item => item.value);
const calls = trace => trace.filter(item => item.kind === 'call');

for (const [name, operator, create] of [['MAP', map, createMapModel], ['FILTER', filter, createFilterModel]]) {
  test(`M02-${name}-01: initialization is lazy and empty completion never invokes the callback`, () => {
    let acquired = 0, invoked = 0;
    const result = new Observable(s => { acquired++; s.complete(); }).pipe(operator(() => { invoked++; return true; }));
    assert.equal(acquired, 0); assert.equal(invoked, 0);
    result.subscribe();
    assert.equal(acquired, 1); assert.equal(invoked, 0);
    assert.deepEqual(observeRxjs(operator, () => true, []), [
      { time: 0, kind: 'subscribe' }, { time: 1, kind: 'C' }, { time: 1, kind: 'unsubscribe' },
    ]);
  });
  test(`M02-${name}-02: callback runs once per input with a zero-based index`, () => {
    const callback = name === 'MAP' ? (_value, index) => index : (_value, index) => index % 2 === 1;
    const observed = observeRxjs(operator, callback, [2, 3, 4]);
    assert.deepEqual(calls(observed).map(({ value, index }) => [value, index]), [[2, 0], [3, 1], [4, 2]]);
    assert.deepEqual(outputs(observed), name === 'MAP' ? [0, 1, 2] : [3]);
    assert.deepEqual(observed, observeModel(create(), callback, [2, 3, 4]).observations);
  });
  test(`M02-${name}-03: successful returns preserve the operator's value policy`, () => {
    const marker = { transformed: true }, first = {}, second = {};
    const callback = name === 'MAP' ? () => marker : value => value === second;
    const observed = observeRxjs(operator, callback, [first, second]);
    assert.deepEqual(outputs(observed), name === 'MAP' ? [marker, marker] : [second]);
    assert.equal(outputs(observed)[0], name === 'MAP' ? marker : second);
    assert.deepEqual(observed, observeModel(create(), callback, [first, second]).observations);
  });
  test(`M02-${name}-04: thrown callback values error once, release upstream and stop later calls`, () => {
    for (const error of [undefined, null, new Error('sentinel'), { sentinel: true }]) {
      const callback = (_v, index) => { if (index === 1) throw error; return true; };
      const observed = observeRxjs(operator, callback, ['a', 'b', 'c']);
      assert.deepEqual(calls(observed).map(x => x.index), [0, 1]);
      assert.equal(observed.find(x => x.kind === 'E').error, error);
      assert.equal(observed.some(x => x.kind === 'C'), false);
      assert.deepEqual(observed.at(-1), { time: 2, kind: 'unsubscribe' });
      assert.deepEqual(observed, observeModel(create(), callback, ['a', 'b', 'c']).observations);
    }
  });
  test(`M02-${name}-05: completion is forwarded after values and before finalization`, () => {
    const observed = observeRxjs(operator, () => false, ['a']);
    assert.deepEqual(observed.slice(-2), [{ time: 2, kind: 'C' }, { time: 2, kind: 'unsubscribe' }]);
    assert.deepEqual(outputs(observed), name === 'MAP' ? [false] : []);
    assert.deepEqual(observed, observeModel(create(), () => false, ['a']).observations);
  });
  test(`M02-${name}-06: source errors bypass the callback and release upstream`, () => {
    const observed = observeRxjs(operator, () => true, ['a'], 'error');
    assert.deepEqual(observed.slice(-2), [{ time: 2, kind: 'E', error: 'source-fault' }, { time: 2, kind: 'unsubscribe' }]);
    assert.equal(calls(observed).length, 1);
    assert.deepEqual(observed, observeModel(create(), () => true, ['a'], 'error').observations);
  });
  test(`M02-${name}-07: explicit cancellation releases upstream without completing`, () => {
    const observed = observeRxjs(operator, () => true, ['a'], 'cancel');
    assert.deepEqual(observed.at(-1), { time: 2, kind: 'unsubscribe' });
    assert.equal(notifications(observed).some(n => n.kind !== 'N'), false);
    assert.deepEqual(observed, observeModel(create(), () => true, ['a'], 'cancel').observations);
    const scheduler = new TestScheduler((a, e) => assert.deepEqual(a, e));
    scheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('-a-b-c-d-|');
      const result = source.pipe(operator(() => true));
      expectObservable(result, '----!').toBe('-x-y', { x: name === 'MAP' ? true : 'a', y: name === 'MAP' ? true : 'b' });
      expectSubscriptions(source.subscriptions).toBe('^---!');
    });
  });
  test(`M02-${name}-08: hot input still gives separate subscriptions their own indices`, () => {
    const source = new Subject(); const a = [], b = [], seenA = [], seenB = [];
    const result = source.pipe(operator((value, index) => ({ value, index })));
    // For filter the truthy object must not replace the original value.
    const first = result.subscribe(value => a.push(value));
    source.next('first');
    const second = result.subscribe(value => b.push(value));
    source.next('second'); first.unsubscribe(); second.unsubscribe();
    if (name === 'MAP') {
      assert.deepEqual(a, [{ value: 'first', index: 0 }, { value: 'second', index: 1 }]);
      assert.deepEqual(b, [{ value: 'second', index: 0 }]);
    } else {
      assert.deepEqual(a, ['first', 'second']); assert.deepEqual(b, ['second']);
      // Predicate call indices require instrumentation because they are not forwarded.
      const one = source.pipe(filter((_v, i) => { seenA.push(i); return true; })).subscribe();
      source.next('third');
      const two = source.pipe(filter((_v, i) => { seenB.push(i); return true; })).subscribe();
      source.next('fourth'); one.unsubscribe(); two.unsubscribe();
      assert.deepEqual(seenA, [0, 1]); assert.deepEqual(seenB, [0]);
    }
    source.complete();
  });
  test(`M02-${name}-09: callback failure stops a cooperative synchronous producer`, () => {
    const produced = [], invoked = []; let released = 0, received;
    const error = new Error('stop');
    new Observable(s => {
      for (let value = 0; value < 5 && !s.closed; value++) { produced.push(value); s.next(value); }
      return () => { released++; };
    }).pipe(operator((value, index) => { invoked.push(index); if (value === 1) throw error; return true; }))
      .subscribe({ error: e => { received = e; } });
    assert.deepEqual(produced, [0, 1]); assert.deepEqual(invoked, [0, 1]);
    assert.equal(received, error); assert.equal(released, 1);
  });
}

test('M02-MAP-10: map forwards undefined and Observable values without subscribing to them', () => {
  let innerSubscriptions = 0;
  const inner = new Observable(s => { innerSubscriptions++; s.next('inner'); s.complete(); });
  const observed = observeRxjs(map, (_v, i) => i === 0 ? undefined : inner, ['a', 'b']);
  assert.equal(outputs(observed)[0], undefined);
  assert.equal(outputs(observed)[1], inner); assert.equal(innerSubscriptions, 0);
});
test('M02-FILTER-10: JavaScript truthiness determines forwarding, not strict equality to true', () => {
  const answers = [false, 0, -0, 0n, '', null, undefined, NaN, true, 1, 'yes', {}, []];
  const values = answers.map((_v, i) => ({ i }));
  const observed = observeRxjs(filter, (_value, i) => answers[i], values);
  assert.deepEqual(outputs(observed), values.slice(8));
  assert.deepEqual(calls(observed).map(x => x.index), answers.map((_v, i) => i));
});
test('M02-PIPE-01: filter, map and take keep local indices and cancel the producer', () => {
  const indices = [], values = [], produced = []; let released = 0;
  new Observable(s => {
    for (let value = 0; value < 10 && !s.closed; value++) { produced.push(value); s.next(value); }
    return () => { released++; };
  }).pipe(
    filter((value, index) => { indices.push(['filter', index]); return value % 2 === 1; }),
    map((value, index) => { indices.push(['map', index]); return [value, index]; }), take(2),
  ).subscribe({ next: value => values.push(value), complete: () => values.push('complete') });
  assert.deepEqual(values, [[1, 0], [3, 1], 'complete']);
  assert.deepEqual(produced, [0, 1, 2, 3]); assert.equal(released, 1);
  assert.deepEqual(indices, [['filter', 0], ['filter', 1], ['map', 0], ['filter', 2], ['filter', 3], ['map', 1]]);
});
test('M02-PIPE-02: an upstream map throw prevents the downstream predicate from seeing that value', () => {
  const seen = [], output = []; const error = {};
  new Observable(s => { s.next('a'); s.next('b'); s.next('c'); s.complete(); })
    .pipe(map((value, i) => { if (i === 1) throw error; return value; }), filter(value => { seen.push(value); return true; }))
    .subscribe({ next: value => output.push(value), error: value => output.push(value), complete: () => assert.fail('unexpected completion') });
  assert.deepEqual(seen, ['a']); assert.deepEqual(output, ['a', error]);
});
test('M02-DIFF-01: 1302 bounded comparisons include callback calls, notifications and source lifetimes', () => {
  const profiles = [
    [map, createMapModel, (value, i) => value + i],
    [map, createMapModel, () => undefined],
    [map, createMapModel, (value, i) => { if (i === 1) throw 'callback-fault'; return value; }],
    [filter, createFilterModel, value => value === 1],
    [filter, createFilterModel, (_v, i) => i % 2 === 0],
    [filter, createFilterModel, () => false],
    [filter, createFilterModel, (_v, i) => { if (i === 1) throw 'callback-fault'; return true; }],
  ];
  let comparisons = 0;
  for (const [operator, create, callback] of profiles) {
    for (const values of words([0, 1], 4)) for (const ending of ['complete', 'error', 'cancel']) for (const simultaneous of [false, true]) {
      const actual = observeRxjs(operator, callback, values, ending, simultaneous);
      const predicted = observeModel(create(), callback, values, ending, simultaneous).observations;
      assert.deepEqual(actual, predicted, JSON.stringify({ operator: create().metadata.operator, values, ending, simultaneous }));
      comparisons++;
    }
  }
  assert.equal(comparisons, 1302);
});
