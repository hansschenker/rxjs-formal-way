import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, of, EMPTY, throwError, takeLast, tap, throttle, throttleTime,
  throwIfEmpty, finalize } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

const observe=stream=>{
  const events=[];
  const subscription=stream.subscribe({
    next:value=>events.push({kind:'N',value}),
    error:error=>events.push({kind:'E',error}),
    complete:()=>events.push({kind:'C'})
  });
  return {events,subscription};
};
const n=value=>({kind:'N',value}),c={kind:'C'};

test('S20 native takeLast: emits nothing before completion then final FIFO in source order',()=>{
  const source=new Subject(),x=observe(source.pipe(takeLast(2)));
  source.next('a');source.next('b');source.next('c');
  assert.deepEqual(x.events,[]);
  source.complete();
  assert.deepEqual(x.events,[n('b'),n('c'),c]);
});
test('S20 native takeLast: count exceeds source cardinality, preserves every original object reference',()=>{
  const a={id:1},b={id:2},x=observe(of(a,b).pipe(takeLast(5)));
  assert.deepEqual(x.events,[n(a),n(b),c]);
  assert.equal(x.events[0].value,a);
  assert.equal(x.events[1].value,b);
});
test('S20 native takeLast: count zero does not subscribe to source at all',()=>{
  const acquired=[];
  const source=new Observable(sub=>{acquired.push('subscribed');sub.next(1);sub.complete();});
  const x=observe(source.pipe(takeLast(0)));
  assert.deepEqual(x.events,[c]);
  assert.deepEqual(acquired,[]);
});
test('S20 native takeLast: empty source simply completes',()=>{
  assert.deepEqual(observe(EMPTY.pipe(takeLast(3))).events,[c]);
});
test('S20 native takeLast: error identity preserved, buffered values never emitted',()=>{
  const source=new Subject(),error={source:'failed'},x=observe(source.pipe(takeLast(2)));
  source.next(1);source.next(2);source.error(error);
  assert.deepEqual(x.events,[{kind:'E',error}]);
});
test('S20 native takeLast: cancellation discards retained values and releases upstream',()=>{
  const source=new Subject(),released=[];
  const x=observe(source.pipe(takeLast(2),finalize(()=>released.push('done'))));
  source.next(1);source.next(2);x.subscription.unsubscribe();
  assert.deepEqual(x.events,[]);
  assert.equal(source.observers.length,0);
  assert.deepEqual(released,['done']);
});
test('S20 native takeLast: undefined is a real retained payload',()=>{
  assert.deepEqual(observe(of(undefined,2).pipe(takeLast(2))).events,[n(undefined),n(2),c]);
});

test('S20 native tap: next handler executes before unmodified downstream value',()=>{
  const order=[],value={id:7};
  const x=observe(of(value).pipe(tap(v=>{order.push('tap');assert.equal(v,value);} ),
    tap(v=>order.push('second'))));
  assert.deepEqual(order,['tap','second']);
  assert.equal(x.events[0].value,value);
  assert.deepEqual(x.events.slice(1),[c]);
});
test('S20 native tap: handler throw preserves exact error and stops source',()=>{
  const boom={handler:1},produced=[];
  const source=new Observable(sub=>{
    for(const v of [1,2,3]){if(sub.closed)break;produced.push(v);sub.next(v);}
    if(!sub.closed)sub.complete();
  });
  const x=observe(source.pipe(tap(v=>{if(v===2)throw boom;})));
  assert.deepEqual(x.events,[n(1),{kind:'E',error:boom}]);
  assert.deepEqual(produced,[1,2]);
});
test('S20 native tap: source error identity and terminal protocol unaffected by next-only handler',()=>{
  const boom={source:'bad'},seen=[];
  const x=observe(throwError(()=>boom).pipe(tap(v=>seen.push(v))));
  assert.deepEqual(x.events,[{kind:'E',error:boom}]);
  assert.deepEqual(seen,[]);
});
test('S20 native tap: no handler is identity',()=>{
  const value={same:true},x=observe(of(value).pipe(tap()));
  assert.equal(x.events[0].value,value);
  assert.deepEqual(x.events.slice(1),[c]);
});
test('S20 native tap: explicit unsubscribe releases source without complete',()=>{
  const source=new Subject(),calls=[],x=observe(source.pipe(tap(v=>calls.push(v))));
  source.next('one');x.subscription.unsubscribe();
  source.next('after');
  assert.deepEqual(x.events,[n('one')]);
  assert.deepEqual(calls,['one']);
  assert.equal(source.observers.length,0);
});
test('S20 native tap: next handler observes undefined without modifying payload',()=>{
  const calls=[],x=observe(of(undefined).pipe(tap(x=>calls.push(x))));
  assert.deepEqual(calls,[undefined]);
  assert.deepEqual(x.events,[n(undefined),c]);
});

test('S20 native throwIfEmpty: empty source signals an EmptyError on completion',()=>{
  const x=observe(EMPTY.pipe(throwIfEmpty()));
  assert.equal(x.events.length,1);
  assert.equal(x.events[0].kind,'E');
  assert.equal(x.events[0].error.name,'EmptyError');
});
test('S20 native throwIfEmpty: real undefined value prevents empty error',()=>{
  assert.deepEqual(observe(of(undefined).pipe(throwIfEmpty())).events,[n(undefined),c]);
});
test('S20 native throwIfEmpty: custom error factory runs only on empty successful completion',()=>{
  const calls=[],boom={custom:true},x=observe(EMPTY.pipe(throwIfEmpty(()=>{calls.push('factory');return boom;})));
  assert.deepEqual(calls,['factory']);
  assert.deepEqual(x.events,[{kind:'E',error:boom}]);
  const second=observe(of(1).pipe(throwIfEmpty(()=>{calls.push('unexpected');return boom;})));
  assert.deepEqual(second.events,[n(1),c]);
  assert.deepEqual(calls,['factory']);
});
test('S20 native throwIfEmpty: a throwing factory propagates the thrown object exactly',()=>{
  const boom={throw:true},x=observe(EMPTY.pipe(throwIfEmpty(()=>{throw boom;})));
  assert.deepEqual(x.events,[{kind:'E',error:boom}]);
});
test('S20 native throwIfEmpty: original source error does not invoke error factory',()=>{
  const original={id:'source'},calls=[];
  const x=observe(throwError(()=>original).pipe(throwIfEmpty(()=>{calls.push(1);return Error('wrong');})));
  assert.deepEqual(x.events,[{kind:'E',error:original}]);
  assert.deepEqual(calls,[]);
});
test('S20 native throwIfEmpty: downstream cancellation before completion does not invoke factory',()=>{
  const source=new Subject(),calls=[],x=observe(source.pipe(throwIfEmpty(()=>{calls.push('factory');return Error();})));
  x.subscription.unsubscribe();source.complete();
  assert.deepEqual(calls,[]);
  assert.deepEqual(x.events,[]);
});

test('S20 native throttle: leading-only holds off values until duration next, not duration complete',()=>{
  const source=new Subject(),durations=[];
  const x=observe(source.pipe(throttle(()=>{const d=new Subject();durations.push(d);return d;})));
  source.next('a');source.next('b');
  assert.deepEqual(x.events,[n('a')]);
  durations[0].next(1);
  source.next('c');source.complete();
  assert.deepEqual(x.events,[n('a'),n('c'),c]);
  assert.equal(durations.length,2);
});
test('S20 native throttle: leading+trailing sends latest value, starts a new duration',()=>{
  const source=new Subject(),durations=[];
  const x=observe(source.pipe(throttle(()=>{
    const d=new Subject();durations.push(d);return d;
  },{leading:true,trailing:true})));
  source.next('A');source.next('B');source.next('C');
  assert.deepEqual(x.events,[n('A')]);
  durations[0].next(1);
  assert.deepEqual(x.events,[n('A'),n('C')]);
  assert.equal(durations.length,2);
  source.complete();
  assert.deepEqual(x.events,[n('A'),n('C'),c]);
});
test('S20 native throttle: no leading, trailing sends latest candidate on notifier next',()=>{
  const source=new Subject(),durations=[];
  const x=observe(source.pipe(throttle(()=>{
    const d=new Subject();durations.push(d);return d;
  },{leading:false,trailing:true})));
  source.next('a');source.next('b');
  assert.deepEqual(x.events,[]);
  durations[0].next('release');
  assert.deepEqual(x.events,[n('b')]);
  source.complete();
  assert.deepEqual(x.events,[n('b'),c]);
});
test('S20 native throttle: completion waits for pending trailing candidate',()=>{
  const source=new Subject(),duration=new Subject();
  const x=observe(source.pipe(throttle(()=>duration,{leading:true,trailing:true})));
  source.next('a');source.next('b');source.complete();
  assert.deepEqual(x.events,[n('a')]);
  duration.next(1);
  assert.deepEqual(x.events,[n('a'),n('b'),c]);
});
test('S20 native throttle: duration completion without next does not flush trailing candidate',()=>{
  const source=new Subject(),duration=new Subject();
  const x=observe(source.pipe(throttle(()=>duration,{leading:false,trailing:true})));
  source.next('a');source.complete();
  assert.deepEqual(x.events,[]);
  duration.complete();
  assert.deepEqual(x.events,[c]);
});
test('S20 native throttle: failing duration propagates error identity and disconnects source',()=>{
  const source=new Subject(),duration=new Subject(),boom={duration:'error'};
  const x=observe(source.pipe(throttle(()=>duration)));
  source.next('a');duration.error(boom);
  assert.deepEqual(x.events,[n('a'),{kind:'E',error:boom}]);
  assert.equal(source.observers.length,0);
});
test('S20 native throttle: early cancellation releases source and duration, without flushing',()=>{
  const source=new Subject(),duration=new Subject();
  const x=observe(source.pipe(throttle(()=>duration,{leading:false,trailing:true})));
  source.next('a');x.subscription.unsubscribe();
  assert.deepEqual(x.events,[]);
  assert.equal(source.observers.length,0);
  assert.equal(duration.observers.length,0);
});

test('S20 native throttleTime: virtual clock flushes latest trailing values and delays completion',()=>{
  const scheduler=new TestScheduler(()=>{}),source=new Subject(),events=[];
  source.pipe(throttleTime(3,scheduler,{leading:true,trailing:true})).subscribe({
    next:value=>events.push(['N',value,scheduler.now()]),
    complete:()=>events.push(['C',scheduler.now()])
  });
  scheduler.schedule(()=>source.next('A'),0);
  scheduler.schedule(()=>source.next('B'),1);
  scheduler.schedule(()=>source.next('C'),4);
  scheduler.schedule(()=>source.complete(),5);
  scheduler.flush();
  assert.deepEqual(events,[['N','A',0],['N','B',3],['N','C',6],['C',6]]);
});
test('S20 native throttleTime: default leading-only values separated by timer duration',()=>{
  const scheduler=new TestScheduler(()=>{}),source=new Subject(),events=[];
  source.pipe(throttleTime(3,scheduler)).subscribe({
    next:value=>events.push(['N',value,scheduler.now()]),
    complete:()=>events.push(['C',scheduler.now()])
  });
  scheduler.schedule(()=>source.next(1),0);
  scheduler.schedule(()=>source.next(2),1);
  scheduler.schedule(()=>source.next(3),4);
  scheduler.schedule(()=>source.complete(),5);
  scheduler.flush();
  assert.deepEqual(events,[['N',1,0],['N',3,4],['C',5]]);
});
test('S20 native throttleTime: no leading, trailing emits after period',()=>{
  const scheduler=new TestScheduler(()=>{}),source=new Subject(),events=[];
  source.pipe(throttleTime(2,scheduler,{leading:false,trailing:true})).subscribe({
    next:v=>events.push(['N',v,scheduler.now()]),
    complete:()=>events.push(['C',scheduler.now()])
  });
  scheduler.schedule(()=>source.next('a'),0);
  scheduler.schedule(()=>source.next('b'),1);
  scheduler.schedule(()=>source.complete(),1);
  scheduler.flush();
  assert.deepEqual(events,[['N','b',2],['C',2]]);
});
test('S20 native throttleTime: cancellation before timer fires silences trailing candidate',()=>{
  const scheduler=new TestScheduler(()=>{}),source=new Subject(),events=[];
  const x=source.pipe(throttleTime(4,scheduler,{leading:false,trailing:true})).subscribe(v=>events.push(v));
  scheduler.schedule(()=>source.next('A'),0);
  scheduler.schedule(()=>x.unsubscribe(),2);
  scheduler.flush();
  assert.deepEqual(events,[]);
  assert.equal(source.observers.length,0);
});
