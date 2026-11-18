import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, validateModel, toManifest } from '../dist/runner.js';
import { createClockModel, createTimeIntervalModel, createTimestampModel, runClockTrace,
  timeIntervalExample, timestampExample } from '../dist/models/session21-clock.js';

const ref = (operator, generation) => ({ id: operator + '.now', generation });
const returned = (operator, generation, reading) => ({ type: 'clock.return', resource: ref(operator, generation), reading });
const thrown = (operator, generation, error) => ({ type: 'clock.throw', resource: ref(operator, generation), error });
const execute = (model, events) => {
  let state = model.initialState(); const actions = [], rules = [];
  for (const event of events) { const step = stepModel(model, state, event); state = step.state; actions.push(...step.actions); rules.push(step.ruleId); }
  return { state, actions, rules };
};
const start = operator => operator === 'timeInterval' ? [{ type: 'subscribe' }, returned(operator, 0, 10)] : [{ type: 'subscribe' }];
const firstRead = operator => operator === 'timeInterval' ? 1 : 0;
const notes = actions => actions.filter(a => a.type === 'notify').map(a => a.notification);

for (const operator of ['timeInterval', 'timestamp']) {
  test(`S21 CLOCK MODEL ${operator}: canonical metadata and pure structural manifest`, () => {
    const model = createClockModel(operator);
    assert.deepEqual(validateModel(model), []);
    assert.deepEqual(model.initialState(), { phase: 'Unsubscribed' });
    assert.equal(model.metadata.evidence.record, 'evidence/SESSION-21.md');
    assert.ok(model.metadata.sources.some(s => s.url.includes('/spec/operators/' + operator)));
    assert.ok(!model.metadata.actionTypes.includes('schedule'));
    assert.ok(model.rules.every(r => r.description.id.startsWith('S21-') && r.description.obligations.length));
    assert.equal(toManifest(model).metadata.operator, operator);
  });
  test(`S21 CLOCK MODEL ${operator}: clock failure preserves error identity and acquired-source cleanup`, () => {
    const fault = {}, n = firstRead(operator);
    const r = execute(createClockModel(operator), [...start(operator), { type: 'source.next', value: 'lost' }, thrown(operator, n, fault)]);
    assert.equal(notes(r.actions)[0].error, fault);
    assert.equal(r.actions.at(-1).type, 'unsubscribe');
    assert.equal(notes(r.actions).length, 1);
    assert.deepEqual(r.state, { phase: 'Closed', reason: 'error' });
  });
  for (const event of [{ type: 'source.complete' }, { type: 'source.error', error: undefined }, { type: 'cancel' }]) {
    test(`S21 CLOCK MODEL ${operator}: ${event.type} does not read time`, () => {
      const model = createClockModel(operator), state = execute(model, start(operator)).state;
      const r = stepModel(model, state, event);
      assert.equal(r.actions.filter(a => a.type === 'invoke-callback').length, 0);
      assert.equal(r.actions.at(-1).type, 'unsubscribe');
      assert.deepEqual(notes(r.actions), event.type === 'source.complete' ? [{ kind: 'C' }]
        : event.type === 'source.error' ? [{ kind: 'E', error: undefined }] : []);
      assert.throws(() => stepModel(model, r.state, { type: 'source.next', value: 1 }));
    });
  }
  test(`S21 CLOCK MODEL ${operator}: stale reads, nonfinite readings and pending reentry are illegal`, () => {
    const model = createClockModel(operator), n = firstRead(operator);
    const s = execute(model, [...start(operator), { type: 'source.next', value: 1 }]).state;
    assert.throws(() => stepModel(model, s, returned(operator, n + 1, 20)));
    assert.throws(() => stepModel(model, s, returned(operator === 'timestamp' ? 'timeInterval' : 'timestamp', n, 20)));
    for (const reading of [Infinity, -Infinity, NaN]) assert.throws(() => stepModel(model, s, returned(operator, n, reading)));
    for (const event of [{ type: 'source.next', value: 2 }, { type: 'cancel' }, { type: 'source.complete' }]) assert.throws(() => stepModel(model, s, event));
  });
  test(`S21 CLOCK MODEL ${operator}: every retained rule has an explicit legal witness`, () => {
    const model = createClockModel(operator), n = firstRead(operator), witnessed = new Set();
    const next = [...start(operator), { type: 'source.next', value: 'V' }, returned(operator, n, 12)];
    const scenarios = [
      [...next, { type: 'source.complete' }],
      [...start(operator), { type: 'source.error', error: 'E' }],
      [...start(operator), { type: 'cancel' }],
      [...start(operator), { type: 'source.next', value: 'V' }, thrown(operator, n, 'E')],
      ...(operator === 'timeInterval' ? [[{ type: 'subscribe' }, thrown(operator, 0, 'E')]] : []),
    ];
    for (const scenario of scenarios) for (const id of execute(model, scenario).rules) witnessed.add(id);
    assert.deepEqual([...witnessed].sort(), model.rules.map(r => r.description.id).sort());
  });
}

test('S21 CLOCK MODEL timeInterval: initial read precedes acquisition and may fail without acquiring', () => {
  const model = createTimeIntervalModel(), initial = stepModel(model, model.initialState(), { type: 'subscribe' });
  assert.deepEqual(initial.state, { phase: 'ReadingStart', read: 0 });
  assert.deepEqual(initial.actions, [{ type: 'invoke-callback', resource: ref('timeInterval', 0), index: 0, value: undefined }]);
  const failed = stepModel(model, initial.state, thrown('timeInterval', 0, undefined));
  assert.deepEqual(failed.actions, [{ type: 'notify', target: 'downstream', notification: { kind: 'E', error: undefined } }]);
});
test('S21 CLOCK MODEL timeInterval: differences use connection then prior reading, including backwards values', () => {
  const value = {}, model = createTimeIntervalModel();
  const r = execute(model, [...start('timeInterval'),
    { type: 'source.next', value }, returned('timeInterval', 1, 12.5),
    { type: 'source.next', value }, returned('timeInterval', 2, -1),
    { type: 'source.next', value: undefined }, returned('timeInterval', 3, -1)]);
  assert.deepEqual(notes(r.actions).map(n => n.value.interval), [2.5, -13.5, 0]);
  assert.equal(notes(r.actions)[0].value.value, value);
  assert.notEqual(notes(r.actions)[0].value, notes(r.actions)[1].value);
  assert.deepEqual(r.state, { phase: 'Listening', previous: -1, nextRead: 4 });
});
test('S21 CLOCK MODEL timestamp: only next requests a reading and no prior timestamp is retained', () => {
  const model = createTimestampModel(), value = {};
  const initialized = execute(model, start('timestamp'));
  assert.deepEqual(initialized.actions, [{ type: 'subscribe', resource: { id: 'source', generation: 0 } }]);
  const r = execute(model, [...start('timestamp'), { type: 'source.next', value }, returned('timestamp', 0, -2.5)]);
  assert.deepEqual(notes(r.actions), [{ kind: 'N', value: { value, timestamp: -2.5 } }]);
  assert.equal(notes(r.actions)[0].value.value, value);
  assert.deepEqual(r.state, { phase: 'Listening', previous: null, nextRead: 1 });
});
test('S21 CLOCK MODEL: operator-specific state legality, finite differences and safe read counters', () => {
  const interval = createTimeIntervalModel(), stamp = createTimestampModel();
  assert.throws(() => createClockModel('unknown'));
  assert.throws(() => stepModel(stamp, { phase: 'ReadingStart', read: 0 }, returned('timestamp', 0, 0)));
  assert.throws(() => stepModel(interval, { phase: 'Listening', previous: null, nextRead: 1 }, { type: 'cancel' }));
  assert.throws(() => stepModel(stamp, { phase: 'Listening', previous: 1, nextRead: 0 }, { type: 'cancel' }));
  assert.throws(() => stepModel(interval, { phase: 'Listening', previous: 1, nextRead: 0 }, { type: 'cancel' }));
  assert.throws(() => stepModel(stamp, { phase: 'Listening', previous: null, nextRead: Number.MAX_SAFE_INTEGER }, { type: 'source.next', value: 1 }));
  assert.throws(() => stepModel(interval, { phase: 'ReadingNext', previous: -Number.MAX_VALUE, read: 1, value: 1 }, returned('timeInterval', 1, Number.MAX_VALUE)));
});
test('S21 CLOCK MODEL: trace wrapper distinguishes chronological envelopes from provider readings and validates synchronous return', () => {
  const interval = runClockTrace(createTimeIntervalModel(), timeIntervalExample, { executionId: 'interval' });
  const stamp = runClockTrace(createTimestampModel(), timestampExample, { executionId: 'stamp' });
  assert.deepEqual(notes(interval.steps.flatMap(s => s.actions)).filter(n => n.kind === 'N').map(n => n.value.interval), [3, -2]);
  assert.deepEqual(notes(stamp.steps.flatMap(s => s.actions)).filter(n => n.kind === 'N').map(n => n.value.timestamp), [103, 101]);
  const delayed = timestampExample.map((x, i) => i === 2 ? { ...x, time: 3 } : x);
  assert.throws(() => runClockTrace(createTimestampModel(), delayed, { executionId: 'invalid' }), /invocation envelope time/);
  const prefix = runClockTrace(createTimeIntervalModel(), timeIntervalExample, { executionId: 'prefix', maxSteps: 1 });
  assert.equal(prefix.status, 'budget-exhausted');
  assert.equal(prefix.state.phase, 'ReadingStart');
});
