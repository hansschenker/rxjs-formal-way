import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Observable, Subject, of, EMPTY, NEVER, throwError, defer, finalize, take,
  dematerialize, elementAt, endWith, every, exhaust, exhaustAll
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

const collect=o=>{
  const events=[];
  const subscription=o.subscribe({
    next:value=>events.push({kind:'N',value}),
    error:error=>events.push({kind:'E',error}),
    complete:()=>events.push({kind:'C'}),
  });
  return {events,subscription};
};
const values=events=>events.filter(x=>x.kind==='N').map(x=>x.value);
test('S11-NATIVE DEMATERIALIZE: N values keep identity and embedded C terminates before source complete',()=>{
  const token=Object.freeze({id:1});
  const result=collect(of({kind:'N',value:token},{kind:'N',value:undefined},{kind:'C'},{kind:'N',value:'late'})
    .pipe(dematerialize()));
  assert.deepEqual(result.events,[{kind:'N',value:token},{kind:'N',value:undefined},{kind:'C'}]);
  assert.strictEqual(result.events[0].value,token);
});
test('S11-NATIVE DEMATERIALIZE: embedded E preserves arbitrary error identity',()=>{
  const err=Symbol('embedded');
  const out=collect(of({kind:'N',value:'a'},{kind:'E',error:err},{kind:'N',value:'late'})
    .pipe(dematerialize()));
  assert.strictEqual(out.events[1].error,err);
  assert.deepEqual(values(out.events),['a']);
});
test('S11-NATIVE DEMATERIALIZE: plain upstream completion, upstream error and silent cancellation',()=>{
  const err=Object.freeze({fail:true});
  assert.deepEqual(collect(EMPTY.pipe(dematerialize())).events,[{kind:'C'}]);
  assert.strictEqual(collect(throwError(()=>err).pipe(dematerialize())).events[0].error,err);
  const outer=new Subject(),seen=collect(outer.pipe(dematerialize()));
  outer.next({kind:'N',value:1});seen.subscription.unsubscribe();
  outer.next({kind:'N',value:2});outer.complete();
  assert.deepEqual(seen.events,[{kind:'N',value:1}]);
});
test('S11-NATIVE DEMATERIALIZE: early embedded terminal unsubscribes cooperative source',()=>{
  let work=0;
  const src=new Observable(sub=>{
    for(const n of [{kind:'N',value:1},{kind:'C'},{kind:'N',value:2}]){
      if(sub.closed)break;
      work++;sub.next(n);
    }
    if(!sub.closed)sub.complete();
  });
  assert.deepEqual(collect(src.pipe(dematerialize())).events,[{kind:'N',value:1},{kind:'C'}]);
  assert.equal(work,2);
});
test('S11-NATIVE ELEMENTAT: zero-based indexing returns one same object and completes',()=>{
  const token=Object.freeze({name:'selected'});
  const out=collect(of('a',token,'c').pipe(elementAt(1)));
  assert.strictEqual(out.events[0].value,token);
  assert.deepEqual(out.events[1],{kind:'C'});
});
test('S11-NATIVE ELEMENTAT: target hit stops cooperative synchronous production',()=>{
  let work=0;
  const src=new Observable(sub=>{
    for(const v of [1,2,3,4,5]){
      if(sub.closed)break;
      work++;sub.next(v);
    }
    if(!sub.closed)sub.complete();
  });
  assert.deepEqual(collect(src.pipe(elementAt(2))).events,[{kind:'N',value:3},{kind:'C'}]);
  assert.equal(work,3);
});
test('S11-NATIVE ELEMENTAT: missing index throws ArgumentOutOfRangeError without default',()=>{
  const out=collect(of(1).pipe(elementAt(4)));
  assert.equal(out.events.length,1);
  assert.equal(out.events[0].kind,'E');
  assert.equal(out.events[0].error.name,'ArgumentOutOfRangeError');
  assert.throws(()=>elementAt(-1),e=>e?.name==='ArgumentOutOfRangeError');
});
test('S11-NATIVE ELEMENTAT: explicit undefined default differs from omission',()=>{
  assert.deepEqual(collect(EMPTY.pipe(elementAt(3,undefined))).events,
    [{kind:'N',value:undefined},{kind:'C'}]);
  assert.deepEqual(collect(of('x').pipe(elementAt(4,'fallback'))).events,
    [{kind:'N',value:'fallback'},{kind:'C'}]);
});
test('S11-NATIVE ELEMENTAT: source error and downstream cancellation suppress default',()=>{
  const err={same:'error'};
  assert.strictEqual(collect(throwError(()=>err).pipe(elementAt(4,'fallback'))).events[0].error,err);
  const source=new Subject(),out=collect(source.pipe(elementAt(4,'fallback')));
  source.next(1);out.subscription.unsubscribe();source.complete();
  assert.deepEqual(out.events,[]);
});
test('S11-NATIVE ENDWITH: appended values begin only after original successful completion',()=>{
  const lifecycle=[],token=Object.freeze({k:1});
  const src=defer(()=>{lifecycle.push('source subscribe');return of(token).pipe(
    finalize(()=>lifecycle.push('source finalized')));});
  const out=collect(src.pipe(endWith('one','two')));
  assert.deepEqual(values(out.events),[token,'one','two']);
  assert.deepEqual(out.events.at(-1),{kind:'C'});
  assert.equal(lifecycle[0],'source subscribe');
  assert.strictEqual(out.events[0].value,token);
});
test('S11-NATIVE ENDWITH: empty suffix keeps all source values and completion',()=>{
  assert.deepEqual(collect(of(1,2).pipe(endWith())).events,
    [{kind:'N',value:1},{kind:'N',value:2},{kind:'C'}]);
  assert.deepEqual(collect(EMPTY.pipe(endWith('tail'))).events,
    [{kind:'N',value:'tail'},{kind:'C'}]);
});
test('S11-NATIVE ENDWITH: error or early cancellation suppresses suffix',()=>{
  const err=Object.freeze({err:2});
  assert.deepEqual(collect(throwError(()=>err).pipe(endWith('tail'))).events,[{kind:'E',error:err}]);
  const source=new Subject(),out=collect(source.pipe(endWith('tail')));
  source.next('start');out.subscription.unsubscribe();source.complete();
  assert.deepEqual(values(out.events),['start']);
});
test('S11-NATIVE EVERY: empty stream returns vacuous true, all passing returns true',()=>{
  assert.deepEqual(collect(EMPTY.pipe(every(()=>false))).events,
    [{kind:'N',value:true},{kind:'C'}]);
  assert.deepEqual(collect(of(1,2,3).pipe(every(v=>v<4))).events,
    [{kind:'N',value:true},{kind:'C'}]);
});
test('S11-NATIVE EVERY: first false short-circuits and uses zero-based predicate index',()=>{
  const calls=[];
  const src=new Observable(sub=>{
    for(let i=0;i<5;i++){if(sub.closed)break;sub.next(i);}
    if(!sub.closed)sub.complete();
  });
  const out=collect(src.pipe(every((value,index)=>{calls.push([value,index]);return value<2;})));
  assert.deepEqual(out.events,[{kind:'N',value:false},{kind:'C'}]);
  assert.deepEqual(calls,[[0,0],[1,1],[2,2]]);
});
test('S11-NATIVE EVERY: callback sees source Observable and unmodified values',()=>{
  const obj=Object.freeze({n:1});const original=of(obj);
  const seen=[];
  const out=collect(original.pipe(every((value,index,source)=>{
    seen.push([value,index,source]);return true;
  })));
  assert.strictEqual(seen[0][0],obj);
  assert.equal(seen[0][1],0);
  assert.strictEqual(seen[0][2],original);
  assert.deepEqual(out.events,[{kind:'N',value:true},{kind:'C'}]);
});
test('S11-NATIVE EVERY: throwing predicate or failed source emits no boolean',()=>{
  const errorToken=Symbol('callback');
  const out=collect(of(1,2).pipe(every(()=>{throw errorToken;})));
  assert.deepEqual(out.events,[{kind:'E',error:errorToken}]);
  const srcError={same:1};
  assert.deepEqual(collect(throwError(()=>srcError).pipe(every(()=>true))).events,
    [{kind:'E',error:srcError}]);
});
test('S11-NATIVE EVERY: cancellation before source complete is silent',()=>{
  const src=new Subject(),out=collect(src.pipe(every(()=>true)));
  src.next('ok');out.subscription.unsubscribe();src.complete();
  assert.deepEqual(out.events,[]);
});
test('S11-NATIVE EXHAUST: deprecated export is exact exhaustAll alias',()=>{
  assert.strictEqual(exhaust,exhaustAll);
});
test('S11-NATIVE EXHAUST: busy outer values ignored; next inner accepted after current completion',()=>{
  const outer=new Subject(),a=new Subject(),b=new Subject(),c=new Subject();
  const out=collect(outer.pipe(exhaust()));
  outer.next(a);outer.next(b);
  a.next('a1');b.next('ignored');a.complete();
  outer.next(c);outer.complete();c.next('c1');c.complete();
  assert.deepEqual(out.events,[{kind:'N',value:'a1'},{kind:'N',value:'c1'},{kind:'C'}]);
});
test('S11-NATIVE EXHAUST: outer completion waits for active inner, error cancels it',()=>{
  const outer=new Subject(),inner=new Subject(),observed=collect(outer.pipe(exhaust()));
  outer.next(inner);outer.complete();
  assert.deepEqual(observed.events,[]);
  inner.next('alive');inner.complete();
  assert.deepEqual(observed.events,[{kind:'N',value:'alive'},{kind:'C'}]);
  const err={fatal:true},outer2=new Subject(),inner2=new Subject(),o2=collect(outer2.pipe(exhaust()));
  outer2.next(inner2);inner2.error(err);
  assert.deepEqual(o2.events,[{kind:'E',error:err}]);
  assert.equal(outer2.observed,false);
});
test('S11-NATIVE EXHAUST: downstream cancellation releases active inner without terminal signal',()=>{
  const src=new Subject(),inner=new Subject();
  let disposed=0;
  const out=collect(src.pipe(exhaust()));
  src.next(inner.pipe(finalize(()=>{disposed++;})));out.subscription.unsubscribe();
  inner.next('late');src.complete();
  assert.deepEqual(out.events,[]);
  assert.equal(disposed,1);
});
