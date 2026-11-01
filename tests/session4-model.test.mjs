import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDistinctUntilChangedModel, createDistinctUntilKeyChangedModel, createDistinctModel,
  createPairwiseModel, createStartWithModel, distinctUntilChangedExample, distinctUntilKeyChangedExample,
  distinctExample, pairwiseExample, startWithExample,
  validateModel, toManifest, stepModel, runTrace,
  renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace,
} from '../dist/index.js';
import { observeSession4Model, notifications, lifetimes } from './helpers/session4-driver.mjs';

const factories = [
  ['distinctUntilChanged', () => createDistinctUntilChangedModel(), distinctUntilChangedExample],
  ['distinctUntilKeyChanged', () => createDistinctUntilKeyChangedModel('code'), distinctUntilKeyChangedExample],
  ['distinct', () => createDistinctModel({ withFlushes: true }), distinctExample],
  ['pairwise', createPairwiseModel, pairwiseExample],
  ['startWith', () => createStartWithModel(['before-a', 'before-b']), startWithExample],
];
const N = value => ({ kind: 'N', value }), C = { kind: 'C' }, E = error => ({ kind: 'E', error }), cancel = { kind: 'cancel' };
for (const [name, factory, example] of factories) {
  test('S4-MODEL ' + name + ': canonical rules, deterministic views, trace provenance, and 6-tuple fields', () => {
    const model = factory(), manifest = toManifest(model);
    assert.deepEqual(validateModel(model), []);
    assert.equal(manifest.metadata.operator, name);
    assert.equal(manifest.metadata.schemaVersion, name === 'pairwise' || name === 'startWith' ? '1.0' : '1.1');
    assert.ok(manifest.metadata.cardinality.signature.includes(name));
    assert.equal(manifest.metadata.sources.some(x => x.url.endsWith('/' + name + '.ts')), true);
    assert.equal(new Set(manifest.rules.map(x => x.id)).size, manifest.rules.length);
    for (const render of [renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior]) {
      const result = render(manifest);
      assert.equal(result, render(manifest));
      for (const rule of manifest.rules) assert.ok(result.includes(rule.id), 'missing ' + rule.id);
    }
    const trace = runTrace(model, example, { executionId: 'session4-' + name });
    assert.equal(trace.status, 'finished-input');
    assert.equal(trace.state.phase, 'Closed');
    assert.match(renderTrace(trace), /Four lanes/);
    assert.equal(trace.steps.every(step => step.modelId === manifest.metadata.id), true);
  });
  test('S4-MODEL ' + name + ': independent subscriptions own fresh bookkeeping and invalid events are rejected', () => {
    const m = factory();
    assert.notStrictEqual(m.initialState(), m.initialState());
    const active = stepModel(m, m.initialState(), { type: 'subscribe' }).state;
    assert.throws(() => stepModel(m, active, { type: 'subscribe' }), /illegal/);
    assert.throws(() => stepModel(m, m.initialState(), { type: 'source.complete' }), /illegal/);
    const invalid = name === 'startWith' ? { phase: 'Prefix', index: Number.MAX_SAFE_INTEGER } :
      name === 'pairwise' ? { phase: 'Active', hasPrevious: true } :
      name === 'distinct' ? { phase: 'Active', keys: [NaN,NaN], index: 0, flushOpen: true } :
      { phase: 'Active', index: -1, hasPrevious: false };
    assert.notDeepEqual(m.validateState(invalid, m.parameters), []);
  });
}

test('S4-MODEL adjacent: first, unchanged, changed, and remembered-EMITTED-key rule order', () => {
  const m = createDistinctUntilChangedModel();
  const result = observeSession4Model(m, [N(1), N(1), N(2), N(1), C]);
  assert.deepEqual(notifications(result).map(x=>x.kind==='N'?x.value:x.kind), [1,2,1,'C']);
  for (const id of ['DISTINCTUNTILCHANGED-FIRST','DISTINCTUNTILCHANGED-COMPARE','DISTINCTUNTILCHANGED-SAME','DISTINCTUNTILCHANGED-CHANGE']) assert.ok(result.rules.includes(id), id);
});
test('S4-MODEL adjacent: strict equality is not SameValueZero for NaN', () => {
  const m = createDistinctUntilChangedModel();
  const output = notifications(observeSession4Model(m,[N(NaN),N(NaN),N(0),N(-0),C]));
  assert.equal(output.filter(x=>x.kind==='N').length,3);
  assert.ok(Number.isNaN(output[1].value));
});
test('S4-MODEL adjacent: key selector runs for rejected values, comparator does not advance emitted key', () => {
  const m=createDistinctUntilChangedModel({keyMode:'selected',compareMode:'custom'});
  const result=observeSession4Model(m,[N({key:'A'}),N({key:'a'}),N({key:'B'}),N({key:'b'}),C],{
    keySelector:x=>x.key,
    comparator:(a,b)=>a.toLowerCase()===b.toLowerCase(),
  });
  assert.deepEqual(notifications(result).filter(x=>x.kind==='N').map(x=>x.value.key),['A','B']);
  assert.deepEqual(result.calls.filter(c=>c.kind==='key').map(x=>x.input.key),['A','a','B','b']);
  assert.deepEqual(result.calls.filter(c=>c.kind==='compare').map(x=>x.previous),['A','A','B']);
});
test('S4-MODEL key changed: selected property tracks the last emitted item', () => {
  const m=createDistinctUntilKeyChangedModel('code');
  const result=observeSession4Model(m,[N({code:1}),N({code:1}),N({code:2}),N({code:1}),C]);
  assert.deepEqual(notifications(result).filter(x=>x.kind==='N').map(x=>x.value.code),[1,2,1]);
});
test('S4-MODEL adjacent: stale/foreign callback outcomes and pending reentry are illegal', () => {
  const m=createDistinctUntilChangedModel(), initial=stepModel(m,m.initialState(),{type:'subscribe'}).state;
  const selecting=stepModel(m,initial,{type:'source.next',value:1}).state;
  for (const e of [
    {type:'key.return',resource:{id:'key',generation:99},value:1},
    {type:'key.return',resource:{id:'compare',generation:0},value:1},
    {type:'source.next',value:3}, {type:'source.complete'}, {type:'cancel'},
  ]) assert.throws(()=>stepModel(m,selecting,e),/illegal/);
  const active=stepModel(m,selecting,{type:'key.return',resource:{id:'key',generation:0},value:1}).state;
  const next=stepModel(m,active,{type:'source.next',value:2}).state;
  const comparing=stepModel(m,next,{type:'key.return',resource:{id:'key',generation:1},value:2}).state;
  assert.throws(()=>stepModel(m,comparing,{type:'compare.return',resource:{id:'compare',generation:0},same:true}),/illegal/);
});
test('S4-MODEL adjacent: key and comparator exceptions and source lifecycle remain distinct', () => {
  const configs=[
    [createDistinctUntilChangedModel({keyMode:'selected'}), {keySelector:()=>{throw 'selector';}},[N(1)], 'selector'],
    [createDistinctUntilChangedModel({compareMode:'custom'}), {comparator:()=>{throw 'comparator';}},[N(1),N(2)], 'comparator'],
    [createDistinctUntilKeyChangedModel('code','custom'), {comparator:()=>{throw 'custom-key';}},[N({code:1}),N({code:2})], 'custom-key'],
  ];
  for (const [m,opts,word,error] of configs) {
    const r=observeSession4Model(m,word,opts);
    assert.strictEqual(notifications(r).at(-1).error,error);
    assert.equal(r.state.phase,'Closed');
  }
  const model=createDistinctUntilChangedModel();
  for(const [word,kind] of [[E('source-fault'),'E'],[cancel,undefined],[C,'C']]){
    const r=observeSession4Model(model,[N(1),word]);
    assert.equal(notifications(r).at(-1)?.kind,kind==='E'?'E':kind==='C'?'C':'N');
    assert.equal(r.state.phase,'Closed');
  }
});

test('S4-MODEL distinct: Set membership remembers all keys and uses SameValueZero', () => {
  const m=createDistinctModel();
  const r=observeSession4Model(m,[N(NaN),N(NaN),N(0),N(-0),N(1),N(NaN),C]);
  const values=notifications(r).filter(x=>x.kind==='N').map(x=>x.value);
  assert.equal(values.length,3);assert.ok(Number.isNaN(values[0]));assert.deepEqual(values.slice(1),[0,1]);
});
test('S4-MODEL distinct: flush.next clears set, flush.complete retains set without completing downstream', () => {
  const m=createDistinctModel({withFlushes:true}), r=observeSession4Model(m,[N(1),N(1),{kind:'F'},N(1),{kind:'FC'},N(1),C]);
  assert.deepEqual(notifications(r).map(x=>x.kind==='N'?x.value:x.kind),[1,1,'C']);
  assert.ok(r.rules.includes('DISTINCT-FLUSH')&&r.rules.includes('DISTINCT-FLUSH-COMPLETE'));
  assert.deepEqual(lifetimes(r).filter(x=>x.resource==='flush').map(x=>x.kind),['subscribe','unsubscribe']);
});
test('S4-MODEL distinct: notifier error releases source and notifier, source error preserves identity', () => {
  const m=createDistinctModel({withFlushes:true});
  for(const word of [[N(1),{kind:'FE',error:'flush-fault'}],[N(1),E('source-fault')]]){
    const r=observeSession4Model(m,word);
    assert.equal(notifications(r).at(-1).kind,'E');
    assert.equal(lifetimes(r).filter(x=>x.kind==='unsubscribe').length,2);
  }
});
test('S4-MODEL distinct: selector errors and selected-key result preserve original values', () => {
  const m=createDistinctModel({selected:true,withFlushes:true});
  const a={code:1},b={code:1},c={code:2};
  const r=observeSession4Model(m,[N(a),N(b),N(c),C],{keySelector:x=>x.code});
  assert.deepEqual(notifications(r).filter(x=>x.kind==='N').map(x=>x.value),[a,c]);
  assert.deepEqual(r.calls.map(x=>x.input),[a,b,c]);
  const error=new Error('key');
  const bad=observeSession4Model(m,[N(a)],{keySelector:()=>{throw error;}});
  assert.strictEqual(notifications(bad).at(-1).error,error);
  assert.equal(bad.state.phase,'Closed');
});
test('S4-MODEL distinct: configured flush is required and invalid state duplicates fail', () => {
  const m=createDistinctModel(), state=stepModel(m,m.initialState(),{type:'subscribe'}).state;
  assert.throws(()=>stepModel(m,state,{type:'flush.next'}),/illegal/);
  assert.throws(()=>stepModel(m,state,{type:'key.return',resource:{id:'select',generation:0},value:1}),/illegal/);
  assert.notDeepEqual(m.validateState({phase:'Active',keys:[0,-0],index:1,flushOpen:false},m.parameters),[]);
});

test('S4-MODEL pairwise: memory presence is separate from undefined payload', () => {
  const m=createPairwiseModel(),o=observeSession4Model(m,[N(undefined),N(5),N(undefined),C]);
  assert.deepEqual(notifications(o).map(x=>x.kind==='N'?x.value:x.kind),[[undefined,5],[5,undefined],'C']);
  assert.ok(o.rules.includes('PAIRWISE-FIRST')&&o.rules.includes('PAIRWISE-NEXT'));
});
test('S4-MODEL pairwise: zero and one source values emit no pair', () => {
  for(const w of [[C],[N('a'),C]]){
    const o=observeSession4Model(createPairwiseModel(),w);
    assert.deepEqual(notifications(o).map(x=>x.kind),['C']);
  }
});
test('S4-MODEL pairwise: pair items preserve object identity and fresh arrays', () => {
  const a={},b={},c={},r=observeSession4Model(createPairwiseModel(),[N(a),N(b),N(c),C]);
  const pair=notifications(r).filter(x=>x.kind==='N').map(x=>x.value);
  assert.notStrictEqual(pair[0],pair[1]);
  assert.strictEqual(pair[0][0],a);assert.strictEqual(pair[0][1],b);assert.strictEqual(pair[1][1],c);
});

test('S4-MODEL startWith: prefix values precede SOURCE ACQUISITION', () => {
  const r=observeSession4Model(createStartWithModel(['a','b']),[N('c'),C]);
  assert.deepEqual(notifications(r).map(x=>x.kind==='N'?x.value:x.kind),['a','b','c','C']);
  assert.equal(r.observations.findIndex(x=>x.kind==='subscribe'),2);
  assert.equal(r.observations.findIndex(x=>x.kind==='subscribe'&&x.resource==='source'),2);
});
test('S4-MODEL startWith: zero prefixes acquire source at subscribe; source empty or errors still follow prefix', () => {
  const zero=observeSession4Model(createStartWithModel([]),[N(1),C]);
  assert.deepEqual(notifications(zero).map(x=>x.kind==='N'?x.value:x.kind),[1,'C']);
  const err=observeSession4Model(createStartWithModel(['seed']),[E('fail')]);
  assert.deepEqual(notifications(err).map(x=>x.kind==='N'?x.value:x.kind),['seed','E']);
  assert.equal(err.observations.at(-1).kind,'unsubscribe');
});
test('S4-MODEL startWith: cancellation during prefix prevents source subscription', () => {
  const m=createStartWithModel([1,2,3]);
  const r=observeSession4Model(m,[],{cancelAfterPrefix:1});
  assert.deepEqual(notifications(r).map(x=>x.value),[1]);
  assert.deepEqual(lifetimes(r),[]);
  assert.equal(r.state.reason,'cancel');
});
test('S4-MODEL startWith: prefix completion is illegal before all values were emitted', () => {
  const m=createStartWithModel([1,2]),s=stepModel(m,m.initialState(),{type:'subscribe'}).state;
  assert.throws(()=>stepModel(m,s,{type:'prefix.complete'}),/illegal/);
  assert.throws(()=>stepModel(m,s,{type:'source.next',value:9}),/illegal/);
});
test('S4-MODEL startWith: undefined/null/repeated prefixes are literal values', () => {
  const r=observeSession4Model(createStartWithModel([undefined,null,undefined]),[C]);
  assert.deepEqual(notifications(r).map(x=>x.kind==='N'?x.value:x.kind),[undefined,null,undefined,'C']);
});
