import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, of, raceWith, repeat, repeatWhen, retry } from 'rxjs';
import { race as pipeRace } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

const tracked=()=>{
  const sources=[];
  const subscriptions=[];
  const teardowns=[];
  const source=new Observable(observer=>{
    const id=sources.length;
    const subject=new Subject();
    sources.push(subject);
    subscriptions.push(id);
    const inner=subject.subscribe(observer);
    return ()=>{teardowns.push(id);inner.unsubscribe();};
  });
  return {source,sources,subscriptions,teardowns};
};
const notifications=()=>{
  const events=[];
  return {
    events,
    observer:{
      next:value=>events.push({kind:'N',value}),
      error:error=>events.push({kind:'E',error}),
      complete:()=>events.push({kind:'C'})
    }
  };
};
const observed=(observable)=>{
  const x=notifications();
  const subscription=observable.subscribe(x.observer);
  return {...x,subscription};
};

test('S17 RXJS race: legacy pipeable export elects first next, not merely first subscription',()=>{
  const left=new Subject(),mid=new Subject(),right=new Subject();
  const x=observed(left.pipe(pipeRace(mid,right)));
  assert.deepEqual([left.observers.length,mid.observers.length,right.observers.length],[1,1,1]);
  mid.next({id:'winner'});
  assert.deepEqual([left.observers.length,mid.observers.length,right.observers.length],[0,1,0]);
  left.next('lost');right.next('lost');
  mid.next('again');mid.complete();
  assert.deepEqual(x.events,[{kind:'N',value:{id:'winner'}},{kind:'N',value:'again'},{kind:'C'}]);
});
test('S17 RXJS race: legacy array overload has same source-first candidate behavior',()=>{
  const main=new Subject(),a=new Subject(),b=new Subject();
  const x=observed(main.pipe(pipeRace([a,b])));
  b.next(9);a.next(8);b.complete();
  assert.deepEqual(x.events,[{kind:'N',value:9},{kind:'C'}]);
});
test('S17 RXJS raceWith: fastest next cancels all losers; winner may emit repeatedly',()=>{
  const a=new Subject(),b=new Subject(),c=new Subject();
  const x=observed(a.pipe(raceWith(b,c)));
  c.next('first');c.next('second');
  assert.equal(a.observers.length,0);
  assert.equal(b.observers.length,0);
  assert.equal(c.observers.length,1);
  c.complete();
  assert.deepEqual(x.events,[{kind:'N',value:'first'},{kind:'N',value:'second'},{kind:'C'}]);
});
test('S17 RXJS raceWith: early completion terminates even without next',()=>{
  const a=new Subject(),b=new Subject(),c=new Subject();
  const x=observed(a.pipe(raceWith(b,c)));
  b.complete();
  assert.deepEqual(x.events,[{kind:'C'}]);
  assert.deepEqual([a.observers.length,b.observers.length,c.observers.length],[0,0,0]);
});
test('S17 RXJS raceWith: early error retains reference and tears down others',()=>{
  const a=new Subject(),b=new Subject();
  const err=new Error('race lost to error');
  const x=observed(a.pipe(raceWith(b)));
  b.error(err);
  assert.equal(x.events.length,1);
  assert.equal(x.events[0].error,err);
  assert.equal(a.observers.length,0);
});
test('S17 RXJS raceWith: downstream unsubscribe is silent and releases each candidate',()=>{
  const a=new Subject(),b=new Subject(),c=new Subject();
  const x=observed(a.pipe(raceWith(b,c)));
  x.subscription.unsubscribe();
  assert.deepEqual(x.events,[]);
  assert.deepEqual([a.observers.length,b.observers.length,c.observers.length],[0,0,0]);
});
test('S17 RXJS raceWith: zero other sources is source-identity behavior',()=>{
  const subject=new Subject();
  const x=observed(subject.pipe(raceWith()));
  subject.next(2);subject.complete();
  assert.deepEqual(x.events,[{kind:'N',value:2},{kind:'C'}]);
});
test('S17 RXJS raceWith: synchronous first source can prevent later subscriptions (excluded model profile)',()=>{
  let subscribedLater=0;
  const later=new Observable(sub=>{subscribedLater++;sub.next(2);sub.complete();});
  const x=observed(of(1).pipe(raceWith(later)));
  assert.deepEqual(x.events,[{kind:'N',value:1},{kind:'C'}]);
  assert.equal(subscribedLater,0);
});
test('S17 RXJS raceWith: virtual-time winner is selected by earliest source next',()=>{
  const s=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
  s.run(({hot,expectObservable})=>{
    const a=hot('---a----b---|',{a:'a',b:'b'});
    const b=hot('--x--y------|',{x:'x',y:'y'});
    expectObservable(a.pipe(raceWith(b))).toBe('--x--y------|',{x:'x',y:'y'});
  });
});

test('S17 RXJS repeat: total count=2 means exactly two separate source executions',()=>{
  const t=tracked();
  const x=observed(t.source.pipe(repeat(2)));
  assert.deepEqual(t.subscriptions,[0]);
  t.sources[0].next(1);
  t.sources[0].complete();
  assert.deepEqual(t.subscriptions,[0,1]);
  t.sources[1].next(2);
  t.sources[1].complete();
  assert.deepEqual(x.events,[{kind:'N',value:1},{kind:'N',value:2},{kind:'C'}]);
  assert.deepEqual(t.teardowns,[0,1]);
});
test('S17 RXJS repeat: repeat(0) completes without ever subscribing the producer',()=>{
  const t=tracked();
  const x=observed(t.source.pipe(repeat(0)));
  assert.deepEqual(x.events,[{kind:'C'}]);
  assert.deepEqual(t.subscriptions,[]);
});
test('S17 RXJS repeat: repeat(1) is a single subscription with no repetition',()=>{
  const t=tracked();
  const x=observed(t.source.pipe(repeat(1)));
  t.sources[0].next('once');t.sources[0].complete();
  assert.deepEqual(x.events,[{kind:'N',value:'once'},{kind:'C'}]);
  assert.deepEqual(t.subscriptions,[0]);
});
test('S17 RXJS repeat: failure does not resubscribe and forwards same error object',()=>{
  const t=tracked();
  const x=observed(t.source.pipe(repeat(3)));
  const e={message:'fatal'};
  t.sources[0].error(e);
  assert.equal(x.events[0].error,e);
  assert.deepEqual(t.subscriptions,[0]);
  assert.deepEqual(t.teardowns,[0]);
});
test('S17 RXJS repeat: unsubscribe from a repeated generation is silent',()=>{
  const t=tracked();
  const x=observed(t.source.pipe(repeat(4)));
  t.sources[0].complete();
  assert.deepEqual(t.subscriptions,[0,1]);
  x.subscription.unsubscribe();
  assert.deepEqual(x.events,[]);
  assert.deepEqual(t.teardowns,[0,1]);
});
test('S17 RXJS repeat: value identity retained through a resubscription',()=>{
  const t=tracked();
  const x=observed(t.source.pipe(repeat(2)));
  const v={value:'same-reference'};
  t.sources[0].next(v);t.sources[0].complete();t.sources[1].next(v);t.sources[1].complete();
  assert.equal(x.events[0].value,v);
  assert.equal(x.events[1].value,v);
});

test('S17 RXJS repeatWhen: notifier is lazy and constructed once at first completion',()=>{
  const t=tracked();
  const signal=new Subject();
  let selectorCalls=0;
  const internal=[];
  const x=observed(t.source.pipe(repeatWhen(completions=>{
    selectorCalls++;
    completions.subscribe({next:()=>internal.push('complete')});
    return signal;
  })));
  assert.equal(selectorCalls,0);
  t.sources[0].next('first');t.sources[0].complete();
  assert.equal(selectorCalls,1);
  assert.deepEqual(internal,['complete']);
  signal.next('restart');
  assert.deepEqual(t.subscriptions,[0,1]);
  t.sources[1].next('second');t.sources[1].complete();
  assert.equal(selectorCalls,1);
  assert.deepEqual(internal,['complete','complete']);
  signal.complete();
  assert.deepEqual(x.events,[{kind:'N',value:'first'},{kind:'N',value:'second'},{kind:'C'}]);
});
test('S17 RXJS repeatWhen: notifier completion while source active waits for source completion',()=>{
  const t=tracked();const signal=new Subject();
  const x=observed(t.source.pipe(repeatWhen(()=>signal)));
  t.sources[0].complete();signal.next(1);
  signal.complete();
  assert.deepEqual(x.events,[]);
  t.sources[1].next('still alive');t.sources[1].complete();
  assert.deepEqual(x.events,[{kind:'N',value:'still alive'},{kind:'C'}]);
});
test('S17 RXJS repeatWhen: notifier error propagates exact object and tears down source',()=>{
  const t=tracked();const signal=new Subject();
  const x=observed(t.source.pipe(repeatWhen(()=>signal)));
  t.sources[0].complete();signal.next(1);
  const err={cause:'notifier'};
  signal.error(err);
  assert.equal(x.events[0].error,err);
  assert.deepEqual(t.teardowns,[0,1]);
});
test('S17 RXJS repeatWhen: source error bypasses completion notifier completely',()=>{
  const t=tracked();let calls=0;
  const x=observed(t.source.pipe(repeatWhen(()=>{calls++;return new Subject();})));
  const err=new Error('source error');
  t.sources[0].error(err);
  assert.equal(calls,0);
  assert.equal(x.events[0].error,err);
});
test('S17 RXJS repeatWhen: cancellation while waiting is silent and unsubscribes notifier',()=>{
  const t=tracked();const signal=new Subject();
  const x=observed(t.source.pipe(repeatWhen(()=>signal)));
  t.sources[0].complete();
  assert.equal(signal.observers.length,1);
  x.subscription.unsubscribe();
  assert.equal(signal.observers.length,0);
  assert.deepEqual(x.events,[]);
});
test('S17 RXJS repeatWhen: first completion can terminate without any repetition',()=>{
  const t=tracked();const signal=new Subject();
  const x=observed(t.source.pipe(repeatWhen(()=>signal)));
  t.sources[0].complete();
  signal.complete();
  assert.deepEqual(x.events,[{kind:'C'}]);
  assert.deepEqual(t.subscriptions,[0]);
});

test('S17 RXJS retry: two retries allow three attempts and forward only final error',()=>{
  const t=tracked();const x=observed(t.source.pipe(retry(2)));
  const first={retry:0},second={retry:1},last={retry:2};
  t.sources[0].error(first);
  t.sources[1].error(second);
  t.sources[2].error(last);
  assert.deepEqual(t.subscriptions,[0,1,2]);
  assert.deepEqual(x.events,[{kind:'E',error:last}]);
  assert.deepEqual(t.teardowns,[0,1,2]);
});
test('S17 RXJS retry: values from failed attempts remain in output',()=>{
  const t=tracked();const x=observed(t.source.pipe(retry(2)));
  t.sources[0].next('early');t.sources[0].error('bad');
  t.sources[1].next('later');t.sources[1].complete();
  assert.deepEqual(x.events,[{kind:'N',value:'early'},{kind:'N',value:'later'},{kind:'C'}]);
});
test('S17 RXJS retry: retry(0) forwards the original error without restarting',()=>{
  const t=tracked();const x=observed(t.source.pipe(retry(0)));
  const err=new Error('no retry');
  t.sources[0].error(err);
  assert.equal(x.events[0].error,err);
  assert.deepEqual(t.subscriptions,[0]);
});
test('S17 RXJS retry: resetOnSuccess restores retry budget after every source next',()=>{
  const t=tracked();const x=observed(t.source.pipe(retry({count:1,resetOnSuccess:true})));
  t.sources[0].error('first');
  t.sources[1].next('succeeded');
  t.sources[1].error('second');
  t.sources[2].next('again');
  t.sources[2].complete();
  assert.deepEqual(t.subscriptions,[0,1,2]);
  assert.deepEqual(x.events,[{kind:'N',value:'succeeded'},{kind:'N',value:'again'},{kind:'C'}]);
});
test('S17 RXJS retry: without resetOnSuccess the previous errors exhaust budget',()=>{
  const t=tracked();const x=observed(t.source.pipe(retry({count:1,resetOnSuccess:false})));
  t.sources[0].error('first');
  t.sources[1].next('succeeded');
  const err={message:'second'};
  t.sources[1].error(err);
  assert.deepEqual(t.subscriptions,[0,1]);
  assert.deepEqual(x.events,[{kind:'N',value:'succeeded'},{kind:'E',error:err}]);
});
test('S17 RXJS retry: unsubscribing after an error-driven restart is silent',()=>{
  const t=tracked();const x=observed(t.source.pipe(retry(2)));
  t.sources[0].error('transient');
  assert.deepEqual(t.subscriptions,[0,1]);
  x.subscription.unsubscribe();
  assert.deepEqual(t.teardowns,[0,1]);
  assert.deepEqual(x.events,[]);
});
test('S17 RXJS retry: source completion never resubscribes',()=>{
  const t=tracked();const x=observed(t.source.pipe(retry(2)));
  t.sources[0].next(3);t.sources[0].complete();
  assert.deepEqual(t.subscriptions,[0]);
  assert.deepEqual(x.events,[{kind:'N',value:3},{kind:'C'}]);
});
