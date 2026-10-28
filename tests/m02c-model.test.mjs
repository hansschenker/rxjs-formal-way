import test from 'node:test';
import assert from 'node:assert/strict';
import { createDebounceTimeModel, debounceTimeExample, runDebounceTimeTrace } from '../dist/models/debounceTime.js';
import { stepModel, validateModel, toManifest } from '../dist/runner.js';
import { observeDebounceModel } from './helpers/debounce-driver.mjs';

const resource = generation => ({ id: 'debounce-timer', generation });
const fire = (generation, now) => ({ type: 'timer.fire', resource: resource(generation), now });
const next = (value, now) => ({ type: 'source.next', value, now });
const notify = notification => ({ type: 'notify', target: 'downstream', notification });
const release = { type: 'unsubscribe', resource: { id: 'source', generation: 0 } };
const cancel = generation => ({ type: 'cancel-timer', resource: resource(generation) });
const start = m => stepModel(m, m.initialState(), { type: 'subscribe', now: 0 }).state;
const pending = (m, value = 'a', now = 1) => stepModel(m, start(m), next(value, now)).state;
const m = createDebounceTimeModel(3);

test('M02C-MODEL: initialization acquires the source but no timer', () => {
  assert.deepEqual(stepModel(m, m.initialState(), { type: 'subscribe', now: 0 }), {
    ruleId: 'DEBOUNCE-INIT', state: { phase: 'Idle', now: 0, nextTimer: 0 },
    actions: [{ type: 'subscribe', resource: { id: 'source', generation: 0 } }],
  });
  assert.notEqual(m.initialState(), m.initialState());
  assert.deepEqual(validateModel(m), []);
});
test('M02C-MODEL: first next stores deadline separately from payload and schedules once', () => {
  const r = stepModel(m, start(m), next('a', 1));
  assert.deepEqual(r.state, { phase: 'Pending', now: 1, nextTimer: 1, value: 'a', lastTime: 1, deadline: 4, scheduledFor: 4, timer: resource(0) });
  assert.deepEqual(r.actions, [{ type: 'schedule', resource: resource(0), delay: 3 }]);
});
test('M02C-MODEL: replacement changes memory and deadline without rescheduling', () => {
  const s = pending(m), r = stepModel(m, s, next('b', 3));
  assert.deepEqual(r.actions, []); assert.equal(r.state.deadline, 6);
  assert.equal(r.state.scheduledFor, 4); assert.equal(r.state.value, 'b');
  assert.deepEqual(r.state.timer, s.timer); assert.equal(s.value, 'a');
});
test('M02C-MODEL: early wake-up rearms only the remaining interval', () => {
  const s = stepModel(m, pending(m), next('b', 3)).state, r = stepModel(m, s, fire(0, 4));
  assert.equal(r.ruleId, 'DEBOUNCE-REARM'); assert.equal(r.state.scheduledFor, 6);
  assert.equal(r.state.lastTime, 3); assert.equal(r.state.value, 'b');
  assert.deepEqual(r.actions, [{ type: 'schedule', resource: resource(1), delay: 2 }]);
});
test('M02C-MODEL: current deadline firing cancels before forwarding and returns to idle', () => {
  assert.deepEqual(stepModel(m, pending(m), fire(0, 4)), {
    ruleId: 'DEBOUNCE-EMIT', state: { phase: 'Idle', now: 4, nextTimer: 1 },
    actions: [cancel(0), notify({ kind: 'N', value: 'a' })],
  });
});
test('M02C-MODEL: a late firing uses actual clock time rather than backdating output', () => {
  const r = stepModel(m, pending(m), fire(0, 9)); assert.equal(r.state.now, 9);
  assert.deepEqual(r.actions, [cancel(0), notify({ kind: 'N', value: 'a' })]);
});
test('M02C-MODEL: new value before a delayed wake-up can postpone an expired old deadline', () => {
  const s = stepModel(m, pending(m), next('b', 8)).state;
  const r = stepModel(m, s, fire(0, 9)); assert.equal(r.ruleId, 'DEBOUNCE-REARM');
  assert.equal(s.deadline, 11); assert.equal(s.scheduledFor, 4);
  assert.deepEqual(r.actions, [{ type: 'schedule', resource: resource(1), delay: 2 }]);
});
for (const mode of ['Idle', 'Pending']) {
  for (const kind of ['complete', 'error', 'cancel']) {
    test(`M02C-MODEL: ${kind} from ${mode} has literal ordered cleanup`, () => {
      const before = mode === 'Idle' ? start(m) : pending(m);
      const error = { fault: true };
      const e = { type: kind === 'cancel' ? 'cancel' : `source.${kind}`, now: 2, ...(kind === 'error' ? { error } : {}) };
      const result = stepModel(m, before, e);
      const expected = kind === 'complete' ? (mode === 'Pending' ? [cancel(0), notify({ kind: 'N', value: 'a' }), notify({ kind: 'C' }), release] : [notify({ kind: 'C' }), release]) :
        [...(kind === 'error' ? [notify({ kind: 'E', error })] : []), release, ...(mode === 'Pending' ? [cancel(0)] : [])];
      assert.deepEqual(result.actions, expected);
      assert.deepEqual(result.state, { phase: 'Closed', now: 2, reason: kind });
      assert.equal('value' in result.state, false);
    });
  }
}
test('M02C-MODEL: zero duration remains pending until a separate scheduler input', () => {
  const z = createDebounceTimeModel(0), s = pending(z, 'x', 1);
  assert.equal(s.deadline, 1); assert.equal(s.phase, 'Pending');
  assert.equal(stepModel(z, s, fire(0, 1)).actions[1].notification.value, 'x');
});
test('M02C-MODEL: undefined, null and object payloads are real pending values', () => {
  for (const value of [undefined, null, {}, NaN]) {
    const s = pending(m, value);
    // The helper default applies to undefined, so explicitly dispatch that case.
    const actual = value === undefined ? stepModel(m, start(m), next(undefined, 1)).state : s;
    assert.ok(Object.is(stepModel(m, actual, fire(0, 4)).actions[1].notification.value, value));
  }
});
test('M02C-MODEL: generations advance across bursts and reject consumed invocations', () => {
  const s = stepModel(m, pending(m), fire(0, 4)).state;
  const second = stepModel(m, s, next('b', 5)).state;
  assert.equal(second.timer.generation, 1);
  assert.throws(() => stepModel(m, second, fire(0, 8)), /illegal/);
});
test('M02C-MODEL: rearmed invocations reject stale and foreign identities', () => {
  const s = stepModel(m, stepModel(m, pending(m), next('b', 3)).state, fire(0, 4)).state;
  assert.throws(() => stepModel(m, s, fire(0, 6)), /illegal/);
  assert.throws(() => stepModel(m, s, { ...fire(1, 6), resource: { id: 'other', generation: 1 } }), /illegal/);
});
test('M02C-MODEL: idle, early and post-terminal timer deliveries are illegal domain events', () => {
  assert.throws(() => stepModel(m, start(m), fire(0, 2)), /illegal/);
  assert.throws(() => stepModel(m, pending(m), fire(0, 3)), /illegal/);
  const s = stepModel(m, pending(m), { type: 'cancel', now: 2 }).state;
  for (const e of [fire(0, 4), next('x', 4), { type: 'subscribe', now: 4 }]) assert.throws(() => stepModel(m, s, e), /illegal/);
});
test('M02C-MODEL: invalid duration, backwards clocks and overflow are rejected explicitly', () => {
  for (const d of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => createDebounceTimeModel(d), RangeError);
  for (const now of [-1, 0.5, NaN, Infinity]) assert.throws(() => stepModel(m, start(m), next('x', now)), /illegal/);
  assert.throws(() => stepModel(m, pending(m), next('x', 0)), /illegal/);
  assert.throws(() => stepModel(m, start(m), next('x', Number.MAX_SAFE_INTEGER)), /illegal/);
});
test('M02C-MODEL: exhausted generation can terminate but cannot allocate', () => {
  const s = { phase: 'Idle', now: 0, nextTimer: Number.MAX_SAFE_INTEGER };
  assert.throws(() => stepModel(m, s, next('x', 1)), /illegal/);
  assert.equal(stepModel(m, s, { type: 'source.complete', now: 1 }).state.phase, 'Closed');
});
test('M02C-MODEL: malformed pending memory and timer relations fail validation', () => {
  const s = pending(m);
  for (const patch of [{ deadline: 5 }, { scheduledFor: 5 }, { nextTimer: 3 }, { lastTime: 2 }, { timer: resource(-1) }]) {
    assert.throws(() => stepModel(m, { ...s, ...patch }, fire(0, 4)), /invariant/);
  }
  const { value: _value, ...missing } = s;
  assert.throws(() => stepModel(m, missing, fire(0, 4)), /pending value/);
});
test('M02C-MODEL: explicit tie order produces different valid traces', () => {
  const a = [ { type: 'subscribe', now: 0 }, next('a', 1), next('b', 4), fire(0, 4), fire(1, 7) ];
  const b = [ { type: 'subscribe', now: 0 }, next('a', 1), fire(0, 4), next('b', 4), fire(1, 7) ];
  const outputs = es => runDebounceTimeTrace(m, es.map(event => ({ time: event.now, event })), { executionId: 'ties' }).steps.flatMap(s => s.actions.filter(a => a.type === 'notify').map(a => a.notification.value));
  assert.deepEqual(outputs(a), ['b']); assert.deepEqual(outputs(b), ['a', 'b']);
});
test('M02C-MODEL: clock-aware trace rejects inconsistent envelope time', () => {
  assert.throws(() => runDebounceTimeTrace(m, [{ time: 1, event: { type: 'subscribe', now: 0 } }], { executionId: 'bad' }), /event.now/);
  const trace = runDebounceTimeTrace(m, debounceTimeExample, { executionId: 'example' });
  assert.equal(trace.steps.length, 7); assert.equal(trace.state.phase, 'Closed');
});
test('M02C-MODEL: all eleven rules have legal state-reaching scenarios', () => {
  const reached = new Set();
  for (const kind of ['source.complete', 'source.error', 'cancel']) {
    for (const events of [[], [{ type: 'source.next', value: 'a', time: 1 }]]) {
      for (const id of observeDebounceModel(m, [...events, { type: kind, error: 'fault', time: 2 }]).rules) reached.add(id);
    }
  }
  const events = [{ type: 'source.next', value: 'a', time: 1 }, { type: 'source.next', value: 'b', time: 3 }, { type: 'source.complete', time: 8 }];
  for (const id of observeDebounceModel(m, events).rules) reached.add(id);
  assert.equal(m.rules.length, 11); assert.deepEqual([...reached].sort(), m.rules.map(r => r.description.id).sort());
});
test('M02C-MODEL: no timer or producer is started by manifest or trace generation', () => {
  const manifest = toManifest(m);
  assert.equal(manifest.metadata.schemaVersion, '1.1');
  assert.deepEqual(JSON.parse(JSON.stringify(manifest)), manifest);
  assert.deepEqual(manifest.metadata.actionTypes, ['subscribe', 'schedule', 'cancel-timer', 'notify', 'unsubscribe']);
  assert.equal(runDebounceTimeTrace(m, [], { executionId: 'lazy' }).state.phase, 'Unsubscribed');
});
test('M02C-MODEL: finite inputs and budgets do not imply elapsed time or completion', () => {
  const inputs = debounceTimeExample.slice(0, 2);
  const t = runDebounceTimeTrace(m, inputs, { executionId: 'pending' });
  assert.equal(t.status, 'finished-input'); assert.equal(t.state.phase, 'Pending');
  assert.equal(runDebounceTimeTrace(m, inputs, { executionId: 'budget', maxSteps: 1 }).status, 'budget-exhausted');
});
test('M02C-MODEL: independent executions retain separate pending values and timer counters', () => {
  const a = pending(m, 'a'), b = pending(m, 'b');
  const advanced = stepModel(m, a, fire(0, 4)).state;
  assert.equal(advanced.phase, 'Idle'); assert.equal(b.phase, 'Pending'); assert.equal(b.value, 'b');
});
test('M02C-MODEL: corrupted replacement, delay, payload and action ordering are detected', () => {
  for (const [id, event, mutate] of [
    ['DEBOUNCE-REPLACE', next('b', 2), r => ({ ...r, state: { ...r.state, value: 'wrong' } })],
    ['DEBOUNCE-REARM', fire(0, 4), r => ({ ...r, actions: r.actions.map(a => ({ ...a, delay: 99 })) })],
    ['DEBOUNCE-EMIT', fire(0, 8), r => ({ ...r, actions: [...r.actions].reverse() })],
    ['DEBOUNCE-EMIT', fire(0, 8), r => ({ ...r, actions: [r.actions[0], notify({ kind: 'N', value: 'wrong' })] })],
  ]) {
    const bad = { ...m, rules: m.rules.map(r => r.description.id === id ? { ...r, react: (...args) => mutate(r.react(...args)) } : r) };
    const s = id === 'DEBOUNCE-REARM' ? stepModel(m, pending(m), next('b', 3)).state : pending(m);
    assert.throws(() => stepModel(bad, s, event), /invariant|schedule|order|payload/);
  }
});
test('M02C-MODEL: overlapping guards remain an error rather than priority dispatch', () => {
  const r = m.rules.find(r => r.description.id === 'DEBOUNCE-EMIT');
  assert.throws(() => stepModel({ ...m, rules: [...m.rules, r] }, pending(m), fire(0, 4)), /ambiguous/);
});

test('M02C-MODEL: every generated rule view retains all canonical rule IDs', async () => {
  const { renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace } = await import('../dist/render.js');
  const manifest = toManifest(m);
  for (const render of [renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior]) {
    const text = render(manifest);
    for (const rule of manifest.rules) assert.ok(text.includes(rule.id));
    assert.equal(render(manifest), text);
  }
  const text = renderTrace(runDebounceTimeTrace(m, debounceTimeExample, { executionId: 'views' }));
  assert.ok(text.includes('Four lanes')); assert.ok(text.includes('schedule(debounce-timer#1, delay=2)'));
});
