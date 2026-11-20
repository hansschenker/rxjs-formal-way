import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, validateModel, toManifest } from '../dist/runner.js';
import { createWindowTimeModel, runWindowTimeTrace, windowTimeExample, windowTimeOverlapExample,
  windowTimeGapExample, windowTimeCancelExample } from '../dist/models/session22-windowTime.js';

const input = (now, type, extra = {}) => ({ time: now, event: { type, now, ...extra } });
const start = input(0, 'subscribe');
const attach = (now, observerId, windowId = 0) => input(now, 'window.subscribe', { observerId, windowId });
const next = (now, value) => input(now, 'source.next', { value });
const close = (now, generation = 0) => input(now, 'timer.window', { resource: { id: 'windowClose', generation } });
const create = (now, tick = 0) => input(now, 'timer.creation', { resource: { id: 'windowCreation', generation: 0 }, tick });
const run = (model, events) => runWindowTimeTrace(model, events, { executionId: 'windowTime-model' });
const actions = trace => trace.steps.flatMap(x => x.actions);
const words = step => step.actions.map(a => a.type === 'notify' ? [a.target, a.notification.kind, a.notification.value] : [a.type, a.resource.id, a.resource.generation]);

test('S22 MODEL windowTime: declared profiles and generated examples validate without effects', () => {
  for (const [model, example] of [[createWindowTimeModel(4), windowTimeExample], [createWindowTimeModel(5, 2, 2), windowTimeOverlapExample],
    [createWindowTimeModel(2, 4), windowTimeGapExample], [createWindowTimeModel(5), windowTimeCancelExample]]) {
    assert.deepEqual(validateModel(model), []); assert.equal(toManifest(model).metadata.operator, 'windowTime');
    assert.equal(model.metadata.evidence.record, 'evidence/SESSION-22.md'); assert.equal(run(model, example).state.phase, 'Stopped');
  }
});
test('S22 MODEL windowTime: constructor rejects unsupported durations, intervals and limits', () => {
  for (const bad of [-1, 0, 0.5, NaN, Infinity, 1001]) {
    assert.throws(() => createWindowTimeModel(bad), RangeError);
    assert.throws(() => createWindowTimeModel(4, bad), RangeError);
    assert.throws(() => createWindowTimeModel(4, null, bad), RangeError);
  }
  assert.deepEqual(createWindowTimeModel(4).parameters, { span: 4, creationInterval: null, maxSize: null });
});
test('S22 MODEL windowTime: periodic setup orders creation schedule, handle, window timer and source', () => {
  const r = run(createWindowTimeModel(5, 2), [start]);
  assert.deepEqual(words(r.steps[0]), [['schedule', 'windowCreation', 0], ['downstream', 'N', { windowId: 0 }],
    ['schedule', 'windowClose', 0], ['subscribe', 'source', 0]]);
  assert.deepEqual(r.state.creation, { tick: 0, due: 2 }); assert.equal(r.state.windows[0].deadline, 5);
});
test('S22 MODEL windowTime: sequential timer completes old consumers and schedules successor', () => {
  const r = run(createWindowTimeModel(4), [start, attach(0, 'A'), close(4)]);
  assert.deepEqual(words(r.steps[2]), [['windowObserver:A', 'C', undefined], ['unsubscribe', 'windowObserver:A', 0],
    ['cancel-timer', 'windowClose', 0], ['downstream', 'N', { windowId: 1 }], ['schedule', 'windowClose', 1]]);
  assert.equal(r.state.windows[1].deadline, 8); assert.equal(r.state.windows[0].status, 'complete');
});
test('S22 MODEL windowTime: size closure restarts time and excludes the closing value from successor', () => {
  const r = run(createWindowTimeModel(5, null, 1), [start, attach(0, 'A'), next(2, 'last')]);
  assert.deepEqual(words(r.steps[2]), [['windowObserver:A', 'N', 'last'], ['windowObserver:A', 'C', undefined],
    ['unsubscribe', 'windowObserver:A', 0], ['cancel-timer', 'windowClose', 0], ['downstream', 'N', { windowId: 1 }], ['schedule', 'windowClose', 1]]);
  assert.equal(r.state.windows[1].seen, 0); assert.equal(r.state.windows[1].deadline, 7);
});
test('S22 MODEL windowTime: overlapping delivery closes the earlier full window before the later delivery', () => {
  const r = run(createWindowTimeModel(5, 2, 2), [start, attach(0, 'A'), next(1, 'a'), create(2), attach(2, 'B', 1), next(3, 'b')]);
  assert.deepEqual(words(r.steps[5]), [['windowObserver:A', 'N', 'b'], ['windowObserver:A', 'C', undefined],
    ['unsubscribe', 'windowObserver:A', 0], ['cancel-timer', 'windowClose', 0], ['windowObserver:B', 'N', 'b']]);
  assert.equal(r.state.nextWindowId, 2);
});
test('S22 MODEL windowTime: periodic gaps have no observers to receive a source value', () => {
  const r = run(createWindowTimeModel(2, 4), [start, close(2), next(3, 'discarded'), create(4)]);
  assert.deepEqual(r.steps[2].actions, []); assert.equal(r.state.windows[1].seen, 0);
  assert.deepEqual(words(r.steps[3]), [['downstream', 'N', { windowId: 1 }], ['schedule', 'windowClose', 1], ['schedule', 'windowCreation', 0]]);
});
test('S22 MODEL windowTime: creation timer rejects early, stale and foreign ticks', () => {
  const model = createWindowTimeModel(5, 2), prefix = [start, create(2)];
  for (const e of [create(3, 1), create(4, 0), create(4, 2), input(4, 'timer.creation', { resource: { id: 'foreign', generation: 0 }, tick: 1 })])
    assert.throws(() => run(model, [...prefix, e]), /illegal/);
  assert.throws(() => run(createWindowTimeModel(5), [start, create(3)]), /illegal/);
});
test('S22 MODEL windowTime: window timer rejects early delivery, stale generation and nonexistent windows', () => {
  const model = createWindowTimeModel(3);
  assert.throws(() => run(model, [start, close(2)]), /illegal/);
  assert.throws(() => run(model, [start, close(3), close(4)]), /illegal/);
  assert.throws(() => run(model, [start, close(4, 10)]), /illegal/);
});
test('S22 MODEL windowTime: delayed timer delivery starts successor duration from actual supplied now', () => {
  const sequential = run(createWindowTimeModel(3), [start, next(4, 'before-delivery'), close(5)]);
  assert.equal(sequential.state.windows[1].openedAt, 5); assert.equal(sequential.state.windows[1].deadline, 8);
  const periodic = run(createWindowTimeModel(5, 2), [start, create(3)]);
  assert.deepEqual(periodic.state.creation, { tick: 1, due: 5 }); assert.equal(periodic.state.windows[1].deadline, 8);
});
test('S22 MODEL windowTime: event time must match envelope and cannot move backwards', () => {
  assert.throws(() => run(createWindowTimeModel(3), [{ time: 0, event: { type: 'subscribe', now: 1 } }]), /envelope/);
  const model = createWindowTimeModel(3), state = run(model, [start, next(2, 'x')]).state;
  assert.throws(() => stepModel(model, state, { type: 'source.complete', now: 1 }), /illegal/);
  assert.throws(() => run(model, [input(Number.MAX_SAFE_INTEGER, 'subscribe')]), /illegal/);
});
test('S22 MODEL windowTime: terminal cleanup respects initial timer, source, then later timer registration', () => {
  const model = createWindowTimeModel(5, 2), r = run(model, [start, attach(0, 'A'), create(2), attach(2, 'B', 1), input(3, 'source.complete')]);
  assert.deepEqual(words(r.steps[4]), [['windowObserver:A', 'C', undefined], ['unsubscribe', 'windowObserver:A', 0],
    ['windowObserver:B', 'C', undefined], ['unsubscribe', 'windowObserver:B', 0], ['downstream', 'C', undefined],
    ['cancel-timer', 'windowCreation', 0], ['cancel-timer', 'windowClose', 0], ['unsubscribe', 'source', 0], ['cancel-timer', 'windowClose', 1]]);
});
test('S22 MODEL windowTime: cancellation retains silent open child handles and independent observers', () => {
  const model = createWindowTimeModel(5), r = run(model, windowTimeCancelExample);
  assert.equal(r.state.windows[0].status, 'open'); assert.equal(r.state.windows[0].deadline, null);
  assert.deepEqual(words(r.steps[3]), [['cancel-timer', 'windowClose', 0], ['unsubscribe', 'source', 0]]);
  assert.deepEqual(r.state.consumers, []); assert.equal(r.state.reason, 'cancel');
});
test('S22 MODEL windowTime: historical complete and failed handles retain distinct terminals by error identity', () => {
  const fault = {}, model = createWindowTimeModel(2);
  const r = run(model, [start, close(2), input(3, 'source.error', { error: fault }), attach(4, 'old', 0), attach(4, 'failed', 1)]);
  assert.equal(r.steps[3].actions[1].notification.kind, 'C');
  assert.equal(r.steps[4].actions[1].notification.error, fault); assert.deepEqual(r.state.consumers, []);
});
test('S22 MODEL windowTime: payload identity is retained and late subscribers see no replay', () => {
  const payload = {}, r = run(createWindowTimeModel(5), [start, next(1, 'past'), attach(2, 'A'), next(3, payload)]);
  assert.equal(r.steps[2].actions.length, 1); assert.equal(r.steps[3].actions[0].notification.value, payload);
});
test('S22 MODEL windowTime: child disposal touches only its own connection', () => {
  const r = run(createWindowTimeModel(5), [start, attach(0, 'A'), attach(0, 'B'), input(1, 'window.unsubscribe', { observerId: 'A' }), next(2, 'x')]);
  assert.deepEqual(words(r.steps[3]), [['unsubscribe', 'windowObserver:A', 0]]);
  assert.deepEqual(words(r.steps[4]), [['windowObserver:B', 'N', 'x']]);
});
test('S22 MODEL windowTime: invalid registry, deadline, consumer and timer states are rejected', () => {
  const model = createWindowTimeModel(5, 2, 2), state = run(model, [start]).state;
  const invalid = [
    { ...state, nextWindowId: 3 }, { ...state, creation: null }, { ...state, creation: { tick: 1, due: 2 } },
    { ...state, creation: { tick: 0, due: 3 } },
    { ...state, windows: [{ ...state.windows[0], deadline: 4 }] },
    { ...state, windows: [{ ...state.windows[0], seen: 2 }] },
    { ...state, windows: [{ ...state.windows[0], status: 'error' }] },
    { ...state, usedObservers: ['A', 'A'] }, { ...state, consumers: [{ observerId: 'missing', windowId: 0 }] },
  ];
  for (const bad of invalid) assert.ok(model.validateState(bad, model.parameters).length);
  const stopped = run(model, [start, input(1, 'cancel')]).state;
  assert.ok(model.validateState({ ...stopped, creation: { tick: 0, due: 2 } }, model.parameters).length);
});
test('S22 MODEL windowTime: stale observer identities and source/timer delivery after outer stop are illegal', () => {
  const model = createWindowTimeModel(4), prefix = [start, attach(0, 'A'), input(1, 'cancel')];
  for (const e of [attach(2, 'A'), next(2, 'late'), close(4), input(2, 'source.complete')]) assert.throws(() => run(model, [...prefix, e]), /illegal/);
  assert.equal(model.metadata.controls.find(c => c.id === 'Stopped').terminal, false);
});
test('S22 MODEL windowTime: frozen inputs and before-state are not mutated by pure transitions', () => {
  const model = createWindowTimeModel(5, 2), before = run(model, [start]).state;
  Object.freeze(before.windows[0]); Object.freeze(before.windows); Object.freeze(before.consumers); Object.freeze(before);
  const event = Object.freeze({ type: 'source.next', now: 1, value: Object.freeze({ x: 1 }) });
  const result = stepModel(model, before, event);
  assert.equal(before.windows[0].seen, 0); assert.equal(result.state.windows[0].seen, 1); assert.notEqual(result.state, before);
  assert.deepEqual(model.initialState(), { phase: 'Unsubscribed' });
});
test('S22 MODEL windowTime: finite legal witnesses exercise every retained rule', () => {
  const model = createWindowTimeModel(5, 2, 1), witnesses = [
    [start, attach(0, 'A'), input(0, 'window.unsubscribe', { observerId: 'A' }), next(1, 'x'), attach(1, 'old', 0), create(2), create(4, 1), create(6, 2), close(7, 1), input(8, 'source.complete'), attach(9, 'last', 1)],
    [start, attach(0, 'B'), input(1, 'source.error', { error: 'fault' }), attach(2, 'failed', 0)],
    [start, attach(0, 'C'), input(1, 'cancel'), attach(2, 'orphan', 0), input(3, 'window.unsubscribe', { observerId: 'C' }), input(3, 'window.unsubscribe', { observerId: 'orphan' })],
  ];
  const covered = new Set(witnesses.flatMap(events => run(model, events).steps.map(s => s.ruleId)));
  assert.deepEqual([...covered].sort(), model.rules.map(r => r.description.id).sort());
  assert.equal(covered.size, 14);
});
