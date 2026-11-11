import test from 'node:test';
import assert from 'node:assert/strict';
import {
 stepModel,runTrace,toManifest,validateModel,renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior,renderTrace,renderInspectionIndex,
 createMaterializeModel,materializeExample,
 createMergeModel,mergeExample,
 createFlatMapModel,flatMapExample,
 createMergeMapToModel,mergeMapToExample,
 createMergeScanModel,mergeScanExample,
 createMergeMapModel
} from '../dist/index.js';

const ref=(id,generation)=>({id,generation});
const execute=(model,events)=>{
 let state=model.initialState();const actions=[];
 for(const event of events){const result=stepModel(model,state,event);state=result.state;actions.push(...result.actions);}
 return {state,actions,notes:actions.filter(a=>a.type==='notify').map(a=>a.notification)};
};
const fixtures=[
 ['materialize',()=>createMaterializeModel(),materializeExample,
  [{kind:'N',value:{kind:'N',value:'alpha',hasValue:true}},
   {kind:'N',value:{kind:'N',value:'beta',hasValue:true}},
   {kind:'N',value:{kind:'C',hasValue:false}},{kind:'C'}]],
 ['merge',()=>createMergeModel(2,2),mergeExample,
  [{kind:'N',value:1},{kind:'N',value:10},{kind:'N',value:20},{kind:'C'}]],
 ['flatMap',()=>createFlatMapModel(2),flatMapExample,
  [{kind:'N',value:'B'},{kind:'N',value:'A'},{kind:'C'}]],
 ['mergeMapTo',()=>createMergeMapToModel('shared',2),mergeMapToExample,
  [{kind:'N',value:'A'},{kind:'N',value:'B'},{kind:'C'}]],
 ['mergeScan',()=>createMergeScanModel(0,2),mergeScanExample,
  [{kind:'N',value:5},{kind:'N',value:8},{kind:'N',value:9},{kind:'C'}]],
];
for(const [name,factory,example,expected] of fixtures){
 test('S14-MODEL '+name+': scoped six-tuple, guarded rules and deterministic projections',()=>{
  const m=factory(),manifest=toManifest(m);
  assert.deepEqual(validateModel(m),[]);
  assert.equal(manifest.metadata.operator,name);
  assert.equal(manifest.metadata.rxjsVersion,'7.8.2');
  assert.ok(manifest.metadata.cardinality.signature.includes(':'));
  assert.ok(manifest.metadata.scope.time&&manifest.metadata.scope.reentrancy);
  assert.ok(manifest.metadata.ownership.sharing&&manifest.metadata.dispatch.cancellationCheckpoints.length);
  assert.ok(manifest.metadata.sources.some(s=>s.revision==='e5351d02e225e275ac0e497c7b66eaa5f0c88791'));
  assert.equal(new Set(m.rules.map(r=>r.description.id)).size,m.rules.length);
  for(const render of [renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior]){
   const output=render(manifest);assert.equal(render(manifest),output);
   for(const r of m.rules)assert.ok(output.includes(r.description.id),r.description.id);
  }
  const trace=runTrace(m,example,{executionId:'session14-'+name});
  assert.equal(trace.state.phase,'Closed');
  assert.deepEqual(trace.steps.flatMap(s=>s.actions).filter(a=>a.type==='notify').map(a=>a.notification),expected);
  assert.match(renderTrace(trace),/Four lanes/);
  assert.match(renderInspectionIndex(name,[{name,manifest}],
   name==='materialize'?'src/models/session14-materialize.ts':
   name==='merge'?'src/models/session14-merge.ts':'src/models/session14-flatten.ts'),/11 \| Evidence Ledger/);
 });
 test('S14-MODEL '+name+': terminal guard rejects later work',()=>{
  const m=factory(),terminal=runTrace(m,example,{executionId:'closed'}).state;
  for(const event of [{type:'subscribe'},{type:'cancel'}])
   assert.throws(()=>stepModel(m,terminal,event),/illegal/);
 });
}

test('S14 MATERIALIZE: a source error is an E VALUE followed by normal result completion',()=>{
 const err=Object.freeze({same:'error'}),m=createMaterializeModel();
 const out=execute(m,[{type:'subscribe'},{type:'source.next',value:undefined},{type:'source.error',error:err}]);
 assert.equal(out.notes[0].value.kind,'N');assert.equal(out.notes[0].value.hasValue,true);
 assert.strictEqual(out.notes[1].value.error,err);
 assert.deepEqual(out.notes.map(n=>n.kind),['N','N','C']);
 assert.equal(out.notes[1].value.kind,'E');
 assert.equal(out.state.reason,'error');
});
test('S14 MATERIALIZE: cancellation must be silent, no terminal Notification fabricated',()=>{
 const out=execute(createMaterializeModel(),[{type:'subscribe'},{type:'cancel'}]);
 assert.deepEqual(out.notes,[]);
 assert.deepEqual(out.actions.filter(a=>a.type==='unsubscribe').map(a=>a.resource),[ref('source',0)]);
});
test('S14 MERGE: concurrency bound subscribes first two, then FIFO third',()=>{
 const m=createMergeModel(2,2);
 const initial=stepModel(m,m.initialState(),{type:'subscribe'});
 assert.deepEqual(initial.actions.map(a=>a.resource.generation),[0,1]);
 assert.deepEqual(initial.state.pending,[2]);
 const next=stepModel(m,initial.state,{type:'input.complete',resource:ref('input',1)});
 assert.deepEqual(next.actions.map(a=>[a.type,a.resource.generation]),[['unsubscribe',1],['subscribe',2]]);
 assert.deepEqual(next.state.pending,[]);
 assert.throws(()=>stepModel(m,initial.state,{type:'input.next',resource:ref('input',2),value:1}),/illegal/);
});
test('S14 MERGE: arbitrary source error propagates by identity, releases live sources',()=>{
 const m=createMergeModel(3,2),err=Symbol('fatal');
 const out=execute(m,[{type:'subscribe'},{type:'input.error',resource:ref('input',1),error:err}]);
 assert.strictEqual(out.notes[0].error,err);
 assert.deepEqual(out.actions.filter(a=>a.type==='unsubscribe').map(a=>a.resource.generation),[0,1]);
});
test('S14 MERGE: complete only after all connected and queued inputs complete',()=>{
 const m=createMergeModel(2,1);
 const out=execute(m,[{type:'subscribe'},
  {type:'input.complete',resource:ref('input',0)},
  {type:'input.complete',resource:ref('input',1)},
  {type:'input.complete',resource:ref('input',2)}]);
 assert.deepEqual(out.notes,[{kind:'C'}]);
 assert.deepEqual(out.actions.filter(a=>a.type==='subscribe').map(a=>a.resource.generation),[0,1,2]);
});
test('S14 FLATMAP: exact same observable mergeMap state transitions and action words',()=>{
 const left=runTrace(createFlatMapModel(2),flatMapExample,{executionId:'left'});
 const right=runTrace(createMergeMapModel(2),flatMapExample,{executionId:'right'});
 assert.deepEqual(left.steps.flatMap(s=>s.actions),right.steps.flatMap(s=>s.actions));
});
test('S14 MERGEMAPTO: constant source identity required for every admission',()=>{
 const obj={source:'shared'},m=createMergeMapToModel(obj,2);
 let state=stepModel(m,m.initialState(),{type:'subscribe'}).state;
 state=stepModel(m,state,{type:'outer.next',value:10}).state;
 assert.throws(()=>stepModel(m,state,{type:'callback.return',resource:ref('constant',0),value:{source:'shared'}}),/illegal/);
 const accepted=stepModel(m,state,{type:'callback.return',resource:ref('constant',0),value:obj});
 assert.strictEqual(accepted.state.active[0].source,obj);
 assert.deepEqual(accepted.actions[0].resource,ref('inner',0));
});
test('S14 MERGEMAPTO: no projection-throw transition for prevalidated constant source',()=>{
 const m=createMergeMapToModel('shared',2);
 assert.ok(m.rules.every(r=>r.description.event!=='callback.throw'));
});
test('S14 MERGESCAN: simultaneous projections snapshot the seed, later admission sees latest inner result',()=>{
 const m=createMergeScanModel(0,2);
 const steps=runTrace(m,mergeScanExample,{executionId:'acc'}).steps;
 const requests=steps.flatMap(x=>x.actions).filter(x=>x.type==='invoke-callback');
 assert.deepEqual(requests.map(x=>x.value),[
  {accumulator:0,value:1},{accumulator:0,value:2},{accumulator:5,value:3}]);
 assert.deepEqual(requests.map(x=>x.index),[0,1,2]);
 assert.deepEqual(steps.filter(x=>x.event.type==='inner.next').map(x=>x.after.accumulator),[5,8,9]);
});
test('S14 MERGESCAN: callback throw and cancellation do not emit a seed',()=>{
 const err=Symbol('project');
 const m=createMergeScanModel(12,2);
 const out=execute(m,[{type:'subscribe'},{type:'outer.next',value:1},
  {type:'callback.throw',resource:ref('accumulator',0),error:err}]);
 assert.deepEqual(out.notes,[{kind:'E',error:err}]);
 assert.deepEqual(execute(m,[{type:'subscribe'},{type:'cancel'}]).notes,[]);
});
