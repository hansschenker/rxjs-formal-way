import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Observable, Subject, EMPTY, NEVER, of, take, distinct, distinctUntilChanged,
  distinctUntilKeyChanged, pairwise, startWith,
} from 'rxjs';
import {
  createDistinctUntilChangedModel, createDistinctUntilKeyChangedModel, createDistinctModel,
  createPairwiseModel, createStartWithModel,
} from '../dist/index.js';
import {
  observeSession4Model, observeSession4Rx, legalWords, notifications, lifetimes,
} from './helpers/session4-driver.mjs';

const N = value => ({ kind: 'N', value }), C = { kind: 'C' }, E = error => ({ kind: 'E', error }), cancel = { kind: 'cancel' };
const F = { kind: 'F' }, FC = { kind: 'FC' }, FE = error => ({ kind: 'FE', error });
const error = { tag: 'unchanged-error-identity' };
const observed = xs => xs.filter(x=>x.kind==='N'||x.kind==='E'||x.kind==='C');
const recordedLifecycle = result => {
  const grouped = new Map();
  for (const x of lifetimes(result)) {
    const list = grouped.get(x.resource) ?? [];
    list.push([x.kind,x.time]);
    grouped.set(x.resource,list);
  }
  return [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b));
};
function compare(model, words, options = {}) {
  const expected = observeSession4Model(model, words, options);
  const actual = observeSession4Rx(model, words, options);
  assert.deepEqual(notifications(actual), notifications(expected), JSON.stringify({name:model.metadata.operator,params:model.parameters,words}));
  assert.deepEqual(recordedLifecycle(actual),recordedLifecycle(expected),JSON.stringify({lifetime:model.metadata.operator,words}));
  assert.deepEqual(actual.calls,expected.calls,JSON.stringify({callbacks:model.metadata.operator,words}));
  return {actual,expected};
}

for (const [name, model, words, options] of [
  ['distinctUntilChanged',createDistinctUntilChangedModel(),[N(1),N(1),N(2),N(1),C],{}],
  ['distinctUntilChanged-select',createDistinctUntilChangedModel({keyMode:'selected',compareMode:'custom'}),
    [N({code:'A'}),N({code:'a'}),N({code:'B'}),C],{keySelector:v=>v.code,comparator:(a,b)=>a.toLowerCase()===b.toLowerCase()}],
  ['distinctUntilKeyChanged',createDistinctUntilKeyChangedModel('code'),[N({code:'a'}),N({code:'a'}),N({code:'b'}),C],{}],
  ['distinctUntilKeyChanged-custom',createDistinctUntilKeyChangedModel('code','custom'),
    [N({code:'A'}),N({code:'a'}),N({code:'B'}),C],{comparator:(a,b)=>a.toLowerCase()===b.toLowerCase()}],
  ['distinct',createDistinctModel({withFlushes:true}),[N(1),N(1),F,N(1),FC,N(1),C],{}],
  ['distinct-selected',createDistinctModel({selected:true,withFlushes:true}),
    [N({code:1}),N({code:1}),F,N({code:1}),C],{keySelector:v=>v.code}],
  ['pairwise',createPairwiseModel(),[N(undefined),N(2),N(3),C],{}],
  ['startWith',createStartWithModel(['first','second']),[N(2),N(3),C],{}],
]) {
  test('S4-RX '+name+': literal notifications, callback invocations, subscription times and teardown agree',()=>{
    const {actual}=compare(model,words,options);
    assert.equal(observed(actual.observations).at(-1).kind,'C');
  });
}

test('S4-RX distinctUntilChanged: strict equality differs from Set SameValueZero on NaN and keeps last-emitted value',()=>{
  const a=compare(createDistinctUntilChangedModel(),[N(NaN),N(NaN),N(0),N(-0),C]).actual;
  assert.equal(observed(a.observations).filter(x=>x.kind==='N').length,3);
  const b=compare(createDistinctModel(),[N(NaN),N(NaN),N(0),N(-0),C]).actual;
  assert.equal(observed(b.observations).filter(x=>x.kind==='N').length,2);
});
test('S4-RX selected adjacent: selector invoked on FIRST and rejected source values; output remains original object',()=>{
  const one={key:'a',n:1},two={key:'a',n:2},three={key:'b',n:3},seen=[];
  const values=[];
  of(one,two,three).pipe(distinctUntilChanged(undefined,x=>{seen.push(x);return x.key;})).subscribe(x=>values.push(x));
  assert.deepEqual(seen,[one,two,three]);
  assert.deepEqual(values,[one,three]);
  assert.strictEqual(values[0],one);
});
test('S4-RX adjacent: key selector throws before output; comparator error tears source down',()=>{
  const selectorError={reason:'selector'},compareError={reason:'compare'};
  const s=compare(createDistinctUntilChangedModel({keyMode:'selected'}),[N(1)],{keySelector:()=>{throw selectorError;}});
  assert.strictEqual(notifications(s.actual).at(-1).error,selectorError);
  const c=compare(createDistinctUntilChangedModel({compareMode:'custom'}),[N(1),N(2)],{comparator:()=>{throw compareError;}});
  assert.strictEqual(notifications(c.actual).at(-1).error,compareError);
  const k=compare(createDistinctUntilKeyChangedModel('code','custom'),[N({code:1}),N({code:2})],{comparator:()=>{throw compareError;}});
  assert.strictEqual(notifications(k.actual).at(-1).error,compareError);
});
test('S4-RX distinct: notifier.next clears history, notifier.complete does not complete output, notifier.error propagates',()=>{
  const model=createDistinctModel({withFlushes:true});
  for(const words of [[N(1),F,N(1),C],[N(1),FC,N(1),C],[N(1),FE(error)]])compare(model,words);
  const r=compare(model,[N(1),FC,N(1),C]).actual;
  assert.deepEqual(observed(r.observations).map(x=>x.kind==='N'?x.value:x.kind),[1,'C']);
  const e=compare(model,[N(1),FE(error)]).actual;
  assert.strictEqual(observed(e.observations).at(-1).error,error);
});
test('S4-RX distinct: NaN de-duplicates, zero shares Set key, Object identity is not structural equality',()=>{
  const left={n:1},right={n:1};
  const model=createDistinctModel();
  const o=compare(model,[N(NaN),N(NaN),N(-0),N(0),N(left),N(left),N(right),C]).actual;
  assert.deepEqual(observed(o.observations).filter(x=>x.kind==='N').map(x=>x.value),[NaN,-0,left,right]);
});
test('S4-RX pairwise: first value silent; each pair preserves references and source lifetime',()=>{
  const a={},b={},c={};
  const o=compare(createPairwiseModel(),[N(a),N(b),N(c),C]).actual;
  const pairs=observed(o.observations).filter(x=>x.kind==='N').map(x=>x.value);
  assert.strictEqual(pairs[0][0],a);assert.strictEqual(pairs[0][1],b);assert.strictEqual(pairs[1][1],c);
  assert.notStrictEqual(pairs[0],pairs[1]);
  compare(createPairwiseModel(),[C]);
  compare(createPairwiseModel(),[N(1),C]);
});
test('S4-RX startWith: prefixes precede subscription and are delivered again for each independent result subscription',()=>{
  let connects=0;const logs=[];
  const source=new Observable(sub=>{connects++;sub.next('source');sub.complete();});
  const out=source.pipe(startWith(undefined,null,'first'));
  out.subscribe(v=>logs.push(v));out.subscribe(v=>logs.push(v));
  assert.equal(connects,2);
  assert.deepEqual(logs,[undefined,null,'first','source',undefined,null,'first','source']);
});
test('S4-RX startWith: take(1) during synchronous prefix prevents source subscription entirely',()=>{
  let acquired=0;
  const source=new Observable(sub=>{acquired++;sub.next('source');sub.complete();});
  const output=[];
  source.pipe(startWith('a','b'),take(1)).subscribe({next:v=>output.push(v),complete:()=>output.push('C')});
  assert.deepEqual(output,['a','C']);assert.equal(acquired,0);
});
test('S4-RX startWith: zero values behave as identity and prefix precedes even immediate empty/error',()=>{
  compare(createStartWithModel([]),[N(1),C]);
  compare(createStartWithModel(['seed']),[C]);
  compare(createStartWithModel(['seed']),[E(error)]);
  compare(createStartWithModel(['seed']),[cancel]);
});
test('S4-RX lifecycle: source error and cancellation preserve distinct terminal policies',()=>{
  for(const model of [createDistinctUntilChangedModel(),createDistinctUntilKeyChangedModel('code'),createDistinctModel(),createDistinctModel({withFlushes:true}),createPairwiseModel(),createStartWithModel(['seed'])]){
    const value = model.metadata.operator === 'distinctUntilKeyChanged' ? {code:'a'} : 1;
    compare(model,[N(value),E(error)]);
    compare(model,[N(value),cancel]);
  }
});
test('S4-RX shared source remains live while each result subscription owns independent comparison/pair memory',()=>{
  const bus=new Subject(),a=[],b=[];
  const stream=bus.pipe(pairwise());
  const s1=stream.subscribe(x=>a.push(x));bus.next(1);
  const s2=stream.subscribe(x=>b.push(x));bus.next(2);bus.next(3);
  assert.deepEqual(a,[[1,2],[2,3]]);
  assert.deepEqual(b,[[2,3]]);
  s1.unsubscribe();s2.unsubscribe();
});
test('S4-RX no artificial internal timers: equal-time arrival order determines pairwise and distinct results',()=>{
  const model=createPairwiseModel();
  const words=[{time:1,kind:'N',value:1},{time:1,kind:'N',value:2},{time:1,kind:'N',value:3},{time:1,kind:'C'}];
  const pair=compare(model,words).actual;
  assert.deepEqual(observed(pair.observations).filter(x=>x.kind==='N').map(x=>x.value),[[1,2],[2,3]]);
  const changed=compare(createDistinctUntilChangedModel(),words).actual;
  assert.deepEqual(observed(changed.observations).filter(x=>x.kind==='N').map(x=>x.value),[1,2,3]);
});

test('S4-RX-DIFF: 5 operator exports, multiple profiles, bounded words and exact subscription lifetimes',()=>{
  const configs=[
    [createDistinctUntilChangedModel(),{},[N(1),N(2),N(NaN),C,E(error),cancel],3],
    [createDistinctUntilChangedModel({keyMode:'selected',compareMode:'custom'}),
     {keySelector:x=>x.key,comparator:(a,b)=>a.toLowerCase()===b.toLowerCase()},
     [N({key:'A'}),N({key:'a'}),N({key:'B'}),C,E(error),cancel],3],
    [createDistinctUntilKeyChangedModel('code'),{},[N({code:1}),N({code:2}),N({code:1}),C,E(error),cancel],3],
    [createDistinctUntilKeyChangedModel('code','custom'),{comparator:(a,b)=>a.toLowerCase()===b.toLowerCase()},
     [N({code:'A'}),N({code:'a'}),N({code:'B'}),C,E(error),cancel],3],
    [createDistinctModel(),{},[N(1),N(2),N(NaN),C,E(error),cancel],3],
    [createDistinctModel({withFlushes:true}),{},[N(1),N(2),F,C,E(error),cancel],3],
    [createDistinctModel({selected:true,withFlushes:true}),{keySelector:x=>x.code},
     [N({code:1}),N({code:2}),F,C,E(error),cancel],3],
    [createPairwiseModel(),{},[N(1),N(2),N(undefined),C,E(error),cancel],3],
    [createStartWithModel(['start','again']),{},[N(1),N(2),C,E(error),cancel],3],
  ];
  let comparisons=0;
  for(const [model,options,alphabet,depth] of configs){
    for(const word of legalWords(alphabet,depth)){
      compare(model,word,options); comparisons++;
    }
  }
  assert.equal(comparisons,configs.reduce((n,[,,,depth])=>n+[0,1,2,3].slice(0,depth+1).reduce((sum,k)=>sum+Math.pow(6,k),0),0));
  assert.ok(comparisons>1500);
});
