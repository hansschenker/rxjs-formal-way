import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, EMPTY, NEVER, of, EmptyError } from 'rxjs';
import { takeLast, tap, throttle, throttleTime, throwIfEmpty, take } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

// Independent native fixtures: no canonical model or generated expectation is imported.
function input(log = [], name = 'source') {
  const subject = new Subject();
  const source$ = new Observable(subscriber => {
    log.push(name + '+');
    const connection = subject.subscribe(subscriber);
    return () => { connection.unsubscribe(); log.push(name + '-'); };
  });
  return { subject, source$ };
}
const observer = log => ({ next: value => log.push(['N', value]), error: error => log.push(['E', error]), complete: () => log.push(['C']) });
const notes = log => log.filter(Array.isArray).filter(x => ['N','E','C'].includes(x[0]));

test('S20 RX takeLast: suffix is silent until completion, then FIFO next/next/complete before teardown', () => {
  const log=[], {source$,subject}=input(log); const sub=source$.pipe(takeLast(2)).subscribe(observer(log));
  subject.next('A');subject.next('B');subject.next('C');assert.deepEqual(log,['source+']);
  subject.complete();assert.deepEqual(log,['source+',['N','B'],['N','C'],['C'],'source-']);assert.equal(sub.closed,true);
});
for(const count of [-8,0])test(`S20 RX takeLast(${count}): no producer acquisition`,()=>{
  let acquired=0;const log=[];
  new Observable(()=>{acquired++;}).pipe(takeLast(count)).subscribe(observer(log));
  assert.equal(acquired,0);assert.deepEqual(log,[['C']]);
});
test('S20 RX takeLast: short and empty successful sources',()=>{
  const a=[],b=[];of(1,2).pipe(takeLast(4)).subscribe(observer(a));EMPTY.pipe(takeLast(4)).subscribe(observer(b));
  assert.deepEqual(a,[['N',1],['N',2],['C']]);assert.deepEqual(b,[['C']]);
});
test('S20 RX takeLast: error preserves identity and discards the entire suffix',()=>{
  const log=[],fault={}, {source$,subject}=input(log);source$.pipe(takeLast(2)).subscribe(observer(log));
  subject.next(1);subject.error(fault);assert.deepEqual(log,['source+',['E',fault],'source-']);assert.equal(log[1][1],fault);
});
test('S20 RX takeLast: early cancellation is silent and does not flush',()=>{
  const log=[], {source$,subject}=input(log);const sub=source$.pipe(takeLast(2)).subscribe(observer(log));
  subject.next(1);sub.unsubscribe();subject.complete();assert.deepEqual(log,['source+','source-']);
});
test('S20 RX takeLast: independent subscriber memory preserves opaque references',()=>{
  const {source$,subject}=input(),first=[],second=[],a={},b={};source$.pipe(takeLast(2)).subscribe(observer(first));
  subject.next(a);source$.pipe(takeLast(2)).subscribe(observer(second));subject.next(b);subject.complete();
  assert.deepEqual(first,[['N',a],['N',b],['C']]);assert.deepEqual(second,[['N',b],['C']]);assert.equal(first[0][1],a);
});
test('S20 RX takeLast: literal marble expectation and source subscription interval',()=>{
  new TestScheduler((a,b)=>assert.deepEqual(a,b)).run(({cold,expectObservable,expectSubscriptions})=>{
    const source=cold('-a-b-c-|');expectObservable(source.pipe(takeLast(2))).toBe('-------(bc|)');expectSubscriptions(source.subscriptions).toBe('^------!');
  });
});
test('S20 RX takeLast: cancellation within synchronous flush is runtime characterization outside atomic model scope',()=>{
  const log=[];of(1,2,3).pipe(takeLast(3),take(1)).subscribe(observer(log));assert.deepEqual(log,[['N',1],['C']]);
});

function tapHooks(log, throws) {
  return {
    subscribe:()=>log.push('tap.subscribe'),
    next:value=>{log.push(['tap.next',value]);if(throws?.hook==='next')throw throws.error;},
    error:error=>{log.push(['tap.error',error]);if(throws?.hook==='error')throw throws.error;},
    complete:()=>{log.push('tap.complete');if(throws?.hook==='complete')throw throws.error;},
    unsubscribe:()=>log.push('tap.unsubscribe'),finalize:()=>log.push('tap.finalize'),
  };
}
test('S20 RX tap: subscribe hook precedes acquisition; next and complete hooks precede unchanged notifications',()=>{
  const log=[],value={}, {source$,subject}=input(log);const result$=source$.pipe(tap(tapHooks(log)));assert.deepEqual(log,[]);
  const sub=result$.subscribe(observer(log));subject.next(value);subject.complete();sub.unsubscribe();
  assert.deepEqual(log,['tap.subscribe','source+',['tap.next',value],['N',value],'tap.complete',['C'],'source-','tap.finalize']);
  assert.equal(log[3][1],value);
});
test('S20 RX tap: source error skips unsubscribe hook but always finalizes after source teardown',()=>{
  const log=[],fault={}, {source$,subject}=input(log);source$.pipe(tap(tapHooks(log))).subscribe(observer(log));subject.error(fault);
  assert.deepEqual(log,['tap.subscribe','source+',['tap.error',fault],['E',fault],'source-','tap.finalize']);
});
test('S20 RX tap: explicit cancellation calls unsubscribe before finalize, exactly once',()=>{
  const log=[], {source$}=input(log);const sub=source$.pipe(tap(tapHooks(log))).subscribe(observer(log));sub.unsubscribe();sub.unsubscribe();
  assert.deepEqual(log,['tap.subscribe','source+','source-','tap.unsubscribe','tap.finalize']);
});
for(const hook of ['next','error','complete'])test(`S20 RX tap: throwing ${hook} handler replaces the notification and has distinct lifecycle flags`,()=>{
  const log=[],fault={}, original={}, {source$,subject}=input(log);source$.pipe(tap(tapHooks(log,{hook,error:fault}))).subscribe(observer(log));
  if(hook==='next')subject.next(1);else if(hook==='error')subject.error(original);else subject.complete();
  assert.deepEqual(notes(log),[['E',fault]]);assert.equal(notes(log)[0][1],fault);
  assert.equal(log.includes('tap.unsubscribe'),hook==='next');
  assert.deepEqual(log.slice(hook==='next'?-3:-2),hook==='next'?['source-','tap.unsubscribe','tap.finalize']:['source-','tap.finalize']);
});
test('S20 RX tap: next-function return is ignored and missing handlers mirror source',()=>{
  const a=[],b=[];of(1,2).pipe(tap(()=>999)).subscribe(observer(a));of(undefined).pipe(tap({})).subscribe(observer(b));
  assert.deepEqual(a,[['N',1],['N',2],['C']]);assert.deepEqual(b,[['N',undefined],['C']]);
});
test('S20 RX tap: no-handler form returns source identity (API characterization)',()=>{
  const source=of(1);assert.equal(source.pipe(tap()),source);
});
test('S20 RX tap: cooperative synchronous producer stops after downstream cancellation (outside atomic acquisition scope)',()=>{
  const produced=[],seen=[];new Observable(s=>{for(let i=0;i<8&&!s.closed;i++){produced.push(i);s.next(i);}})
    .pipe(tap(v=>seen.push(v)),take(2)).subscribe();assert.deepEqual(produced,[0,1]);assert.deepEqual(seen,[0,1]);
});

const configs=[{leading:true,trailing:false},{leading:true,trailing:true},{leading:false,trailing:true},{leading:false,trailing:false}];
function signalHarness(config){
  const log=[],{source$,subject}=input(log),durations=[];
  const result$=source$.pipe(throttle(value=>{
    log.push(['select',value]);const d=input(log,'D'+durations.length);durations.push(d);return d.source$;
  },config));
  const subscription=result$.subscribe(observer(log));return{log,subject,durations,subscription};
}
for(const config of configs)test(`S20 RX throttle ${Number(config.leading)}${Number(config.trailing)}: burst and source completion`,()=>{
  const h=signalHarness(config);h.subject.next('A');h.subject.next('B');
  assert.deepEqual(notes(h.log),config.leading?[['N','A']]:[]);
  assert.equal(h.durations.length,1);h.subject.complete();
  assert.equal(h.subscription.closed,!config.trailing);
  h.durations[0].subject.next('ignored-duration-payload');
  assert.deepEqual(notes(h.log),[...(config.leading?[['N','A']]:[]),...(config.trailing?[['N','B']]:[]),['C']]);
  assert.equal(h.durations.length,1);assert.equal(h.subscription.closed,true);
});
test('S20 RX throttle: trailing output restarts duration with latest emitted payload, then empty window goes idle',()=>{
  const h=signalHarness({leading:true,trailing:true});h.subject.next('A');h.subject.next('B');h.durations[0].subject.next(0);
  assert.deepEqual(h.log,['source+',['N','A'],['select','A'],'D0+','D0-',['N','B'],['select','B'],'D1+']);
  h.durations[1].subject.next(0);assert.equal(h.durations.length,2);assert.deepEqual(notes(h.log),[['N','A'],['N','B']]);h.subscription.unsubscribe();
});
test('S20 RX throttle: completed duration is not a trailing next signal',()=>{
  const h=signalHarness({leading:false,trailing:true});h.subject.next('A');h.durations[0].subject.complete();
  assert.deepEqual(notes(h.log),[]);h.subject.complete();assert.deepEqual(notes(h.log),[['C']]);
});
test('S20 RX throttle: duration complete while waiting discards pending value, completion before final duration teardown',()=>{
  const h=signalHarness({leading:false,trailing:true});h.subject.next('A');h.subject.complete();h.durations[0].subject.complete();
  assert.deepEqual(h.log,['source+',['select','A'],'D0+','source-',['C'],'D0-']);
});
test('S20 RX throttle: source failure releases both inputs without trailing output',()=>{
  const h=signalHarness({leading:false,trailing:true}),fault={};h.subject.next('A');h.subject.error(fault);
  assert.deepEqual(h.log.slice(-3),[['E',fault],'source-','D0-']);assert.equal(h.subscription.closed,true);
});
test('S20 RX throttle: duration failure after source completion still errors with exact identity',()=>{
  const h=signalHarness({leading:false,trailing:true}),fault={};h.subject.next('A');h.subject.complete();h.durations[0].subject.error(fault);
  assert.deepEqual(h.log.slice(-3),['source-',['E',fault],'D0-']);assert.equal(notes(h.log)[0][1],fault);
});
test('S20 RX throttle: selector failure occurs after the configured leading emission',()=>{
  const log=[],fault={}, {source$,subject}=input(log);source$.pipe(throttle(()=>{throw fault;})).subscribe(observer(log));subject.next('A');
  assert.deepEqual(log,['source+',['N','A'],['E',fault],'source-']);
});
test('S20 RX throttle: cancellation during waiting releases only the remaining duration silently',()=>{
  const h=signalHarness({leading:false,trailing:true});h.subject.next('A');h.subject.complete();h.subscription.unsubscribe();h.durations[0].subject.next(0);
  assert.deepEqual(notes(h.log),[]);assert.deepEqual(h.log.slice(-2),['source-','D0-']);
});
test('S20 RX throttle: cancelled old duration cannot flush or end a newer duration',()=>{
  const h=signalHarness({leading:true,trailing:true});h.subject.next('A');h.subject.next('B');h.durations[0].subject.next(0);
  h.subject.next('C');h.durations[0].subject.next(0);assert.deepEqual(notes(h.log),[['N','A'],['N','B']]);
  h.durations[1].subject.next(0);assert.deepEqual(notes(h.log),[['N','A'],['N','B'],['N','C']]);h.subscription.unsubscribe();
});
test('S20 RX throttle: empty/never sources do not invoke selector or invent values',()=>{
  let calls=0;const a=[],b=[];EMPTY.pipe(throttle(()=>{calls++;return NEVER;})).subscribe(observer(a));
  const sub=NEVER.pipe(throttle(()=>{calls++;return NEVER;})).subscribe(observer(b));sub.unsubscribe();
  assert.equal(calls,0);assert.deepEqual(a,[['C']]);assert.deepEqual(b,[]);
});
test('S20 RX throttle: synchronous duration acquisition is runtime characterization outside canonical scope',()=>{
  const log=[];of(1).pipe(throttle(()=>of(0),{leading:false,trailing:true})).subscribe(observer(log));assert.deepEqual(log,[['N',1],['C']]);
});
function timedBurst(config,terminal='complete',cancelAt){
  const scheduler=new TestScheduler(()=>{}),{source$,subject}=input(),result=[];
  const subscription=source$.pipe(throttleTime(4,scheduler,config)).subscribe({next:value=>result.push([scheduler.frame,'N',value]),error:error=>result.push([scheduler.frame,'E',error]),complete:()=>result.push([scheduler.frame,'C'])});
  scheduler.schedule(()=>subject.next('A'),1);scheduler.schedule(()=>subject.next('B'),2);scheduler.schedule(()=>subject.next('C'),3);
  scheduler.schedule(()=>terminal==='error'?subject.error('fault'):subject.complete(),4);
  if(cancelAt!==undefined)scheduler.schedule(()=>subscription.unsubscribe(),cancelAt);
  scheduler.flush();return{result,subscription};
}
for(const config of configs)test(`S20 RX throttleTime ${Number(config.leading)}${Number(config.trailing)}: independent virtual-time golden history`,()=>{
  const {result}=timedBurst(config);assert.deepEqual(result,[...(config.leading?[[1,'N','A']]:[]),...(config.trailing?[[5,'N','C']]:[]),[config.trailing?5:4,'C']]);
});
test('S20 RX throttleTime: error bypasses timer and discards pending trailing value',()=>{
  assert.deepEqual(timedBurst({leading:false,trailing:true},'error').result,[[4,'E','fault']]);
});
test('S20 RX throttleTime: cancellation during completion-wait prevents pending output',()=>{
  assert.deepEqual(timedBurst({leading:false,trailing:true},'complete',4).result,[]);
});
test('S20 RX throttleTime: one leading value with trailing enabled does not wait needlessly',()=>{
  const scheduler=new TestScheduler(()=>{}),subject=new Subject(),log=[];
  subject.pipe(throttleTime(10,scheduler,{leading:true,trailing:true})).subscribe({next:v=>log.push([scheduler.frame,'N',v]),complete:()=>log.push([scheduler.frame,'C'])});
  scheduler.schedule(()=>subject.next(1),1);scheduler.schedule(()=>subject.complete(),2);scheduler.flush();assert.deepEqual(log,[[1,'N',1],[2,'C']]);
});
test('S20 RX throttleTime: zero deferred duration is characterization outside positive-duration model',()=>{
  const scheduler=new TestScheduler(()=>{}),subject=new Subject(),log=[];
  const sub=subject.pipe(throttleTime(0,scheduler,{leading:false,trailing:true})).subscribe(observer(log));
  subject.next(1);subject.next(2);assert.deepEqual(log,[]);scheduler.flush();assert.deepEqual(log,[['N',2]]);sub.unsubscribe();
});

test('S20 RX throwIfEmpty: factory is lazy, called once at empty completion, and preserves returned error identity',()=>{
  const log=[],fault={}, {source$,subject}=input(log);let calls=0;const result$=source$.pipe(throwIfEmpty(()=>{calls++;log.push('factory');return fault;}));
  assert.equal(calls,0);result$.subscribe(observer(log));assert.equal(calls,0);subject.complete();
  assert.equal(calls,1);assert.deepEqual(log,['source+','factory',['E',fault],'source-']);assert.equal(log[2][1],fault);
});
test('S20 RX throwIfEmpty: default binding constructs a fresh actual EmptyError per empty subscription',()=>{
  const a=[],b=[];const result$=EMPTY.pipe(throwIfEmpty());result$.subscribe(observer(a));result$.subscribe(observer(b));
  assert.ok(a[0][1] instanceof EmptyError);assert.ok(b[0][1] instanceof EmptyError);assert.notEqual(a[0][1],b[0][1]);
});
test('S20 RX throwIfEmpty: undefined/null values count as presence and are not transformed',()=>{
  const log=[];let calls=0;of(undefined,null).pipe(throwIfEmpty(()=>{calls++;return 'fault';})).subscribe(observer(log));
  assert.deepEqual(log,[['N',undefined],['N',null],['C']]);assert.equal(calls,0);
});
test('S20 RX throwIfEmpty: failed or cancelled source bypasses the factory',()=>{
  for(const terminal of ['error','cancel']){
    const log=[],fault={}, {source$,subject}=input(log);let calls=0;
    const sub=source$.pipe(throwIfEmpty(()=>{calls++;return 'wrong';})).subscribe(observer(log));
    if(terminal==='error')subject.error(fault);else sub.unsubscribe();
    assert.equal(calls,0);assert.deepEqual(notes(log),terminal==='error'?[['E',fault]]:[]);assert.equal(log.at(-1),'source-');
  }
});
test('S20 RX throwIfEmpty: thrown factory value also reaches error by exact identity',()=>{
  const log=[],fault={};EMPTY.pipe(throwIfEmpty(()=>{throw fault;})).subscribe(observer(log));assert.deepEqual(log,[['E',fault]]);assert.equal(log[0][1],fault);
});
test('S20 RX throwIfEmpty: each independent subscription resets the presence bit',()=>{
  const a=[],b=[],subject=new Subject();const result$=subject.pipe(throwIfEmpty(()=> 'empty'));
  result$.subscribe(observer(a));subject.next(1);result$.subscribe(observer(b));subject.complete();
  assert.deepEqual(a,[['N',1],['C']]);assert.deepEqual(b,[['E','empty']]);
});
test('S20 RX throwIfEmpty: returning undefined is a real error payload, not completion',()=>{
  const log=[];EMPTY.pipe(throwIfEmpty(()=>undefined)).subscribe(observer(log));assert.deepEqual(log,[['E',undefined]]);
});
