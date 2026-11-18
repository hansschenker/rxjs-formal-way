import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, validateModel, toManifest } from '../dist/runner.js';
import { createTimeoutModel, createTimeoutWithModel, runTimeoutTrace, timeoutExample, timeoutFirstExample,
  timeoutFirstEachExample, timeoutAbsoluteExample, timeoutWithExample, timeoutWithDateExample } from '../dist/models/session21-timeout.js';
const ref = (id, generation = 0) => ({ id, generation });
const event = (type, now, extra = {}) => ({ type, now, ...extra });
const execute = (model, events) => {
  let state = model.initialState(); const actions = [], ids = [];
  for (const input of events) { const r = stepModel(model, state, input); state = r.state; actions.push(...r.actions); ids.push(r.ruleId); }
  return { state, actions, ids };
};
const notify = actions => actions.filter(a => a.type === 'notify').map(a => a.notification);
const cases = [
  ['timeout', createTimeoutModel({ each: 4 }), timeoutExample],
  ['timeout-first', createTimeoutModel({ first: 4 }), timeoutFirstExample],
  ['timeout-first-each', createTimeoutModel({ first: 6, each: 3, withMode: 'factory' }), timeoutFirstEachExample],
  ['timeout-absolute-fallback', createTimeoutModel({ first: { at: 5 }, withMode: 'factory' }), timeoutAbsoluteExample],
  ['timeoutWith', createTimeoutWithModel(4), timeoutWithExample],
  ['timeoutWith-date', createTimeoutWithModel({ at: 5 }), timeoutWithDateExample],
];
for (const [name, model, inputs] of cases) test(`S21 TIMEOUT MODEL ${name}: canonical metadata and executable example`, () => {
  assert.deepEqual(validateModel(model), []);
  assert.equal(model.metadata.rxjsVersion, '7.8.2');
  assert.match(model.metadata.cardinality.signature, /Cω/);
  assert.equal(model.metadata.evidence.record, 'evidence/SESSION-21.md');
  assert.ok(model.metadata.sources.some(s => s.url.includes('/spec/operators/')));
  assert.ok(toManifest(model).rules.every(r => r.obligations.includes(r.id)));
  const trace = runTimeoutTrace(model, inputs, { executionId: name });
  assert.equal(trace.state.phase, 'Closed'); assert.equal(trace.state.reason, 'complete');
});

test('S21 TIMEOUT MODEL: first delay overrides initial each and source connects before scheduling', () => {
  const r = execute(createTimeoutModel({ first: 8, each: 3 }), [event('subscribe', 2)]);
  assert.deepEqual(r.actions.map(a => a.type), ['subscribe', 'schedule']);
  assert.equal(r.actions[1].delay, 8); assert.equal(r.state.timer.due, 10);
});
test('S21 TIMEOUT MODEL: absolute first is resolved against subscription time without inventing a clock', () => {
  const m = createTimeoutModel({ first: { at: 8 } });
  const r = execute(m, [event('subscribe', 3)]);
  assert.equal(r.actions[1].delay, 5); assert.equal(r.state.timer.due, 8);
  for (const now of [8, 9]) assert.throws(() => execute(m, [event('subscribe', now)]));
});
test('S21 TIMEOUT MODEL: next cancels before forwarding and restarts each from supplied now', () => {
  const value = {}; const m = createTimeoutModel({ first: 8, each: 3 });
  let s = execute(m, [event('subscribe', 2)]).state;
  const r = stepModel(m, s, event('source.next', 4, { value }));
  assert.deepEqual(r.actions.map(a => a.type), ['cancel-timer', 'notify', 'schedule']);
  assert.equal(r.actions[1].notification.value, value);
  assert.equal(r.state.lastValue, value); assert.equal(r.state.seen, 1);
  assert.deepEqual(r.state.timer, { generation: 1, due: 7 });
  assert.deepEqual(s.timer, { generation: 0, due: 10 });
});
test('S21 TIMEOUT MODEL: first-only policy remains unarmed after the first value', () => {
  const m = createTimeoutModel({ first: 4 });
  const r = execute(m, [event('subscribe', 0), event('source.next', 1, { value: undefined }), event('source.next', 50, { value: null })]);
  assert.equal(r.state.timer, null); assert.equal(r.state.seen, 2);
  assert.equal(r.actions.filter(a => a.type === 'schedule').length, 1);
  assert.deepEqual(notify(r.actions), [{ kind: 'N', value: undefined }, { kind: 'N', value: null }]);
});
test('S21 TIMEOUT MODEL: source cleanup clears lastValue before factory info while preserving meta and seen', () => {
  const meta = {}, value = {}; const m = createTimeoutModel({ each: 3, withMode: 'factory', meta });
  const s = execute(m, [event('subscribe', 0), event('source.next', 1, { value })]).state;
  const r = stepModel(m, s, event('timer.fire', 6, { resource: ref('timeoutTimer', 1) }));
  assert.deepEqual(r.actions.map(a => a.type), ['unsubscribe', 'cancel-timer', 'invoke-callback']);
  assert.deepEqual(r.actions[2].value, { meta, seen: 1, lastValue: null });
  assert.equal(r.actions[2].value.meta, meta); assert.equal(r.state.clock, 6);
  assert.equal(r.state.phase, 'Choosing'); assert.ok(!('lastValue' in r.state));
});
test('S21 TIMEOUT MODEL: factory return acquires fallback and fallback values never rearm timeout', () => {
  const m = createTimeoutModel({ each: 3, withMode: 'factory' });
  const r = execute(m, [event('subscribe', 0), event('timer.fire', 3, { resource: ref('timeoutTimer') }),
    event('callback.return', 3, { resource: ref('timeoutFactory'), token: 'R' }),
    event('fallback.next', 40, { resource: ref('fallback'), value: 'replacement' }),
    event('fallback.complete', 50, { resource: ref('fallback') })]);
  assert.deepEqual(notify(r.actions), [{ kind: 'N', value: 'replacement' }, { kind: 'C' }]);
  assert.equal(r.actions.filter(a => a.type === 'schedule').length, 1);
  assert.deepEqual(r.actions.at(-1), { type: 'unsubscribe', resource: ref('fallback') });
});
for (const mode of ['default', 'factory']) test(`S21 TIMEOUT MODEL ${mode}: factory throws exact error after source release`, () => {
  const fault = {}; const m = createTimeoutModel({ each: 2, withMode: mode });
  const r = execute(m, [event('subscribe', 0), event('timer.fire', 2, { resource: ref('timeoutTimer') }),
    event('callback.throw', 2, { resource: ref('timeoutFactory'), error: fault })]);
  assert.equal(notify(r.actions)[0].error, fault);
  assert.equal(r.actions.filter(a => a.type === 'unsubscribe').length, 1);
  assert.equal(r.state.reason, 'error');
});
for (const end of ['complete', 'error', 'cancel']) test(`S21 TIMEOUT MODEL: source ${end} releases current timer without factory`, () => {
  const m = createTimeoutModel({ each: 4, withMode: 'factory' }); const fault = {};
  const r = execute(m, [event('subscribe', 0), event(end === 'cancel' ? 'cancel' : 'source.' + end, 2, { error: fault })]);
  assert.equal(r.actions.some(a => a.type === 'invoke-callback'), false);
  assert.deepEqual(r.actions.slice(-2).map(a => a.type), ['unsubscribe', 'cancel-timer']);
  assert.equal(notify(r.actions).length, end === 'cancel' ? 0 : 1);
});
for (const end of ['error', 'cancel']) test(`S21 TIMEOUT MODEL: fallback ${end} releases only the current replacement`, () => {
  const m = createTimeoutWithModel(2); const fault = {};
  const state = execute(m, [event('subscribe', 0), event('timer.fire', 2, { resource: ref('timeoutTimer') })]).state;
  const r = stepModel(m, state, event(end === 'cancel' ? 'cancel' : 'fallback.error', 4, { resource: ref('fallback'), error: fault }));
  assert.deepEqual(r.actions.at(-1), { type: 'unsubscribe', resource: ref('fallback') });
  assert.equal(r.actions.filter(a => a.type === 'unsubscribe').length, 1);
  if (end === 'error') assert.equal(r.actions[0].notification.error, fault);
  else assert.equal(notify(r.actions).length, 0);
});
test('S21 TIMEOUT MODEL: timeoutWith numeric/date wrappers preserve configured source identity and policy', () => {
  const numeric = createTimeoutWithModel(3, 'fixed'); const date = createTimeoutWithModel({ at: 8 }, 'fixed');
  assert.deepEqual([numeric.parameters.first, numeric.parameters.each], [null, 3]);
  assert.deepEqual([date.parameters.first, date.parameters.each], [{ at: 8 }, null]);
  for (const m of [numeric, date]) {
    assert.equal(m.metadata.operator, 'timeoutWith'); assert.equal(m.rules.some(r => r.description.from === 'Choosing'), false);
    const r = execute(m, [event('subscribe', 0), event('timer.fire', m === numeric ? 3 : 8, { resource: ref('timeoutTimer') })]);
    assert.equal(r.state.token, 'fixed'); assert.deepEqual(r.actions.slice(-3).map(a => a.type), ['unsubscribe', 'cancel-timer', 'subscribe']);
  }
});
test('S21 TIMEOUT MODEL: guards reject stale/early timers and invalid factory times or tokens', () => {
  const m = createTimeoutModel({ each: 4, withMode: 'factory' });
  const source = execute(m, [event('subscribe', 1)]).state;
  for (const e of [event('timer.fire', 4, { resource: ref('timeoutTimer') }), event('timer.fire', 5, { resource: ref('timeoutTimer', 1) }), event('source.next', 0, { value: 1 })]) assert.throws(() => stepModel(m, source, e));
  const choosing = stepModel(m, source, event('timer.fire', 5, { resource: ref('timeoutTimer') })).state;
  for (const e of [event('callback.return', 6, { resource: ref('timeoutFactory'), token: 'R' }), event('callback.return', 5, { resource: ref('timeoutFactory', 1), token: 'R' }), event('callback.return', 5, { resource: ref('timeoutFactory'), token: '' }), event('cancel', 5)]) assert.throws(() => stepModel(m, choosing, e));
  assert.throws(() => runTimeoutTrace(m, [{ time: 1, event: event('subscribe', 2) }], { executionId: 'bad-clock' }));
});
test('S21 TIMEOUT MODEL: default binding cannot return a fallback and stale fallback events are illegal', () => {
  const m = createTimeoutModel({ first: 2 });
  const choosing = execute(m, [event('subscribe', 0), event('timer.fire', 2, { resource: ref('timeoutTimer') })]).state;
  assert.throws(() => stepModel(m, choosing, event('callback.return', 2, { resource: ref('timeoutFactory'), token: 'R' })));
  const alias = createTimeoutWithModel(2); const fallback = execute(alias, [event('subscribe', 0), event('timer.fire', 2, { resource: ref('timeoutTimer') })]).state;
  assert.throws(() => stepModel(alias, fallback, event('fallback.next', 3, { resource: ref('fallback', 1), value: 1 })));
  assert.throws(() => stepModel(alias, fallback, event('source.next', 3, { value: 1 })));
});
test('S21 TIMEOUT MODEL: configured domains and invalid source memory are rejected', () => {
  for (const each of [0, -1, 1001, 0.5, NaN, Infinity]) assert.throws(() => createTimeoutModel({ each }));
  for (const first of [0, -1, { at: 0 }, { at: NaN }]) assert.throws(() => createTimeoutModel({ first }));
  assert.throws(() => createTimeoutModel({})); assert.throws(() => createTimeoutWithModel(3, ''));
  const m = createTimeoutModel({ each: 4 }), s = execute(m, [event('subscribe', 0)]).state;
  for (const bad of [{ ...s, timer: null }, { ...s, seen: 1 }, { ...s, lastValue: 'retained' }, { ...s, nextGeneration: 2 }, { ...s, timer: { generation: 0, due: NaN } }, { ...s, timer: { generation: 0, due: 0 } }]) assert.throws(() => stepModel(m, bad, event('cancel', 0)));
  const firstOnly = createTimeoutModel({ first: 4 });
  const satisfied = execute(firstOnly, [event('subscribe', 0), event('source.next', 1, { value: 'V' })]).state;
  assert.throws(() => stepModel(firstOnly, { ...satisfied, timer: { generation: 0, due: 4 } }, event('timer.fire', 4, { resource: ref('timeoutTimer') })));
  assert.throws(() => stepModel(firstOnly, { phase: 'Choosing', clock: 4, seen: 1 }, event('callback.throw', 4, { resource: ref('timeoutFactory'), error: 'E' })));
});

// A finite search supplies one legal prefix for each retained rule; this is not an equivalence proof.
for (const [name, model] of cases) test(`S21 TIMEOUT REACHABILITY ${name}: every retained rule has a legal prefix`, () => {
  const queue = [{ state: model.initialState(), depth: 0 }], seen = new Set(), witnessed = new Set();
  const offer = s => {
    if (s.phase === 'Unsubscribed') return [event('subscribe', 0)];
    const now = s.clock;
    if (s.phase === 'Source') return [event('source.next', now + 1, { value: 'V' }), event('source.complete', now), event('source.error', now, { error: 'E' }), event('cancel', now), ...(s.timer ? [event('timer.fire', Math.max(now, s.timer.due), { resource: ref('timeoutTimer', s.timer.generation) })] : [])];
    if (s.phase === 'Choosing') return [event('callback.return', now, { resource: ref('timeoutFactory'), token: 'R' }), event('callback.throw', now, { resource: ref('timeoutFactory'), error: 'E' })];
    if (s.phase === 'Fallback') return [event('fallback.next', now + 1, { resource: ref('fallback'), value: 'R' }), event('fallback.complete', now, { resource: ref('fallback') }), event('fallback.error', now, { resource: ref('fallback'), error: 'E' }), event('cancel', now)];
    return [];
  };
  while (queue.length) {
    const { state, depth } = queue.shift(); const key = JSON.stringify(state);
    if (seen.has(key) || depth > 6) continue; seen.add(key);
    for (const input of offer(state)) {
      let r; try { r = stepModel(model, state, input); } catch (error) { if (/illegal transition/.test(String(error))) continue; throw error; }
      witnessed.add(r.ruleId);
      if (!('seen' in r.state) || r.state.seen <= 2) queue.push({ state: r.state, depth: depth + 1 });
    }
  }
  assert.deepEqual([...witnessed].sort(), model.rules.map(r => r.description.id).sort());
  console.log('SESSION21_TIMEOUT_REACHABILITY', JSON.stringify({ profile: name, states: seen.size, rules: witnessed.size, maxPrefixDepth: 6, maxEnqueuedSeen: 2 }));
});
