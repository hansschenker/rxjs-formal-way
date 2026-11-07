import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Observable, Subject, of, EMPTY, throwError, defer, merge, connect,
  debounce, defaultIfEmpty, delay, delayWhen, take, finalize
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

const collect = observable => {
  const events=[];
  const subscription=observable.subscribe({
    next:value=>events.push({kind:'N',value}),
    error:error=>events.push({kind:'E',error}),
    complete:()=>events.push({kind:'C'}),
  });
  return {events,subscription};
};
test('S10-NATIVE CONNECT: synchronous source connects only after both shared branches',()=>{
  let starts=0;
  const observed=collect(defer(()=>{starts++;return of(1,2,3);}).pipe(
    connect(shared=>merge(shared,shared))));
  assert.equal(starts,1);
  assert.deepEqual(observed.events,[1,1,2,2,3,3].map(value=>({kind:'N',value})).concat({kind:'C'}));
});
test('S10-NATIVE CONNECT: each outer subscription creates a fresh shared Subject and source connection',()=>{
  let starts=0;
  const result=defer(()=>{starts++;return of('a','b');}).pipe(connect(shared=>merge(shared,shared)));
  assert.deepEqual(collect(result).events.slice(0,4).map(x=>x.value),['a','a','b','b']);
  assert.deepEqual(collect(result).events.slice(0,4).map(x=>x.value),['a','a','b','b']);
  assert.equal(starts,2);
});
test('S10-NATIVE CONNECT: cancel disconnects the one producer, not two independent producers',()=>{
  let subscribed=0,unsubscribed=0;
  const producer=new Subject();
  const source=new Observable(sub=>{subscribed++;const inner=producer.subscribe(sub);
    return ()=>{unsubscribed++;inner.unsubscribe();};});
  const {events,subscription}=collect(source.pipe(connect(shared=>merge(shared,shared))));
  producer.next({x:1});
  assert.equal(events.length,2);
  assert.strictEqual(events[0].value,events[1].value);
  subscription.unsubscribe();
  producer.next('ignored');
  assert.equal(events.length,2);
  assert.equal(subscribed,1);
  assert.equal(unsubscribed,1);
});
test('S10-NATIVE CONNECT: source error is delivered once; selector exception prevents producer connection',()=>{
  const failure={kind:'failure'};
  const sourceError=collect(throwError(()=>failure).pipe(connect(shared=>merge(shared,shared))));
  assert.strictEqual(sourceError.events[0].error,failure);
  assert.equal(sourceError.events.length,1);
  let starts=0;
  const source=defer(()=>{starts++;return of(1);});
  const output=collect(source.pipe(connect(()=>{throw failure;})));
  assert.strictEqual(output.events[0].error,failure);
  assert.equal(starts,0);
});
test('S10-NATIVE DEBOUNCE: replacement drops first; duration next emits latest only',()=>{
  const outer=new Subject(),durations=[];
  const output=collect(outer.pipe(debounce(()=>{const d=new Subject();durations.push(d);return d;})));
  outer.next('first');outer.next('second');
  durations[0].next(1);
  assert.deepEqual(output.events,[]);
  durations[1].next(1);
  assert.deepEqual(output.events,[{kind:'N',value:'second'}]);
  outer.complete();
  assert.deepEqual(output.events,[{kind:'N',value:'second'},{kind:'C'}]);
});
test('S10-NATIVE DEBOUNCE: empty duration does not flush, but original completion does',()=>{
  const source=new Subject(),duration=new Subject(),out=collect(source.pipe(debounce(()=>duration)));
  source.next(undefined);duration.complete();
  assert.deepEqual(out.events,[]);
  source.complete();
  assert.deepEqual(out.events,[{kind:'N',value:undefined},{kind:'C'}]);
});
test('S10-NATIVE DEBOUNCE: duration errors and selector throws discard pending value',()=>{
  const err={id:'same'};
  const source=new Subject(),d=new Subject();
  const out=collect(source.pipe(debounce(()=>d)));
  source.next('a');d.error(err);
  assert.deepEqual(out.events,[{kind:'E',error:err}]);
  const thrown=collect(of('x').pipe(debounce(()=>{throw err;})));
  assert.strictEqual(thrown.events[0].error,err);
});
test('S10-NATIVE DEBOUNCE: downstream cancellation tears down active duration without completion',()=>{
  const source=new Subject();
  let disposed=0;
  const out=collect(source.pipe(debounce(()=>new Observable(()=>()=>{disposed++;}))));
  source.next('x');out.subscription.unsubscribe();
  source.next('y');
  assert.equal(disposed,1);
  assert.deepEqual(out.events,[]);
});
test('S10-NATIVE DEFAULT: successful empty source emits one fallback then completes',()=>{
  assert.deepEqual(collect(EMPTY.pipe(defaultIfEmpty('fallback'))).events,
    [{kind:'N',value:'fallback'},{kind:'C'}]);
});
test('S10-NATIVE DEFAULT: undefined/null and repeated values suppress fallback',()=>{
  const obj=Object.freeze({x:3});
  const seen=collect(of(undefined,null,obj,obj).pipe(defaultIfEmpty('fallback'))).events;
  assert.deepEqual(seen.slice(0,-1).map(x=>x.value),[undefined,null,obj,obj]);
  assert.strictEqual(seen[2].value,obj);
  assert.strictEqual(seen[3].value,obj);
});
test('S10-NATIVE DEFAULT: source error and early cancellation do not emit fallback',()=>{
  const err=Symbol('failure');
  assert.deepEqual(collect(throwError(()=>err).pipe(defaultIfEmpty('f'))).events,[{kind:'E',error:err}]);
  const source=new Subject(),out=collect(source.pipe(defaultIfEmpty('f')));
  out.subscription.unsubscribe();source.complete();
  assert.deepEqual(out.events,[]);
});
test('S10-NATIVE DELAY: scheduler owns time, source completion waits for both timers',()=>{
  const scheduler=new TestScheduler(()=>{});
  const events=[];
  const src=new Observable(sub=>{
    scheduler.schedule(()=>sub.next('a'),1);
    scheduler.schedule(()=>sub.next('b'),2);
    scheduler.schedule(()=>sub.complete(),3);
  });
  src.pipe(delay(3,scheduler)).subscribe({
    next:value=>events.push({frame:scheduler.frame,kind:'N',value}),
    complete:()=>events.push({frame:scheduler.frame,kind:'C'}),
  });
  scheduler.flush();
  assert.deepEqual(events,[
    {frame:4,kind:'N',value:'a'},
    {frame:5,kind:'N',value:'b'},
    {frame:5,kind:'C'},
  ]);
});
test('S10-NATIVE DELAY: error bypasses waiting items and frees timers',()=>{
  const scheduler=new TestScheduler(()=>{});
  const err={e:true},seen=[];
  const src=new Observable(sub=>{
    scheduler.schedule(()=>sub.next('a'),1);
    scheduler.schedule(()=>sub.error(err),2);
  });
  src.pipe(delay(4,scheduler)).subscribe({
    next:value=>seen.push({frame:scheduler.frame,value}),
    error:e=>seen.push({frame:scheduler.frame,error:e}),
  });
  scheduler.flush();
  assert.deepEqual(seen,[{frame:2,error:err}]);
});
test('S10-NATIVE DELAY: independent values preserve object identity after scheduling',()=>{
  const scheduler=new TestScheduler(()=>{});
  const token=Object.freeze({n:1});const seen=[];
  of(token,token).pipe(delay(2,scheduler)).subscribe(value=>seen.push(value));
  scheduler.flush();
  assert.equal(seen.length,2);assert.strictEqual(seen[0],token);assert.strictEqual(seen[1],token);
});
test('S10-NATIVE DELAYWHEN: two overlapping durations can release out of source order',()=>{
  const source=new Subject(),inners=[];
  const out=collect(source.pipe(delayWhen(v=>{const s=new Subject();inners.push({v,s});return s;})));
  const a={id:'a'},b={id:'b'};
  source.next(a);source.next(b);source.complete();
  assert.deepEqual(out.events,[]);
  inners[1].s.next('signal');
  assert.deepEqual(out.events,[{kind:'N',value:b}]);
  inners[0].s.next('signal');
  assert.deepEqual(out.events,[{kind:'N',value:b},{kind:'N',value:a},{kind:'C'}]);
});
test('S10-NATIVE DELAYWHEN: empty duration drops payload, not a completion flush',()=>{
  const outer=new Subject(),inner=new Subject();
  const out=collect(outer.pipe(delayWhen(()=>inner)));
  outer.next('lost');outer.complete();
  assert.deepEqual(out.events,[]);
  inner.complete();
  assert.deepEqual(out.events,[{kind:'C'}]);
});
test('S10-NATIVE DELAYWHEN: failed duration cancels all others with same error identity',()=>{
  const src=new Subject(),duration1=new Subject(),duration2=new Subject();
  let disposed=0,idx=0;
  const out=collect(src.pipe(delayWhen(()=>{
    const current=idx++===0?duration1:duration2;
    return current.pipe(finalize(()=>{disposed++;}));
  })));
  const err={fail:'duration'};
  src.next('a');src.next('b');duration1.error(err);duration2.next('too late');
  assert.deepEqual(out.events,[{kind:'E',error:err}]);
  assert.equal(disposed,2);
});
test('S10-NATIVE DELAYWHEN: selector throws, and cancellation is silent',()=>{
  const err=42;
  assert.deepEqual(collect(of(1).pipe(delayWhen(()=>{throw err;}))).events,[{kind:'E',error:42}]);
  const src=new Subject(),duration=new Subject();
  let releases=0;
  const out=collect(src.pipe(delayWhen(()=>duration.pipe(finalize(()=>{releases++;})))));
  src.next('x');out.subscription.unsubscribe();duration.next(1);
  assert.equal(releases,1);
  assert.deepEqual(out.events,[]);
});
test('S10-NATIVE DELAYWHEN: observer has no selector calls for empty source',()=>{
  let called=0;
  const out=collect(EMPTY.pipe(delayWhen(()=>{called++;return of(1);})));
  assert.equal(called,0);assert.deepEqual(out.events,[{kind:'C'}]);
});
