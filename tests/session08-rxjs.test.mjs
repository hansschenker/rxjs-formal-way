import test from 'node:test';
import assert from 'node:assert/strict';
import {
 Subject, Observable, of, EMPTY, throwError, bufferToggle, bufferWhen,
 catchError, combineLatestAll, combineAll, finalize, take,
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import {
 createBufferToggleModel,createBufferWhenModel,createCatchErrorModel,createCombineLatestAllModel,
 stepModel
} from '../dist/index.js';

const ref=(id,generation)=>({id,generation});
const capture=observable=>{
 const notifications=[];
 const subscription=observable.subscribe({
  next:value=>notifications.push({kind:'N',value}),
  complete:()=>notifications.push({kind:'C'}),
  error:error=>notifications.push({kind:'E',error}),
 });
 return {notifications,subscription};
};
const modelRun=(model,events)=>{
 let state=model.initialState(),actions=[];
 const feed=event=>{
  const result=stepModel(model,state,event);state=result.state;actions.push(...result.actions);
 };
 feed({type:'subscribe'});
 for(const event of events)feed(event);
 return {notifications:actions.filter(a=>a.type==='notify').map(a=>a.notification),
  releases:actions.filter(a=>a.type==='unsubscribe').map(a=>a.resource.id),state};
};
test('S8-BUFFERTOGGLE-NATIVE-01: openings subscribed before source; no opening means no output',()=>{
 const order=[];
 const openings=new Observable(s=>{order.push('open');s.complete();return ()=>order.push('open-final');});
 const source=new Observable(s=>{order.push('source');s.next(1);s.complete();return ()=>order.push('source-final');});
 const out=capture(source.pipe(bufferToggle(openings,()=>EMPTY)));
 assert.deepEqual(out.notifications,[{kind:'C'}]);
 assert.ok(order.indexOf('open')<order.indexOf('source'));
});
test('S8-BUFFERTOGGLE-NATIVE-02: overlap, independent closing and source-completion flush',()=>{
 const src=new Subject(),openings=new Subject(),closing=new Map(),calls=[];
 const out=capture(src.pipe(bufferToggle(openings,k=>{
  calls.push(k);const s=new Subject();closing.set(k,s);return s;
 })));
 src.next('before');
 openings.next('a');src.next(1);openings.next('b');src.next(2);
 closing.get('a').next('close-a');src.next(3);src.complete();
 assert.deepEqual(calls,['a','b']);
 assert.deepEqual(out.notifications,[{kind:'N',value:[1,2]},{kind:'N',value:[2,3]},{kind:'C'}]);
 assert.equal(out.subscription.closed,true);
});
test('S8-BUFFERTOGGLE-NATIVE-03: inner empty completion and openings completion never flush',()=>{
 const src=new Subject(),open=new Subject(),closer=new Subject();
 const out=capture(src.pipe(bufferToggle(open,()=>closer)));
 open.next('a');src.next(1);closer.complete();open.complete();src.next(2);
 assert.deepEqual(out.notifications,[]);
 src.complete();
 assert.deepEqual(out.notifications,[{kind:'N',value:[1,2]},{kind:'C'}]);
});
test('S8-BUFFERTOGGLE-NATIVE-04: selector/closing/opening/source error, cancellation discard buffered values',()=>{
 for(const where of ['selector','closing','openings','source','cancel']){
  const fault={where},src=new Subject(),open=new Subject(),closing=new Subject();
  const out=capture(src.pipe(bufferToggle(open,()=>{if(where==='selector')throw fault;return closing;})));
  open.next('x');src.next(7);
  if(where==='closing')closing.error(fault);
  if(where==='openings')open.error(fault);
  if(where==='source')src.error(fault);
  if(where==='cancel')out.subscription.unsubscribe();
  assert.deepEqual(out.notifications,where==='cancel'?[]:[{kind:'E',error:fault}],where);
  assert.equal(out.subscription.closed,true);
 }
});
test('S8-BUFFERWHEN-NATIVE-01: closing selector called before source, first buffer is initially empty',()=>{
 const calls=[],closed=new Subject();
 const src=new Observable(s=>{calls.push('source-subscribe');s.next(7);s.complete();});
 const out=capture(src.pipe(bufferWhen(()=>{calls.push('closing-selector');return closed;})));
 assert.deepEqual(calls,['closing-selector','source-subscribe']);
 assert.deepEqual(out.notifications,[{kind:'N',value:[7]},{kind:'C'}]);
});
test('S8-BUFFERWHEN-NATIVE-02: repeated closing creates new selector, including empty arrays',()=>{
 const src=new Subject(),closers=[];
 const out=capture(src.pipe(bufferWhen(()=>{
  const c=new Subject();closers.push(c);return c;
 })));
 assert.equal(closers.length,1);
 closers[0].next(1);assert.equal(closers.length,2);
 src.next('a');src.next('b');closers[1].next(1);
 assert.equal(closers.length,3);src.next('c');src.complete();
 assert.deepEqual(out.notifications,[{kind:'N',value:[]},{kind:'N',value:['a','b']},
  {kind:'N',value:['c']},{kind:'C'}]);
});
test('S8-BUFFERWHEN-NATIVE-03: closing completion does not flush, error and cancellation do not flush',()=>{
 const src=new Subject(),close=new Subject(),out=capture(src.pipe(bufferWhen(()=>close)));
 src.next(1);close.complete();src.next(2);
 assert.deepEqual(out.notifications,[]);
 src.complete();
 assert.deepEqual(out.notifications,[{kind:'N',value:[1,2]},{kind:'C'}]);
 const fail={x:1},source=new Subject(),c=new Subject(),failed=capture(source.pipe(bufferWhen(()=>c)));
 source.next(5);c.error(fail);
 assert.deepEqual(failed.notifications,[{kind:'E',error:fail}]);
 const stop=new Subject(),d=new Subject(),cancelled=capture(stop.pipe(bufferWhen(()=>d)));
 stop.next(9);cancelled.subscription.unsubscribe();stop.complete();
 assert.deepEqual(cancelled.notifications,[]);
});
test('S8-BUFFERWHEN-NATIVE-04: throwing selector terminates without subscribing source',()=>{
 const failure={message:'selector'};
 let sources=0;
 const original=new Observable(sub=>{sources++;sub.next(1);sub.complete();});
 const out=capture(original.pipe(bufferWhen(()=>{throw failure;})));
 assert.equal(sources,0);
 assert.deepEqual(out.notifications,[{kind:'E',error:failure}]);
});
test('S8-CATCH-NATIVE-01: source errors are replaced, preserving source finalization ordering',()=>{
 const sequence=[],source=new Subject(),fallback=new Subject();
 const out=capture(source.pipe(
  finalize(()=>sequence.push('source-finalized')),
  catchError((error,caught)=>{
   assert.equal(error,'fault');
   assert.ok(caught&&typeof caught.subscribe==='function');
   sequence.push('selector');
   return new Observable(sub=>{
    sequence.push('replacement-connected');
    return fallback.subscribe(sub);
   });
  })
 ));
 source.next(1);source.error('fault');fallback.next('saved');fallback.complete();
 assert.deepEqual(out.notifications,[{kind:'N',value:1},{kind:'N',value:'saved'},{kind:'C'}]);
 assert.deepEqual(sequence,['selector','source-finalized','replacement-connected']);
 assert.equal(out.subscription.closed,true);
});
test('S8-CATCH-NATIVE-02: synchronous source error tears down before replacement emission',()=>{
 const order=[];
 const source=new Observable(sub=>{sub.error('oops');return ()=>order.push('source-teardown');});
 const out=capture(source.pipe(catchError(()=>{
  order.push('selector');
  return new Observable(sub=>{order.push('replacement');sub.next(2);sub.complete();});
 })));
 assert.deepEqual(out.notifications,[{kind:'N',value:2},{kind:'C'}]);
 assert.deepEqual(order,['selector','source-teardown','replacement']);
});
test('S8-CATCH-NATIVE-03: replacement error is not intercepted again; selectors may throw',()=>{
 const fault={message:'replacement'},src=new Subject(),replacement=new Subject(),calls=[];
 const out=capture(src.pipe(catchError(e=>{calls.push(e);return replacement;})));
 src.error('original');replacement.error(fault);
 assert.deepEqual(calls,['original']);
 assert.deepEqual(out.notifications,[{kind:'E',error:fault}]);
 const failure={x:2},thrown=capture(throwError(()=>failure).pipe(catchError(()=>{throw failure;})));
 assert.deepEqual(thrown.notifications,[{kind:'E',error:failure}]);
 assert.deepEqual(capture(of(1,2).pipe(catchError(()=>of(3)))).notifications,
  [{kind:'N',value:1},{kind:'N',value:2},{kind:'C'}]);
});
test('S8-CATCH-NATIVE-04: downstream take cancels active recovery source',()=>{
 let teardown=0;
 const replacement=new Observable(sub=>{sub.next(10);sub.next(20);return ()=>{teardown++};});
 const out=capture(throwError(()=>new Error('x')).pipe(catchError(()=>replacement),take(1)));
 assert.deepEqual(out.notifications,[{kind:'N',value:10},{kind:'C'}]);
 assert.equal(teardown,1);
});
test('S8-COMBINE-NATIVE-01: combineAll is exactly the same exported function as combineLatestAll',()=>{
 assert.strictEqual(combineAll,combineLatestAll);
});
for(const [name,operator] of [['combineAll',combineAll],['combineLatestAll',combineLatestAll]]){
 test('S8-COMBINE '+name+': wait for outer completion, join only when every inner ready',()=>{
  const outer=new Subject(),left=new Subject(),right=new Subject(),connect=[];
  const wrap=(id,source)=>new Observable(sub=>{
   connect.push('connect-'+id);const s=source.subscribe(sub);
   return ()=>{connect.push('release-'+id);s.unsubscribe();};
  });
  const out=capture(outer.pipe(operator()));
  outer.next(wrap('a',left));outer.next(wrap('b',right));
  left.next(0);right.next(0);
  assert.deepEqual(connect,[]);
  outer.complete();
  assert.deepEqual(connect,['connect-a','connect-b']);
  left.next(1);left.next(2);
  assert.deepEqual(out.notifications,[]);
  right.next(10);left.next(3);right.next(20);
  assert.deepEqual(out.notifications,[{kind:'N',value:[2,10]},{kind:'N',value:[3,10]},
   {kind:'N',value:[3,20]}]);
  left.complete();right.complete();
  assert.deepEqual(out.notifications.at(-1),{kind:'C'});
  assert.equal(out.subscription.closed,true);
 });
 test('S8-COMBINE '+name+': empty outer and empty completed inner never fabricate tuple',()=>{
  assert.deepEqual(capture(EMPTY.pipe(operator())).notifications,[{kind:'C'}]);
  const left=new Subject(),right=new Subject(),outer=new Subject();
  const out=capture(outer.pipe(operator()));
  outer.next(left);outer.next(right);outer.complete();
  left.complete();right.next(5);
  assert.deepEqual(out.notifications,[]);
  right.complete();
  assert.deepEqual(out.notifications,[{kind:'C'}]);
 });
 test('S8-COMBINE '+name+': inner errors and explicit unsubscribe release all subscriptions',()=>{
  const error={name:'failure'},outer=new Subject(),left=new Subject(),right=new Subject();
  const out=capture(outer.pipe(operator()));
  outer.next(left);outer.next(right);outer.complete();
  left.next(1);right.error(error);
  assert.deepEqual(out.notifications,[{kind:'E',error}]);
  assert.equal(left.observers.length,0);
  const o2=new Subject(),a=new Subject(),b=new Subject(),cancelled=capture(o2.pipe(operator()));
  o2.next(a);o2.next(b);o2.complete();
  cancelled.subscription.unsubscribe();
  assert.equal(a.observers.length,0);assert.equal(b.observers.length,0);
  assert.deepEqual(cancelled.notifications,[]);
 });
}
test('S8-SCHEDULER: equal-time cross-stream order is explicit; no operator adds a clock',()=>{
 const scheduler=new TestScheduler(()=>{}),outer=new Subject(),a=new Subject(),b=new Subject();
 const events=[],out=outer.pipe(combineLatestAll()).subscribe({
  next:value=>events.push([scheduler.now(),'N',value]),
  complete:()=>events.push([scheduler.now(),'C'])
 });
 scheduler.schedule(()=>{outer.next(a);outer.next(b);outer.complete();},1);
 scheduler.schedule(()=>a.next(1),2);
 scheduler.schedule(()=>b.next(2),2);
 scheduler.schedule(()=>a.next(3),2);
 scheduler.schedule(()=>a.complete(),3);
 scheduler.schedule(()=>b.complete(),4);
 scheduler.flush();
 assert.deepEqual(events,[[2,'N',[1,2]],[2,'N',[3,2]],[4,'C']]);
 assert.equal(out.closed,true);
});
test('S8-BOUNDED-DIFF: selector buffer and deferred join predictions match independently executed RxJS',()=>{
 let cases=0;
 const words=(n,alphabet,p=[])=>n===0?[p]:alphabet.flatMap(x=>words(n-1,alphabet,[...p,x]));
 for(let length=0;length<=4;length++)for(const word of words(length,['N','K','Z'])){
  // BufferWhen: N=source next, K=closing next, Z=source next with a different value.
  const src=new Subject(),closers=[],out=capture(src.pipe(bufferWhen(()=>{
   const s=new Subject();closers.push(s);return s;
  })));
  const modelEvents=[{type:'callback.return',resource:ref('selector',0)}];
  let current=0;
  for(const symbol of word){
   if(symbol==='K'){
    closers[current].next(0);
    modelEvents.push({type:'closing.next',resource:ref('closing',current)});
    current++;
    modelEvents.push({type:'callback.return',resource:ref('selector',current)});
   }else{
    const value=symbol==='N'?1:2;src.next(value);
    modelEvents.push({type:'source.next',value});
   }
  }
  src.complete();modelEvents.push({type:'source.complete'});
  const predicted=modelRun(createBufferWhenModel(),modelEvents);
  assert.deepEqual(out.notifications,predicted.notifications,JSON.stringify(word));
  cases++;
 }
 for(let length=0;length<=3;length++)for(const word of words(length,['A','B','C'])){
  const outer=new Subject(),a=new Subject(),b=new Subject(),out=capture(outer.pipe(combineLatestAll()));
  outer.next(a);outer.next(b);outer.complete();
  const events=[{type:'outer.next',value:'A'},{type:'outer.next',value:'B'},{type:'outer.complete'}];
  for(const code of word){
   const n=code==='A'?0:1,value=code==='A'?1:code==='B'?2:3;
   (n===0?a:b).next(value);
   events.push({type:'inner.next',resource:ref('inner',n),value});
  }
  a.complete();b.complete();
  events.push({type:'inner.complete',resource:ref('inner',0)});
  events.push({type:'inner.complete',resource:ref('inner',1)});
  const predicted=modelRun(createCombineLatestAllModel(),events);
  assert.deepEqual(out.notifications,predicted.notifications,JSON.stringify(word));
  cases++;
 }
 assert.ok(cases>=150);
});
