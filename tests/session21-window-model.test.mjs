import test from 'node:test';
import assert from 'node:assert/strict';
import { runTrace, stepModel, toManifest, validateModel } from '../dist/runner.js';
import { createWindowModel, windowExample, windowBoundaryCompleteExample, windowCancelExample } from '../dist/models/session21-window.js';

const model = createWindowModel();
const start = { type: 'subscribe' };
const attach = (observerId, windowId = 0) => ({ type: 'window.subscribe', observerId, windowId });
const detach = observerId => ({ type: 'window.unsubscribe', observerId });
const ref = id => ({ id, generation: 0 });
const sub = id => ({ type: 'subscribe', resource: ref(id) });
const unsub = id => ({ type: 'unsubscribe', resource: ref(id) });
const notify = (target, notification) => ({ type: 'notify', target, notification });
const execute = events => {
  let state = model.initialState(); const actions = [], rules = [];
  for (const e of events) { const r = stepModel(model, state, e); state = r.state; actions.push(...r.actions); rules.push(r.ruleId); }
  return { state, actions, rules };
};

test('S21 WINDOW MODEL: initial handle precedes source and boundary acquisition', () => {
  assert.deepEqual(validateModel(model), []);
  assert.deepEqual(model.initialState(), { phase: 'Unsubscribed' });
  assert.deepEqual(execute([start]).actions, [notify('downstream', { kind: 'N', value: { windowId: 0 } }), sub('source'), sub('boundary')]);
  const manifest = toManifest(model);
  assert.equal(manifest.metadata.evidence.record, 'evidence/SESSION-21.md');
  assert.equal(manifest.metadata.controls.find(c => c.id === 'Stopped').terminal, false);
  assert.match(manifest.metadata.cardinality.signature, /Cω/);
});

test('S21 WINDOW MODEL: current consumers share identity without replay or extra input acquisition', () => {
  const value = { opaque: true };
  const r = execute([start, { type: 'source.next', value: 'missed' }, attach('A'), attach('B'), { type: 'source.next', value }]);
  const seen = r.actions.filter(a => a.type === 'notify' && a.target !== 'downstream');
  assert.deepEqual(seen, ['A', 'B'].map(id => notify('windowObserver:' + id, { kind: 'N', value })));
  assert.equal(seen[0].notification.value, value);
  assert.equal(seen[1].notification.value, value);
  assert.equal(r.actions.filter(a => a.type === 'subscribe' && a.resource.id === 'source').length, 1);
  assert.equal(r.state.consumers.length, 2);
});

test('S21 WINDOW MODEL: boundary next closes consumers before announcing a new empty handle', () => {
  const before = execute([start, attach('A'), attach('B')]).state;
  const r = stepModel(model, before, { type: 'boundary.next' });
  assert.deepEqual(r.actions, [notify('windowObserver:A', { kind: 'C' }), unsub('windowObserver:A'), notify('windowObserver:B', { kind: 'C' }), unsub('windowObserver:B'), notify('downstream', { kind: 'N', value: { windowId: 1 } })]);
  assert.deepEqual(r.state.windows, [{ windowId: 0, status: 'complete' }, { windowId: 1, status: 'open' }]);
  assert.deepEqual(r.state.consumers, []);
  const empty = stepModel(model, r.state, { type: 'boundary.next' });
  assert.deepEqual(empty.actions, [notify('downstream', { kind: 'N', value: { windowId: 2 } })]);
});

test('S21 WINDOW MODEL: boundary completion releases only boundary; source and current window continue', () => {
  const r = execute([start, attach('A'), { type: 'boundary.complete' }, { type: 'source.next', value: undefined }, { type: 'source.complete' }]);
  assert.equal(r.actions.filter(a => a.type === 'unsubscribe' && a.resource.id === 'boundary').length, 1);
  assert.deepEqual(r.actions.slice(4), [unsub('boundary'), notify('windowObserver:A', { kind: 'N', value: undefined }), notify('windowObserver:A', { kind: 'C' }), unsub('windowObserver:A'), notify('downstream', { kind: 'C' }), unsub('source')]);
});

test('S21 WINDOW MODEL: source completion closes current consumers before outer and input cleanup', () => {
  const before = execute([start, attach('A')]).state;
  const r = stepModel(model, before, { type: 'source.complete' });
  assert.deepEqual(r.actions, [notify('windowObserver:A', { kind: 'C' }), unsub('windowObserver:A'), notify('downstream', { kind: 'C' }), unsub('source'), unsub('boundary')]);
  assert.equal(r.state.phase, 'Stopped');
  assert.equal(r.state.windows[0].status, 'invalid');
  assert.deepEqual(r.state.consumers, []);
});

for (const type of ['source.error', 'boundary.error']) test(`S21 WINDOW MODEL: ${type} preserves error identity and window-before-outer order`, () => {
  const fault = {};
  const r = stepModel(model, execute([start, attach('A')]).state, { type, error: fault });
  assert.deepEqual(r.actions, [notify('windowObserver:A', { kind: 'E', error: fault }), unsub('windowObserver:A'), notify('downstream', { kind: 'E', error: fault }), unsub('source'), unsub('boundary')]);
  assert.equal(r.actions[0].notification.error, fault);
  assert.equal(r.state.reason, 'error');
});

test('S21 WINDOW MODEL: outer cancellation leaves consumer subscriptions orphaned until explicit close', () => {
  const r = stepModel(model, execute([start, attach('A')]).state, { type: 'cancel' });
  assert.deepEqual(r.actions, [unsub('source'), unsub('boundary')]);
  assert.deepEqual(r.state.consumers, [{ observerId: 'A', windowId: 0 }]);
  assert.equal(r.state.windows[0].status, 'invalid');
  const closed = stepModel(model, r.state, detach('A'));
  assert.deepEqual(closed.actions, [unsub('windowObserver:A')]);
  assert.deepEqual(closed.state.consumers, []);
});

test('S21 WINDOW MODEL: consumer cancellation changes neither source ownership nor its peers', () => {
  const s = execute([start, attach('A'), attach('B'), detach('A')]).state;
  assert.equal(s.phase, 'Active'); assert.equal(s.boundaryLive, true);
  const r = stepModel(model, s, { type: 'source.next', value: null });
  assert.deepEqual(r.actions, [notify('windowObserver:B', { kind: 'N', value: null })]);
});

test('S21 WINDOW MODEL: older completed handles remember only completion before and after outer stop', () => {
  const r = execute([start, { type: 'source.next', value: 'missed' }, { type: 'boundary.next' }, attach('lateA', 0), { type: 'source.complete' }, attach('lateB', 0)]);
  for (const id of ['lateA', 'lateB']) assert.deepEqual(r.actions.filter(a => a.type === 'notify' && a.target === 'windowObserver:' + id), [notify('windowObserver:' + id, { kind: 'C' })]);
  assert.equal(r.state.windows[0].status, 'complete');
  assert.equal(r.state.windows[1].status, 'invalid');
});

test('S21 WINDOW MODEL: unknown handles, reused observers, stale boundary and stopped source events are illegal', () => {
  const active = execute([start, attach('A')]).state;
  for (const e of [attach('A'), attach('missing', 3), attach('', 0), detach('missing')]) assert.throws(() => stepModel(model, active, e));
  const noBoundary = stepModel(model, active, { type: 'boundary.complete' }).state;
  for (const e of [{ type: 'boundary.next' }, { type: 'boundary.complete' }, { type: 'boundary.error', error: 'E' }]) assert.throws(() => stepModel(model, noBoundary, e));
  const stopped = stepModel(model, active, { type: 'cancel' }).state;
  for (const e of [{ type: 'source.next', value: 1 }, { type: 'source.complete' }, { type: 'cancel' }, attach('lateCurrent', 0)]) assert.throws(() => stepModel(model, stopped, e));
});

test('S21 WINDOW MODEL: current status, identity and consumer ownership constraints reject malformed states', () => {
  const s = execute([start, attach('A')]).state;
  for (const bad of [
    { ...s, current: -1 }, { ...s, windows: [] }, { ...s, windows: [{ windowId: 0, status: 'complete' }] },
    { ...s, usedObservers: ['A', 'A'] }, { ...s, consumers: [{ observerId: 'missing', windowId: 0 }] },
    { ...s, consumers: [{ observerId: 'A', windowId: 1 }] },
    { ...s, phase: 'Stopped', reason: 'complete' },
  ]) assert.throws(() => stepModel(model, bad, { type: 'source.next', value: 1 }));
});

test('S21 WINDOW MODEL: consumer registration and rotation leave prior immutable state unchanged', () => {
  const raw = execute([start, attach('A')]).state;
  const s = Object.freeze({ ...raw, windows: Object.freeze(raw.windows.map(Object.freeze)), consumers: Object.freeze(raw.consumers.map(Object.freeze)), usedObservers: Object.freeze(raw.usedObservers) });
  const r = stepModel(model, s, { type: 'boundary.next' });
  assert.equal(s.current, 0); assert.equal(s.windows[0].status, 'open'); assert.equal(s.consumers.length, 1);
  assert.equal(r.state.current, 1); assert.equal(r.state.windows[0].status, 'complete');
});

test('S21 WINDOW MODEL: three canonical histories are executable and cover rotation, continuing source and orphan cleanup', () => {
  for (const [i, inputs] of [windowExample, windowBoundaryCompleteExample, windowCancelExample].entries()) {
    const trace = runTrace(model, inputs, { executionId: 'window-example-' + i });
    assert.equal(trace.status, 'finished-input'); assert.equal(trace.state.phase, 'Stopped');
    assert.deepEqual(trace.state.consumers, []);
  }
});

test('S21 WINDOW REACHABILITY: explicit legal prefixes witness every retained guarded rule', () => {
  const paths = [
    [start, attach('A'), { type: 'source.next', value: 'V' }, detach('A'), { type: 'boundary.next' }, attach('late', 0), { type: 'source.complete' }, attach('later', 0)],
    [start, attach('A'), { type: 'boundary.complete' }, { type: 'cancel' }, detach('A')],
    [start, attach('A'), { type: 'source.error', error: 'E' }],
    [start, attach('A'), { type: 'boundary.error', error: 'E' }],
  ];
  const witnessed = new Set(paths.flatMap(p => execute(p).rules));
  assert.deepEqual([...witnessed].sort(), model.rules.map(r => r.description.id).sort());
  console.log('SESSION21_WINDOW_RULE_WITNESSES', witnessed.size);
});
