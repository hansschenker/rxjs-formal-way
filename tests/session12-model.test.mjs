import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stepModel, runTrace, validateModel, toManifest,
  renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace,
  createExpandModel, expandExample,
  createFinalizeModel, finalizeExample,
  createFindModel, findExample,
  createFindIndexModel, findIndexExample,
  createFirstModel, firstExample,
} from '../dist/index.js';

const ref=(id,generation)=>({id,generation});
const execute=(model,events)=>{
  let state=model.initialState();const actions=[];
  for(const event of events){const out=stepModel(model,state,event);state=out.state;actions.push(...out.actions);}
  return {state,actions,notifications:actions.filter(a=>a.type==='notify').map(a=>a.notification)};
};
const cases=[
  ['expand',()=>createExpandModel(),expandExample,[{kind:'N',value:1},{kind:'N',value:2},{kind:'C'}]],
  ['finalize',()=>createFinalizeModel(),finalizeExample,[{kind:'N',value:1},{kind:'C'}]],
  ['find',()=>createFindModel(),findExample,[{kind:'N',value:2},{kind:'C'}]],
  ['findIndex',()=>createFindIndexModel(),findIndexExample,[{kind:'N',value:1},{kind:'C'}]],
  ['first',()=>createFirstModel(true),firstExample,[{kind:'N',value:3},{kind:'C'}]],
];
for(const [name,factory,example,expected] of cases){
  test('S12-MODEL '+name+': canonical guards, six-tuple and deterministic projections',()=>{
    const m=factory(),manifest=toManifest(m);
    assert.deepEqual(validateModel(m),[]);
    assert.equal(manifest.metadata.operator,name);
    assert.equal(manifest.metadata.rxjsVersion,'7.8.2');
    assert.ok(manifest.metadata.cardinality.signature.includes(':'));
    assert.ok(manifest.metadata.scope.time&&manifest.metadata.scope.reentrancy);
    assert.ok(manifest.metadata.sources.every(s=>s.revision==='e5351d02e225e275ac0e497c7b66eaa5f0c88791'));
    assert.equal(new Set(m.rules.map(r=>r.description.id)).size,m.rules.length);
    for(const render of [renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior]){
      const text=render(manifest);assert.equal(render(manifest),text);
      for(const rule of m.rules)assert.ok(text.includes(rule.description.id),'missing '+rule.description.id);
    }
    const trace=runTrace(m,example,{executionId:'session12-'+name});
    assert.equal(trace.state.phase,'Closed');
    assert.deepEqual(trace.steps.flatMap(s=>s.actions).filter(a=>a.type==='notify').map(a=>a.notification),expected);
    assert.match(renderTrace(trace),/Four lanes/);
  });
  test('S12-MODEL '+name+': terminal execution rejects later lifecycle events',()=>{
    const m=factory(),trace=runTrace(m,example,{executionId:name+'-closed'});
    for(const event of [{type:'subscribe'},{type:'cancel'}])assert.throws(()=>stepModel(m,trace.state,event),/illegal/);
  });
}

test('S12 EXPAND: every admitted value emits before its projection request and index advances',()=>{
  const m=createExpandModel();
  let s=stepModel(m,m.initialState(),{type:'subscribe'}).state;
  const a=stepModel(m,s,{type:'outer.next',value:'root'});
  assert.deepEqual(a.actions.map(x=>x.type),['notify','invoke-callback']);
  assert.equal(a.actions[0].notification.value,'root');
  assert.deepEqual(a.actions[1].resource,ref('project',0));
  assert.equal(a.actions[1].index,0);
  const b=stepModel(m,a.state,{type:'callback.return',resource:ref('project',0),value:'inner-source'});
  assert.deepEqual(b.actions,[{type:'subscribe',resource:ref('inner',0)}]);
  const c=stepModel(m,b.state,{type:'inner.next',resource:ref('inner',0),value:'child'});
  assert.equal(c.actions[0].notification.value,'child');
  assert.deepEqual(c.actions[1].resource,ref('project',1));
});

test('S12 EXPAND: outer completion waits for recursive work and last inner completes result',()=>{
  const m=createExpandModel();
  const before=execute(m,[{type:'subscribe'},{type:'outer.next',value:1},
    {type:'callback.return',resource:ref('project',0),value:'inner'}]);
  const draining=stepModel(m,before.state,{type:'outer.complete'});
  assert.equal(draining.state.phase,'Draining');
  assert.deepEqual(draining.actions,[{type:'unsubscribe',resource:ref('outer',0)}]);
  const done=stepModel(m,draining.state,{type:'inner.complete',resource:ref('inner',0)});
  assert.equal(done.state.phase,'Closed');
  assert.deepEqual(done.actions.at(-1),{type:'notify',target:'downstream',notification:{kind:'C'}});
});

test('S12 EXPAND: concurrency one queues without output, then drains FIFO after inner completion',()=>{
  const m=createExpandModel(1);
  const start=execute(m,[{type:'subscribe'},{type:'outer.next',value:1},
    {type:'callback.return',resource:ref('project',0),value:'inner0'}]);
  const queued=stepModel(m,start.state,{type:'outer.next',value:2});
  assert.deepEqual(queued.actions,[]);
  assert.deepEqual(queued.state.queue,[2]);
  const drain=stepModel(m,queued.state,{type:'inner.complete',resource:ref('inner',0)});
  assert.equal(drain.state.phase,'Calling');
  assert.equal(drain.actions[1].notification.value,2);
  assert.deepEqual(drain.actions[2].resource,ref('project',1));
});

test('S12 EXPAND: projection throw, inner error and cancellation remain distinct terminal policies',()=>{
  const m=createExpandModel(),err=Symbol('project');
  const calling=execute(m,[{type:'subscribe'},{type:'outer.next',value:1}]).state;
  const thrown=stepModel(m,calling,{type:'callback.throw',resource:ref('project',0),error:err});
  assert.strictEqual(thrown.actions[0].notification.error,err);
  const live=execute(m,[{type:'subscribe'},{type:'outer.next',value:1},
    {type:'callback.return',resource:ref('project',0),value:'inner'}]).state;
  const innerErr={same:true},failed=stepModel(m,live,{type:'inner.error',resource:ref('inner',0),error:innerErr});
  assert.strictEqual(failed.actions[0].notification.error,innerErr);
  const canceled=stepModel(m,live,{type:'cancel'});
  assert.equal(canceled.state.reason,'cancel');
  assert.equal(canceled.actions.some(a=>a.type==='notify'),false);
});

test('S12 FINALIZE: complete, error and cancel invoke exactly one finalizer; next does not',()=>{
  const m=createFinalizeModel();
  const nextOnly=execute(m,[{type:'subscribe'},{type:'source.next',value:1}]);
  assert.equal(nextOnly.actions.filter(a=>a.type==='invoke-callback').length,0);
  for(const events of [
    [{type:'subscribe'},{type:'source.complete'}],
    [{type:'subscribe'},{type:'source.error',error:'boom'}],
    [{type:'subscribe'},{type:'cancel'}],
  ]){
    const out=execute(m,events);
    const calls=out.actions.filter(a=>a.type==='invoke-callback');
    assert.equal(calls.length,1);
    assert.deepEqual(calls[0].resource,ref('finalize',0));
  }
});

test('S12 FINALIZE: terminal notification precedes release and finalizer action',()=>{
  const out=execute(createFinalizeModel(),[{type:'subscribe'},{type:'source.complete'}]);
  assert.deepEqual(out.actions.slice(-3).map(a=>a.type),['notify','unsubscribe','invoke-callback']);
});

for(const [label,factory,sentinel] of [
  ['find',()=>createFindModel(),undefined],
  ['findIndex',()=>createFindIndexModel(),-1],
]){
  test('S12 '+label.toUpperCase()+': first truthy predicate short-circuits; no-match sentinel differs',()=>{
    const m=factory();
    const noMatch=execute(m,[{type:'subscribe'},{type:'source.next',value:'a'},
      {type:'callback.return',resource:ref('predicate',0),value:false},{type:'source.complete'}]);
    assert.deepEqual(noMatch.notifications,[{kind:'N',value:sentinel},{kind:'C'}]);
    const calling=execute(m,[{type:'subscribe'},{type:'source.next',value:'x'}]);
    const match=stepModel(m,calling.state,{type:'callback.return',resource:ref('predicate',0),value:true});
    assert.equal(match.state.phase,'Closed');
    assert.deepEqual(match.actions.at(-2),{type:'notify',target:'downstream',notification:{kind:'C'}});
  });
  test('S12 '+label.toUpperCase()+': stale callback identity is illegal and throws remain errors',()=>{
    const m=factory(),calling=execute(m,[{type:'subscribe'},{type:'source.next',value:1}]).state;
    assert.throws(()=>stepModel(m,calling,{type:'callback.return',resource:ref('predicate',9),value:true}),/illegal/);
    const err={predicate:'same'},failed=stepModel(m,calling,{type:'callback.throw',resource:ref('predicate',0),error:err});
    assert.strictEqual(failed.actions[0].notification.error,err);
  });
}

test('S12 FIND: match returns original payload, while findIndex returns its position',()=>{
  const obj=Object.freeze({id:7});
  const f=execute(createFindModel(),[{type:'subscribe'},{type:'source.next',value:obj}]);
  const fm=stepModel(createFindModel(),f.state,{type:'callback.return',resource:ref('predicate',0),value:true});
  assert.strictEqual(fm.actions[0].notification.value,obj);
  const i=execute(createFindIndexModel(),[{type:'subscribe'},{type:'source.next',value:obj}]);
  const im=stepModel(createFindIndexModel(),i.state,{type:'callback.return',resource:ref('predicate',0),value:true});
  assert.equal(im.actions[0].notification.value,0);
});

test('S12 FIRST: direct mode takes first value without callback',()=>{
  const m=createFirstModel();
  const out=execute(m,[{type:'subscribe'},{type:'source.next',value:'first'}]);
  assert.deepEqual(out.notifications,[{kind:'N',value:'first'},{kind:'C'}]);
  assert.equal(out.actions.some(a=>a.type==='invoke-callback'),false);
});

test('S12 FIRST: predicate mode skips false results and emits first original match',()=>{
  const obj=Object.freeze({n:2}),m=createFirstModel(true);
  const run=execute(m,[{type:'subscribe'},{type:'source.next',value:{n:1}},
    {type:'callback.return',resource:ref('predicate',0),value:false},{type:'source.next',value:obj}]);
  const hit=stepModel(m,run.state,{type:'callback.return',resource:ref('predicate',1),value:true});
  assert.strictEqual(hit.actions[0].notification.value,obj);
  assert.deepEqual(hit.actions[1],{type:'notify',target:'downstream',notification:{kind:'C'}});
});

test('S12 FIRST: empty/no-match default presence differs from EmptyError policy',()=>{
  const missing=execute(createFirstModel(),[{type:'subscribe'},{type:'source.complete'}]);
  assert.equal(missing.notifications[0].kind,'E');
  assert.equal(missing.notifications[0].error.name,'EmptyError');
  const explicit=execute(createFirstModel(false,undefined),[{type:'subscribe'},{type:'source.complete'}]);
  assert.deepEqual(explicit.notifications,[{kind:'N',value:undefined},{kind:'C'}]);
  const predDefault=execute(createFirstModel(true,'fallback'),[{type:'subscribe'},{type:'source.complete'}]);
  assert.deepEqual(predDefault.notifications,[{kind:'N',value:'fallback'},{kind:'C'}]);
});
