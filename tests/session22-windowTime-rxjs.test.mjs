import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, windowTime, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

// Independent literal observations of installed RxJS 7.8.2. No model imports.
const fixture = (span, interval = null, maxSize = Infinity, auto = true) => {
  const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b));
  const log = [], handles = [], children = new Map(); let source, outer, connections = 0, closes = 0;
  const record = (...items) => log.push([scheduler.frame, ...items]);
  const input = new Observable(s => { source = s; connections++; record('source+'); return () => { closes++; record('source-'); }; });
  const result = input.pipe(windowTime(span, interval, maxSize, scheduler));
  const attach = (name, id) => {
    record(name + '+');
    const sub = handles[id].subscribe({ next: value => record(name, 'N', value),
      error: error => record(name, 'E', error), complete: () => record(name, 'C') });
    sub.add(() => record(name + '-')); children.set(name, sub); return sub;
  };
  const connect = () => {
    outer = result.subscribe({ next: w => {
      const id = handles.length; handles.push(w); record('window', id); if (auto) attach('w' + id, id);
    }, complete: () => record('outerC'), error: error => record('outerE', error) });
    return outer;
  };
  return { scheduler, log, handles, children, result, connect, attach,
    at: (time, f) => scheduler.schedule(f, time), flush: () => scheduler.flush(),
    get source() { return source; }, get outer() { return outer; },
    get connections() { return connections; }, get closes() { return closes; } };
};
const notices = f => f.log.filter(x => x[1] === 'window' || ['N', 'C', 'E'].includes(x[2]) || x[1] === 'outerC' || x[1] === 'outerE');

test('S22 RX windowTime: construction is inert and initial handle precedes source acquisition', () => {
  const f = fixture(4); assert.deepEqual(f.log, []); assert.equal(f.connections, 0);
  f.connect(); assert.deepEqual(f.log, [[0, 'window', 0], [0, 'w0+'], [0, 'source+']]);
  f.outer.unsubscribe(); assert.equal(f.closes, 1); f.children.get('w0').unsubscribe();
});
test('S22 RX windowTime: sequential time closure completes old window before announcing successor', () => {
  const f = fixture(4); f.connect(); f.at(1, () => f.source.next('a')); f.at(5, () => f.source.next('b'));
  f.at(6, () => f.source.complete()); f.flush();
  assert.deepEqual(notices(f), [[0, 'window', 0], [1, 'w0', 'N', 'a'], [4, 'w0', 'C'], [4, 'window', 1],
    [5, 'w1', 'N', 'b'], [6, 'w1', 'C'], [6, 'outerC']]);
});
test('S22 RX windowTime: maxSize closes sequential window immediately and resets its time span', () => {
  const f = fixture(5, null, 2); f.connect(); f.at(1, () => f.source.next('a')); f.at(2, () => f.source.next('b'));
  f.at(8, () => f.source.complete()); f.flush();
  assert.deepEqual(notices(f), [[0, 'window', 0], [1, 'w0', 'N', 'a'], [2, 'w0', 'N', 'b'], [2, 'w0', 'C'],
    [2, 'window', 1], [7, 'w1', 'C'], [7, 'window', 2], [8, 'w2', 'C'], [8, 'outerC']]);
});
test('S22 RX windowTime: overlapping windows receive one opaque value by reference', () => {
  const f = fixture(5, 2), value = { opaque: true }; f.connect();
  f.at(3, () => f.source.next(value)); f.at(4, () => f.source.complete()); f.flush();
  const deliveries = f.log.filter(x => x[2] === 'N');
  assert.deepEqual(deliveries.map(x => [x[0], x[1]]), [[3, 'w0'], [3, 'w1']]);
  assert.ok(deliveries.every(x => x[3] === value));
});
test('S22 RX windowTime: max closure precedes delivery to later overlapping windows', () => {
  const f = fixture(5, 2, 2); f.connect(); f.at(1, () => f.source.next('a'));
  f.at(3, () => f.source.next('b')); f.at(4, () => f.source.complete()); f.flush();
  assert.deepEqual(f.log.filter(x => x[0] === 3), [[3, 'w0', 'N', 'b'], [3, 'w0', 'C'], [3, 'w0-'], [3, 'w1', 'N', 'b']]);
});
test('S22 RX windowTime: periodic size closure does not open an immediate replacement', () => {
  const f = fixture(5, 4, 1); f.connect(); f.at(1, () => f.source.next('a')); f.at(2, () => f.source.next('lost'));
  f.at(5, () => f.source.complete()); f.flush();
  assert.deepEqual(notices(f), [[0, 'window', 0], [1, 'w0', 'N', 'a'], [1, 'w0', 'C'], [4, 'window', 1], [5, 'w1', 'C'], [5, 'outerC']]);
});
test('S22 RX windowTime: time gaps discard source values without buffering', () => {
  const f = fixture(2, 4); f.connect(); f.at(1, () => f.source.next('a')); f.at(3, () => f.source.next('gap'));
  f.at(5, () => f.source.next('b')); f.at(6, () => f.source.complete()); f.flush();
  assert.deepEqual(f.log.filter(x => x[2] === 'N'), [[1, 'w0', 'N', 'a'], [5, 'w1', 'N', 'b']]);
});
test('S22 RX windowTime: periodic equal-time creation precedes the initial close when both were registered at connection', () => {
  const f = fixture(3, 3); f.connect(); f.at(4, () => f.source.complete()); f.flush();
  assert.deepEqual(notices(f).filter(x => x[0] === 3), [[3, 'window', 1], [3, 'w0', 'C']]);
});
test('S22 RX windowTime: same-time source and close order follows scheduler insertion order', () => {
  const f = fixture(3); f.at(3, () => f.source.next('before')); f.connect();
  f.at(3, () => f.source.next('after')); f.at(4, () => f.source.complete()); f.flush();
  assert.deepEqual(notices(f).filter(x => x[0] === 3), [[3, 'w0', 'N', 'before'], [3, 'w0', 'C'], [3, 'window', 1], [3, 'w1', 'N', 'after']]);
});
test('S22 RX windowTime: source completion closes current windows before outer completion', () => {
  const f = fixture(5, 2); f.connect(); f.at(3, () => f.source.complete()); f.flush();
  assert.deepEqual(f.log.filter(x => x[0] === 3), [[3, 'w0', 'C'], [3, 'w0-'], [3, 'w1', 'C'], [3, 'w1-'], [3, 'outerC'], [3, 'source-']]);
  assert.equal(f.closes, 1); assert.equal(f.handles.length, 2);
});
test('S22 RX windowTime: errors reach open children and outer by identity and remain on late handles', () => {
  const f = fixture(3), error = { fault: true }; f.connect(); f.at(4, () => f.source.error(error)); f.flush();
  assert.deepEqual(f.log.filter(x => x[0] === 4), [[4, 'w1', 'E', error], [4, 'w1-'], [4, 'outerE', error], [4, 'source-']]);
  f.log.length = 0; assert.equal(f.attach('old', 0).closed, true); assert.equal(f.attach('failed', 1).closed, true);
  assert.deepEqual(f.log, [[4, 'old+'], [4, 'old', 'C'], [4, 'old-'], [4, 'failed+'], [4, 'failed', 'E', error], [4, 'failed-']]);
});
test('S22 RX windowTime: cancellation closes source and timers but leaves child Subjects uncompleted', () => {
  const f = fixture(5, 2); f.connect(); f.at(3, () => f.outer.unsubscribe()); f.flush();
  assert.equal(f.handles.length, 2); assert.equal(f.source.closed, true); assert.equal(f.closes, 1);
  assert.deepEqual(f.log.filter(x => x[0] === 3), [[3, 'source-']]);
  for (const sub of f.children.values()) assert.equal(sub.closed, false);
  assert.equal(f.attach('orphan', 1).closed, false);
  for (const sub of f.children.values()) sub.unsubscribe();
});
test('S22 RX windowTime: late observers see no replay and child disposal does not close upstream', () => {
  const f = fixture(5, null, Infinity, false); f.connect(); f.source.next('past');
  const a = f.attach('a', 0); f.attach('b', 0); f.source.next('now'); a.unsubscribe(); f.source.next('later');
  assert.deepEqual(f.log.filter(x => x[2] === 'N'), [[0, 'a', 'N', 'now'], [0, 'b', 'N', 'now'], [0, 'b', 'N', 'later']]);
  assert.equal(f.closes, 0); f.source.complete();
});
test('S22 RX windowTime: emitted handles are Observable wrappers without Subject mutation methods', () => {
  const f = fixture(2, 2, Infinity, false); f.connect(); f.at(3, () => f.source.complete()); f.flush();
  assert.equal(f.handles.length, 2);
  for (const handle of f.handles) { assert.equal(handle instanceof Observable, true); assert.equal(handle instanceof Subject, false); assert.equal(handle.next, undefined); }
});
test('S22 RX windowTime: separate result subscriptions have separate source and window ownership', () => {
  const f = fixture(4, null, Infinity, false), a = [], b = [];
  const first = f.result.subscribe(w => a.push(w)), second = f.result.subscribe(w => b.push(w));
  assert.equal(f.connections, 2); assert.notEqual(a[0], b[0]); first.unsubscribe(); assert.equal(second.closed, false);
  second.unsubscribe(); assert.equal(f.closes, 2);
});
test('S22 RX windowTime: synchronous source setup is separately characterized with an initial child attached', () => {
  const scheduler = new TestScheduler(() => {}), log = [];
  new Observable(s => { log.push('source+'); s.next(1); s.complete(); return () => log.push('source-'); })
    .pipe(windowTime(4, scheduler)).subscribe({ next: w => { log.push('window'); w.subscribe({ next: x => log.push(x), complete: () => log.push('childC') }); }, complete: () => log.push('outerC') });
  scheduler.flush(); assert.deepEqual(log, ['window', 'source+', 1, 'childC', 'outerC', 'source-']);
});
test('S22 RX windowTime: zero maxSize normalizes to unbounded and is outside the finite positive model parameter', () => {
  const f = fixture(4, null, 0); f.connect(); f.source.next(1); f.source.next(2);
  assert.equal(f.handles.length, 1); f.source.complete();
  assert.deepEqual(f.log.filter(x => x[2] === 'N'), [[0, 'w0', 'N', 1], [0, 'w0', 'N', 2]]);
});
test('S22 RX windowTime: synchronous outer take(1) prevents further windows while still attempting closed source setup', () => {
  const scheduler = new TestScheduler(() => {}), log = [];
  new Observable(s => { log.push(['source+', s.closed]); return () => log.push('source-'); })
    .pipe(windowTime(4, scheduler), take(1)).subscribe({ next: () => log.push('window'), complete: () => log.push('outerC') });
  scheduler.flush(); assert.deepEqual(log, ['window', 'outerC', ['source+', true], 'source-']);
});
