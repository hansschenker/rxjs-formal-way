import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, validateModel, toManifest } from '../dist/runner.js';
import { createWindowWhenModel, runWindowWhenTrace, windowWhenExample, windowWhenCompleteExample, windowWhenCancelExample } from '../dist/models/session22-windowWhen.js';

const model = () => createWindowWhenModel();
const start = [{ type: 'subscribe' }, { type: 'factory.return', generation: 0 }];
const attach = (observerId, windowId = 0) => ({ type: 'window.subscribe', observerId, windowId });
const rotate = (generation = 0, kind = 'next') => [{ type: 'closing.' + kind, generation }, { type: 'factory.return', generation: generation + 1 }];
const ref = (id, generation = 0) => ({ id, generation });
const sub = (id, generation = 0) => ({ type: 'subscribe', resource: ref(id, generation) });
const unsub = (id, generation = 0) => ({ type: 'unsubscribe', resource: ref(id, generation) });
const notice = (target, notification) => ({ type: 'notify', target, notification });
const child = (id, notification) => notice('windowObserver:' + id, notification);
const trace = events => runWindowWhenTrace(model(), events.map(event => ({ time: 0, event })), { executionId: 'windowWhen-model' });
const last = events => trace(events).steps.at(-1);

test('S22 MODEL windowWhen: metadata and one-profile generated histories validate', () => {
  const m = model(); assert.deepEqual(validateModel(m), []);
  assert.equal(m.metadata.cardinality.signature, 'windowWhen : (() → U*) → T* → (T*)*');
  assert.equal(m.metadata.evidence.record, 'evidence/SESSION-22.md');
  assert.equal(m.metadata.controls.find(c => c.id === 'Stopped').terminal, false);
  assert.equal(toManifest(m).rules.length, 17);
  for (const inputs of [windowWhenExample, windowWhenCompleteExample, windowWhenCancelExample])
    assert.equal(runWindowWhenTrace(m, inputs, { executionId: 'example' }).state.phase, 'Stopped');
});

test('S22 MODEL windowWhen: initial handle and factory request precede both inputs', () => {
  const t = trace(start);
  assert.deepEqual(t.steps[0].actions, [notice('downstream', { kind: 'N', value: { windowId: 0 } }),
    { type: 'invoke-callback', resource: ref('closingSelector', 0), index: 0, value: undefined }]);
  assert.deepEqual(t.steps[1].actions, [sub('closing', 0), sub('source')]);
});

test('S22 MODEL windowWhen: opaque values reach current consumers in attachment order without replay', () => {
  const payload = { opaque: 1 };
  const t = trace([...start, { type: 'source.next', value: 'missed' }, attach('A'), attach('B'), { type: 'source.next', value: payload }]);
  assert.deepEqual(t.steps[2].actions, []);
  assert.deepEqual(t.steps.at(-1).actions, [child('A', { kind: 'N', value: payload }), child('B', { kind: 'N', value: payload })]);
  assert.equal(t.steps.at(-1).actions[0].notification.value, payload);
});

test('S22 MODEL windowWhen: next and completion unsubscribe closer before child terminal and successor', () => {
  for (const kind of ['next', 'complete']) {
    const step = last([...start, attach('A'), { type: 'closing.' + kind, generation: 0 }]);
    assert.deepEqual(step.actions, [unsub('closing'), child('A', { kind: 'C' }), unsub('windowObserver:A'),
      notice('downstream', { kind: 'N', value: { windowId: 1 } }),
      { type: 'invoke-callback', resource: ref('closingSelector', 1), index: 1, value: undefined }]);
    assert.equal(step.after.phase, 'Selecting'); assert.equal(step.after.sourceConnected, true);
    assert.deepEqual(step.after.consumers, []);
  }
});

test('S22 MODEL windowWhen: replacement factory return does not reacquire source', () => {
  assert.deepEqual(last([...start, ...rotate()]).actions, [sub('closing', 1)]);
});

test('S22 MODEL windowWhen: current closing generation is required and factory outcome cannot be interleaved', () => {
  for (const event of [{ type: 'closing.next', generation: 9 }, { type: 'closing.complete', generation: 9 },
    { type: 'closing.error', generation: -1, error: {} }, { type: 'factory.return', generation: 0 }])
    assert.throws(() => trace([...start, event]), /illegal transition/);
  for (const event of [{ type: 'source.next', value: 1 }, { type: 'cancel' }, attach('A'), { type: 'factory.return', generation: 1 }])
    assert.throws(() => trace([{ type: 'subscribe' }, event]), /illegal transition/);
});

test('S22 MODEL windowWhen: source completion ends children before outer and uses generation-dependent cleanup', () => {
  for (const generation of [0, 1]) {
    const events = [...start, ...(generation ? rotate() : []), attach('A', generation), { type: 'source.complete' }];
    const expected = generation ? [unsub('source'), unsub('closing', 1)] : [unsub('closing'), unsub('source')];
    assert.deepEqual(last(events).actions, [child('A', { kind: 'C' }), unsub('windowObserver:A'), notice('downstream', { kind: 'C' }), ...expected]);
    assert.equal(last(events).after.windows[generation].status, 'complete');
  }
});

test('S22 MODEL windowWhen: source and closing failure retain identical error for late current observers', () => {
  const error = { identity: true };
  for (const type of ['source.error', 'closing.error']) {
    const end = type === 'source.error' ? { type, error } : { type, generation: 1, error };
    const t = trace([...start, ...rotate(), attach('A', 1), end, attach('late', 1), attach('old', 0)]);
    const ending = t.steps.at(-3);
    assert.deepEqual(ending.actions, [child('A', { kind: 'E', error }), unsub('windowObserver:A'), notice('downstream', { kind: 'E', error }), unsub('source'), unsub('closing', 1)]);
    assert.equal(t.state.windows[1].error, error);
    assert.deepEqual(t.steps.at(-2).actions, [sub('windowObserver:late'), child('late', { kind: 'E', error }), unsub('windowObserver:late')]);
    assert.deepEqual(t.steps.at(-1).actions, [sub('windowObserver:old'), child('old', { kind: 'C' }), unsub('windowObserver:old')]);
  }
});

test('S22 MODEL windowWhen: initial factory failure records closed-source acquisition and teardown', () => {
  const error = undefined;
  const step = last([{ type: 'subscribe' }, { type: 'factory.throw', generation: 0, error }]);
  assert.deepEqual(step.actions, [notice('downstream', { kind: 'E', error }), sub('source'), unsub('source')]);
  assert.equal(step.after.windows[0].status, 'error'); assert.ok(Object.hasOwn(step.after.windows[0], 'error'));
});

test('S22 MODEL windowWhen: replacement factory failure terminates newly announced window without another closer', () => {
  const error = {};
  const t = trace([...start, attach('A'), { type: 'closing.next', generation: 0 }, { type: 'factory.throw', generation: 1, error }, attach('new', 1)]);
  assert.deepEqual(t.steps.at(-2).actions, [notice('downstream', { kind: 'E', error }), unsub('source')]);
  assert.deepEqual(t.steps.at(-1).actions, [sub('windowObserver:new'), child('new', { kind: 'E', error }), unsub('windowObserver:new')]);
  assert.equal(t.state.windows[0].status, 'complete');
});

test('S22 MODEL windowWhen: outer cancellation retains orphan consumers and permits late open-handle attachment', () => {
  const t = trace([...start, attach('A'), { type: 'cancel' }, attach('late'), { type: 'window.unsubscribe', observerId: 'A' }, { type: 'window.unsubscribe', observerId: 'late' }]);
  assert.deepEqual(t.steps[3].actions, [unsub('closing'), unsub('source')]);
  assert.equal(t.steps[3].after.consumers.length, 1);
  assert.deepEqual(t.steps[4].actions, [sub('windowObserver:late')]);
  assert.deepEqual(t.state.consumers, []);
  assert.equal(t.state.windows[0].status, 'open');
  assert.throws(() => trace([...start, { type: 'cancel' }, { type: 'source.next', value: 1 }]), /illegal transition/);
});

test('S22 MODEL windowWhen: child unsubscribe leaves input ownership and peers untouched', () => {
  const step = last([...start, attach('A'), attach('B'), { type: 'window.unsubscribe', observerId: 'A' }]);
  assert.deepEqual(step.actions, [unsub('windowObserver:A')]);
  assert.deepEqual(step.after.consumers, [{ observerId: 'B', windowId: 0 }]);
});

test('S22 MODEL windowWhen: old completed handles complete late observers during active and stopped phases', () => {
  for (const ending of [[], [{ type: 'cancel' }], [{ type: 'source.complete' }]]) {
    const step = last([...start, ...rotate(), ...ending, attach('old', 0)]);
    assert.deepEqual(step.actions, [sub('windowObserver:old'), child('old', { kind: 'C' }), unsub('windowObserver:old')]);
  }
});

test('S22 MODEL windowWhen: unknown handles, duplicate observers and nonexistent child cancellation are illegal', () => {
  for (const event of [attach('', 0), attach('A', -1), attach('A', 4), { type: 'window.unsubscribe', observerId: 'missing' }])
    assert.throws(() => trace([...start, event]), /illegal transition/);
  assert.throws(() => trace([...start, attach('A'), { type: 'window.unsubscribe', observerId: 'A' }, attach('A')]), /illegal transition/);
});

test('S22 MODEL windowWhen: invalid lifetime, source ownership and consumer registries are rejected', () => {
  const m = model(), active = trace(start).state, selecting = trace([{ type: 'subscribe' }]).state;
  const bad = [
    { ...active, current: 1 }, { ...active, windows: [{ windowId: 3, status: 'open' }] },
    { ...active, windows: [{ windowId: 0, status: 'complete' }] },
    { ...selecting, sourceConnected: true },
    { ...selecting, consumers: [{ observerId: 'A', windowId: 0 }], usedObservers: ['A'] },
    { ...active, consumers: [{ observerId: 'A', windowId: 0 }] },
    { ...active, usedObservers: ['A', 'A'] },
    { ...active, phase: 'Stopped', reason: 'complete' },
    { ...active, phase: 'Stopped', reason: 'factory-error', windows: [{ windowId: 0, status: 'error' }] },
  ];
  for (const state of bad) assert.ok(m.validateState(state, m.parameters).length, JSON.stringify(state));
});

test('S22 MODEL windowWhen: wrapper enforces synchronous factory envelope time and preserves partial-prefix budgets', () => {
  assert.throws(() => runWindowWhenTrace(model(), [{ time: 0, event: { type: 'subscribe' } }, { time: 1, event: { type: 'factory.return', generation: 0 } }], { executionId: 'late' }), /share its invocation/);
  assert.throws(() => runWindowWhenTrace(model(), [{ time: 0, event: { type: 'subscribe' } }, { time: 1, event: { type: 'factory.throw', generation: 0, error: {} } }], { executionId: 'late' }), /share its invocation/);
  const prefix = runWindowWhenTrace(model(), windowWhenExample, { executionId: 'prefix', maxSteps: 1 });
  assert.equal(prefix.status, 'budget-exhausted'); assert.equal(prefix.state.phase, 'Selecting');
});

test('S22 MODEL windowWhen: finite legal witnesses exercise all seventeen retained guarded rules', () => {
  const witnesses = [
    [...start, attach('A'), { type: 'source.next', value: 1 }, { type: 'window.unsubscribe', observerId: 'A' }, ...rotate(), attach('old', 0), attach('B', 1), { type: 'cancel' }, attach('late', 1), { type: 'window.unsubscribe', observerId: 'B' }],
    [...start, ...rotate(0, 'complete'), { type: 'source.complete' }, attach('old', 0)],
    [...start, { type: 'source.error', error: {} }, attach('error', 0)],
    [...start, { type: 'closing.error', generation: 0, error: {} }],
    [{ type: 'subscribe' }, { type: 'factory.throw', generation: 0, error: {} }],
  ];
  const observed = new Set(witnesses.flatMap(events => trace(events).steps.map(s => s.ruleId)));
  assert.deepEqual([...observed].sort(), model().rules.map(r => r.description.id).sort());
});

test('S22 MODEL windowWhen: step evaluation leaves previous states and supplied payloads unchanged', () => {
  const m = model(), s = trace([...start, attach('A')]).state;
  Object.freeze(s.windows); Object.freeze(s.consumers); Object.freeze(s.usedObservers); Object.freeze(s);
  const payload = Object.freeze({ immutable: true });
  assert.equal(stepModel(m, s, { type: 'source.next', value: payload }).actions[0].notification.value, payload);
  const r = stepModel(m, s, { type: 'closing.next', generation: 0 });
  assert.equal(s.current, 0); assert.equal(s.windows[0].status, 'open'); assert.equal(r.state.current, 1);
});
