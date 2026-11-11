import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, of, EMPTY, throwError, defer, finalize } from 'rxjs';
import { materialize, merge as mergePipeable, flatMap, mergeMap, mergeMapTo, mergeScan } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

const collect=stream=>{
 const events=[];
 const subscription=stream.subscribe({
  next:value=>events.push({kind:'N',value}),
  error:error=>events.push({kind:'E',error}),
  complete:()=>events.push({kind:'C'}),
 });
 return {events,subscription};
};
const values=events=>events.filter(x=>x.kind==='N').map(x=>x.value);
const normalize=events=>events.map(e=>e.kind==='N'
 ?({kind:'N',value:e.value.kind?{kind:e.value.kind,value:e.value.value,error:e.value.error,hasValue:e.value.hasValue}:e.value})
 :e);

test('S14-NATIVE MATERIALIZE: wraps each next in Notification value with kind and hasValue',()=>{
 const token=Object.freeze({id:1});
 const out=collect(of(token,undefined).pipe(materialize()));
 const notes=values(out.events);
 assert.equal(notes.length,3);
 assert.strictEqual(notes[0].value,token);assert.equal(notes[0].kind,'N');assert.equal(notes[0].hasValue,true);
 assert.equal(notes[1].kind,'N');assert.equal(notes[1].hasValue,true);
 assert.strictEqual(notes[1].value,undefined);
 assert.equal(notes[2].kind,'C');assert.equal(notes[2].hasValue,false);
 assert.equal(out.events.at(-1).kind,'C');
});
test('S14-NATIVE MATERIALIZE: source error becomes E value followed by normal completion',()=>{
 const err=Object.freeze({failure:'same'});
 const out=collect(throwError(()=>err).pipe(materialize()));
 assert.deepEqual(out.events.map(x=>x.kind),['N','C']);
 assert.equal(out.events[0].value.kind,'E');
 assert.strictEqual(out.events[0].value.error,err);
 assert.equal(out.events[0].value.hasValue,false);
});
test('S14-NATIVE MATERIALIZE: empty source yields just C value and result complete',()=>{
 const out=collect(EMPTY.pipe(materialize()));
 assert.deepEqual(out.events.map(x=>x.kind),['N','C']);
 assert.equal(out.events[0].value.kind,'C');
});
test('S14-NATIVE MATERIALIZE: cancellation does not invent terminal value',()=>{
 const src=new Subject(),seen=collect(src.pipe(materialize()));
 src.next('a');seen.subscription.unsubscribe();src.next('b');src.complete();
 assert.deepEqual(values(seen.events).map(n=>n.kind),['N']);
 assert.equal(src.observed,false);
});
test('S14-NATIVE MATERIALIZE: virtual scheduler retains next and terminal frames',()=>{
 const scheduler=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
 scheduler.run(({cold,expectObservable})=>{
  const source=cold('--a--b--|',{a:1,b:2});
  expectObservable(source.pipe(materialize(),mergeMap(n=>of(n.kind)))).toBe('--a--b--(c|)',{a:'N',b:'N',c:'C'});
 });
});
test('S14-NATIVE MERGE: piped source and supplied inputs interleave by source arrival order',()=>{
 const a=new Subject(),b=new Subject(),c=new Subject(),result=collect(a.pipe(mergePipeable(b,c)));
 b.next('B');a.next('A');c.next('C');a.complete();b.complete();
 assert.deepEqual(values(result.events),['B','A','C']);
 assert.notEqual(result.events.at(-1).kind,'C');
 c.complete();
 assert.equal(result.events.at(-1).kind,'C');
});
test('S14-NATIVE MERGE: concurrency 2 postpones subscription to third input until slot frees',()=>{
 const a=new Subject(),b=new Subject(),c=new Subject();
 const out=collect(a.pipe(mergePipeable(b,c,2)));
 assert.equal(a.observed,true);assert.equal(b.observed,true);assert.equal(c.observed,false);
 a.next(1);b.next(10);a.complete();
 assert.equal(c.observed,true);c.next(20);
 b.complete();c.complete();
 assert.deepEqual(out.events,[{kind:'N',value:1},{kind:'N',value:10},{kind:'N',value:20},{kind:'C'}]);
});
test('S14-NATIVE MERGE: finite sources are subscribed in argument order',()=>{
 const calls=[];
 const track=(name,value)=>defer(()=>{calls.push(name);return of(value);});
 const out=collect(track('original',0).pipe(mergePipeable(track('other1',1),track('other2',2),1)));
 assert.deepEqual(values(out.events),[0,1,2]);
 assert.deepEqual(calls,['original','other1','other2']);
});
test('S14-NATIVE MERGE: any input error cancels all active sources, preserving error identity',()=>{
 const a=new Subject(),b=new Subject(),c=new Subject(),err={fatal:true};
 const out=collect(a.pipe(mergePipeable(b,c,2)));
 b.error(err);
 assert.deepEqual(out.events,[{kind:'E',error:err}]);
 assert.equal(a.observed,false);assert.equal(c.observed,false);
});
test('S14-NATIVE MERGE: consumer cancellation releases all active sources with no output terminal',()=>{
 const a=new Subject(),b=new Subject(),c=new Subject();
 const out=collect(a.pipe(mergePipeable(b,c,2)));
 a.next('seen');out.subscription.unsubscribe();b.next('late');a.complete();b.complete();
 assert.deepEqual(out.events,[{kind:'N',value:'seen'}]);
 assert.equal(a.observed,false);assert.equal(b.observed,false);assert.equal(c.observed,false);
});
test('S14-NATIVE FLATMAP: public deprecated export is exact mergeMap function',()=>{
 assert.strictEqual(flatMap,mergeMap);
});
test('S14-NATIVE FLATMAP: overlapping inners are forwarded as they arrive',()=>{
 const outer=new Subject(),a=new Subject(),b=new Subject();
 const out=collect(outer.pipe(flatMap(v=>v===1?a:b,2)));
 outer.next(1);outer.next(2);outer.complete();
 b.next('B');a.next('A');a.complete();b.complete();
 assert.deepEqual(out.events,[{kind:'N',value:'B'},{kind:'N',value:'A'},{kind:'C'}]);
});
test('S14-NATIVE FLATMAP: an inner failure cancels other active inners and outer',()=>{
 const outer=new Subject(),a=new Subject(),b=new Subject(),err=Symbol('inner failure');
 const out=collect(outer.pipe(flatMap(v=>v===1?a:b,2)));
 outer.next(1);outer.next(2);a.error(err);
 assert.deepEqual(out.events,[{kind:'E',error:err}]);
 assert.equal(outer.observed,false);assert.equal(b.observed,false);
});
test('S14-NATIVE MERGEMAPTO: each outer arrival subscribes separately to the same cold Observable',()=>{
 let subscriptions=0;
 const constant=defer(()=>{subscriptions++;return of(subscriptions);});
 const out=collect(of(1,2,3).pipe(mergeMapTo(constant,2)));
 assert.equal(subscriptions,3);
 assert.deepEqual(values(out.events),[1,2,3]);
 assert.equal(out.events.at(-1).kind,'C');
});
test('S14-NATIVE MERGEMAPTO: identical hot Subject binding permits concurrent subscriptions',()=>{
 const outer=new Subject(),inner=new Subject(),out=collect(outer.pipe(mergeMapTo(inner,2)));
 outer.next('one');outer.next('two');
 assert.equal(inner.observers.length,2);
 inner.next('X');outer.complete();inner.complete();
 assert.deepEqual(out.events,[{kind:'N',value:'X'},{kind:'N',value:'X'},{kind:'C'}]);
});
test('S14-NATIVE MERGEMAPTO: bounded third occurrence waits for active completion',()=>{
 let active=0,started=0;const slots=[];
 const constant=new Observable(sub=>{active++;started++;slots.push(sub);return ()=>{active--;}});
 const outer=new Subject(),out=collect(outer.pipe(mergeMapTo(constant,2)));
 outer.next(1);outer.next(2);outer.next(3);
 assert.equal(active,2);assert.equal(started,2);
 slots[0].complete();
 assert.equal(started,3);assert.equal(active,2);
 outer.complete();slots[1].complete();slots[2].complete();
 assert.equal(active,0);assert.equal(out.events.at(-1).kind,'C');
});
test('S14-NATIVE MERGEMAPTO: cancellation releases multiple occurrences without completion',()=>{
 const outer=new Subject(),inner=new Subject(),out=collect(outer.pipe(mergeMapTo(inner,2)));
 outer.next(1);outer.next(2);out.subscription.unsubscribe();inner.next('late');
 assert.deepEqual(out.events,[]);
 assert.equal(outer.observed,false);assert.equal(inner.observed,false);
});
test('S14-NATIVE MERGESCAN: accumulator snapshots follow inner next, not outer emission count',()=>{
 const outer=new Subject(),a=new Subject(),b=new Subject(),c=new Subject(),calls=[];
 const out=collect(outer.pipe(mergeScan((acc,v,i)=>{
  calls.push({acc,v,i});return v===1?a:v===2?b:c;
 },0,2)));
 outer.next(1);outer.next(2);a.next(5);outer.next(3);outer.complete();
 a.complete();b.next(8);b.complete();c.next(9);c.complete();
 assert.deepEqual(calls,[{acc:0,v:1,i:0},{acc:0,v:2,i:1},{acc:5,v:3,i:2}]);
 assert.deepEqual(out.events,[{kind:'N',value:5},{kind:'N',value:8},{kind:'N',value:9},{kind:'C'}]);
});
test('S14-NATIVE MERGESCAN: output is inner values, not initial seed',()=>{
 const out=collect(of(1,2).pipe(mergeScan((acc,v)=>of(acc+v),10,1)));
 assert.deepEqual(out.events,[{kind:'N',value:11},{kind:'N',value:13},{kind:'C'}]);
});
test('S14-NATIVE MERGESCAN: inner error cancels other subscribed inners and outer',()=>{
 const outer=new Subject(),a=new Subject(),b=new Subject(),err=Object.freeze({failed:true});
 const out=collect(outer.pipe(mergeScan((_acc,v)=>v===1?a:b,0,2)));
 outer.next(1);outer.next(2);b.error(err);
 assert.deepEqual(out.events,[{kind:'E',error:err}]);
 assert.equal(outer.observed,false);assert.equal(a.observed,false);
});
test('S14-NATIVE MERGESCAN: cancellation discards pending values and does not emit seed',()=>{
 const outer=new Subject(),a=new Subject(),out=collect(outer.pipe(mergeScan(()=>a,13,1)));
 outer.next(1);outer.next(2);out.subscription.unsubscribe();a.next(99);outer.complete();
 assert.deepEqual(out.events,[]);
 assert.equal(a.observed,false);
});
