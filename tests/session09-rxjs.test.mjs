import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Subject, Observable, of, EMPTY, throwError, defer, take,
  combineLatestWith, concatWith, concatMapTo
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { combineLatest as combineLatestPipe, concat as concatPipe } from 'rxjs/operators';
import {
  createCombineLatestModel, createCombineLatestWithModel, createConcatModel,
  createConcatWithModel, createConcatMapToModel, stepModel
} from '../dist/index.js';

const ref = generation => ({ id:'input', generation });
const constant = generation => ({ id:'constant', generation });
const inner = generation => ({ id:'inner', generation });
const capture = observable => {
  const notes = [];
  const subscription = observable.subscribe({
    next:value => notes.push({kind:'N',value}),
    error:error => notes.push({kind:'E',error}),
    complete:() => notes.push({kind:'C'}),
  });
  return {notes,subscription};
};
const model = (m, events) => {
  let state=m.initialState(),actions=[];
  for(const event of [{type:'subscribe'},...events]) {
    const r=stepModel(m,state,event);state=r.state;actions.push(...r.actions);
  }
  return { notes:actions.filter(a=>a.type==='notify').map(a=>a.notification),
    subscribe:actions.filter(a=>a.type==='subscribe').map(a=>a.resource),
    unsubscribe:actions.filter(a=>a.type==='unsubscribe').map(a=>a.resource),
    state };
};
for(const [name,op,make] of [
 ['combineLatest',other=>combineLatestPipe([other]),()=>createCombineLatestModel()],
 ['combineLatestWith',other=>combineLatestWith(other),()=>createCombineLatestWithModel()],
]) {
 test('S9-NATIVE '+name+': source-first latest tuples and completion hold',()=>{
  const left=new Subject(),right=new Subject(),native=capture(left.pipe(op(right)));
  const events=[
   {type:'input.next',resource:ref(0),value:1},
   {type:'input.next',resource:ref(1),value:10},
   {type:'input.next',resource:ref(0),value:2},
   {type:'input.complete',resource:ref(0)},
   {type:'input.next',resource:ref(1),value:11},
   {type:'input.complete',resource:ref(1)}
  ];
  left.next(1);right.next(10);left.next(2);left.complete();right.next(11);right.complete();
  const predicted=model(make(),events);
  assert.deepEqual(native.notes,predicted.notes);
  assert.deepEqual(native.notes,[{kind:'N',value:[1,10]},{kind:'N',value:[2,10]},
    {kind:'N',value:[2,11]},{kind:'C'}]);
  assert.notStrictEqual(native.notes[0].value,native.notes[1].value);
  assert.equal(native.subscription.closed,true);
 });
 test('S9-NATIVE '+name+': incomplete readiness after empty input completion',()=>{
  const left=new Subject(),right=new Subject(),native=capture(left.pipe(op(right)));
  left.complete();right.next(42);right.complete();
  const predicted=model(make(),[
   {type:'input.complete',resource:ref(0)},
   {type:'input.next',resource:ref(1),value:42},
   {type:'input.complete',resource:ref(1)}
  ]);
  assert.deepEqual(native.notes,predicted.notes);
  assert.deepEqual(native.notes,[{kind:'C'}]);
 });
 test('S9-NATIVE '+name+': input-error identity, teardown of all remaining subscriptions',()=>{
  const fault={name:'fault'},left=new Subject(),right=new Subject();
  const native=capture(left.pipe(op(right)));
  left.next(1);right.error(fault);
  const predicted=model(make(),[
   {type:'input.next',resource:ref(0),value:1},
   {type:'input.error',resource:ref(1),error:fault}
  ]);
  assert.deepEqual(native.notes,predicted.notes);
  assert.strictEqual(native.notes[0].error,fault);
  assert.equal(left.observed,false);assert.equal(right.observed,false);
  assert.equal(predicted.unsubscribe.length,2);
 });
 test('S9-NATIVE '+name+': cancellation silences both and disposes resources',()=>{
  const left=new Subject(),right=new Subject(),native=capture(left.pipe(op(right)));
  left.next(9);native.subscription.unsubscribe();right.next(10);left.complete();right.complete();
  assert.deepEqual(native.notes,[]);
  assert.equal(left.observed,false);assert.equal(right.observed,false);
  const predicted=model(make(),[{type:'input.next',resource:ref(0),value:9},{type:'cancel'}]);
  assert.deepEqual(predicted.notes,[]);
  assert.deepEqual(predicted.unsubscribe,[ref(0),ref(1)]);
 });
}
for(const [name,op,make] of [
 ['concat',(...sources)=>concatPipe(...sources),()=>createConcatModel()],
 ['concatWith',(...sources)=>concatWith(...sources),()=>createConcatWithModel()],
]){
 test('S9-NATIVE '+name+': source and supplied Observables are subscribed strictly serially',()=>{
  const started=[],finished=[],subjects=[new Subject(),new Subject(),new Subject()];
  const instrument=(s,i)=>new Observable(sub=>{
   started.push(i);const innerSub=s.subscribe(sub);return()=>{finished.push(i);innerSub.unsubscribe();};
  });
  const [a,b,c]=subjects.map(instrument);
  const native=capture(a.pipe(op(b,c)));
  assert.deepEqual(started,[0]);
  subjects[0].next(1);subjects[0].complete();
  assert.deepEqual(started,[0,1]);
  subjects[1].next(2);subjects[1].complete();
  assert.deepEqual(started,[0,1,2]);
  subjects[2].next(3);subjects[2].complete();
  assert.deepEqual(native.notes,model(make(),[
   {type:'input.next',resource:ref(0),value:1},{type:'input.complete',resource:ref(0)},
   {type:'input.next',resource:ref(1),value:2},{type:'input.complete',resource:ref(1)},
   {type:'input.next',resource:ref(2),value:3},{type:'input.complete',resource:ref(2)}
  ]).notes);
  assert.deepEqual(finished,[0,1,2]);assert.equal(native.subscription.closed,true);
 });
 test('S9-NATIVE '+name+': error prevents subscribing later sources',()=>{
  const fault={failure:true},started=[];
  const a=defer(()=>{started.push(0);return of(1);});
  const b=defer(()=>{started.push(1);return throwError(()=>fault);});
  const c=defer(()=>{started.push(2);return of(3);});
  const native=capture(a.pipe(op(b,c)));
  assert.deepEqual(started,[0,1]);
  assert.deepEqual(native.notes,[{kind:'N',value:1},{kind:'E',error:fault}]);
  assert.strictEqual(native.notes.at(-1).error,fault);
  assert.equal(native.subscription.closed,true);
 });
 test('S9-NATIVE '+name+': cancellation suppresses subscriptions to later sources',()=>{
  const started=[],src=new Subject();
  const next=defer(()=>{started.push(1);return of(2);});
  const native=capture(src.pipe(op(next)));
  src.next(1);native.subscription.unsubscribe();src.complete();
  assert.deepEqual(native.notes,[{kind:'N',value:1}]);
  assert.deepEqual(started,[]);
 });
}
test('S9-NATIVE concat and concatWith: empty intermediate source is skipped',()=>{
 const a=capture(of(1).pipe(concatPipe(EMPTY,of(3))));
 const b=capture(of(1).pipe(concatWith(EMPTY,of(3))));
 assert.deepEqual(a.notes,[{kind:'N',value:1},{kind:'N',value:3},{kind:'C'}]);
 assert.deepEqual(a.notes,b.notes);
});
test('S9-NATIVE concatMapTo: same Observable is subscribed twice, FIFO and outer completion waits',()=>{
 const src=new Subject(),sessions=[],inners=[],finalizers=[];
 const shared=new Observable(sub=>{
  sessions.push('acquire');inners.push(sub);return()=>finalizers.push('release');
 });
 const native=capture(src.pipe(concatMapTo(shared)));
 src.next('a');src.next('b');src.complete();
 assert.equal(sessions.length,1);assert.deepEqual(native.notes,[]);
 inners[0].next('first');inners[0].complete();
 assert.equal(sessions.length,2);assert.deepEqual(native.notes,[{kind:'N',value:'first'}]);
 inners[1].next('second');inners[1].complete();
 const predicted=model(createConcatMapToModel('shared'),[
  {type:'outer.next',value:'a'},{type:'callback.return',resource:constant(0),value:'shared'},
  {type:'outer.next',value:'b'},{type:'outer.complete'},
  {type:'inner.next',resource:inner(0),value:'first'},
  {type:'inner.complete',resource:inner(0)},
  {type:'callback.return',resource:constant(1),value:'shared'},
  {type:'inner.next',resource:inner(1),value:'second'},
  {type:'inner.complete',resource:inner(1)}
 ]);
 assert.deepEqual(native.notes,predicted.notes);
 assert.deepEqual(finalizers,['release','release']);
 assert.equal(native.subscription.closed,true);
});
test('S9-NATIVE concatMapTo: error aborts queued occurrences without resubscribing',()=>{
 const fault={msg:'bad'},src=new Subject(),subscribers=[];
 const shared=new Observable(sub=>{subscribers.push(sub);});
 const native=capture(src.pipe(concatMapTo(shared)));
 src.next(1);src.next(2);src.complete();
 assert.equal(subscribers.length,1);
 subscribers[0].error(fault);
 assert.deepEqual(native.notes,[{kind:'E',error:fault}]);
 assert.strictEqual(native.notes[0].error,fault);
 assert.equal(subscribers.length,1);
});
test('S9-NATIVE concatMapTo: cancellation with a pending queue is silent',()=>{
 const src=new Subject(),subscribers=[];
 const shared=new Observable(sub=>{subscribers.push(sub);});
 const native=capture(src.pipe(concatMapTo(shared)));
 src.next('a');src.next('b');native.subscription.unsubscribe();
 subscribers[0].next(99);src.complete();
 assert.equal(subscribers.length,1);
 assert.deepEqual(native.notes,[]);
});
test('S9-NATIVE VIRTUAL TIME: latest barrier and serial completion have explicit source-controlled frames',()=>{
 const scheduler=new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected));
 scheduler.run(({hot,cold,expectObservable})=>{
  const left=hot('  -a---b-----|',{a:1,b:2});
  const right=hot(' ---x----y--|',{x:10,y:11});
  expectObservable(left.pipe(combineLatestWith(right))).toBe('---a-b--c--|',{
   a:[1,10],b:[2,10],c:[2,11]
  });
  const x=cold('  -a-|',{a:'A'});
  const y=cold('  --b|',{b:'B'});
  expectObservable(x.pipe(concatWith(y))).toBe('-a---b|',{a:'A',b:'B'});
 });
});
