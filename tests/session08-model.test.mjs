import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createBufferToggleModel,createBufferWhenModel,bufferToggleExample,bufferWhenExample,
 createCatchErrorModel,catchErrorExample,createCombineAllModel,createCombineLatestAllModel,
 combineAllExample,combineLatestAllExample,
 validateModel,toManifest,stepModel,runTrace,renderTable,renderBdd,renderDiagram,
 renderObligations,renderBehavior,renderTrace
} from '../dist/index.js';

const ref=(id,generation)=>({id,generation});
const notes=actions=>actions.filter(a=>a.type==='notify').map(a=>a.notification);
const simulate=(model,events)=>{
 let state=model.initialState(),actions=[],rules=[];
 for(const event of events){
  const s=stepModel(model,state,event);state=s.state;actions.push(...s.actions);rules.push(s.ruleId);
 }
 return {state,actions,rules};
};
const examples=[
 ['bufferToggle',createBufferToggleModel,bufferToggleExample],
 ['bufferWhen',createBufferWhenModel,bufferWhenExample],
 ['catchError',createCatchErrorModel,catchErrorExample],
 ['combineAll',createCombineAllModel,combineAllExample],
 ['combineLatestAll',createCombineLatestAllModel,combineLatestAllExample],
];
for(const [name,make,events] of examples){
 test('S8-MODEL '+name+': six-tuple, named guarded policies, deterministic projections',()=>{
  const m=make(),manifest=toManifest(m);
  assert.deepEqual(validateModel(m),[]);
  assert.equal(manifest.metadata.operator,name);
  assert.equal(manifest.metadata.rxjsVersion,'7.8.2');
  assert.match(manifest.metadata.cardinality.signature,/:/);
  assert.ok(manifest.metadata.scope.time);
  assert.ok(manifest.metadata.ownership.sharing);
  assert.ok(manifest.metadata.sources.some(x=>x.revision==='e5351d02e225e275ac0e497c7b66eaa5f0c88791'));
  assert.equal(new Set(m.rules.map(x=>x.description.id)).size,m.rules.length);
  assert.ok(m.rules.length>=9);
  for(const render of [renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior]){
   const text=render(manifest);
   assert.equal(render(manifest),text);
   for(const rule of m.rules) assert.ok(text.includes(rule.description.id),'missing '+rule.description.id);
  }
  const trace=runTrace(m,events,{executionId:'s8-'+name});
  assert.equal(trace.status,'finished-input');
  assert.equal(trace.state.phase,'Closed');
  assert.match(renderTrace(trace),/Four lanes/);
  assert.equal(trace.steps.length,events.length);
  assert.ok(notes(trace.steps.flatMap(x=>x.actions)).some(x=>x.kind==='N'));
 });
 test('S8-MODEL '+name+': no resubscribe or events after terminal, no duplicate guard selection',()=>{
  const m=make();
  const closed=simulate(m,events.map(x=>x.event)).state;
  assert.throws(()=>stepModel(m,closed,{type:'subscribe'}),/illegal/);
  assert.throws(()=>stepModel(m,closed,{type:'cancel'}),/illegal/);
 });
}
test('S8-TOGGLE: overlapping buffers, no buffer before opening, source-complete flush',()=>{
 const m=createBufferToggleModel();
 const events=bufferToggleExample.map(x=>x.event);
 const r=simulate(m,events);
 assert.deepEqual(notes(r.actions),[{kind:'N',value:[1,2]},{kind:'N',value:[2,3]},{kind:'C'}]);
 assert.ok(r.rules.includes('BUFFERTOGGLE-OPENINGS-NEXT'));
 assert.ok(r.rules.includes('BUFFERTOGGLE-CLOSING-NEXT'));
 const empty=simulate(m,[{type:'subscribe'},{type:'source.next',value:8},{type:'source.complete'}]);
 assert.deepEqual(notes(empty.actions),[{kind:'C'}]);
});
test('S8-TOGGLE: completion of openings or closing without next does not flush',()=>{
 const m=createBufferToggleModel();
 const events=[{type:'subscribe'},{type:'openings.next',value:'a'},
  {type:'callback.return',resource:ref('selector',0)},{type:'source.next',value:5},
  {type:'closing.complete',resource:ref('closing',0)},{type:'openings.complete'},
  {type:'source.next',value:6},{type:'source.complete'}];
 assert.deepEqual(notes(simulate(m,events).actions),[{kind:'N',value:[5,6]},{kind:'C'}]);
 const s=simulate(m,events.slice(0,5)).state;
 assert.throws(()=>stepModel(m,s,{type:'closing.next',resource:ref('closing',0)}),/illegal/);
 assert.throws(()=>stepModel(m,s,{type:'callback.return',resource:ref('selector',0)}),/illegal/);
});
test('S8-TOGGLE: selector and closing error never flush, cancellation releases subscriptions',()=>{
 const m=createBufferToggleModel(),bad={message:'x'};
 const prefix=[{type:'subscribe'},{type:'openings.next',value:1}];
 const thrown=simulate(m,[...prefix,{type:'callback.throw',resource:ref('selector',0),error:bad}]);
 assert.strictEqual(notes(thrown.actions)[0].error,bad);
 const active=[...prefix,{type:'callback.return',resource:ref('selector',0)},
  {type:'source.next',value:9}];
 const closing=simulate(m,[...active,{type:'closing.error',resource:ref('closing',0),error:bad}]);
 assert.deepEqual(notes(closing.actions),[{kind:'E',error:bad}]);
 const cancel=simulate(m,[...active,{type:'cancel'}]);
 assert.deepEqual(notes(cancel.actions),[]);
 assert.ok(cancel.actions.some(a=>a.type==='unsubscribe'&&a.resource.id==='closing'));
});
test('S8-WHEN: initial selector precedes source, closure emits and restarts fresh buffer',()=>{
 const m=createBufferWhenModel(),r=simulate(m,bufferWhenExample.map(x=>x.event));
 assert.deepEqual(notes(r.actions),[{kind:'N',value:[1,2]},{kind:'N',value:[3]},{kind:'C'}]);
 assert.deepEqual(r.actions.filter(x=>x.type==='subscribe').map(x=>x.resource.id),['closing','source','closing']);
 assert.deepEqual(r.actions.filter(x=>x.type==='invoke-callback').map(x=>x.index),[0,1]);
 const empty=simulate(m,[{type:'subscribe'},{type:'callback.return',resource:ref('selector',0)},
  {type:'closing.next',resource:ref('closing',0)},{type:'callback.return',resource:ref('selector',1)},
  {type:'source.complete'}]);
 assert.deepEqual(notes(empty.actions),[{kind:'N',value:[]},{kind:'N',value:[]},{kind:'C'}]);
});
test('S8-WHEN: completing closing notifier leaves current buffer open until source completes',()=>{
 const m=createBufferWhenModel();
 const r=simulate(m,[{type:'subscribe'},{type:'callback.return',resource:ref('selector',0)},
  {type:'source.next',value:1},{type:'closing.complete',resource:ref('closing',0)},
  {type:'source.next',value:2},{type:'source.complete'}]);
 assert.deepEqual(notes(r.actions),[{kind:'N',value:[1,2]},{kind:'C'}]);
});
test('S8-CATCH: one error invokes recovery, source release precedes replacement connect',()=>{
 const m=createCatchErrorModel();
 const r=simulate(m,catchErrorExample.map(x=>x.event));
 assert.deepEqual(notes(r.actions),[{kind:'N',value:1},{kind:'N',value:'fallback'},{kind:'C'}]);
 assert.deepEqual(r.actions.filter(x=>x.type==='invoke-callback').map(x=>x.value),['fail']);
 const i=r.actions.findIndex(x=>x.type==='unsubscribe'&&x.resource.id==='source');
 const j=r.actions.findIndex(x=>x.type==='subscribe'&&x.resource.id==='replacement');
 assert.ok(i>=0&&i<j);
});
test('S8-CATCH: original completion bypasses selector, replacement error remains terminal',()=>{
 const m=createCatchErrorModel(),e={message:'failure'};
 assert.deepEqual(notes(simulate(m,[{type:'subscribe'},{type:'source.next',value:1},{type:'source.complete'}]).actions),
  [{kind:'N',value:1},{kind:'C'}]);
 const failed=simulate(m,[{type:'subscribe'},{type:'source.error',error:'first'},
  {type:'callback.return',resource:ref('selector',0),replacement:'R'},
  {type:'replacement.error',error:e}]);
 assert.deepEqual(notes(failed.actions),[{kind:'E',error:e}]);
 const calling=simulate(m,[{type:'subscribe'},{type:'source.error',error:e}]).state;
 assert.throws(()=>stepModel(m,calling,{type:'callback.return',resource:ref('selector',9),replacement:'x'}),/illegal/);
 assert.deepEqual(notes(simulate(m,[{type:'subscribe'},{type:'source.error',error:'first'},
  {type:'callback.throw',error:e}]).actions),[{kind:'E',error:e}]);
});
for(const make of [createCombineAllModel,createCombineLatestAllModel]){
 test('S8-LATEST '+make().metadata.operator+': outer barrier, readiness and snapshots',()=>{
  const m=make(),r=simulate(m,combineLatestAllExample.map(x=>x.event));
  assert.deepEqual(notes(r.actions),[{kind:'N',value:[1,10]},{kind:'N',value:[2,10]},{kind:'C'}]);
  const join=r.actions.filter(x=>x.type==='subscribe').map(x=>x.resource.id);
  assert.deepEqual(join,['outer','inner','inner']);
  const empty=simulate(m,[{type:'subscribe'},{type:'outer.complete'}]);
  assert.deepEqual(notes(empty.actions),[{kind:'C'}]);
 });
 test('S8-LATEST '+make().metadata.operator+': empty inner blocks output but not eventual all-inner completion',()=>{
  const m=make(),x=[{type:'subscribe'},{type:'outer.next',value:'a'},
   {type:'outer.next',value:'b'},{type:'outer.complete'},
   {type:'inner.complete',resource:ref('inner',0)},
   {type:'inner.next',resource:ref('inner',1),value:4},
   {type:'inner.complete',resource:ref('inner',1)}];
  assert.deepEqual(notes(simulate(m,x).actions),[{kind:'C'}]);
  const s=simulate(m,x.slice(0,4)).state;
  assert.throws(()=>stepModel(m,s,{type:'inner.next',resource:ref('inner',5),value:2}),/illegal/);
 });
}
test('S8-LATEST: combineAll and combineLatestAll are distinct export records sharing the same transition algebra',()=>{
 const a=createCombineAllModel(),b=createCombineLatestAllModel();
 assert.equal(a.rules.length,b.rules.length);
 assert.notEqual(a.metadata.operator,b.metadata.operator);
 assert.deepEqual(a.rules.map(x=>x.description.event),b.rules.map(x=>x.description.event));
 assert.deepEqual(notes(simulate(a,combineAllExample.map(x=>x.event)).actions),
   notes(simulate(b,combineLatestAllExample.map(x=>x.event)).actions));
});
