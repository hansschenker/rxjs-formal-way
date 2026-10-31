import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, of, EMPTY, NEVER, switchAll, mergeAll, concatAll, exhaustAll, take } from 'rxjs';
import { createSwitchAllModel, createMergeAllModel, createConcatAllModel, createExhaustAllModel } from '../dist/models/all.js';
import { observeFlattenModel, words } from './helpers/session2-flatten-driver.mjs';
import { observeAllRx } from './helpers/session3-all-rxjs-driver.mjs';

const configurations=[
 ['switchAll',createSwitchAllModel,undefined],
 ['mergeAll',()=>createMergeAllModel(2),2],
 ['mergeAll',()=>createMergeAllModel(1),1],
 ['mergeAll',createMergeAllModel,Infinity],
 ['concatAll',createConcatAllModel,undefined],
 ['exhaustAll',createExhaustAllModel,undefined],
];
const next=(time,value)=>({time,kind:'N',value});
const end=time=>({time,kind:'C'});
const error=(time,value)=>({time,kind:'E',error:value});
const cancel=time=>({time,kind:'cancel'});
const plan=(v,delay=2)=>({events:[{delay,kind:'N',value:v},{delay:delay+1,kind:'C'}]});
const notifications=xs=>xs.filter(x=>['N','E','C'].includes(x.kind));
function compare(name,factory,concurrent,outerEvents){
  const expected=observeFlattenModel(factory(),outerEvents,x=>x);
  const actual=observeAllRx(name,concurrent,outerEvents);
  const abstract=expected.observations.filter(x=>x.kind!=='project');
  assert.deepEqual(actual.observations,abstract,JSON.stringify({name,concurrent,outerEvents}));
  assert.equal(actual.live,expected.live);
  assert.equal(actual.closed,expected.closed);
  return actual;
}
for(const [name,factory,concurrent] of configurations){
  const label='S3-'+name.toUpperCase()+(concurrent===undefined?'':'-'+concurrent);
  test(label+': construction is lazy and empty outer completes without subscribing to an inner',()=>{
    const xs=compare(name,factory,concurrent,[end(2)]).observations;
    assert.deepEqual(xs,[{time:0,kind:'subscribe',id:'outer',generation:0},{time:2,kind:'C'},{time:2,kind:'unsubscribe',id:'outer',generation:0}]);
  });
  test(label+': inner values and all subscription lifetimes match the canonical model',()=>{
    const xs=compare(name,factory,concurrent,[next(1,plan('a',5)),next(2,plan('b',5)),next(3,plan('c',5)),end(4)]).observations;
    const valueOrder=notifications(xs).filter(x=>x.kind==='N').map(x=>x.value);
    assert.deepEqual(valueOrder,name==='switchAll'?['c']:name==='exhaustAll'?['a']:['a','b','c']);
    assert.deepEqual(xs.slice(-2).map(x => x.kind), name === 'mergeAll' || name === 'concatAll' ? ['unsubscribe', 'C'] : ['C', 'unsubscribe']);
  });
  test(label+': errors end the result and release resources without waiting',()=>{
    for(const fault of [undefined,null,{},new Error('fault')]){
      const xs=compare(name,factory,concurrent,[next(1,plan('a',8)),error(2,fault)]).observations;
      assert.deepEqual(notifications(xs),[{time:2,kind:'E',error:fault}]);
    }
  });
  test(label+': explicit cancellation never emits a synthetic completion',()=>{
    const xs=compare(name,factory,concurrent,[next(1,plan('a',8)),next(2,plan('b',8)),cancel(3)]).observations;
    assert.deepEqual(notifications(xs),[]);
    assert.equal(xs.at(-1).time,3);
  });
  test(label+': completion waits for accepted/queued inners',()=>{
    const xs=compare(name,factory,concurrent,[next(1,plan('a',3)),next(2,plan('b',3)),end(3)]).observations;
    assert.equal(notifications(xs).at(-1).kind,'C');
    assert.ok(notifications(xs).at(-1).time>3);
  });
  test(label+': inner error wins and tears down the outer and other inners',()=>{
    const bad={events:[{delay:4,kind:'E',error:'inner-fault'}]};
    const xs=compare(name,factory,concurrent,[next(1,bad),next(2,plan('b',9)),end(30)]).observations;
    if(name==='switchAll')assert.equal(xs.some(x=>x.kind==='E'),false); // replaced before error delivery
    else {
      assert.equal(notifications(xs).at(-1).kind,'E');
      assert.equal(notifications(xs).at(-1).error,'inner-fault');
    }
  });
}
test('S3-ALL-SYNC: each export admits synchronous inner Observables with correct order',()=>{
  for(const op of [switchAll(),mergeAll(),mergeAll(1),concatAll(),exhaustAll()]){
    const observed=[];
    of(of(1,2),of(3,4)).pipe(op).subscribe({next:v=>observed.push(v),complete:()=>observed.push('C')});
    assert.deepEqual(observed,[1,2,3,4,'C']);
  }
});
test('S3-ALL-REENTRANT-EXCLUDED: no forced FIFO interpretation of switchAll reentry',()=>{
  const outer=new Subject(), log=[];
  const sub=outer.pipe(switchAll()).subscribe(value=>{log.push(value);if(value==='first')outer.next(of('new'));});
  outer.next(of('first','stale'));
  assert.deepEqual(log,['first','new']);sub.unsubscribe();
});
test('S3-ALL-TAKE: downstream cancellation interrupts cooperative synchronous production',()=>{
  for(const op of [switchAll(),mergeAll(),concatAll(),exhaustAll()]){
    let count=0, finalized=0;
    const inner=new Observable(s=>{for(let i=0;i<4&&!s.closed;i++){count++;s.next(i);}return()=>finalized++;});
    const xs=[];of(inner).pipe(op,take(1)).subscribe(v=>xs.push(v));
    assert.deepEqual(xs,[0]);assert.equal(count,1);assert.equal(finalized,1);
  }
});
test('S3-ALL-DIFF: 4860 bounded schedules match actual RxJS notifications and lifetimes',()=>{
  const plans=[
    v=>plan(v,2),
    ()=>({events:[{delay:1,kind:'C'}]}),
    v=>({events:[{delay:1,kind:'N',value:v},{delay:3,kind:'E',error:'inner-fault'}]}),
  ];
  let count=0;
  for(const [name,factory,concurrent] of configurations)for(const make of plans)
    for(const word of words(['a','b'],3))for(const spacing of [0,2,5])
      for(const terminal of ['complete','error','cancel'])for(const offset of [0,2]){
        const events=word.map((v,i)=>next(1+i*spacing,make(v)));
        const t=(events.at(-1)?.time??1)+offset;
        events.push(terminal==='complete'?end(t):terminal==='error'?error(t,'outer-fault'):cancel(t));
        compare(name,factory,concurrent,events);
        count++;
      }
  assert.equal(count,4860);
});
