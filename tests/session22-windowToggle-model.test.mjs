import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, toManifest, validateModel } from '../dist/runner.js';
import { createWindowToggleModel, runWindowToggleTrace, windowToggleExample, windowToggleEmptyCloseExample, windowToggleCancelExample } from '../dist/models/session22-windowToggle.js';

const model = createWindowToggleModel();
const ref = (id, generation = 0) => ({ id, generation });
const start = { type: 'subscribe' };
const open = (value = 'open') => ({ type: 'opening.next', value });
const returned = (id = 0) => ({ type: 'selector.return', resource: ref('closingSelector', id) });
const signal = (type, id = 0, error) => ({ type: 'closing.' + type, resource: ref('closing', id), ...(type === 'error' ? { error } : {}) });
const attach = (observerId = 'A', windowId = 0) => ({ type: 'window.subscribe', observerId, windowId });
const detach = (observerId = 'A') => ({ type: 'window.unsubscribe', observerId });
const sub = (id, generation = 0) => ({ type: 'subscribe', resource: ref(id, generation) });
const unsub = (id, generation = 0) => ({ type: 'unsubscribe', resource: ref(id, generation) });
const notify = (target, notification) => ({ type: 'notify', target, notification });
const execute = events => {
  let state = model.initialState(); const actions = [], rules = [];
  for (const event of events) { const r = stepModel(model, state, event); state = r.state; actions.push(...r.actions); rules.push(r.ruleId); }
  return { state, actions, rules };
};
const one = () => execute([start, open(), returned(), attach()]).state;

test('S22 TOGGLE MODEL: coherent canonical metadata and inert subscription setup', () => {
  assert.deepEqual(validateModel(model), []); assert.deepEqual(model.initialState(), { phase: 'Unsubscribed' });
  assert.deepEqual(execute([start]).actions, [sub('opening'), sub('source')]);
  const m = toManifest(model); assert.equal(m.metadata.evidence.record, 'evidence/SESSION-22.md');
  assert.equal(m.metadata.controls.find(c => c.id === 'Stopped').terminal, false);
  assert.match(m.metadata.cardinality.signature, /Cω/);
});

test('S22 TOGGLE MODEL: opening invokes exact payload before announcing and acquiring closing', () => {
  const value = {};
  const pending = stepModel(model, execute([start]).state, open(value));
  assert.equal(pending.state.phase, 'Selecting'); assert.equal(pending.state.windows[0].announced, false);
  assert.deepEqual(pending.actions, [{ type: 'invoke-callback', resource: ref('closingSelector'), index: 0, value }]);
  const r = stepModel(model, pending.state, returned());
  assert.deepEqual(r.actions, [notify('downstream',{ kind: 'N', value: { windowId: 0 } }), sub('closing')]);
  assert.equal(pending.actions[0].value, value);
});

test('S22 TOGGLE MODEL: no windows drops values and multiple consumers preserve opaque payload identity', () => {
  const value = {};
  assert.deepEqual(execute([start, { type: 'source.next', value }]).actions, [sub('opening'),sub('source')]);
  const before = execute([start, open(), returned(), attach('A'), attach('B'), open(), returned(1), attach('C',1)]).state;
  const r = stepModel(model,before,{ type:'source.next',value });
  assert.deepEqual(r.actions, ['A','B','C'].map(n => notify('windowObserver:'+n,{ kind:'N',value })));
  assert.ok(r.actions.every(a => a.notification.value === value)); assert.equal(r.state,before);
});

test('S22 TOGGLE MODEL: closing next completes its children before releasing only its signal', () => {
  const r = stepModel(model,one(),signal('next'));
  assert.deepEqual(r.actions,[notify('windowObserver:A',{kind:'C'}),unsub('windowObserver:A'),unsub('closing')]);
  assert.equal(r.state.windows[0].status,'complete'); assert.equal(r.state.openingLive,true);
  assert.deepEqual(r.state.consumers,[]);
});

test('S22 TOGGLE MODEL: closing complete and opening complete release signals without closing windows', () => {
  const closedSignal=stepModel(model,one(),signal('complete'));
  assert.deepEqual(closedSignal.actions,[unsub('closing')]); assert.equal(closedSignal.state.windows[0].status,'open');
  const noOpening=stepModel(model,closedSignal.state,{type:'opening.complete'});
  assert.deepEqual(noOpening.actions,[unsub('opening')]);
  const r=stepModel(model,noOpening.state,{type:'source.next',value:undefined});
  assert.deepEqual(r.actions,[notify('windowObserver:A',{kind:'N',value:undefined})]);
});

test('S22 TOGGLE MODEL: source completion notifies children then outer before acquisition-order release', () => {
  const r=stepModel(model,one(),{type:'source.complete'});
  assert.deepEqual(r.actions,[notify('windowObserver:A',{kind:'C'}),unsub('windowObserver:A'),notify('downstream',{kind:'C'}),
    unsub('opening'),unsub('source'),unsub('closing')]);
  assert.equal(r.state.windows[0].status,'complete');
});

for(const cause of ['source','closing']) test(`S22 TOGGLE MODEL: ${cause} failure retains error and notifies child before outer`,()=>{
  const error={}; const event=cause==='source'?{type:'source.error',error}:signal('error',0,error);
  const r=stepModel(model,one(),event);
  assert.deepEqual(r.actions,[notify('windowObserver:A',{kind:'E',error}),unsub('windowObserver:A'),notify('downstream',{kind:'E',error}),
    unsub('opening'),unsub('source'),unsub('closing')]);
  assert.equal(r.state.windows[0].error,error); assert.equal(r.state.windows[0].status,'error');
});

test('S22 TOGGLE MODEL: selector failure errors known windows and keeps private failed handle unannounced',()=>{
  const before=stepModel(model,one(),open('bad')).state;
  const r=stepModel(model,before,{type:'selector.throw',resource:ref('closingSelector',1),error:undefined});
  assert.equal(r.state.windows[1].announced,false); assert.equal(r.state.windows[1].status,'error');
  assert.ok(Object.hasOwn(r.state.windows[0],'error'));
  assert.equal(r.actions.some(a=>a.type==='notify'&&a.target==='downstream'&&a.notification.kind==='N'),false);
  assert.throws(()=>stepModel(model,r.state,attach('unknown',1)),/illegal/);
});

test('S22 TOGGLE MODEL: opening failure errors only outer and leaves orphaned consumers on disposed handles',()=>{
  const error={}; const r=stepModel(model,one(),{type:'opening.error',error});
  assert.deepEqual(r.actions,[notify('downstream',{kind:'E',error}),unsub('opening'),unsub('source'),unsub('closing')]);
  assert.equal(r.state.windows[0].status,'disposed'); assert.equal(r.state.consumers.length,1);
  assert.throws(()=>stepModel(model,r.state,attach('late')),/illegal/);
  assert.deepEqual(stepModel(model,r.state,detach()).actions,[unsub('windowObserver:A')]);
});

test('S22 TOGGLE MODEL: outer cancellation is silent and orphan consumers close independently',()=>{
  const r=stepModel(model,one(),{type:'cancel'});
  assert.deepEqual(r.actions,[unsub('opening'),unsub('source'),unsub('closing')]);
  assert.equal(r.state.windows[0].status,'disposed'); assert.equal(r.state.consumers.length,1);
  const detached=stepModel(model,r.state,detach()); assert.deepEqual(detached.actions,[unsub('windowObserver:A')]);
  assert.deepEqual(detached.state.consumers,[]);
});

test('S22 TOGGLE MODEL: old completed handles complete late consumers before and after outer disposal',()=>{
  const r=execute([start,open(),returned(),signal('next'),attach('early'),open(),returned(1),{type:'cancel'},attach('late')]);
  assert.equal(r.state.windows[0].status,'complete'); assert.equal(r.state.windows[1].status,'disposed');
  for(const id of ['early','late']) assert.deepEqual(r.actions.filter(a=>a.type==='notify'&&a.target==='windowObserver:'+id),[notify('windowObserver:'+id,{kind:'C'})]);
});

test('S22 TOGGLE MODEL: retained failed handles replay exact terminal error without source reacquisition',()=>{
  const error={}; const failed=stepModel(model,one(),{type:'source.error',error}).state;
  assert.deepEqual(stepModel(model,failed,attach('late')).actions,[sub('windowObserver:late'),notify('windowObserver:late',{kind:'E',error}),unsub('windowObserver:late')]);
});

test('S22 TOGGLE MODEL: child unsubscribe leaves input ownership and sibling consumer untouched',()=>{
  const before=execute([start,open(),returned(),attach('A'),attach('B')]).state;
  const r=stepModel(model,before,detach('A'));
  assert.deepEqual(r.actions,[unsub('windowObserver:A')]); assert.equal(r.state.openingLive,true);
  assert.deepEqual(r.state.consumers,[{observerId:'B',windowId:0}]);
});

test('S22 TOGGLE MODEL: mismatched selector outcomes and interleaving while selecting are rejected',()=>{
  const s=execute([start,open()]).state;
  for(const event of [returned(1),{type:'selector.return',resource:ref('wrong')},{type:'source.next',value:1},{type:'cancel'},attach()])
    assert.throws(()=>stepModel(model,s,event),/illegal/);
});

test('S22 TOGGLE MODEL: stale closing generations, closed opening and reused child identities are rejected',()=>{
  const s=one(); for(const event of [signal('next',2),{type:'closing.next',resource:ref('bad')},attach(),attach('bad',9),attach(''),detach('absent')])
    assert.throws(()=>stepModel(model,s,event),/illegal/);
  const noClose=stepModel(model,s,signal('complete')).state;
  for(const e of [signal('next'),signal('complete'),signal('error',0,{})]) assert.throws(()=>stepModel(model,noClose,e),/illegal/);
  const noOpening=stepModel(model,noClose,{type:'opening.complete'}).state;
  for(const e of [open(),{type:'opening.complete'},{type:'opening.error',error:{}}]) assert.throws(()=>stepModel(model,noOpening,e),/illegal/);
});

test('S22 TOGGLE MODEL: stopped source and signals are illegal even when orphaned observers remain',()=>{
  const s=stepModel(model,one(),{type:'cancel'}).state;
  for(const e of [{type:'source.next',value:1},{type:'source.complete'},open(),signal('next'),{type:'cancel'}]) assert.throws(()=>stepModel(model,s,e),/illegal/);
});

test('S22 TOGGLE MODEL: impossible lifecycle, identity, pending and consumer states fail validation',()=>{
  const active=one(), pending=execute([start,open()]).state, stopped=stepModel(model,active,{type:'cancel'}).state;
  const invalid=[
    {...active,nextWindowId:2}, {...active,openingLive:'yes'},
    {...active,windows:[{...active.windows[0],windowId:3}]},
    {...active,windows:[{...active.windows[0],announced:false}]},
    {...active,windows:[{...active.windows[0],status:'complete'}]},
    {...active,windows:[{...active.windows[0],status:'error',closingLive:false,error:{}}]},
    {...active,usedObservers:['A','A']}, {...active,consumers:[...active.consumers,...active.consumers]},
    {...pending,pending:9}, {...pending,openingLive:false},
    {...pending,windows:[{...pending.windows[0],status:'complete',announced:true}]},
    {...stopped,openingLive:true}, {...stopped,reason:'source-complete'},
    {...stopped,reason:'selector-error'}, {...stopped,windows:[{...stopped.windows[0],status:'open'}]},
  ];
  for(const s of invalid) assert.ok(model.validateState(s,model.parameters).length,JSON.stringify(s));
});

test('S22 TOGGLE MODEL: wrapper enforces same-time selector outcomes while retaining equal-time ordering',()=>{
  const good=[{time:0,event:start},{time:2,event:open()},{time:2,event:returned()}];
  assert.equal(runWindowToggleTrace(model,good,{executionId:'same-time'}).state.phase,'Active');
  assert.throws(()=>runWindowToggleTrace(model,[...good.slice(0,2),{time:3,event:returned()}],{executionId:'bad-time'}),/invocation envelope time/);
  assert.equal(runWindowToggleTrace(model,good.slice(0,2),{executionId:'prefix'}).state.phase,'Selecting');
});

test('S22 TOGGLE MODEL: frozen states/events remain unchanged and connections own independent bookkeeping',()=>{
  const a=one(), b=one(); assert.notEqual(a.windows,b.windows); assert.notEqual(a.consumers,b.consumers);
  const freeze=x=>{if(x&&typeof x==='object'){Object.freeze(x);for(const y of Object.values(x))freeze(y);}return x;};
  freeze(a); const r=stepModel(model,a,freeze(signal('next')));
  assert.equal(a.windows[0].status,'open'); assert.equal(r.state.windows[0].status,'complete'); assert.equal(b.windows[0].status,'open');
});

test('S22 TOGGLE MODEL: all three registered example histories replay and terminate outer execution',()=>{
  for(const [i,example]of [windowToggleExample,windowToggleEmptyCloseExample,windowToggleCancelExample].entries()){
    const trace=runWindowToggleTrace(model,example,{executionId:'toggle-example-'+i}); assert.equal(trace.state.phase,'Stopped'); assert.deepEqual(trace.state.consumers,[]);
  }
});

test('S22 TOGGLE MODEL: legal finite witnesses exercise every retained guarded rule',()=>{
  const base=[start,open(),returned(),attach()];
  const paths=[
    [...base,{type:'source.next',value:1},signal('next'),attach('late'),{type:'source.complete'},attach('last')],
    [...base,signal('complete'),{type:'opening.complete'},detach(),{type:'cancel'}],
    [...base,{type:'source.error',error:undefined},attach('late')],
    [...base,signal('error',0,{})], [...base,{type:'opening.error',error:{}},detach()],
    [...base,{type:'cancel'},detach()], [...base,open('bad'),{type:'selector.throw',resource:ref('closingSelector',1),error:{}}],
  ];
  const covered=new Set(paths.flatMap(p=>execute(p).rules));
  assert.deepEqual([...covered].sort(),model.rules.map(r=>r.description.id).sort());
});
