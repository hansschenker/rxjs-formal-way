import test from 'node:test';
import assert from 'node:assert/strict';
import { createTakeModel, takeExample, stepModel, runTrace, toManifest, validateModel, validateActionWord, renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace } from '../dist/index.js';

const subscribe = { type: 'subscribe' };
const next = value => ({ type: 'source.next', value });
const notify = notification => ({ type: 'notify', target: 'downstream', notification });
const release = { type: 'unsubscribe', resource: { id: 'source', generation: 0 } };
const start = model => stepModel(model, model.initialState(), subscribe).state;
const timed = events => events.map((event, time) => ({ time, event }));

// Literal, independently written expectations: these are not derived from renderer prose.
const rows = [
  ['TAKE-INIT-ZERO', 0, { phase: 'Unsubscribed' }, subscribe, { phase: 'Closed', reason: 'quota' }, [notify({ kind: 'C' })]],
  ['TAKE-INIT-POSITIVE', 2, { phase: 'Unsubscribed' }, subscribe, { phase: 'Active', seen: 0 }, [{ type: 'subscribe', resource: { id: 'source', generation: 0 } }]],
  ['TAKE-NEXT-PASS', 2, { phase: 'Active', seen: 0 }, next('a'), { phase: 'Active', seen: 1 }, [notify({ kind: 'N', value: 'a' })]],
  ['TAKE-NEXT-LAST', 2, { phase: 'Active', seen: 1 }, next('b'), { phase: 'Closed', reason: 'quota' }, [notify({ kind: 'N', value: 'b' }), notify({ kind: 'C' }), release]],
  ['TAKE-SOURCE-COMPLETE', 2, { phase: 'Active', seen: 0 }, { type: 'source.complete' }, { phase: 'Closed', reason: 'complete' }, [notify({ kind: 'C' }), release]],
  ['TAKE-SOURCE-ERROR', 2, { phase: 'Active', seen: 1 }, { type: 'source.error', error: 'oops' }, { phase: 'Closed', reason: 'error' }, [notify({ kind: 'E', error: 'oops' }), release]],
  ['TAKE-CANCEL', 2, { phase: 'Active', seen: 1 }, { type: 'cancel' }, { phase: 'Closed', reason: 'cancel' }, [release]],
];
for (const [ruleId, count, before, event, state, actions] of rows) {
  test(`M01-MODEL: ${ruleId} has the literal expected state and ordered actions`, () => {
    assert.deepEqual(stepModel(createTakeModel(count), before, event), { ruleId, state, actions });
  });
}

test('M01-MODEL: seven symbolic rules are reached through public input prefixes', () => {
  const reached = new Set();
  for (const [count, events] of [
    [0, [subscribe]], [2, [subscribe, next('a'), next('b')]],
    [2, [subscribe, { type: 'source.complete' }]],
    [2, [subscribe, next('a'), { type: 'source.error', error: 'e' }]],
    [2, [subscribe, next('a'), { type: 'cancel' }]],
  ]) for (const step of runTrace(createTakeModel(count), timed(events), { executionId: 'coverage' }).steps) reached.add(step.ruleId);
  assert.deepEqual([...reached].sort(), createTakeModel(2).rules.map(r => r.description.id).sort());
});
test('M01-MODEL: count one emits next, complete, release in that order', () => {
  const m = createTakeModel(1);
  assert.deepEqual(stepModel(m, start(m), next(5)).actions, [notify({ kind: 'N', value: 5 }), notify({ kind: 'C' }), release]);
});
test('M01-MODEL: parameter domain rejects unsupported numeric cases explicitly', () => {
  for (const n of [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => createTakeModel(n), RangeError);
  assert.deepEqual(validateModel(createTakeModel(Number.MAX_SAFE_INTEGER)), []);
});
test('M01-MODEL: fresh executions do not share counter objects', () => {
  const m = createTakeModel(3);
  assert.notEqual(m.initialState(), m.initialState());
  const first = start(m), second = start(m);
  assert.notEqual(first, second);
  stepModel(m, first, next('x'));
  assert.equal(first.seen, 0);
  assert.equal(second.seen, 0);
});
test('M01-MODEL: payload and error identities pass through, including undefined', () => {
  const m = createTakeModel(3), value = {}, error = new Error('sentinel');
  for (const x of [value, undefined, null]) assert.equal(stepModel(m, start(m), next(x)).actions[0].notification.value, x);
  assert.equal(stepModel(m, start(m), { type: 'source.error', error }).actions[0].notification.error, error);
});
test('M01-MODEL: invalid active counters fail before rule selection', () => {
  const m = createTakeModel(2);
  for (const seen of [-1, 0.5, 2, NaN]) assert.throws(() => stepModel(m, { phase: 'Active', seen }, next('x')), /counter/);
});
test('M01-MODEL: illegal lifecycle events are rejected rather than silently dropped', () => {
  const m = createTakeModel(1);
  assert.throws(() => stepModel(m, m.initialState(), next('x')), /illegal/);
  assert.throws(() => stepModel(m, start(m), subscribe), /illegal/);
  const stopped = stepModel(m, start(m), next('x')).state;
  for (const event of [subscribe, next('x'), { type: 'cancel' }, { type: 'source.complete' }]) assert.throws(() => stepModel(m, stopped, event), /illegal/);
});
test('M01-MODEL: conflicting enabled guards are errors, not priority rules', () => {
  const m = createTakeModel(2), r = m.rules[1];
  const duplicate = { ...r, description: { ...r.description, id: 'DUPLICATE' } };
  assert.throws(() => stepModel({ ...m, rules: [...m.rules, duplicate] }, m.initialState(), subscribe), /ambiguous/);
});
test('M01-MODEL: structural validation detects duplicate IDs and undeclared events', () => {
  const m = createTakeModel(2);
  assert.match(validateModel({ ...m, rules: [...m.rules, m.rules[0]] }).join(';'), /duplicate/);
  const broken = { ...m.rules[0], description: { ...m.rules[0].description, event: 'missing' } };
  assert.match(validateModel({ ...m, rules: [broken] }).join(';'), /undeclared event/);
});
test('M01-MODEL: wrong next-control implementations are rejected', () => {
  const m = createTakeModel(2);
  const rules = m.rules.map(r => r.description.id === 'TAKE-INIT-POSITIVE' ? { ...r, react: () => ({ state: { phase: 'Unsubscribed' }, actions: [] }) } : r);
  assert.throws(() => stepModel({ ...m, rules }, m.initialState(), subscribe), /next-control/);
});
test('M01-MODEL: combined reaction executes once per event', () => {
  const m = createTakeModel(2); let calls = 0;
  const rules = m.rules.map(r => ({ ...r, react: (...args) => { calls++; return r.react(...args); } }));
  stepModel({ ...m, rules }, m.initialState(), subscribe);
  assert.equal(calls, 1);
});
test('M01-MODEL: action validator retains per-subscriber terminal and resource distinctions', () => {
  assert.deepEqual(validateActionWord([notify({ kind: 'C' }), release]), []);
  assert.match(validateActionWord([notify({ kind: 'C' }), notify({ kind: 'N', value: 1 })]).join(';'), /terminal/);
  assert.deepEqual(validateActionWord([notify({ kind: 'C' }), { type: 'notify', target: 'other', notification: { kind: 'N', value: 1 } }]), []);
  assert.match(validateActionWord([{ type: 'schedule', resource: { id: 'timer', generation: -1 }, delay: -2 }]).join(';'), /resource/);
});
test('M01-MODEL: same-time inputs have distinct sequence numbers and stable order', () => {
  const result = runTrace(createTakeModel(2), [subscribe, next('a'), next('b')].map(event => ({ time: 0, event })), { executionId: 'same-frame' });
  assert.deepEqual(result.steps.map(s => [s.sequence, s.time, s.executionId]), [[0, 0, 'same-frame'], [1, 0, 'same-frame'], [2, 0, 'same-frame']]);
});
test('M01-MODEL: invalid times and empty execution identity are rejected', () => {
  for (const time of [-1, NaN, Infinity]) assert.throws(() => runTrace(createTakeModel(2), [{ time, event: subscribe }], { executionId: 'bad' }), /times/);
  assert.throws(() => runTrace(createTakeModel(2), [{ time: 2, event: subscribe }, { time: 1, event: next('x') }], { executionId: 'bad' }), /times/);
  assert.throws(() => runTrace(createTakeModel(2), [], { executionId: '' }), /executionId/);
});
test('M01-MODEL: step budgets report bounded inconclusiveness, not divergence', () => {
  const m = createTakeModel(2);
  const limited = runTrace(m, takeExample, { executionId: 'limited', maxSteps: 1 });
  assert.equal(limited.status, 'budget-exhausted'); assert.equal(limited.consumed, 1);
  assert.equal(runTrace(m, takeExample, { executionId: 'zero', maxSteps: 0 }).consumed, 0);
  assert.throws(() => runTrace(m, [], { executionId: 'bad', maxSteps: 0.5 }), /maxSteps/);
});
test('M01-MODEL: end of finite input does not assert completion of a live stream', () => {
  const result = runTrace(createTakeModel(3), timed([subscribe, next('x')]), { executionId: 'open' });
  assert.equal(result.status, 'finished-input'); assert.equal(result.state.phase, 'Active');
});
test('M01-MODEL: all rule-based views retain every canonical rule ID', () => {
  const manifest = toManifest(createTakeModel(2));
  for (const render of [renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior]) {
    const text = render(manifest);
    for (const rule of manifest.rules) assert.ok(text.includes(rule.id), `${rule.id} missing`);
    assert.equal(render(manifest), text);
  }
  assert.ok(renderTrace(runTrace(createTakeModel(2), takeExample, { executionId: 'example' })).includes('Four lanes'));
});
test('M01-MODEL: manifest is deterministic JSON data, not serialized executable functions', () => {
  const m = createTakeModel(2), manifest = toManifest(m);
  assert.deepEqual(JSON.parse(JSON.stringify(manifest)), manifest);
  assert.equal('react' in manifest.rules[0], false);
  assert.deepEqual(toManifest(createTakeModel(2)), manifest);
});
