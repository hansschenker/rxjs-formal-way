import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY, NEVER, Observable, Subject, windowWhen } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

// Literal native expectations: no canonical model or runner is imported.
const fixture = (options = {}) => {
  const { failAt = -1 } = options;
  const error = Object.hasOwn(options, 'error') ? options.error : { opaque: 'failure' };
  const log = [], handles = [], closers = [], consumers = new Map();
  let source, outer, calls = 0, failNext = false;
  const source$ = new Observable(s => { source = s; log.push(['source+', s.closed]); return () => log.push('source-'); });
  const result = source$.pipe(windowWhen(function () {
    const generation = calls++;
    log.push(['factory', generation, arguments.length]);
    if (generation === failAt || failNext) throw error;
    return new Observable(s => { closers[generation] = s; log.push(['closing+', generation]); return () => log.push(['closing-', generation]); });
  }));
  const connect = () => { outer = result.subscribe({
    next: w => { handles.push(w); log.push(['window', handles.length - 1]); },
    error: e => log.push(['outerE', e]), complete: () => log.push('outerC'),
  }); return outer; };
  const attach = (id, windowId = handles.length - 1) => {
    log.push(id + '+');
    const sub = handles[windowId].subscribe({ next: value => log.push([id, 'N', value]),
      error: e => log.push([id, 'E', e]), complete: () => log.push([id, 'C']) });
    sub.add(() => log.push(id + '-')); consumers.set(id, sub); return sub;
  };
  return { log, handles, closers, consumers, result, connect, attach, error,
    failNext: () => { failNext = true; }, get source() { return source; }, get outer() { return outer; }, get calls() { return calls; } };
};

test('S22 RX windowWhen: construction is inert; initial handle, no-argument factory, closer and source acquire in order', () => {
  const f = fixture(); assert.deepEqual(f.log, []); f.connect();
  assert.deepEqual(f.log, [['window', 0], ['factory', 0, 0], ['closing+', 0], ['source+', false]]);
  f.outer.unsubscribe();
});

test('S22 RX windowWhen: closing next unsubscribes old signal before child completion and replacement setup', () => {
  const f = fixture(); f.connect(); f.attach('A'); f.log.length = 0;
  f.closers[0].next({ ignored: true });
  assert.deepEqual(f.log, [['closing-', 0], ['A', 'C'], 'A-', ['window', 1], ['factory', 1, 0], ['closing+', 1]]);
  assert.equal(f.calls, 2); assert.equal(f.source.closed, false); f.outer.unsubscribe();
});

test('S22 RX windowWhen: empty closing completion rotates instead of completing outer', () => {
  const f = fixture(); f.connect(); f.attach('A'); f.log.length = 0; f.closers[0].complete();
  assert.deepEqual(f.log, [['closing-', 0], ['A', 'C'], 'A-', ['window', 1], ['factory', 1, 0], ['closing+', 1]]);
  assert.equal(f.outer.closed, false); f.attach('B'); f.source.next('after');
  assert.deepEqual(f.log.at(-1), ['B', 'N', 'after']); f.outer.unsubscribe(); f.consumers.get('B').unsubscribe();
});

test('S22 RX windowWhen: stale closed signal cannot rotate again or affect the new window', () => {
  const f = fixture(); f.connect(); const old = f.closers[0]; old.next(0); f.log.length = 0;
  old.next(1); old.complete(); old.error('ignored');
  assert.deepEqual(f.log, []); assert.equal(f.handles.length, 2); assert.equal(f.calls, 2); f.outer.unsubscribe();
});

test('S22 RX windowWhen: current-window multicast preserves opaque payload identity with no replay', () => {
  const f = fixture(), payload = Object.freeze({ identity: true }); f.connect(); f.source.next('missed');
  f.attach('A'); f.attach('B'); f.log.length = 0; f.source.next(payload);
  assert.deepEqual(f.log, [['A', 'N', payload], ['B', 'N', payload]]);
  assert.equal(f.log[0][2], payload); assert.equal(f.log[1][2], payload); f.source.complete();
});

test('S22 RX windowWhen: every announced window is an Observable facade rather than a writable Subject', () => {
  const f = fixture(); f.connect(); f.closers[0].next(1);
  for (const w of f.handles) { assert.equal(w instanceof Observable, true); assert.equal(w instanceof Subject, false); assert.equal(w.next, undefined); }
  f.outer.unsubscribe();
});

test('S22 RX windowWhen: source completion ends children and outer before generation-dependent input cleanup', () => {
  for (const generation of [0, 1]) {
    const f = fixture(); f.connect(); if (generation) f.closers[0].next(0);
    f.attach('A'); f.log.length = 0; f.source.complete();
    const cleanup = generation ? ['source-', ['closing-', 1]] : [['closing-', 0], 'source-'];
    assert.deepEqual(f.log, [['A', 'C'], 'A-', 'outerC', ...cleanup]);
    assert.equal(f.handles.length, generation + 1); assert.equal(f.outer.closed, true);
  }
});

test('S22 RX windowWhen: source and closing errors preserve identity and terminate current children before outer', () => {
  for (const origin of ['source', 'closing']) for (const generation of [0, 1]) {
    const f = fixture(); f.connect(); if (generation) f.closers[0].next(0);
    f.attach('A'); f.log.length = 0;
    (origin === 'source' ? f.source : f.closers[generation]).error(f.error);
    const cleanup = generation ? ['source-', ['closing-', 1]] : [['closing-', 0], 'source-'];
    assert.deepEqual(f.log, [['A', 'E', f.error], 'A-', ['outerE', f.error], ...cleanup]);
    f.log.length = 0; assert.equal(f.attach('late').closed, true);
    assert.deepEqual(f.log, ['late+', ['late', 'E', f.error], 'late-']);
    assert.equal(f.log[1][2], f.error);
  }
});

test('S22 RX windowWhen: initial selector throw still attempts source subscription with an already closed subscriber', () => {
  const f = fixture({ failAt: 0, error: undefined }); f.connect();
  assert.deepEqual(f.log, [['window', 0], ['factory', 0, 0], ['outerE', f.error], ['source+', true], 'source-']);
  assert.equal(f.outer.closed, true); assert.equal(f.closers.length, 0);
  f.log.length = 0; assert.equal(f.attach('late').closed, true);
  assert.deepEqual(f.log, ['late+', ['late', 'E', f.error], 'late-']);
});

test('S22 RX windowWhen: replacement selector throw follows old completion and newly announced failed window', () => {
  const f = fixture({ failAt: 1 }); f.connect(); f.attach('A'); f.log.length = 0; f.closers[0].next(0);
  assert.deepEqual(f.log, [['closing-', 0], ['A', 'C'], 'A-', ['window', 1], ['factory', 1, 0], ['outerE', f.error], 'source-']);
  f.log.length = 0; f.attach('old', 0); f.attach('new', 1);
  assert.deepEqual(f.log, ['old+', ['old', 'C'], 'old-', 'new+', ['new', 'E', f.error], 'new-']);
});

test('S22 RX windowWhen: outer cancellation leaves existing and late current-window consumers open and silent', () => {
  for (const generation of [0, 1]) {
    const f = fixture(); f.connect(); if (generation) f.closers[0].next(0);
    const a = f.attach('A'); f.log.length = 0; f.outer.unsubscribe();
    assert.deepEqual(f.log, generation ? ['source-', ['closing-', 1]] : [['closing-', 0], 'source-']);
    assert.equal(a.closed, false); const late = f.attach('late'); assert.equal(late.closed, false);
    f.log.length = 0; f.source.next('ignored'); f.source.complete(); f.closers[generation].next(0);
    assert.deepEqual(f.log, []); a.unsubscribe(); late.unsubscribe(); assert.deepEqual(f.log, ['A-', 'late-']);
  }
});

test('S22 RX windowWhen: old completed windows remain readable after cancellation without replay', () => {
  const f = fixture(); f.connect(); f.source.next('missed'); f.closers[0].next(0); f.outer.unsubscribe();
  f.log.length = 0; assert.equal(f.attach('old', 0).closed, true);
  assert.deepEqual(f.log, ['old+', ['old', 'C'], 'old-']);
});

test('S22 RX windowWhen: child unsubscribe does not close source, closer or another observer', () => {
  const f = fixture(); f.connect(); const a = f.attach('A'); f.attach('B'); f.log.length = 0; a.unsubscribe(); f.source.next(9);
  assert.deepEqual(f.log, ['A-', ['B', 'N', 9]]); assert.equal(f.source.closed, false); assert.equal(f.closers[0].closed, false);
  f.source.complete();
});

test('S22 RX windowWhen: source and closing streams supply equal-time order without adding a scheduler', () => {
  const results = [];
  for (const closerFirst of [false, true]) {
    const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b)), values = [];
    scheduler.run(() => {
      const source = new Subject(), closing = new Subject();
      const outer = source.pipe(windowWhen(() => closing)).subscribe(w => { const id = values.length; values.push([]); w.subscribe(value => values[id].push([scheduler.now(), value])); });
      const value = () => source.next('x'), rotate = () => closing.next(0);
      scheduler.schedule(closerFirst ? rotate : value, 5); scheduler.schedule(closerFirst ? value : rotate, 5);
      scheduler.schedule(() => source.complete(), 6);
      scheduler.flush(); assert.equal(outer.closed, true);
    });
    results.push(values);
  }
  assert.deepEqual(results, [[[[5, 'x']], []], [[], [[5, 'x']]]]);
});

test('S22 RX windowWhen: two result subscriptions create independent factory, source and window lifetimes', () => {
  const producer = new Subject(), valuesA = [], valuesB = [], handles = [], closers = [], children = [];
  let connections = 0, disconnects = 0, calls = 0;
  const result = new Observable(s => { connections++; const sub = producer.subscribe(s); return () => { disconnects++; sub.unsubscribe(); }; })
    .pipe(windowWhen(() => { calls++; const closer = new Subject(); closers.push(closer); return closer; }));
  const a = result.subscribe(w => { handles.push(w); children.push(w.subscribe(x => valuesA.push(x))); });
  const b = result.subscribe(w => { handles.push(w); children.push(w.subscribe(x => valuesB.push(x))); });
  assert.notEqual(handles[0], handles[1]); assert.equal(calls, 2); assert.equal(connections, 2);
  a.unsubscribe(); producer.next('only B'); assert.deepEqual(valuesA, []); assert.deepEqual(valuesB, ['only B']);
  assert.equal(disconnects, 1); b.unsubscribe(); assert.equal(disconnects, 2);
  children.forEach(child => child.unsubscribe());
});

test('S22 RX windowWhen: synchronous source delivery can reach a child attached in initial announcement', () => {
  const log = [];
  new Observable(s => { log.push('source+'); s.next(1); s.complete(); return () => log.push('source-'); })
    .pipe(windowWhen(() => NEVER)).subscribe({ next: w => { log.push('window'); w.subscribe({ next: x => log.push(x), complete: () => log.push('childC') }); }, complete: () => log.push('outerC') });
  assert.deepEqual(log, ['window', 'source+', 1, 'childC', 'outerC', 'source-']);
});

test('S22 RX windowWhen: one synchronous empty closer rotates finitely before source setup, then NEVER stops recursion', () => {
  const log = [], handles = []; let calls = 0;
  const outer = new Observable(() => { log.push('source+'); return () => log.push('source-'); })
    .pipe(windowWhen(() => { log.push(['factory', calls]); return calls++ === 0 ? EMPTY : NEVER; }))
    .subscribe(w => { handles.push(w); log.push(['window', handles.length - 1]); });
  assert.deepEqual(log, [['window', 0], ['factory', 0], ['window', 1], ['factory', 1], 'source+']);
  const old = []; handles[0].subscribe({ complete: () => old.push('C') }); assert.deepEqual(old, ['C']);
  outer.unsubscribe();
});

test('S22 RX windowWhen: TestScheduler confirms delayed empty closers rotate and all upstream lifetimes end with source', () => {
  const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b)), windows = [];
  scheduler.run(({ cold, expectSubscriptions }) => {
    const source = cold('-a-b-c-|'), closer = cold('---|');
    source.pipe(windowWhen(() => closer)).subscribe(w => { const events = []; windows.push(events); w.subscribe({ next: v => events.push([scheduler.now(), v]), complete: () => events.push([scheduler.now(), 'C']) }); });
    expectSubscriptions(source.subscriptions).toBe('^------!');
    expectSubscriptions(closer.subscriptions).toBe(['^--!', '---^--!', '------^!']);
  });
  assert.deepEqual(windows, [[[1, 'a'], [3, 'C']], [[3, 'b'], [5, 'c'], [6, 'C']], [[7, 'C']]]);
});
