import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSkipModel, createTakeWhileModel, createSkipWhileModel, createTakeUntilModel, createSkipUntilModel,
  skipExample, takeWhileExample, skipWhileExample, takeUntilExample, skipUntilExample,
  validateModel, stepModel, toManifest, runTrace,
  renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace,
} from '../dist/index.js';
import { at, notifierRef, fault, driveUnary, driveUntil, unaryWords, untilWords, scheduleWord } from './helpers/session05-model.mjs';

const unary = [
  ['skip-0', () => createSkipModel(0)], ['skip-2', () => createSkipModel(2)],
  ['takeWhile-exclusive', () => createTakeWhileModel(false)], ['takeWhile-inclusive', () => createTakeWhileModel(true)],
  ['skipWhile', () => createSkipWhileModel()],
];
const until = [['takeUntil', createTakeUntilModel], ['skipUntil', createSkipUntilModel]];
const callResult = (generation, value) => ({ type: 'callback.return', resource: { id: 'predicate', generation }, value });
const connect = model => stepModel(model, model.initialState(), { type: 'subscribe' }).state;
const outputs = log => log.filter(x => ['N', 'C', 'E'].includes(x[1]));

for (const [name, make] of [...unary, ...until]) {
  test(`S5-MODEL ${name}: canonical identity and every rule survive each generated rule view`, () => {
    const model = make(), manifest = toManifest(model);
    assert.deepEqual(validateModel(model), []);
    assert.equal(JSON.stringify(manifest), JSON.stringify(toManifest(make())));
    for (const render of [renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior]) {
      const text = render(manifest);
      for (const rule of model.rules) assert.ok(text.includes(rule.description.id), rule.description.id);
    }
  });
}

for (const [name, make] of unary) test(`S5-MODEL ${name}: every configured rule is reached through legal prefixes`, () => {
  const model = make(), reached = new Set();
  for (const predicate of [x => x < 2, (_x, i) => { if (i === 1) throw fault; return true; }]) {
    for (const word of unaryWords()) for (const id of driveUnary(model, scheduleWord(word), predicate).rules) reached.add(id);
  }
  assert.deepEqual([...reached].sort(), model.rules.map(r => r.description.id).sort());
});
for (const [name, make] of until) test(`S5-MODEL ${name}: setup and post-setup witnesses reach every rule`, () => {
  const model = make(), reached = new Set();
  for (const initial of [null, at(0, 'notifier.next', { value: undefined }).event, at(0, 'notifier.complete').event, at(0, 'notifier.error', { error: fault }).event]) {
    for (const word of untilWords(name)) for (const id of driveUntil(model, scheduleWord(word), initial).rules) reached.add(id);
  }
  assert.deepEqual([...reached].sort(), model.rules.map(r => r.description.id).sort());
});

test('S5-MODEL skip: literal count boundary, zero-count acquisition, and short source completion', () => {
  assert.deepEqual(driveUnary(createSkipModel(2), scheduleWord([0, 1, 2, 'C'])).log, [
    [0, 'subscribe', 'source', 0], [3, 'N', 2], [4, 'C'], [4, 'unsubscribe', 'source', 0],
  ]);
  assert.deepEqual(driveUnary(createSkipModel(0), []).log, [[0, 'subscribe', 'source', 0]]);
  assert.deepEqual(outputs(driveUnary(createSkipModel(9), scheduleWord([0, 'C'])).log), [[2, 'C']]);
});

test('S5-MODEL skip: invalid count and index domains are rejected without coercion', () => {
  for (const count of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1', undefined]) assert.throws(() => createSkipModel(count));
  const model = createSkipModel(2);
  assert.throws(() => stepModel(model, { phase: 'Active', index: -1 }, { type: 'source.next', value: 1 }));
  assert.throws(() => stepModel(model, { phase: 'Active', index: Number.MAX_SAFE_INTEGER }, { type: 'source.next', value: 1 }), /illegal/);
  assert.equal(stepModel(model, { phase: 'Active', index: Number.MAX_SAFE_INTEGER }, { type: 'source.complete' }).state.phase, 'Closed');
});

test('S5-MODEL takeWhile: false policy is selected by inclusive, while throws never include the value', () => {
  for (const inclusive of [false, true]) {
    const model = createTakeWhileModel(inclusive);
    assert.deepEqual(outputs(driveUnary(model, scheduleWord([0, 2, 1]), x => x < 2).log), inclusive ? [[1, 'N', 0], [2, 'N', 2], [2, 'C']] : [[1, 'N', 0], [2, 'C']]);
    assert.deepEqual(outputs(driveUnary(model, scheduleWord([0]), () => { throw fault; }).log), [[1, 'E', fault]]);
  }
});

test('S5-MODEL skipWhile: first false emits, permanently opens and never calls the predicate again', () => {
  const calls = [];
  const r = driveUnary(createSkipWhileModel(), scheduleWord([0, 2, 0, 'C']), (value, index) => { calls.push([value, index]); return value < 2; });
  assert.deepEqual(calls, [[0, 0], [2, 1]]);
  assert.deepEqual(outputs(r.log), [[2, 'N', 2], [3, 'N', 0], [4, 'C']]);
});

for (const [name, make] of unary.slice(2)) test(`S5-MODEL ${name}: correlated outcomes and non-reentry boundary are enforced`, () => {
  const model = make(), state = connect(model);
  const calling = stepModel(model, state, { type: 'source.next', value: undefined }).state;
  assert.equal(calling.callId, 0);
  assert.ok(Object.hasOwn(calling, 'input'));
  for (const e of [callResult(1, true), { ...callResult(0, true), resource: { id: 'foreign', generation: 0 } }, { type: 'source.next', value: 2 }, { type: 'cancel' }, { type: 'source.complete' }]) {
    assert.throws(() => stepModel(model, calling, e), /illegal/);
  }
  const resolved = stepModel(model, calling, callResult(0, true)).state;
  assert.throws(() => stepModel(model, resolved, callResult(0, true)), /illegal/);
});

test('S5-MODEL predicates: initialization validates binding, inclusive and overflow explicitly', () => {
  for (const id of ['', 'source', 'notifier', 'with space']) assert.throws(() => createSkipWhileModel(id));
  assert.throws(() => createTakeWhileModel('false'));
  const model = createTakeWhileModel();
  assert.throws(() => stepModel(model, { phase: 'Open' }, { type: 'source.next', value: 1 }));
  assert.throws(() => stepModel(model, { phase: 'Testing', index: Number.MAX_SAFE_INTEGER }, { type: 'source.next', value: 1 }), /illegal/);
});

test('S5-MODEL unary: payload identity, undefined, NaN and frozen input state survive', () => {
  for (const value of [undefined, NaN, Object.freeze({ value: 1 })]) {
    const skip = createSkipModel(0), before = Object.freeze(connect(skip));
    const result = stepModel(skip, before, { type: 'source.next', value });
    assert.ok(Object.is(result.actions[0].notification.value, value));
    assert.equal(before.index, 0);
    for (const [make, predicate] of [[createTakeWhileModel, () => ({ truthy: true })], [createSkipWhileModel, () => 0]]) {
      const r = driveUnary(make(), [at(1, 'source.next', { value })], predicate);
      assert.ok(Object.is(outputs(r.log)[0][2], value));
    }
  }
});

test('S5-MODEL unary: cancellation and errors do not synthesize completion', () => {
  for (const [, make] of unary) {
    const cancelled = driveUnary(make(), scheduleWord([0, 'X']), () => true);
    assert.equal(cancelled.state.phase, 'Closed');
    assert.equal(outputs(cancelled.log).some(x => x[1] === 'C'), false);
    assert.deepEqual(outputs(driveUnary(make(), scheduleWord(['E'])).log), [[1, 'E', fault]]);
    assert.throws(() => stepModel(make(), cancelled.state, { type: 'subscribe' }), /illegal/);
  }
});

for (const [name, make] of until) test(`S5-MODEL ${name}: notifier-first setup and silent completion are distinct`, () => {
  const model = make(), s = connect(model);
  assert.equal(s.phase, 'Starting');
  assert.throws(() => stepModel(model, s, { type: 'source.next', value: 1 }), /illegal/);
  const r = driveUntil(model, scheduleWord([1, 'C']), at(0, 'notifier.complete').event);
  assert.deepEqual(r.log.slice(0, 3), [[0, 'subscribe', 'notifier', 0], [0, 'unsubscribe', 'notifier', 0], [0, 'subscribe', 'source', 0]]);
  assert.deepEqual(outputs(r.log), name === 'takeUntil' ? [[1, 'N', 1], [2, 'C']] : [[2, 'C']]);
});

test('S5-MODEL until: synchronous error exposes the closed-source attempt only for skipUntil', () => {
  const initial = at(0, 'notifier.error', { error: fault }).event;
  const take = driveUntil(createTakeUntilModel(), [], initial), skip = driveUntil(createSkipUntilModel(), [], initial);
  assert.deepEqual(take.log, [[0, 'subscribe', 'notifier', 0], [0, 'E', fault], [0, 'unsubscribe', 'notifier', 0]]);
  assert.deepEqual(skip.log, [...take.log, [0, 'subscribe', 'source', 0], [0, 'unsubscribe', 'source', 0]]);
  assert.equal(skip.state.phase, 'Closed');
});

test('S5-MODEL until: notifier payload is irrelevant, including false and undefined', () => {
  for (const value of [false, null, undefined, 0, { token: 'go' }]) {
    assert.deepEqual(outputs(driveUntil(createTakeUntilModel(), [at(1, 'notifier.next', { value })]).log), [[1, 'C']]);
    const r = driveUntil(createSkipUntilModel(), [at(1, 'notifier.next', { value }), at(2, 'source.next', { value: 'source' })]);
    assert.deepEqual(outputs(r.log), [[2, 'N', 'source']]);
  }
});

for (const [name, make] of until) test(`S5-MODEL ${name}: foreign, consumed and post-terminal notifications are illegal`, () => {
  const model = make(), starting = connect(model);
  const active = stepModel(model, starting, { type: 'setup.ready' }).state;
  for (const resource of [{ id: 'other', generation: 0 }, { id: 'notifier', generation: 1 }]) {
    assert.throws(() => stepModel(model, active, { type: 'notifier.next', resource, value: 1 }), /illegal/);
  }
  const noNotifier = stepModel(model, active, { type: 'notifier.complete', resource: notifierRef }).state;
  assert.throws(() => stepModel(model, noNotifier, { type: 'notifier.next', resource: notifierRef, value: 1 }), /illegal/);
  const closed = stepModel(model, noNotifier, { type: 'cancel' }).state;
  assert.throws(() => stepModel(model, closed, { type: 'source.next', value: 2 }), /illegal/);
});

test('S5-MODEL until: equal timestamps need explicit order, not inferred simultaneity', () => {
  const source = at(1, 'source.next', { value: 'a' }), signal = at(1, 'notifier.next', { value: 0 });
  assert.deepEqual(outputs(driveUntil(createTakeUntilModel(), [source, signal]).log), [[1, 'N', 'a'], [1, 'C']]);
  assert.deepEqual(outputs(driveUntil(createTakeUntilModel(), [signal, source]).log), [[1, 'C']]);
  assert.deepEqual(outputs(driveUntil(createSkipUntilModel(), [source, signal]).log), []);
  assert.deepEqual(outputs(driveUntil(createSkipUntilModel(), [signal, source]).log), [[1, 'N', 'a']]);
});

test('S5-MODEL until: malformed gate state and corrupted cleanup are rejected', () => {
  const take = createTakeUntilModel(), skip = createSkipUntilModel();
  assert.throws(() => stepModel(take, { phase: 'Active', open: false, notifierLive: true }, { type: 'source.complete' }));
  assert.throws(() => stepModel(skip, { phase: 'Active', open: true, notifierLive: true }, { type: 'source.complete' }));
  const model = { ...take, rules: take.rules.map(r => r.description.id === 'TAKEUNTIL-CANCEL' ? {
    ...r, react: (s, e, p) => { const result = r.react(s, e, p); return { ...result, actions: result.actions.toReversed() }; },
  } : r) };
  const active = stepModel(model, connect(model), { type: 'setup.ready' }).state;
  assert.throws(() => stepModel(model, active, { type: 'cancel' }), /ordered-action/);
});

test('S5-MODEL: duplicate guards and corrupted payload/action multiplicity are rejected', () => {
  const base = createSkipModel(1), passing = base.rules.find(r => r.description.id === 'SKIP-PASS');
  const duplicate = { ...base, rules: [...base.rules, { ...passing, enabled: () => true }] };
  assert.throws(() => stepModel(duplicate, connect(base), { type: 'source.next', value: 0 }), /ambiguous/);
  const corrupted = { ...base, rules: base.rules.map(r => r.description.id === 'SKIP-PASS' ? {
    ...r, react: (s, e, p) => { const result = r.react(s, e, p); return { ...result, actions: [...result.actions, ...result.actions] }; },
  } : r) };
  assert.throws(() => stepModel(corrupted, { phase: 'Active', index: 1 }, { type: 'source.next', value: 0 }), /ordered-action/);
});

test('S5-MODEL: examples have four lanes, stable same-time order and no executed external effects', () => {
  for (const [model, inputs] of [[createSkipModel(2), skipExample], [createTakeWhileModel(true), takeWhileExample], [createSkipWhileModel(), skipWhileExample], [createTakeUntilModel(), takeUntilExample], [createSkipUntilModel(), skipUntilExample]]) {
    const trace = runTrace(model, inputs, { executionId: 'session5-example-test' });
    assert.equal(trace.state.phase, 'Closed');
    assert.ok(renderTrace(trace).includes('**Model-predicted**'));
    assert.ok(renderTrace(trace).includes('## Four lanes'));
    assert.deepEqual(trace.steps.map(s => s.sequence), inputs.map((_x, i) => i));
    assert.equal(runTrace(model, inputs, { executionId: 'bounded', maxSteps: 1 }).status, 'budget-exhausted');
  }
  const trace = runTrace(createSkipModel(1), [{ time: 0, event: { type: 'subscribe' } }], { executionId: 'live' });
  assert.equal(trace.state.phase, 'Active');
  assert.equal(trace.status, 'finished-input');
});

test('S5-MODEL: independent executions do not share counters, gates or retained input', () => {
  for (const [, make] of [...unary, ...until]) assert.notEqual(make().initialState(), make().initialState());
  const model = createSkipWhileModel(), a = connect(model), b = connect(model);
  const pending = stepModel(model, a, { type: 'source.next', value: 'a' }).state;
  assert.equal(stepModel(model, pending, callResult(0, false)).state.phase, 'Open');
  assert.deepEqual(b, { phase: 'Testing', index: 0 });
});
