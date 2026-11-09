import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Observable, Subject, of, EMPTY, NEVER, throwError, defer,
  expand, finalize, find, findIndex, first, take
} from 'rxjs';

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

test('S12-NATIVE EXPAND: construction is lazy and recursive values are re-emitted then re-projected',()=>{
  const calls=[];
  const source=defer(()=>{calls.push(['source-subscribe']);return of(1);});
  const result=source.pipe(expand((value,index)=>{
    calls.push(['project',value,index]);
    return value<3?of(value+1):EMPTY;
  }));
  assert.deepEqual(calls,[]);
  const out=collect(result);
  assert.deepEqual(out.events,[{kind:'N',value:1},{kind:'N',value:2},{kind:'N',value:3},{kind:'C'}]);
  assert.deepEqual(calls,[['source-subscribe'],['project',1,0],['project',2,1],['project',3,2]]);
});

test('S12-NATIVE EXPAND: output value precedes projection side effect for each admitted value',()=>{
  const order=[];
  const out=collect(new Observable(sub=>{sub.next('root');sub.complete();}).pipe(
    expand((value,index)=>{order.push(['project',value,index]);return EMPTY;}),
    finalize(()=>order.push(['finalize']))
  ));
  assert.deepEqual(values(out.events),['root']);
  assert.deepEqual(order,[['project','root',0],['finalize']]);
});

test('S12-NATIVE EXPAND: concurrency one buffers later outer values until active inner completes',()=>{
  const outer=new Subject(),inner1=new Subject(),inner2=new Subject();
  const calls=[];
  const out=collect(outer.pipe(expand((value,index)=>{
    calls.push([value,index]);
    if(value===1)return inner1;
    if(value===2)return inner2;
    return EMPTY;
  },1)));
  outer.next(1);
  outer.next(2);
  assert.deepEqual(values(out.events),[1]);
  assert.deepEqual(calls,[[1,0]]);
  inner1.complete();
  assert.deepEqual(values(out.events),[1,2]);
  assert.deepEqual(calls,[[1,0],[2,1]]);
  outer.complete();inner2.complete();
  assert.deepEqual(out.events.at(-1),{kind:'C'});
});

test('S12-NATIVE EXPAND: outer completion waits for active recursive inner',()=>{
  const outer=new Subject(),inner=new Subject();
  const out=collect(outer.pipe(expand(()=>inner)));
  outer.next('root');outer.complete();
  assert.deepEqual(out.events,[{kind:'N',value:'root'}]);
  inner.next('child');
  assert.deepEqual(values(out.events),['root','child']);
  out.subscription.unsubscribe();
});

test('S12-NATIVE EXPAND: projection throw preserves arbitrary error identity',()=>{
  const err=Symbol('project');
  const out=collect(of(1).pipe(expand(()=>{throw err;})));
  assert.deepEqual(out.events,[{kind:'N',value:1},{kind:'E',error:err}]);
});

test('S12-NATIVE EXPAND: inner error is terminal and cancellation releases active work',()=>{
  const err={inner:true},outer=new Subject(),inner=new Subject();
  let disposed=0;
  const out=collect(outer.pipe(expand(()=>inner.pipe(finalize(()=>disposed++)))));
  outer.next(1);inner.error(err);
  assert.strictEqual(out.events.at(-1).error,err);
  assert.equal(disposed,1);
  const outer2=new Subject(),inner2=new Subject();let canceled=0;
  const out2=collect(outer2.pipe(expand(()=>inner2.pipe(finalize(()=>canceled++)))));
  outer2.next(1);out2.subscription.unsubscribe();inner2.next(2);
  assert.deepEqual(values(out2.events),[1]);
  assert.equal(canceled,1);
});

test('S12-NATIVE FINALIZE: complete notifies observer before finalizer callback',()=>{
  const order=[];
  of(1).pipe(finalize(()=>order.push('finalize'))).subscribe({
    next:v=>order.push('next:'+v),
    complete:()=>order.push('complete'),
  });
  assert.deepEqual(order,['next:1','complete','finalize']);
});

test('S12-NATIVE FINALIZE: error preserves identity and still invokes finalizer',()=>{
  const err=Object.freeze({boom:true}),order=[];
  throwError(()=>err).pipe(finalize(()=>order.push('finalize'))).subscribe({
    error:e=>{assert.strictEqual(e,err);order.push('error');}
  });
  assert.deepEqual(order,['error','finalize']);
});

test('S12-NATIVE FINALIZE: explicit unsubscribe is silent and invokes callback exactly once',()=>{
  const src=new Subject(),order=[];
  const sub=src.pipe(finalize(()=>order.push('finalize'))).subscribe(v=>order.push(v));
  src.next('a');sub.unsubscribe();sub.unsubscribe();src.next('late');
  assert.deepEqual(order,['a','finalize']);
});

test('S12-NATIVE FINALIZE: downstream take also triggers finalization through cancellation',()=>{
  const order=[];
  const src=new Observable(sub=>{
    for(const v of [1,2,3]){if(sub.closed)break;sub.next(v);}
    if(!sub.closed)sub.complete();
  });
  const out=collect(src.pipe(finalize(()=>order.push('finalize')),take(1)));
  assert.deepEqual(out.events,[{kind:'N',value:1},{kind:'C'}]);
  assert.deepEqual(order,['finalize']);
});

test('S12-NATIVE FIND: first truthy match preserves object identity and predicate indices/source identity',()=>{
  const token=Object.freeze({n:2}),source=of({n:1},token,{n:3}),calls=[];
  const out=collect(source.pipe(find((value,index,src)=>{
    calls.push([value,index,src]);
    return value.n===2;
  })));
  assert.strictEqual(out.events[0].value,token);
  assert.deepEqual(out.events[1],{kind:'C'});
  assert.deepEqual(calls.map(x=>x[1]),[0,1]);
  assert.ok(calls.every(x=>x[2]===source));
});

test('S12-NATIVE FIND: no match emits undefined then completes',()=>{
  assert.deepEqual(collect(of(1,2).pipe(find(v=>v>9))).events,
    [{kind:'N',value:undefined},{kind:'C'}]);
  assert.deepEqual(collect(EMPTY.pipe(find(()=>true))).events,
    [{kind:'N',value:undefined},{kind:'C'}]);
});

test('S12-NATIVE FIND: predicate throw and source error do not emit undefined',()=>{
  const pred=Symbol('predicate');
  assert.deepEqual(collect(of(1).pipe(find(()=>{throw pred;}))).events,[{kind:'E',error:pred}]);
  const srcErr={source:true};
  assert.deepEqual(collect(throwError(()=>srcErr).pipe(find(()=>true))).events,[{kind:'E',error:srcErr}]);
});

test('S12-NATIVE FIND: first match stops cooperative synchronous production',()=>{
  let work=0;
  const src=new Observable(sub=>{
    for(const v of [1,2,3,4]){if(sub.closed)break;work++;sub.next(v);}
    if(!sub.closed)sub.complete();
  });
  assert.deepEqual(collect(src.pipe(find(v=>v===2))).events,[{kind:'N',value:2},{kind:'C'}]);
  assert.equal(work,2);
});

test('S12-NATIVE FINDINDEX: first match emits zero-based index, not value',()=>{
  const calls=[];
  const source=of('a','b','c');
  const out=collect(source.pipe(findIndex((value,index,src)=>{
    calls.push([value,index,src]);return value==='b';
  })));
  assert.deepEqual(out.events,[{kind:'N',value:1},{kind:'C'}]);
  assert.deepEqual(calls.map(x=>x.slice(0,2)),[['a',0],['b',1]]);
  assert.ok(calls.every(x=>x[2]===source));
});

test('S12-NATIVE FINDINDEX: no match and empty source emit -1',()=>{
  assert.deepEqual(collect(of(1,2).pipe(findIndex(v=>v>9))).events,[{kind:'N',value:-1},{kind:'C'}]);
  assert.deepEqual(collect(EMPTY.pipe(findIndex(()=>true))).events,[{kind:'N',value:-1},{kind:'C'}]);
});

test('S12-NATIVE FINDINDEX: predicate/source errors remain errors and cancellation is silent',()=>{
  const err=Symbol('predicate');
  assert.deepEqual(collect(of(1).pipe(findIndex(()=>{throw err;}))).events,[{kind:'E',error:err}]);
  const source=new Subject(),out=collect(source.pipe(findIndex(()=>false)));
  source.next(1);out.subscription.unsubscribe();source.complete();
  assert.deepEqual(out.events,[]);
});

test('S12-NATIVE FIRST: no predicate emits first value and stops cooperative source',()=>{
  let work=0;
  const src=new Observable(sub=>{
    for(const v of [1,2,3]){if(sub.closed)break;work++;sub.next(v);}
    if(!sub.closed)sub.complete();
  });
  assert.deepEqual(collect(src.pipe(first())).events,[{kind:'N',value:1},{kind:'C'}]);
  assert.equal(work,1);
});

test('S12-NATIVE FIRST: predicate receives original source/index and emits first matching object',()=>{
  const token=Object.freeze({n:2}),source=of({n:1},token,{n:3}),calls=[];
  const out=collect(source.pipe(first((value,index,src)=>{
    calls.push([value,index,src]);return value.n===2;
  })));
  assert.strictEqual(out.events[0].value,token);
  assert.deepEqual(calls.map(x=>x[1]),[0,1]);
  assert.ok(calls.every(x=>x[2]===source));
});

test('S12-NATIVE FIRST: empty/no-match throws EmptyError when no default is supplied',()=>{
  for(const out of [
    collect(EMPTY.pipe(first())),
    collect(of(1,2).pipe(first(v=>v>9))),
  ]){
    assert.equal(out.events.length,1);
    assert.equal(out.events[0].kind,'E');
    assert.equal(out.events[0].error.name,'EmptyError');
  }
});

test('S12-NATIVE FIRST: explicit fallback including undefined differs from missing default',()=>{
  assert.deepEqual(collect(EMPTY.pipe(first(null,undefined))).events,
    [{kind:'N',value:undefined},{kind:'C'}]);
  assert.deepEqual(collect(of(1,2).pipe(first(v=>v>9,'fallback'))).events,
    [{kind:'N',value:'fallback'},{kind:'C'}]);
});

test('S12-NATIVE FIRST: predicate throw/source error preserve identity; cancellation emits no fallback',()=>{
  const pred=Symbol('predicate');
  assert.deepEqual(collect(of(1).pipe(first(()=>{throw pred;}))).events,[{kind:'E',error:pred}]);
  const err={source:true};
  assert.deepEqual(collect(throwError(()=>err).pipe(first())).events,[{kind:'E',error:err}]);
  const src=new Subject(),out=collect(src.pipe(first(null,'fallback')));
  out.subscription.unsubscribe();src.complete();
  assert.deepEqual(out.events,[]);
});
