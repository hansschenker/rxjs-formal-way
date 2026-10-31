import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, toManifest, runTrace, validateModel } from '../dist/runner.js';
import { renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace } from '../dist/render.js';
import {
  createSwitchAllModel, createMergeAllModel, createConcatAllModel, createExhaustAllModel,
  switchAllExample, mergeAllExample, concatAllExample, exhaustAllExample,
} from '../dist/models/all.js';
import { observeFlattenModel } from './helpers/session2-flatten-driver.mjs';

const configs = [
  ['switchAll', createSwitchAllModel, switchAllExample],
  ['mergeAll', () => createMergeAllModel(2), mergeAllExample],
  ['concatAll', createConcatAllModel, concatAllExample],
  ['exhaustAll', createExhaustAllModel, exhaustAllExample],
];
const plan = (value, delay=1) => ({ events: [{delay, kind: 'N', value}, {delay:delay+1,kind:'C'}] });
const next=(time,value)=>({time,kind:'N',value}),end=time=>({time,kind:'C'}),cancel=time=>({time,kind:'cancel'});
for (const [name, factory, example] of configs) {
  test('S3-MODEL '+name+': valid six-tuple and deterministic generated projections', () => {
    const model=factory(), manifest=toManifest(model);
    assert.deepEqual(validateModel(model), []); assert.equal(manifest.metadata.operator,name);
    assert.equal(manifest.metadata.cardinality.signature, name+' : (T*)* -> T*');
    assert.ok(manifest.metadata.sources.some(s=>s.url.endsWith('/'+name+'.ts')));
    assert.ok(manifest.rules.length>=10);
    for(const render of [renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior]){
      const body=render(manifest);assert.equal(render(manifest),body);
      for(const rule of manifest.rules)assert.ok(body.includes(rule.id),'missing '+rule.id);
    }
    const trace=runTrace(model,example,{executionId:'s3-'+name});
    assert.equal(trace.status,'finished-input');assert.equal(trace.state.phase,'Closed');
    assert.match(renderTrace(trace),/Four lanes/);
    assert.equal(JSON.stringify(trace).includes('S3-'+name.toUpperCase()),false); // rule IDs are unprefixed to keep an alias model independent of test IDs
    assert.equal(trace.steps.every(s=>s.modelId===model.metadata.id),true);
  });
  test('S3-MODEL '+name+': identity microstep must return EXACT same source token', () => {
    const model=factory(), source=plan('payload'), init=stepModel(model,model.initialState(),{type:'subscribe'});
    const calling=stepModel(model,init.state,{type:'outer.next',value:source});
    assert.equal(calling.state.phase,'Calling');
    assert.equal(calling.actions[0].type,'invoke-callback');
    assert.equal(calling.actions[0].resource.id,'identity');
    assert.throws(()=>stepModel(model,calling.state,{type:'callback.return',
      resource:calling.actions[0].resource,value:plan('payload')}),/illegal/);
    assert.throws(()=>stepModel(model,calling.state,{type:'callback.throw',
      resource:calling.actions[0].resource,error:'not-a-user-callback'}),/illegal/);
    const accepted=stepModel(model,calling.state,{type:'callback.return',
      resource:calling.actions[0].resource,value:source});
    assert.equal(accepted.state.phase,'Active');
    assert.equal(accepted.state.active[0].source,source);
  });
  test('S3-MODEL '+name+': notifications and cleanup are retained by identity lowering', () => {
    const a=plan('a',3),b=plan('b',3),c=plan('c',3);
    const actual=observeFlattenModel(factory(),[next(1,a),next(2,b),next(3,c),end(4)],x=>x);
    const observed=actual.observations.filter(x=>x.kind==='N').map(x=>x.value);
    assert.deepEqual(observed,name==='switchAll'?['c']:name==='exhaustAll'?['a']:['a','b','c']);
    assert.equal(actual.closed,true);assert.equal(actual.live,0);
    assert.equal(actual.observations.filter(x=>x.kind==='project').length,
      name==='exhaustAll'?1:3);
  });
  test('S3-MODEL '+name+': cancellation is silent and releases admitted work', () => {
    const actual=observeFlattenModel(factory(),[next(1,plan('a',10)),next(2,plan('b',10)),cancel(3)],x=>x);
    assert.equal(actual.live,0);assert.equal(actual.closed,true);
    assert.equal(actual.observations.filter(x=>x.kind==='N'||x.kind==='C'||x.kind==='E').length,0);
  });
  test('S3-MODEL '+name+': rule identities and rejected foreign deliveries', () => {
    const model=factory(), ids=model.rules.map(r=>r.description.id);
    assert.equal(ids.length,new Set(ids).size);
    const initial=stepModel(model,model.initialState(),{type:'subscribe'}).state;
    assert.throws(()=>stepModel(model,initial,{type:'inner.next',resource:{id:'inner',generation:9},value:'stale'}),/illegal/);
    assert.throws(()=>stepModel(model,initial,{type:'callback.return',resource:{id:'identity',generation:0},value:'orphan'}),/illegal/);
    assert.ok(ids.every(id=>id.startsWith(name.toUpperCase()+'-')));
  });
}
test('S3-MODEL mergeAll concurrency profiles are one export name',()=>{
  for(const [limit,expected] of [[1,1],[2,2],[Infinity,3]]){
    const model=createMergeAllModel(limit);
    const a=plan('a',5),b=plan('b',5),c=plan('c',5);
    const out=observeFlattenModel(model,[next(1,a),next(2,b),next(3,c),end(4)],x=>x);
    assert.equal(out.observations.filter(x=>x.kind==='subscribe'&&x.id==='inner'&&x.time<=3).length,expected);
    assert.deepEqual(out.observations.filter(x=>x.kind==='N').map(x=>x.value),['a','b','c']);
  }
});
test('S3-MODEL invalid mergeAll concurrency is rejected',()=>{
  for(const bad of [0,-1,1.5,NaN])assert.throws(()=>createMergeAllModel(bad),/concurrency/);
});
