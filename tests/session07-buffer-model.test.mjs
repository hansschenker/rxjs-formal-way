import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBufferModel,createBufferCountModel,createBufferTimeModel,
  bufferExample,bufferCountExample,bufferTimeExample,bufferTimeOverlapExample,
  validateModel,toManifest,stepModel,runTrace,runBufferTimeTrace,
  renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior,renderTrace
} from '../dist/index.js';
const viewFns=[renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior];
const fixtures=[
  ['buffer',()=>createBufferModel(),bufferExample,runTrace],
  ['bufferCount',()=>createBufferCountModel(3,2),bufferCountExample,runTrace],
  ['bufferTime',()=>createBufferTimeModel(3),bufferTimeExample,runBufferTimeTrace],
  ['bufferTime-overlap',()=>createBufferTimeModel(4,2),bufferTimeOverlapExample,runBufferTimeTrace],
];
const note=actions=>actions.filter(a=>a.type==='notify').map(a=>a.notification);
const run=(model,events)=>{
  let state=model.initialState(),steps=[],actions=[];
  for(const e of events){
    const s=stepModel(model,state,e);state=s.state;steps.push(s.ruleId);actions.push(...s.actions);
  }
  return {state,steps,actions};
};
for(const [name,make,example,traceRun] of fixtures){
  test('S7-BUFFER-MODEL '+name+': valid six-tuple, generated views and model-predicted trace',()=>{
    const m=make();assert.deepEqual(validateModel(m),[]);
    const manifest=toManifest(m);
    assert.equal(manifest.metadata.rxjsVersion,'7.8.2');
    assert.ok(manifest.metadata.sources.some(x=>x.revision==='e5351d02e225e275ac0e497c7b66eaa5f0c88791'));
    assert.equal(new Set(m.rules.map(x=>x.description.id)).size,m.rules.length);
    for(const render of viewFns){
      const output=render(manifest);
      assert.equal(output,render(manifest));
      for(const rule of m.rules)assert.ok(output.includes(rule.description.id),rule.description.id);
    }
    const trace=traceRun(m,example,{executionId:'session7-'+name});
    assert.equal(trace.status,'finished-input');
    assert.equal(trace.state.phase,'Closed');
    assert.equal(renderTrace(trace),renderTrace(trace));
    assert.match(renderTrace(trace),/Four lanes/);
    assert.ok(trace.steps.some(x=>x.actions.some(a=>a.type==='notify'&&a.notification.kind==='N')));
  });
}
test('S7-BUFFER-01: notifier flushes nonempty and empty windows; source complete flushes even empty',()=>{
  const m=createBufferModel();
  const r=run(m,[
    {type:'subscribe'},{type:'source.next',value:1},{type:'source.next',value:2},
    {type:'notifier.next'},{type:'notifier.next'},{type:'source.complete'}]);
  assert.deepEqual(note(r.actions),[{kind:'N',value:[1,2]},{kind:'N',value:[]},
    {kind:'N',value:[]},{kind:'C'}]);
  assert.equal(r.state.phase,'Closed');
  assert.ok(r.steps.includes('BUFFER-NOTIFIER-NEXT'));
});
test('S7-BUFFER-02: notifier completion does not flush or complete source; error/cancel never flush',()=>{
  const m=createBufferModel();
  const r=run(m,[{type:'subscribe'},{type:'source.next',value:1},
    {type:'notifier.complete'},{type:'source.next',value:2},{type:'source.complete'}]);
  assert.deepEqual(note(r.actions),[{kind:'N',value:[1,2]},{kind:'C'}]);
  const state=run(m,[{type:'subscribe'},{type:'notifier.complete'}]).state;
  assert.throws(()=>stepModel(m,state,{type:'notifier.next'}),/illegal/);
  const err={tag:'bad'};
  const failed=run(m,[{type:'subscribe'},{type:'source.next',value:9},
    {type:'notifier.error',error:err}]);
  assert.deepEqual(note(failed.actions),[{kind:'E',error:err}]);
  assert.deepEqual(note(run(m,[{type:'subscribe'},{type:'source.next',value:1},{type:'cancel'}]).actions),[]);
});
test('S7-BUFFERCOUNT-01: contiguous, overlapping and gaps; completion flushes partial buffers',()=>{
  const source=[1,2,3,4,5].map(value=>({type:'source.next',value}));
  const collect=(size,stride)=>{
    const m=createBufferCountModel(size,stride);
    return note(run(m,[{type:'subscribe'},...source,{type:'source.complete'}]).actions)
      .filter(n=>n.kind==='N').map(n=>n.value);
  };
  assert.deepEqual(collect(2,null),[[1,2],[3,4],[5]]);
  assert.deepEqual(collect(3,1),[[1,2,3],[2,3,4],[3,4,5],[4,5],[5]]);
  assert.deepEqual(collect(2,4),[[1,2],[5]]);
  assert.deepEqual(collect(1,1),[[1],[2],[3],[4],[5]]);
  assert.deepEqual(note(run(createBufferCountModel(3),[{type:'subscribe'},{type:'source.complete'}]).actions),[{kind:'C'}]);
});
test('S7-BUFFERCOUNT-02: invalid sizes and illegal second subscription rejected',()=>{
  for(const n of [0,-1,1.5,NaN,Infinity])assert.throws(()=>createBufferCountModel(n),/RangeError|positive/);
  assert.throws(()=>createBufferCountModel(2,0),/positive/);
  const m=createBufferCountModel(2),s=stepModel(m,m.initialState(),{type:'subscribe'}).state;
  assert.throws(()=>stepModel(m,s,{type:'subscribe'}),/illegal/);
  const end=stepModel(m,s,{type:'cancel'}).state;
  assert.throws(()=>stepModel(m,end,{type:'source.next',value:1}),/illegal/);
});
test('S7-BUFFERTIME-01: scheduled expiration emits empty and completion flushes active window',()=>{
  const m=createBufferTimeModel(3);
  const r=run(m,[
    {type:'subscribe',now:0},
    {type:'window.fire',now:3,resource:{id:'buffer-window',generation:0}},
    {type:'source.next',now:4,value:'x'},
    {type:'source.complete',now:5}]);
  assert.deepEqual(note(r.actions),[{kind:'N',value:[]},{kind:'N',value:['x']},{kind:'C'}]);
});
test('S7-BUFFERTIME-02: size closes early and restarts without recycling the triggering value',()=>{
  const m=createBufferTimeModel(10,null,2);
  const r=run(m,[
    {type:'subscribe',now:0},{type:'source.next',now:1,value:1},
    {type:'source.next',now:2,value:2},{type:'source.next',now:3,value:3},
    {type:'source.complete',now:4}]);
  assert.deepEqual(note(r.actions),[{kind:'N',value:[1,2]},{kind:'N',value:[3]},{kind:'C'}]);
  assert.ok(r.steps.includes('BUFFERTIME-NEXT'));
  assert.throws(()=>stepModel(m,m.initialState(),{type:'window.fire',now:1,resource:{id:'buffer-window',generation:0}}),/illegal/);
});
test('S7-BUFFERTIME-03: overlapping creation and stale timers are state-dependent',()=>{
  const m=createBufferTimeModel(4,2);
  let s=stepModel(m,m.initialState(),{type:'subscribe',now:0}).state;
  assert.throws(()=>stepModel(m,s,{type:'window.fire',now:1,resource:{id:'buffer-window',generation:0}}),/illegal/);
  assert.throws(()=>stepModel(m,s,{type:'creation.fire',now:1,resource:{id:'buffer-creation',generation:0}}),/illegal/);
  s=stepModel(m,s,{type:'creation.fire',now:2,resource:{id:'buffer-creation',generation:0}}).state;
  assert.equal(s.phase,'Active');
  assert.equal(s.windows.length,2);
  assert.throws(()=>stepModel(m,s,{type:'creation.fire',now:4,resource:{id:'buffer-creation',generation:0}}),/illegal/);
  const err={id:'err'},failed=stepModel(m,s,{type:'source.error',now:3,error:err});
  assert.deepEqual(note(failed.actions),[{kind:'E',error:err}]);
});
test('S7-BUFFERTIME-04: boundary ordering is trace-sequence dependent, not timestamp arithmetic',()=>{
  const m=createBufferTimeModel(3);
  const first=run(m,[{type:'subscribe',now:0},{type:'source.next',now:1,value:1},
    {type:'source.next',now:3,value:2},
    {type:'window.fire',now:3,resource:{id:'buffer-window',generation:0}}]);
  const second=run(m,[{type:'subscribe',now:0},{type:'source.next',now:1,value:1},
    {type:'window.fire',now:3,resource:{id:'buffer-window',generation:0}},
    {type:'source.next',now:3,value:2}]);
  assert.deepEqual(note(first.actions),[{kind:'N',value:[1,2]}]);
  assert.deepEqual(note(second.actions),[{kind:'N',value:[1]}]);
});
test('S7-BUFFERTIME-05: cancellation discards buffers and timer generations',()=>{
  const m=createBufferTimeModel(5,2,3);
  const r=run(m,[{type:'subscribe',now:0},{type:'source.next',now:1,value:1},{type:'cancel',now:2}]);
  assert.deepEqual(note(r.actions),[]);
  assert.equal(r.state.phase,'Closed');
  assert.equal(r.actions.filter(a=>a.type==='cancel-timer').length,2);
});
