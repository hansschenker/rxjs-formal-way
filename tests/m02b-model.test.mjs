import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeededScanModel, createUnseededScanModel, seededScanExample, unseededScanExample } from '../dist/models/scan.js';
import { stepModel, runTrace, validateModel, toManifest } from '../dist/runner.js';
import { renderBdd, renderTable, renderDiagram, renderObligations, renderBehavior, renderTrace } from '../dist/render.js';
import { observeScanModel } from './helpers/scan-driver.mjs';

const subscribe = { type: 'subscribe' };
const sourceNext = value => ({ type: 'source.next', value });
const returned = (value, generation = 0, id = 'accumulator') => ({ type: 'callback.return', resource: { id, generation }, value });
const thrown = (error, generation = 0) => ({ type: 'callback.throw', resource: { id: 'accumulator', generation }, error });
const notify = notification => ({ type: 'notify', target: 'downstream', notification });
const acquire = { type: 'subscribe', resource: { id: 'source', generation: 0 } };
const release = { type: 'unsubscribe', resource: { id: 'source', generation: 0 } };
const start = m => stepModel(m, m.initialState(), subscribe).state;
const invoke = (m, s, value) => stepModel(m, s, sourceNext(value)).state;

for (const [mode, factory] of [['seeded', () => createSeededScanModel(0)], ['unseeded', () => createUnseededScanModel()]]) {
  test(`M02B-MODEL ${mode}: initialization is silent and acquires exactly one source`, () => {
    const m = factory();
    assert.deepEqual(validateModel(m), []);
    assert.notEqual(m.initialState(), m.initialState());
    assert.deepEqual(stepModel(m, m.initialState(), subscribe), {
      ruleId: mode === 'seeded' ? 'SCAN-INIT-SEEDED' : 'SCAN-INIT-UNSEEDED',
      state: mode === 'seeded' ? { phase: 'Active', accumulator: 0, index: 0 } : { phase: 'Empty', index: 0 }, actions: [acquire],
    });
  });
  test(`M02B-MODEL ${mode}: correlated return stores and emits exactly the same result`, () => {
    const m = factory(); let s = start(m);
    if (s.phase === 'Empty') s = stepModel(m, s, sourceNext('first')).state;
    const prior = s.accumulator, input = {};
    const reaction = stepModel(m, s, sourceNext(input));
    assert.deepEqual(reaction.actions, [{ type: 'invoke-callback', resource: { id: 'accumulator', generation: s.index }, value: { accumulator: prior, value: input }, index: s.index }]);
    assert.equal(reaction.state.accumulator, prior);
    const result = {};
    const back = stepModel(m, reaction.state, returned(result, s.index));
    assert.equal(back.ruleId, 'SCAN-RETURN');
    assert.equal(back.state.accumulator, result);
    assert.equal(back.state.index, s.index + 1);
    assert.deepEqual(back.actions, [notify({ kind: 'N', value: result })]);
  });
  test(`M02B-MODEL ${mode}: throw preserves arbitrary error identity`, () => {
    const m = factory(); let s = start(m);
    if (s.phase === 'Empty') s = stepModel(m, s, sourceNext(1)).state;
    const calling = invoke(m, s, 2);
    for (const error of [undefined, null, new Error('sentinel'), {}]) {
      const r = stepModel(m, calling, thrown(error, s.index));
      assert.deepEqual(r.state, { phase: 'Closed', reason: 'callback-error' });
      assert.deepEqual(r.actions, [notify({ kind: 'E', error }), release]);
      assert.equal(r.actions[0].notification.error, error);
    }
  });
  test(`M02B-MODEL ${mode}: terminal rules are reached before and after source values`, () => {
    const m = factory(); const initial = start(m);
    const initialized = initial.phase === 'Empty' ? stepModel(m, initial, sourceNext(1)).state : initial;
    const active = stepModel(m, invoke(m, initialized, 2), returned(3, initialized.index)).state;
    for (const state of [initial, active]) {
      assert.deepEqual(stepModel(m, state, { type: 'source.complete' }).actions, [notify({ kind: 'C' }), release]);
      assert.deepEqual(stepModel(m, state, { type: 'source.error', error: 'e' }).actions, [notify({ kind: 'E', error: 'e' }), release]);
      assert.deepEqual(stepModel(m, state, { type: 'cancel' }).actions, [release]);
    }
  });
  test(`M02B-MODEL ${mode}: every instantiated rule is reached through legal prefixes`, () => {
    const m = factory(), seen = new Set();
    for (const values of [[], [1], [1, 2], [1, 2, 3]]) for (const end of ['complete', 'error', 'cancel']) {
      for (const reducer of [(a, x) => a + x, () => { throw 'fault'; }]) {
        for (const id of observeScanModel(m, reducer, values, end).rules) seen.add(id);
      }
    }
    assert.deepEqual([...seen].sort(), m.rules.map(r => r.description.id).sort());
  });
  test(`M02B-MODEL ${mode}: pending calls reject stale, duplicate and foreign outcomes`, () => {
    const m = factory(); let active = start(m);
    if (active.phase === 'Empty') active = stepModel(m, active, sourceNext(1)).state;
    const s = invoke(m, active, 2), generation = active.index;
    for (const event of [returned(4, generation + 1), returned(4, generation, 'other'), thrown('e', generation + 1)]) assert.throws(() => stepModel(m, s, event), /illegal/);
    const resolved = stepModel(m, s, returned(4, generation)).state;
    assert.throws(() => stepModel(m, resolved, returned(4, generation)), /illegal/);
  });
  test(`M02B-MODEL ${mode}: excluded reentry is rejected, never silently queued`, () => {
    const m = factory(); let s = start(m);
    if (s.phase === 'Empty') s = stepModel(m, s, sourceNext(1)).state;
    const pending = invoke(m, s, 2);
    for (const event of [subscribe, sourceNext(8), { type: 'cancel' }, { type: 'source.complete' }, { type: 'source.error', error: 1 }]) assert.throws(() => stepModel(m, pending, event), /illegal/);
  });
  test(`M02B-MODEL ${mode}: closed executions reject reuse and late events`, () => {
    const m = factory(), stopped = stepModel(m, start(m), { type: 'cancel' }).state;
    for (const event of [subscribe, sourceNext(2), returned(3), { type: 'cancel' }]) assert.throws(() => stepModel(m, stopped, event), /illegal/);
  });
  test(`M02B-MODEL ${mode}: renderers preserve every rule without calling a reducer`, () => {
    const manifest = toManifest(factory());
    assert.deepEqual(JSON.parse(JSON.stringify(manifest)), manifest);
    for (const render of [renderBdd, renderTable, renderDiagram, renderObligations, renderBehavior]) {
      const text = render(manifest);
      for (const { id } of manifest.rules) assert.ok(text.includes(id));
      assert.equal(render(manifest), text);
    }
  });
}

test('M02B-MODEL: no seed differs from explicit undefined seed', () => {
  const seeded = createSeededScanModel(undefined), bare = createUnseededScanModel();
  assert.deepEqual(seeded.parameters.seed, { provided: true, value: undefined });
  assert.deepEqual(bare.parameters.seed, { provided: false });
  assert.equal(stepModel(seeded, start(seeded), sourceNext(4)).actions[0].type, 'invoke-callback');
  const first = stepModel(bare, start(bare), sourceNext(4));
  assert.deepEqual(first, { ruleId: 'SCAN-FIRST', state: { phase: 'Active', accumulator: 4, index: 1 }, actions: [notify({ kind: 'N', value: 4 })] });
});
test('M02B-MODEL: undefined first value remains a real unseeded accumulation', () => {
  const m = createUnseededScanModel(), first = stepModel(m, start(m), sourceNext(undefined));
  assert.equal(first.actions[0].notification.value, undefined);
  assert.ok(Object.hasOwn(first.state, 'accumulator'));
  const call = stepModel(m, first.state, sourceNext(5)).actions[0];
  assert.equal(call.value.accumulator, undefined); assert.equal(call.index, 1);
});
test('M02B-MODEL: undefined returned accumulation does not restart initialization', () => {
  const m = createSeededScanModel(0), s = stepModel(m, invoke(m, start(m), 1), returned(undefined)).state;
  const call = stepModel(m, s, sourceNext(2)).actions[0];
  assert.equal(call.index, 1); assert.equal(call.value.accumulator, undefined);
});
test('M02B-MODEL: seed, input, and returned object identities are preserved without deep cloning', () => {
  const seed = Object.freeze({ total: 0 }), input = Object.freeze({ add: 2 }), result = Object.freeze({ total: 2 });
  const m = createSeededScanModel(seed), a = start(m), b = start(m);
  assert.notEqual(a, b); assert.equal(a.accumulator, seed); assert.equal(b.accumulator, seed);
  const pending = stepModel(m, Object.freeze(a), sourceNext(input));
  assert.equal(pending.actions[0].value.accumulator, seed); assert.equal(pending.actions[0].value.value, input);
  const r = stepModel(m, Object.freeze(pending.state), returned(result));
  assert.equal(r.state.accumulator, result); assert.equal(r.actions[0].notification.value, result);
  assert.equal(b.accumulator, seed); assert.equal(seed.total, 0);
});
test('M02B-MODEL: counters, memory presence and pending-call invariants are checked', () => {
  const m = createSeededScanModel(0), bare = createUnseededScanModel();
  for (const index of [-1, 0.5, NaN, Infinity]) assert.throws(() => stepModel(m, { phase: 'Active', index, accumulator: 0 }, sourceNext(1)), /index/);
  assert.throws(() => stepModel(m, { phase: 'Active', index: 0 }, sourceNext(1)), /accumulation/);
  assert.throws(() => stepModel(m, { phase: 'Empty', index: 0 }, sourceNext(1)), /empty/);
  assert.throws(() => stepModel(bare, { phase: 'Active', index: 0, accumulator: 1 }, sourceNext(1)), /index/);
  assert.throws(() => stepModel(m, { phase: 'Calling', index: 2, callId: 0, accumulator: 0, input: 1 }, returned(2)), /pending/);
  for (const id of ['', 'source', 'bad id']) assert.throws(() => createSeededScanModel(0, id), /callbackId/);
});
test('M02B-MODEL: source-index boundary can terminate but cannot overflow', () => {
  const m = createSeededScanModel(0), s = { phase: 'Active', index: Number.MAX_SAFE_INTEGER, accumulator: 0 };
  assert.throws(() => stepModel(m, s, sourceNext(1)), /illegal/);
  assert.equal(stepModel(m, s, { type: 'source.complete' }).state.phase, 'Closed');
});
test('M02B-MODEL: duplicate invocation and corrupted accumulated result are detected', () => {
  const m = createSeededScanModel(0);
  const duplicate = { ...m, rules: m.rules.map(r => r.description.id === 'SCAN-CALL' ? { ...r, react: (...args) => { const x = r.react(...args); return { ...x, actions: [...x.actions, ...x.actions] }; } } : r) };
  assert.throws(() => stepModel(duplicate, start(m), sourceNext(1)), /exactly one/);
  const wrong = { ...m, rules: m.rules.map(r => r.description.id === 'SCAN-RETURN' ? { ...r, react: (...args) => { const x = r.react(...args); return { ...x, state: { ...x.state, accumulator: 999 } }; } } : r) };
  assert.throws(() => stepModel(wrong, invoke(m, start(m), 1), returned(3)), /same result/);
});
test('M02B-MODEL: conflicting guards remain errors with no reducer evaluation', () => {
  const m = createSeededScanModel(0), call = m.rules.find(r => r.description.id === 'SCAN-CALL');
  assert.throws(() => stepModel({ ...m, rules: [...m.rules, { ...call, description: { ...call.description, id: 'DUPLICATE' } }] }, start(m), sourceNext(1)), /ambiguous/);
});
test('M02B-MODEL: typed product payload reuses schema 1.1 without changing the action alphabet', () => {
  const m = createSeededScanModel(0, 'sum');
  assert.equal(m.metadata.schemaVersion, '1.1');
  const call = stepModel(m, start(m), sourceNext(2)).actions[0];
  assert.deepEqual(call.value, { accumulator: 0, value: 2 });
  assert.equal(call.resource.id, 'sum');
  assert.deepEqual(validateModel(m), []);
});
test('M02B-MODEL: sample traces distinguish first-value policy with the same output values', () => {
  const seeded = runTrace(createSeededScanModel(0), seededScanExample, { executionId: 'seeded' });
  const bare = runTrace(createUnseededScanModel(), unseededScanExample, { executionId: 'bare' });
  const actions = t => t.steps.flatMap(s => s.actions);
  const values = t => actions(t).filter(a => a.type === 'notify' && a.notification.kind === 'N').map(a => a.notification.value);
  assert.deepEqual(values(seeded), [1, 3]); assert.deepEqual(values(bare), [1, 3]);
  assert.deepEqual(actions(seeded).filter(a => a.type === 'invoke-callback').map(a => a.index), [0, 1]);
  assert.deepEqual(actions(bare).filter(a => a.type === 'invoke-callback').map(a => a.index), [1]);
  assert.ok(renderTrace(seeded).includes('Four lanes'));
  assert.equal(seeded.steps[1].time, seeded.steps[2].time);
  assert.notEqual(seeded.steps[1].sequence, seeded.steps[2].sequence);
});
test('M02B-MODEL: finite input exhaustion is not completion, including an unresolved call', () => {
  const m = createSeededScanModel(0);
  const trace = runTrace(m, [{ time: 0, event: subscribe }, { time: 1, event: sourceNext(1) }], { executionId: 'partial' });
  assert.equal(trace.status, 'finished-input'); assert.equal(trace.state.phase, 'Calling');
  assert.equal(trace.steps.flatMap(s => s.actions).filter(a => a.type === 'notify').length, 0);
});
