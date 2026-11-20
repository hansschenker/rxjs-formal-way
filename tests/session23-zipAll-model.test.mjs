import test from 'node:test';
import assert from 'node:assert/strict';
import { runTrace, stepModel, validateModel, toManifest } from '../dist/runner.js';
import { renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior } from '../dist/index.js';
import { createZipAllModel, zipAllExample, zipAllEmptyExample, zipAllCancelExample } from '../dist/models/session23-zipAll.js';

const input = (index, value) => ({ type: 'inner.next', index, value });
const completed = index => ({ type: 'inner.complete', index });
const ref = (id, generation = 0) => ({ id, generation });
const sub = (id, generation = 0) => ({ type: 'subscribe', resource: ref(id, generation) });
const unsub = (id, generation = 0) => ({ type: 'unsubscribe', resource: ref(id, generation) });
const next = value => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const done = { type: 'notify', target: 'downstream', notification: { kind: 'C' } };
const error = e => ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: e } });
const collect = (n = 2) => [{ type: 'subscribe' }, ...Array.from({ length: n }, (_, i) => ({ type: 'outer.next', value: 'source-' + i }))];
const join = (n = 2) => [...collect(n), { type: 'outer.complete' }];
const simulate = (events, model = createZipAllModel()) => {
  let state = model.initialState(); const actions = [], rules = [];
  for (const event of events) { const r = stepModel(model, state, event); state = r.state; actions.push(...r.actions); rules.push(r.ruleId); }
  return { state, actions, rules };
};
const notifications = actions => actions.filter(a => a.type === 'notify').map(a => a.notification);

test('S23 MODEL zipAll: canonical metadata and every deterministic rule projection are attributed', () => {
  const model = createZipAllModel(), manifest = toManifest(model);
  assert.deepEqual(validateModel(model), []);
  assert.equal(manifest.metadata.operator, 'zipAll');
  assert.equal(manifest.metadata.cardinality.signature, 'zipAll : (T*)* → [T]*');
  assert.equal(manifest.metadata.evidence.record, 'evidence/SESSION-23.md');
  assert.equal(model.rules.length, 13);
  for (const render of [renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior]) {
    const first = render(manifest); assert.equal(render(manifest), first);
    for (const rule of model.rules) assert.ok(first.includes(rule.description.id));
  }
});

test('S23 MODEL zipAll: the three public histories finish and expose drain, empty and cancellation behavior', () => {
  const traces = [zipAllExample, zipAllEmptyExample, zipAllCancelExample].map((events, i) => runTrace(createZipAllModel(), events, { executionId: 'example-' + i }));
  assert.deepEqual(traces.map(t => t.state), [{ phase: 'Closed', reason: 'complete' }, { phase: 'Closed', reason: 'complete' }, { phase: 'Closed', reason: 'cancel' }]);
  assert.deepEqual(notifications(traces[0].steps.flatMap(s => s.actions)), [{ kind: 'N', value: ['A', '1'] }, { kind: 'N', value: ['B', '2'] }, { kind: 'C' }]);
  assert.deepEqual(notifications(traces[1].steps.flatMap(s => s.actions)), [{ kind: 'C' }]);
  assert.deepEqual(notifications(traces[2].steps.flatMap(s => s.actions)), []);
});

test('S23 MODEL zipAll: collection activates nothing and deferred join acquisition precedes outer release', () => {
  const model = createZipAllModel();
  assert.deepEqual(model.initialState(), { phase: 'Unsubscribed' });
  const before = simulate(collect(), model);
  assert.deepEqual(before.actions, [sub('outer')]);
  assert.deepEqual(stepModel(model, before.state, { type: 'outer.complete' }).actions, [sub('inner', 0), sub('inner', 1), unsub('outer')]);
});

test('S23 MODEL zipAll: zero collected sources complete without an empty array', () => {
  assert.deepEqual(simulate([...collect(0), { type: 'outer.complete' }], createZipAllModel(0)).actions, [sub('outer'), done, unsub('outer')]);
});

test('S23 MODEL zipAll: duplicate descriptions retain reference identity and separate occurrence subscriptions', () => {
  const description = Object.freeze({ producer: 'same' });
  const r = simulate([{ type: 'subscribe' }, { type: 'outer.next', value: description }, { type: 'outer.next', value: description }, { type: 'outer.complete' }]);
  assert.equal(r.state.slots[0].source, description); assert.equal(r.state.slots[1].source, description);
  assert.deepEqual(r.actions, [sub('outer'), sub('inner', 0), sub('inner', 1), unsub('outer')]);
});

test('S23 MODEL zipAll: faster input queues are consumed FIFO without latest-value replacement', () => {
  const r = simulate([...join(), input(0, 'A'), input(0, 'B'), input(1, 1), input(1, 2)]);
  assert.deepEqual(notifications(r.actions), [{ kind: 'N', value: ['A', 1] }, { kind: 'N', value: ['B', 2] }]);
  assert.equal(r.state.emitted, 2); assert.deepEqual(r.state.slots.map(s => s.queue), [[], []]);
});

test('S23 MODEL zipAll: completing a nonempty input releases only that producer and retains its FIFO', () => {
  const model = createZipAllModel(), s = simulate([...join(), input(0, 'A'), input(0, 'B')], model).state;
  const r = stepModel(model, s, completed(0));
  assert.deepEqual(r.actions, [unsub('inner', 0)]); assert.deepEqual(r.state.slots[0].queue, ['A', 'B']);
  assert.equal(r.state.slots[0].live, false); assert.equal(r.state.phase, 'Joining');
});

test('S23 MODEL zipAll: final buffered tuple precedes remaining releases and successful completion follows them', () => {
  const model = createZipAllModel(), s = simulate([...join(), input(0, 'A'), completed(0)], model).state;
  assert.deepEqual(stepModel(model, s, input(1, 1)).actions, [next(['A', 1]), unsub('inner', 1), done]);
});

test('S23 MODEL zipAll: an empty input completion releases live inputs in collection order before complete', () => {
  const model = createZipAllModel(), s = simulate([...join(3), input(0, 'unmatched')], model).state;
  assert.deepEqual(stepModel(model, s, completed(1)).actions, [unsub('inner', 0), unsub('inner', 1), unsub('inner', 2), done]);
});

test('S23 MODEL zipAll: outer failure preserves the exact error and never activates retained inputs', () => {
  const fault = Object.freeze({ fault: 'outer' });
  assert.deepEqual(simulate([...collect(), { type: 'outer.error', error: fault }]).actions, [sub('outer'), error(fault), unsub('outer')]);
});

test('S23 MODEL zipAll: inner failure precedes ordered cleanup without flushing a partial tuple', () => {
  const fault = Object.freeze({ fault: 'inner' }), model = createZipAllModel();
  const s = simulate([...join(), input(0, 'held')], model).state;
  const r = stepModel(model, s, { type: 'inner.error', index: 1, error: fault });
  assert.deepEqual(r.actions, [error(fault), unsub('inner', 0), unsub('inner', 1)]);
  assert.equal(r.actions[0].notification.error, fault);
});

test('S23 MODEL zipAll: cancellation during collection discards descriptions without activation', () => {
  assert.deepEqual(simulate([...collect(), { type: 'cancel' }]).actions, [sub('outer'), unsub('outer')]);
});

test('S23 MODEL zipAll: joined cancellation releases only still-live inputs without completion', () => {
  const model = createZipAllModel(), s = simulate([...join(3), input(0, 1), completed(0)], model).state;
  assert.deepEqual(stepModel(model, s, { type: 'cancel' }).actions, [unsub('inner', 1), unsub('inner', 2)]);
});

test('S23 MODEL zipAll: one collected input produces singleton tuples, not identity output', () => {
  const r = simulate([...join(1), input(0, 'A'), input(0, 'B'), completed(0)]);
  assert.deepEqual(notifications(r.actions), [{ kind: 'N', value: ['A'] }, { kind: 'N', value: ['B'] }, { kind: 'C' }]);
});

test('S23 MODEL zipAll: undefined and null are queue entries and tuple members preserve identity', () => {
  const value = Object.freeze({ opaque: true });
  const r = simulate([...join(), input(0, undefined), input(0, value), input(1, null), input(1, value)]);
  const values = notifications(r.actions).map(n => n.value);
  assert.deepEqual(values[0], [undefined, null]); assert.equal(values[1][0], value); assert.equal(values[1][1], value);
  assert.notEqual(values[0], values[1]);
});

test('S23 MODEL zipAll: capacity and safe-counter boundaries reject histories rather than dropping values', () => {
  for (const n of [-1, 1.2, 17, NaN, Infinity]) assert.throws(() => createZipAllModel(n), RangeError);
  for (const n of [0, -1, 1.2, 17, NaN, Infinity]) assert.throws(() => createZipAllModel(2, n), RangeError);
  const model = createZipAllModel(2, 1), collected = simulate(collect(), model).state;
  assert.throws(() => stepModel(model, collected, { type: 'outer.next', value: 'third' }), /illegal/);
  const held = simulate([...join(), input(0, 'full')], model).state;
  assert.throws(() => stepModel(model, held, input(0, 'overflow')), /illegal/);
  assert.deepEqual(held.slots[0].queue, ['full']);
  const edge = { phase: 'Joining', emitted: Number.MAX_SAFE_INTEGER, slots: [{ source: 'x', queue: [], live: true, received: Number.MAX_SAFE_INTEGER }] };
  assert.deepEqual(model.validateState(edge, model.parameters), []);
  assert.throws(() => stepModel(model, edge, input(0, 1)), /illegal/);
});

test('S23 MODEL zipAll: wrong phase, wrong index, completed input and post-terminal events are illegal', () => {
  const model = createZipAllModel();
  assert.throws(() => stepModel(model, model.initialState(), input(0, 1)), /illegal/);
  const collecting = simulate(collect(), model).state;
  assert.throws(() => stepModel(model, collecting, input(0, 1)), /illegal/);
  const joining = simulate(join(), model).state;
  for (const index of [-1, 0.5, 2, Infinity]) assert.throws(() => stepModel(model, joining, input(index, 1)), /illegal/);
  assert.throws(() => stepModel(model, joining, { type: 'outer.next', value: 'late' }), /illegal/);
  assert.throws(() => stepModel(model, joining, { type: 'outer.complete' }), /illegal/);
  const buffered = simulate([...join(), input(0, 1), completed(0)], model).state;
  for (const event of [input(0, 2), completed(0), { type: 'inner.error', index: 0, error: 'late' }]) assert.throws(() => stepModel(model, buffered, event), /illegal/);
  const closed = simulate([...join(), { type: 'cancel' }], model).state;
  for (const event of [{ type: 'subscribe' }, { type: 'cancel' }, input(1, 1)]) assert.throws(() => stepModel(model, closed, event), /illegal/);
});

test('S23 MODEL zipAll: forged state fails queue accounting, completion and stable-state constraints', () => {
  const model = createZipAllModel(2, 2), s = simulate(join(), model).state;
  const bad = [
    { phase: 'Collecting', sources: [1, 2, 3] }, { ...s, slots: [] }, { ...s, emitted: -1 },
    { ...s, slots: [{ ...s.slots[0], queue: [1], received: 0 }, s.slots[1]] },
    { ...s, slots: [{ ...s.slots[0], queue: [1, 2, 3], received: 3 }, s.slots[1]] },
    { ...s, slots: [{ ...s.slots[0], live: false }, s.slots[1]] },
    { ...s, slots: s.slots.map(x => ({ ...x, queue: [1], received: 1 })) },
    { ...s, slots: [{ ...s.slots[0], live: 'yes' }, s.slots[1]] },
    { phase: 'Closed', reason: 'invented' }, { phase: 'invented' },
  ];
  for (const state of bad) assert.ok(model.validateState(state, model.parameters).length > 0);
});

test('S23 MODEL zipAll: reactions are immutable and independent executions do not share queue storage', () => {
  const model = createZipAllModel(), original = simulate(join(), model).state;
  for (const slot of original.slots) { Object.freeze(slot.queue); Object.freeze(slot); } Object.freeze(original.slots); Object.freeze(original);
  const first = stepModel(model, original, input(0, 'A'));
  const second = stepModel(model, original, input(0, 'B'));
  assert.deepEqual(original.slots[0].queue, []); assert.deepEqual(first.state.slots[0].queue, ['A']); assert.deepEqual(second.state.slots[0].queue, ['B']);
  assert.notEqual(first.state.slots[0].queue, second.state.slots[0].queue);
});

test('S23 MODEL zipAll: concrete legal histories witness every rule and explicit same-time ordering', () => {
  const witnesses = [
    [...collect(0), { type: 'outer.complete' }], [...collect(), { type: 'outer.error', error: 'x' }], [...collect(), { type: 'cancel' }],
    [...join(), input(0, 1), input(1, 2), completed(0)],
    [...join(), input(0, 1), completed(0), input(1, 2)],
    [...join(), { type: 'inner.error', index: 1, error: 'x' }], [...join(), { type: 'cancel' }],
  ];
  const seen = new Set(witnesses.flatMap(events => simulate(events).rules));
  assert.deepEqual([...seen].sort(), createZipAllModel().rules.map(r => r.description.id).sort());
  const trace = runTrace(createZipAllModel(), [...join(), input(0, 1), input(1, 2)].map(event => ({ time: 7, event })), { executionId: 'same-time' });
  assert.deepEqual(notifications(trace.steps.flatMap(s => s.actions)), [{ kind: 'N', value: [1, 2] }]);
  console.log('SESSION23_ZIPALL_RULE_WITNESSES', seen.size);
});
