import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, runTrace, validateModel, toManifest } from '../dist/runner.js';
import { createWithLatestFromModel, withLatestFromExample, withLatestFromEmptyExample } from '../dist/models/session22-withLatestFrom.js';

const aux = (index, value) => ({ type: 'aux.next', index, value });
const sub = id => ({ type: 'subscribe', resource: { id, generation: 0 } });
const unsub = id => ({ type: 'unsubscribe', resource: { id, generation: 0 } });
const notify = notification => ({ type: 'notify', target: 'downstream', notification });
const next = value => ({ type: 'source.next', value });
const start = { type: 'subscribe' };
const complete = { type: 'source.complete' };
const execute = (model, events) => {
  let state = model.initialState();
  const actions = [], rules = [];
  for (const event of events) {
    const result = stepModel(model, state, event);
    state = result.state; actions.push(...result.actions); rules.push(result.ruleId);
  }
  return { state, actions, rules };
};

test('S22 WITHLATESTFROM MODEL: pinned metadata, six-tuple, and guarded obligations', () => {
  for (const n of [1, 2, 4, 16]) {
    const m = createWithLatestFromModel(n);
    assert.deepEqual(validateModel(m), []);
    const manifest = toManifest(m);
    assert.equal(manifest.metadata.operator, 'withLatestFrom');
    assert.equal(manifest.metadata.rxjsVersion, '7.8.2');
    assert.equal(manifest.metadata.evidence.record, 'evidence/SESSION-22.md');
    assert.match(manifest.metadata.cardinality.signature, /T\*/);
    assert.equal(manifest.rules.length, m.rules.length);
    assert.ok(manifest.rules.every(r => r.guard && r.actions.length && r.obligations.length));
  }
  for (const bad of [0, -1, NaN, Infinity, 1.5, 17]) assert.throws(() => createWithLatestFromModel(bad), RangeError);
});

test('S22 WITHLATESTFROM MODEL: first connection acquires auxiliaries in order before source', () => {
  assert.deepEqual(execute(createWithLatestFromModel(3), [start]).actions,
    [sub('aux:0'), sub('aux:1'), sub('aux:2'), sub('source')]);
});

test('S22 WITHLATESTFROM MODEL: source values disappear until all auxiliary presence flags turn true', () => {
  const m = createWithLatestFromModel();
  const r = execute(m, [start, next('early'), aux(0, 11), next('still-early'), aux(1, undefined),
    next('first')]);
  assert.deepEqual(r.actions.filter(a => a.type === 'notify'),
    [notify({ kind: 'N', value: ['first', 11, undefined] })]);
  assert.deepEqual(r.state.hasValue, [true, true]); assert.equal(r.state.ready, true);
});

test('S22 WITHLATESTFROM MODEL: auxiliary notifications replace latest without emitting', () => {
  const m = createWithLatestFromModel();
  const r = execute(m, [start, aux(0, 'a'), aux(1, 'b'), aux(0, 'new'), next('v')]);
  assert.deepEqual(r.actions.filter(a => a.type === 'notify'),
    [notify({ kind: 'N', value: ['v', 'new', 'b'] })]);
  assert.deepEqual(r.state.latest, ['new', 'b']);
});

test('S22 WITHLATESTFROM MODEL: auxiliary completion preserves last value, output remains source-gated', () => {
  const m = createWithLatestFromModel();
  const r = execute(m, [start, aux(0, 'persist'), { type: 'aux.complete', index: 0 },
    aux(1, 3), next(4), complete]);
  assert.deepEqual(r.actions.filter(a => a.type === 'notify'),
    [notify({ kind: 'N', value: [4, 'persist', 3] }), notify({ kind: 'C' })]);
  assert.equal(r.actions.filter(a => a.type === 'unsubscribe' && a.resource.id === 'aux:0').length, 1);
});

test('S22 WITHLATESTFROM MODEL: empty auxiliary completion makes readiness unreachable, source still completes', () => {
  const r = execute(createWithLatestFromModel(), [start, { type: 'aux.complete', index: 0 }, aux(1, 'v'),
    next('nothing'), complete]);
  assert.deepEqual(r.actions.filter(a => a.type === 'notify'), [notify({ kind: 'C' })]);
  assert.equal(r.state.reason, 'source-complete');
});

test('S22 WITHLATESTFROM MODEL: source completion before readiness stops all auxiliary resources', () => {
  const r = execute(createWithLatestFromModel(), [start, complete]);
  assert.deepEqual(r.actions, [sub('aux:0'), sub('aux:1'), sub('source'),
    notify({ kind: 'C' }), unsub('aux:0'), unsub('aux:1'), unsub('source')]);
});

test('S22 WITHLATESTFROM MODEL: errors preserve identity and terminate without synthetic output', () => {
  const fault = {};
  for (const event of [{ type: 'source.error', error: fault }, { type: 'aux.error', index: 1, error: fault }]) {
    const r = execute(createWithLatestFromModel(), [start, aux(0, 1), event]);
    assert.deepEqual(r.actions.filter(a => a.type === 'notify'),
      [notify({ kind: 'E', error: fault })]);
    assert.equal(r.state.phase, 'Closed');
    assert.equal(r.actions.filter(a => a.type === 'unsubscribe').length, 3);
    assert.deepEqual(r.actions.slice(-3), [unsub('aux:0'), unsub('aux:1'), unsub('source')]);
  }
});

test('S22 WITHLATESTFROM MODEL: cancellation releases only live connections without a notification', () => {
  const r = execute(createWithLatestFromModel(), [start, { type: 'aux.complete', index: 1 }, { type: 'cancel' }]);
  assert.deepEqual(r.actions, [sub('aux:0'), sub('aux:1'), sub('source'),
    unsub('aux:1'), unsub('aux:0'), unsub('source')]);
  assert.equal(r.state.reason, 'cancel');
});

test('S22 WITHLATESTFROM MODEL: invalid index, stopped input and stale auxiliary are illegal', () => {
  const m = createWithLatestFromModel(), p = execute(m, [start]).state;
  for (const e of [aux(-1, 'x'), aux(2, 'x'), aux(0.5, 'x'),
    { type: 'aux.complete', index: 2 }, { type: 'aux.error', index: 3, error: 'E' }])
    assert.throws(() => stepModel(m, p, e));
  const done = stepModel(m, p, { type: 'aux.complete', index: 0 }).state;
  assert.throws(() => stepModel(m, done, aux(0, 'late')));
  const stopped = stepModel(m, done, complete).state;
  for (const e of [complete, aux(1, 'late'), next(1), { type: 'cancel' }])
    assert.throws(() => stepModel(m, stopped, e));
});

test('S22 WITHLATESTFROM MODEL: invalid reachable-state invariants rejected before transition', () => {
  const m = createWithLatestFromModel();
  const p = execute(m, [start, aux(0, 'a')]).state;
  for (const bad of [{ ...p, hasValue: [true] }, { ...p, live: [true] },
    { ...p, ready: true }, { ...p, hasValue: [true, 'true'] }]) {
    assert.throws(() => stepModel(m, bad, next(1)));
  }
});

test('S22 WITHLATESTFROM MODEL: first value and latest memory are immutable, including undefined payload', () => {
  const m = createWithLatestFromModel();
  const raw = execute(m, [start]).state;
  const before = Object.freeze({ ...raw, latest: Object.freeze(raw.latest),
    hasValue: Object.freeze(raw.hasValue), live: Object.freeze(raw.live) });
  const r = stepModel(m, before, aux(0, undefined));
  assert.deepEqual(before.hasValue, [false, false]); assert.deepEqual(r.state.hasValue, [true, false]);
});

test('S22 WITHLATESTFROM MODEL: both canonical histories yield legal traces', () => {
  const m = createWithLatestFromModel();
  for (const events of [withLatestFromExample, withLatestFromEmptyExample]) {
    const r = runTrace(m, events, { executionId: 'session22-latest' });
    assert.equal(r.status, 'finished-input'); assert.equal(r.state.phase, 'Closed');
  }
});

test('S22 WITHLATESTFROM MODEL: every guarded rule witnessed by legal input histories', () => {
  const m = createWithLatestFromModel();
  const all = [
    [start, next(1), aux(0, 'a'), aux(1, 'b'), next(2),
      { type: 'aux.complete', index: 1 }, complete],
    [start, { type: 'source.error', error: 'e' }],
    [start, { type: 'aux.error', index: 0, error: 'e' }],
    [start, { type: 'cancel' }],
  ];
  const witnessed = new Set(all.flatMap(events => execute(m, events).rules));
  assert.deepEqual([...witnessed].sort(), m.rules.map(r => r.description.id).sort());
  console.log('SESSION22_WITHLATESTFROM_RULE_WITNESSES', witnessed.size);
});
