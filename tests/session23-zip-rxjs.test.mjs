import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, of, EMPTY, take } from 'rxjs';
import { zip } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

// This file deliberately imports no canonical model or model test helper.
const controlled = (count = 3, downstream = x => x) => {
  const subscribers = [], log = [];
  const sources = Array.from({length:count}, (_,index) => new Observable(subscriber => {
    subscribers[index] = subscriber; log.push(['subscribe',index]);
    return () => log.push(['unsubscribe',index]);
  }));
  const result = downstream(sources[0].pipe(zip(...sources.slice(1))));
  const connection = result.subscribe({next:value=>log.push(['next',value]),error:error=>log.push(['error',error]),complete:()=>log.push(['complete'])});
  return {subscribers,log,connection};
};
const output = log => log.filter(([kind])=>['next','complete','error'].includes(kind));

test('S23 ZIP NATIVE: construction is lazy and result connections own independent executions', () => {
  let connections=0;const source=new Observable(()=>{connections++;});
  const result=source.pipe(zip(source));assert.equal(connections,0);
  const first=result.subscribe(),second=result.subscribe();assert.equal(connections,4);assert.notEqual(first,second);
  first.unsubscribe();second.unsubscribe();
});
test('S23 ZIP NATIVE: source connects first followed by auxiliaries in argument order', () => {
  const h=controlled();assert.deepEqual(h.log,[['subscribe',0],['subscribe',1],['subscribe',2]]);h.connection.unsubscribe();
});
test('S23 ZIP NATIVE: uneven arrivals pair oldest unconsumed values', () => {
  const h=controlled(),[a,b,c]=h.subscribers;
  a.next('a1');a.next('a2');c.next('c1');b.next('b1');c.next('c2');b.next('b2');
  assert.deepEqual(output(h.log),[['next',['a1','b1','c1']],['next',['a2','b2','c2']]]);h.connection.unsubscribe();
});
test('S23 ZIP NATIVE: any input can trigger the next tuple', () => {
  for(const trigger of [0,1,2]){const h=controlled();for(const index of [0,1,2].filter(i=>i!==trigger).concat(trigger))h.subscribers[index].next(index);
    assert.deepEqual(output(h.log),[['next',[0,1,2]]]);h.connection.unsubscribe();}
});
test('S23 ZIP NATIVE: completed input keeps buffered contributions while its producer is released', () => {
  const h=controlled(),[a,b,c]=h.subscribers;a.next('a1');a.next('a2');a.complete();
  assert.equal(a.closed,true);assert.equal(h.connection.closed,false);assert.deepEqual(h.log.slice(-1),[['unsubscribe',0]]);
  b.next('b1');c.next('c1');assert.deepEqual(output(h.log),[['next',['a1','b1','c1']]]);assert.equal(h.connection.closed,false);h.connection.unsubscribe();
});
test('S23 ZIP NATIVE: last buffered tuple precedes complete and remaining producer cleanup', () => {
  const h=controlled(),[a,b,c]=h.subscribers;a.next('a');a.complete();b.next('b');c.next('c');
  assert.deepEqual(h.log.slice(-4),[['next',['a','b','c']],['complete'],['unsubscribe',1],['unsubscribe',2]]);
  assert.equal(h.connection.closed,true);
});
test('S23 ZIP NATIVE: one empty completed input ends all live connections and discards unmatched values', () => {
  const h=controlled();h.subscribers[2].next('unused');h.subscribers[1].complete();
  assert.deepEqual(h.log.slice(-4),[['complete'],['unsubscribe',0],['unsubscribe',1],['unsubscribe',2]]);
  assert.deepEqual(output(h.log),[['complete']]);
});
test('S23 ZIP NATIVE: every input error propagates the same payload before registration-order cleanup', () => {
  const fault=Object.freeze({fault:true});for(const index of [0,1,2]){const h=controlled();h.subscribers[0].next('queued');h.subscribers[index].error(fault);
    assert.deepEqual(h.log.slice(-4),[['error',fault],['unsubscribe',0],['unsubscribe',1],['unsubscribe',2]]);assert.equal(output(h.log)[0][1],fault);}
});
test('S23 ZIP NATIVE: cancellation closes only still-live inputs without a terminal notification', () => {
  const h=controlled();h.subscribers[1].next('pending');h.subscribers[1].complete();h.connection.unsubscribe();
  assert.deepEqual(h.log,[['subscribe',0],['subscribe',1],['subscribe',2],['unsubscribe',1],['unsubscribe',0],['unsubscribe',2]]);
});
test('S23 ZIP NATIVE: undefined, null and object identity are ordinary queued payloads', () => {
  const object=Object.freeze({opaque:true}),h=controlled();h.subscribers[0].next(undefined);h.subscribers[1].next(null);h.subscribers[2].next(object);
  const tuple=output(h.log)[0][1];assert.deepEqual(tuple,[undefined,null,object]);assert.equal(tuple[2],object);h.connection.unsubscribe();
});
test('S23 ZIP NATIVE: no auxiliary arguments produces singleton arrays, including undefined', () => {
  const seen=[];of(undefined,7).pipe(zip()).subscribe({next:value=>seen.push(value),complete:()=>seen.push('C')});
  assert.deepEqual(seen,[[undefined],[7],'C']);
});
test('S23 ZIP NATIVE: passing one Observable twice still creates separate subscription occurrences', () => {
  const subscribers=[];const same=new Observable(s=>{subscribers.push(s);});const tuples=[];
  const connection=same.pipe(zip(same)).subscribe(value=>tuples.push(value));
  assert.equal(subscribers.length,2);assert.notEqual(subscribers[0],subscribers[1]);subscribers[0].next('a');assert.deepEqual(tuples,[]);
  subscribers[1].next('b');assert.deepEqual(tuples,[['a','b']]);connection.unsubscribe();assert.ok(subscribers.every(s=>s.closed));
});
test('S23 ZIP NATIVE: virtual time includes completed-buffer drain and exact producer lifetimes', () => {
  new TestScheduler((actual,expected)=>assert.deepEqual(actual,expected)).run(({cold,expectObservable,expectSubscriptions})=>{
    const a=cold('-a-b--|'),b=cold('--x---y--|');
    expectObservable(a.pipe(zip(b))).toBe('--u---(v|)',{u:['a','x'],v:['b','y']});
    expectSubscriptions(a.subscriptions).toBe('^-----!');expectSubscriptions(b.subscriptions).toBe('^-----!');
  });
});
test('S23 ZIP NATIVE ONLY: synchronous empty source prevents later auxiliary acquisition', () => {
  let auxiliaryConnections=0;const auxiliary=new Observable(()=>{auxiliaryConnections++;});const seen=[];
  EMPTY.pipe(zip(auxiliary)).subscribe({complete:()=>seen.push('C')});assert.deepEqual(seen,['C']);assert.equal(auxiliaryConnections,0);
});
test('S23 ZIP NATIVE ONLY: synchronously completed buffered source still allows auxiliary setup', () => {
  const log=[];const source=new Observable(s=>{log.push('source+');s.next('a');s.next('b');s.complete();return()=>log.push('source-');});
  const auxiliary=new Observable(s=>{log.push('aux+');s.next(1);s.next(2);return()=>log.push('aux-');});
  source.pipe(zip(auxiliary)).subscribe({next:v=>log.push(v),complete:()=>log.push('C')});
  assert.deepEqual(log,['source+','source-','aux+',['a',1],['b',2],'C','aux-']);
});
test('S23 ZIP NATIVE ONLY: optional projector receives tuple members and emits its return value', () => {
  const source=new Subject(),other=new Subject(),calls=[],values=[];
  const connection=source.pipe(zip(other,(a,b)=>{calls.push([a,b]);return {sum:a+b};})).subscribe(v=>values.push(v));
  source.next(2);other.next(3);assert.deepEqual(calls,[[2,3]]);assert.deepEqual(values,[{sum:5}]);connection.unsubscribe();
});
test('S23 ZIP NATIVE ONLY: optional projector throw becomes error and closes both inputs', () => {
  const fault=Object.freeze({projector:true}),sources=[],log=[];
  const inputs=[0,1].map(i=>new Observable(s=>{sources[i]=s;return()=>log.push(['release',i]);}));
  const connection=inputs[0].pipe(zip(inputs[1],()=>{throw fault;})).subscribe({error:e=>log.push(['error',e])});
  sources[0].next('a');sources[1].next('b');assert.deepEqual(log,[['error',fault],['release',0],['release',1]]);assert.equal(connection.closed,true);
});
test('S23 ZIP NATIVE ONLY: legacy array argument is one iterable input containing Observable payloads', () => {
  let innerConnections=0;const first=new Observable(()=>{innerConnections++;}),second=new Observable(()=>{innerConnections++;});
  const seen=[];of('a','b').pipe(zip([first,second])).subscribe({next:v=>seen.push(v),complete:()=>seen.push('C')});
  assert.deepEqual(seen,[['a',first],['b',second],'C']);assert.equal(seen[0][1],first);assert.equal(innerConnections,0);
});
test('S23 ZIP NATIVE ONLY: downstream take(1) cancels all inputs during delivery', () => {
  const h=controlled(3,result=>result.pipe(take(1)));h.subscribers[0].next(0);h.subscribers[1].next(1);h.subscribers[2].next(2);
  assert.deepEqual(h.log.slice(-5),[['next',[0,1,2]],['complete'],['unsubscribe',0],['unsubscribe',1],['unsubscribe',2]]);
  assert.ok(h.subscribers.every(s=>s.closed));
});
