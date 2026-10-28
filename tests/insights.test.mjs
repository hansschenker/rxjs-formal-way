import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMPTY, NEVER, Observable, ReplaySubject, Subject, defer, expand, filter,
  finalize, map, of, reduce, repeat, retry, scan, share, shareReplay, take,
  throwError,
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

// Independent, literal expectations against RxJS 7.8.2, not a replacement runtime.
const collect = (source) => {
  const events = [];
  const subscription = source.subscribe({
    next: (value) => events.push(['N', value]),
    error: (error) => events.push(['E', error]),
    complete: () => events.push(['C']),
  });
  return { events, subscription };
};
const scheduler = () => new TestScheduler((actual, expected) => assert.deepEqual(actual, expected));

test('EXP-01: saturation delays expand output as well as projection', () => {
  const source = new Subject();
  const child = new Subject();
  const projected = [];
  const result = collect(source.pipe(expand((value) => {
    projected.push(value);
    return value === 1 ? child : EMPTY;
  }, 1)));
  source.next(1);
  child.next(2);
  assert.deepEqual(result.events, [['N', 1]]);
  assert.deepEqual(projected, [1]);
  child.complete();
  assert.deepEqual(result.events, [['N', 1], ['N', 2]]);
  assert.deepEqual(projected, [1, 2]);
  source.complete();
  assert.deepEqual(result.events, [['N', 1], ['N', 2], ['C']]);
});

test('EXP-02: outer values also wait behind the concurrency gate', () => {
  const source = new Subject();
  const child = new Subject();
  const result = collect(source.pipe(expand((value) => value === 1 ? child : EMPTY, 1)));
  source.next(1);
  source.next(3);
  assert.deepEqual(result.events, [['N', 1]]);
  child.complete();
  source.complete();
  assert.deepEqual(result.events, [['N', 1], ['N', 3], ['C']]);
});

test('EXP-03: cancellation releases inners and discards pending output without completion', () => {
  const source = new Subject();
  const child = new Subject();
  let released = 0;
  const result = collect(source.pipe(expand((value) =>
    value === 1 ? child.pipe(finalize(() => released++)) : EMPTY, 1)));
  source.next(1);
  child.next(2);
  result.subscription.unsubscribe();
  child.complete();
  assert.deepEqual(result.events, [['N', 1]]);
  assert.equal(released, 1);
  assert.equal(source.observed, false);
  assert.equal(child.observed, false);
});

test('EXP-04: synchronous unbounded expansion is not a universal FIFO feedback loop', () => {
  const project = (value) => value === 1 ? of(2, 3) : value === 2 ? of(4) : EMPTY;
  assert.deepEqual(collect(of(1).pipe(expand(project))).events,
    [['N', 1], ['N', 2], ['N', 4], ['N', 3], ['C']]);
  assert.deepEqual(collect(of(1).pipe(expand(project, 1))).events,
    [['N', 1], ['N', 2], ['N', 3], ['N', 4], ['C']]);
});

test('EXP-05: outer completion waits for active work and queued values', () => {
  const source = new Subject();
  const child = new Subject();
  const result = collect(source.pipe(expand((value) => value === 1 ? child : EMPTY, 1)));
  source.next(1);
  child.next(2);
  source.complete();
  assert.equal(result.subscription.closed, false);
  assert.deepEqual(result.events, [['N', 1]]);
  child.complete();
  assert.deepEqual(result.events, [['N', 1], ['N', 2], ['C']]);
});

test('EXP-06: a projection throw is a downstream error, with teardown', () => {
  const source = new Subject();
  const boom = new Error('projection');
  const result = collect(source.pipe(expand(() => { throw boom; })));
  source.next(1);
  assert.deepEqual(result.events, [['N', 1], ['E', boom]]);
  assert.equal(source.observed, false);
});

test('RET-01: retry(2) permits three attempts in total', () => {
  let attempts = 0;
  const boom = new Error('retry');
  const result = collect(defer(() => {
    attempts++;
    return throwError(() => boom);
  }).pipe(retry(2)));
  assert.equal(attempts, 3);
  assert.deepEqual(result.events, [['E', boom]]);
});

test('REP-01: repeat(2) performs two subscriptions in total, not three', () => {
  let attempts = 0;
  const result = collect(defer(() => of(++attempts)).pipe(repeat(2)));
  assert.equal(attempts, 2);
  assert.deepEqual(result.events, [['N', 1], ['N', 2], ['C']]);
});

test('REP-02: repeat(0) completes without subscribing to the source', () => {
  let attempts = 0;
  const result = collect(defer(() => { attempts++; return of(1); }).pipe(repeat(0)));
  assert.equal(attempts, 0);
  assert.deepEqual(result.events, [['C']]);
});

test('RET-02: retry(0) still makes the initial attempt', () => {
  let attempts = 0;
  const boom = new Error('initial attempt');
  const result = collect(defer(() => {
    attempts++;
    return throwError(() => boom);
  }).pipe(retry(0)));
  assert.equal(attempts, 1);
  assert.deepEqual(result.events, [['E', boom]]);
});

test('RET-03: a real retry re-executes the producer and resets upstream scan state', () => {
  let attempts = 0;
  const source = new Observable((subscriber) => {
    attempts++;
    subscriber.next(1);
    subscriber.next(2);
    if (attempts === 1) subscriber.error(new Error('again'));
    else subscriber.complete();
  });
  const result = collect(source.pipe(scan((sum, value) => sum + value, 0), retry(1)));
  assert.equal(attempts, 2);
  assert.deepEqual(result.events, [['N', 1], ['N', 3], ['N', 1], ['N', 3], ['C']]);
});

test('SHR-01: default share resets on error, so upstream scan is recreated on retry', () => {
  let attempts = 0;
  const source = new Observable((subscriber) => {
    attempts++;
    subscriber.next(1);
    if (attempts === 1) subscriber.error(new Error('again'));
    else subscriber.complete();
  });
  const result = collect(source.pipe(scan((sum, value) => sum + value, 0), share(), retry(1)));
  assert.equal(attempts, 2);
  assert.deepEqual(result.events, [['N', 1], ['N', 1], ['C']]);
});

test('SHR-02: resetOnError false does not restart a failed shared producer', () => {
  let attempts = 0;
  const boom = new Error('cached');
  const source = new Observable((subscriber) => {
    attempts++;
    subscriber.next(1);
    subscriber.error(boom);
  });
  const result = collect(source.pipe(share({ resetOnError: false }), retry(1)));
  assert.equal(attempts, 1);
  assert.deepEqual(result.events, [['N', 1], ['E', boom]]);
});

test('SUB-01: ReplaySubject(0) replays one value; it is not Subject', () => {
  const replay = new ReplaySubject(0);
  replay.next(1);
  replay.next(2);
  replay.complete();
  assert.deepEqual(collect(replay).events, [['N', 2], ['C']]);
  const subject = new Subject();
  subject.next(2);
  subject.complete();
  assert.deepEqual(collect(subject).events, [['C']]);
});

test('SUB-02: replay time-window expiry still applies after completion', () => {
  let now = 0;
  const replay = new ReplaySubject(2, 10, { now: () => now });
  replay.next('a');
  now = 5;
  replay.next('b');
  replay.complete();
  now = 10;
  assert.deepEqual(collect(replay).events, [['N', 'b'], ['C']]);
  now = 15;
  assert.deepEqual(collect(replay).events, [['C']]);
});

test('SUB-03: Subject delivery is reentrant, not implicitly queued', () => {
  const source = new Subject();
  const seen = [];
  const first = source.subscribe((value) => {
    seen.push(['A', value]);
    if (value === 1) source.next(2);
  });
  const second = source.subscribe((value) => seen.push(['B', value]));
  source.next(1);
  assert.deepEqual(seen, [['A', 1], ['A', 2], ['B', 2], ['B', 1]]);
  first.unsubscribe();
  second.unsubscribe();
});

test('SR-01: refCount true disconnects an active source and discards its replay buffer', () => {
  const upstream = new Subject();
  let connections = 0;
  let releases = 0;
  const shared = defer(() => {
    connections++;
    return upstream.pipe(finalize(() => releases++));
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  const first = collect(shared);
  upstream.next(1);
  first.subscription.unsubscribe();
  assert.equal(releases, 1);
  const second = collect(shared);
  assert.equal(connections, 2);
  assert.deepEqual(second.events, []);
  second.subscription.unsubscribe();
  assert.equal(releases, 2);
});

test('SR-02: refCount false retains an active source with no subscribers', () => {
  const upstream = new Subject();
  let connections = 0;
  let releases = 0;
  const shared = defer(() => {
    connections++;
    return upstream.pipe(finalize(() => releases++));
  }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
  const first = collect(shared);
  upstream.next(1);
  first.subscription.unsubscribe();
  upstream.next(2);
  const second = collect(shared);
  assert.equal(connections, 1);
  assert.equal(releases, 0);
  assert.deepEqual(second.events, [['N', 2]]);
  second.subscription.unsubscribe();
  upstream.complete();
  assert.equal(releases, 1);
});

test('SR-03: completed shareReplay retains buffered output without reconnecting', () => {
  let connections = 0;
  const shared = defer(() => { connections++; return of(1); })
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));
  assert.deepEqual(collect(shared).events, [['N', 1], ['C']]);
  assert.deepEqual(collect(shared).events, [['N', 1], ['C']]);
  assert.equal(connections, 1);
});

test('SR-04: shareReplay resets after an error and reconnects for a later subscriber', () => {
  let connections = 0;
  const boom = new Error('first connection');
  const shared = defer(() => ++connections === 1 ? throwError(() => boom) : of(2))
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));
  assert.deepEqual(collect(shared).events, [['E', boom]]);
  assert.deepEqual(collect(shared).events, [['N', 2], ['C']]);
  assert.equal(connections, 2);
});

test('TAK-01: take(0) initializes as complete without any source subscription', () => {
  let starts = 0;
  const result = collect(defer(() => { starts++; return NEVER; }).pipe(take(0)));
  assert.equal(starts, 0);
  assert.deepEqual(result.events, [['C']]);
});

test('TAK-02: take(1) stops a cooperative synchronous producer before its second value', () => {
  const produced = [];
  let released = 0;
  const source = new Observable((subscriber) => {
    for (const value of [1, 2, 3]) {
      if (subscriber.closed) break;
      produced.push(value);
      subscriber.next(value);
    }
    return () => released++;
  });
  assert.deepEqual(collect(source.pipe(take(1))).events, [['N', 1], ['C']]);
  assert.deepEqual(produced, [1]);
  assert.equal(released, 1);
});

test('MAP-01: thrown projections reach the error channel and stop synchronous work', () => {
  const boom = new Error('map');
  let calls = 0;
  const result = collect(of(1, 2).pipe(map(() => { calls++; throw boom; })));
  assert.equal(calls, 1);
  assert.deepEqual(result.events, [['E', boom]]);
});

test('MAP-02: callback indices belong in a full map operator model', () => {
  assert.deepEqual(collect(of('a', 'b').pipe(map((value, index) => [value, index]))).events,
    [['N', ['a', 0]], ['N', ['b', 1]], ['C']]);
});

test('CAS-01: filter then take preserves output order and the source lifetime', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('-a-b-c-d-|', { a: 3, b: 4, c: 6, d: 8 });
    expectObservable(source.pipe(filter((value) => value % 2 === 0), take(2)))
      .toBe('---b-(c|)', { b: 4, c: 6 });
    expectSubscriptions(source.subscriptions).toBe('^----!');
  });
});

test('CAS-02: values alone do not justify callback-index-sensitive fusion', () => {
  const source = of(10, 20, 30);
  const separate = collect(source.pipe(filter((value) => value >= 20), filter((_, index) => index === 0)));
  const naiveFusion = collect(source.pipe(filter((value, index) => value >= 20 && index === 0)));
  assert.deepEqual(separate.events, [['N', 20], ['C']]);
  assert.deepEqual(naiveFusion.events, [['C']]);
});

test('CAR-01: seeded reduce emits once on successful completion, including an empty source', () => {
  assert.deepEqual(collect(EMPTY.pipe(reduce((sum, value) => sum + value, 0))).events,
    [['N', 0], ['C']]);
});

test('CAR-02: seeded reduce emits no accumulated value on error', () => {
  const boom = new Error('reduce');
  assert.deepEqual(collect(throwError(() => boom).pipe(reduce((sum, value) => sum + value, 0))).events,
    [['E', boom]]);
});

test('CAR-03: seeded reduce emits nothing when cancelled before completion', () => {
  const result = collect(NEVER.pipe(reduce((sum, value) => sum + value, 0)));
  result.subscription.unsubscribe();
  assert.deepEqual(result.events, []);
});
