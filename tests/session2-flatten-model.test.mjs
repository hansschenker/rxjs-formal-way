import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, runTrace, validateModel, toManifest } from '../dist/runner.js';
import { createSwitchMapModel, createMergeMapModel, createConcatMapModel, createExhaustMapModel,
  switchMapExample, mergeMapExample, concatMapExample, exhaustMapExample } from '../dist/models/flatten.js';

const factories = [
  ['switchMap', createSwitchMapModel, switchMapExample], ['mergeMap(2)', () => createMergeMapModel(2), mergeMapExample],
  ['concatMap', createConcatMapModel, concatMapExample], ['exhaustMap', createExhaustMapModel, exhaustMapExample],
];
const inner = generation => ({ id: 'inner', generation });
const callRef = generation => ({ id: 'project', generation });
const subscribe = { type: 'subscribe' };
const next = value => ({ type: 'outer.next', value });
const enter = (m, value = 'a') => stepModel(m, stepModel(m, m.initialState(), subscribe).state, next(value)).state;
const returned = (m, s, value = 'plan') => stepModel(m, s, { type: 'callback.return', resource: callRef(s.callId), value }).state;
const ready = m => returned(m, enter(m));
const n = value => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const c = { type: 'notify', target: 'downstream', notification: { kind: 'C' } };
const u = resource => ({ type: 'unsubscribe', resource });

// Literal assertions are deliberately independent of generated prose.
for (const [name, factory, example] of factories) {
  test(`S2-MODEL ${name}: fresh initialization acquires only the outer`, () => {
    const m = factory(); assert.deepEqual(validateModel(m), []);
    const result = stepModel(m, m.initialState(), subscribe);
    assert.deepEqual(result.state, { phase: 'Active', index: 0, active: [], queue: [] });
    assert.deepEqual(result.actions, [{ type: 'subscribe', resource: { id: 'outer', generation: 0 } }]);
    assert.notEqual(m.initialState(), m.initialState());
  });
  test(`S2-MODEL ${name}: one projection request preserves the opaque input`, () => {
    const m = factory(), value = {}, before = Object.freeze({ phase: 'Active', index: 0, active: Object.freeze([]), queue: Object.freeze([]) });
    const result = stepModel(m, before, next(value));
    assert.deepEqual(result.actions, [{ type: 'invoke-callback', resource: callRef(0), value, index: 0 }]);
    assert.equal(result.state.input, value); assert.equal(result.state.index, 1); assert.equal(before.index, 0);
  });
  test(`S2-MODEL ${name}: returned source and subscription identity are separate`, () => {
    const m = factory(), source = {}, calling = enter(m);
    const result = stepModel(m, calling, { type: 'callback.return', resource: callRef(0), value: source });
    assert.equal(result.state.active[0].source, source);
    assert.deepEqual(result.actions, [{ type: 'subscribe', resource: inner(0) }]);
  });
  test(`S2-MODEL ${name}: inner payload identity survives including undefined and NaN`, () => {
    const m = factory(), s = ready(m);
    for (const value of [undefined, null, NaN, {}, () => {}]) {
      const result = stepModel(m, s, { type: 'inner.next', resource: inner(0), value });
      assert.deepEqual(result.actions, [n(value)]); assert.equal(result.state, s);
    }
  });
  test(`S2-MODEL ${name}: outer completion waits; final inner completes with scoped cleanup order`, () => {
    const m = factory(), result = stepModel(m, ready(m), { type: 'outer.complete' });
    assert.equal(result.state.phase, 'Draining'); assert.deepEqual(result.actions, [u({ id: 'outer', generation: 0 })]);
    const last = stepModel(m, result.state, { type: 'inner.complete', resource: inner(0) });
    const queues = ['mergeMap', 'concatMap'].includes(m.parameters.operator);
    assert.deepEqual(last.actions, queues ? [u(inner(0)), c] : [c, u(inner(0))]);
    assert.deepEqual(last.state, { phase: 'Closed', reason: 'complete' });
  });
  test(`S2-MODEL ${name}: inner completion while outer open does not complete result`, () => {
    const m = factory(), r = stepModel(m, ready(m), { type: 'inner.complete', resource: inner(0) });
    assert.equal(r.state.phase, 'Active'); assert.deepEqual(r.state.active, []); assert.deepEqual(r.actions, [u(inner(0))]);
  });
  test(`S2-MODEL ${name}: projection/source/inner error identities stay unchanged`, () => {
    const m = factory(), error = {};
    for (const [s, e, reason] of [[enter(m), { type: 'callback.throw', resource: callRef(0), error }, 'project-error'],
      [ready(m), { type: 'outer.error', error }, 'outer-error'], [ready(m), { type: 'inner.error', resource: inner(0), error }, 'inner-error']]) {
      const r = stepModel(m, s, e); assert.equal(r.state.reason, reason);
      assert.deepEqual(r.actions[0], { type: 'notify', target: 'downstream', notification: { kind: 'E', error } });
      assert.equal(r.actions.some(a => a.type === 'notify' && a.notification.kind === 'C'), false);
    }
  });
  test(`S2-MODEL ${name}: cancellation is silent both before and after outer completion`, () => {
    const m = factory(), s = ready(m), draining = stepModel(m, s, { type: 'outer.complete' }).state;
    assert.deepEqual(stepModel(m, s, { type: 'cancel' }).actions, [u({ id: 'outer', generation: 0 }), u(inner(0))]);
    assert.deepEqual(stepModel(m, draining, { type: 'cancel' }).actions, [u(inner(0))]);
  });
  test(`S2-MODEL ${name}: stale and foreign outcomes are rejected`, () => {
    const m = factory(), s = enter(m);
    for (const resource of [inner(0), callRef(1), callRef(-1)]) assert.throws(() => stepModel(m, s, { type: 'callback.return', resource, value: 'x' }), /illegal/);
    for (const resource of [callRef(0), inner(1), inner(-1)]) assert.throws(() => stepModel(m, ready(m), { type: 'inner.next', resource, value: 'x' }), /illegal/);
  });
  test(`S2-MODEL ${name}: unresolved projection and closed executions reject external reuse`, () => {
    const m = factory();
    for (const e of [subscribe, next('x'), { type: 'cancel' }, { type: 'outer.complete' }, { type: 'inner.next', resource: inner(0), value: 'x' }])
      assert.throws(() => stepModel(m, enter(m), e), /illegal/);
    const stopped = stepModel(m, ready(m), { type: 'cancel' }).state;
    for (const e of [subscribe, next('x'), { type: 'cancel' }]) assert.throws(() => stepModel(m, stopped, e), /illegal/);
  });
  test(`S2-MODEL ${name}: invalid state/index and corrupted invocation fail validation`, () => {
    const m = factory(), s = ready(m);
    assert.throws(() => stepModel(m, { ...s, index: -1 }, { type: 'cancel' }), /index|identities/);
    assert.throws(() => stepModel(m, { ...s, active: [...s.active, ...s.active] }, { type: 'cancel' }), /identities/);
    const rules = m.rules.map(r => r.description.id.endsWith('-ADMIT') ? { ...r, react: (...args) => { const x = r.react(...args); return { ...x, actions: [...x.actions, ...x.actions] }; } } : r);
    assert.throws(() => stepModel({ ...m, rules }, stepModel(m, m.initialState(), subscribe).state, next('x')), /one correctly/);
  });
  test(`S2-MODEL ${name}: predicted example completes and rule annotations serialize deterministically`, () => {
    const m = factory(); assert.equal(runTrace(m, example, { executionId: name }).state.phase, 'Closed');
    const manifest = toManifest(m); assert.deepEqual(JSON.parse(JSON.stringify(manifest)), manifest);
    assert.equal('react' in manifest.rules[0], false);
  });
}

test('S2-MODEL switchMap: cancellation occurs before replacement projection, including throwing replacement', () => {
  const m = createSwitchMapModel(), s = ready(m), r = stepModel(m, s, next('b'));
  assert.deepEqual(r.actions, [u(inner(0)), { type: 'invoke-callback', resource: callRef(1), value: 'b', index: 1 }]);
  assert.deepEqual(r.state.active, []);
  const failed = stepModel(m, r.state, { type: 'callback.throw', resource: callRef(1), error: 'oops' });
  assert.deepEqual(failed.actions, [{ type: 'notify', target: 'downstream', notification: { kind: 'E', error: 'oops' } }, u({ id: 'outer', generation: 0 })]);
  assert.throws(() => stepModel(m, returned(m, r.state), { type: 'inner.complete', resource: inner(0) }), /illegal/);
});
test('S2-MODEL exhaustMap: ignored values neither queue nor consume projection indices', () => {
  const m = createExhaustMapModel(), s = ready(m), ignored = stepModel(m, s, next('ignored'));
  assert.equal(ignored.state, s); assert.deepEqual(ignored.actions, []);
  const idle = stepModel(m, s, { type: 'inner.complete', resource: inner(0) }).state;
  assert.equal(stepModel(m, idle, next('b')).actions[0].index, 1);
});
for (const factory of [createConcatMapModel, () => createMergeMapModel(1), () => createMergeMapModel(2)]) {
  const model = factory();
  test(`S2-MODEL ${model.metadata.id}: raw FIFO queue drains after outer completion`, () => {
    const m = factory(); let s = ready(m);
    if (m.parameters.concurrent === 2) s = returned(m, stepModel(m, s, next('second')).state);
    for (const value of [undefined, 'last']) s = stepModel(m, s, next(value)).state;
    const before = s; assert.equal(s.index, m.parameters.concurrent); assert.deepEqual(s.queue, [undefined, 'last']);
    s = stepModel(m, s, { type: 'outer.complete' }).state;
    const r = stepModel(m, s, { type: 'inner.complete', resource: inner(0) });
    assert.equal(r.state.phase, 'Calling'); assert.equal(r.state.resume, 'Draining'); assert.equal(r.state.input, undefined);
    assert.equal(r.actions[0].type, 'unsubscribe'); assert.equal(r.actions[1].type, 'invoke-callback');
    assert.deepEqual(r.state.queue, ['last']); assert.deepEqual(before.queue, [undefined, 'last']);
  });
}
test('S2-MODEL mergeMap: unbounded admission preserves separate subscriptions to one source token', () => {
  const m = createMergeMapModel(), source = {}; let s = stepModel(m, m.initialState(), subscribe).state;
  for (let i = 0; i < 5; i++) s = returned(m, stepModel(m, s, next(i)).state, source);
  assert.equal(s.active.length, 5); assert.deepEqual(s.queue, []); assert.equal(s.active.every(x => x.source === source), true);
  assert.deepEqual(s.active.map(x => x.resource.generation), [0, 1, 2, 3, 4]);
});
test('S2-MODEL: explicit parameter and counter boundaries are not hidden semantics', () => {
  for (const n of [0, -1, NaN, 1.5, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => createMergeMapModel(n), RangeError);
  for (const id of ['', 'inner', 'outer', 'bad space']) assert.throws(() => createSwitchMapModel(id), TypeError);
  const m = createSwitchMapModel(), s = { phase: 'Active', index: Number.MAX_SAFE_INTEGER, active: [], queue: [] };
  assert.throws(() => stepModel(m, s, next('x')), /illegal/); assert.equal(stepModel(m, s, { type: 'cancel' }).state.phase, 'Closed');
});
test('S2-MODEL: duplicate enabled rules are rejected without executing projection', () => {
  const m = createSwitchMapModel(), r = m.rules.find(x => x.description.id.endsWith('-ADMIT'));
  const duplicate = { ...r, description: { ...r.description, id: 'DUPLICATE' } };
  assert.throws(() => stepModel({ ...m, rules: [...m.rules, duplicate] }, stepModel(m, m.initialState(), subscribe).state, next('x')), /ambiguous/);
});

// Bounded reachability is a structural check, not an independent implementation oracle.
for (const factory of [...factories.map(x => x[1]), () => createMergeMapModel(1), createMergeMapModel]) {
  const m = factory();
  test(`S2-MODEL ${m.metadata.id}: every instantiated rule has a legal input prefix`, () => {
    const queue = [m.initialState()], states = new Set(), reached = new Set();
    while (queue.length) {
      const s = queue.shift(), key = JSON.stringify(s); if (states.has(key)) continue; states.add(key);
      assert.ok(states.size < 10000, 'reachability budget');
      let events = [];
      if (s.phase === 'Unsubscribed') events = [subscribe];
      else if (s.phase === 'Calling') events = [{ type: 'callback.return', resource: callRef(s.callId), value: 'P' }, { type: 'callback.throw', resource: callRef(s.callId), error: 'E' }];
      else if (s.phase === 'Active' || s.phase === 'Draining') {
        events = [{ type: 'cancel' }];
        if (s.phase === 'Active') events.push({ type: 'outer.complete' }, { type: 'outer.error', error: 'E' }, ...(s.index < 3 && s.queue.length < 2 ? [next('x')] : []));
        for (const x of s.active) events.push({ type: 'inner.next', resource: x.resource, value: 'y' }, { type: 'inner.complete', resource: x.resource }, { type: 'inner.error', resource: x.resource, error: 'E' });
      }
      for (const event of events) {
        const result = stepModel(m, s, event); reached.add(result.ruleId); queue.push(result.state);
      }
    }
    assert.deepEqual([...reached].sort(), m.rules.map(x => x.description.id).sort());
  });
}
