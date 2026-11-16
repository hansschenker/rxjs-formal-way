import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSingleModel, createSkipLastModel, createSubscribeOnModel,
  createSwitchMapToModel, createSwitchScanModel,
  singleExample, skipLastExample, subscribeOnExample, switchMapToExample, switchScanExample,
  runTrace, stepModel, validateModel, toManifest, renderInspectionIndex
} from '../dist/index.js';

const ref=(id,generation=0)=>({id,generation});
const trace=(model,events)=>runTrace(model,events.map((event,time)=>({time,event})),{executionId:'S19-tests'});
const output=t=>t.steps.flatMap(x=>x.actions).filter(a=>a.type==='notify').map(a=>a.notification);
const actions=t=>t.steps.flatMap(x=>x.actions);
const call=t=>actions(t).filter(a=>a.type==='invoke-callback');
const op=(model,input)=>{
  assert.deepEqual(validateModel(model),[]);
  const m=toManifest(model);
  assert.equal(m.metadata.rxjsVersion,'7.8.2');
  assert.equal(m.metadata.evidence.record,'evidence/SESSION-19.md');
  assert.match(m.metadata.sources[0].url,/e5351d02e225e275ac0e497c7b66eaa5f0c88791/);
  assert.ok(m.rules.length>=5);
  const t=runTrace(model,input,{executionId:'S19-generated-example'});
  assert.equal(t.status,'finished-input');
  assert.equal(t.consumed,input.length);
  const page=renderInspectionIndex(m.metadata.operator,[{name:m.metadata.operator,manifest:m}],
    'src/models/session19.ts');
  for(const label of ['1 | Operator Overview','8 | Canonical Mealy Model','9 | RxJS 7.8.2 Source','11 | Evidence Ledger'])
    assert.ok(page.includes(label),m.metadata.operator+' '+label);
};

test('S19 models: five source-inspected, distinct operator exports, valid eleven-step artifacts',()=>{
  const entries=[
    [createSingleModel(true),singleExample],
    [createSkipLastModel(2),skipLastExample],
    [createSubscribeOnModel(2),subscribeOnExample],
    [createSwitchMapToModel('shared'),switchMapToExample],
    [createSwitchScanModel(0),switchScanExample]
  ];
  assert.deepEqual(entries.map(([m])=>m.metadata.operator),
    ['single','skipLast','subscribeOn','switchMapTo','switchScan']);
  for(const [model,input] of entries) op(model,input);
});

test('S19 single direct: first value retained, exactly one emitted only at completion',()=>{
  const t=trace(createSingleModel(),[{type:'subscribe'},{type:'source.next',value:3},{type:'source.complete'}]);
  assert.deepEqual(output(t),[{kind:'N',value:3},{kind:'C'}]);
  assert.equal(t.steps[1].actions.length,0);
  assert.equal(t.state.reason,'complete');
});
test('S19 single direct: empty fails with EmptyError, and two next values fail immediately',()=>{
  const empty=trace(createSingleModel(),[{type:'subscribe'},{type:'source.complete'}]);
  assert.equal(output(empty)[0].error.name,'EmptyError');
  const dup=trace(createSingleModel(),[{type:'subscribe'},{type:'source.next',value:1},
    {type:'source.next',value:2}]);
  assert.equal(output(dup)[0].error.name,'SequenceError');
  assert.equal(dup.state.reason,'duplicate');
  assert.equal(actions(dup).filter(a=>a.type==='unsubscribe').length,1);
});
test('S19 single predicate: one match among rejects emits original object at completion',()=>{
  const a={k:1},b={k:2},c={k:3};
  const t=trace(createSingleModel(true),[
    {type:'subscribe'},
    {type:'source.next',value:a},{type:'callback.return',resource:ref('predicate',0),value:false},
    {type:'source.next',value:b},{type:'callback.return',resource:ref('predicate',1),value:true},
    {type:'source.next',value:c},{type:'callback.return',resource:ref('predicate',2),value:false},
    {type:'source.complete'}]);
  assert.equal(output(t)[0].value,b);
  assert.deepEqual(call(t).map(a=>a.index),[0,1,2]);
});
test('S19 single predicate: nonempty no-match is NotFoundError, not EmptyError',()=>{
  const t=trace(createSingleModel(true),[{type:'subscribe'},{type:'source.next',value:3},
    {type:'callback.return',resource:ref('predicate',0),value:false},{type:'source.complete'}]);
  assert.equal(output(t)[0].error.name,'NotFoundError');
});
test('S19 single predicate: second match errors without waiting for completion',()=>{
  const t=trace(createSingleModel(true),[{type:'subscribe'},{type:'source.next',value:1},
    {type:'callback.return',resource:ref('predicate',0),value:true},
    {type:'source.next',value:2},{type:'callback.return',resource:ref('predicate',1),value:true}]);
  assert.equal(output(t)[0].error.name,'SequenceError');
  assert.equal(t.state.reason,'duplicate');
});
test('S19 single callback: throws preserve exact error object and source teardown',()=>{
  const e={predicate:'failed'};
  const t=trace(createSingleModel(true),[{type:'subscribe'},{type:'source.next',value:5},
    {type:'callback.throw',resource:ref('predicate',0),error:e}]);
  assert.equal(output(t)[0].error,e);
  assert.equal(actions(t).filter(a=>a.type==='unsubscribe').length,1);
});
test('S19 single: correlated callback index guard rejects stale outcome',()=>{
  const m=createSingleModel(true);
  const t=trace(m,[{type:'subscribe'},{type:'source.next',value:1}]);
  assert.throws(()=>stepModel(m,t.state,{type:'callback.return',resource:ref('predicate',3),value:true}),/illegal/);
});
test('S19 single: cancellation discards matched candidate without emitting',()=>{
  const t=trace(createSingleModel(),[{type:'subscribe'},{type:'source.next',value:42},{type:'cancel'}]);
  assert.deepEqual(output(t),[]);
  assert.equal(t.state.reason,'cancel');
});
test('S19 single: undefined payload is a valid unique candidate (presence bit)',()=>{
  const t=trace(createSingleModel(),[{type:'subscribe'},{type:'source.next',value:undefined},
    {type:'source.complete'}]);
  assert.deepEqual(output(t),[{kind:'N',value:undefined},{kind:'C'}]);
});

test('S19 skipLast: first count values held, each later next releases FIFO head',()=>{
  const t=trace(createSkipLastModel(2),[{type:'subscribe'},...[1,2,3,4].map(value=>({type:'source.next',value})),
    {type:'source.complete'}]);
  assert.deepEqual(output(t),[{kind:'N',value:1},{kind:'N',value:2},{kind:'C'}]);
  assert.equal(t.steps[1].actions.length,0);
  assert.equal(t.steps[2].actions.length,0);
});
test('S19 skipLast: source shorter than window completes with no next',()=>{
  const t=trace(createSkipLastModel(3),[{type:'subscribe'},{type:'source.next',value:1},
    {type:'source.next',value:2},{type:'source.complete'}]);
  assert.deepEqual(output(t),[{kind:'C'}]);
});
test('S19 skipLast: count zero models identity without buffering',()=>{
  const t=trace(createSkipLastModel(0),[{type:'subscribe'},{type:'source.next',value:'a'},
    {type:'source.next',value:'b'},{type:'source.complete'}]);
  assert.deepEqual(output(t),[{kind:'N',value:'a'},{kind:'N',value:'b'},{kind:'C'}]);
  assert.equal(t.steps[2].after.pending.length,0);
});
test('S19 skipLast: cancellation never flushes trailing FIFO',()=>{
  const t=trace(createSkipLastModel(2),[{type:'subscribe'},{type:'source.next',value:1},
    {type:'source.next',value:2},{type:'cancel'}]);
  assert.deepEqual(output(t),[]);
  assert.equal(actions(t).filter(a=>a.type==='unsubscribe').length,1);
});
test('S19 skipLast: errors keep original identity and suppress retained values',()=>{
  const e={source:'boom'};
  const t=trace(createSkipLastModel(2),[{type:'subscribe'},{type:'source.next',value:1},
    {type:'source.error',error:e}]);
  assert.equal(output(t)[0].error,e);
  assert.equal(output(t).length,1);
});
test('S19 skipLast: bounded configuration rejects negative, fractional and excessive ring counts',()=>{
  for(const n of [-1,1.5,9,Infinity])assert.throws(()=>createSkipLastModel(n),/0..8/);
});

test('S19 subscribeOn: schedule precedes connection, source values forward immediately after timer',()=>{
  const t=trace(createSubscribeOnModel(2),[{type:'subscribe'},
    {type:'timer.fire',resource:ref('subscription-action'),now:2},
    {type:'source.next',value:1},{type:'source.complete'}]);
  assert.deepEqual(t.steps[0].actions.map(x=>x.type),['schedule']);
  assert.deepEqual(t.steps[1].actions.map(x=>x.type),['subscribe']);
  assert.deepEqual(output(t),[{kind:'N',value:1},{kind:'C'}]);
});
test('S19 subscribeOn: cancellation before scheduler fires prevents source subscription',()=>{
  const t=trace(createSubscribeOnModel(2),[{type:'subscribe'},{type:'cancel'}]);
  assert.deepEqual(actions(t).map(a=>a.type),['schedule','cancel-timer']);
  assert.deepEqual(output(t),[]);
});
test('S19 subscribeOn: cancellation after connection releases source only',()=>{
  const t=trace(createSubscribeOnModel(2),[{type:'subscribe'},
    {type:'timer.fire',resource:ref('subscription-action'),now:2},{type:'cancel'}]);
  assert.deepEqual(actions(t).map(a=>a.type),['schedule','subscribe','unsubscribe']);
});
test('S19 subscribeOn: stale and premature scheduler notifications are illegal',()=>{
  const m=createSubscribeOnModel(3);
  const x=trace(m,[{type:'subscribe'}]);
  assert.throws(()=>stepModel(m,x.state,{type:'timer.fire',resource:ref('subscription-action',1),now:3}),/illegal/);
  assert.throws(()=>stepModel(m,x.state,{type:'timer.fire',resource:ref('subscription-action'),now:2}),/illegal/);
});
test('S19 subscribeOn: source error after connection retains exact identity',()=>{
  const e={a:'b'};
  const t=trace(createSubscribeOnModel(0),[{type:'subscribe'},
    {type:'timer.fire',resource:ref('subscription-action'),now:0},{type:'source.error',error:e}]);
  assert.equal(output(t)[0].error,e);
});

test('S19 switchMapTo: constant source token used for every fresh occurrence',()=>{
  const t=trace(createSwitchMapToModel('same'),[
    {type:'subscribe'}, {type:'outer.next',value:1},
    {type:'callback.return',resource:ref('constant',0),value:'same'},
    {type:'inner.next',resource:ref('inner',0),value:'first'},
    {type:'outer.next',value:2},
    {type:'callback.return',resource:ref('constant',1),value:'same'},
    {type:'outer.complete'},
    {type:'inner.next',resource:ref('inner',1),value:'second'},
    {type:'inner.complete',resource:ref('inner',1)}
  ]);
  assert.deepEqual(output(t),[{kind:'N',value:'first'},{kind:'N',value:'second'},{kind:'C'}]);
  assert.equal(actions(t).filter(a=>a.type==='subscribe'&&a.resource.id==='inner').length,2);
  assert.equal(actions(t).filter(a=>a.type==='unsubscribe'&&a.resource.id==='inner').length,2);
  assert.deepEqual(call(t).map(a=>a.resource.id),['constant','constant']);
});
test('S19 switchMapTo: wrong constant source token is illegal',()=>{
  const m=createSwitchMapToModel('same');
  const x=trace(m,[{type:'subscribe'},{type:'outer.next',value:1}]);
  assert.throws(()=>stepModel(m,x.state,{type:'callback.return',resource:ref('constant',0),value:'other'}),/illegal/);
});
test('S19 switchMapTo: outer error tears down current inner, no completion',()=>{
  const e={reason:'outer'};
  const t=trace(createSwitchMapToModel('same'),[
    {type:'subscribe'}, {type:'outer.next',value:1},
    {type:'callback.return',resource:ref('constant',0),value:'same'}, {type:'outer.error',error:e}
  ]);
  assert.equal(output(t)[0].error,e);
  assert.equal(t.state.reason,'outer-error');
});

test('S19 switchScan: accumulator snapshot is latest INNER output at admission',()=>{
  const t=trace(createSwitchScanModel(10),[
    {type:'subscribe'}, {type:'outer.next',value:1},
    {type:'callback.return',resource:ref('accumulator',0),value:'a'},
    {type:'inner.next',resource:ref('inner',0),value:20},
    {type:'outer.next',value:2}, {type:'callback.return',resource:ref('accumulator',1),value:'b'},
    {type:'inner.next',resource:ref('inner',1),value:30},
    {type:'outer.complete'}, {type:'inner.complete',resource:ref('inner',1)}
  ]);
  assert.deepEqual(call(t).map(a=>a.value),[
    {accumulator:10,value:1},{accumulator:20,value:2}
  ]);
  assert.deepEqual(output(t),[{kind:'N',value:20},{kind:'N',value:30},{kind:'C'}]);
  assert.equal(t.state.reason,'complete');
});
test('S19 switchScan: cancelled inner cannot change accumulator',()=>{
  const m=createSwitchScanModel(0);
  const t=trace(m,[
    {type:'subscribe'}, {type:'outer.next',value:1},
    {type:'callback.return',resource:ref('accumulator',0),value:'a'},
    {type:'outer.next',value:2},
    {type:'callback.return',resource:ref('accumulator',1),value:'b'}
  ]);
  assert.equal(t.state.accumulator,0);
  assert.throws(()=>stepModel(m,t.state,{type:'inner.next',resource:ref('inner',0),value:100}),/illegal/);
});
test('S19 switchScan: most recent inner may emit multiple accumulator updates',()=>{
  const t=trace(createSwitchScanModel('seed'),[
    {type:'subscribe'}, {type:'outer.next',value:1},
    {type:'callback.return',resource:ref('accumulator',0),value:'a'},
    {type:'inner.next',resource:ref('inner',0),value:'A'},
    {type:'inner.next',resource:ref('inner',0),value:'B'},
    {type:'outer.complete'}, {type:'inner.complete',resource:ref('inner',0)}
  ]);
  assert.deepEqual(output(t),[{kind:'N',value:'A'},{kind:'N',value:'B'},{kind:'C'}]);
});
