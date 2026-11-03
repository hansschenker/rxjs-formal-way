import test from 'node:test';
import assert from 'node:assert/strict';
import {Observable,Subject,EMPTY,NEVER,of,reduce,count,toArray,min,max} from 'rxjs';
import {TestScheduler} from 'rxjs/testing';
import {
  createSeededReduceModel,createUnseededReduceModel,createCountModel,createToArrayModel,createMinModel,createMaxModel
} from '../dist/index.js';
import {observeAggregateModel,observeAggregateRxjs,sourceWord,at,words,notifications,fault} from './helpers/session06-driver.mjs';
const collect=observable=>{
  const values=[];let terminal='open';
  const subscription=observable.subscribe({
    next:x=>values.push(x),error:e=>terminal=e,complete:()=>terminal='complete'
  });
  return {values,terminal,subscription};
};
test('S6-REDUCE-01: cold construction is lazy and seeded/empty emission happens only on completion',()=>{
  let acquisitions=0,calls=0;
  const src=new Observable(subscriber=>{acquisitions++;subscriber.complete();});
  const stream=src.pipe(reduce(()=>{calls++;return 1;},undefined));
  assert.equal(acquisitions,0);assert.equal(calls,0);
  assert.deepEqual(collect(stream).values,[undefined]);
  assert.equal(acquisitions,1);assert.equal(calls,0);
  assert.deepEqual(collect(EMPTY.pipe(reduce((a,b)=>a+b))).values,[]);
  assert.deepEqual(collect(EMPTY.pipe(reduce((a,b)=>a+b,0))).values,[0]);
});
test('S6-REDUCE-02: callback arguments, indices, missing seed and stored undefined are distinct',()=>{
  const a=observeAggregateRxjs(createSeededReduceModel(undefined),sourceWord([7,8,'C']),{reducer:(p,x)=>p===undefined?100:p+x});
  assert.deepEqual(a,[[0,'subscribe','source',0],[1,'call',undefined,7,0],
    [2,'call',100,8,1],[3,'N',108],[3,'C'],[3,'unsubscribe','source',0]]);
  const b=observeAggregateRxjs(createUnseededReduceModel(),sourceWord([7,8,'C']));
  assert.deepEqual(b,[[0,'subscribe','source',0],[2,'call',7,8,1],[3,'N',15],[3,'C'],[3,'unsubscribe','source',0]]);
  const calls=[];
  const results=collect(of(1,2).pipe(reduce((a,b,i)=>{calls.push([a,b,i]);return undefined;},0)));
  assert.deepEqual(results.values,[undefined]);
  assert.deepEqual(calls,[[0,1,0],[undefined,2,1]]);
});
test('S6-REDUCE-03: errors and cancellation discard pending result and preserve error identity',()=>{
  for(const ending of ['E','X']){
    const result=observeAggregateRxjs(createSeededReduceModel(0),sourceWord([2,3,ending]));
    assert.equal(notifications(result).some(x=>x[1]==='N'),false);
    assert.equal(result.at(-1)[1],'unsubscribe');
    assert.equal(notifications(result).at(-1)?.[1],ending==='E'?'E':undefined);
  }
  for(const thrown of [null,undefined,Error('sentinel'),{}]){
    const rows=observeAggregateRxjs(createSeededReduceModel(0),sourceWord([2,3,'C']),{reducer:()=>{throw thrown;}});
    assert.strictEqual(notifications(rows).at(-1)[2],thrown);
    assert.equal(rows.at(-1)[1],'unsubscribe');
    assert.equal(rows.filter(x=>x[1]==='call').length,1);
  }
});
test('S6-COUNT-01: optional predicate indexes original source values; empty input counts zero',()=>{
  assert.deepEqual(collect(EMPTY.pipe(count())).values,[0]);
  assert.deepEqual(collect(EMPTY.pipe(count(x=>x>0))).values,[0]);
  const rows=observeAggregateRxjs(createCountModel(true),sourceWord([2,3,4,'C']),{predicate:(x,i)=>i===0||x===4});
  assert.deepEqual(rows.filter(x=>x[1]==='call'),[[1,'call',2,0],[2,'call',3,1],[3,'call',4,2]]);
  assert.deepEqual(notifications(rows),[[4,'N',2],[4,'C']]);
  assert.deepEqual(notifications(observeAggregateRxjs(createCountModel(),sourceWord([1,1,1,'C']))),[[4,'N',3],[4,'C']]);
});
test('S6-COUNT-02: thrown predicate and source error never cause an intermediate or final count',()=>{
  const err={predicate:'failed'};
  const rows=observeAggregateRxjs(createCountModel(true),sourceWord([1,2,'C']),{predicate:()=>{throw err;}});
  assert.deepEqual(notifications(rows),[[1,'E',err]]);
  assert.equal(rows.at(-1)[1],'unsubscribe');
  assert.deepEqual(notifications(observeAggregateRxjs(createCountModel(),sourceWord([1,'E']))),[[2,'E',fault]]);
});
test('S6-TOARRAY-01: empty emits a fresh array, nonempty preserves value references and order',()=>{
  const first=collect(EMPTY.pipe(toArray())).values[0],second=collect(EMPTY.pipe(toArray())).values[0];
  assert.deepEqual(first,[]);assert.notStrictEqual(first,second);
  const x=Object.freeze({id:1}),y=undefined;
  const output=collect(of(x,y,x).pipe(toArray())).values[0];
  assert.equal(output.length,3);
  assert.strictEqual(output[0],x);assert.strictEqual(output[1],y);assert.strictEqual(output[2],x);
});
test('S6-TOARRAY-02: source error or cancellation discards array; no flush before completion',()=>{
  for(const token of ['E','X']){
    const rows=observeAggregateRxjs(createToArrayModel(),sourceWord([1,2,token]));
    assert.equal(notifications(rows).some(x=>x[1]==='N'),false);
    assert.equal(rows.at(-1)[1],'unsubscribe');
  }
  const subject=new Subject(),values=[];
  const sub=subject.pipe(toArray()).subscribe(v=>values.push(v));
  subject.next('a');subject.next('b');assert.deepEqual(values,[]);
  sub.unsubscribe();subject.complete();assert.deepEqual(values,[]);
});
test('S6-MINMAX-01: empty source emits nothing, default numeric semantics and ties select later',()=>{
  for(const op of [min,max])assert.deepEqual(collect(EMPTY.pipe(op())).values,[]);
  assert.deepEqual(collect(of(5,3,9,1).pipe(min())).values,[1]);
  assert.deepEqual(collect(of(5,3,9,1).pipe(max())).values,[9]);
  const a={v:7},b={v:7},c={v:2};
  assert.strictEqual(collect(of(a,b,c).pipe(min((x,y)=>x.v-y.v))).values[0],c);
  assert.strictEqual(collect(of(a,c,b).pipe(max((x,y)=>x.v-y.v))).values[0],b);
  assert.strictEqual(collect(of(a,b).pipe(min(()=>0))).values[0],b);
  assert.strictEqual(collect(of(a,b).pipe(max(()=>NaN))).values[0],b);
});
test('S6-MINMAX-02: comparer receives former candidate then new value and propagates errors',()=>{
  for(const [kind,op] of [['min',min],['max',max]]){
    const calls=[];const value=collect(of(5,3,9).pipe(op((a,b)=>{
      calls.push([a,b]);return a-b;
    }))).values[0];
    assert.deepEqual(calls,kind==='min'?[[5,3],[3,9]]:[[5,3],[5,9]]);
    assert.equal(value,kind==='min'?3:9);
    const thrown={custom:'failure'};
    const failed=collect(of(1,2,3).pipe(op(()=>{throw thrown;})));
    assert.strictEqual(failed.terminal,thrown);
    assert.deepEqual(failed.values,[]);
  }
});
test('S6-LIFECYCLE: actual RxJS subscription lifetimes respect virtual time and equal-time input order',()=>{
  const schedule=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
  schedule.run(({cold,expectObservable,expectSubscriptions})=>{
    const src=cold('--a-b-c---|',{a:1,b:2,c:3});
    expectObservable(src.pipe(reduce((a,b)=>a+b,0))).toBe('----------(x|)',{x:6});
    expectSubscriptions(src.subscriptions).toBe('^---------!');
  });
  const rows=observeAggregateRxjs(createCountModel(),sourceWord([1,2,'C'],true));
  assert.deepEqual(rows,[[0,'subscribe','source',0],[2,'N',2],[2,'C'],[2,'unsubscribe','source',0]]);
});
test('S6-OWNERSHIP: two subscriptions get separate arrays, counts and callback indices',()=>{
  const source=new Subject(),arr=source.pipe(toArray()),counted=source.pipe(count()),a=[],b=[],c=[],d=[];
  arr.subscribe(v=>a.push(v));counted.subscribe(v=>c.push(v));
  source.next(1);
  arr.subscribe(v=>b.push(v));counted.subscribe(v=>d.push(v));
  source.next(2);source.complete();
  assert.deepEqual(a,[[1,2]]);assert.deepEqual(b,[[2]]);
  assert.notStrictEqual(a[0],b[0]);
  assert.deepEqual(c,[2]);assert.deepEqual(d,[1]);
  // Source sharing does not imply downstream accumulation sharing.
});
test('S6-SYNC: a cooperative synchronous source completes, errors and stops producing after take',()=>{
  const values=[];
  new Observable(s=>{for(let n=0;n<4&&!s.closed;n++)s.next(n);s.complete();})
    .pipe(reduce((a,b)=>a+b,0)).subscribe(v=>values.push(v));
  assert.deepEqual(values,[6]);
  assert.equal(collect(NEVER.pipe(toArray())).subscription.closed,false);
});
test('S6-DIFFERENTIAL: bounded schedules compare aggregate notifications, callback calls, times and resource release',()=>{
  const setups=[
    ['reduce-seeded',()=>createSeededReduceModel(0),{reducer:(a,x)=>a+x}],
    ['reduce-unseeded',()=>createUnseededReduceModel(),{reducer:(a,x)=>a+x}],
    ['count-plain',()=>createCountModel(),{}],
    ['count-predicate',()=>createCountModel(true),{predicate:(x,i)=>x===2||i===0}],
    ['toArray',()=>createToArrayModel(),{}],
    ['min-default',()=>createMinModel(),{}],
    ['max-default',()=>createMaxModel(),{}],
    ['min-comparer',()=>createMinModel(true),{comparer:(a,b)=>a-b}],
    ['max-comparer',()=>createMaxModel(true),{comparer:(a,b)=>a-b}],
  ];
  let cases=0;
  for(const [name,make,opts] of setups){
    for(const word of words(3))for(const tied of [false,true]){
      const model=make(),events=sourceWord(word,tied);
      const expected=observeAggregateModel(model,events,opts).logs;
      const observed=observeAggregateRxjs(model,events,opts);
      assert.deepEqual(observed,expected,name+' '+JSON.stringify(word)+' tied='+tied);
      cases++;
    }
  }
  assert.ok(cases>=1000);
  console.log('Session 6: '+cases+' bounded model/native schedule comparisons.');
});
