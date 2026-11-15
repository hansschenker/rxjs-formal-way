import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, of, publish, refCount, retryWhen, sample, sampleTime, sequenceEqual } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

const recorded=()=> {
  const events=[];
  const observer={
    next:value=>events.push({kind:'N',value}),
    error:error=>events.push({kind:'E',error}),
    complete:()=>events.push({kind:'C'})
  };
  return {events,observer};
};
const observed=observable=>{
  const x=recorded();
  const subscription=observable.subscribe(x.observer);
  return {...x,subscription};
};
const tracked=()=>{
  const subjects=[],subscriptions=[],teardowns=[];
  const source=new Observable(observer=>{
    const id=subjects.length;
    const s=new Subject();
    subjects.push(s);
    subscriptions.push(id);
    const inner=s.subscribe(observer);
    return ()=>{teardowns.push(id);inner.unsubscribe();};
  });
  return {source,subjects,subscriptions,teardowns};
};

test('S18 RXJS retryWhen: notifier selector is lazy until first source error',()=>{
  const t=tracked();let calls=0;const notifier=new Subject();
  const errors=[];
  const x=observed(t.source.pipe(retryWhen(error$=>{
    calls++;error$.subscribe(e=>errors.push(e));return notifier;
  })));
  assert.equal(calls,0);
  t.subjects[0].next('ok');
  assert.equal(calls,0);
  const e={failure:1};
  t.subjects[0].error(e);
  assert.equal(calls,1);
  assert.equal(errors[0],e);
  assert.deepEqual(x.events,[{kind:'N',value:'ok'}]);
  x.subscription.unsubscribe();
});
test('S18 RXJS retryWhen: successive original errors reach same Subject, one notifier subscription',()=>{
  const t=tracked(),notifier=new Subject(),errors=[];
  let calls=0;
  const x=observed(t.source.pipe(retryWhen(error$=>{
    calls++;
    error$.subscribe(err=>errors.push(err));
    return notifier;
  })));
  const e1={attempt:0},e2={attempt:1};
  t.subjects[0].error(e1);
  notifier.next('retry0');
  assert.deepEqual(t.subscriptions,[0,1]);
  t.subjects[1].error(e2);
  assert.equal(calls,1);
  assert.deepEqual(errors,[e1,e2]);
  notifier.next('retry1');
  t.subjects[2].next('recovered');t.subjects[2].complete();
  assert.deepEqual(x.events,[{kind:'N',value:'recovered'},{kind:'C'}]);
  assert.deepEqual(t.subscriptions,[0,1,2]);
  assert.deepEqual(t.teardowns,[0,1,2]);
});
test('S18 RXJS retryWhen: notifier completion while waiting completes without restart',()=>{
  const t=tracked(),notifier=new Subject();
  const x=observed(t.source.pipe(retryWhen(()=>notifier)));
  t.subjects[0].error('temporary');
  notifier.complete();
  assert.deepEqual(x.events,[{kind:'C'}]);
  assert.deepEqual(t.subscriptions,[0]);
});
test('S18 RXJS retryWhen: notifier completion while source active terminates immediately',()=>{
  const t=tracked(),notifier=new Subject();
  const x=observed(t.source.pipe(retryWhen(()=>notifier)));
  t.subjects[0].error('temporary');
  notifier.next('go');
  assert.deepEqual(t.subscriptions,[0,1]);
  notifier.complete();
  assert.deepEqual(x.events,[{kind:'C'}]);
  assert.deepEqual(t.teardowns,[0,1]);
});
test('S18 RXJS retryWhen: notifier failure keeps exact error object',()=>{
  const t=tracked(),notifier=new Subject();
  const x=observed(t.source.pipe(retryWhen(()=>notifier)));
  t.subjects[0].error('original');
  const cause={notifier:true};notifier.error(cause);
  assert.deepEqual(x.events,[{kind:'E',error:cause}]);
  assert.equal(x.events[0].error,cause);
});
test('S18 RXJS retryWhen: source success before first error never constructs notifier',()=>{
  const t=tracked();let calls=0;
  const x=observed(t.source.pipe(retryWhen(()=>{calls++;return new Subject();})));
  t.subjects[0].next(7);t.subjects[0].complete();
  assert.equal(calls,0);
  assert.deepEqual(x.events,[{kind:'N',value:7},{kind:'C'}]);
});
test('S18 RXJS retryWhen: unsubscribe during notifier wait releases notifier and remains silent',()=>{
  const t=tracked(),notifier=new Subject();
  const x=observed(t.source.pipe(retryWhen(()=>notifier)));
  t.subjects[0].error('oops');
  assert.equal(notifier.observers.length,1);
  x.subscription.unsubscribe();
  assert.equal(notifier.observers.length,0);
  assert.deepEqual(x.events,[]);
  notifier.next('too late');
  assert.deepEqual(t.subscriptions,[0]);
});
test('S18 RXJS retryWhen: source error is an internal next, not downstream error',()=>{
  const t=tracked(),notifier=new Subject(),events=[];
  const x=observed(t.source.pipe(retryWhen(errors=>{
    errors.subscribe({next:e=>events.push({kind:'errorSignal',error:e})});
    return notifier;
  })));
  const e=new Error('source');
  t.subjects[0].error(e);
  assert.equal(events[0].error,e);
  assert.deepEqual(x.events,[]);
  x.subscription.unsubscribe();
});

test('S18 RXJS refCount: publish connects once for two simultaneous subscribers',()=>{
  const t=tracked(),shared=t.source.pipe(publish(),refCount());
  const a=observed(shared),b=observed(shared);
  assert.deepEqual(t.subscriptions,[0]);
  t.subjects[0].next('shared');
  assert.deepEqual(a.events,[{kind:'N',value:'shared'}]);
  assert.deepEqual(b.events,[{kind:'N',value:'shared'}]);
  a.subscription.unsubscribe();
  assert.deepEqual(t.teardowns,[]);
  t.subjects[0].next('only-b');
  assert.deepEqual(a.events,[{kind:'N',value:'shared'}]);
  assert.deepEqual(b.events,[{kind:'N',value:'shared'},{kind:'N',value:'only-b'}]);
  b.subscription.unsubscribe();
  assert.deepEqual(t.teardowns,[0]);
});
test('S18 RXJS refCount: last departure disconnects and next subscriber reconnects',()=>{
  const t=tracked(),shared=t.source.pipe(publish(),refCount());
  const a=observed(shared);
  a.subscription.unsubscribe();
  assert.deepEqual(t.teardowns,[0]);
  const b=observed(shared);
  assert.deepEqual(t.subscriptions,[0,1]);
  t.subjects[1].next('fresh');
  assert.deepEqual(b.events,[{kind:'N',value:'fresh'}]);
  b.subscription.unsubscribe();
  assert.deepEqual(t.teardowns,[0,1]);
});
test('S18 RXJS refCount: upstream complete notifies all and later subscribe gets new Subject',()=>{
  const t=tracked(),shared=t.source.pipe(publish(),refCount());
  const a=observed(shared),b=observed(shared);
  t.subjects[0].next(1);t.subjects[0].complete();
  assert.deepEqual(a.events,[{kind:'N',value:1},{kind:'C'}]);
  assert.deepEqual(b.events,[{kind:'N',value:1},{kind:'C'}]);
  const c=observed(shared);
  assert.deepEqual(t.subscriptions,[0,1]);
  t.subjects[1].next(2);t.subjects[1].complete();
  assert.deepEqual(c.events,[{kind:'N',value:2},{kind:'C'}]);
});
test('S18 RXJS refCount: source failure broadcasts exact error and releases producer',()=>{
  const t=tracked(),shared=t.source.pipe(publish(),refCount());
  const a=observed(shared),b=observed(shared);
  const e={kind:'error'};t.subjects[0].error(e);
  assert.equal(a.events[0].error,e);
  assert.equal(b.events[0].error,e);
  assert.deepEqual(t.teardowns,[0]);
});
test('S18 RXJS refCount: independent subscription lifetimes are silent on cancel',()=>{
  const t=tracked(),shared=t.source.pipe(publish(),refCount());
  const a=observed(shared),b=observed(shared);
  a.subscription.unsubscribe();b.subscription.unsubscribe();
  assert.deepEqual(a.events,[]);
  assert.deepEqual(b.events,[]);
  assert.deepEqual(t.teardowns,[0]);
});

test('S18 RXJS sample: latest unsampled source value only on notifier next',()=>{
  const source=new Subject(),notifier=new Subject();
  const x=observed(source.pipe(sample(notifier)));
  source.next('old');source.next('latest');
  notifier.next(1);notifier.next(2);
  source.next('new');notifier.next(3);source.complete();
  assert.deepEqual(x.events,[
    {kind:'N',value:'latest'},{kind:'N',value:'new'},{kind:'C'}
  ]);
});
test('S18 RXJS sample: undefined and null payloads are not confused with no value',()=>{
  const source=new Subject(),notifier=new Subject();
  const x=observed(source.pipe(sample(notifier)));
  notifier.next('no-value');
  source.next(undefined);notifier.next(1);
  source.next(null);notifier.next(2);source.complete();
  assert.deepEqual(x.events,[
    {kind:'N',value:undefined},{kind:'N',value:null},{kind:'C'}
  ]);
});
test('S18 RXJS sample: notifier complete does not flush remembered value or stop source',()=>{
  const source=new Subject(),notifier=new Subject();
  const x=observed(source.pipe(sample(notifier)));
  source.next('pending');notifier.complete();
  assert.deepEqual(x.events,[]);
  assert.equal(source.observers.length,1);
  source.next('not sampled');source.complete();
  assert.deepEqual(x.events,[{kind:'C'}]);
});
test('S18 RXJS sample: source completion before notifier tick discards last value',()=>{
  const source=new Subject(),notifier=new Subject();
  const x=observed(source.pipe(sample(notifier)));
  source.next('unflushed');source.complete();
  assert.deepEqual(x.events,[{kind:'C'}]);
  assert.equal(notifier.observers.length,0);
});
test('S18 RXJS sample: notifier error preserves error object and tears down source',()=>{
  const source=new Subject(),notifier=new Subject();
  const x=observed(source.pipe(sample(notifier)));
  const e={reason:'notifier'};notifier.error(e);
  assert.equal(x.events[0].error,e);
  assert.equal(source.observers.length,0);
});
test('S18 RXJS sample: cancellation tears down both connected inputs silently',()=>{
  const source=new Subject(),notifier=new Subject();
  const x=observed(source.pipe(sample(notifier)));
  source.next(1);x.subscription.unsubscribe();
  assert.equal(source.observers.length,0);
  assert.equal(notifier.observers.length,0);
  assert.deepEqual(x.events,[]);
});

test('S18 RXJS sampleTime: virtual periodic samples latest once per interval',()=>{
  const scheduler=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
  scheduler.run(({hot,expectObservable})=>{
    const source=hot('-ab----c---|',{a:'a',b:'b',c:'c'});
    expectObservable(source.pipe(sampleTime(3,scheduler))).toBe('---b-----c-|',{b:'b',c:'c'});
  });
});
test('S18 RXJS sampleTime: source completes before first tick without flushing',()=>{
  const scheduler=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
  scheduler.run(({cold,expectObservable})=>{
    const source=cold('-a|',{a:'lost'});
    expectObservable(source.pipe(sampleTime(3,scheduler))).toBe('--|');
  });
});
test('S18 RXJS sampleTime: empty intervals do not duplicate past samples',()=>{
  const scheduler=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
  scheduler.run(({hot,expectObservable})=>{
    const source=hot('-a----------|',{a:9});
    expectObservable(source.pipe(sampleTime(3,scheduler))).toBe('---a--------|',{a:9});
  });
});
test('S18 RXJS sampleTime: error before first tick is not postponed',()=>{
  const scheduler=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
  const e={fault:'early'};
  scheduler.run(({cold,expectObservable})=>{
    const source=cold('-a#', {a:1},e);
    expectObservable(source.pipe(sampleTime(3,scheduler))).toBe('--#',undefined,e);
  });
});

test('S18 RXJS sequenceEqual: interleaving buffers values FIFO and emits true when both complete',()=>{
  const left=new Subject(),right=new Subject();
  const x=observed(left.pipe(sequenceEqual(right)));
  left.next('a');left.next('b');right.next('a');right.next('b');
  assert.deepEqual(x.events,[]);
  left.complete();right.complete();
  assert.deepEqual(x.events,[{kind:'N',value:true},{kind:'C'}]);
});
test('S18 RXJS sequenceEqual: two empty streams yield true',()=>{
  const x=observed(of().pipe(sequenceEqual(of())));
  assert.deepEqual(x.events,[{kind:'N',value:true},{kind:'C'}]);
});
test('S18 RXJS sequenceEqual: unequal aligned pair terminates and tears down both immediately',()=>{
  const left=new Subject(),right=new Subject();
  const x=observed(left.pipe(sequenceEqual(right)));
  right.next(1);left.next(2);
  assert.deepEqual(x.events,[{kind:'N',value:false},{kind:'C'}]);
  assert.equal(left.observers.length,0);
  assert.equal(right.observers.length,0);
});
test('S18 RXJS sequenceEqual: extra value after other completed proves unequal length',()=>{
  const left=new Subject(),right=new Subject();
  const x=observed(left.pipe(sequenceEqual(right)));
  left.complete();
  assert.deepEqual(x.events,[]);
  right.next('extra');
  assert.deepEqual(x.events,[{kind:'N',value:false},{kind:'C'}]);
});
test('S18 RXJS sequenceEqual: unmatched FIFO at both completions yields false',()=>{
  const left=new Subject(),right=new Subject();
  const x=observed(left.pipe(sequenceEqual(right)));
  left.next('unmatched');left.complete();right.complete();
  assert.deepEqual(x.events,[{kind:'N',value:false},{kind:'C'}]);
});
test('S18 RXJS sequenceEqual: default comparator uses strict equality, not Object.is',()=>{
  const same={id:1};
  const a=observed(of(same).pipe(sequenceEqual(of(same))));
  assert.deepEqual(a.events,[{kind:'N',value:true},{kind:'C'}]);
  const nan=observed(of(NaN).pipe(sequenceEqual(of(NaN))));
  assert.deepEqual(nan.events,[{kind:'N',value:false},{kind:'C'}]);
});
test('S18 RXJS sequenceEqual: comparing Object references is not structural deep equality',()=>{
  const a=observed(of({id:1}).pipe(sequenceEqual(of({id:1}))));
  assert.deepEqual(a.events,[{kind:'N',value:false},{kind:'C'}]);
});
test('S18 RXJS sequenceEqual: error wins without false equality and retains identity',()=>{
  const left=new Subject(),right=new Subject();
  const x=observed(left.pipe(sequenceEqual(right)));
  left.next(1);const e={cause:'source'};right.error(e);
  assert.equal(x.events.length,1);
  assert.equal(x.events[0].error,e);
  assert.equal(left.observers.length,0);
});
test('S18 RXJS sequenceEqual: explicit cancellation yields no boolean',()=>{
  const left=new Subject(),right=new Subject();
  const x=observed(left.pipe(sequenceEqual(right)));
  left.next(1);x.subscription.unsubscribe();
  assert.deepEqual(x.events,[]);
  assert.equal(left.observers.length,0);
  assert.equal(right.observers.length,0);
});
test('S18 RXJS sequenceEqual: custom comparator is supported by RxJS but excluded from default model scope',()=>{
  const x=observed(of({id:1}).pipe(sequenceEqual(of({id:1}),(a,b)=>a.id===b.id)));
  assert.deepEqual(x.events,[{kind:'N',value:true},{kind:'C'}]);
});
