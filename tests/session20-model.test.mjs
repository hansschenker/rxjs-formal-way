import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateModel,stepModel,runTrace,
  createTakeLastModel,createTapModel,createThrottleSignalModel,
  createThrottleTimeModel,createThrowIfEmptyModel,
  takeLastExample,tapExample,throttleExample,throttleTimeExample,throwIfEmptyExample
} from '../dist/index.js';

const trace=(m,events)=>runTrace(m,events.map((event,time)=>({time,event})),{executionId:'session20-model'});
const output=t=>t.steps.flatMap(x=>x.actions.filter(a=>a.type==='notify').map(a=>a.notification));
const action=(t,type)=>t.steps.flatMap(x=>x.actions).filter(x=>x.type===type);
const resource=(id,generation=0)=>({id,generation});

for(const [label,model,inputs] of [
  ['takeLast',createTakeLastModel(2),takeLastExample],
  ['tap',createTapModel(),tapExample],
  ['throttle',createThrottleSignalModel({leading:true,trailing:true}),throttleExample],
  ['throttleTime',createThrottleTimeModel(3,{leading:true,trailing:true}),throttleTimeExample],
  ['throwIfEmpty',createThrowIfEmptyModel(),throwIfEmptyExample]
]){
  test('S20 '+label+': canonical six-tuple passes model validation and example trace',()=>{
    assert.deepEqual(validateModel(model),[]);
    const t=runTrace(model,inputs,{executionId:'S20-'+label});
    assert.equal(t.consumed,inputs.length);
    assert.equal(t.state.phase,'Closed');
    assert.ok(model.rules.length>=6);
    for(const step of t.steps)assert.match(step.ruleId,/^S20-/);
  });
}
test('S20 takeLast: FIFO emits only upon successful completion and exactly preserves order',()=>{
  const t=trace(createTakeLastModel(2),[
    {type:'subscribe'},{type:'source.next',value:'a'},{type:'source.next',value:'b'},
    {type:'source.next',value:'c'},{type:'source.complete'}
  ]);
  assert.deepEqual(output(t),[{kind:'N',value:'b'},{kind:'N',value:'c'},{kind:'C'}]);
  assert.equal(t.steps[2].actions.length,0);
  assert.equal(t.steps[3].actions.length,0);
  assert.equal(action(t,'subscribe').length,1);
  assert.equal(action(t,'unsubscribe').length,1);
});
test('S20 takeLast: short input drains all, count zero never acquires source',()=>{
  const short=trace(createTakeLastModel(3),[
    {type:'subscribe'},{type:'source.next',value:1},{type:'source.complete'}]);
  assert.deepEqual(output(short),[{kind:'N',value:1},{kind:'C'}]);
  const zero=trace(createTakeLastModel(0),[{type:'subscribe'}]);
  assert.deepEqual(output(zero),[{kind:'C'}]);
  assert.equal(action(zero,'subscribe').length,0);
});
test('S20 takeLast: exact upstream errors discard buffer; cancellation is silent',()=>{
  const boom={upstream:1};
  const a=trace(createTakeLastModel(2),[
    {type:'subscribe'},{type:'source.next',value:7},{type:'source.error',error:boom}]);
  assert.deepEqual(output(a),[{kind:'E',error:boom}]);
  const b=trace(createTakeLastModel(2),[
    {type:'subscribe'},{type:'source.next',value:7},{type:'cancel'}]);
  assert.deepEqual(output(b),[]);
});
test('S20 takeLast: forbidden late input and unsupported capacity are rejected',()=>{
  assert.throws(()=>createTakeLastModel(9),RangeError);
  const m=createTakeLastModel(0),s=stepModel(m,m.initialState(),{type:'subscribe'}).state;
  assert.throws(()=>stepModel(m,s,{type:'source.next',value:1}),/illegal/);
});

test('S20 tap: callback invocation precedes forwarding, exact payload preserved',()=>{
  const value={id:1},m=createTapModel();
  const t=trace(m,[{type:'subscribe'},{type:'source.next',value},
    {type:'callback.return',resource:resource('tap-next',0)},{type:'source.complete'}]);
  assert.deepEqual(output(t),[{kind:'N',value},{kind:'C'}]);
  assert.equal(output({steps:t.steps.slice(0,2)}).length,0);
  assert.deepEqual(action(t,'invoke-callback').map(x=>x.value),[value]);
  assert.equal(output(t)[0].value,value);
});
test('S20 tap: an unrelated callback occurrence cannot authorize output',()=>{
  const m=createTapModel(),calling=trace(m,[{type:'subscribe'},{type:'source.next',value:'x'}]).state;
  assert.throws(()=>stepModel(m,calling,{type:'callback.return',resource:resource('tap-next',3)}),/illegal/);
});
test('S20 tap: synchronous handler throw fails result, unsubscribes producer',()=>{
  const boom={handler:1},t=trace(createTapModel(),[
    {type:'subscribe'},{type:'source.next',value:1},
    {type:'callback.throw',resource:resource('tap-next',0),error:boom}]);
  assert.deepEqual(output(t),[{kind:'E',error:boom}]);
  assert.deepEqual(action(t,'unsubscribe').map(x=>x.resource.id),['source']);
});
test('S20 tap: no-op identity, source error identity and cancellation',()=>{
  const direct=trace(createTapModel(false),[
    {type:'subscribe'},{type:'source.next',value:undefined},{type:'source.complete'}]);
  assert.deepEqual(output(direct),[{kind:'N',value:undefined},{kind:'C'}]);
  assert.equal(action(direct,'invoke-callback').length,0);
  const boom={id:7},error=trace(createTapModel(),[
    {type:'subscribe'},{type:'source.error',error:boom}]);
  assert.deepEqual(output(error),[{kind:'E',error:boom}]);
  assert.deepEqual(output(trace(createTapModel(),[{type:'subscribe'},{type:'cancel'}])),[]);
});

test('S20 throwIfEmpty: default factory errors only for confirmed empty completion',()=>{
  const empty=trace(createThrowIfEmptyModel(),[{type:'subscribe'},{type:'source.complete'}]);
  assert.equal(output(empty)[0].kind,'E');
  assert.equal(output(empty)[0].error.name,'EmptyError');
  const present=trace(createThrowIfEmptyModel(),[
    {type:'subscribe'},{type:'source.next',value:undefined},{type:'source.complete'}]);
  assert.deepEqual(output(present),[{kind:'N',value:undefined},{kind:'C'}]);
});
test('S20 throwIfEmpty: custom factory invocation on empty completion and return identity',()=>{
  const boom={custom:true};
  const t=trace(createThrowIfEmptyModel('custom'),[
    {type:'subscribe'},{type:'source.complete'},
    {type:'factory.return',resource:resource('errorFactory',0),value:boom}]);
  assert.deepEqual(output(t),[{kind:'E',error:boom}]);
  assert.equal(action(t,'invoke-callback').length,1);
});
test('S20 throwIfEmpty: factory throw and upstream error preserve their own identities',()=>{
  const factory={factory:true},source={source:true};
  assert.deepEqual(output(trace(createThrowIfEmptyModel('custom'),[
    {type:'subscribe'},{type:'source.complete'},
    {type:'factory.throw',resource:resource('errorFactory',0),error:factory}
  ])),[{kind:'E',error:factory}]);
  assert.deepEqual(output(trace(createThrowIfEmptyModel('custom'),[
    {type:'subscribe'},{type:'source.error',error:source}
  ])),[{kind:'E',error:source}]);
  assert.equal(action(trace(createThrowIfEmptyModel('custom'),[
    {type:'subscribe'},{type:'source.error',error:source}]),'invoke-callback').length,0);
});

test('S20 throttle: leading/trailing with two window occurrences, completion waits only for pending value',()=>{
  const m=createThrottleSignalModel({leading:true,trailing:true});
  const t=runTrace(m,throttleExample,{executionId:'S20-throttle'});
  assert.deepEqual(output(t),[
    {kind:'N',value:'A'},{kind:'N',value:'B'},{kind:'N',value:'C'},{kind:'C'}
  ]);
  assert.deepEqual(action(t,'subscribe').map(x=>x.resource.id),['source','duration','duration']);
  assert.equal(t.steps[5].after.phase,'Waiting');
  assert.equal(t.steps[6].after.phase,'Closed');
});
test('S20 throttle: default leading-only suppresses and releases on duration next',()=>{
  const t=trace(createThrottleSignalModel(),[
    {type:'subscribe'},
    {type:'source.next',value:1,now:0},
    {type:'source.next',value:2,now:1},
    {type:'duration.next',resource:resource('duration',0)},
    {type:'source.next',value:3,now:2},
    {type:'source.complete'}
  ]);
  assert.deepEqual(output(t),[{kind:'N',value:1},{kind:'N',value:3},{kind:'C'}]);
});
test('S20 throttle: empty duration completion must not flush trailing candidate',()=>{
  const t=trace(createThrottleSignalModel({leading:false,trailing:true}),[
    {type:'subscribe'},
    {type:'source.next',value:'pending',now:0},
    {type:'source.complete'},
    {type:'duration.complete',resource:resource('duration',0)}
  ]);
  assert.deepEqual(output(t),[{kind:'C'}]);
});
test('S20 throttle: unrelated duration generation is not allowed',()=>{
  const m=createThrottleSignalModel(),s=trace(m,[
    {type:'subscribe'},{type:'source.next',value:'A',now:0}
  ]).state;
  assert.throws(()=>stepModel(m,s,{type:'duration.next',resource:resource('duration',9)}),/illegal/);
});
test('S20 throttle: duration and source failures preserve exact identity',()=>{
  for(const where of ['duration','source']){
    const boom={where},m=createThrottleSignalModel(),prefix=[
      {type:'subscribe'},{type:'source.next',value:'A',now:0}
    ];
    const t=trace(m,[...prefix,where==='source'
      ? {type:'source.error',error:boom}
      : {type:'duration.error',resource:resource('duration',0),error:boom}]);
    assert.deepEqual(output(t),[{kind:'N',value:'A'},{kind:'E',error:boom}]);
  }
});
test('S20 throttleTime: scheduler tick is guarded by generation AND due time',()=>{
  const m=createThrottleTimeModel(3,{leading:true,trailing:true});
  const t=runTrace(m,throttleTimeExample,{executionId:'S20-throttle-time'});
  assert.deepEqual(output(t),[
    {kind:'N',value:'A'},{kind:'N',value:'B'},{kind:'N',value:'C'},{kind:'C'}]);
  assert.equal(action(t,'schedule').length,2);
  assert.equal(t.steps[5].after.phase,'Waiting');
  assert.equal(action(t,'cancel-timer').length,2);
  const s=trace(m,[{type:'subscribe'},{type:'source.next',value:'A',now:1}]).state;
  assert.throws(()=>stepModel(m,s,{type:'timer.fire',resource:resource('throttle-timer',0),now:3}),/illegal/);
});
test('S20 throttleTime: invalid duration and time are not admitted',()=>{
  assert.throws(()=>createThrottleTimeModel(0),RangeError);
  assert.throws(()=>createThrottleTimeModel(1.5),RangeError);
  const m=createThrottleTimeModel(2),s=stepModel(m,m.initialState(),{type:'subscribe'}).state;
  assert.throws(()=>stepModel(m,s,{type:'source.next',value:'bad',now:-1}),/illegal/);
});
