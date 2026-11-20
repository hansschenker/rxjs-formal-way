import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, runTrace, validateModel, toManifest } from '../dist/runner.js';
import { createZipWithModel, zipWithExample, zipWithDrainExample, zipWithCancelExample } from '../dist/models/session23-zipWith.js';

const start = { type: 'subscribe' }, cancel = { type: 'cancel' };
const next = (index, value) => ({ type: 'input.next', index, value });
const complete = index => ({ type: 'input.complete', index });
const error = (index, fault) => ({ type: 'input.error', index, error: fault });
const connection = (type, index) => ({ type, resource: { id: 'input:' + index, generation: 0 } });
const sub = i => connection('subscribe', i), unsub = i => connection('unsubscribe', i);
const notify = notification => ({ type: 'notify', target: 'downstream', notification });
const execute = (model, events) => {
  let state = model.initialState(); const actions = [], rules = [];
  for (const event of events) { const r = stepModel(model, state, event); state = r.state; actions.push(...r.actions); rules.push(r.ruleId); }
  return { state, actions, rules };
};
const outputs = result => result.actions.filter(a => a.type === 'notify');

test('S23 ZIPWITH MODEL: independent export metadata uses the shared pinned FIFO kernel and obligations', () => {
  for (const n of [1, 2, 3, 16]) {
    const m = createZipWithModel(n, 8); assert.deepEqual(validateModel(m), []);
    const manifest = toManifest(m);
    assert.equal(manifest.metadata.operator, 'zipWith'); assert.equal(manifest.metadata.rxjsVersion, '7.8.2');
    assert.equal(manifest.metadata.evidence.record, 'evidence/SESSION-23.md');
    assert.ok(manifest.rules.every(r => r.id.startsWith('S23-ZIPWITH-') && r.guard && r.obligations.length));
    assert.ok(manifest.metadata.sources.some(s => s.url.endsWith('/src/internal/operators/zipWith.ts')));
  }
});

test('S23 ZIPWITH MODEL: parameter bounds are explicit model scope', () => {
  for (const n of [0, -1, 1.5, NaN, Infinity, 17]) assert.throws(() => createZipWithModel(n, 8), RangeError);
  for (const bound of [0, -1, 1.5, NaN, Infinity, 33]) assert.throws(() => createZipWithModel(2, bound), RangeError);
  assert.deepEqual(validateModel(createZipWithModel(16, 32)), []);
});

test('S23 ZIPWITH MODEL: first result connection acquires indexed source first, then arguments', () => {
  const r = execute(createZipWithModel(), [start]);
  assert.deepEqual(r.actions, [sub(0), sub(1), sub(2)]);
  assert.deepEqual(r.state.queues, [[], [], []]); assert.deepEqual(r.state.received, [0, 0, 0]); assert.equal(r.state.emitted, 0);
});

test('S23 ZIPWITH MODEL: uneven arrivals preserve FIFO and emit only with every member present', () => {
  const r = execute(createZipWithModel(), [start, next(0, 'A1'), next(0, 'A2'), next(1, 'B1'), next(2, 'C1'), next(2, 'C2'), next(1, 'B2')]);
  assert.deepEqual(outputs(r), [notify({ kind: 'N', value: ['A1', 'B1', 'C1'] }), notify({ kind: 'N', value: ['A2', 'B2', 'C2'] })]);
  assert.equal(r.state.emitted, 2); assert.deepEqual(r.state.queues, [[], [], []]);
});

test('S23 ZIPWITH MODEL: a completed buffer remains until its last value is paired', () => {
  const r = execute(createZipWithModel(2), [start, next(0, 'A1'), next(0, 'A2'), complete(0), next(1, 1), next(1, 2)]);
  assert.deepEqual(r.actions, [sub(0), sub(1), unsub(0), notify({ kind: 'N', value: ['A1', 1] }), notify({ kind: 'N', value: ['A2', 2] }), notify({ kind: 'C' }), unsub(1)]);
  assert.deepEqual(r.state, { phase: 'Closed', reason: 'exhausted' });
});

test('S23 ZIPWITH MODEL: empty completion immediately closes without a partial tuple', () => {
  for (const i of [0, 1, 2]) {
    const r = execute(createZipWithModel(), [start, complete(i)]);
    assert.deepEqual(r.actions, [sub(0), sub(1), sub(2), notify({ kind: 'C' }), unsub(0), unsub(1), unsub(2)]);
  }
});

test('S23 ZIPWITH MODEL: each failure preserves error identity and discards unmatched buffers', () => {
  const fault = {};
  for (const i of [0, 1, 2]) {
    const r = execute(createZipWithModel(), [start, next(0, 'held'), error(i, fault)]);
    assert.deepEqual(outputs(r), [notify({ kind: 'E', error: fault })]);
    assert.equal(outputs(r)[0].notification.error, fault);
    assert.deepEqual(r.actions.slice(-3), [unsub(0), unsub(1), unsub(2)]);
    assert.deepEqual(r.state, { phase: 'Closed', reason: 'error' });
  }
});

test('S23 ZIPWITH MODEL: cancellation emits no terminal and releases only still-live inputs', () => {
  const r = execute(createZipWithModel(), [start, next(1, 'buffered'), complete(1), cancel]);
  assert.deepEqual(r.actions, [sub(0), sub(1), sub(2), unsub(1), unsub(0), unsub(2)]);
  assert.deepEqual(r.state, { phase: 'Closed', reason: 'cancel' });
});

test('S23 ZIPWITH MODEL: no auxiliary input produces singleton arrays, preserving payload identity', () => {
  const value = Object.freeze({ id: 'opaque' });
  const r = execute(createZipWithModel(1), [start, next(0, undefined), next(0, null), next(0, value), complete(0)]);
  assert.deepEqual(outputs(r), [notify({ kind: 'N', value: [undefined] }), notify({ kind: 'N', value: [null] }), notify({ kind: 'N', value: [value] }), notify({ kind: 'C' })]);
  assert.equal(outputs(r)[2].notification.value[0], value);
});

test('S23 ZIPWITH MODEL: invalid input addresses, completed inputs and stopped executions are rejected', () => {
  const m = createZipWithModel(2); const active = execute(m, [start]).state;
  for (const index of [-1, 2, 0.5, NaN, Infinity]) for (const event of [next(index, 1), complete(index), error(index, 'x')])
    assert.throws(() => stepModel(m, active, event));
  const retained = execute(m, [start, next(0, 1), complete(0)]).state;
  for (const event of [next(0, 2), complete(0), error(0, 'late')]) assert.throws(() => stepModel(m, retained, event));
  const stopped = stepModel(m, active, cancel).state;
  for (const event of [start, cancel, next(0, 1), complete(0), error(1, 'late')]) assert.throws(() => stepModel(m, stopped, event));
});

test('S23 ZIPWITH MODEL: forged queue, liveness and count histories cannot pass state validation', () => {
  const m = createZipWithModel(2); const s = execute(m, [start]).state;
  const invalid = [
    { ...s, queues: [[]] }, { ...s, live: [true] }, { ...s, received: [0] },
    { ...s, queues: [[1], [2]], received: [1, 1] }, { ...s, live: [false, true] },
    { ...s, queues: [[1], []], received: [0, 0] }, { ...s, received: [1, 0] },
    { ...s, emitted: -1 }, { ...s, emitted: 0.5 }, { ...s, live: [true, 'true'] },
    { ...s, queues: [Array(9).fill(1), []], received: [9, 0] },
  ];
  for (const state of invalid) assert.throws(() => stepModel(m, state, cancel));
});

test('S23 ZIPWITH MODEL: model FIFO scope rejects growth beyond bound without inventing an overflow notification', () => {
  const m = createZipWithModel(2, 1); const full = execute(m, [start, next(0, 'held')]).state;
  assert.throws(() => stepModel(m, full, next(0, 'outside-scope')));
  const result = stepModel(m, full, next(1, 'partner'));
  assert.deepEqual(result.actions, [notify({ kind: 'N', value: ['held', 'partner'] })]);
});

test('S23 ZIPWITH MODEL: queued references are retained and immutable snapshots survive transitions', () => {
  const value = Object.freeze({ id: 1 }); const m = createZipWithModel(2);
  const raw = execute(m, [start, next(0, value)]).state;
  const before = Object.freeze({ ...raw, queues: Object.freeze(raw.queues.map(q => Object.freeze(q))), live: Object.freeze(raw.live), received: Object.freeze(raw.received) });
  const result = stepModel(m, before, next(1, undefined));
  assert.deepEqual(before.queues, [[value], []]); assert.equal(result.actions[0].notification.value[0], value);
  assert.deepEqual(result.state.queues, [[], []]); assert.deepEqual(before.received, [1, 0]);
});

test('S23 ZIPWITH MODEL: separate initializations have independent FIFO arrays and counters', () => {
  const m = createZipWithModel(2); const a = execute(m, [start]).state, b = execute(m, [start]).state;
  assert.notEqual(a.queues, b.queues); assert.notEqual(a.queues[0], b.queues[0]);
  const nextA = stepModel(m, a, next(0, 'A')).state; assert.deepEqual(nextA.queues, [['A'], []]); assert.deepEqual(b.queues, [[], []]);
});

test('S23 ZIPWITH MODEL: all three configured examples are legal complete histories', () => {
  for (const inputs of [zipWithExample, zipWithDrainExample, zipWithCancelExample]) {
    const trace = runTrace(createZipWithModel(), inputs, { executionId: 'zipWith-example' });
    assert.equal(trace.status, 'finished-input'); assert.equal(trace.state.phase, 'Closed');
  }
});

test('S23 ZIPWITH MODEL: legal histories witness each retained guarded rule', () => {
  const m = createZipWithModel(2); const witnessed = new Set();
  const histories = [
    [start, next(0, 1), next(1, 2), complete(0)],
    [start, next(0, 1), complete(0), next(1, 2)],
    [start, error(1, 'error')], [start, cancel],
  ];
  for (const events of histories) for (const id of execute(m, events).rules) witnessed.add(id);
  assert.deepEqual([...witnessed].sort(), m.rules.map(r => r.description.id).sort());
  assert.equal(witnessed.size, 8); console.log('SESSION23_ZIPWITH_RULE_WITNESSES', witnessed.size);
});
