import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createConnectModel, connectExample, createDebounceModel, debounceExample,
  createDefaultIfEmptyModel, defaultIfEmptyExample, createDelayModel, delayExample,
  createDelayWhenModel, delayWhenExample, stepModel, validateModel, toManifest, runTrace,
  renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace
} from '../dist/index.js';

const ref = (id, generation) => ({id,generation});
const notes = actions => actions.filter(a=>a.type==='notify').map(a=>a.notification);
const execute = (model, events) => {
  let state=model.initialState(),actions=[],ids=[];
  for(const event of events){
    const r=stepModel(model,state,event);state=r.state;actions.push(...r.actions);ids.push(r.ruleId);
  }
  return {state,actions,ids,notifications:notes(actions)};
};
const cases = [
  ['connect',()=>createConnectModel(),connectExample,[{kind:'N',value:1},{kind:'N',value:1},
    {kind:'N',value:2},{kind:'N',value:2},{kind:'C'}]],
  ['debounce',()=>createDebounceModel(),debounceExample,[{kind:'N',value:2},{kind:'C'}]],
  ['defaultIfEmpty',()=>createDefaultIfEmptyModel('fallback'),defaultIfEmptyExample,
    [{kind:'N',value:'fallback'},{kind:'C'}]],
  ['delay',()=>createDelayModel(3),delayExample,[{kind:'N',value:1},{kind:'N',value:2},{kind:'C'}]],
  ['delayWhen',()=>createDelayWhenModel(),delayWhenExample,[{kind:'N',value:2},{kind:'C'}]],
];
for(const [name,factory,example,expected] of cases){
  test('S10-MODEL '+name+': canonical six-tuple, named guarded rules and eight stable views',()=>{
    const model=factory(),manifest=toManifest(model);
    assert.deepEqual(validateModel(model),[]);
    assert.equal(manifest.metadata.operator,name);
    assert.equal(manifest.metadata.rxjsVersion,'7.8.2');
    assert.ok(manifest.metadata.cardinality.signature.includes(':'));
    assert.ok(manifest.metadata.scope.time&&manifest.metadata.scope.reentrancy);
    assert.ok(manifest.metadata.ownership.sharing&&manifest.metadata.dispatch.cancellationCheckpoints.length);
    assert.ok(manifest.metadata.sources.every(s=>s.revision==='e5351d02e225e275ac0e497c7b66eaa5f0c88791'));
    assert.equal(new Set(model.rules.map(r=>r.description.id)).size,model.rules.length);
    for(const render of [renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior]){
      const view=render(manifest);assert.equal(render(manifest),view);
      for(const rule of model.rules)assert.ok(view.includes(rule.description.id),'missing rule '+rule.description.id);
    }
    const trace=runTrace(model,example,{executionId:name+'-session10'});
    assert.equal(trace.status,'finished-input');
    assert.equal(trace.state.phase,'Closed');
    assert.deepEqual(notes(trace.steps.flatMap(s=>s.actions)),expected);
    assert.match(renderTrace(trace),/Four lanes/);
  });
  test('S10-MODEL '+name+': rejects any event after terminal state',()=>{
    const model=factory(),out=execute(model,example.map(x=>x.event));
    assert.throws(()=>stepModel(model,out.state,{type:'subscribe'}),/illegal/);
    assert.throws(()=>stepModel(model,out.state,{type:'cancel'}),/illegal/);
  });
}
test('S10-DEFAULT: presence bit distinguishes undefined from no notification',()=>{
  const model=createDefaultIfEmptyModel('fallback');
  assert.deepEqual(execute(model,[{type:'subscribe'},{type:'source.next',value:undefined},
    {type:'source.complete'}]).notifications,[{kind:'N',value:undefined},{kind:'C'}]);
  assert.deepEqual(execute(model,[{type:'subscribe'},{type:'source.complete'}]).notifications,
    [{kind:'N',value:'fallback'},{kind:'C'}]);
  assert.deepEqual(execute(model,[{type:'subscribe'},{type:'cancel'}]).notifications,[]);
  const failed=execute(model,[{type:'subscribe'},{type:'source.error',error:'exact'}]);
  assert.deepEqual(failed.notifications,[{kind:'E',error:'exact'}]);
});
test('S10-DEBOUNCE: replacement cancels first duration; empty duration does not flush',()=>{
  const m=createDebounceModel();
  const xs=[
    {type:'subscribe'},{type:'source.next',value:'first'},
    {type:'callback.return',resource:ref('selector',0)},
    {type:'source.next',value:'second'},
    {type:'callback.return',resource:ref('selector',1)},
    {type:'duration.complete',resource:ref('duration',1)},
  ];
  const partial=execute(m,xs);
  const releases=partial.actions.filter(a=>a.type==='unsubscribe'&&a.resource.id==='duration');
  assert.deepEqual(releases.map(a=>a.resource.generation),[0,1]);
  assert.deepEqual(partial.notifications,[]);
  const done=stepModel(m,partial.state,{type:'source.complete'});
  assert.deepEqual(notes(done.actions),[{kind:'N',value:'second'},{kind:'C'}]);
  assert.throws(()=>stepModel(m,partial.state,{type:'duration.next',resource:ref('duration',1)}),/illegal/);
});
test('S10-CONNECT: selector output subscribed before source; one source, two exact identities',()=>{
  const m=createConnectModel(),token=Object.freeze({id:7});
  const run=execute(m,[{type:'subscribe'},{type:'selector.return',resource:ref('selector',0)},
    {type:'source.next',value:token},{type:'cancel'}]);
  assert.deepEqual(run.actions.filter(a=>a.type==='subscribe').map(a=>a.resource.id),['selected','source']);
  assert.equal(run.notifications.length,2);
  assert.strictEqual(run.notifications[0].value,token);
  assert.strictEqual(run.notifications[1].value,token);
  assert.equal(run.state.reason,'cancel');
  assert.deepEqual(execute(m,[{type:'subscribe'},{type:'selector.throw',resource:ref('selector',0),error:42}]).notifications,
    [{kind:'E',error:42}]);
});
test('S10-DELAY: concurrent timers, completion barrier, and impossible early timer delivery',()=>{
  const m=createDelayModel(3);
  const a=execute(m,[{type:'subscribe'},
    {type:'source.next',value:1,now:1},
    {type:'source.next',value:2,now:2},
    {type:'source.complete'}]);
  assert.equal(a.state.phase,'Active');
  assert.equal(a.state.sourceLive,false);
  assert.equal(a.actions.filter(x=>x.type==='schedule').length,2);
  assert.deepEqual(a.notifications,[]);
  assert.throws(()=>stepModel(m,a.state,{type:'timer.fire',resource:ref('timer',0),now:3}),/illegal/);
  const b=execute(m,[{type:'subscribe'},
    {type:'source.next',value:1,now:1},
    {type:'source.next',value:2,now:2},
    {type:'source.complete'},
    {type:'timer.fire',resource:ref('timer',1),now:5},
    {type:'timer.fire',resource:ref('timer',0),now:6}]);
  assert.deepEqual(b.notifications,[{kind:'N',value:2},{kind:'N',value:1},{kind:'C'}]);
});
test('S10-DELAYWHEN: next releases once, empty completion drops, cancellation cancels other durations',()=>{
  const m=createDelayWhenModel();
  const seq=[
    {type:'subscribe'},
    {type:'source.next',now:1,value:'first'},
    {type:'callback.return',resource:ref('selector',0)},
    {type:'source.next',now:2,value:'second'},
    {type:'callback.return',resource:ref('selector',1)},
    {type:'source.complete'},
    {type:'duration.complete',resource:ref('duration',0)},
    {type:'duration.next',resource:ref('duration',1)},
  ];
  assert.deepEqual(execute(m,seq).notifications,[{kind:'N',value:'second'},{kind:'C'}]);
  const active=execute(m,seq.slice(0,5));
  const canceled=stepModel(m,active.state,{type:'cancel'});
  assert.deepEqual(notes(canceled.actions),[]);
  assert.deepEqual(canceled.actions.filter(a=>a.type==='unsubscribe').map(a=>a.resource.id),
    ['duration','duration','source']);
  assert.throws(()=>stepModel(m,active.state,{type:'duration.next',resource:ref('duration',3)}),/illegal/);
});
test('S10-ERRORS: duration errors abort and do not flush',()=>{
  const m=createDelayWhenModel();
  const result=execute(m,[{type:'subscribe'},{type:'source.next',value:'x',now:1},
    {type:'callback.return',resource:ref('selector',0)},
    {type:'duration.error',resource:ref('duration',0),error:'duration failure'}]);
  assert.deepEqual(result.notifications,[{kind:'E',error:'duration failure'}]);
  assert.equal(result.state.phase,'Closed');
});
