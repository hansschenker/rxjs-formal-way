import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, windowCount, mergeMap, map } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

// Independent native RxJS 7.8.2 observations. No canonical model or runner imported.
const fixture = (size, stride) => {
  const producer = new Subject(), log = [], windows = [], consumers = new Map();
  let sourceConnections = 0, sourceCloses = 0;
  const source = new Observable(observer => {
    sourceConnections++; log.push('source+');
    const sub = producer.subscribe(observer);
    return () => { sub.unsubscribe(); sourceCloses++; log.push('source-'); };
  });
  const operator = stride === undefined ? windowCount(size) : windowCount(size, stride);
  const result = source.pipe(operator);
  let outer;
  const connect = () => { outer = result.subscribe({
    next: w => { const id = windows.length; windows.push(w); log.push(['window', id]); },
    error: error => log.push(['outerE', error]),
    complete: () => log.push('outerC'),
  }); return outer; };
  const attach = (name, windowId = windows.length - 1) => {
    log.push(name + '+');
    const sub = windows[windowId].subscribe({
      next: value => log.push([name, 'N', value]),
      error: error => log.push([name, 'E', error]),
      complete: () => log.push([name, 'C']),
    });
    sub.add(() => log.push(name + '-'));
    consumers.set(name, sub); return sub;
  };
  return { log, windows, consumers, producer, result, connect, attach,
    get outer() { return outer; },
    get sourceConnections() { return sourceConnections; },
    get sourceCloses() { return sourceCloses; } };
};

test('S22 RX windowCount: constructing an operator and composed result performs no work', () => {
  const f = fixture(2); assert.deepEqual(f.log, []); assert.equal(f.sourceConnections, 0);
  f.connect(); assert.deepEqual(f.log, [['window', 0], 'source+']);
  assert.equal(f.sourceConnections, 1); f.outer.unsubscribe();
});

test('S22 RX windowCount: initial window handle is available for synchronous child attachment before source subscribes', () => {
  const log = [];
  const source = new Observable(observer => { log.push('source+'); observer.next('first'); observer.complete(); return () => log.push('source-'); });
  source.pipe(windowCount(2)).subscribe({
    next: window => { log.push('window'); window.subscribe({ next: value => log.push(value), complete: () => log.push('innerC') }); },
    complete: () => log.push('outerC'),
  });
  assert.deepEqual(log, ['window', 'source+', 'first', 'innerC', 'outerC', 'source-']);
});

test('S22 RX windowCount: overlap delivers each value to all currently open windows in creation order', () => {
  const f = fixture(3, 1); f.connect(); f.attach('A', 0);
  f.producer.next('a'); f.attach('B', 1);
  f.producer.next('b'); f.attach('C', 2);
  f.log.length = 0; f.producer.next('c');
  assert.deepEqual(f.log, [
    ['A', 'N', 'c'], ['B', 'N', 'c'], ['C', 'N', 'c'],
    ['A', 'C'], 'A-', ['window', 3],
  ]);
  f.producer.complete();
});

test('S22 RX windowCount: contiguous full window completes before successor handle is emitted', () => {
  const f = fixture(2); f.connect(); f.attach('A', 0); f.producer.next('a'); f.log.length = 0;
  f.producer.next('b');
  assert.deepEqual(f.log, [['A', 'N', 'b'], ['A', 'C'], 'A-', ['window', 1]]);
  f.attach('B', 1); f.producer.complete();
  assert.deepEqual(f.log.slice(-4), [['B', 'C'], 'B-', 'outerC', 'source-']);
});

test('S22 RX windowCount: exact multiple creates a final empty window and successful completion closes it', () => {
  const f = fixture(1); f.connect(); f.producer.next('x');
  assert.equal(f.windows.length, 2);
  f.attach('last', 1); f.producer.complete();
  assert.deepEqual(f.log.slice(-4), [['last', 'C'], 'last-', 'outerC', 'source-']);
});

test('S22 RX windowCount: stride greater than size discards values in the gap between windows', () => {
  const f = fixture(2, 3); f.connect(); f.attach('A', 0);
  f.producer.next(1); f.producer.next(2); f.log.length = 0;
  f.producer.next(3);
  assert.deepEqual(f.log, [['window', 1]]);
  f.attach('B', 1); f.producer.next(4); f.producer.complete();
  assert.deepEqual(f.log.filter(x => Array.isArray(x) && x[1] === 'N'), [['B', 'N', 4]]);
});

test('S22 RX windowCount: source values are opaque and forwarded by identity, never copied into an array', () => {
  const f = fixture(3), payload = { nested: { id: 9 } }; f.connect();
  f.producer.next('not replayed'); f.attach('A', 0); f.attach('B', 0);
  f.producer.next(payload);
  for (const id of ['A', 'B']) {
    const event = f.log.find(x => Array.isArray(x) && x[0] === id && x[1] === 'N');
    assert.equal(event[2], payload);
  }
  f.producer.complete();
});

test('S22 RX windowCount: child unsubscribe affects neither source nor other window observers', () => {
  const f = fixture(3); f.connect(); const a = f.attach('A', 0); f.attach('B', 0);
  f.log.length = 0; a.unsubscribe(); f.producer.next(7);
  assert.deepEqual(f.log, ['A-', ['B', 'N', 7]]);
  assert.equal(f.sourceCloses, 0); f.producer.complete();
});

test('S22 RX windowCount: source completion closes active windows first and outer result second', () => {
  const f = fixture(3, 1); f.connect(); f.attach('A', 0); f.producer.next(1); f.attach('B', 1);
  f.log.length = 0; f.producer.complete();
  assert.deepEqual(f.log, [['A', 'C'], 'A-', ['B', 'C'], 'B-', 'outerC', 'source-']);
  assert.equal(f.sourceConnections, 1); assert.equal(f.sourceCloses, 1);
});

test('S22 RX windowCount: source error preserves object identity across all live windows and late subscribers', () => {
  const f = fixture(3, 1), err = { opaque: true }; f.connect(); f.attach('A', 0);
  f.producer.next(1); f.attach('B', 1); f.log.length = 0; f.producer.error(err);
  assert.deepEqual(f.log, [
    ['A', 'E', err], 'A-', ['B', 'E', err], 'B-', ['outerE', err], 'source-',
  ]);
  f.log.length = 0; assert.equal(f.attach('late', 1).closed, true);
  assert.deepEqual(f.log, ['late+', ['late', 'E', err], 'late-']);
});

test('S22 RX windowCount: previously closed windows remember completion when the source later errors', () => {
  const f = fixture(1), err = {}; f.connect(); f.producer.next(1);
  f.producer.error(err); f.log.length = 0;
  assert.equal(f.attach('old', 0).closed, true);
  assert.equal(f.attach('new', 1).closed, true);
  assert.deepEqual(f.log, ['old+', ['old', 'C'], 'old-', 'new+', ['new', 'E', err], 'new-']);
});

test('S22 RX windowCount: outer cancellation silently disconnects source but does not terminate child Subjects', () => {
  const f = fixture(3); f.connect(); const a = f.attach('A', 0); f.log.length = 0;
  f.outer.unsubscribe();
  assert.deepEqual(f.log, ['source-']); assert.equal(a.closed, false);
  f.producer.next('ignored'); f.producer.complete();
  assert.deepEqual(f.log, ['source-']);
  const late = f.attach('late', 0); assert.equal(late.closed, false);
  a.unsubscribe(); late.unsubscribe(); assert.deepEqual(f.log, ['source-', 'late+', 'A-', 'late-']);
});

test('S22 RX windowCount: completed windows complete late child subscriptions without replay', () => {
  const f = fixture(2); f.connect(); f.producer.next(1); f.producer.next(2);
  f.log.length = 0; const old = f.attach('old', 0);
  assert.equal(old.closed, true); assert.deepEqual(f.log, ['old+', ['old', 'C'], 'old-']);
  f.producer.complete(); f.log.length = 0; const last = f.attach('last', 1);
  assert.equal(last.closed, true); assert.deepEqual(f.log, ['last+', ['last', 'C'], 'last-']);
});

test('S22 RX windowCount: two result subscribers acquire independent sources and window ownership', () => {
  const f = fixture(2), a = [], b = [];
  const sa = f.result.subscribe(w => a.push(w)), sb = f.result.subscribe(w => b.push(w));
  assert.equal(f.sourceConnections, 2); assert.notEqual(a[0], b[0]);
  const values = []; b[0].subscribe(x => values.push(x)); sa.unsubscribe();
  f.producer.next('live'); assert.deepEqual(values, ['live']);
  assert.equal(f.sourceCloses, 1); sb.unsubscribe(); assert.equal(f.sourceCloses, 2);
});

test('S22 RX windowCount: TestScheduler confirms overlapping windows and subscription lifetime', () => {
  const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b));
  const collected = [], windows = [];
  scheduler.run(({ cold, expectSubscriptions }) => {
    const source = cold('-a-b-c-|');
    source.pipe(windowCount(3, 1)).subscribe(w => {
      const id = windows.length; windows.push(w); collected[id] = [];
      w.subscribe(x => collected[id].push(x));
    });
    expectSubscriptions(source.subscriptions).toBe('^------!');
  });
  assert.deepEqual(collected, [['a', 'b', 'c'], ['b', 'c'], ['c'], []]);
});

test('S22 RX windowCount: TestScheduler confirms gapped windows and final empty handle', () => {
  const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b));
  const collected = [];
  scheduler.run(({ cold, expectSubscriptions }) => {
    const source = cold('-a-b-c-|');
    source.pipe(windowCount(2, 3)).subscribe(w => {
      const id = collected.length; collected[id] = [];
      w.subscribe(x => collected[id].push(x));
    });
    expectSubscriptions(source.subscriptions).toBe('^------!');
  });
  assert.deepEqual(collected, [['a', 'b'], []]);
});
