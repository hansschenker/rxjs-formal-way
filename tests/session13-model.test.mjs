import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stepModel, runTrace, validateModel, toManifest, renderTable, renderBdd,
  renderDiagram, renderObligations, renderBehavior, renderTrace,
  createGroupByModel, groupByExample, createIgnoreElementsModel, ignoreElementsExample,
  createIsEmptyModel, isEmptyExample, createLastModel, lastExample,
  createMapToModel, mapToExample,
} from '../dist/index.js';

const ref=(id,generation)=>({id,generation});
const execute=(m,events)=>{
  let state=m.initialState();const actions=[];
  for(const event of events){
    const out=stepModel(m,state,event);state=out.state;actions.push(...out.actions);
  }
  return {state,actions,notifications:actions.filter(a=>a.type==='notify')};
};
const plain=events=>events.filter(a=>a.target==='downstream').map(a=>a.notification);
const scenarios=[
  ['groupBy',()=>createGroupByModel(),groupByExample,
    [{kind:'N',value:{key:'odd',groupId:0}},{kind:'N',value:{key:'even',groupId:1}},{kind:'C'}]],
  ['ignoreElements',()=>createIgnoreElementsModel(),ignoreElementsExample,[{kind:'C'}]],
  ['isEmpty',()=>createIsEmptyModel(),isEmptyExample,[{kind:'N',value:true},{kind:'C'}]],
  ['last',()=>createLastModel(true),lastExample,[{kind:'N',value:2},{kind:'C'}]],
  ['mapTo',()=>createMapToModel('constant'),mapToExample,
    [{kind:'N',value:'constant'},{kind:'N',value:'constant'},{kind:'C'}]],
];

for(const [name,factory,events,expected] of scenarios){
  test('S13-MODEL '+name+': guarded machine, six-tuple, trace and all deterministic renderers',()=>{
    const m=factory(),manifest=toManifest(m);
    assert.deepEqual(validateModel(m),[]);
    assert.equal(manifest.metadata.operator,name);
    assert.equal(manifest.metadata.rxjsVersion,'7.8.2');
    assert.ok(manifest.metadata.cardinality.signature.includes(':'));
    assert.equal(manifest.metadata.schemaVersion,'1.1');
    assert.ok(manifest.metadata.scope.time&&manifest.metadata.scope.reentrancy);
    assert.ok(manifest.metadata.ownership.sharing);
    assert.ok(manifest.metadata.sources.every(s=>s.revision==='e5351d02e225e275ac0e497c7b66eaa5f0c88791'));
    assert.equal(new Set(m.rules.map(r=>r.description.id)).size,m.rules.length);
    for(const render of [renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior]){
      const text=render(manifest);
      assert.equal(render(manifest),text);
      for(const rule of m.rules) assert.ok(text.includes(rule.description.id),'missing '+rule.description.id);
    }
    const trace=runTrace(m,events,{executionId:'s13-'+name});
    assert.equal(trace.state.phase,'Closed');
    assert.deepEqual(plain(trace.steps.flatMap(s=>s.actions).filter(a=>a.type==='notify')),expected);
    assert.match(renderTrace(trace),/Four lanes/);
  });
  test('S13-MODEL '+name+': closed execution cannot be restarted',()=>{
    const m=factory(),tr=runTrace(m,events,{executionId:'closed-'+name});
    assert.throws(()=>stepModel(m,tr.state,{type:'subscribe'}),/illegal/);
    assert.throws(()=>stepModel(m,tr.state,{type:'cancel'}),/illegal/);
  });
}

test('S13 GROUPBY: first key emits a GroupToken then its value; existing key only emits group data',()=>{
  const m=createGroupByModel(),run=execute(m,[
    {type:'subscribe'},{type:'source.next',value:1},
    {type:'callback.return',resource:ref('key',0),value:'odd'},
    {type:'source.next',value:3},
    {type:'callback.return',resource:ref('key',1),value:'odd'},
  ]);
  assert.deepEqual(run.notifications,[
    {type:'notify',target:'downstream',notification:{kind:'N',value:{key:'odd',groupId:0}}},
    {type:'notify',target:'group:0',notification:{kind:'N',value:1}},
    {type:'notify',target:'group:0',notification:{kind:'N',value:3}},
  ]);
  assert.equal(run.state.nextGroupId,1);
});

test('S13 GROUPBY: Map SameValueZero keys treat NaN as same group and ±0 as same key',()=>{
  const m=createGroupByModel(),events=[
    {type:'subscribe'},
    {type:'source.next',value:'one'},{type:'callback.return',resource:ref('key',0),value:NaN},
    {type:'source.next',value:'two'},{type:'callback.return',resource:ref('key',1),value:NaN},
    {type:'source.next',value:'three'},{type:'callback.return',resource:ref('key',2),value:-0},
    {type:'source.next',value:'four'},{type:'callback.return',resource:ref('key',3),value:0},
  ];
  const run=execute(m,events);
  assert.equal(run.state.groups.length,2);
  assert.equal(run.notifications.filter(a=>a.target==='downstream').length,2);
  assert.deepEqual(run.notifications.filter(a=>a.target==='group:0').map(a=>a.notification.value),['one','two']);
  assert.deepEqual(run.notifications.filter(a=>a.target==='group:1').map(a=>a.notification.value),['three','four']);
});

test('S13 GROUPBY: last child lease keeps upstream after outer cancel and releases on child unsubscribe',()=>{
  const m=createGroupByModel();
  const live=execute(m,[{type:'subscribe'},{type:'source.next',value:1},
    {type:'callback.return',resource:ref('key',0),value:'odd'},
    {type:'group.subscribe',groupId:0}]);
  const cancel=stepModel(m,live.state,{type:'cancel'});
  assert.equal(cancel.state.phase,'Orphaned');
  assert.deepEqual(cancel.actions,[]);
  const fed=execute(m,[]);void fed;
  const a=stepModel(m,cancel.state,{type:'source.next',value:3});
  const b=stepModel(m,a.state,{type:'callback.return',resource:ref('key',1),value:'odd'});
  assert.deepEqual(b.actions,[{type:'notify',target:'group:0',notification:{kind:'N',value:3}}]);
  const done=stepModel(m,b.state,{type:'group.unsubscribe',groupId:0});
  assert.equal(done.state.phase,'Closed');
  assert.deepEqual(done.actions.map(x=>x.type),['unsubscribe','unsubscribe']);
});

test('S13 GROUPBY: cancel without group observers disconnects immediately and silently',()=>{
  const m=createGroupByModel(),live=execute(m,[{type:'subscribe'},{type:'source.next',value:1},
    {type:'callback.return',resource:ref('key',0),value:'odd'}]);
  const end=stepModel(m,live.state,{type:'cancel'});
  assert.equal(end.state.phase,'Closed');
  assert.equal(end.actions.filter(x=>x.type==='notify').length,0);
  assert.deepEqual(end.actions,[{type:'unsubscribe',resource:ref('source',0)}]);
});

test('S13 GROUPBY: completion and errors notify group subjects before the outer consumer',()=>{
  const m=createGroupByModel(),live=execute(m,[
    {type:'subscribe'},{type:'source.next',value:1},
    {type:'callback.return',resource:ref('key',0),value:'a'},
    {type:'source.next',value:2},
    {type:'callback.return',resource:ref('key',1),value:'b'},
  ]);
  const done=stepModel(m,live.state,{type:'source.complete'});
  assert.deepEqual(done.actions.slice(0,3).map(a=>a.target),['group:0','group:1','downstream']);
  const err=Object.freeze({error:true}),failed=stepModel(m,live.state,{type:'source.error',error:err});
  const errs=failed.actions.filter(a=>a.type==='notify');
  assert.deepEqual(errs.map(a=>a.target),['group:0','group:1','downstream']);
  assert.ok(errs.every(a=>a.notification.error===err));
});

test('S13 GROUPBY: stale key outcome, unknown group subscriptions and extra subscribers are illegal',()=>{
  const m=createGroupByModel(),s=execute(m,[{type:'subscribe'},{type:'source.next',value:1}]).state;
  assert.throws(()=>stepModel(m,s,{type:'callback.return',resource:ref('key',5),value:'x'}),/illegal/);
  const withGroup=execute(m,[{type:'subscribe'},{type:'source.next',value:1},
    {type:'callback.return',resource:ref('key',0),value:'x'},
    {type:'group.subscribe',groupId:0}]).state;
  assert.throws(()=>stepModel(m,withGroup,{type:'group.subscribe',groupId:0}),/illegal/);
  assert.throws(()=>stepModel(m,withGroup,{type:'group.unsubscribe',groupId:9}),/illegal/);
});

test('S13 IGNORE: no next even for undefined and object source payloads',()=>{
  const m=createIgnoreElementsModel();
  const out=execute(m,[{type:'subscribe'},{type:'source.next',value:undefined},
    {type:'source.next',value:{opaque:true}},{type:'source.complete'}]);
  assert.deepEqual(plain(out.notifications),[{kind:'C'}]);
});

test('S13 IGNORE: error preserves identity; cancel emits nothing',()=>{
  const m=createIgnoreElementsModel(),err=Symbol('e');
  const failed=execute(m,[{type:'subscribe'},{type:'source.error',error:err}]);
  assert.strictEqual(plain(failed.notifications)[0].error,err);
  assert.deepEqual(plain(execute(m,[{type:'subscribe'},{type:'cancel'}]).notifications),[]);
});

test('S13 ISEMPTY: first next short-circuits with false; source complete without next gives true',()=>{
  const m=createIsEmptyModel();
  const out=execute(m,[{type:'subscribe'},{type:'source.next',value:undefined}]);
  assert.deepEqual(plain(out.notifications),[{kind:'N',value:false},{kind:'C'}]);
  assert.throws(()=>stepModel(m,out.state,{type:'source.complete'}),/illegal/);
  assert.deepEqual(plain(execute(m,[{type:'subscribe'},{type:'source.complete'}]).notifications),
    [{kind:'N',value:true},{kind:'C'}]);
});

test('S13 ISEMPTY: source error and cancellation do not emit a Boolean',()=>{
  const m=createIsEmptyModel(),err={failure:true};
  assert.strictEqual(plain(execute(m,[{type:'subscribe'},{type:'source.error',error:err}]).notifications)[0].error,err);
  assert.deepEqual(plain(execute(m,[{type:'subscribe'},{type:'cancel'}]).notifications),[]);
});

test('S13 LAST: plain and predicate modes emit last selected value only on completion',()=>{
  const plainModel=createLastModel();
  const direct=execute(plainModel,[{type:'subscribe'},{type:'source.next',value:1},{type:'source.next',value:2}]);
  assert.deepEqual(plain(direct.notifications),[]);
  assert.deepEqual(plain(stepModel(plainModel,direct.state,{type:'source.complete'}).actions.filter(a=>a.type==='notify')),
    [{kind:'N',value:2},{kind:'C'}]);
  const predModel=createLastModel(true);
  const pred=execute(predModel,[{type:'subscribe'},{type:'source.next',value:1},
    {type:'callback.return',resource:ref('predicate',0),value:true},
    {type:'source.next',value:2},
    {type:'callback.return',resource:ref('predicate',1),value:false},{type:'source.complete'}]);
  assert.deepEqual(plain(pred.notifications),[{kind:'N',value:1},{kind:'C'}]);
});

test('S13 LAST: missing candidate gives EmptyError or explicit undefined default',()=>{
  const required=createLastModel();
  const absent=execute(required,[{type:'subscribe'},{type:'source.complete'}]);
  assert.equal(plain(absent.notifications)[0].kind,'E');
  assert.equal(plain(absent.notifications)[0].error.name,'EmptyError');
  const optional=createLastModel(false,{value:undefined});
  assert.deepEqual(plain(execute(optional,[{type:'subscribe'},{type:'source.complete'}]).notifications),
    [{kind:'N',value:undefined},{kind:'C'}]);
});

test('S13 LAST: indexed predicate exceptions, stale callback identity, cancellation suppress retained value',()=>{
  const m=createLastModel(true),s=execute(m,[{type:'subscribe'},{type:'source.next',value:'x'}]).state;
  assert.throws(()=>stepModel(m,s,{type:'callback.return',resource:ref('predicate',8),value:true}),/illegal/);
  const err=Symbol('predicate');
  const failed=stepModel(m,s,{type:'callback.throw',resource:ref('predicate',0),error:err});
  assert.strictEqual(plain(failed.actions.filter(a=>a.type==='notify'))[0].error,err);
  const live=execute(m,[{type:'subscribe'},{type:'source.next',value:1},
    {type:'callback.return',resource:ref('predicate',0),value:true}]);
  const cancel=stepModel(m,live.state,{type:'cancel'});
  assert.equal(cancel.actions.some(a=>a.type==='notify'),false);
});

test('S13 MAPTO: constant object retains reference on every source next and errors are untouched',()=>{
  const value=Object.freeze({constant:true}),m=createMapToModel(value),err=Symbol('x');
  const out=execute(m,[{type:'subscribe'},{type:'source.next',value:1},
    {type:'source.next',value:'unrelated'},{type:'source.error',error:err}]);
  const notifications=plain(out.notifications);
  assert.strictEqual(notifications[0].value,value);
  assert.strictEqual(notifications[1].value,value);
  assert.strictEqual(notifications[2].error,err);
});
