import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPluckModel, createPublishPlainModel, createPublishBehaviorModel,
  createPublishLastModel, createPublishReplayModel, runTrace, stepModel,
  validateModel, toManifest, pluckExample, publishExample, publishBehaviorExample,
  publishLastExample, publishReplayExample,
} from '../dist/index.js';

const ref=(generation=0)=>({id:'source',generation});
const events=(model,inputs)=>{
  let state=model.initialState();const actions=[];
  for(const event of inputs){const result=stepModel(model,state,event);state=result.state;actions.push(...result.actions);}
  return {state,actions,notes:actions.filter(a=>a.type==='notify')};
};
const notes=(out,target)=>out.notes.filter(a=>a.target===target).map(a=>a.notification);
const nexts=(out,target)=>notes(out,target).filter(n=>n.kind==='N').map(n=>n.value);

for(const [name,model,example] of [
  ['pluck',createPluckModel(['person','name']),pluckExample],
  ['publish',createPublishPlainModel(),publishExample],
  ['publishBehavior',createPublishBehaviorModel(0),publishBehaviorExample],
  ['publishLast',createPublishLastModel(),publishLastExample],
  ['publishReplay',createPublishReplayModel(2),publishReplayExample],
]){
  test('S16 MODEL '+name+': complete guarded six-tuple, trace and JSON manifest',()=>{
    assert.deepEqual(validateModel(model),[]);
    assert.equal(toManifest(model).metadata.operator,name);
    const trace=runTrace(model,example,{executionId:'s16-'+name});
    assert.equal(trace.status,'finished-input');
    assert.equal(trace.consumed,example.length);
    assert.ok(trace.steps.every(step=>step.ruleId.startsWith('S16-')));
    assert.ok(model.metadata.scope.time.length>0);
    assert.ok(model.metadata.ownership.sharing.length>0);
    assert.ok(model.metadata.scope.exclusions.length>0);
  });
}
test('S16 PLUCK: present, null and absent nested keys preserve cardinality',()=>{
  const model=createPluckModel(['person','name']);
  const out=events(model,[{type:'subscribe'},
    {type:'source.next',value:{person:{name:'Ada'}}},
    {type:'source.next',value:{person:null}},
    {type:'source.next',value:{unknown:123}},
    {type:'source.complete'}]);
  assert.deepEqual(notes(out,'downstream'),
    [{kind:'N',value:'Ada'},{kind:'N',value:undefined},{kind:'N',value:undefined},{kind:'C'}]);
  assert.equal(out.state.count,3);
  assert.equal(out.state.reason,'complete');
});
test('S16 PLUCK: exact error identity and silent downstream cancellation',()=>{
  const err={message:'error'};
  const model=createPluckModel(['k']);
  const failed=events(model,[{type:'subscribe'},{type:'source.error',error:err}]);
  assert.strictEqual(failed.notes[0].notification.error,err);
  const cancelled=events(model,[{type:'subscribe'},{type:'cancel'}]);
  assert.deepEqual(cancelled.notes,[]);
  assert.throws(()=>stepModel(model,cancelled.state,{type:'source.next',value:{k:1}}),/illegal/);
});
test('S16 PLUCK: zero path rejected at configuration, not via error notification',()=>{
  assert.throws(()=>createPluckModel([]),/non-empty/);
  assert.throws(()=>createPluckModel(['']),/non-empty/);
});
test('S16 PUBLISH: one explicit connection serves two observers; no automatic refCount',()=>{
  const m=createPublishPlainModel();
  const out=events(m,[{type:'observer.subscribe',observer:0},
    {type:'observer.subscribe',observer:1},{type:'connect'},
    {type:'source.next',resource:ref(),value:7},
    {type:'observer.cancel',observer:0},
    {type:'source.next',resource:ref(),value:8},
    {type:'source.complete',resource:ref()}]);
  assert.deepEqual(nexts(out,'observer-0'),[7]);
  assert.deepEqual(nexts(out,'observer-1'),[7,8]);
  assert.deepEqual(out.actions.filter(a=>a.type==='subscribe'&&a.resource.id==='source').length,1);
  assert.deepEqual(out.actions.filter(a=>a.type==='unsubscribe'&&a.resource.id==='source').length,1);
  assert.equal(out.state.phase,'Stopped');
});
test('S16 PUBLISH: calling connect while connected does not resubscribe',()=>{
  const m=createPublishPlainModel();
  const out=events(m,[{type:'connect'},{type:'connect'},{type:'disconnect'}]);
  assert.equal(out.actions.filter(a=>a.type==='subscribe').length,1);
  assert.equal(out.actions.filter(a=>a.type==='unsubscribe').length,1);
  assert.equal(out.state.phase,'Ready');
  assert.equal(out.state.generation,1);
  assert.throws(()=>stepModel(m,out.state,{type:'source.next',resource:ref(),value:9}),/illegal/);
});
test('S16 PUBLISH: explicit disconnect retains observers for later manual reconnection',()=>{
  const out=events(createPublishPlainModel(),[{type:'observer.subscribe',observer:0},
    {type:'connect'},{type:'source.next',resource:ref(),value:1},
    {type:'disconnect'},{type:'connect'},
    {type:'source.next',resource:ref(1),value:2},{type:'source.complete',resource:ref(1)}]);
  assert.deepEqual(nexts(out,'observer-0'),[1,2]);
  assert.deepEqual(out.actions.filter(a=>a.type==='subscribe'&&a.resource.id==='source')
    .map(a=>a.resource.generation),[0,1]);
});
test('S16 PUBLISHBEHAVIOR: each joining live observer receives current value, but no terminal replay',()=>{
  const out=events(createPublishBehaviorModel(0),[{type:'observer.subscribe',observer:0},
    {type:'connect'},{type:'source.next',resource:ref(),value:5},
    {type:'observer.subscribe',observer:1},{type:'source.complete',resource:ref()},
    {type:'observer.subscribe',observer:2}]);
  assert.deepEqual(nexts(out,'observer-0'),[0,5]);
  assert.deepEqual(nexts(out,'observer-1'),[5]);
  assert.deepEqual(notes(out,'observer-2'),[{kind:'C'}]);
});
test('S16 PUBLISHLAST: no value before completion, then one most recent per observer',()=>{
  const model=createPublishLastModel();
  const out=events(model,[{type:'observer.subscribe',observer:0},{type:'connect'},
    {type:'source.next',resource:ref(),value:2},{type:'source.next',resource:ref(),value:9},
    {type:'observer.subscribe',observer:1},{type:'source.complete',resource:ref()},
    {type:'observer.subscribe',observer:2}]);
  for(const id of [0,1,2])assert.deepEqual(notes(out,'observer-'+id),[{kind:'N',value:9},{kind:'C'}]);
});
test('S16 PUBLISHLAST: completion of empty source delivers no value',()=>{
  const out=events(createPublishLastModel(),[{type:'observer.subscribe',observer:0},
    {type:'connect'},{type:'source.complete',resource:ref()}]);
  assert.deepEqual(notes(out,'observer-0'),[{kind:'C'}]);
});
test('S16 PUBLISHREPLAY: count trims FIFO history and late successful subscriber replays',()=>{
  const out=events(createPublishReplayModel(2),[{type:'connect'},
    {type:'source.next',resource:ref(),value:1},
    {type:'source.next',resource:ref(),value:2},
    {type:'source.next',resource:ref(),value:3},
    {type:'observer.subscribe',observer:0},
    {type:'source.complete',resource:ref()},
    {type:'observer.subscribe',observer:1}]);
  assert.deepEqual(notes(out,'observer-0'),[{kind:'N',value:2},{kind:'N',value:3},{kind:'C'}]);
  assert.deepEqual(notes(out,'observer-1'),[{kind:'N',value:2},{kind:'N',value:3},{kind:'C'}]);
  assert.deepEqual(out.state.retained,[2,3]);
});
test('S16 PUBLISHREPLAY: unlike other Subjects, replay precedes late error',()=>{
  const err=Symbol('native-error');
  const out=events(createPublishReplayModel(2),[{type:'connect'},
    {type:'source.next',resource:ref(),value:1},{type:'source.next',resource:ref(),value:2},
    {type:'source.error',resource:ref(),error:err},
    {type:'observer.subscribe',observer:5}]);
  assert.deepEqual(nexts(out,'observer-5'),[1,2]);
  assert.strictEqual(notes(out,'observer-5').at(-1).error,err);
});
test('S16 PUBLISH: exact errors propagate; none of the four connector variants auto-reconnects',()=>{
  const error=Object.freeze({fault:true});
  for(const model of [createPublishPlainModel(),createPublishBehaviorModel('seed'),
    createPublishLastModel(),createPublishReplayModel(2)]){
    const out=events(model,[{type:'observer.subscribe',observer:0},{type:'connect'},
      {type:'source.error',resource:ref(),error}]);
    assert.strictEqual(notes(out,'observer-0').at(-1).error,error);
    assert.throws(()=>stepModel(model,out.state,{type:'connect'}),/illegal/);
  }
});
test('S16 PUBLISH: state invariants reject invalid buffered or duplicated observer ownership',()=>{
  const m=createPublishReplayModel(2);
  const s=m.initialState();
  assert.ok(m.validateState({...s,subscribers:[1,1]},m.parameters).length>0);
  assert.ok(m.validateState({...s,retained:[1,2,3]},m.parameters).length>0);
  assert.throws(()=>stepModel(m,s,{type:'source.next',resource:ref(),value:1}),/illegal/);
});
