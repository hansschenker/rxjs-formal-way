import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Observable, Subject, of, EMPTY, throwError,
  single, skipLast, subscribeOn, switchMapTo, switchScan, finalize
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

const observed = observable => {
  const events=[];
  const subscription=observable.subscribe({
    next:value=>events.push({kind:'N',value}),
    error:error=>events.push({kind:'E',error}),
    complete:()=>events.push({kind:'C'})
  });
  return {events,subscription};
};

test('S19 native single: first value withheld until successful source completion',()=>{
  const source=new Subject();
  const x=observed(source.pipe(single()));
  source.next('only');
  assert.deepEqual(x.events,[]);
  source.complete();
  assert.deepEqual(x.events,[{kind:'N',value:'only'},{kind:'C'}]);
});
test('S19 native single: an empty source errors with EmptyError',()=>{
  const x=observed(EMPTY.pipe(single()));
  assert.equal(x.events.length,1);
  assert.equal(x.events[0].error.name,'EmptyError');
});
test('S19 native single: second matching value errors immediately with SequenceError',()=>{
  const delivered=[];
  const source=new Observable(sub=>{
    for(const i of [1,2,3]){if(sub.closed)break;delivered.push(i);sub.next(i);}
    if(!sub.closed)sub.complete();
  });
  const x=observed(source.pipe(single()));
  assert.deepEqual(delivered,[1,2]);
  assert.equal(x.events[0].error.name,'SequenceError');
});
test('S19 native single: no match after nonempty source is NotFoundError',()=>{
  const x=observed(of(1,3,5).pipe(single(v=>v%2===0)));
  assert.equal(x.events[0].error.name,'NotFoundError');
});
test('S19 native single: indexed predicate sees each candidate, returns exact original object',()=>{
  const values=[{id:1},{id:2},{id:3}],indices=[];
  const x=observed(of(...values).pipe(single((v,i)=>{indices.push(i);return v.id===2;})));
  assert.deepEqual(indices,[0,1,2]);
  assert.equal(x.events[0].value,values[1]);
  assert.deepEqual(x.events.slice(1),[{kind:'C'}]);
});
test('S19 native single: duplicate predicate match terminates before source completion',()=>{
  const source=new Subject(),x=observed(source.pipe(single(v=>v>0)));
  source.next(1);source.next(-1);
  assert.deepEqual(x.events,[]);
  source.next(2);
  assert.equal(x.events[0].error.name,'SequenceError');
  assert.equal(source.observers.length,0);
});
test('S19 native single: undefined is present, not mistaken for empty',()=>{
  assert.deepEqual(observed(of(undefined).pipe(single())).events,[{kind:'N',value:undefined},{kind:'C'}]);
});
test('S19 native single: callback throw propagates same object and cleans up',()=>{
  const source=new Subject(),boom={exact:'predicate'};
  const x=observed(source.pipe(single(()=>{throw boom;})));
  source.next(1);
  assert.equal(x.events[0].error,boom);
  assert.equal(source.observers.length,0);
});
test('S19 native single: source error is not converted to EmptyError or NotFoundError',()=>{
  const e={source:1},x=observed(throwError(()=>e).pipe(single(x=>!!x)));
  assert.equal(x.events[0].error,e);
});
test('S19 native single: cancellation discards candidate silently',()=>{
  const source=new Subject(),x=observed(source.pipe(single()));
  source.next(1);x.subscription.unsubscribe();source.complete();
  assert.deepEqual(x.events,[]);
  assert.equal(source.observers.length,0);
});

test('S19 native skipLast: output delayed by count of subsequent values, not by time',()=>{
  const source=new Subject(),x=observed(source.pipe(skipLast(2)));
  source.next('a');source.next('b');
  assert.deepEqual(x.events,[]);
  source.next('c');
  assert.deepEqual(x.events,[{kind:'N',value:'a'}]);
  source.next('d');source.complete();
  assert.deepEqual(x.events,[{kind:'N',value:'a'},{kind:'N',value:'b'},{kind:'C'}]);
});
test('S19 native skipLast: suffix longer than finite source means no emitted values',()=>{
  assert.deepEqual(observed(of(1,2).pipe(skipLast(3))).events,[{kind:'C'}]);
});
test('S19 native skipLast: count zero and negative values mirror source in pinned RxJS',()=>{
  assert.deepEqual(observed(of(1,2).pipe(skipLast(0))).events,
    [{kind:'N',value:1},{kind:'N',value:2},{kind:'C'}]);
  assert.deepEqual(observed(of(1).pipe(skipLast(-1))).events,
    [{kind:'N',value:1},{kind:'C'}]);
});
test('S19 native skipLast: retained references remain unchanged and preserve ordering',()=>{
  const a={id:'a'},b={id:'b'},c={id:'c'};
  const x=observed(of(a,b,c).pipe(skipLast(1)));
  assert.equal(x.events[0].value,a);
  assert.equal(x.events[1].value,b);
});
test('S19 native skipLast: source errors discard retained suffix and keep error identity',()=>{
  const source=new Subject(),boom={source:'failed'},x=observed(source.pipe(skipLast(3)));
  source.next(1);source.error(boom);
  assert.deepEqual(x.events,[{kind:'E',error:boom}]);
});
test('S19 native skipLast: early cancellation does not flush ring',()=>{
  const source=new Subject(),x=observed(source.pipe(skipLast(2)));
  source.next(1);source.next(2);x.subscription.unsubscribe();
  assert.deepEqual(x.events,[]);
  assert.equal(source.observers.length,0);
});
test('S19 native skipLast: callback teardown after forwarded next does not leak trailing item',()=>{
  const source=new Subject(),teardowns=[];
  const x=observed(source.pipe(skipLast(1),finalize(()=>teardowns.push('released'))));
  source.next(1);source.next(2);x.subscription.unsubscribe();
  assert.deepEqual(x.events,[{kind:'N',value:1}]);
  assert.deepEqual(teardowns,['released']);
});

test('S19 native subscribeOn: source connection is delayed, next remains synchronous within scheduled connection',()=>{
  const scheduler=new TestScheduler(()=>{}),acquired=[],x=[];
  const source=new Observable(sub=>{
    acquired.push(scheduler.now());
    sub.next(7);sub.complete();
  });
  const subscription=source.pipe(subscribeOn(scheduler,3)).subscribe({
    next:value=>x.push(['N',value,scheduler.now()]),
    complete:()=>x.push(['C',scheduler.now()])
  });
  assert.deepEqual(acquired,[]);
  scheduler.flush();
  assert.deepEqual(acquired,[3]);
  assert.deepEqual(x,[['N',7,3],['C',3]]);
  assert.equal(subscription.closed,true);
});
test('S19 native subscribeOn: cancellation before schedule due prevents producer execution',()=>{
  const scheduler=new TestScheduler(()=>{}),acquired=[];
  const source=new Observable(()=>{acquired.push(scheduler.now());});
  const x=source.pipe(subscribeOn(scheduler,4)).subscribe(()=>{});
  x.unsubscribe();scheduler.flush();
  assert.deepEqual(acquired,[]);
});
test('S19 native subscribeOn: cancellation after scheduled connection closes underlying resource',()=>{
  const scheduler=new TestScheduler(()=>{}),teardown=[];
  const source=new Observable(()=>()=>teardown.push('closed'));
  const sub=source.pipe(subscribeOn(scheduler,2)).subscribe(()=>{});
  scheduler.flush();
  assert.deepEqual(teardown,[]);
  sub.unsubscribe();
  assert.deepEqual(teardown,['closed']);
});
test('S19 native subscribeOn: source error keeps identity after deferred acquisition',()=>{
  const scheduler=new TestScheduler(()=>{}),boom={id:'error'};
  const x=observed(throwError(()=>boom).pipe(subscribeOn(scheduler,1)));
  assert.deepEqual(x.events,[]);
  scheduler.flush();
  assert.equal(x.events[0].error,boom);
});
test('S19 native subscribeOn: delayed source subscription versus direct source order',()=>{
  const scheduler=new TestScheduler(()=>{}),order=[];
  of('deferred').pipe(subscribeOn(scheduler,2)).subscribe(v=>order.push(v));
  of('direct').subscribe(v=>order.push(v));
  assert.deepEqual(order,['direct']);
  scheduler.flush();
  assert.deepEqual(order,['direct','deferred']);
});
test('S19 native subscribeOn: zero delay is still deferred under TestScheduler',()=>{
  const scheduler=new TestScheduler(()=>{}),order=[];
  of(1).pipe(subscribeOn(scheduler,0)).subscribe(()=>order.push('scheduled'));
  order.push('after-subscribe');
  scheduler.flush();
  assert.deepEqual(order,['after-subscribe','scheduled']);
});

test('S19 native switchMapTo: outer values repeatedly subscribe to same configured Observable object',()=>{
  const outer=new Subject(),inner=new Subject(),x=observed(outer.pipe(switchMapTo(inner)));
  outer.next(1);
  assert.equal(inner.observers.length,1);
  inner.next('a');
  outer.next(2);
  assert.equal(inner.observers.length,1);
  inner.next('b');outer.complete();
  assert.deepEqual(x.events,[{kind:'N',value:'a'},{kind:'N',value:'b'}]);
  inner.complete();
  assert.deepEqual(x.events,[{kind:'N',value:'a'},{kind:'N',value:'b'},{kind:'C'}]);
});
test('S19 native switchMapTo: replacement unsubscribes prior cold occurrence before acquiring new one',()=>{
  const outer=new Subject(),work=[],instances=[];
  const inner=new Observable(sub=>{
    const id=instances.length;instances.push(sub);work.push('sub'+id);
    return ()=>work.push('unsub'+id);
  });
  const x=observed(outer.pipe(switchMapTo(inner)));
  outer.next(1);
  outer.next(2);
  assert.deepEqual(work,['sub0','unsub0','sub1']);
  instances[0].next('stale');
  instances[1].next('new');
  assert.deepEqual(x.events,[{kind:'N',value:'new'}]);
  x.subscription.unsubscribe();
  assert.deepEqual(work,['sub0','unsub0','sub1','unsub1']);
});
test('S19 native switchMapTo: outer complete waits for active inner and early cancellation is silent',()=>{
  const outer=new Subject(),inner=new Subject(),x=observed(outer.pipe(switchMapTo(inner)));
  outer.next('go');outer.complete();
  assert.deepEqual(x.events,[]);
  inner.next('pending');inner.complete();
  assert.deepEqual(x.events,[{kind:'N',value:'pending'},{kind:'C'}]);
  const o2=new Subject(),i2=new Subject(),cancelled=observed(o2.pipe(switchMapTo(i2)));
  o2.next('work');cancelled.subscription.unsubscribe();
  assert.deepEqual(cancelled.events,[]);
  assert.equal(i2.observers.length,0);
});
test('S19 native switchMapTo: outer errors dispose current inner with exact error',()=>{
  const outer=new Subject(),inner=new Subject(),boom={reason:'outer'};
  const x=observed(outer.pipe(switchMapTo(inner)));
  outer.next(1);outer.error(boom);
  assert.equal(x.events[0].error,boom);
  assert.equal(inner.observers.length,0);
});
test('S19 native switchMapTo: a cold constant Observable restarts from beginning on every source next',()=>{
  const outer=new Subject(),x=observed(outer.pipe(switchMapTo(of(1,2))));
  outer.next(9);outer.next(10);outer.complete();
  assert.deepEqual(x.events,[
    {kind:'N',value:1},{kind:'N',value:2},
    {kind:'N',value:1},{kind:'N',value:2},{kind:'C'}
  ]);
});

test('S19 native switchScan: next projection sees latest inner value as accumulator',()=>{
  const outer=new Subject(),inners=[],calls=[];
  const x=observed(outer.pipe(switchScan((acc,value,index)=>{
    calls.push([acc,value,index]);
    const inner=new Subject();inners.push(inner);return inner;
  },10)));
  outer.next(1);
  inners[0].next(15);
  outer.next(2);
  assert.deepEqual(calls,[[10,1,0],[15,2,1]]);
  assert.equal(inners[0].observers.length,0);
  inners[0].next(999);
  inners[1].next(20);
  outer.complete();inners[1].complete();
  assert.deepEqual(x.events,[{kind:'N',value:15},{kind:'N',value:20},{kind:'C'}]);
});
test('S19 native switchScan: synchronous finite inner values accumulate serially',()=>{
  const x=observed(of(1,2,3).pipe(switchScan((acc,value)=>of(acc+value),0)));
  assert.deepEqual(x.events,[
    {kind:'N',value:1},{kind:'N',value:3},{kind:'N',value:6},{kind:'C'}
  ]);
});
test('S19 native switchScan: unproductive inner leaves seed unchanged for next projection',()=>{
  const outer=new Subject(),first=new Subject(),second=new Subject(),accs=[];
  const x=observed(outer.pipe(switchScan((acc,value)=>{
    accs.push([acc,value]);return accs.length===1?first:second;
  },5)));
  outer.next(1);outer.next(2);
  assert.deepEqual(accs,[[5,1],[5,2]]);
  second.next(7);second.complete();outer.complete();
  assert.deepEqual(x.events,[{kind:'N',value:7},{kind:'C'}]);
});
test('S19 native switchScan: outer completion waits for latest active inner',()=>{
  const outer=new Subject(),inner=new Subject();
  const x=observed(outer.pipe(switchScan(()=>inner,0)));
  outer.next(1);outer.complete();
  assert.deepEqual(x.events,[]);
  inner.next(8);assert.deepEqual(x.events,[{kind:'N',value:8}]);
  inner.complete();assert.deepEqual(x.events,[{kind:'N',value:8},{kind:'C'}]);
});
test('S19 native switchScan: source error tears down inner, retaining exact identity',()=>{
  const outer=new Subject(),inner=new Subject(),boom={error:'upstream'};
  const x=observed(outer.pipe(switchScan(()=>inner,0)));
  outer.next(1);outer.error(boom);
  assert.equal(x.events[0].error,boom);
  assert.equal(inner.observers.length,0);
});
test('S19 native switchScan: throwing accumulator error is not converted to a value',()=>{
  const outer=new Subject(),boom={callback:true};
  const x=observed(outer.pipe(switchScan(()=>{throw boom;},0)));
  outer.next(1);
  assert.equal(x.events[0].error,boom);
  assert.equal(outer.observers.length,0);
});
test('S19 native switchScan: cancellation disposes current inner silently',()=>{
  const outer=new Subject(),inner=new Subject();
  const x=observed(outer.pipe(switchScan(()=>inner,0)));
  outer.next(1);x.subscription.unsubscribe();
  assert.deepEqual(x.events,[]);
  assert.equal(inner.observers.length,0);
});
