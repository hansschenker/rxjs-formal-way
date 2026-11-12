import test from 'node:test';
import assert from 'node:assert/strict';
import { Subject, Observable, of, EMPTY, throwError, defer, merge as mergeCreation, asyncScheduler } from 'rxjs';
import { mergeWith, multicast, observeOn, onErrorResumeNext, partition } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
const collect=stream=>{
 const events=[];const subscription=stream.subscribe({
  next:value=>events.push({kind:'N',value}),
  complete:()=>events.push({kind:'C'}),
  error:error=>events.push({kind:'E',error}),
 });
 return {events,subscription};
};
const values=out=>out.events.filter(e=>e.kind==='N').map(e=>e.value);

test('S15 NATIVE mergeWith: source and others forward interleaved values in arrival order',()=>{
 const a=new Subject(),b=new Subject(),c=new Subject();
 const out=collect(a.pipe(mergeWith(b,c)));
 b.next('B');a.next('A');c.next('C');a.complete();b.complete();
 assert.deepEqual(values(out),['B','A','C']);
 assert.equal(out.events.at(-1).kind,'N');
 c.complete();assert.equal(out.events.at(-1).kind,'C');
});
test('S15 NATIVE mergeWith: source is subscribed first, even when inputs are synchronous',()=>{
 const order=[];
 const source=name=>defer(()=>{order.push(name);return of(name)});
 const out=collect(source('source').pipe(mergeWith(source('second'),source('third'))));
 assert.deepEqual(order,['source','second','third']);
 assert.deepEqual(values(out),order);
});
test('S15 NATIVE mergeWith: error identity, cancellation and no implicit sharing',()=>{
 const a=new Subject(),b=new Subject(),err=Object.freeze({problem:1});
 const out=collect(a.pipe(mergeWith(b)));b.error(err);
 assert.strictEqual(out.events[0].error,err);
 assert.equal(a.observed,false);
 const x=new Subject(),y=new Subject(),cancel=collect(x.pipe(mergeWith(y)));
 x.next(1);cancel.subscription.unsubscribe();y.next(2);
 assert.deepEqual(values(cancel),[1]);assert.equal(x.observed,false);assert.equal(y.observed,false);
});
test('S15 NATIVE mergeWith: empty additional sources is source passthrough',()=>{
 assert.deepEqual(collect(of(1,2).pipe(mergeWith())).events,
  [{kind:'N',value:1},{kind:'N',value:2},{kind:'C'}]);
});

test('S15 NATIVE multicast: factory selector installs two branches before one synchronous source',()=>{
 let acquisitions=0;
 const input=defer(()=>{acquisitions++;return of('a','b')});
 const out=collect(input.pipe(multicast(()=>new Subject(),shared=>mergeCreation(shared,shared))));
 assert.equal(acquisitions,1);
 assert.deepEqual(values(out),['a','a','b','b']);
 assert.equal(out.events.at(-1).kind,'C');
});
test('S15 NATIVE multicast: each selected-result subscription has its own Subject and source subscription',()=>{
 let acquisitions=0;
 const input=defer(()=>{acquisitions++;return of(1)});
 const selected=input.pipe(multicast(()=>new Subject(),shared=>mergeCreation(shared,shared)));
 assert.deepEqual(values(collect(selected)),[1,1]);
 assert.deepEqual(values(collect(selected)),[1,1]);
 assert.equal(acquisitions,2);
});
test('S15 NATIVE multicast: factory selector forwards source failure to selected branches',()=>{
 const input=new Subject(),err={code:'source'};
 const out=collect(input.pipe(multicast(()=>new Subject(),shared=>mergeCreation(shared,shared))));
 input.next(7);input.error(err);
 assert.deepEqual(values(out),[7,7]);
 assert.strictEqual(out.events.at(-1).error,err);
 assert.equal(input.observed,false);
});
test('S15 NATIVE multicast: downstream unsubscribe tears down shared source',()=>{
 const source=new Subject();
 const out=collect(source.pipe(multicast(()=>new Subject(),shared=>mergeCreation(shared,shared))));
 source.next(1);out.subscription.unsubscribe();source.next(2);
 assert.deepEqual(values(out),[1,1]);
 assert.equal(source.observed,false);
});

test('S15 NATIVE observeOn: a virtual scheduler shifts source next and complete by delay',()=>{
 const scheduler=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
 scheduler.run(({cold,expectObservable})=>{
  expectObservable(cold('--a-b-|').pipe(observeOn(scheduler,3))).toBe('-----a-b-|');
 });
});
test('S15 NATIVE observeOn: error is scheduled, not delivered immediately',()=>{
 const err=Object.freeze({code:'e'});
 const scheduler=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
 scheduler.run(({cold,expectObservable})=>{
  expectObservable(cold('--a-#',{a:'x'},err).pipe(observeOn(scheduler,3)))
   .toBe('-----a-#',{a:'x'},err);
 });
});
test('S15 NATIVE observeOn: cancellation before scheduled delivery prevents all notifications',()=>{
 const scheduler=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
 scheduler.run(({cold,expectObservable})=>{
  expectObservable(cold('--a-b-|').pipe(observeOn(scheduler,5)),'----!').toBe('----');
 });
});
test('S15 NATIVE observeOn: source scheduler unchanged and scheduler actions own delay',()=>{
 const frames=[];
 const scheduler=new TestScheduler(()=>{});
 scheduler.schedule(()=>frames.push('external'),1);
 scheduler.schedule(()=>{
  of(1).pipe(observeOn(scheduler,3)).subscribe({
   next:()=>frames.push('N'),complete:()=>frames.push('C'),
  });
 },2);
 scheduler.flush();
 assert.deepEqual(frames,['external','N','C']);
});

test('S15 NATIVE onErrorResumeNext: completes normally through failed and empty sources',()=>{
 const err=Symbol('ignored');
 const out=collect(of(1,2).pipe(onErrorResumeNext(throwError(()=>err),EMPTY,of(3))));
 assert.deepEqual(out.events,[{kind:'N',value:1},{kind:'N',value:2},{kind:'N',value:3},{kind:'C'}]);
});
test('S15 NATIVE onErrorResumeNext: last source error also becomes normal completion',()=>{
 const out=collect(throwError(()=>new Error('first')).pipe(
  onErrorResumeNext(throwError(()=>new Error('last')))));
 assert.deepEqual(out.events,[{kind:'C'}]);
});
test('S15 NATIVE onErrorResumeNext: only one subscription active at a time',()=>{
 const first=new Subject(),second=new Subject();
 const out=collect(first.pipe(onErrorResumeNext(second)));
 assert.equal(first.observed,true);assert.equal(second.observed,false);
 first.error('ignored');assert.equal(first.observed,false);assert.equal(second.observed,true);
 second.next('second');second.complete();
 assert.deepEqual(out.events,[{kind:'N',value:'second'},{kind:'C'}]);
});
test('S15 NATIVE onErrorResumeNext: cancellation prevents subscription to later sources',()=>{
 const first=new Subject(),second=new Subject();
 const out=collect(first.pipe(onErrorResumeNext(second)));
 out.subscription.unsubscribe();first.error('late');
 assert.equal(first.observed,false);assert.equal(second.observed,false);assert.deepEqual(out.events,[]);
});
test('S15 NATIVE onErrorResumeNext: deprecated operator alias is the pipeable with variant',async()=>{
 const { onErrorResumeNextWith }=await import('rxjs');
 assert.strictEqual(onErrorResumeNext,onErrorResumeNextWith);
});

test('S15 NATIVE partition: two separate cold subscriptions and independent zero-based indices',()=>{
 let acquisitions=0;
 const seen=[];
 const source=defer(()=>{acquisitions++;return of(1,2,3,4)});
 const [pass,fail]=partition((v,i)=>{seen.push([v,i]);return v%2===0;})(source);
 assert.deepEqual(values(collect(pass)),[2,4]);
 assert.deepEqual(values(collect(fail)),[1,3]);
 assert.equal(acquisitions,2);
 assert.deepEqual(seen,[[1,0],[2,1],[3,2],[4,3],[1,0],[2,1],[3,2],[4,3]]);
});
test('S15 NATIVE partition: source error forwarded independently to both active output subscriptions',()=>{
 const src=new Subject(),err=Object.freeze({boom:1});
 const [pass,fail]=partition(v=>v%2===0)(src);
 const a=collect(pass),b=collect(fail);src.next(2);src.error(err);
 assert.deepEqual(values(a),[2]);assert.deepEqual(values(b),[]);
 assert.strictEqual(a.events.at(-1).error,err);
 assert.strictEqual(b.events.at(-1).error,err);
});
test('S15 NATIVE partition: cancelling one branch leaves other source subscription live',()=>{
 const src=new Subject(),[pass,fail]=partition(v=>v%2===0)(src);
 const a=collect(pass),b=collect(fail);
 assert.equal(src.observers.length,2);a.subscription.unsubscribe();
 assert.equal(src.observers.length,1);src.next(1);src.next(2);src.complete();
 assert.deepEqual(values(a),[]);
 assert.deepEqual(b.events,[{kind:'N',value:1},{kind:'C'}]);
});
test('S15 NATIVE partition: predicate failure affects only its own branch invocation',()=>{
 const src=new Subject();
 const err=Object.freeze({kind:'throw'});
 let count=0;
 const [pass,fail]=partition(v=>{count++;if(v===2)throw err;return v>0;})(src);
 const a=collect(pass),b=collect(fail);src.next(1);src.next(2);
 assert.strictEqual(a.events.at(-1).error,err);
 assert.strictEqual(b.events.at(-1).error,err);
 assert.equal(count,4);
 assert.equal(src.observed,false);
});
