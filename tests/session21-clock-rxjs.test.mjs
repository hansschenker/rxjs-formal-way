import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, EMPTY, NEVER, of } from 'rxjs';
import { timeInterval, timestamp, map, take } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

// Native fixtures have literal expectations and import no canonical model.
const operatorFor = (operator, provider) => operator === 'timeInterval' ? timeInterval(provider) : timestamp(provider);
const observer = log => ({ next: value => log.push(['N', value]), error: error => log.push(['E', error]), complete: () => log.push(['C']) });
const notes = log => log.filter(x => Array.isArray(x) && ['N', 'E', 'C'].includes(x[0]));
const input = log => {
  const subject = new Subject();
  const source$ = new Observable(subscriber => {
    log.push('source+'); const sub = subject.subscribe(subscriber);
    return () => { sub.unsubscribe(); log.push('source-'); };
  });
  return { subject, source$ };
};
function clock(log, outcomes) {
  let count = 0;
  return { now() { const i = count++, value = outcomes[i]; log.push(['read', i]);
    if (value && typeof value === 'object' && 'throw' in value) throw value.throw;
    assert.equal(typeof value, 'number', 'fixture must supply a reading'); return value;
  }, schedule() { assert.fail('clock decoration must not schedule'); }, calls: () => count };
}

test('S21 CLOCK RX timeInterval: baseline precedes source acquisition and each interval uses the preceding read', () => {
  const log = [], value = {}, provider = clock(log, [10, 12.5, -1, -1]), { source$, subject } = input(log);
  const result$ = source$.pipe(timeInterval(provider)); assert.deepEqual(log, []);
  result$.subscribe(observer(log)); assert.deepEqual(log, [['read', 0], 'source+']);
  subject.next(value); subject.next(value); subject.next(undefined); subject.complete();
  assert.deepEqual(notes(log).map(n => n[0] === 'N' ? ['N', n[1].value, n[1].interval] : n), [['N', value, 2.5], ['N', value, -13.5], ['N', undefined, 0], ['C']]);
  assert.equal(notes(log)[0][1].value, value); assert.notEqual(notes(log)[0][1], notes(log)[1][1]);
  assert.deepEqual(log.slice(-2), [['C'], 'source-']); assert.equal(provider.calls(), 4);
});
test('S21 CLOCK RX timeInterval: emitted wrappers retain the native TimeInterval prototype', () => {
  const values = []; of('A', 'A').pipe(timeInterval({ now: () => 4 })).subscribe(v => values.push(v));
  assert.equal(Object.getPrototypeOf(values[0]).constructor.name, 'TimeInterval');
  assert.notEqual(Object.getPrototypeOf(values[0]), Object.prototype);
  assert.equal(Object.getPrototypeOf(values[0]), Object.getPrototypeOf(values[1]));
  assert.deepEqual({ ...values[0] }, { value: 'A', interval: 0 }); assert.notEqual(values[0], values[1]);
});
test('S21 CLOCK RX timestamp: reads only at next, uses the exact provider reading and emits fresh plain records', () => {
  const log = [], value = {}, provider = clock(log, [5, -2.25]), { source$, subject } = input(log);
  const result$ = source$.pipe(timestamp(provider)); assert.deepEqual(log, []);
  result$.subscribe(observer(log)); assert.deepEqual(log, ['source+']);
  subject.next(value); subject.next(value); subject.complete();
  assert.deepEqual(log, ['source+', ['read', 0], ['N', { value, timestamp: 5 }], ['read', 1], ['N', { value, timestamp: -2.25 }], ['C'], 'source-']);
  assert.equal(notes(log)[0][1].value, value); assert.notEqual(notes(log)[0][1], notes(log)[1][1]);
  assert.equal(Object.getPrototypeOf(notes(log)[0][1]), Object.prototype); assert.equal(provider.calls(), 2);
});
test('S21 CLOCK RX timeInterval: failed initial reading errors before any producer acquisition', () => {
  const log = [], fault = {}, provider = clock(log, [{ throw: fault }]), { source$ } = input(log);
  const sub = source$.pipe(timeInterval(provider)).subscribe(observer(log));
  assert.deepEqual(log, [['read', 0], ['E', fault]]); assert.equal(notes(log)[0][1], fault); assert.equal(sub.closed, true);
});
for (const operator of ['timeInterval', 'timestamp']) {
  test(`S21 CLOCK RX ${operator}: provider throw replaces a pending value and tears down exactly once`, () => {
    const log = [], fault = {}, provider = clock(log, operator === 'timeInterval' ? [10, { throw: fault }] : [{ throw: fault }]), { source$, subject } = input(log);
    const sub = source$.pipe(operatorFor(operator, provider)).subscribe(observer(log));
    subject.next('lost'); subject.next('ignored'); sub.unsubscribe();
    assert.deepEqual(notes(log), [['E', fault]]); assert.equal(notes(log)[0][1], fault);
    assert.deepEqual(log.slice(-2), [['E', fault], 'source-']); assert.equal(log.filter(x => x === 'source-').length, 1);
    assert.equal(provider.calls(), operator === 'timeInterval' ? 2 : 1);
  });
  test(`S21 CLOCK RX ${operator}: empty and never sources do not request per-value readings`, () => {
    const log = [], provider = clock(log, operator === 'timeInterval' ? [10, 20] : []);
    EMPTY.pipe(operatorFor(operator, provider)).subscribe(observer(log));
    const sub = NEVER.pipe(operatorFor(operator, provider)).subscribe(observer(log)); sub.unsubscribe();
    assert.deepEqual(notes(log), [['C']]); assert.equal(provider.calls(), operator === 'timeInterval' ? 2 : 0);
  });
  test(`S21 CLOCK RX ${operator}: source failure preserves its error and does not read time`, () => {
    const log = [], fault = {}, provider = clock(log, operator === 'timeInterval' ? [10] : []), { source$, subject } = input(log);
    source$.pipe(operatorFor(operator, provider)).subscribe(observer(log)); subject.error(fault);
    assert.deepEqual(log.slice(-2), [['E', fault], 'source-']); assert.equal(notes(log)[0][1], fault);
    assert.equal(provider.calls(), operator === 'timeInterval' ? 1 : 0);
  });
  test(`S21 CLOCK RX ${operator}: explicit cancellation is silent and stops subsequent reads`, () => {
    const log = [], provider = clock(log, operator === 'timeInterval' ? [10] : []), { source$, subject } = input(log);
    const sub = source$.pipe(operatorFor(operator, provider)).subscribe(observer(log)); sub.unsubscribe(); subject.next('late'); subject.complete();
    assert.deepEqual(notes(log), []); assert.equal(log.at(-1), 'source-'); assert.equal(provider.calls(), operator === 'timeInterval' ? 1 : 0);
  });
  test(`S21 CLOCK RX ${operator}: literal virtual-time values and connection lifetime`, () => {
    const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b));
    scheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const source = hot('---a--b---c--|');
      const provider = { now: () => scheduler.now(), schedule: () => assert.fail('unexpected scheduling') };
      const result = source.pipe(operatorFor(operator, provider), map(x => operator === 'timeInterval' ? x.interval : x.timestamp));
      expectObservable(result, '^-------!').toBe('---x--y-', operator === 'timeInterval' ? { x: 3, y: 3 } : { x: 3, y: 6 });
      expectSubscriptions(source.subscriptions).toBe('^-------!');
    });
  });
  test(`S21 CLOCK RX ${operator}: synchronous source respects downstream cancellation (setup characterization)`, () => {
    const produced = [], values = []; let reads = 0;
    const source = new Observable(s => { for (let i = 0; !s.closed && i < 5; i++) { produced.push(i); s.next(i); } });
    source.pipe(operatorFor(operator, { now: () => ++reads }), take(2)).subscribe(value => values.push(value));
    assert.deepEqual(produced, [0, 1]); assert.equal(values.length, 2); assert.equal(reads, operator === 'timeInterval' ? 3 : 2);
  });
}
test('S21 CLOCK RX: two connections to one live source own independent interval baselines', () => {
  const subject = new Subject(), first = [], second = [], value = {}; let now = 10;
  const provider = { now: () => now };
  subject.pipe(timeInterval(provider)).subscribe(v => first.push(v)); now = 12; subject.next('A');
  now = 14; subject.pipe(timeInterval(provider)).subscribe(v => second.push(v)); now = 17; subject.next(value);
  assert.deepEqual(first.map(v => v.interval), [2, 5]); assert.deepEqual(second.map(v => v.interval), [3]);
  assert.equal(first[1].value, value); assert.equal(second[0].value, value); assert.notEqual(first[1], second[0]);
  subject.complete();
});
