import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, of, shareReplay, take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { createShareReplayModel } from '../dist/models/shareReplay.js';
import { observeShareReplayModel } from './helpers/session3-shareReplay-model-driver.mjs';
import { observeShareReplayRx } from './helpers/session3-shareReplay-rxjs-driver.mjs';
import { words } from './helpers/session2-flatten-driver.mjs';

function compare(config,commands){
  const actual=observeShareReplayRx(config,commands);
  const expected=observeShareReplayModel(createShareReplayModel(config),commands);
  assert.deepEqual(actual.observations,expected.observations,JSON.stringify({config,commands}));
  assert.equal(actual.connected,expected.connected);
  assert.equal(actual.liveSubscribers,0);
  return actual.observations;
}
test('S3-SHAREREPLAY-RX-01: lazy shared construction and overlapping subscribers use one producer',()=>{
  let connected=0,released=0;const sinks=[];
  const shared=new Observable(s=>{connected++;sinks.push(s);return()=>released++;})
    .pipe(shareReplay({bufferSize:2,refCount:true}));
  assert.equal(connected,0);
  const a=shared.subscribe(),b=shared.subscribe();assert.equal(connected,1);
  a.unsubscribe();assert.equal(released,0);b.unsubscribe();assert.equal(released,1);
});
test('S3-SHAREREPLAY-RX-02: late subscribers get FIFO replay, then live values',()=>{
  const source=new Subject(),shared=source.pipe(shareReplay({bufferSize:2,refCount:false}));
  const a=[],b=[];
  const subA=shared.subscribe(x=>a.push(x));
  source.next('a');source.next('b');source.next('c');
  const subB=shared.subscribe(x=>b.push(x));
  source.next('d');
  assert.deepEqual(a,['a','b','c','d']);assert.deepEqual(b,['b','c','d']);
  subA.unsubscribe();subB.unsubscribe();source.complete();
});
test('S3-SHAREREPLAY-RX-03: successful completion retains replay memory and terminal status',()=>{
  let subscriptions=0;
  const shared=new Observable(s=>{subscriptions++;s.next('a');s.next('b');s.complete();})
    .pipe(shareReplay({bufferSize:1,refCount:true}));
  const a=[],b=[];shared.subscribe({next:x=>a.push(x),complete:()=>a.push('C')});
  shared.subscribe({next:x=>b.push(x),complete:()=>b.push('C')});
  assert.equal(subscriptions,1);assert.deepEqual(a,['a','b','C']);assert.deepEqual(b,['b','C']);
});
test('S3-SHAREREPLAY-RX-04: error resets buffer, reconnects, and preserves error identity',()=>{
  let connected=0;const sinks=[];
  const shared=new Observable(s=>{connected++;sinks.push(s);})
    .pipe(shareReplay({bufferSize:2,refCount:false}));
  const a=[],b=[];const fault={};
  shared.subscribe({next:x=>a.push(x),error:e=>a.push(e)});
  sinks[0].next('cached');sinks[0].error(fault);
  shared.subscribe({next:x=>b.push(x),error:e=>b.push(e)});
  assert.deepEqual(a,['cached',fault]);assert.deepEqual(b,[]);
  assert.equal(connected,2);sinks[1].next('fresh');assert.deepEqual(b,['fresh']);sinks[1].complete();
});
test('S3-SHAREREPLAY-RX-05: refCount true resets at zero, false retains unseen values',()=>{
  for(const refCount of [false,true]){
    let connected=0;const sinks=[];
    const shared=new Observable(s=>{connected++;sinks.push(s);})
      .pipe(shareReplay({bufferSize:2,refCount}));
    const a=shared.subscribe();sinks[0].next('cached');a.unsubscribe();
    if(!refCount)sinks[0].next('while-empty');
    const values=[],b=shared.subscribe(x=>values.push(x));
    assert.equal(connected,refCount?2:1);
    assert.deepEqual(values,refCount?[]:['cached','while-empty']);
    b.unsubscribe();sinks.at(-1).complete();
  }
});
test('S3-SHAREREPLAY-RX-06: virtual source clock prunes at the exact expiry boundary',()=>{
  const time=new TestScheduler(()=>{}),seen=[],source=new Subject();
  const shared=source.pipe(shareReplay({bufferSize:2,windowTime:3,refCount:false,scheduler:time}));
  time.schedule(()=>shared.subscribe(x=>seen.push(['A',time.now(),x])),0);
  time.schedule(()=>source.next('a'),1);time.schedule(()=>source.next('b'),2);
  time.schedule(()=>shared.subscribe(x=>seen.push(['B',time.now(),x])),3);
  time.schedule(()=>shared.subscribe(x=>seen.push(['C',time.now(),x])),4);
  time.schedule(()=>source.complete(),5);
  time.flush();
  assert.deepEqual(seen,[['A',1,'a'],['A',2,'b'],['B',3,'a'],['B',3,'b'],['C',4,'b']]);
});
test('S3-SHAREREPLAY-RX-07: no implicit timer is installed solely to evict cached values',()=>{
  const clock=new TestScheduler(()=>{}),log=[];
  const source=new Subject(),shared=source.pipe(shareReplay({bufferSize:2,windowTime:2,refCount:false,scheduler:clock}));
  clock.schedule(()=>shared.subscribe(x=>log.push(['A',clock.now(),x])),0);
  clock.schedule(()=>source.next('a'),1);
  clock.schedule(()=>shared.subscribe(x=>log.push(['B',clock.now(),x])),5);
  clock.schedule(()=>source.complete(),6);
  clock.flush();
  assert.deepEqual(log,[['A',1,'a']]); // expiry at time 3, checked on next subscribe at 5
});
test('S3-SHAREREPLAY-RX-08: zero buffer and window are clamped to one',()=>{
  const clock=new TestScheduler(()=>{}),out=[],source=new Subject();
  const shared=source.pipe(shareReplay({bufferSize:0,windowTime:0,refCount:false,scheduler:clock}));
  clock.schedule(()=>shared.subscribe(),0);
  clock.schedule(()=>source.next('a'),1);
  clock.schedule(()=>shared.subscribe(x=>out.push(x)),1);
  clock.schedule(()=>shared.subscribe(x=>out.push(x)),2);
  clock.schedule(()=>source.complete(),3);
  clock.flush();assert.deepEqual(out,['a']);
});
test('S3-SHAREREPLAY-RX-09: downstream take cancels a cooperative synchronous source',()=>{
  const produced=[];let released=0;
  const source=new Observable(s=>{for(let i=0;i<4&&!s.closed;i++){produced.push(i);s.next(i);}return()=>released++;});
  source.pipe(shareReplay({bufferSize:1,refCount:true}),take(1)).subscribe();
  assert.deepEqual(produced,[0]);assert.equal(released,1);
});
test('S3-SHAREREPLAY-RX-10: separate shared Observable instances do not share a buffer',()=>{
  const op=shareReplay({bufferSize:1,refCount:true});
  const first=new Subject(),second=new Subject();
  const a=first.pipe(op),b=second.pipe(op),seen=[];
  const sa=a.subscribe(x=>seen.push(['a',x])),sb=b.subscribe(x=>seen.push(['b',x]));
  first.next(1);second.next(2);
  assert.deepEqual(seen,[['a',1],['b',2]]);sa.unsubscribe();sb.unsubscribe();
});
test('S3-SHAREREPLAY-RX-DIFF: 6248 bounded command words across count, time, refCount profiles',()=>{
  let count=0;
  for(const bufferSize of [1,2])for(const windowTime of [3,Infinity])for(const refCount of [false,true]){
    const config={bufferSize,windowTime,refCount};
    for(const word of words(['join','leave','next','complete','error'],4)){
      compare(config,word);count++;
    }
  }
  assert.equal(count,6248);
});
