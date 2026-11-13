import test from 'node:test';
import assert from 'node:assert/strict';
import { Subject, Observable, of, defer } from 'rxjs';
import { pluck, publish, publishBehavior, publishLast, publishReplay } from 'rxjs/operators';

const collect=stream=>{
  const events=[];
  const subscription=stream.subscribe({
    next:value=>events.push({kind:'N',value}),
    complete:()=>events.push({kind:'C'}),
    error:error=>events.push({kind:'E',error}),
  });
  return {events,subscription};
};
const nexts=out=>out.events.filter(e=>e.kind==='N').map(e=>e.value);

test('S16 NATIVE pluck: one nested value per input including missing and null intermediates',()=>{
  const out=collect(of({person:{name:'Ada'}},{person:{}},{person:null},{other:1})
    .pipe(pluck('person','name')));
  assert.deepEqual(out.events,[{kind:'N',value:'Ada'}, {kind:'N',value:undefined},
    {kind:'N',value:undefined},{kind:'N',value:undefined},{kind:'C'}]);
});
test('S16 NATIVE pluck: explicit three-level path retains reference identity',()=>{
  const identity=Object.freeze({id:77});
  const out=collect(of({a:{b:{c:identity}}}).pipe(pluck('a','b','c')));
  assert.strictEqual(nexts(out)[0],identity);
});
test('S16 NATIVE pluck: empty path throws at construction, not subscription time',()=>{
  assert.throws(()=>pluck(),/list of properties cannot be empty/);
});
test('S16 NATIVE pluck: value error identity, downstream cancellation and cold independence',()=>{
  const src=new Subject(),err=Object.freeze({bad:true});
  const a=collect(src.pipe(pluck('x'))),b=collect(src.pipe(pluck('x')));
  src.next({x:1});a.subscription.unsubscribe();src.next({x:2});src.error(err);
  assert.deepEqual(nexts(a),[1]);assert.deepEqual(nexts(b),[1,2]);
  assert.strictEqual(b.events.at(-1).error,err);
  assert.equal(src.observed,false);
});

test('S16 NATIVE publish: two observers share exactly one source subscription on connect()',()=>{
  let connections=0,teardowns=0,sink;
  const source=new Observable(subscriber=>{
    connections++;sink=subscriber;
    return ()=>{teardowns++;};
  });
  const connected=source.pipe(publish());
  const a=collect(connected),b=collect(connected);
  assert.equal(connections,0);
  const link=connected.connect();assert.equal(connections,1);
  sink.next('shared');
  assert.deepEqual(nexts(a),['shared']);assert.deepEqual(nexts(b),['shared']);
  a.subscription.unsubscribe();
  assert.equal(teardowns,0,'one observer leaving is not refCount cancellation');
  sink.next('still-live');
  assert.deepEqual(nexts(b),['shared','still-live']);
  link.unsubscribe();assert.equal(teardowns,1);
  b.subscription.unsubscribe();
});
test('S16 NATIVE publish: connect is idempotent while active and disconnect can reconnect',()=>{
  let connects=0,teardowns=0,sink;
  const src=new Observable(subscriber=>{connects++;sink=subscriber;return ()=>{teardowns++;};});
  const result=src.pipe(publish());
  const observer=collect(result);
  const first=result.connect(),same=result.connect();
  assert.strictEqual(first,same);
  sink.next(1);first.unsubscribe();sink.next(99);
  result.connect();sink.next(2);
  assert.deepEqual(nexts(observer),[1,2]);assert.equal(connects,2);assert.equal(teardowns,1);
  observer.subscription.unsubscribe(); // upstream still connected; manual cleanup
  result.connect().unsubscribe();
  assert.equal(teardowns,2);
});
test('S16 NATIVE publish: a new subscriber receives only subsequent values; terminal subscriber completes',()=>{
  const source=new Subject(),c=source.pipe(publish());
  const a=collect(c);c.connect();source.next('one');
  const b=collect(c);source.next('two');source.complete();
  const late=collect(c);
  assert.deepEqual(a.events,[{kind:'N',value:'one'},{kind:'N',value:'two'},{kind:'C'}]);
  assert.deepEqual(b.events,[{kind:'N',value:'two'},{kind:'C'}]);
  assert.deepEqual(late.events,[{kind:'C'}]);
});
test('S16 NATIVE publish: error identity is preserved and source observer is released',()=>{
  const src=new Subject(),out$=src.pipe(publish()),a=collect(out$),err={message:'exact'};
  out$.connect();src.error(err);
  assert.strictEqual(a.events[0].error,err);
  assert.equal(src.observed,false);
});

test('S16 NATIVE publishBehavior: joining observers see seed and latest synchronously',()=>{
  const src=new Subject(),output=src.pipe(publishBehavior(0));
  const a=collect(output);
  assert.deepEqual(a.events,[{kind:'N',value:0}]);
  const link=output.connect();
  src.next(4);
  const b=collect(output);
  assert.deepEqual(nexts(a),[0,4]);assert.deepEqual(nexts(b),[4]);
  src.next(5);assert.deepEqual(nexts(b),[4,5]);
  link.unsubscribe();
});
test('S16 NATIVE publishBehavior: completion does not replay retained value to late observer',()=>{
  const source=new Subject(),c=source.pipe(publishBehavior('initial'));
  const first=collect(c);c.connect();source.next('last');source.complete();
  assert.deepEqual(nexts(first),['initial','last']);
  assert.deepEqual(collect(c).events,[{kind:'C'}]);
});
test('S16 NATIVE publishBehavior: source error identity and no late replay',()=>{
  const src=new Subject(),c=src.pipe(publishBehavior('start')),early=collect(c),err=Object.freeze({code:1});
  c.connect();src.next('value');src.error(err);
  assert.deepEqual(nexts(early),['start','value']);
  assert.deepEqual(collect(c).events,[{kind:'E',error:err}]);
});

test('S16 NATIVE publishLast: only last value emitted after successful completion, including late subscriber',()=>{
  const src=new Subject(),c=src.pipe(publishLast()),a=collect(c);
  c.connect();src.next(1);src.next(2);
  assert.deepEqual(a.events,[]);
  const b=collect(c);src.complete();
  for(const out of [a,b,collect(c)])
    assert.deepEqual(out.events,[{kind:'N',value:2},{kind:'C'}]);
});
test('S16 NATIVE publishLast: empty complete gives no value and late observer completes',()=>{
  const src=new Subject(),c=src.pipe(publishLast()),a=collect(c);
  c.connect();src.complete();
  assert.deepEqual(a.events,[{kind:'C'}]);
  assert.deepEqual(collect(c).events,[{kind:'C'}]);
});
test('S16 NATIVE publishLast: an error prevents replay of cached value',()=>{
  const err=Object.freeze({kind:'bad'}),src=new Subject(),c=src.pipe(publishLast()),a=collect(c);
  c.connect();src.next(123);src.error(err);
  assert.deepEqual(a.events,[{kind:'E',error:err}]);
  assert.deepEqual(collect(c).events,[{kind:'E',error:err}]);
});

test('S16 NATIVE publishReplay: count window emits FIFO history to late and terminal observers',()=>{
  const src=new Subject(),c=src.pipe(publishReplay(2)),a=collect(c);
  c.connect();src.next('a');src.next('b');src.next('c');
  const b=collect(c);
  assert.deepEqual(nexts(a),['a','b','c']);
  assert.deepEqual(nexts(b),['b','c']);
  src.complete();
  assert.deepEqual(collect(c).events,[{kind:'N',value:'b'},{kind:'N',value:'c'},{kind:'C'}]);
});
test('S16 NATIVE publishReplay: source error retains history and exact error for late consumers',()=>{
  const err=Object.freeze({reason:'source'}),src=new Subject(),c=src.pipe(publishReplay(2));
  const a=collect(c);c.connect();src.next(1);src.next(2);src.next(3);src.error(err);
  assert.strictEqual(a.events.at(-1).error,err);
  const late=collect(c);
  assert.deepEqual(nexts(late),[2,3]);
  assert.strictEqual(late.events.at(-1).error,err);
});
test('S16 NATIVE publishReplay: zero size clamps to one and explicit disconnection retains buffer',()=>{
  let sinks=[],teardowns=0;
  const src=new Observable(sub=>{sinks.push(sub);return ()=>{teardowns++;};});
  const c=src.pipe(publishReplay(0));
  const first=collect(c),link=c.connect();
  sinks.at(-1).next(1);sinks.at(-1).next(2);
  link.unsubscribe();assert.equal(teardowns,1);
  const middle=collect(c);assert.deepEqual(nexts(middle),[2]);
  c.connect();sinks.at(-1).next(3);
  assert.deepEqual(nexts(middle),[2,3]);
  assert.deepEqual(nexts(first),[1,2,3]);
  c.connect().unsubscribe();
});
test('S16 NATIVE publish exports are deprecated but retain their exact export names',async()=>{
  const exports=await import('rxjs/operators');
  for(const name of ['pluck','publish','publishBehavior','publishLast','publishReplay'])
    assert.equal(typeof exports[name],'function');
});
