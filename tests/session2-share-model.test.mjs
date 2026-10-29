import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, runTrace, validateModel, toManifest } from '../dist/runner.js';
import { createShareModel, shareExample } from '../dist/models/share.js';
import { observeShareModel } from './helpers/session2-share-driver.mjs';
import { words } from './helpers/session2-flatten-driver.mjs';
const join = subscriber => ({ type: 'subscriber.subscribe', subscriber });
const leave = subscriber => ({ type: 'subscriber.unsubscribe', subscriber });
const source = generation => ({ id: 'source', generation });
const start = m => stepModel(m, m.initialState(), join('A')).state;
const options = [];
for (const resetOnError of [false, true]) for (const resetOnComplete of [false, true]) for (const resetOnRefCountZero of [false, true]) options.push({ resetOnError, resetOnComplete, resetOnRefCountZero });

for (const config of options) {
  const m = createShareModel(config);
  test(`S2-SHARE-MODEL ${m.metadata.id}: initial and joining states preserve one connection`, () => {
    assert.deepEqual(validateModel(m), []);
    const a = stepModel(m, m.initialState(), join('A'));
    assert.deepEqual(a.actions, [{ type: 'subscribe', resource: source(0) }]);
    const b = stepModel(m, a.state, join('B'));
    assert.deepEqual(b.actions, []); assert.deepEqual(b.state.subscribers, ['A', 'B']); assert.deepEqual(b.state.connection, source(0));
  });
  test(`S2-SHARE-MODEL ${m.metadata.id}: last departure follows configured policy without completion`, () => {
    const r = stepModel(m, start(m), leave('A'));
    assert.deepEqual(r.actions, config.resetOnRefCountZero ? [{ type: 'unsubscribe', resource: source(0) }] : []);
    assert.equal(r.state.phase, config.resetOnRefCountZero ? 'Disconnected' : 'Connected');
    const joined = stepModel(m, r.state, join('B'));
    assert.equal(joined.state.connection.generation, config.resetOnRefCountZero ? 1 : 0);
  });
  test(`S2-SHARE-MODEL ${m.metadata.id}: termination preserves addressed order and reset policy`, () => {
    const s = stepModel(m, start(m), join('B')).state;
    for (const kind of ['complete', 'error']) {
      const event = kind === 'complete' ? { type: 'source.complete', resource: source(0) } : { type: 'source.error', resource: source(0), error: undefined };
      const r = stepModel(m, s, event), resetting = kind === 'complete' ? config.resetOnComplete : config.resetOnError;
      assert.deepEqual(r.actions.map(a => a.type === 'notify' ? a.target : a.type), ['A', 'B', 'unsubscribe']);
      assert.equal(r.state.phase, resetting ? 'Disconnected' : kind === 'complete' ? 'Completed' : 'Errored');
      const later = stepModel(m, r.state, join('C'));
      if (resetting) assert.deepEqual(later.actions, [{ type: 'subscribe', resource: source(1) }]);
      else { assert.equal(later.actions.length, 1); assert.equal(later.actions[0].target, 'C'); assert.equal(later.actions[0].notification.kind, kind === 'complete' ? 'C' : 'E'); }
    }
  });
  test(`S2-SHARE-MODEL ${m.metadata.id}: bounded legal command prefixes reach every instantiated rule`, () => {
    const reached = new Set();
    for (const word of words(['join', 'leave', 'next', 'complete', 'error'], 4)) for (const id of observeShareModel(createShareModel(config), word).ruleIds) reached.add(id);
    assert.deepEqual([...reached].sort(), m.rules.map(r => r.description.id).sort());
  });
}

test('S2-SHARE-MODEL: broadcast preserves payload identity and subscription registration order', () => {
  const m = createShareModel(); let s = stepModel(m, start(m), join('B')).state;
  s = stepModel(m, s, leave('A')).state; s = stepModel(m, s, join('C')).state;
  for (const value of [undefined, null, NaN, {}, () => {}]) {
    const r = stepModel(m, s, { type: 'source.next', resource: source(0), value });
    assert.deepEqual(r.actions.map(a => a.target), ['B', 'C']);
    for (const a of r.actions) assert.ok(Object.is(a.notification.value, value));
  }
});
test('S2-SHARE-MODEL: no replay when a subscriber joins an already live connection', () => {
  const m = createShareModel(), s = stepModel(m, start(m), { type: 'source.next', resource: source(0), value: 'past' }).state;
  assert.deepEqual(stepModel(m, s, join('B')).actions, []);
});
test('S2-SHARE-MODEL: stale source generations and duplicate subscription occurrences are illegal', () => {
  const m = createShareModel(), initial = m.initialState(), a = start(m), stopped = stepModel(m, a, leave('A')).state;
  const current = stepModel(m, stopped, join('B')).state;
  for (const s of [initial, stopped, current]) assert.throws(() => stepModel(m, s, { type: 'source.next', resource: source(0), value: 'stale' }), /illegal/);
  assert.throws(() => stepModel(m, a, join('A')), /illegal/);
  assert.throws(() => stepModel(m, stopped, join('A')), /illegal/);
  assert.throws(() => stepModel(m, a, leave('absent')), /illegal/);
});
test('S2-SHARE-MODEL: terminal error identity survives late subscription', () => {
  const m = createShareModel({ resetOnError: false });
  for (const error of [undefined, null, {}, new Error('sentinel')]) {
    const r = stepModel(m, start(m), { type: 'source.error', resource: source(0), error });
    const later = stepModel(m, r.state, join('B'));
    assert.equal(later.actions[0].notification.error, error);
  }
});
test('S2-SHARE-MODEL: independent shared Observable instances do not share registries', () => {
  const m = createShareModel(), before = m.initialState(); Object.freeze(before.used); Object.freeze(before);
  const r = stepModel(m, before, join('A'));
  assert.deepEqual(before.used, []); assert.deepEqual(m.initialState().used, []); assert.deepEqual(r.state.used, ['A']);
});
test('S2-SHARE-MODEL: unsupported notifier options and invalid state are rejected', () => {
  for (const config of [{ resetOnError: () => {} }, { resetOnComplete: undefined }, { connector: () => {} }]) assert.throws(() => createShareModel(config), TypeError);
  const m = createShareModel();
  assert.throws(() => stepModel(m, { ...start(m), subscribers: [] }, join('B')), /empty live/);
  assert.throws(() => stepModel(m, { ...start(m), connection: source(7) }, join('B')), /connection/);
  assert.throws(() => stepModel(m, { phase: 'Disconnected', nextConnection: Number.MAX_SAFE_INTEGER, used: [] }, join('A')), /illegal/);
});
test('S2-SHARE-MODEL: corrupted addressed multiplicity is detected', () => {
  const m = createShareModel(), rules = m.rules.map(r => r.description.id === 'SHARE-NEXT' ? { ...r, react: (...args) => { const result = r.react(...args); return { ...result, actions: [...result.actions, ...result.actions] }; } } : r);
  assert.throws(() => stepModel({ ...m, rules }, start(m), { type: 'source.next', resource: source(0), value: 1 }), /multiplicity/);
});
test('S2-SHARE-MODEL: finite trace may end disconnected while future subscriptions remain legal', () => {
  const m = createShareModel(), trace = runTrace(m, shareExample, { executionId: 'share-example' });
  assert.equal(trace.status, 'finished-input'); assert.equal(trace.state.phase, 'Disconnected');
  assert.equal(stepModel(m, trace.state, join('E')).state.phase, 'Connected');
  assert.deepEqual(JSON.parse(JSON.stringify(toManifest(m))), toManifest(m));
});
