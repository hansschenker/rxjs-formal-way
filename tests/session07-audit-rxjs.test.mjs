import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, EMPTY, of, audit, auditTime } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { createAuditModel,createAuditTimeModel,stepModel } from '../dist/index.js';

const observe=observable=>{
 const values=[];let completed=false,errorValue=null;
 const subscription=observable.subscribe({
  next:value=>values.push(value),complete:()=>{completed=true;},
  error:error=>{errorValue=error;},
 });
 return {values,get completed(){return completed;},get error(){return errorValue;},subscription};
};
const timer=(commands,duration=3)=>{
 const scheduler=new TestScheduler(()=>{});
 const source=new Subject(),out=[],teardowns=[];
 const source$=new Observable(sub=>{const inner=source.subscribe(sub);
  return ()=>{teardowns.push(scheduler.now());inner.unsubscribe();};});
 const subscription=source$.pipe(auditTime(duration,scheduler)).subscribe({
  next:v=>out.push([scheduler.now(),'N',v]),complete:()=>out.push([scheduler.now(),'C']),
  error:e=>out.push([scheduler.now(),'E',e]),
 });
 for(const [time,type,value] of commands)scheduler.schedule(()=>{
  if(type==='N')source.next(value);
  else if(type==='C')source.complete();
  else if(type==='E')source.error(value);
  else subscription.unsubscribe();
 },time);
 scheduler.flush();
 return {out,teardowns,closed:subscription.closed};
};
test('S7-AUDIT-NATIVE-01: lazy selector, latest value and first duration next emission',()=>{
 let acquisitions=0,selectorCalls=[];
 const source=new Subject(),duration=[];
 const source$=new Observable(sub=>{acquisitions++;return source.subscribe(sub);});
 const result=source$.pipe(audit(value=>{
  selectorCalls.push(value);const d=new Subject();duration.push(d);return d;
 }));
 assert.equal(acquisitions,0);
 const r=observe(result);
 assert.equal(acquisitions,1);
 source.next(1);source.next(2);source.next(3);
 assert.deepEqual(selectorCalls,[1]);
 assert.deepEqual(r.values,[]);
 duration[0].next('release');
 assert.deepEqual(r.values,[3]);
 source.next(4);assert.deepEqual(selectorCalls,[1,4]);
 source.complete();
 assert.equal(r.completed,false);
 duration[1].next('release');
 assert.deepEqual(r.values,[3,4]);
 assert.equal(r.completed,true);
});
test('S7-AUDIT-NATIVE-02: inner completion without next never flushes; source completion may discard',()=>{
 const source=new Subject(),duration=[];
 const r=observe(source.pipe(audit(()=>{
  const d=new Subject();duration.push(d);return d;
 })));
 source.next('a');duration[0].complete();
 assert.deepEqual(r.values,[]);assert.equal(r.completed,false);
 source.next('b');duration[1].complete();
 source.complete();
 assert.deepEqual(r.values,[]);assert.equal(r.completed,true);
 const s2=new Subject(),d2=new Subject(),r2=observe(s2.pipe(audit(()=>d2)));
 s2.next(5);s2.complete();assert.equal(r2.completed,false);
 d2.complete();assert.deepEqual(r2.values,[]);assert.equal(r2.completed,true);
});
test('S7-AUDIT-NATIVE-03: duration and selector throw propagate identity with no pending flush',()=>{
 const failure={code:'duration-failure'};
 const source=new Subject(),dur=new Subject();
 const r=observe(source.pipe(audit(()=>dur)));
 source.next('a');dur.error(failure);
 assert.strictEqual(r.error,failure);
 assert.deepEqual(r.values,[]);
 assert.equal(r.subscription.closed,true);
 const thrown={code:'selector-throw'},s2=new Subject(),r2=observe(s2.pipe(audit(()=>{throw thrown;})));
 s2.next(1);assert.strictEqual(r2.error,thrown);assert.deepEqual(r2.values,[]);
});
test('S7-AUDIT-NATIVE-04: cancellation releases active duration without output',()=>{
 const source=new Subject(),duration=new Subject(),r=observe(source.pipe(audit(()=>duration)));
 source.next(1);
 assert.equal(duration.observed,true);
 r.subscription.unsubscribe();
 assert.equal(duration.observed,false);
 source.complete();duration.next('x');
 assert.deepEqual(r.values,[]);assert.equal(r.completed,false);
});
test('S7-AUDIT-NATIVE-05: synchronous source completion with no pending duration completes immediately',()=>{
 assert.deepEqual(observe(EMPTY.pipe(audit(()=>of(1)))).values,[]);
 assert.equal(observe(EMPTY.pipe(audit(()=>of(1)))).completed,true);
});
test('S7-AUDITTIME-NATIVE-01: timer owns window; new values replace without postponing delivery',()=>{
 const r=timer([[1,'N','a'],[2,'N','b'],[3,'N','c'],[5,'N','d'],[9,'C']],3);
 assert.deepEqual(r.out,[[4,'N','c'],[8,'N','d'],[9,'C']]);
 assert.deepEqual(r.teardowns,[9]);
});
test('S7-AUDITTIME-NATIVE-02: completion waits for active timer, unlike debounceTime',()=>{
 const r=timer([[1,'N','a'],[2,'N','b'],[3,'C']],3);
 assert.deepEqual(r.out,[[4,'N','b'],[4,'C']]);
 assert.equal(r.closed,true);
});
test('S7-AUDITTIME-NATIVE-03: error and cancellation discard active window and stop timer',()=>{
 for(const type of ['E','X']){
  const r=timer([[1,'N','a'],[2,type,'failure']],3);
  assert.deepEqual(r.out,type==='E'?[[2,'E','failure']]:[]);
  assert.deepEqual(r.teardowns,[2]);assert.equal(r.closed,true);
 }
});
test('S7-AUDITTIME-NATIVE-04: duration timer and source have separate subscription lifecycle',()=>{
 const r=timer([[1,'N',1],[2,'C']],3);
 assert.deepEqual(r.out,[[4,'N',1],[4,'C']]);
 assert.deepEqual(r.teardowns,[2]);
});
test('S7-AUDITTIME-NATIVE-05: multiple subscriptions have separate timers',()=>{
 const scheduler=new TestScheduler(()=>{});
 const source=new Subject(),first=[],second=[];
 source.pipe(auditTime(3,scheduler)).subscribe(v=>first.push([scheduler.now(),v]));
 scheduler.schedule(()=>source.next(1),1);
 scheduler.schedule(()=>source.pipe(auditTime(3,scheduler)).subscribe(v=>second.push([scheduler.now(),v])),2);
 scheduler.schedule(()=>source.next(2),3);
 scheduler.schedule(()=>source.next(3),7);
 scheduler.schedule(()=>source.complete(),11);
 scheduler.flush();
 assert.deepEqual(first,[[4,2],[10,3]]);
 assert.deepEqual(second,[[6,2],[10,3]]);
});
test('S7-AUDITTIME-NATIVE-06: timer model and RxJS agree for bounded two-value schedules',()=>{
 const e=(type,now,fields={})=>({type,now,...fields});
 const T=id=>({id:'audit-timer',generation:id});
 const extract=actions=>actions.filter(a=>a.type==='notify').map(a=>a.notification);
 let cases=0;
 for(let first=1;first<=3;first++)for(let second=first;second<=5;second++)for(let end=second+1;end<=8;end++){
  // Keep the second source next within the first window; source may complete before or after its timer.
  if(second>=first+3)continue;
  const model=createAuditTimeModel(3);
  let state=model.initialState(),notes=[];
  for(const event of [
   e('subscribe',0),e('source.next',first,{value:1}),e('source.next',second,{value:2}),
   ...(end<first+3?[e('source.complete',end),e('timer.fire',first+3,{resource:T(0)})]:
     [e('timer.fire',first+3,{resource:T(0)}),e('source.complete',end)]),
  ]){
   const r=stepModel(model,state,event);state=r.state;notes.push(...extract(r.actions));
  }
  const actual=timer([[first,'N',1],[second,'N',2],[end,'C']],3);
  assert.deepEqual(actual.out.map(x=>x.slice(1)),notes.map(n=>n.kind==='N'?['N',n.value]:['C']),
    JSON.stringify({first,second,end}));
  cases++;
 }
 assert.ok(cases>=20);
});
