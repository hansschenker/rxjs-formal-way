import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stepModel, runTrace, validateModel, toManifest,
  renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace,
  createDematerializeModel, dematerializeExample,
  createElementAtModel, elementAtExample,
  createEndWithModel, endWithExample,
  createEveryModel, everyExample,
  createExhaustModel, exhaustExample, createExhaustAllModel,
} from '../dist/index.js';

const ref=(id,generation)=>({id,generation});
const execute=(m,events)=>{
  let state=m.initialState();const actions=[];
  for(const event of events){
    const result=stepModel(m,state,event);state=result.state;actions.push(...result.actions);
  }
  return {state,actions,notifications:actions.filter(a=>a.type==='notify').map(a=>a.notification)};
};
const names=[
 ['dematerialize',()=>createDematerializeModel(),dematerializeExample,[{kind:'N',value:'a'},{kind:'N',value:'b'},{kind:'C'}]],
 ['elementAt',()=>createElementAtModel(2,'fallback'),elementAtExample,[{kind:'N',value:'c'},{kind:'C'}]],
 ['endWith',()=>createEndWithModel(['suffix-one','suffix-two']),endWithExample,
  [{kind:'N',value:1},{kind:'N',value:'suffix-one'},{kind:'N',value:'suffix-two'},{kind:'C'}]],
 ['every',()=>createEveryModel(),everyExample,[{kind:'N',value:true},{kind:'C'}]],
 ['exhaust',()=>createExhaustModel(),exhaustExample,[{kind:'N',value:'a1'},{kind:'N',value:'b1'},{kind:'C'}]],
];
for(const [name,factory,example,expected] of names){
  test('S11-MODEL '+name+': canonical guards, six-tuple and all eight deterministic projections',()=>{
    const m=factory(),manifest=toManifest(m);
    assert.deepEqual(validateModel(m),[]);
    assert.equal(manifest.metadata.operator,name);
    assert.equal(manifest.metadata.rxjsVersion,'7.8.2');
    assert.ok(manifest.metadata.cardinality.signature.includes(':'));
    assert.ok(manifest.metadata.scope.time&&manifest.metadata.scope.reentrancy);
    assert.ok(manifest.metadata.ownership.sharing&&manifest.metadata.dispatch.cancellationCheckpoints.length);
    assert.ok(manifest.metadata.sources.every(s=>s.revision==='e5351d02e225e275ac0e497c7b66eaa5f0c88791'));
    assert.ok(new Set(m.rules.map(r=>r.description.id)).size===m.rules.length);
    for(const render of [renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior]){
      const first=render(manifest);assert.equal(render(manifest),first);
      for(const rule of m.rules)assert.ok(first.includes(rule.description.id),'missing rule '+rule.description.id);
    }
    const trace=runTrace(m,example,{executionId:'session11-'+name});
    assert.equal(trace.state.phase,'Closed');
    const notes=trace.steps.flatMap(s=>s.actions).filter(a=>a.type==='notify').map(a=>a.notification);
    assert.deepEqual(notes,expected);
    assert.match(renderTrace(trace),/Four lanes/);
    assert.ok(trace.steps.every(x=>x.modelId===m.metadata.id));
  });
  test('S11-MODEL '+name+': terminal executions reject all further events',()=>{
    const m=factory(),trace=runTrace(m,example,{executionId:name+'-closed'});
    for(const event of [{type:'subscribe'},{type:'cancel'},{type:'source.complete'}])
      assert.throws(()=>stepModel(m,trace.state,event),/illegal/);
  });
}
test('S11 DEMATERIALIZE: a materialized E is terminal and preserves arbitrary error identity',()=>{
  const token=Object.freeze({err:1});
  const m=createDematerializeModel();
  const out=execute(m,[{type:'subscribe'},{type:'source.next',notification:{kind:'N',value:undefined}},
    {type:'source.next',notification:{kind:'E',error:token}}]);
  assert.deepEqual(out.notifications,[{kind:'N',value:undefined},{kind:'E',error:token}]);
  assert.strictEqual(out.notifications[1].error,token);
  assert.equal(out.state.reason,'notification-error');
  assert.throws(()=>stepModel(m,out.state,{type:'source.next',notification:{kind:'N',value:99}}),/illegal/);
});
test('S11 DEMATERIALIZE: plain outer completion/error and cancellation are separate policies',()=>{
  const m=createDematerializeModel(),err=Symbol('source error');
  assert.deepEqual(execute(m,[{type:'subscribe'},{type:'source.complete'}]).notifications,[{kind:'C'}]);
  const result=execute(m,[{type:'subscribe'},{type:'source.error',error:err}]);
  assert.strictEqual(result.notifications[0].error,err);
  assert.deepEqual(execute(m,[{type:'subscribe'},{type:'cancel'}]).notifications,[]);
});
test('S11 ELEMENTAT: zero index returns immediately and skips later values',()=>{
  const obj=Object.freeze({key:'opaque'});
  const m=createElementAtModel(0);
  const out=execute(m,[{type:'subscribe'},{type:'source.next',value:obj}]);
  assert.strictEqual(out.notifications[0].value,obj);
  assert.deepEqual(out.notifications[1],{kind:'C'});
  assert.equal(out.state.phase,'Closed');
  assert.throws(()=>stepModel(m,out.state,{type:'source.next',value:obj}),/illegal/);
});
test('S11 ELEMENTAT: missing default presence differs from explicit undefined default',()=>{
  const noDefault=execute(createElementAtModel(3),[{type:'subscribe'},{type:'source.next',value:1},{type:'source.complete'}]);
  assert.equal(noDefault.notifications.length,1);
  assert.equal(noDefault.notifications[0].kind,'E');
  assert.equal(noDefault.notifications[0].error.name,'ArgumentOutOfRangeError');
  assert.deepEqual(execute(createElementAtModel(3,undefined),
    [{type:'subscribe'},{type:'source.complete'}]).notifications,
    [{kind:'N',value:undefined},{kind:'C'}]);
  assert.throws(()=>createElementAtModel(-1),/index/);
  assert.throws(()=>createElementAtModel(1.5),/index/);
});
test('S11 ELEMENTAT: source errors and cancellation do not emit default',()=>{
  const err=Object.freeze({failure:'same'}),m=createElementAtModel(10,'fallback');
  const out=execute(m,[{type:'subscribe'},{type:'source.error',error:err}]);
  assert.strictEqual(out.notifications[0].error,err);
  assert.deepEqual(execute(m,[{type:'subscribe'},{type:'cancel'}]).notifications,[]);
});
test('S11 ENDWITH: completion appends suffix after source, but error/cancel do not append',()=>{
  const m=createEndWithModel(['x','y']);
  const s=execute(m,[{type:'subscribe'},{type:'source.next',value:'a'},{type:'source.complete'}]);
  assert.equal(s.state.phase,'Suffix');
  assert.deepEqual(s.notifications,[{kind:'N',value:'a'}]);
  assert.deepEqual(execute(m,[{type:'subscribe'},{type:'source.error',error:3}]).notifications,
    [{kind:'E',error:3}]);
  assert.deepEqual(execute(m,[{type:'subscribe'},{type:'cancel'}]).notifications,[]);
  const canceled=stepModel(m,s.state,{type:'cancel'});
  assert.deepEqual(canceled.actions,[]);
});
test('S11 ENDWITH: empty suffix is identity on completed output',()=>{
  const m=createEndWithModel([]);
  assert.deepEqual(execute(m,[{type:'subscribe'},{type:'source.next',value:1},
    {type:'source.complete'},{type:'suffix.complete'}]).notifications,
    [{kind:'N',value:1},{kind:'C'}]);
  assert.throws(()=>stepModel(m,{phase:'Suffix',index:0},{type:'suffix.next'}),/illegal/);
});
test('S11 EVERY: empty input is vacuously true, first falsy predicate completes immediately',()=>{
  const m=createEveryModel();
  assert.deepEqual(execute(m,[{type:'subscribe'},{type:'source.complete'}]).notifications,
    [{kind:'N',value:true},{kind:'C'}]);
  const falseRun=execute(m,[{type:'subscribe'},{type:'source.next',value:11},
    {type:'callback.return',resource:ref('predicate',0),value:false}]);
  assert.deepEqual(falseRun.notifications,[{kind:'N',value:false},{kind:'C'}]);
  assert.throws(()=>stepModel(m,falseRun.state,{type:'source.next',value:12}),/illegal/);
});
test('S11 EVERY: callback indices must match, throws are not false, truthy values continue',()=>{
  const m=createEveryModel();
  const calling=execute(m,[{type:'subscribe'},{type:'source.next',value:undefined}]);
  assert.equal(calling.state.phase,'Calling');
  assert.deepEqual(calling.actions.find(a=>a.type==='invoke-callback').resource,ref('predicate',0));
  assert.throws(()=>stepModel(m,calling.state,{type:'callback.return',resource:ref('predicate',8),value:true}),/illegal/);
  const a=stepModel(m,calling.state,{type:'callback.return',resource:ref('predicate',0),value:'truthy'});
  assert.equal(a.state.index,1);assert.deepEqual(a.actions,[]);
  const err=Symbol('predicate');
  const broken=stepModel(m,calling.state,{type:'callback.throw',resource:ref('predicate',0),error:err});
  assert.strictEqual(broken.actions[0].notification.error,err);
  assert.equal(broken.state.phase,'Closed');
});
test('S11 EXHAUST: exact reused Mealy action word of exhaustAll',()=>{
  const left=runTrace(createExhaustModel(),exhaustExample,{executionId:'exhaust'});
  const right=runTrace(createExhaustAllModel(),exhaustExample,{executionId:'exhaustAll'});
  assert.deepEqual(left.steps.flatMap(s=>s.actions),right.steps.flatMap(s=>s.actions));
  assert.ok(createExhaustModel().metadata.sources.some(x=>x.url.endsWith('/exhaust.ts')));
  assert.ok(createExhaustModel().rules.every(r=>r.description.id.startsWith('EXHAUST-')));
});
