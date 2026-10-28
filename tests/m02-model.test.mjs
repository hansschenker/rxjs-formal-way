import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapModel, createFilterModel, createTakeModel, mapExample, filterExample,
  stepModel, runTrace, toManifest, validateModel, validateActionWord,
  renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace } from '../dist/index.js';
import { observeModel } from './helpers/value-driver.mjs';

const start = model => stepModel(model, model.initialState(), { type: 'subscribe' }).state;
const enter = (model, value = 'input') => stepModel(model, start(model), { type: 'source.next', value });
const returned = (model, value, generation = 0) => ({ type: 'callback.return', resource: { id: model.parameters.callbackId, generation }, value });
const thrown = (model, error, generation = 0) => ({ type: 'callback.throw', resource: { id: model.parameters.callbackId, generation }, error });
const notify = notification => ({ type: 'notify', target: 'downstream', notification });
const release = { type: 'unsubscribe', resource: { id: 'source', generation: 0 } };

for (const [name, create] of [['map', createMapModel], ['filter', createFilterModel]]) {
  const prefix = name.toUpperCase();
  test(`M02-MODEL ${name}: initialization is lazy and creates a new index`, () => {
    const m = create();
    assert.deepEqual(validateModel(m), []);
    assert.notEqual(m.initialState(), m.initialState());
    assert.deepEqual(stepModel(m, m.initialState(), { type: 'subscribe' }), {
      ruleId: `${prefix}-INIT`, state: { phase: 'Active', index: 0 }, actions: [{ type: 'subscribe', resource: { id: 'source', generation: 0 } }],
    });
  });
  test(`M02-MODEL ${name}: source value requests one invocation and preserves identity`, () => {
    const m = create(), value = {}, result = enter(m, value);
    assert.deepEqual(result, { ruleId: `${prefix}-CALL`, state: { phase: 'Calling', input: value, index: 1, callId: 0 },
      actions: [{ type: 'invoke-callback', resource: { id: m.parameters.callbackId, generation: 0 }, value, index: 0 }] });
    assert.equal(result.state.input, value);
    assert.equal(result.actions[0].value, value);
  });
  test(`M02-MODEL ${name}: callback throws preserve arbitrary error identity`, () => {
    const m = create();
    for (const error of [undefined, null, new Error('callback'), { marker: true }]) {
      assert.deepEqual(stepModel(m, enter(m).state, thrown(m, error)), {
        ruleId: `${prefix}-THROW`, state: { phase: 'Closed', reason: 'callback-error' },
        actions: [notify({ kind: 'E', error }), release],
      });
    }
  });
  test(`M02-MODEL ${name}: source terminal events and cancellation stay distinct`, () => {
    const m = create();
    for (const [event, reason, actions, suffix] of [
      [{ type: 'source.complete' }, 'complete', [notify({ kind: 'C' }), release], 'COMPLETE'],
      [{ type: 'source.error', error: 'e' }, 'source-error', [notify({ kind: 'E', error: 'e' }), release], 'ERROR'],
      [{ type: 'cancel' }, 'cancel', [release], 'CANCEL'],
    ]) assert.deepEqual(stepModel(m, start(m), event), { ruleId: `${prefix}-${suffix}`, state: { phase: 'Closed', reason }, actions });
  });
  test(`M02-MODEL ${name}: all rule IDs reached through legal prefixes`, () => {
    const m = create(), reached = new Set();
    for (const [callback, values, ending] of [
      [() => true, [1], 'complete'], [() => false, [2], 'error'],
      [() => { throw 'callback-fault'; }, [1], 'complete'], [() => true, [], 'cancel'],
    ]) for (const id of observeModel(m, callback, values, ending).rules) reached.add(id);
    assert.deepEqual([...reached].sort(), m.rules.map(r => r.description.id).sort());
  });
  test(`M02-MODEL ${name}: stale and foreign callback outcomes are illegal`, () => {
    const m = create(), state = enter(m).state;
    assert.throws(() => stepModel(m, state, returned(m, 4, 1)), /illegal/);
    assert.throws(() => stepModel(m, state, { ...returned(m, 4), resource: { id: 'foreign', generation: 0 } }), /illegal/);
    assert.throws(() => stepModel(m, state, thrown(m, 'e', 1)), /illegal/);
    assert.throws(() => stepModel(m, start(m), returned(m, 4)), /illegal/);
  });
  test(`M02-MODEL ${name}: pending callbacks reject reentrant external events`, () => {
    const m = create(), state = enter(m).state;
    for (const event of [{ type: 'source.next', value: 2 }, { type: 'source.complete' }, { type: 'source.error', error: 'e' }, { type: 'cancel' }]) {
      assert.throws(() => stepModel(m, state, event), /illegal/);
    }
  });
  test(`M02-MODEL ${name}: terminal executions reject late outcomes and subscription reuse`, () => {
    const m = create(), state = stepModel(m, start(m), { type: 'cancel' }).state;
    for (const event of [{ type: 'subscribe' }, { type: 'source.next', value: 2 }, returned(m, 3)]) assert.throws(() => stepModel(m, state, event), /illegal/);
  });
  test(`M02-MODEL ${name}: invalid counters and bindings are rejected`, () => {
    const m = create();
    for (const index of [-1, 0.5, NaN, Infinity]) assert.throws(() => stepModel(m, { phase: 'Active', index }, { type: 'source.next', value: 1 }), /index/);
    assert.throws(() => stepModel(m, { phase: 'Active', index: Number.MAX_SAFE_INTEGER }, { type: 'source.next', value: 1 }), /illegal/);
    assert.throws(() => stepModel(m, { phase: 'Calling', index: 2, callId: 0, input: 1 }, returned(m, true)), /pending/);
    for (const id of ['', 'source', 'two words']) assert.throws(() => create(id), TypeError);
  });
  test(`M02-MODEL ${name}: generation and validators do not invoke business functions`, () => {
    const m = create('userFunction');
    const manifest = toManifest(m);
    for (const render of [renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior]) {
      const output = render(manifest);
      for (const r of m.rules) assert.ok(output.includes(r.description.id));
      assert.equal(render(manifest), output);
    }
    assert.ok(renderObligations(manifest).includes('tests/m02-rxjs.test.mjs'));
    assert.ok(!renderObligations(manifest).includes('tests/m01-rxjs.test.mjs'));
    assert.deepEqual(JSON.parse(JSON.stringify(manifest)), manifest);
    assert.equal(JSON.stringify(manifest).includes('enabled'), false);
  });
  test(`M02-MODEL ${name}: independent executions and input objects are not mutated`, () => {
    const m = create(), a = start(m), b = start(m);
    Object.freeze(a); const input = Object.freeze({ value: 7 });
    const pending = stepModel(m, a, { type: 'source.next', value: input });
    assert.deepEqual(a, b); assert.notEqual(a, b);
    Object.freeze(pending.state);
    stepModel(m, pending.state, returned(m, true));
    assert.equal(b.index, 0); assert.equal(pending.state.input, input);
  });
}

test('M02-MODEL map: returns exactly one result, including opaque and undefined values', () => {
  const m = createMapModel();
  for (const value of [undefined, null, {}, { subscribe: () => assert.fail('must not subscribe') }]) {
    const result = stepModel(m, enter(m).state, returned(m, value));
    assert.deepEqual(result, { ruleId: 'MAP-RETURN', state: { phase: 'Active', index: 1 }, actions: [notify({ kind: 'N', value })] });
    assert.equal(result.actions[0].notification.value, value);
  }
});
test('M02-MODEL filter: truthy results forward input, not predicate output', () => {
  const m = createFilterModel(), input = {};
  for (const truthy of [true, 1, -1, 'yes', {}, [], Symbol('yes')]) {
    const result = stepModel(m, enter(m, input).state, returned(m, truthy));
    assert.deepEqual(result, { ruleId: 'FILTER-PASS', state: { phase: 'Active', index: 1 }, actions: [notify({ kind: 'N', value: input })] });
    assert.equal(result.actions[0].notification.value, input);
  }
});
test('M02-MODEL filter: falsy results are silent but advance the index', () => {
  const m = createFilterModel();
  for (const falsy of [false, 0, -0, 0n, '', null, undefined, NaN]) {
    const dropped = stepModel(m, enter(m).state, returned(m, falsy));
    assert.deepEqual(dropped, { ruleId: 'FILTER-DROP', state: { phase: 'Active', index: 1 }, actions: [] });
    const call = stepModel(m, dropped.state, { type: 'source.next', value: 'second' });
    assert.equal(call.actions[0].index, 1);
  }
});
test('M02-MODEL: pure predicates are not used as transition guards', () => {
  const m = createFilterModel(); let calls = 0;
  const observed = observeModel(m, () => { calls++; return false; }, [1, 2, 3]);
  assert.equal(calls, 3);
  assert.equal(observed.observations.filter(e => e.kind === 'call').length, 3);
  assert.equal(observed.observations.filter(e => e.kind === 'N').length, 0);
});
test('M02-MODEL: callback phases have stable order at the same timestamp', () => {
  for (const [m, inputs] of [[createMapModel(), mapExample], [createFilterModel(), filterExample]]) {
    const trace = runTrace(m, inputs, { executionId: 'same-time' });
    assert.equal(trace.steps[1].time, trace.steps[2].time);
    assert.equal(trace.steps[1].after.phase, 'Calling'); assert.equal(trace.steps[2].after.phase, 'Active');
    assert.equal(trace.steps[2].sequence, trace.steps[1].sequence + 1);
    assert.ok(renderTrace(trace).includes('invoke('));
    assert.ok(renderTrace(trace).includes('Four lanes'));
  }
});
test('M02-MODEL: callback action validation rejects invalid invocation identities', () => {
  const action = { type: 'invoke-callback', resource: { id: 'project', generation: 0 }, index: 0, value: 2 };
  assert.deepEqual(validateActionWord([action]), []);
  for (const index of [-1, 0.5, 1, Infinity]) assert.match(validateActionWord([{ ...action, index }]).join(';'), /callback/);
});
test('M02-MODEL: schema 1.0 remains valid and cannot declare callback actions', () => {
  assert.deepEqual(validateModel(createTakeModel(2)), []);
  const m = createMapModel();
  assert.match(validateModel({ ...m, metadata: { ...m.metadata, schemaVersion: '1.0' } }).join(';'), /1.1/);
});
test('M02-MODEL: mutation of callback multiplicity is detected', () => {
  const m = createMapModel();
  const rules = m.rules.map(r => r.description.id !== 'MAP-CALL' ? r : { ...r, react: (...args) => {
    const reaction = r.react(...args); return { ...reaction, actions: [...reaction.actions, ...reaction.actions] };
  } });
  assert.throws(() => stepModel({ ...m, rules }, start(m), { type: 'source.next', value: 1 }), /exactly one/);
});
test('M02-MODEL: duplicate filter guards are detected without running a predicate', () => {
  const m = createFilterModel(); const r = m.rules.find(r => r.description.id === 'FILTER-PASS');
  assert.throws(() => stepModel({ ...m, rules: [...m.rules, { ...r, description: { ...r.description, id: 'DUPLICATE' } }] }, enter(m).state, returned(m, true)), /ambiguous/);
});
