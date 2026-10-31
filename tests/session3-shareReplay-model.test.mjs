import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, toManifest, validateModel } from '../dist/runner.js';
import { renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace } from '../dist/render.js';
import { createShareReplayModel, runShareReplayTrace, shareReplayExample } from '../dist/models/shareReplay.js';
import { observeShareReplayModel } from './helpers/session3-shareReplay-model-driver.mjs';

const source=g=>({id:'source',generation:g});
const step=(model,state,event)=>stepModel(model,state,event).state;
const join=(name,now)=>({type:'subscriber.subscribe',subscriber:name,now});
const next=(g,value,now)=>({type:'source.next',resource:source(g),value,now});
const end=(g,now)=>({type:'source.complete',resource:source(g),now});
const err=(g,error,now)=>({type:'source.error',resource:source(g),error,now});
const leave=(name,now)=>({type:'subscriber.unsubscribe',subscriber:name,now});

for(const refCount of [false,true])for(const size of [1,2])for(const windowTime of [3,Infinity]){
  const config={bufferSize:size,windowTime,refCount};
  const id='S3-SHAREREPLAY-'+size+'-'+windowTime+'-'+Number(refCount);
  test(id+': canonical guarded rules are structurally valid',()=>{
    const model=createShareReplayModel(config);
    assert.deepEqual(validateModel(model),[]);
    const manifest=toManifest(model);
    assert.equal(manifest.metadata.operator,'shareReplay');
    assert.equal(manifest.parameters.refCount,refCount);
    assert.ok(manifest.rules.length>=8);
    for(const renderer of [renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior]){
      const text=renderer(manifest);
      for(const rule of manifest.rules)assert.ok(text.includes(rule.id),'lost '+rule.id);
    }
  });
  test(id+': replay memory is time/count bounded; source completion retains buffer',()=>{
    const model=createShareReplayModel(config);
    let s=step(model,model.initialState(),join('A',0));
    s=step(model,s,next(0,'a',1));
    s=step(model,s,next(0,'b',2));
    s=step(model,s,end(0,3));
    assert.equal(s.core.phase,'Completed');
    const result=stepModel(model,s,join('B',4));
    assert.equal(result.state.core.phase,'Completed');
    const eligible=[{value:'a',expiresAt:windowTime===Infinity?null:1+windowTime},
      {value:'b',expiresAt:windowTime===Infinity?null:2+windowTime}]
      .filter(x=>x.expiresAt===null||x.expiresAt>4).slice(-size);
    assert.deepEqual(result.actions.map(x=>x.notification?.kind),[...eligible.map(()=>'N'),'C']);
    assert.deepEqual(result.actions.filter(x=>x.notification?.kind==='N').map(x=>x.notification.value),
      eligible.map(x=>x.value));
  });
}
test('S3-SHAREREPLAY-MODEL: generated example keeps predicted trace and equal-time order',()=>{
  const model=createShareReplayModel({bufferSize:2,windowTime:6,refCount:false});
  const trace=runShareReplayTrace(model,shareReplayExample,{executionId:'s3-shareReplay'});
  assert.equal(trace.status,'finished-input');assert.equal(trace.state.core.phase,'Completed');
  assert.match(renderTrace(trace),/Four lanes/);
  assert.deepEqual(trace.steps.map(s=>s.ruleId),[
    'SHAREREPLAY-CONNECT','SHAREREPLAY-NEXT','SHAREREPLAY-NEXT','SHAREREPLAY-JOIN',
    'SHAREREPLAY-NEXT','SHAREREPLAY-LEAVE','SHAREREPLAY-COMPLETE-RETAIN','SHAREREPLAY-LATE-COMPLETE'
  ]);
  const late=trace.steps.at(-1).actions;
  assert.deepEqual(late.map(x=>x.notification?.kind),['N','N','C']);
  assert.deepEqual(late.slice(0,2).map(x=>x.notification.value),['b','c']);
  assert.throws(()=>runShareReplayTrace(model,[{time:0,event:join('X',1)}],{executionId:'bad'}),/timestamp/);
});
test('S3-SHAREREPLAY-MODEL: source values keep exact object and undefined identity',()=>{
  const model=createShareReplayModel({bufferSize:2});
  let s=step(model,model.initialState(),join('A',0));
  for(const payload of [undefined,NaN,{},null])s=step(model,s,next(0,payload,1));
  assert.equal(s.buffer.length,2);
  const r=stepModel(model,s,join('B',2));
  assert.deepEqual(r.actions.filter(a=>a.notification?.kind==='N').map(a=>a.notification.value),s.buffer.map(x=>x.value));
  assert.equal(r.actions.at(-1).notification.value,null);
});
test('S3-SHAREREPLAY-MODEL: errors reset and discard memory for new generation',()=>{
  const model=createShareReplayModel({bufferSize:2});
  let s=step(model,model.initialState(),join('A',0));
  s=step(model,s,next(0,'cached',1));
  const fault={};const terminated=stepModel(model,s,err(0,fault,2));
  assert.equal(terminated.state.core.phase,'Disconnected');assert.deepEqual(terminated.state.buffer,[]);
  assert.equal(terminated.actions[0].notification.error,fault);
  const fresh=stepModel(model,terminated.state,join('B',3));
  assert.deepEqual(fresh.actions,[{type:'subscribe',resource:source(1)}]);
});
test('S3-SHAREREPLAY-MODEL: refCount true resets, false keeps unseen values',()=>{
  for(const refCount of [false,true]){
    const model=createShareReplayModel({bufferSize:2,refCount});
    let s=step(model,model.initialState(),join('A',0));
    s=step(model,s,next(0,'a',1));
    const last=stepModel(model,s,leave('A',2));
    assert.equal(last.state.core.phase,refCount?'Disconnected':'Connected');
    assert.equal(last.state.buffer.length,refCount?0:1);
    if(!refCount){
      s=step(model,last.state,next(0,'b',3));
      const late=stepModel(model,s,join('B',4));
      assert.deepEqual(late.actions.map(x=>x.notification.value),['a','b']);
    }else{
      const late=stepModel(model,last.state,join('B',4));
      assert.deepEqual(late.actions,[{type:'subscribe',resource:source(1)}]);
    }
  }
});
test('S3-SHAREREPLAY-MODEL: exact expiry boundary, zero clamps, and invalid configurations',()=>{
  const model=createShareReplayModel({bufferSize:0,windowTime:0});
  assert.equal(model.parameters.bufferSize,1);assert.equal(model.parameters.windowTime,1);
  let s=step(model,model.initialState(),join('A',0));
  s=step(model,s,next(0,'a',1));
  const late=stepModel(model,s,join('B',2));
  assert.deepEqual(late.actions,[]); // expires at exactly 2
  for(const bad of [{bufferSize:-1},{windowTime:NaN},{windowTime:0.5},{bufferSize:1.5},{refCount:'true'},{scheduler:{}},{bufferSize:Number.MAX_SAFE_INTEGER+1}]){
    assert.throws(()=>createShareReplayModel(bad));
  }
});
test('S3-SHAREREPLAY-MODEL: stale generations, repeated subscriber IDs and backwards clocks are illegal',()=>{
  const model=createShareReplayModel();
  let s=step(model,model.initialState(),join('A',1));
  assert.throws(()=>stepModel(model,s,next(1,'stale',2)),/illegal/);
  assert.throws(()=>stepModel(model,s,join('A',2)),/illegal/);
  s=step(model,s,next(0,'ok',3));
  assert.throws(()=>stepModel(model,s,join('B',2)),/illegal/);
  assert.throws(()=>stepModel(model,s,err(0,'x',2)),/illegal/);
  assert.throws(()=>stepModel(model,s,leave('absent',4)),/illegal/);
});
test('S3-SHAREREPLAY-MODEL: bounded path witnesses reach every configured named rule',()=>{
  for(const refCount of [false,true]){
    const model=createShareReplayModel({bufferSize:2,windowTime:3,refCount});
    const inputs=[
      ['join','next','leave','join','next','complete','join'],
      ['join','next','error','join','next','complete','join'],
      ['join','join','next','leave','next','leave','join','complete'],
    ];
    const ids=new Set();
    for(const commands of inputs)for(const rule of observeShareReplayModel(model,commands).rules)ids.add(rule);
    for(const rule of model.rules){
      assert.ok(ids.has(rule.description.id),'unreached '+rule.description.id);
    }
  }
});
