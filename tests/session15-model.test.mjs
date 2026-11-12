import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createMergeModel, createMergeWithModel, createConnectModel, createMulticastModel,
 createObserveOnModel, createOnErrorResumeNextModel, createPartitionModel,
 runTrace, stepModel, validateModel, toManifest,
 mergeWithExample, multicastExample, observeOnExample, onErrorResumeNextExample, partitionExample
} from '../dist/index.js';

const ref=(id,generation)=>({id,generation});
const execute=(model,events)=>{
 let state=model.initialState();const actions=[];
 for(const event of events){const next=stepModel(model,state,event);actions.push(...next.actions);state=next.state;}
 return {state,actions,notes:actions.filter(a=>a.type==='notify')};
};
for(const [name,create,example] of [
 ['mergeWith',()=>createMergeWithModel(2),mergeWithExample],
 ['multicast',()=>createMulticastModel(),multicastExample],
 ['observeOn',()=>createObserveOnModel(2),observeOnExample],
 ['onErrorResumeNext',()=>createOnErrorResumeNextModel(2),onErrorResumeNextExample],
 ['partition',()=>createPartitionModel(),partitionExample],
]){
 test('S15 MODEL '+name+': valid six-tuple, example and manifest evidence',()=>{
  const model=create();
  assert.deepEqual(validateModel(model),[]);
  assert.equal(toManifest(model).metadata.operator,name);
  const trace=runTrace(model,example,{executionId:'s15-'+name});
  assert.equal(trace.status,'finished-input');
  assert.equal(trace.consumed,example.length);
  assert.equal(trace.state.phase,'Closed');
  assert.ok(trace.steps.every(s=>s.ruleId.startsWith('S15-')));
 });
}
test('S15 MERGEWITH: reuse unbounded state transitions with corrected registered-teardown ordering',()=>{
 const e=mergeWithExample;
 const a=runTrace(createMergeWithModel(2),e,{executionId:'mw'});
 const b=runTrace(createMergeModel(2),e,{executionId:'m'});
 assert.deepEqual(a.steps.slice(0,-1).map(x=>x.actions),b.steps.slice(0,-1).map(x=>x.actions));
 assert.deepEqual(a.steps.map(x=>x.after),b.steps.map(x=>x.after));
 assert.deepEqual(a.steps[0].actions.map(x=>x.resource.generation),[0,1,2]);
 // The old base model does not establish native cleanup order. The refinement
 // checks this exact sequence independently against RxJS registered teardowns.
 assert.deepEqual(a.steps.at(-1).actions,[
  {type:'unsubscribe',resource:ref('input',2)},
  {type:'notify',target:'downstream',notification:{kind:'C'}},
 ]);
});
test('S15 MERGEWITH: error releases all live inputs; pending cannot notify',()=>{
 const err=Symbol('merge error'),m=createMergeWithModel(2);
 const out=execute(m,[{type:'subscribe'},{type:'input.error',resource:ref('input',2),error:err}]);
 assert.strictEqual(out.notes[0].notification.error,err);
 assert.deepEqual(out.actions.filter(a=>a.type==='unsubscribe').map(a=>a.resource.generation),[0,1,2]);
 assert.throws(()=>stepModel(m,out.state,{type:'input.next',resource:ref('input',1),value:'late'}),/illegal/);
});
test('S15 MULTICAST: subject factory selector uses connect with selector before source',()=>{
 const a=runTrace(createMulticastModel(),multicastExample,{executionId:'a'});
 const b=runTrace(createConnectModel(),multicastExample,{executionId:'b'});
 assert.deepEqual(a.steps.map(x=>x.actions),b.steps.map(x=>x.actions));
 assert.deepEqual(a.steps[1].actions.map(x=>x.resource.id),['selected','source']);
 assert.deepEqual(a.steps.filter(x=>x.event.type==='source.next').flatMap(x=>x.actions).length,4);
});
test('S15 MULTICAST: selector throw fails before source subscription',()=>{
 const error=Object.freeze({id:'selector'});
 const out=execute(createMulticastModel(),[{type:'subscribe'},
  {type:'selector.throw',resource:ref('selector',0),error}]);
 assert.strictEqual(out.notes[0].notification.error,error);
 assert.equal(out.actions.some(a=>a.type==='subscribe'&&a.resource.id==='source'),false);
});
test('S15 OBSERVEON: source arrivals schedule; callbacks not delivered until timer.fire',()=>{
 const m=createObserveOnModel(3);
 const a=stepModel(m,m.initialState(),{type:'subscribe'});
 const b=stepModel(m,a.state,{type:'source.next',value:'x',now:1});
 assert.deepEqual(b.actions,[{type:'schedule',resource:ref('scheduled',0),delay:3}]);
 assert.equal(b.state.pending[0].due,4);
 assert.throws(()=>stepModel(m,b.state,{type:'timer.fire',resource:ref('scheduled',0),now:3}),/illegal/);
 const c=stepModel(m,b.state,{type:'timer.fire',resource:ref('scheduled',0),now:4});
 assert.deepEqual(c.actions[0].notification,{kind:'N',value:'x'});
 assert.equal(c.state.pending.length,0);
});
test('S15 OBSERVEON: delayed complete and error; previous next is not discarded by source error',()=>{
 const err={fault:true},m=createObserveOnModel(2);
 const out=execute(m,[{type:'subscribe'},{type:'source.next',value:'seen',now:0},
  {type:'source.error',now:1,error:err},
  {type:'timer.fire',resource:ref('scheduled',0),now:2},
  {type:'timer.fire',resource:ref('scheduled',1),now:3}]);
 assert.deepEqual(out.notes.map(a=>a.notification.kind),['N','E']);
 assert.strictEqual(out.notes[1].notification.error,err);
 assert.equal(out.state.reason,'source-error');
 assert.deepEqual(execute(m,[{type:'subscribe'},{type:'source.complete',now:0}]).notes,[]);
});
test('S15 OBSERVEON: cancel clears every scheduled task without delivering terminal',()=>{
 const out=execute(createObserveOnModel(2),[{type:'subscribe'},
  {type:'source.next',value:'x',now:0},{type:'source.complete',now:1},{type:'cancel'}]);
 assert.deepEqual(out.notes,[]);
 assert.deepEqual(out.actions.filter(a=>a.type==='cancel-timer').map(a=>a.resource.generation),[0,1]);
});
test('S15 ONERRORRESUMENEXT: error is a continuation signal, including final error',()=>{
 const err=Symbol('ignored'),m=createOnErrorResumeNextModel(1);
 const out=execute(m,[{type:'subscribe'},
  {type:'input.next',resource:ref('input',0),value:3},
  {type:'input.error',resource:ref('input',0),error:err},
  {type:'input.error',resource:ref('input',1),error:err}]);
 assert.deepEqual(out.notes.map(a=>a.notification),[{kind:'N',value:3},{kind:'C'}]);
 assert.deepEqual(out.actions.filter(a=>a.type==='subscribe').map(a=>a.resource.generation),[0,1]);
});
test('S15 ONERRORRESUMENEXT: cannot hear a future input before it is subscribed',()=>{
 const m=createOnErrorResumeNextModel(2),a=stepModel(m,m.initialState(),{type:'subscribe'});
 assert.throws(()=>stepModel(m,a.state,{type:'input.next',resource:ref('input',2),value:9}),/illegal/);
 const stop=stepModel(m,a.state,{type:'cancel'});
 assert.deepEqual(stop.actions,[{type:'unsubscribe',resource:ref('input',0)}]);
});
test('S15 PARTITION: two independent source connections and independent callback indices',()=>{
 const m=createPartitionModel(),init=stepModel(m,m.initialState(),{type:'subscribe'});
 assert.deepEqual(init.actions.map(a=>a.resource.generation),[0,1]);
 const p=stepModel(m,init.state,{type:'source.next',branch:'pass',value:2});
 const f=stepModel(m,p.state,{type:'source.next',branch:'fail',value:3});
 assert.equal(p.actions[0].index,0);
 assert.equal(f.actions[0].index,0);
 assert.equal(p.actions[0].resource.id,'predicate-pass');
 assert.equal(f.actions[0].resource.id,'predicate-fail');
 const pass=stepModel(m,f.state,{type:'predicate.return',resource:ref('predicate-pass',0),result:true});
 const fail=stepModel(m,pass.state,{type:'predicate.return',resource:ref('predicate-fail',0),result:false});
 assert.deepEqual(pass.actions[0].target,'pass');
 assert.deepEqual(fail.actions[0].target,'fail');
});
test('S15 PARTITION: branch cancellation does not cancel the other result',()=>{
 const m=createPartitionModel();
 const a=stepModel(m,m.initialState(),{type:'subscribe'});
 const b=stepModel(m,a.state,{type:'branch.cancel',branch:'pass'});
 assert.equal(b.state.phase,'Active');
 assert.equal(b.state.pass.status,'closed');
 assert.equal(b.state.fail.status,'live');
 assert.deepEqual(b.actions,[{type:'unsubscribe',resource:ref('source',0)}]);
 const c=stepModel(m,b.state,{type:'source.complete',branch:'fail'});
 assert.equal(c.state.phase,'Closed');
 assert.deepEqual(c.actions[0].notification,{kind:'C'});
 assert.equal(c.actions[0].target,'fail');
});
test('S15 PARTITION: predicate throw fails only its own branch',()=>{
 const error=Symbol('predicate'),m=createPartitionModel();
 const out=execute(m,[{type:'subscribe'},{type:'source.next',branch:'pass',value:7},
  {type:'predicate.throw',resource:ref('predicate-pass',0),error},
  {type:'source.complete',branch:'fail'}]);
 assert.strictEqual(out.notes[0].notification.error,error);
 assert.equal(out.notes[0].target,'pass');
 assert.equal(out.notes[1].target,'fail');
 assert.equal(out.notes[1].notification.kind,'C');
});
