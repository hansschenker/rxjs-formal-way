import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, TimeoutError, of, NEVER, EMPTY } from 'rxjs';
import { timeout, timeoutWith, concatWith, take } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

// Independent literal expectations. This file deliberately imports no canonical model.
function fixture({ config = { each: 4 }, alias, values = [], ending, factory = 'return', fault = {},
  fallback = [[1, 'N', 'R'], [2, 'C']], start = 0, stop = 20 } = {}) {
  const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b));
  const log = [], infos = []; let generation = 0, connection;
  const write = (...entry) => log.push([scheduler.frame, ...entry]);
  const supplied = {
    now: () => scheduler.now(),
    schedule(work, delay = 0, state) {
      const g = generation++; write('timer.schedule', g, delay);
      const action = scheduler.schedule(function (value) { write('timer.fire', g); work.call(this, value); }, delay, state);
      const original = action.unsubscribe.bind(action); let recorded = false;
      action.unsubscribe = () => { if (!recorded) { recorded = true; write('timer.cancel', g); } original(); };
      return action;
    },
  };
  const subject = new Subject();
  const source = new Observable(sink => {
    write('source.subscribe'); const inner = subject.subscribe(sink);
    return () => { inner.unsubscribe(); write('source.unsubscribe'); };
  });
  const replacement = new Observable(sink => {
    write('fallback.subscribe');
    const tasks = fallback.map(([delay, kind, value]) => scheduler.schedule(() => {
      if (kind === 'N') sink.next(value); else if (kind === 'E') sink.error(value); else sink.complete();
    }, delay));
    return () => { tasks.forEach(t => t.unsubscribe()); write('fallback.unsubscribe'); };
  });
  const withFactory = info => { infos.push(info); write('factory', info); if (factory === 'throw') throw fault; return replacement; };
  scheduler.schedule(() => {
    const operator = alias !== undefined ? timeoutWith(alias, replacement, supplied)
      : timeout({ ...config, scheduler: supplied, ...(factory === 'default' ? {} : { with: withFactory }) });
    connection = source.pipe(operator).subscribe({ next: value => write('next', value), error: error => write('error', error), complete: () => write('complete') });
  }, start);
  for (const [time, value] of values) scheduler.schedule(() => subject.next(value), time);
  if (ending) scheduler.schedule(() => {
    if (ending[1] === 'C') subject.complete(); else if (ending[1] === 'E') subject.error(ending[2]); else connection.unsubscribe();
  }, ending[0]);
  scheduler.schedule(() => connection?.unsubscribe(), stop); scheduler.flush();
  return { log, infos, notifications: log.filter(e => ['next', 'error', 'complete'].includes(e[1])) };
}

test('S21 RX timeout: source acquisition precedes initial watchdog and missing first value switches after source teardown', () => {
  const { log, infos } = fixture({ config: { each: 4 } });
  assert.deepEqual(log, [
    [0, 'source.subscribe'], [0, 'timer.schedule', 0, 4], [4, 'timer.fire', 0],
    [4, 'source.unsubscribe'], [4, 'timer.cancel', 0], [4, 'factory', { meta: null, seen: 0, lastValue: null }],
    [4, 'fallback.subscribe'], [5, 'next', 'R'], [6, 'complete'], [6, 'fallback.unsubscribe'],
  ]);
  assert.equal(infos.length, 1);
});
test('S21 RX timeout: each cancels before value delivery and resets from every source value', () => {
  const a = {}, b = {}; const { log, notifications } = fixture({ config: { each: 4 }, values: [[1, a], [3, b]] });
  assert.deepEqual(notifications, [[1, 'next', a], [3, 'next', b], [8, 'next', 'R'], [9, 'complete']]);
  assert.equal(notifications[0][2], a); assert.equal(notifications[1][2], b);
  assert.deepEqual(log.filter(e => e[0] === 1), [[1, 'timer.cancel', 0], [1, 'next', a], [1, 'timer.schedule', 1, 4]]);
  assert.deepEqual(log.filter(e => e[0] === 3), [[3, 'timer.cancel', 1], [3, 'next', b], [3, 'timer.schedule', 2, 4]]);
});
test('S21 RX timeout: first-only deadline disappears after one value and long later silence does not time out', () => {
  const { log, notifications } = fixture({ config: { first: 4 }, values: [[1, undefined], [15, null]], ending: [18, 'C'] });
  assert.deepEqual(notifications, [[1, 'next', undefined], [15, 'next', null], [18, 'complete']]);
  assert.deepEqual(log.filter(e => e[1] === 'timer.schedule'), [[0, 'timer.schedule', 0, 4]]);
  assert.equal(log.some(e => e[1] === 'factory'), false);
});
test('S21 RX timeout: first overrides initial each, then each takes over after the first value', () => {
  const { log, notifications } = fixture({ config: { first: 8, each: 3 }, values: [[2, 'A']] });
  assert.deepEqual(log.filter(e => e[1] === 'timer.schedule'), [[0, 'timer.schedule', 0, 8], [2, 'timer.schedule', 1, 3]]);
  assert.deepEqual(notifications, [[2, 'next', 'A'], [6, 'next', 'R'], [7, 'complete']]);
});
test('S21 RX timeout: absolute Date uses scheduler time at connection and only watches the first value', () => {
  const expired = fixture({ config: { first: new Date(8) }, start: 3 });
  assert.deepEqual(expired.log.slice(0, 3), [[3, 'source.subscribe'], [3, 'timer.schedule', 0, 5], [8, 'timer.fire', 0]]);
  const satisfied = fixture({ config: { first: new Date(8) }, start: 3, values: [[4, 'A'], [16, 'B']], ending: [18, 'C'] });
  assert.deepEqual(satisfied.notifications, [[4, 'next', 'A'], [16, 'next', 'B'], [18, 'complete']]);
  assert.equal(satisfied.infos.length, 0);
});
test('S21 RX timeout: factory info preserves meta and seen but lastValue is null after source finalization', () => {
  const meta = {}, value = {}; const { infos, log } = fixture({ config: { each: 3, meta }, values: [[1, value], [2, undefined]] });
  assert.deepEqual(infos, [{ meta, seen: 2, lastValue: null }]); assert.equal(infos[0].meta, meta);
  const expiry = log.filter(e => e[0] === 5).map(e => e[1]);
  assert.deepEqual(expiry, ['timer.fire', 'source.unsubscribe', 'timer.cancel', 'factory', 'fallback.subscribe']);
});
test('S21 RX timeout: default TimeoutError is fresh and its actual info reflects cleanup ordering', () => {
  const meta = {}; const options = { config: { each: 3, meta }, values: [[1, 'A'], [2, 'B']], factory: 'default' };
  const a = fixture(options), b = fixture(options);
  const errorA = a.notifications.at(-1)[2], errorB = b.notifications.at(-1)[2];
  assert.ok(errorA instanceof TimeoutError); assert.ok(errorB instanceof TimeoutError); assert.notEqual(errorA, errorB);
  assert.deepEqual(errorA.info, { meta, seen: 2, lastValue: null }); assert.equal(errorA.info.meta, meta);
  assert.equal(a.notifications.at(-1)[0], 5); assert.equal(a.log.some(e => e[1] === 'fallback.subscribe'), false);
});
test('S21 RX timeout: default first timeout reports zero seen and no previous value', () => {
  const r = fixture({ config: { first: 3 }, factory: 'default' }); const error = r.notifications[0][2];
  assert.ok(error instanceof TimeoutError); assert.deepEqual(error.info, { meta: null, seen: 0, lastValue: null });
});
test('S21 RX timeout: throwing factory preserves exact error after source and timer teardown', () => {
  const fault = {}; const r = fixture({ config: { each: 3 }, factory: 'throw', fault });
  assert.deepEqual(r.notifications, [[3, 'error', fault]]); assert.equal(r.notifications[0][2], fault);
  assert.deepEqual(r.log.slice(3).map(e => e[1]), ['source.unsubscribe', 'timer.cancel', 'factory', 'error']);
});
for (const terminal of ['C', 'E', 'X']) test(`S21 RX timeout: source ${terminal} bypasses factory and releases watchdog`, () => {
  const fault = {}; const r = fixture({ config: { each: 4 }, ending: [2, terminal, fault] });
  assert.deepEqual(r.notifications, terminal === 'C' ? [[2, 'complete']] : terminal === 'E' ? [[2, 'error', fault]] : []);
  assert.equal(r.infos.length, 0);
  assert.deepEqual(r.log.slice(-2), [[2, 'source.unsubscribe'], [2, 'timer.cancel', 0]]);
});
test('S21 RX timeout: replacement can remain silent beyond each without another timer', () => {
  const r = fixture({ config: { each: 2 }, fallback: [[10, 'N', 'late']], stop: 18 });
  assert.deepEqual(r.notifications, [[12, 'next', 'late']]);
  assert.equal(r.log.filter(e => e[1] === 'timer.schedule').length, 1);
  assert.deepEqual(r.log.at(-1), [18, 'fallback.unsubscribe']);
});
test('S21 RX timeout: replacement failure retains identity and releases only replacement', () => {
  const fault = {}; const r = fixture({ config: { each: 3 }, fallback: [[1, 'N', 'R'], [2, 'E', fault]] });
  assert.deepEqual(r.notifications, [[4, 'next', 'R'], [5, 'error', fault]]);
  assert.deepEqual(r.log.at(-1), [5, 'fallback.unsubscribe']);
  assert.equal(r.log.filter(e => e[1] === 'source.unsubscribe').length, 1);
});
for (const due of [4, new Date(4)]) test(`S21 RX timeoutWith ${typeof due === 'number' ? 'number' : 'Date'}: handoff uses constant fallback without a public factory`, () => {
  const r = fixture({ alias: due });
  assert.deepEqual(r.notifications, [[5, 'next', 'R'], [6, 'complete']]);
  assert.equal(r.infos.length, 0);
  assert.deepEqual(r.log.filter(e => e[0] === 4).map(e => e[1]), ['timer.fire', 'source.unsubscribe', 'timer.cancel', 'fallback.subscribe']);
});
test('S21 RX timeoutWith: Date first is satisfied once while numeric due restarts after source values', () => {
  const base = { values: [[1, 'A'], [12, 'B']], ending: [15, 'C'] };
  assert.deepEqual(fixture({ ...base, alias: new Date(4) }).notifications, [[1, 'next', 'A'], [12, 'next', 'B'], [15, 'complete']]);
  assert.deepEqual(fixture({ ...base, alias: 4 }).notifications, [[1, 'next', 'A'], [6, 'next', 'R'], [7, 'complete']]);
});
test('S21 RX timeoutWith: a captured fallback Observable is acquired separately for each result subscription', () => {
  const scheduler = new TestScheduler(() => {}); let acquired = 0, released = 0; const out = [];
  const replacement = new Observable(s => { acquired++; s.next(acquired); s.complete(); return () => { released++; }; });
  const result = NEVER.pipe(timeoutWith(3, replacement, scheduler));
  assert.equal(acquired, 0); result.subscribe(v => out.push(v)); result.subscribe(v => out.push(v)); scheduler.flush();
  assert.deepEqual(out, [1, 2]); assert.equal(acquired, 2); assert.equal(released, 2);
});
test('S21 RX timeout: equal-time event order can admit a source value before initial watchdog delivery', () => {
  const r = fixture({ config: { first: 3 }, values: [[3, 'A']], ending: [8, 'C'] });
  assert.deepEqual(r.notifications, [[3, 'next', 'A'], [8, 'complete']]); assert.equal(r.infos.length, 0);
});
test('S21 RX timeout: a watchdog queued first can win an equal-time source race', () => {
  const scheduler = new TestScheduler(() => {}), source = new Subject(), out = [];
  source.pipe(timeout({ first: 3, scheduler, with: () => of('fallback') })).subscribe(v => out.push([scheduler.frame, v]));
  scheduler.schedule(() => source.next('too-late'), 3); scheduler.flush();
  assert.deepEqual(out, [[3, 'fallback']]);
});
test('S21 RX timeout characterization: synchronous first value satisfies first-only setup without scheduling', () => {
  const scheduler = new TestScheduler(() => {}); let calls = 0; const supplied = { now: () => scheduler.now(), schedule(...args) { calls++; return scheduler.schedule(...args); } };
  const values = []; const result = of('A').pipe(concatWith(NEVER), timeout({ first: 3, scheduler: supplied })).subscribe(v => values.push(v));
  scheduler.flush(); result.unsubscribe(); assert.deepEqual(values, ['A']); assert.equal(calls, 0);
});
test('S21 RX timeout characterization: nonpositive each does not rearm after a first value', () => {
  const r = fixture({ config: { first: 4, each: 0 }, values: [[1, 'A'], [16, 'B']], ending: [18, 'C'] });
  assert.deepEqual(r.notifications, [[1, 'next', 'A'], [16, 'next', 'B'], [18, 'complete']]);
  assert.equal(r.log.filter(e => e[1] === 'timer.schedule').length, 1);
});
test('S21 RX timeout characterization: cooperative synchronous producer stops on downstream cancellation', () => {
  const effects = [], out = [];
  new Observable(s => { for (let i = 0; !s.closed && i < 8; i++) { effects.push(i); s.next(i); } })
    .pipe(timeout(0), take(2)).subscribe(v => out.push(v));
  assert.deepEqual(out, [0, 1]); assert.deepEqual(effects, [0, 1]);
});
test('S21 RX timeout characterization: missing timing and missing replacement fail during operator construction', () => {
  assert.throws(() => timeout({}), /No timeout provided/);
  assert.throws(() => timeoutWith(undefined, EMPTY), /No timeout provided/);
  assert.throws(() => timeoutWith(3, null), /No observable provided/);
  assert.throws(() => timeoutWith(new Date(NaN), EMPTY), /No timeout provided/);
});
