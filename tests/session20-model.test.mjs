import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, runTrace, validateModel, toManifest } from '../dist/runner.js';
import { createTakeLastModel, createThrowIfEmptyModel, takeLastExample, takeLastZeroExample, throwIfEmptyExample } from '../dist/models/session20-terminal.js';
import { createTapModel, allTapHooks, tapExample, tapNextExample } from '../dist/models/session20-tap.js';
import { createThrottleModel, createThrottleTimeModel, throttleExample, runThrottleTrace } from '../dist/models/session20-throttle.js';
const ref = (id, generation = 0) => ({ id, generation });
const notifications = actions => actions.filter(a => a.type === 'notify').map(a => a.notification);
const execute = (model, events) => {
  let state = model.initialState(); const actions = []; const rules = [];
  for (const event of events) { const result = stepModel(model, state, event); state = result.state; actions.push(...result.actions); rules.push(result.ruleId); }
  return { state, actions, rules };
};
const configs = [
  { leading: true, trailing: false }, { leading: true, trailing: true },
  { leading: false, trailing: true }, { leading: false, trailing: false },
];
const models = [createTakeLastModel(2), createTakeLastModel(0), createTapModel(), createTapModel(['next']),
  createThrowIfEmptyModel('default'), createThrowIfEmptyModel('custom'),
  ...configs.flatMap(c => [createThrottleModel(c), createThrottleTimeModel(4, c)])];
for (const model of models) test(`S20 MODEL ${model.metadata.id}: canonical metadata, named guards and deterministic manifest`, () => {
  assert.deepEqual(validateModel(model), []);
  assert.deepEqual(model.initialState(), { phase: 'Unsubscribed' });
  assert.equal(model.metadata.rxjsVersion, '7.8.2');
  assert.match(model.metadata.cardinality.signature, /Cω/);
  assert.equal(model.metadata.evidence.record, 'evidence/SESSION-20.md');
  assert.ok(model.metadata.sources.some(s => s.url.includes('/spec/operators/')));
  assert.ok(model.rules.every(r => r.description.nextState && r.description.obligations.length));
  assert.equal(JSON.stringify(toManifest(model)), JSON.stringify(toManifest(model)));
});

test('S20 takeLast: only newest references flush FIFO at successful completion', () => {
  const a = {}, b = {}, c = {};
  const m = createTakeLastModel(2);
  const r = execute(m, [{ type: 'subscribe' }, ...[a,b,c].map(value => ({ type: 'source.next', value })), { type: 'source.complete' }]);
  assert.deepEqual(notifications(r.actions), [{ kind:'N',value:b }, { kind:'N',value:c }, { kind:'C' }]);
  assert.equal(notifications(r.actions)[0].value, b);
  assert.equal(r.actions.at(-1).type, 'unsubscribe');
  assert.ok(r.rules.includes('S20-TAKELAST-REPLACE-OLDEST'));
});
for (const count of [-8,-1,0]) test(`S20 takeLast(${count}): no source connection and no unreachable collection rules`, () => {
  const m = createTakeLastModel(count), r = execute(m, [{ type:'subscribe' }]);
  assert.deepEqual(r.actions, [{ type:'notify',target:'downstream',notification:{kind:'C'} }]);
  assert.deepEqual(m.rules.map(r=>r.description.id), ['S20-TAKELAST-START-EMPTY']);
});
for (const terminal of [{type:'source.error',error:{}},{type:'cancel'}]) test(`S20 takeLast: ${terminal.type} never flushes`, () => {
  const r = execute(createTakeLastModel(2), [{type:'subscribe'},{type:'source.next',value:undefined},terminal]);
  assert.ok(!notifications(r.actions).some(n=>n.kind==='N'));
  assert.equal(r.actions.at(-1).type,'unsubscribe');
});
test('S20 takeLast: immutable buffer update and domain guards', () => {
  const m = createTakeLastModel(2), s = Object.freeze({phase:'Collecting',buffer:Object.freeze([1])});
  const r = stepModel(m,s,{type:'source.next',value:2});
  assert.deepEqual(s.buffer,[1]); assert.deepEqual(r.state.buffer,[1,2]);
  for(const n of [NaN,Infinity,1.5,9,-9])assert.throws(()=>createTakeLastModel(n));
  assert.throws(()=>stepModel(m,{phase:'Collecting',buffer:[1,2,3]},{type:'cancel'}));
});

test('S20 throwIfEmpty: factory is invoked only on empty completion with exact outcome identity', () => {
  const m = createThrowIfEmptyModel('custom'), fault = {};
  const r = execute(m,[{type:'subscribe'},{type:'source.complete'},{type:'callback.return',resource:ref('errorFactory'),value:fault}]);
  assert.equal(r.actions.filter(a=>a.type==='invoke-callback').length,1);
  assert.equal(notifications(r.actions)[0].error,fault);
  assert.deepEqual(r.state,{phase:'Closed',reason:'error'});
});
test('S20 throwIfEmpty: undefined is nonempty; error and cancellation bypass factory', () => {
  for(const terminal of [{type:'source.complete'},{type:'source.error',error:'E'},{type:'cancel'}]){
    const r=execute(createThrowIfEmptyModel(),[{type:'subscribe'},{type:'source.next',value:undefined},terminal]);
    assert.equal(r.actions.filter(a=>a.type==='invoke-callback').length,0);
    assert.deepEqual(notifications(r.actions)[0],{kind:'N',value:undefined});
  }
});
test('S20 throwIfEmpty: custom factory throw, stale and impossible outcomes', () => {
  const m=createThrowIfEmptyModel('custom');
  const r=execute(m,[{type:'subscribe'},{type:'source.complete'},{type:'callback.throw',resource:ref('errorFactory'),error:undefined}]);
  assert.deepEqual(notifications(r.actions),[{kind:'E',error:undefined}]);
  assert.throws(()=>stepModel(m,{phase:'CreatingError'},{type:'callback.return',resource:ref('errorFactory',1),value:'x'}));
  assert.throws(()=>stepModel(createThrowIfEmptyModel(),{phase:'CreatingError'},{type:'callback.throw',resource:ref('errorFactory'),error:'x'}));
});

test('S20 tap: normal callbacks preserve payload identity; terminal hook does not run unsubscribe', () => {
  const value={}; const r=execute(createTapModel(),[{type:'subscribe'},{type:'source.next',value},
    {type:'callback.return',resource:ref('tap.next')},{type:'source.complete'},
    {type:'callback.return',resource:ref('tap.complete',1)}]);
  assert.equal(notifications(r.actions)[0].value,value);
  assert.deepEqual(r.actions.filter(a=>a.type==='invoke-callback').map(a=>a.resource.id),['tap.subscribe','tap.next','tap.complete','tap.finalize']);
  assert.deepEqual(r.actions.slice(-2).map(a=>a.type),['unsubscribe','invoke-callback']);
});
for(const hook of ['next','error','complete'])test(`S20 tap: ${hook} throw has the precise unsubscription policy`,()=>{
  const e=hook==='next'?{type:'source.next',value:'A'}:hook==='error'?{type:'source.error',error:'source-error'}:{type:'source.complete'};
  const r=execute(createTapModel(),[{type:'subscribe'},e,{type:'callback.throw',resource:ref('tap.'+hook),error:'hook-error'}]);
  assert.deepEqual(notifications(r.actions),[{kind:'E',error:'hook-error'}]);
  assert.equal(r.actions.some(a=>a.type==='invoke-callback'&&a.resource.id==='tap.unsubscribe'),hook==='next');
  assert.equal(r.actions.at(-1).resource.id,'tap.finalize');
});
test('S20 tap: missing hooks are bypassed, cancellation silent, and foreign outcomes rejected',()=>{
  const r=execute(createTapModel([]),[{type:'subscribe'},{type:'source.next',value:1},{type:'cancel'}]);
  assert.deepEqual(notifications(r.actions),[{kind:'N',value:1}]);
  assert.ok(!r.actions.some(a=>a.type==='invoke-callback'));
  const m=createTapModel(['next']), s=execute(m,[{type:'subscribe'},{type:'source.next',value:1}]).state;
  assert.throws(()=>stepModel(m,s,{type:'callback.return',resource:ref('tap.next',1)}));
  assert.throws(()=>stepModel(m,s,{type:'source.next',value:2}));
  assert.throws(()=>createTapModel(['next','next']));
});

for(const c of configs)for(const mode of ['throttle','throttleTime'])test(`S20 ${mode} ${Number(c.leading)}${Number(c.trailing)}: concrete completion-wait trace`,()=>{
  const m=mode==='throttle'?createThrottleModel(c):createThrottleTimeModel(4,c);
  const r=runThrottleTrace(m,throttleExample(mode,c),{executionId:'s20-example'});
  const actual=r.steps.flatMap(s=>s.actions.filter(a=>a.type==='notify').map(a=>({time:s.time,...a.notification})));
  const expected=[...(c.leading?[{time:1,kind:'N',value:'A'}]:[]),...(c.trailing?[{time:5,kind:'N',value:'B'}]:[]),{time:c.trailing?5:3,kind:'C'}];
  assert.deepEqual(actual,expected);
  assert.equal(m.rules.some(r=>r.description.from==='Waiting'),c.trailing);
  assert.equal(m.rules.some(r=>r.description.from==='Selecting'),mode==='throttle');
});
test('S20 throttle: empty duration completion neither flushes nor erases internal pending memory',()=>{
  const m=createThrottleModel({leading:false,trailing:true});
  const r=execute(m,[{type:'subscribe',now:0},{type:'source.next',value:undefined,now:1},
    {type:'callback.return',resource:ref('durationSelector'),token:'D',now:1},
    {type:'duration.complete',resource:ref('duration'),now:2}]);
  assert.equal(r.state.phase,'Open');assert.equal(r.state.hasValue,true);assert.equal(r.state.value,undefined);
  assert.deepEqual(notifications(r.actions),[]);
  const end=stepModel(m,r.state,{type:'source.complete',now:3});assert.deepEqual(notifications(end.actions),[{kind:'C'}]);
});
test('S20 throttle: trailing next restarts duration with emitted value as selector input',()=>{
  const m=createThrottleModel({leading:true,trailing:true});
  const r=execute(m,[{type:'subscribe',now:0},{type:'source.next',value:'A',now:1},
    {type:'callback.return',resource:ref('durationSelector'),token:'D',now:1},
    {type:'source.next',value:'B',now:2},{type:'duration.next',resource:ref('duration'),now:4}]);
  assert.equal(r.state.phase,'Selecting');assert.equal(r.state.argument,'B');assert.equal(r.state.hasValue,false);
  assert.deepEqual(r.actions.slice(-3).map(a=>a.type),['unsubscribe','notify','invoke-callback']);
  assert.equal(r.actions.at(-1).value,'B');assert.equal(r.actions.at(-1).index,1);
});
test('S20 throttle: waiting empty completion notifies before final duration release; next releases before flushing',()=>{
  for(const kind of ['duration.complete','duration.next']){
    const m=createThrottleModel({leading:false,trailing:true});
    const s=execute(m,[{type:'subscribe',now:0},{type:'source.next',value:'A',now:1},
      {type:'callback.return',resource:ref('durationSelector'),token:'D',now:1},{type:'source.complete',now:2}]).state;
    const r=stepModel(m,s,{type:kind,resource:ref('duration'),now:3});
    assert.deepEqual(r.actions.map(a=>a.type),kind==='duration.complete'?['notify','unsubscribe']:['unsubscribe','notify','notify']);
    assert.ok(!r.actions.some(a=>a.type==='subscribe'||a.type==='invoke-callback'));
  }
});
test('S20 throttleTime: late timer output uses supplied time; stale, early and inconsistent clock events fail',()=>{
  const m=createThrottleTimeModel(4,{leading:false,trailing:true});
  const s=execute(m,[{type:'subscribe',now:10},{type:'source.next',value:'A',now:11}]).state;
  assert.equal(s.due,15);
  assert.throws(()=>stepModel(m,s,{type:'timer.fire',resource:ref('throttleTimer'),now:14}));
  assert.throws(()=>stepModel(m,s,{type:'timer.fire',resource:ref('throttleTimer',1),now:15}));
  const r=stepModel(m,s,{type:'timer.fire',resource:ref('throttleTimer'),now:20});
  assert.equal(r.state.clock,20);assert.equal(r.state.due,24);
  assert.throws(()=>runThrottleTrace(m,[{time:1,event:{type:'subscribe',now:0}}],{executionId:'bad'}));
  for(const duration of [0,-1,Infinity,NaN,1.5,1001])assert.throws(()=>createThrottleTimeModel(duration));
});

// A finite, explicitly bounded witness search: reachability evidence, NOT universal equivalence.
function candidates(model,s){
  const op=model.metadata.operator;
  if(s.phase==='Closed')return [];
  if(s.phase==='Unsubscribed')return [op.startsWith('throttle')?{type:'subscribe',now:0}:{type:'subscribe'}];
  if(op==='tap'&&s.phase==='Calling')return [{type:'callback.return',resource:ref('tap.'+s.hook,s.invocation)},{type:'callback.throw',resource:ref('tap.'+s.hook,s.invocation),error:'E'}];
  if(s.phase==='CreatingError')return [{type:'callback.return',resource:ref('errorFactory'),value:'E'},...(model.parameters.factory==='custom'?[{type:'callback.throw',resource:ref('errorFactory'),error:'E'}]:[])];
  if(op.startsWith('throttle')){
    const now=s.clock;
    if(s.phase==='Selecting')return [{type:'callback.return',resource:ref('durationSelector',s.generation),token:'D',now},{type:'callback.throw',resource:ref('durationSelector',s.generation),error:'E',now}];
    const events=s.phase==='Waiting'?[{type:'cancel',now}]:[{type:'source.next',value:'V',now},{type:'source.complete',now},{type:'source.error',error:'E',now},{type:'cancel',now}];
    if(s.phase==='Throttled'||s.phase==='Waiting'){
      if(op==='throttleTime')events.push({type:'timer.fire',resource:ref('throttleTimer',s.generation),now:Math.max(now,s.due)});
      else events.push({type:'duration.next',resource:ref('duration',s.generation),now},{type:'duration.complete',resource:ref('duration',s.generation),now},{type:'duration.error',resource:ref('duration',s.generation),error:'E',now});
    }
    return events;
  }
  return [{type:'source.next',value:'V'},{type:'source.complete'},{type:'source.error',error:'E'},{type:'cancel'}];
}
for(const m of models)test(`S20 REACHABILITY ${m.metadata.id}: every retained rule has a legal prefix`,()=>{
  const queue=[{state:m.initialState(),depth:0}],seen=new Set(),covered=new Set();
  for(let i=0;i<queue.length;i++){
    const {state,depth}=queue[i],key=JSON.stringify(state);
    if(seen.has(key)||depth>9)continue;seen.add(key);
    for(const e of candidates(m,state)){
      const r=stepModel(m,state,e);covered.add(r.ruleId);
      if((r.state.invocation??0)<=3&&(r.state.nextGeneration??0)<=3)queue.push({state:r.state,depth:depth+1});
    }
  }
  assert.deepEqual([...covered].sort(),m.rules.map(r=>r.description.id).sort());
  console.log('SESSION20_REACHABILITY',JSON.stringify({profile:m.metadata.id,states:seen.size,rules:covered.size,maxDepth:9,maxGeneration:3}));
});
test('S20 examples: standard trace generation remains legal and does not execute business functions',()=>{
  for(const[m,events]of [[createTakeLastModel(2),takeLastExample],[createTakeLastModel(0),takeLastZeroExample],
    [createTapModel(),tapExample],[createTapModel(['next']),tapNextExample],[createThrowIfEmptyModel('custom'),throwIfEmptyExample]]){
    assert.equal(runTrace(m,events,{executionId:'s20'}).state.phase,'Closed');
  }
});
