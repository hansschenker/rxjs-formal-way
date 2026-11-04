import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, EMPTY, of, buffer, bufferCount, bufferTime } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import {
  createBufferModel,createBufferCountModel,createBufferTimeModel,stepModel
} from '../dist/index.js';

const collect=observable=>{
 const values=[];let terminal='open';
 const subscription=observable.subscribe({next:v=>values.push(v),complete:()=>{terminal='complete';},
   error:e=>{terminal=e;}});
 return {values,get terminal(){return terminal;},subscription};
};
const modelResult=(model,events)=>{
 let state=model.initialState(),notes=[],resources=[];
 for(const event of [{type:'subscribe'},...events]){
  const r=stepModel(model,state,event);state=r.state;
  for(const a of r.actions){
   if(a.type==='notify')notes.push(a.notification);
   else if(a.type==='unsubscribe')resources.push(a.resource.id);
  }
 }
 return {notes,state,resources};
};
const nativeResult=(op,word)=>{
 const source=new Subject(),notifier=new Subject(),notes=[],released=[];
 const source$=new Observable(sub=>{const inner=source.subscribe(sub);return ()=>{
   released.push('source');inner.unsubscribe();};});
 const notifier$=new Observable(sub=>{const inner=notifier.subscribe(sub);return ()=>{
   released.push('closing-notifier');inner.unsubscribe();};});
 const sub=source$.pipe(op(notifier$)).subscribe({
   next:value=>notes.push({kind:'N',value}),complete:()=>notes.push({kind:'C'}),
   error:error=>notes.push({kind:'E',error}),
 });
 for(const code of word){
  if(code==='N')notifier.next('boundary');
  else if(code==='D')notifier.complete();
  else if(code==='C')source.complete();
  else if(code==='X')sub.unsubscribe();
  else if(code==='E')source.error('fault');
  else source.next(Number(code));
 }
 return {notes,released};
};
test('S7-BUFFER-NATIVE-01: buffer is lazy and acquires source before notifier',()=>{
 const trace=[];
 const source$=new Observable(()=>{trace.push('subscribe-source');return ()=>trace.push('dispose-source');});
 const closer$=new Observable(()=>{trace.push('subscribe-notifier');return ()=>trace.push('dispose-notifier');});
 const result=source$.pipe(buffer(closer$));
 assert.deepEqual(trace,[]);
 const sub=result.subscribe();
 assert.deepEqual(trace.slice(0,2),['subscribe-source','subscribe-notifier']);
 sub.unsubscribe();
 assert.deepEqual(trace.slice(2),['dispose-source','dispose-notifier']);
});
test('S7-BUFFER-NATIVE-02: notifier emissions output empty and nonempty arrays; completion flushes empty',()=>{
 const source=new Subject(),notifier=new Subject();
 const r=collect(source.pipe(buffer(notifier)));
 notifier.next('x');source.next(1);source.next(2);notifier.next('y');
 source.complete();
 assert.deepEqual(r.values,[[],[1,2],[]]);assert.equal(r.terminal,'complete');
 assert.equal(r.subscription.closed,true);
});
test('S7-BUFFER-NATIVE-03: notifier complete does not flush; error and cancellation discard',()=>{
 const source=new Subject(),notifier=new Subject(),r=collect(source.pipe(buffer(notifier)));
 source.next(1);notifier.complete();source.next(2);
 assert.deepEqual(r.values,[]);source.complete();
 assert.deepEqual(r.values,[[1,2]]);
 const s2=new Subject(),n2=new Subject(),bad={tag:'bad'},f=collect(s2.pipe(buffer(n2)));
 s2.next('x');n2.error(bad);
 assert.strictEqual(f.terminal,bad);assert.deepEqual(f.values,[]);
 const s3=new Subject(),n3=new Subject(),c=collect(s3.pipe(buffer(n3)));
 s3.next(7);c.subscription.unsubscribe();s3.complete();
 assert.deepEqual(c.values,[]);
});
test('S7-BUFFER-NATIVE-04: enumerated source/notifier schedules match guarded buffer model',()=>{
 const letters=['1','2','N'];
 const enumerate=(length,prefix=[])=>length===0?[prefix]:
   letters.flatMap(x=>enumerate(length-1,[...prefix,x]));
 let cases=0;
 for(let length=0;length<=4;length++){
  for(const word of enumerate(length))for(const end of ['C','E','X']){
   const tokens=[...word,end];
   const events=tokens.map(x=>x==='N'?{type:'notifier.next'}:
     x==='C'?{type:'source.complete'}:x==='E'?{type:'source.error',error:'fault'}:
       x==='X'?{type:'cancel'}:{type:'source.next',value:Number(x)});
   const expected=modelResult(createBufferModel(),events);
   const actual=nativeResult(buffer,tokens);
   assert.deepEqual(actual.notes,expected.notes,JSON.stringify(tokens));
   assert.deepEqual(actual.released.slice().sort(),expected.resources.slice().sort(),JSON.stringify(tokens));
   cases++;
  }
 }
 assert.ok(cases>=360);
});
test('S7-BUFFERCOUNT-NATIVE-01: overlaps, gaps and residual flush',()=>{
 assert.deepEqual(collect(of(1,2,3,4,5).pipe(bufferCount(3,1))).values,
   [[1,2,3],[2,3,4],[3,4,5],[4,5],[5]]);
 assert.deepEqual(collect(of(1,2,3,4,5).pipe(bufferCount(2,4))).values,
   [[1,2],[5]]);
 assert.deepEqual(collect(of(1,2,3,4,5).pipe(bufferCount(2))).values,
   [[1,2],[3,4],[5]]);
 assert.deepEqual(collect(EMPTY.pipe(bufferCount(3))).values,[]);
});
test('S7-BUFFERCOUNT-NATIVE-02: own buffer state per subscription, thrown source/error and cancellation',()=>{
 const source=new Subject(),shared=source.pipe(bufferCount(2)),a=collect(shared);
 source.next(1);
 const b=collect(shared);
 source.next(2);source.next(3);source.complete();
 assert.deepEqual(a.values,[[1,2],[3]]);
 assert.deepEqual(b.values,[[2,3]]);
 assert.notStrictEqual(a.values[0],b.values[0]);
 const error={reason:'failure'},s2=new Subject(),r=collect(s2.pipe(bufferCount(3)));
 s2.next(9);s2.error(error);assert.strictEqual(r.terminal,error);assert.deepEqual(r.values,[]);
 const s3=new Subject(),c=collect(s3.pipe(bufferCount(3)));
 s3.next(1);c.subscription.unsubscribe();s3.complete();assert.deepEqual(c.values,[]);
});
test('S7-BUFFERCOUNT-NATIVE-03: model/native bounded word comparison for size/stride profiles',()=>{
 const alphabet=[1,2,3];let cases=0;
 const words=(n,p=[])=>n===0?[p]:alphabet.flatMap(x=>words(n-1,[...p,x]));
 for(const [size,stride] of [[1,1],[2,2],[3,1],[3,2],[2,4]]){
  for(let count=0;count<=4;count++)for(const word of words(count))for(const end of ['C','E','X']){
   const model=createBufferCountModel(size,stride);
   const events=[...word.map(value=>({type:'source.next',value})),end==='C'?{type:'source.complete'}:
     end==='E'?{type:'source.error',error:'fault'}:{type:'cancel'}];
   const expected=modelResult(model,events);
   const source=new Subject(),observed=[],sub=source.pipe(bufferCount(size,stride)).subscribe({
     next:value=>observed.push({kind:'N',value}),complete:()=>observed.push({kind:'C'}),
     error:error=>observed.push({kind:'E',error}),
   });
   for(const value of word)source.next(value);
   if(end==='C')source.complete();else if(end==='E')source.error('fault');else sub.unsubscribe();
   assert.deepEqual(observed,expected.notes,JSON.stringify([size,stride,word,end]));
   cases++;
  }
 }
 assert.ok(cases>=1800);
});
const schedule=(actions,operator)=>{
 const scheduler=new TestScheduler(()=>{});
 const source=new Subject(),notes=[],teardown=[];
 const wrapped=new Observable(sub=>{const inner=source.subscribe(sub);
   return ()=>{teardown.push(['source',scheduler.now()]);inner.unsubscribe();};});
 const sub=wrapped.pipe(operator(scheduler)).subscribe({
  next:value=>notes.push([scheduler.now(),'N',value]),
  complete:()=>notes.push([scheduler.now(),'C']),
  error:value=>notes.push([scheduler.now(),'E',value]),
 });
 for(const [at,code,value] of actions){
  scheduler.schedule(()=>{
   if(code==='N')source.next(value);
   else if(code==='C')source.complete();
   else if(code==='E')source.error(value);
   else sub.unsubscribe();
  },at);
 }
 scheduler.flush();
 return {notes,teardown,closed:sub.closed};
};
test('S7-BUFFERTIME-NATIVE-01: fixed window fires on scheduler, including empty, then completion flushes',()=>{
 const r=schedule([[1,'N',1],[2,'N',2],[5,'C']],scheduler=>bufferTime(3,scheduler));
 assert.deepEqual(r.notes,[[3,'N',[1,2]],[5,'N',[]],[5,'C']]);
 assert.deepEqual(r.teardown,[['source',5]]);
 assert.equal(r.closed,true);
});
test('S7-BUFFERTIME-NATIVE-02: max-size early closure restarts without duplicating trigger',()=>{
 const r=schedule([[1,'N',1],[2,'N',2],[3,'N',3],[4,'C']],
   scheduler=>bufferTime(10,null,2,scheduler));
 assert.deepEqual(r.notes,[[2,'N',[1,2]],[4,'N',[3]],[4,'C']]);
});
test('S7-BUFFERTIME-NATIVE-03: creation interval overlaps independent windows',()=>{
 const r=schedule([[1,'N',1],[3,'N',2],[5,'C']],
   scheduler=>bufferTime(4,2,undefined,scheduler));
 assert.deepEqual(r.notes,[[4,'N',[1,2]],[5,'N',[2]],[5,'N',[]],[5,'C']]);
});
test('S7-BUFFERTIME-NATIVE-04: error and cancellation never flush retained values',()=>{
 for(const end of ['E','X']){
  const r=schedule([[1,'N',7],[2,end,'fault']],scheduler=>bufferTime(4,scheduler));
  assert.deepEqual(r.notes,end==='E'?[[2,'E','fault']]:[]);
  assert.equal(r.closed,true);
  assert.deepEqual(r.teardown,[['source',2]]);
 }
});
test('S7-BUFFERTIME-NATIVE-05: timer/window ownership is subscription-local',()=>{
 const scheduler=new TestScheduler(()=>{});
 const source=new Subject(),shared=source.pipe(bufferTime(3,scheduler)),a=[],b=[];
 shared.subscribe(value=>a.push([scheduler.now(),value]));
 scheduler.schedule(()=>source.next(1),1);
 scheduler.schedule(()=>shared.subscribe(value=>b.push([scheduler.now(),value])),2);
 scheduler.schedule(()=>source.next(2),3);
 scheduler.schedule(()=>source.complete(),4);
 scheduler.flush();
 assert.deepEqual(a,[[3,[1,2]],[4,[]]]);
 assert.deepEqual(b,[[4,[2]]]);
});
