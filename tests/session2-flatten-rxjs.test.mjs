import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, EMPTY, NEVER, of, switchMap, mergeMap, concatMap, exhaustMap, take } from 'rxjs';
import { createSwitchMapModel, createMergeMapModel, createConcatMapModel, createExhaustMapModel } from '../dist/models/flatten.js';
import { observeFlattenModel, words } from './helpers/session2-flatten-driver.mjs';
import { observeFlattenRx } from './helpers/session2-flatten-rxjs-driver.mjs';

const profiles = [
  ['switchMap', createSwitchMapModel, 1], ['mergeMap', () => createMergeMapModel(2), 2],
  ['concatMap', createConcatMapModel, 1], ['exhaustMap', createExhaustMapModel, 1],
];
const next = (time, value) => ({ time, kind: 'N', value });
const end = time => ({ time, kind: 'C' });
const cancel = time => ({ time, kind: 'cancel' });
const error = (time, error) => ({ time, kind: 'E', error });
const plan = (value, delay = 1, duration = 2) => ({ events: [{ delay, kind: 'N', value }, { delay: duration, kind: 'C' }] });
const ns = xs => xs.filter(x => ['N', 'E', 'C'].includes(x.kind));
const values = xs => xs.filter(x => x.kind === 'N').map(x => x.value);
const operator = (name, project, concurrent = 2) => name === 'switchMap' ? switchMap(project) : name === 'mergeMap' ? mergeMap(project, concurrent)
  : name === 'concatMap' ? concatMap(project) : exhaustMap(project);
function compare(factory, events, project) {
  const m = factory(), all = [...events, cancel(100)];
  const expected = observeFlattenModel(m, all, project);
  const actual = observeFlattenRx(m.parameters.operator, m.parameters.concurrent === 'unbounded' ? Infinity : m.parameters.concurrent, all, project);
  assert.deepEqual(actual.observations, expected.observations);
  assert.equal(actual.closed, true); assert.equal(actual.live, 0); assert.equal(expected.closed, true); assert.equal(expected.live, 0);
  return actual.observations;
}
for (const [name, factory, concurrency] of profiles) {
  const label = suffix => `S2-${name.toUpperCase()}-${suffix}`;
  test(`${label('01')}: construction is lazy and empty source never projects`, () => {
    let acquired = 0, calls = 0;
    const source = new Observable(s => { acquired++; s.complete(); });
    const result = source.pipe(operator(name, () => { calls++; return EMPTY; }, concurrency));
    assert.equal(acquired, 0); result.subscribe(); assert.equal(acquired, 1); assert.equal(calls, 0);
    assert.deepEqual(ns(compare(factory, [end(1)], () => { throw new Error('must not project'); })), [{ time: 1, kind: 'C' }]);
  });
  test(`${label('02')}: admitted projection runs once with local index`, () => {
    const xs = compare(factory, [next(1, 'a'), next(5, 'b'), end(8)], (value, index) => plan(`${value}:${index}`));
    assert.deepEqual(xs.filter(x => x.kind === 'project'), [{ time: 1, kind: 'project', value: 'a', index: 0 }, { time: 5, kind: 'project', value: 'b', index: 1 }]);
    assert.deepEqual(values(xs), ['a:0', 'b:1']);
  });
  test(`${label('03')}: busy arrivals follow the operator policy`, () => {
    const xs = compare(factory, [next(1, 'a'), next(2, 'b'), next(3, 'c'), end(4)], value => plan(value, 4, 5));
    assert.deepEqual(values(xs), name === 'switchMap' ? ['c'] : name === 'exhaustMap' ? ['a'] : ['a', 'b', 'c']);
    const calls = xs.filter(x => x.kind === 'project');
    assert.deepEqual(calls.map(x => x.index), calls.map((_, i) => i));
    if (name === 'concatMap') assert.deepEqual(calls.map(x => x.time), [1, 6, 11]);
    if (name === 'mergeMap') assert.deepEqual(calls.map(x => x.time), [1, 2, 6]);
    if (name === 'exhaustMap') assert.equal(calls.length, 1);
    if (name === 'switchMap') {
      for (const index of [1, 2]) {
        const position = xs.findIndex(x => x.kind === 'project' && x.index === index);
        assert.deepEqual(xs[position - 1], { time: index + 1, kind: 'unsubscribe', id: 'inner', generation: index - 1 });
      }
    }
  });
  test(`${label('04')}: successful return starts an inner, not an outer-value emission`, () => {
    const xs = compare(factory, [next(1, 'outer'), end(2)], () => ({ events: [{ delay: 3, kind: 'N', value: 'inner' }, { delay: 4, kind: 'C' }] }));
    assert.deepEqual(values(xs), ['inner']);
    assert.deepEqual(ns(compare(factory, [next(1, 'x'), end(2)], () => ({ events: [{ delay: 0, kind: 'C' }] }))), [{ time: 2, kind: 'C' }]);
  });
  test(`${label('05')}: projection throws preserve arbitrary identity and release owned work`, () => {
    for (const fault of [undefined, null, {}, new Error('project')]) {
      const xs = compare(factory, [next(1, 'a'), next(5, 'b'), end(9)], (value, index) => { if (index === 1) throw fault; return plan(value); });
      const failures = xs.filter(x => x.kind === 'E'); assert.equal(failures.length, 1); assert.equal(failures[0].error, fault);
      assert.equal(xs.some(x => x.kind === 'C'), false); assert.equal(xs.at(-1).kind, 'unsubscribe');
    }
  });
  test(`${label('06')}: remaining inner values flow after outer completion`, () => {
    const payload = {};
    const xs = compare(factory, [next(1, 'a'), end(2)], () => plan(payload, 3, 4));
    assert.deepEqual(ns(xs), [{ time: 4, kind: 'N', value: payload }, { time: 5, kind: 'C' }]);
    assert.equal(xs.find(x => x.kind === 'N').value, payload);
  });
  test(`${label('07')}: inner errors cancel the outer and other active work`, () => {
    const fault = {};
    for (const terminal of [end(3), end(30)]) {
      const xs = compare(factory, [next(1, 'a'), next(2, 'b'), terminal], () => ({ events: [{ delay: 4, kind: 'E', error: fault }] }));
      assert.equal(ns(xs).length, 1); assert.equal(ns(xs)[0].kind, 'E'); assert.equal(ns(xs)[0].error, fault);
    }
  });
  test(`${label('08')}: cancellation is silent, releases all work and drops queued projections`, () => {
    for (const events of [[next(1, 'a'), next(2, 'b'), next(3, 'c'), cancel(4)], [next(1, 'a'), end(2), cancel(3)]]) {
      const xs = compare(factory, events, value => plan(value, 10, 11));
      assert.deepEqual(ns(xs), []);
      assert.equal(xs.filter(x => x.kind === 'subscribe').length, xs.filter(x => x.kind === 'unsubscribe').length);
      assert.equal(xs.some(x => x.kind === 'project' && x.time >= 4), false);
    }
  });
  test(`${label('09')}: completion admits queued work only for queueing policies`, () => {
    const xs = compare(factory, [next(1, 'a'), next(1, 'b'), next(1, 'c'), end(2)], value => plan(value, 3, 4));
    if (name === 'concatMap' || name === 'mergeMap') {
      assert.equal(xs.filter(x => x.kind === 'project').length, 3);
      for (const item of xs.filter(x => x.kind === 'project' && x.time > 1)) {
        const position = xs.indexOf(item); assert.equal(xs[position - 1].kind, 'unsubscribe'); assert.equal(xs[position - 1].id, 'inner');
      }
    } else assert.deepEqual(values(xs), name === 'switchMap' ? ['c'] : ['a']);
  });
  test(`${label('10')}: completing an inner does not finish a still-open outer`, () => {
    const xs = compare(factory, [next(1, 'a'), next(5, 'b'), end(20)], value => plan(value));
    assert.deepEqual(xs.filter(x => x.kind === 'C'), [{ time: 20, kind: 'C' }]);
    assert.deepEqual(values(xs), ['a', 'b']);
  });
  test(`${label('11')}: final-inner completion and teardown order are independently stated`, () => {
    const xs = compare(factory, [next(1, 'a'), end(2)], value => plan(value, 3, 4));
    const release = { time: 5, kind: 'unsubscribe', id: 'inner', generation: 0 }, completed = { time: 5, kind: 'C' };
    assert.deepEqual(xs.slice(-2), ['mergeMap', 'concatMap'].includes(name) ? [release, completed] : [completed, release]);
  });
  test(`${label('12')}: a never-completing last inner prevents completion until explicit cancellation`, () => {
    const xs = compare(factory, [next(1, 'a'), end(2), cancel(20)], () => ({ events: [] }));
    assert.deepEqual(ns(xs), []); assert.equal(xs.at(-1).time, 20);
  });
  test(`${label('13')}: outer completion with no remaining inner completes immediately`, () => {
    const xs = compare(factory, [end(1)], () => { throw 'unused'; });
    assert.deepEqual(xs, [{ time: 0, kind: 'subscribe', id: 'outer', generation: 0 }, { time: 1, kind: 'C' }, { time: 1, kind: 'unsubscribe', id: 'outer', generation: 0 }]);
  });
  test(`${label('14')}: outer error cancels rather than waiting for inner completion`, () => {
    const fault = {};
    const xs = compare(factory, [next(1, 'a'), next(2, 'b'), error(3, fault)], value => plan(value, 10, 11));
    assert.deepEqual(ns(xs), [{ time: 3, kind: 'E', error: fault }]);
    assert.equal(xs.at(-1).time, 3);
  });
  test(`S2-${name.toUpperCase()}-SYNC: synchronous inner values and empty completion are characterized separately`, () => {
    const seen = [], indices = [];
    of(1, 2, 3).pipe(operator(name, (x, i) => { indices.push(i); return of(x, -x); }, concurrency)).subscribe({ next: x => seen.push(x), complete: () => seen.push('C') });
    assert.deepEqual(seen, [1, -1, 2, -2, 3, -3, 'C']); assert.deepEqual(indices, [0, 1, 2]);
    let completed = 0; of(1, 2).pipe(operator(name, () => EMPTY, concurrency)).subscribe({ complete: () => completed++ }); assert.equal(completed, 1);
  });
  test(`S2-${name.toUpperCase()}-TAKE: downstream take cancels a cooperative synchronous producer`, () => {
    const produced = [], projected = []; let released = 0;
    const source = new Observable(s => { for (let i = 0; i < 4 && !s.closed; i++) { produced.push(i); s.next(i); } return () => released++; });
    source.pipe(operator(name, x => { projected.push(x); return of(x); }, concurrency), take(1)).subscribe();
    assert.deepEqual(produced, [0]); assert.deepEqual(projected, [0]); assert.equal(released, 1);
  });
}

test('S2-SWITCHMAP-STALE: late producer attempts from an unsubscribed inner do not reach downstream', () => {
  const outer = new Subject(), sinks = [], seen = [];
  const sub = outer.pipe(switchMap(() => new Observable(s => { sinks.push(s); }))).subscribe(x => seen.push(x));
  outer.next('a'); sinks[0].next('old'); outer.next('b'); sinks[0].next('stale'); sinks[1].next('new');
  assert.deepEqual(seen, ['old', 'new']); assert.equal(sinks[0].closed, true); sub.unsubscribe();
});
test('S2-EXHAUSTMAP-IGNORED: a busy arrival never executes a throwing projection', () => {
  const outer = new Subject(); let calls = 0, errors = 0;
  const sub = outer.pipe(exhaustMap(() => { if (calls++ > 0) throw 'must-not-run'; return NEVER; })).subscribe({ error: () => errors++ });
  outer.next('first'); outer.next('ignored'); outer.next('ignored-again'); assert.equal(calls, 1); assert.equal(errors, 0); sub.unsubscribe();
});
test('S2-QUEUE-THROW: queued projection failure happens at admission, including after outer completion', () => {
  for (const factory of [createConcatMapModel, () => createMergeMapModel(1)]) {
    const xs = compare(factory, [next(1, 'a'), next(2, 'bad'), next(3, 'never-projected'), end(4)], (value, index) => { if (index === 1) throw 'queued-fault'; return plan(value, 3, 4); });
    assert.deepEqual(xs.filter(x => x.kind === 'project').map(x => [x.time, x.value]), [[1, 'a'], [5, 'bad']]);
    assert.deepEqual(ns(xs), [{ time: 4, kind: 'N', value: 'a' }, { time: 5, kind: 'E', error: 'queued-fault' }]);
  }
});
test('S2-FLATTEN-HOT: subscriptions own indices even when their outer producer is shared', () => {
  for (const [name, , concurrency] of profiles) {
    const outer = new Subject(), seen = [[], []];
    const output = outer.pipe(operator(name, (x, i) => of(`${x}:${i}`), concurrency));
    const a = output.subscribe(x => seen[0].push(x)); outer.next('a');
    const b = output.subscribe(x => seen[1].push(x)); outer.next('b');
    assert.deepEqual(seen, [['a:0', 'b:1'], ['b:0']]); a.unsubscribe(); b.unsubscribe();
  }
});

test('S2-FLATTEN-DIFF: 8100 bounded comparisons include projections, values, times and all subscription releases', () => {
  const configurations = [...profiles, ['mergeMap(1)', () => createMergeMapModel(1)], ['mergeMap(Infinity)', createMergeMapModel]];
  const projects = [
    (v, i) => plan(`${v}:${i}`, 1, 4),
    () => ({ events: [{ delay: 0, kind: 'C' }] }),
    () => ({ events: [] }),
    (v, i) => { if (i === 1) throw 'project-fault'; return plan(v, 0, 3); },
    v => ({ events: [{ delay: 1, kind: 'N', value: v }, v === 1 ? { delay: 2, kind: 'E', error: 'inner-fault' } : { delay: 3, kind: 'C' }] }),
  ];
  let count = 0;
  for (const [, factory] of configurations) for (const project of projects) for (const word of words([0, 1], 3))
    for (const spacing of [0, 2, 7]) for (const ending of ['complete', 'error', 'cancel']) for (const offset of [0, 5]) {
      const events = word.map((value, i) => next(1 + i * spacing, value));
      const time = (events.at(-1)?.time ?? 1) + offset;
      events.push(ending === 'complete' ? end(time) : ending === 'error' ? error(time, 'outer-fault') : cancel(time));
      compare(factory, events, project); count++;
    }
  assert.equal(count, 8100);
});
