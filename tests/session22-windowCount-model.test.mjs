import test from 'node:test';
import assert from 'node:assert/strict';
import { runTrace, stepModel, toManifest, validateModel } from '../dist/runner.js';
import { createWindowCountModel, windowCountExample, windowCountGapExample, windowCountCancelExample } from '../dist/models/session22-windowCount.js';

const ref = id => ({ id, generation: 0 });
const sub = id => ({ type: 'subscribe', resource: ref(id) });
const unsub = id => ({ type: 'unsubscribe', resource: ref(id) });
const notify = (target, notification) => ({ type: 'notify', target, notification });
const sourceNext = value => ({ type: 'source.next', value });
const attach = (observerId, windowId) => ({ type: 'window.subscribe', observerId, windowId });
const detach = observerId => ({ type: 'window.unsubscribe', observerId });
const connect = { type: 'subscribe' };
const execute = (model, events) => {
  let state = model.initialState();
  const actions = [], rules = [];
  for (const event of events) {
    const reaction = stepModel(model, state, event);
    state = reaction.state; actions.push(...reaction.actions); rules.push(reaction.ruleId);
  }
  return { state, actions, rules };
};

test('S22 WINDOWCOUNT MODEL: source inspected, complete six-tuple/obligations and declared scope', () => {
  for (const [size, stride] of [[3, 1], [2, 3], [3, 0], [2, 2]]) {
    const model = createWindowCountModel(size, stride);
    assert.deepEqual(validateModel(model), []);
    const manifest = toManifest(model);
    assert.equal(manifest.metadata.operator, 'windowCount');
    assert.equal(manifest.metadata.evidence.record, 'evidence/SESSION-22.md');
    assert.match(manifest.metadata.cardinality.signature, /Observable<T>\*/);
    assert.match(manifest.metadata.cardinality.signature, /windowCount/);
    assert.equal(manifest.rules.length, model.rules.length);
    assert.ok(manifest.rules.every(r => r.guard && r.actions.length && r.obligations.length));
  }
  assert.equal(createWindowCountModel(3).parameters.startEvery, 3);
  for (const [size, stride] of [[0, 0], [-1, 1], [1.5, 1], [2, -1], [2, Infinity], [NaN, 1]])
    assert.throws(() => createWindowCountModel(size, stride), RangeError);
});

test('S22 WINDOWCOUNT MODEL: initial handle precedes source connection', () => {
  const model = createWindowCountModel(2);
  assert.deepEqual(execute(model, [connect]).actions, [
    notify('downstream', { kind: 'N', value: { windowId: 0 } }), sub('source'),
  ]);
  assert.deepEqual(model.initialState(), { phase: 'Unsubscribed' });
});

test('S22 WINDOWCOUNT MODEL: overlap forwards to all current windows, closes oldest then opens next', () => {
  const m = createWindowCountModel(3, 1);
  const before = execute(m, [connect, attach('A', 0), sourceNext('a'), attach('B', 1), sourceNext('b')]).state;
  const r = stepModel(m, before, sourceNext('c'));
  assert.deepEqual(r.actions, [
    notify('windowObserver:A', { kind: 'N', value: 'c' }),
    notify('windowObserver:B', { kind: 'N', value: 'c' }),
    notify('windowObserver:A', { kind: 'C' }), unsub('windowObserver:A'),
    notify('downstream', { kind: 'N', value: { windowId: 3 } }),
  ]);
  assert.deepEqual(r.state.windows.map(w => w.status), ['complete', 'open', 'open', 'open']);
  assert.deepEqual(r.state.consumers, [{ observerId: 'B', windowId: 1 }]);
  assert.equal(r.state.seen, 3);
});

test('S22 WINDOWCOUNT MODEL: contiguous full window closes and replacement opens immediately after last value', () => {
  const m = createWindowCountModel(2);
  const before = execute(m, [connect, attach('A', 0), sourceNext('a')]).state;
  const r = stepModel(m, before, sourceNext('b'));
  assert.deepEqual(r.actions, [
    notify('windowObserver:A', { kind: 'N', value: 'b' }),
    notify('windowObserver:A', { kind: 'C' }), unsub('windowObserver:A'),
    notify('downstream', { kind: 'N', value: { windowId: 1 } }),
  ]);
  assert.equal(r.state.windows[1].status, 'open');
  const closed = stepModel(m, r.state, { type: 'source.complete' });
  assert.deepEqual(closed.actions, [notify('downstream', { kind: 'C' }), unsub('source')]);
  assert.equal(closed.state.windows[1].status, 'complete');
});

test('S22 WINDOWCOUNT MODEL: gapped stride drops source values outside any open window', () => {
  const m = createWindowCountModel(2, 3);
  const p = execute(m, [connect, attach('A', 0), sourceNext('a'), sourceNext('b')]);
  assert.equal(p.state.windows[0].status, 'complete');
  const gap = stepModel(m, p.state, sourceNext('discarded'));
  assert.deepEqual(gap.actions, [notify('downstream', { kind: 'N', value: { windowId: 1 } })]);
  assert.equal(gap.state.seen, 3);
  const r = execute(m, [connect, attach('A', 0), sourceNext('a'), sourceNext('b'), sourceNext('discarded'),
    attach('B', 1), sourceNext('d')]);
  assert.deepEqual(r.actions.filter(a => a.type === 'notify' && a.notification.kind === 'N' && typeof a.notification.value === 'string').map(a => a.notification.value), ['a', 'b', 'd']);
});

test('S22 WINDOWCOUNT MODEL: multiple attached observers share one source without replay', () => {
  const m = createWindowCountModel(3);
  const a = execute(m, [connect, sourceNext('missed'), attach('A', 0), attach('B', 0), sourceNext(null)]);
  assert.deepEqual(a.actions.filter(x => x.type === 'notify' && x.target !== 'downstream'),
    [notify('windowObserver:A', { kind: 'N', value: null }), notify('windowObserver:B', { kind: 'N', value: null })]);
  assert.equal(a.actions.filter(x => x.type === 'subscribe' && x.resource.id === 'source').length, 1);
});

test('S22 WINDOWCOUNT MODEL: completed window is retained for immediate late completion', () => {
  const m = createWindowCountModel(1);
  const r = execute(m, [connect, sourceNext('a'), attach('late', 0), { type: 'source.complete' },
    attach('later', 0), attach('new-late', 1)]);
  for (const id of ['late', 'later', 'new-late']) assert.deepEqual(
    r.actions.filter(a => a.type === 'notify' && a.target === 'windowObserver:' + id),
    [notify('windowObserver:' + id, { kind: 'C' })]);
});

test('S22 WINDOWCOUNT MODEL: successful completion closes all current consumers before outer', () => {
  const m = createWindowCountModel(3, 1);
  const s = execute(m, [connect, attach('A', 0), sourceNext(1), attach('B', 1)]).state;
  const r = stepModel(m, s, { type: 'source.complete' });
  assert.deepEqual(r.actions, [
    notify('windowObserver:A', { kind: 'C' }), unsub('windowObserver:A'),
    notify('windowObserver:B', { kind: 'C' }), unsub('windowObserver:B'),
    notify('downstream', { kind: 'C' }), unsub('source'),
  ]);
  assert.equal(r.state.phase, 'Stopped'); assert.equal(r.state.reason, 'complete');
  assert.deepEqual(r.state.consumers, []);
});

test('S22 WINDOWCOUNT MODEL: source error preserves identity in current and late window observers', () => {
  const m = createWindowCountModel(3), fault = {};
  const s = execute(m, [connect, attach('A', 0)]).state;
  const e = stepModel(m, s, { type: 'source.error', error: fault });
  assert.deepEqual(e.actions, [
    notify('windowObserver:A', { kind: 'E', error: fault }), unsub('windowObserver:A'),
    notify('downstream', { kind: 'E', error: fault }), unsub('source'),
  ]);
  const late = stepModel(m, e.state, attach('late', 0));
  assert.deepEqual(late.actions, [sub('windowObserver:late'),
    notify('windowObserver:late', { kind: 'E', error: fault }), unsub('windowObserver:late')]);
});

test('S22 WINDOWCOUNT MODEL: cancellation is silent, does not complete open windows and permits later child attachment', () => {
  const m = createWindowCountModel(3);
  const s = execute(m, [connect, attach('A', 0)]).state;
  const r = stepModel(m, s, { type: 'cancel' });
  assert.deepEqual(r.actions, [unsub('source')]);
  assert.equal(r.state.reason, 'cancel');
  assert.equal(r.state.windows[0].status, 'open');
  assert.deepEqual(r.state.consumers, [{ observerId: 'A', windowId: 0 }]);
  const later = stepModel(m, r.state, attach('B', 0));
  assert.deepEqual(later.actions, [sub('windowObserver:B')]);
  const stop = stepModel(m, later.state, detach('A'));
  assert.deepEqual(stop.actions, [unsub('windowObserver:A')]);
  assert.equal(stop.state.consumers.length, 1);
});

test('S22 WINDOWCOUNT MODEL: local consumer cancellation does not alter source or peer observer', () => {
  const m = createWindowCountModel(3);
  const r = execute(m, [connect, attach('A', 0), attach('B', 0), detach('A'), sourceNext('x')]);
  assert.deepEqual(r.actions.at(-1), notify('windowObserver:B', { kind: 'N', value: 'x' }));
  assert.equal(r.state.phase, 'Active');
});

test('S22 WINDOWCOUNT MODEL: invalid/duplicate observers and late source events are rejected', () => {
  const m = createWindowCountModel(2);
  const active = execute(m, [connect, attach('A', 0)]).state;
  for (const e of [attach('A', 0), attach('', 0), attach('unknown', 5), detach('unknown'), connect])
    assert.throws(() => stepModel(m, active, e));
  const stopped = stepModel(m, active, { type: 'source.complete' }).state;
  for (const e of [sourceNext(1), { type: 'source.complete' }, { type: 'cancel' }, attach('A', 0)])
    assert.throws(() => stepModel(m, stopped, e));
});

test('S22 WINDOWCOUNT MODEL: state-dependent constraints reject forged count, identities, windows and ownership', () => {
  const m = createWindowCountModel(3, 1);
  const s = execute(m, [connect, attach('A', 0), sourceNext('one')]).state;
  for (const bad of [
    { ...s, seen: -1 }, { ...s, nextWindowId: 9 }, { ...s, windows: [] },
    { ...s, windows: [{ windowId: 0, openedAt: 0, status: 'complete' }, ...s.windows.slice(1)] },
    { ...s, windows: s.windows.map(w => ({ ...w, openedAt: 99 })) },
    { ...s, windows: s.windows.map(w => ({ ...w, openedAt: 0 })) },
    { ...s, windows: s.windows.slice(0, 1), nextWindowId: 1 },
    { ...s, usedObservers: ['A', 'A'] },
    { ...s, consumers: [{ observerId: 'A', windowId: 9 }] },
    { ...s, phase: 'Stopped', reason: 'complete' },
  ]) assert.throws(() => stepModel(m, bad, sourceNext(3)));
  const cancelled = stepModel(m, s, { type: 'cancel' }).state;
  const forged = { ...cancelled, consumers: [], windows: cancelled.windows.map(w => ({ ...w, status: 'complete' })) };
  assert.throws(() => stepModel(m, forged, attach('late', 0)));
});

test('S22 WINDOWCOUNT MODEL: reactions are immutable even with frozen nested windows/consumer memory', () => {
  const m = createWindowCountModel(2, 1);
  const raw = execute(m, [connect, attach('A', 0), sourceNext('a')]).state;
  const before = Object.freeze({ ...raw, windows: Object.freeze(raw.windows.map(Object.freeze)),
    consumers: Object.freeze(raw.consumers.map(Object.freeze)), usedObservers: Object.freeze(raw.usedObservers) });
  const r = stepModel(m, before, sourceNext('b'));
  assert.equal(before.seen, 1); assert.equal(before.windows[0].status, 'open');
  assert.equal(r.state.seen, 2); assert.equal(r.state.windows[0].status, 'complete');
});

test('S22 WINDOWCOUNT MODEL: overlap, gap and cancellation histories render without unhandled inputs', () => {
  for (const [model, events] of [
    [createWindowCountModel(3, 1), windowCountExample],
    [createWindowCountModel(2, 3), windowCountGapExample],
    [createWindowCountModel(3), windowCountCancelExample],
  ]) {
    const trace = runTrace(model, events, { executionId: 's22-example' });
    assert.equal(trace.status, 'finished-input');
    assert.equal(trace.state.phase, 'Stopped');
  }
});

test('S22 WINDOWCOUNT REACHABILITY: every guard is witnessed by a legal input sequence', () => {
  const m = createWindowCountModel(2, 1);
  const all = [
    [connect, attach('A', 0), sourceNext('a'), attach('B', 1), sourceNext('b'),
      attach('old', 0), detach('B'), { type: 'source.complete' }, attach('after', 1)],
    [connect, attach('A', 0), { type: 'source.error', error: 'E' }, attach('lateError', 0)],
    [connect, attach('A', 0), { type: 'cancel' }, attach('B', 0), detach('B'), detach('A')],
    [connect, sourceNext('a'), sourceNext('b'), attach('old', 0), { type: 'cancel' }],
  ];
  const ids = new Set(all.flatMap(events => execute(m, events).rules));
  assert.deepEqual([...ids].sort(), m.rules.map(r => r.description.id).sort());
  console.log('SESSION22_WINDOWCOUNT_RULE_WITNESSES', ids.size);
});
