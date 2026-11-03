import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSeededReduceModel,createUnseededReduceModel,createCountModel,createToArrayModel,createMinModel,createMaxModel,
  reduceSeededExample,reduceUnseededExample,countExample,countPredicateExample,toArrayExample,minExample,maxExample,
  validateModel,toManifest,stepModel,runTrace,renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior,renderTrace
} from '../dist/index.js';
import {observeAggregateModel,sourceWord,at,notifications,fault} from './helpers/session06-driver.mjs';

const fixtures=[
  ['reduce-seeded',()=>createSeededReduceModel(0),reduceSeededExample],
  ['reduce-unseeded',()=>createUnseededReduceModel(),reduceUnseededExample],
  ['count-plain',()=>createCountModel(),countExample],
  ['count-predicate',()=>createCountModel(true),countPredicateExample],
  ['toArray',()=>createToArrayModel(),toArrayExample],
  ['min',()=>createMinModel(),minExample],
  ['max',()=>createMaxModel(),maxExample]
];
for(const [name,make,example] of fixtures){
  test('S6-MODEL '+name+': six-tuple, named guards and all eight deterministic views',()=>{
    const model=make(),manifest=toManifest(model);
    assert.deepEqual(validateModel(model),[]);
    assert.ok(manifest.metadata.sources.some(s=>s.url.includes('/'+model.parameters.operator+'.ts')));
    assert.equal(manifest.metadata.rxjsVersion,'7.8.2');
    assert.ok(manifest.metadata.cardinality.signature.includes(model.parameters.operator));
    assert.ok(manifest.metadata.scope.time.includes('No clock'));
    assert.equal(new Set(model.rules.map(r=>r.description.id)).size,model.rules.length);
    for(const renderer of [renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior]){
      const text=renderer(manifest);
      assert.equal(text,renderer(manifest));
      for(const r of model.rules)assert.ok(text.includes(r.description.id),r.description.id);
    }
    const trace=runTrace(model,example,{executionId:'session6-'+name});
    assert.equal(trace.status,'finished-input');
    assert.equal(trace.state.phase,'Closed');
    assert.ok(trace.steps.some(s=>s.actions.some(a=>a.type==='notify'&&a.notification.kind==='C')));
    assert.match(renderTrace(trace),/Four lanes/);
    assert.equal(trace.steps.every(step=>step.modelId===model.metadata.id),true);
  });
  test('S6-MODEL '+name+': independent executions, invalid control and callback resource',()=>{
    const model=make();
    assert.notStrictEqual(model.initialState(),model.initialState());
    const state=stepModel(model,model.initialState(),{type:'subscribe'}).state;
    assert.equal(state.phase,'Collecting');
    assert.throws(()=>stepModel(model,state,{type:'subscribe'}),/illegal/);
    assert.throws(()=>stepModel(model,model.initialState(),{type:'source.complete'}),/illegal/);
    assert.notDeepEqual(model.validateState({phase:'Collecting',index:-1,memory:{present:false}},model.parameters),[]);
    assert.notDeepEqual(model.validateState({phase:'Calling',index:2,callId:1,memory:{present:false},input:1},model.parameters),[]);
  });
}
test('S6-MODEL reduce: absent versus undefined seed, indexes and last-only emission',()=>{
  const a=createSeededReduceModel(undefined),b=createUnseededReduceModel();
  const seeded=observeAggregateModel(a,sourceWord([7,8,'C']),{reducer:(p,v)=>p===undefined?100:v+p});
  const unseeded=observeAggregateModel(b,sourceWord([7,8,'C']),{reducer:(p,v)=>p+v});
  assert.deepEqual(notifications(seeded.logs),[[3,'N',108],[3,'C']]);
  assert.deepEqual(notifications(unseeded.logs),[[3,'N',15],[3,'C']]);
  assert.deepEqual(seeded.logs.filter(x=>x[1]==='call'),[[1,'call',undefined,7,0],[2,'call',100,8,1]]);
  assert.deepEqual(unseeded.logs.filter(x=>x[1]==='call'),[[2,'call',7,8,1]]);
  assert.deepEqual(notifications(observeAggregateModel(a,sourceWord(['C'])).logs),[[1,'N',undefined],[1,'C']]);
  assert.deepEqual(notifications(observeAggregateModel(b,sourceWord(['C'])).logs),[[1,'C']]);
});
test('S6-MODEL count: plain, predicate truthiness, original index and empty counts',()=>{
  const plain=createCountModel(),pred=createCountModel(true);
  assert.deepEqual(notifications(observeAggregateModel(plain,sourceWord(['C'])).logs),[[1,'N',0],[1,'C']]);
  const p=observeAggregateModel(pred,sourceWord([2,3,4,'C']),{predicate:(v,i)=>i===0?{yes:true}:v===4});
  assert.deepEqual(notifications(p.logs),[[4,'N',2],[4,'C']]);
  assert.deepEqual(p.logs.filter(x=>x[1]==='call'),[[1,'call',2,0],[2,'call',3,1],[3,'call',4,2]]);
  assert.deepEqual(observeAggregateModel(plain,sourceWord([2,3,'C'])).logs.filter(x=>x[1]==='call'),[]);
});
test('S6-MODEL toArray: empty array, payload identity, fresh per-subscription output',()=>{
  const model=createToArrayModel();
  const a={},b=undefined;
  const observe=()=>observeAggregateModel(model,[at(1,'source.next',{value:a}),at(2,'source.next',{value:b}),at(3,'source.complete')]);
  const left=notifications(observe().logs)[0][2],right=notifications(observe().logs)[0][2];
  assert.notStrictEqual(left,right);
  assert.strictEqual(left[0],a);
  assert.equal(left[1],undefined);
  assert.deepEqual(notifications(observeAggregateModel(model,sourceWord(['C'])).logs),[[1,'N',[]],[1,'C']]);
});
test('S6-MODEL extrema: first item bypasses comparison; strict sign and ties choose later',()=>{
  for(const [make,name] of [[createMinModel,'min'],[createMaxModel,'max']]){
    const model=make(true),first={n:5},second={n:5};
    const result=observeAggregateModel(model,[at(1,'source.next',{value:first}),at(2,'source.next',{value:second}),at(3,'source.complete')],{comparer:()=>0});
    assert.strictEqual(notifications(result.logs)[0][2],second);
    assert.equal(result.logs.filter(r=>r[1]==='call').length,1);
    assert.deepEqual(notifications(observeAggregateModel(model,sourceWord(['C'])).logs),[[1,'C']]);
    const nan=observeAggregateModel(model,sourceWord([5,3,'C']),{comparer:()=>NaN});
    assert.equal(notifications(nan.logs)[0][2],3);
  }
});
test('S6-MODEL reducer, predicate and comparer errors preserve arbitrary thrown values',()=>{
  for(const model of [createSeededReduceModel(0),createUnseededReduceModel(),createCountModel(true),createMinModel(true),createMaxModel(true)]){
    const errorPayload=undefined;
    const r=observeAggregateModel(model,sourceWord([1,2,3,'C']),{
      reducer:()=>{throw errorPayload;},predicate:()=>{throw errorPayload;},comparer:()=>{throw errorPayload;}
    });
    assert.equal(notifications(r.logs).at(-1)[1],'E');
    assert.strictEqual(notifications(r.logs).at(-1)[2],errorPayload);
    assert.deepEqual(r.logs.at(-1).slice(1),['unsubscribe','source',0]);
    assert.equal(notifications(r.logs).some(x=>x[1]==='C'),false);
    assert.equal(r.state.reason,'callback-error');
  }
});
test('S6-MODEL terminal policies: error and cancellation never flush',()=>{
  for(const [,make] of fixtures){
    const model=make();
    for(const token of ['E','X']){
      const r=observeAggregateModel(model,sourceWord([1,token]));
      assert.equal(notifications(r.logs).some(x=>x[1]==='N'),false);
      assert.equal(notifications(r.logs).some(x=>x[1]==='C'),false);
      assert.equal(r.logs.at(-1)[1],'unsubscribe');
      assert.equal(r.state.phase,'Closed');
    }
  }
});
test('S6-MODEL correlated outcomes cannot be stale, foreign, duplicated or reentrant',()=>{
  const m=createSeededReduceModel(0);
  let s=stepModel(m,m.initialState(),{type:'subscribe'}).state;
  s=stepModel(m,s,{type:'source.next',value:1}).state;
  for(const e of [
    {type:'callback.return',resource:{id:'aggregate-callback',generation:1},value:1},
    {type:'callback.throw',resource:{id:'other',generation:0},error:fault},
    {type:'source.next',value:2},{type:'source.complete'},{type:'cancel'}
  ])assert.throws(()=>stepModel(m,s,e),/illegal/);
  const r=stepModel(m,s,{type:'callback.return',resource:{id:'aggregate-callback',generation:0},value:1});
  assert.throws(()=>stepModel(m,r.state,{type:'callback.return',resource:{id:'aggregate-callback',generation:0},value:1}),/illegal/);
});
test('S6-MODEL exact lifecycle and action mutation checks',()=>{
  const m=createToArrayModel(),init=stepModel(m,m.initialState(),{type:'subscribe'}).state;
  const complete=stepModel(m,init,{type:'source.complete'});
  assert.deepEqual(complete.actions.map(a=>a.type==='notify'?a.notification.kind:a.type),['N','C','unsubscribe']);
  assert.ok(m.validateReaction(init,{type:'source.complete'},{state:complete.state,actions:[...complete.actions].reverse()},m.parameters).length);
  const after=stepModel(m,init,{type:'cancel'}).state;
  assert.throws(()=>stepModel(m,after,{type:'source.next',value:1}),/illegal/);
});
test('S6-MODEL rule witness scenarios reach the nonterminal and error transitions',()=>{
  for(const [,make] of fixtures){
    const model=make();
    for(const word of [['C'],['E'],['X'],[1,'C'],[1,2,'C'],[1,2,'E'],[1,2,'X']]){
      const x=observeAggregateModel(model,sourceWord(word));
      assert.equal(x.state.phase,'Closed');
      assert.ok(x.rules.some(id=>id.endsWith('INIT')));
    }
  }
});
