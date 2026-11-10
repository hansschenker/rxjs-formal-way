import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Observable, Subject, of, EMPTY, NEVER, throwError, defer, groupBy, mergeMap, toArray,
  ignoreElements, isEmpty, last, mapTo, finalize, map, take
} from 'rxjs';

/** Independently exercise RxJS 7.8.2, not the canonical model's trace implementation. */
const collect=observable=>{
  const events=[];
  const subscription=observable.subscribe({
    next:value=>events.push({kind:'N',value}),
    error:error=>events.push({kind:'E',error}),
    complete:()=>events.push({kind:'C'}),
  });
  return {events,subscription};
};
const values=events=>events.filter(x=>x.kind==='N').map(x=>x.value);

test('S13-NATIVE GROUPBY: construction lazy; new keys create one group, existing keys reuse it',()=>{
  let subscribed=0;const source=defer(()=>{subscribed++;return of(1,3,2,4,5);});
  const grouped=source.pipe(groupBy(value=>value%2),
    mergeMap(group$=>group$.pipe(toArray(),map(values=>({key:group$.key,values})))));
  assert.equal(subscribed,0);
  const out=collect(grouped);
  assert.equal(subscribed,1);
  assert.deepEqual(out.events,[
    {kind:'N',value:{key:1,values:[1,3,5]}},
    {kind:'N',value:{key:0,values:[2,4]}},
    {kind:'C'},
  ]);
});

test('S13-NATIVE GROUPBY: grouped Observable is multicast and reports its key',()=>{
  const src=new Subject(),groups=[],seen=[];
  const subscription=src.pipe(groupBy(x=>x.code)).subscribe(g=>{
    groups.push(g);
    g.subscribe(x=>seen.push([g.key,x]));
  });
  src.next({code:'A',value:1});src.next({code:'B',value:2});src.next({code:'A',value:3});
  assert.deepEqual(groups.map(g=>g.key),['A','B']);
  assert.deepEqual(seen.map(([key,item])=>[key,item.value]),
    [['A',1],['B',2],['A',3]]);
  subscription.unsubscribe();
});

test('S13-NATIVE GROUPBY: JS Map SameValueZero groups NaN and signed zero keys',()=>{
  const keys=[],groups=[];
  const out=collect(of(NaN,NaN,-0,0).pipe(
    groupBy(x=>x),
    mergeMap(g=>{
      keys.push(g.key);
      return g.pipe(toArray(),map(values=>({key:g.key,values})));
    })
  ));
  assert.equal(groups.length,0);
  assert.equal(keys.length,2);
  assert.ok(Number.isNaN(keys[0]));
  assert.equal(keys[1],0);
  assert.equal(values(out.events)[0].values.length,2);
  assert.deepEqual(values(out.events)[1].values,[0,0]);
});

test('S13-NATIVE GROUPBY: key selector error propagates to active groups and outer',()=>{
  const src=new Subject(),fail=Object.freeze({fail:true}),child=[],outer=[];
  const sub=src.pipe(groupBy(x=>{
    if(x===99)throw fail;
    return x%2;
  })).subscribe({
    next:g=>g.subscribe({next:v=>child.push(['N',v]),error:e=>child.push(['E',e])}),
    error:e=>outer.push(e),
  });
  src.next(1);src.next(99);
  assert.strictEqual(child.at(-1)[1],fail);
  assert.strictEqual(outer[0],fail);
  assert.equal(sub.closed,true);
});

test('S13-NATIVE GROUPBY: source error reaches grouped consumers before outer error',()=>{
  const source=new Subject(),fail=Symbol('source'),order=[];
  source.pipe(groupBy(x=>x%2)).subscribe({
    next:g=>g.subscribe({error:e=>order.push(['group',e])}),
    error:e=>order.push(['outer',e]),
  });
  source.next(1);source.error(fail);
  assert.deepEqual(order,[['group',fail],['outer',fail]]);
});

test('S13-NATIVE GROUPBY: child subscriber retains upstream after outer cancellation',()=>{
  const source=new Subject();let attached=0,disposed=0;
  const upstream=new Observable(sub=>{
    attached++;const inner=source.subscribe(sub);
    return()=>{disposed++;inner.unsubscribe();};
  });
  const groups=[],received=[];
  const outer=upstream.pipe(groupBy(x=>x%2)).subscribe(g=>groups.push(g));
  source.next(1);
  assert.equal(attached,1);
  const child=groups[0].subscribe(v=>received.push(v));
  outer.unsubscribe();
  assert.equal(disposed,0,'group subscription must retain original source');
  source.next(3);
  assert.deepEqual(received,[3],'late subscription cannot replay first group value');
  child.unsubscribe();
  assert.equal(disposed,1,'last child releases source after outer teardown attempt');
});

test('S13-NATIVE GROUPBY: outer cancellation without child releases upstream immediately',()=>{
  let disposed=0;const src=new Subject();
  const upstream=new Observable(sub=>{const s=src.subscribe(sub);return()=>{s.unsubscribe();disposed++;};});
  const outer=upstream.pipe(groupBy(x=>x)).subscribe(()=>{});
  src.next('a');outer.unsubscribe();
  assert.equal(disposed,1);
});

test('S13-NATIVE GROUPBY: key/element options are explicitly outside current accepted profile',()=>{
  // This test pins the exclusion boundary without modeling or claiming its behavior as accepted.
  assert.equal(typeof groupBy,'function');
});

test('S13-NATIVE IGNORE: laziness and zero next even for empty, undefined or object payloads',()=>{
  let connections=0;const source=defer(()=>{connections++;return of(undefined,{a:1},0);});
  const result=source.pipe(ignoreElements());
  assert.equal(connections,0);
  assert.deepEqual(collect(result).events,[{kind:'C'}]);
  assert.equal(connections,1);
});

test('S13-NATIVE IGNORE: propagate source error unchanged and without next',()=>{
  const err=Object.freeze({reason:'source'});
  assert.deepEqual(collect(of(1,2).pipe(mergeMap(x=>x===2?throwError(()=>err):of(x)),ignoreElements())).events,
    [{kind:'E',error:err}]);
});

test('S13-NATIVE IGNORE: explicit unsubscribe tears down producer silently',()=>{
  const src=new Subject(),events=[];let disposed=0;
  const s=src.pipe(finalize(()=>disposed++),ignoreElements()).subscribe({
    next:v=>events.push(['next',v]),error:e=>events.push(['error',e]),complete:()=>events.push(['complete'])
  });
  src.next(1);s.unsubscribe();src.complete();
  assert.deepEqual(events,[]);
  assert.equal(disposed,1);
});

test('S13-NATIVE ISEMPTY: first value emits false and cancels cooperative synchronous producer',()=>{
  let produced=0;
  const source=new Observable(sub=>{
    for(const n of [1,2,3]){if(sub.closed)break;produced++;sub.next(n);}
    if(!sub.closed)sub.complete();
  });
  assert.deepEqual(collect(source.pipe(isEmpty())).events,[{kind:'N',value:false},{kind:'C'}]);
  assert.equal(produced,1);
});

test('S13-NATIVE ISEMPTY: completed empty source gives true',()=>{
  assert.deepEqual(collect(EMPTY.pipe(isEmpty())).events,[{kind:'N',value:true},{kind:'C'}]);
});

test('S13-NATIVE ISEMPTY: undefined counts as a value, not emptiness',()=>{
  assert.deepEqual(collect(of(undefined).pipe(isEmpty())).events,[{kind:'N',value:false},{kind:'C'}]);
});

test('S13-NATIVE ISEMPTY: error is not a true/false result',()=>{
  const err=Symbol('error');
  assert.deepEqual(collect(throwError(()=>err).pipe(isEmpty())).events,[{kind:'E',error:err}]);
});

test('S13-NATIVE ISEMPTY: unsubscribe before a source next is silent',()=>{
  const subject=new Subject(),out=collect(subject.pipe(isEmpty()));
  out.subscription.unsubscribe();subject.next(1);subject.complete();
  assert.deepEqual(out.events,[]);
});

test('S13-NATIVE LAST: no predicate emits the last value at source completion only',()=>{
  const subject=new Subject(),out=collect(subject.pipe(last()));
  subject.next('a');subject.next('b');
  assert.deepEqual(out.events,[]);
  subject.complete();
  assert.deepEqual(out.events,[{kind:'N',value:'b'},{kind:'C'}]);
});

test('S13-NATIVE LAST: predicate receives original source and every scanned index',()=>{
  const calls=[],source=of({n:1},{n:2},{n:3},{n:4});
  const out=collect(source.pipe(last((value,index,src)=>{
    calls.push([value,index,src]);
    return value.n%2===1;
  })));
  assert.deepEqual(out.events,[{kind:'N',value:{n:3}},{kind:'C'}]);
  assert.deepEqual(calls.map(c=>c[1]),[0,1,2,3]);
  assert.ok(calls.every(c=>c[2]===source));
});

test('S13-NATIVE LAST: object identity of final matching value is preserved',()=>{
  const lastMatch=Object.freeze({n:3});
  const out=collect(of({n:1},{n:2},lastMatch,{n:4}).pipe(last(v=>v.n%2===1)));
  assert.strictEqual(out.events[0].value,lastMatch);
});

test('S13-NATIVE LAST: empty and no-match report EmptyError unless default is supplied',()=>{
  const cases=[collect(EMPTY.pipe(last())),collect(of(1,2).pipe(last(x=>x>3)))];
  for(const c of cases){
    assert.equal(c.events.length,1);
    assert.equal(c.events[0].kind,'E');
    assert.equal(c.events[0].error.name,'EmptyError');
  }
});

test('S13-NATIVE LAST: explicit undefined default is still a successful output',()=>{
  assert.deepEqual(collect(EMPTY.pipe(last(null,undefined))).events,
    [{kind:'N',value:undefined},{kind:'C'}]);
  assert.deepEqual(collect(of(1,2).pipe(last(x=>x>3,'fallback'))).events,
    [{kind:'N',value:'fallback'},{kind:'C'}]);
});

test('S13-NATIVE LAST: callback and source errors retain exact original identity',()=>{
  const err=Symbol('predicate');
  assert.deepEqual(collect(of(1).pipe(last(()=>{throw err;}))).events,[{kind:'E',error:err}]);
  const upstreamError={reason:'bad'};
  assert.deepEqual(collect(throwError(()=>upstreamError).pipe(last())).events,[{kind:'E',error:upstreamError}]);
});

test('S13-NATIVE LAST: cancellation discards retained value rather than emitting it',()=>{
  const src=new Subject(),out=collect(src.pipe(last()));
  src.next(1);out.subscription.unsubscribe();src.complete();
  assert.deepEqual(out.events,[]);
});

test('S13-NATIVE MAPTO: one exact constant object per source next with same reference',()=>{
  const constant=Object.freeze({constant:true});
  const out=collect(of(1,2,3).pipe(mapTo(constant)));
  assert.deepEqual(out.events.at(-1),{kind:'C'});
  assert.equal(values(out.events).length,3);
  assert.ok(values(out.events).every(x=>x===constant));
});

test('S13-NATIVE MAPTO: constant captured at assembly but source stays lazy',()=>{
  const calls=[],constValue='X';
  const source=defer(()=>{calls.push('connect');return of(1,2);});
  const result=source.pipe(mapTo(constValue));
  assert.deepEqual(calls,[]);
  assert.deepEqual(collect(result).events,[
    {kind:'N',value:'X'},{kind:'N',value:'X'},{kind:'C'}
  ]);
  assert.deepEqual(calls,['connect']);
});

test('S13-NATIVE MAPTO: error unchanged, constant not emitted after failure',()=>{
  const err=Symbol('upstream');
  const out=collect(throwError(()=>err).pipe(mapTo('constant')));
  assert.deepEqual(out.events,[{kind:'E',error:err}]);
});

test('S13-NATIVE MAPTO: does not introduce time, cancellation or sharing',()=>{
  const src=new Subject(),events1=[],events2=[];
  const result=src.pipe(mapTo('K'));
  const one=result.subscribe(v=>events1.push(v));
  src.next(1);
  const two=result.subscribe(v=>events2.push(v));
  src.next(2);
  one.unsubscribe();src.next(3);two.unsubscribe();
  assert.deepEqual(events1,['K','K']);
  assert.deepEqual(events2,['K','K']);
});

test('S13-NATIVE MAPTO: cancellation is silent, not a completion notification',()=>{
  const src=new Subject(),out=collect(src.pipe(mapTo(7)));
  out.subscription.unsubscribe();src.next(9);src.complete();
  assert.deepEqual(out.events,[]);
});
