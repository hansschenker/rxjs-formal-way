import test from 'node:test';
import assert from 'node:assert/strict';
import { runTrace, stepModel, toManifest, validateModel } from '../dist/runner.js';
import { createZipModel, zipExample, zipDrainExample, zipCancelExample } from '../dist/models/session23-zip.js';
const start = { type: 'subscribe' };
const next = (index, value) => ({ type: 'input.next', index, value });
const complete = index => ({ type: 'input.complete', index });
const error = (index, error) => ({ type: 'input.error', index, error });
const cancel = { type: 'cancel' };
const resource = index => ({ id: 'input:' + index, generation: 0 });
const sub = index => ({ type: 'subscribe', resource: resource(index) });
const unsub = index => ({ type: 'unsubscribe', resource: resource(index) });
const notify = notification => ({ type: 'notify', target: 'downstream', notification });
const execute = (events, count = 3, limit = 8) => {
  const model = createZipModel(count, limit); let state = model.initialState();
  const actions = [], rules = [];
  for (const event of events) { const result = stepModel(model, state, event); state = result.state; actions.push(...result.actions); rules.push(result.ruleId); }
  return { state, actions, rules };
};
const notifications = result => result.actions.filter(a => a.type === 'notify').map(a => a.notification);

test('S23 ZIP MODEL: pinned pipeable identity, guarded rules and explicit bounded scope', () => {
  for (const n of [1, 2, 3, 16]) { const m = createZipModel(n); assert.deepEqual(validateModel(m), []);
    const manifest = toManifest(m); assert.equal(manifest.metadata.operator, 'zip');
    assert.equal(manifest.metadata.rxjsVersion, '7.8.2'); assert.equal(manifest.metadata.evidence.record, 'evidence/SESSION-23.md');
    assert.match(manifest.metadata.cardinality.signature, /T\*/); assert.equal(manifest.rules.length, 8);
    assert.ok(manifest.rules.every(r => r.guard && r.actions.length && r.obligations.length));
  }
  for (const n of [0, -1, 1.5, 17, NaN, Infinity]) assert.throws(() => createZipModel(n), RangeError);
  for (const b of [0, -1, 0.5, 33, NaN, Infinity]) assert.throws(() => createZipModel(2, b), RangeError);
});
test('S23 ZIP MODEL: first connection acquires source then auxiliary occurrences', () => {
  assert.deepEqual(execute([start]).actions, [sub(0), sub(1), sub(2)]);
});
test('S23 ZIP MODEL: construction is inert and each initial execution gets fresh memory', () => {
  const m = createZipModel(); assert.deepEqual(m.initialState(), { phase: 'Unsubscribed' });
  const a = stepModel(m, m.initialState(), start).state, b = stepModel(m, m.initialState(), start).state;
  assert.notEqual(a, b); assert.notEqual(a.queues, b.queues); assert.notEqual(a.queues[0], b.queues[0]);
});
test('S23 ZIP MODEL: unmatched arrivals remain FIFO rather than latest values', () => {
  const r = execute([start, next(0, 'a1'), next(0, 'a2'), next(2, 'c1'), next(1, 'b1'), next(2, 'c2'), next(1, 'b2')]);
  assert.deepEqual(notifications(r), [{ kind: 'N', value: ['a1','b1','c1'] }, { kind: 'N', value: ['a2','b2','c2'] }]);
  assert.deepEqual(r.state.queues, [[],[],[]]); assert.deepEqual(r.state.received, [2,2,2]); assert.equal(r.state.emitted, 2);
});
test('S23 ZIP MODEL: any input can supply the last missing tuple member', () => {
  for (const trigger of [0,1,2]) {
    const sequence = [0,1,2].filter(i => i !== trigger).concat(trigger);
    assert.deepEqual(notifications(execute([start, ...sequence.map(i => next(i, i))])), [{ kind: 'N', value: [0,1,2] }]);
  }
});
test('S23 ZIP MODEL: zero auxiliaries still wrap every source value in a singleton tuple', () => {
  assert.deepEqual(notifications(execute([start, next(0, undefined), next(0, 4), complete(0)],1)),
    [{kind:'N',value:[undefined]}, {kind:'N',value:[4]}, {kind:'C'}]);
});
test('S23 ZIP MODEL: completed input releases its connection but retains queued values', () => {
  const r = execute([start, next(0,'a'), next(0,'b'), complete(0)]);
  assert.deepEqual(r.actions.slice(-1), [unsub(0)]); assert.deepEqual(r.state.live, [false,true,true]);
  assert.deepEqual(r.state.queues, [['a','b'],[],[]]); assert.deepEqual(notifications(r), []);
});
test('S23 ZIP MODEL: consuming final completed contribution emits tuple then complete before cleanup', () => {
  const r = execute([start, next(0,'a'), complete(0), next(1,'b'), next(2,'c')]);
  assert.deepEqual(r.actions.slice(-4), [notify({kind:'N',value:['a','b','c']}), notify({kind:'C'}), unsub(1), unsub(2)]);
  assert.deepEqual(r.state, {phase:'Closed',reason:'exhausted'});
});
test('S23 ZIP MODEL: empty completion immediately discards unmatched other values', () => {
  const r=execute([start,next(2,'unmatched'),complete(1)]);
  assert.deepEqual(r.actions.slice(-4), [notify({kind:'C'}),unsub(0),unsub(1),unsub(2)]);
  assert.deepEqual(notifications(r),[{kind:'C'}]); assert.ok(!('queues' in r.state));
});
test('S23 ZIP MODEL: errors from every input preserve payload identity and release in registration order', () => {
  const fault=Object.freeze({fault:true});
  for (const i of [0,1,2]) {const r=execute([start,next(0,'pending'),error(i,fault)]);
    assert.deepEqual(r.actions.slice(-4),[notify({kind:'E',error:fault}),unsub(0),unsub(1),unsub(2)]);
    assert.equal(notifications(r)[0].error,fault); assert.equal(r.state.reason,'error');}
});
test('S23 ZIP MODEL: cancellation is silent and releases only remaining live inputs', () => {
  const r=execute([start,next(1,'b'),complete(1),cancel]);
  assert.deepEqual(r.actions,[sub(0),sub(1),sub(2),unsub(1),unsub(0),unsub(2)]);
  assert.equal(r.state.reason,'cancel');
});
test('S23 ZIP MODEL: invalid addresses, completed inputs and post-terminal events are illegal', () => {
  const m=createZipModel();const active=execute([start]).state;
  for (const i of [-1,0.5,3,NaN,Infinity]) for (const e of [next(i,1),complete(i),error(i,'e')]) assert.throws(()=>stepModel(m,active,e));
  const buffered=execute([start,next(0,1),complete(0)]).state;
  for (const e of [next(0,2),complete(0),error(0,'late')]) assert.throws(()=>stepModel(m,buffered,e));
  const closed=execute([start,cancel]).state;
  for (const e of [start,cancel,next(0,1),complete(0),error(0,'late')]) assert.throws(()=>stepModel(m,closed,e));
});
test('S23 ZIP MODEL: FIFO bound rejects out-of-scope history without defining a drop policy', () => {
  const m=createZipModel(2,1),r=execute([start,next(0,'a')],2,1);
  assert.throws(()=>stepModel(m,r.state,next(0,'b')),/illegal/);
  assert.deepEqual(r.state.queues,[['a'],[]]);
  assert.deepEqual(stepModel(m,r.state,next(1,'b')).actions,[notify({kind:'N',value:['a','b']})]);
});
test('S23 ZIP MODEL: forged stable-state queue, count and completion invariants are rejected', () => {
  const m=createZipModel(2,2),s=execute([start,next(0,'a')],2,2).state;
  const bads=[{...s,queues:[[]]},{...s,live:[true]},{...s,received:[1]}, {...s,live:[true,'yes']},
    {...s,queues:[['a'],['b']],received:[1,1]}, {...s,live:[true,false]},
    {...s,received:[0,0]}, {...s,emitted:-1}, {...s,queues:[['a','b','c'],[]],received:[3,0]},
    {...s,received:[Infinity,0]}];
  for(const bad of bads)assert.throws(()=>stepModel(m,bad,next(1,'x')));
});
test('S23 ZIP MODEL: pure queue updates preserve opaque references and emit fresh tuples', () => {
  const payload=Object.freeze({opaque:true}),m=createZipModel(2),raw=execute([start,next(0,payload)],2).state;
  const before=Object.freeze({...raw,queues:Object.freeze(raw.queues.map(Object.freeze)),live:Object.freeze(raw.live),received:Object.freeze(raw.received)});
  const first=stepModel(m,before,next(1,undefined));
  assert.equal(first.actions[0].notification.value[0],payload); assert.deepEqual(before.queues,[[payload],[]]);
  const next0=stepModel(m,first.state,next(0,payload)),second=stepModel(m,next0.state,next(1,null));
  assert.notEqual(first.actions[0].notification.value,second.actions[0].notification.value);
  assert.deepEqual(second.actions[0].notification.value,[payload,null]);
});
test('S23 ZIP MODEL: all three timed examples are legal and terminate', () => {
  for(const [i,events] of [zipExample,zipDrainExample,zipCancelExample].entries()){
    const trace=runTrace(createZipModel(),events,{executionId:'zip-example-'+i});
    assert.equal(trace.status,'finished-input');assert.equal(trace.state.phase,'Closed');
    assert.deepEqual(trace.steps.map(s=>s.time),events.map(e=>e.time));
  }
});
test('S23 ZIP MODEL: safe-integer counters cannot overflow on an arrival', () => {
  const m=createZipModel(1),s={phase:'Active',queues:[[]],live:[true],received:[Number.MAX_SAFE_INTEGER],emitted:Number.MAX_SAFE_INTEGER};
  assert.deepEqual(m.validateState(s,m.parameters),[]);assert.throws(()=>stepModel(m,s,next(0,'overflow')),/illegal/);
});
test('S23 ZIP MODEL: every retained guarded rule has a legal witness', () => {
  const histories=[[start,next(0,'a'),next(1,'b'),next(2,'c'),complete(0)],
    [start,next(0,'a'),complete(0),next(1,'b'),next(2,'c')], [start,error(1,'e')], [start,cancel]];
  const seen=new Set(histories.flatMap(h=>execute(h).rules));
  assert.deepEqual([...seen].sort(),createZipModel().rules.map(r=>r.description.id).sort());
  console.log('SESSION23_ZIP_RULE_WITNESSES',seen.size);
});
