import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRetryWhenModel, createRefCountModel, createSampleModel, createSampleTimeModel,
  createSequenceEqualModel, runTrace, stepModel, validateModel, toManifest,
  retryWhenExample, refCountExample, sampleExample, sampleTimeExample, sequenceEqualExample
} from '../dist/index.js';
const src = generation => ({id:'source',generation});
const tick = generation => ({id:'periodic',generation});
const actions = trace => trace.steps.flatMap(step=>step.actions);
const output = trace => actions(trace).filter(a=>a.type==='notify'&&a.target==='downstream')
  .map(a=>a.notification);
const evaluate = (model,events) =>
  runTrace(model,events.map((event,time)=>({time,event})),{executionId:'S18-model-test'});
const counts = (trace,type,id) =>
  actions(trace).filter(a=>a.type===type&&(!id||a.resource?.id===id)).length;
const inspect = model => {
  assert.deepEqual(validateModel(model),[]);
  const m=toManifest(model);
  assert.equal(m.metadata.rxjsVersion,'7.8.2');
  assert.ok(m.rules.length>=3);
  assert.match(m.metadata.sources[0].url,/e5351d02e225e275ac0e497c7b66eaa5f0c88791/);
};

test('S18 metadata: five exports have distinct pinned models and real rule sets',()=>{
  const models=[createRetryWhenModel(),createRefCountModel(),createSampleModel(),
    createSampleTimeModel(3),createSequenceEqualModel()];
  assert.deepEqual(models.map(m=>m.metadata.operator),
    ['retryWhen','refCount','sample','sampleTime','sequenceEqual']);
  models.forEach(inspect);
  assert.ok(models.every(m=>m.metadata.evidence.record==='evidence/SESSION-18.md'));
});
test('S18 generator: each representative trace is legal under its guarded model',()=>{
  const models=[
    [createRetryWhenModel(),retryWhenExample],
    [createRefCountModel(),refCountExample],
    [createSampleModel(),sampleExample],
    [createSampleTimeModel(3),sampleTimeExample],
    [createSequenceEqualModel(),sequenceEqualExample],
  ];
  for(const [model,input] of models){
    const t=runTrace(model,input,{executionId:'S18-example'});
    assert.equal(t.status,'finished-input',model.metadata.operator);
    assert.equal(t.consumed,input.length);
  }
});
test('S18 retryWhen: errors are routed to persistent notifier, not downstream',()=>{
  const e1={code:1},e2={code:2};
  const x=evaluate(createRetryWhenModel(),[
    {type:'subscribe'},
    {type:'source.next',resource:src(0),value:'start'},
    {type:'source.error',resource:src(0),error:e1},
    {type:'notifier.next'},
    {type:'source.error',resource:src(1),error:e2}
  ]);
  assert.deepEqual(output(x),[{kind:'N',value:'start'}]);
  const internal=actions(x).filter(a=>a.type==='notify'&&a.target==='errorsSubject');
  assert.equal(internal.length,2);
  assert.equal(internal[0].notification.value,e1);
  assert.equal(internal[1].notification.value,e2);
  assert.equal(counts(x,'subscribe','notifier'),1);
  assert.equal(counts(x,'subscribe','source'),2);
  assert.equal(x.state.phase,'Waiting');
});
test('S18 retryWhen: notifier next restarts, success completes and disposes both',()=>{
  const x=evaluate(createRetryWhenModel(),[
    {type:'subscribe'},
    {type:'source.error',resource:src(0),error:'fail'},
    {type:'notifier.next'},
    {type:'source.next',resource:src(1),value:'recovered'},
    {type:'source.complete',resource:src(1)}
  ]);
  assert.deepEqual(output(x),[{kind:'N',value:'recovered'},{kind:'C'}]);
  assert.equal(counts(x,'unsubscribe','source'),2);
  assert.equal(counts(x,'unsubscribe','notifier'),1);
  assert.equal(x.state.reason,'complete');
});
test('S18 retryWhen: notifier completion while waiting finishes without retry',()=>{
  const x=evaluate(createRetryWhenModel(),[
    {type:'subscribe'},{type:'source.error',resource:src(0),error:'x'},
    {type:'notifier.complete'}
  ]);
  assert.deepEqual(output(x),[{kind:'C'}]);
  assert.equal(counts(x,'subscribe','source'),1);
});
test('S18 retryWhen: unlike repeatWhen notifier completion interrupts active retried source',()=>{
  const x=evaluate(createRetryWhenModel(),[
    {type:'subscribe'},{type:'source.error',resource:src(0),error:'x'},
    {type:'notifier.next'},{type:'notifier.complete'}
  ]);
  assert.deepEqual(output(x),[{kind:'C'}]);
  assert.equal(x.state.reason,'complete');
  assert.equal(counts(x,'unsubscribe','source'),2);
});
test('S18 retryWhen: notifier error keeps exact error object and cancellation is silent',()=>{
  const e={notifier:true};
  const x=evaluate(createRetryWhenModel(),[
    {type:'subscribe'},{type:'source.error',resource:src(0),error:'x'},
    {type:'notifier.error',error:e}
  ]);
  assert.equal(output(x)[0].error,e);
  const y=evaluate(createRetryWhenModel(),[
    {type:'subscribe'},{type:'source.error',resource:src(0),error:'x'}, {type:'cancel'}
  ]);
  assert.deepEqual(output(y),[]);
  assert.equal(y.state.reason,'cancel');
  assert.equal(counts(y,'unsubscribe','notifier'),1);
});
test('S18 retryWhen: stale source generation and active-time notifier next are illegal',()=>{
  const m=createRetryWhenModel();
  const x=evaluate(m,[{type:'subscribe'},{type:'source.error',resource:src(0),error:1},
    {type:'notifier.next'}]);
  assert.throws(()=>stepModel(m,x.state,{type:'source.next',resource:src(0),value:1}),/illegal/);
  assert.throws(()=>stepModel(m,x.state,{type:'notifier.next'}),/illegal/);
});
test('S18 refCount: only first subscribe connects and last departure disconnects',()=>{
  const x=evaluate(createRefCountModel(),[
    {type:'subscriber.subscribe',subscriber:'A'},
    {type:'subscriber.subscribe',subscriber:'B'},
    {type:'source.next',resource:src(0),value:7},
    {type:'subscriber.unsubscribe',subscriber:'A'},
    {type:'subscriber.unsubscribe',subscriber:'B'},
    {type:'subscriber.subscribe',subscriber:'C'}
  ]);
  assert.equal(counts(x,'subscribe','source'),2);
  assert.equal(counts(x,'unsubscribe','source'),1);
  assert.equal(x.state.phase,'Connected');
  assert.deepEqual(x.state.subscribers,['C']);
  assert.deepEqual(actions(x).filter(a=>a.type==='notify').map(a=>a.target),['A','B']);
});
test('S18 refCount: one unsubscribe never tears down a still-shared source',()=>{
  const x=evaluate(createRefCountModel(),[
    {type:'subscriber.subscribe',subscriber:'A'},
    {type:'subscriber.subscribe',subscriber:'B'},
    {type:'subscriber.unsubscribe',subscriber:'B'},
    {type:'source.next',resource:src(0),value:'A-only'}
  ]);
  assert.equal(counts(x,'unsubscribe','source'),0);
  assert.deepEqual(output(x),[]);
  assert.deepEqual(actions(x).filter(a=>a.type==='notify').map(a=>a.target),['A']);
});
test('S18 refCount: fixed publish Subject retains error and completion terminal states',()=>{
  const e={issue:1};
  const m=createRefCountModel();
  const x=evaluate(m,[
    {type:'subscriber.subscribe',subscriber:'A'},
    {type:'subscriber.subscribe',subscriber:'B'},
    {type:'source.error',resource:src(0),error:e},
    {type:'subscriber.subscribe',subscriber:'C'}
  ]);
  assert.equal(x.state.phase,'Errored');
  assert.equal(counts(x,'subscribe','source'),1);
  const errorNotes=actions(x).filter(a=>a.type==='notify');
  assert.equal(errorNotes.length,3);
  assert.equal(errorNotes[0].notification.error,e);
  assert.equal(errorNotes[1].notification.error,e);
  assert.equal(errorNotes[2].notification.error,e);
  const c=evaluate(m,[
    {type:'subscriber.subscribe',subscriber:'A'},
    {type:'source.complete',resource:src(0)}
  ]);
  assert.equal(c.state.phase,'Completed');
  assert.deepEqual(actions(c).filter(a=>a.type==='notify').map(a=>a.notification.kind),['C']);
});
test('S18 refCount: duplicate subscriber IDs and stale connection notifications are rejected',()=>{
  const m=createRefCountModel();
  const x=evaluate(m,[{type:'subscriber.subscribe',subscriber:'A'}]);
  assert.throws(()=>stepModel(m,x.state,{type:'subscriber.subscribe',subscriber:'A'}),/illegal/);
  assert.throws(()=>stepModel(m,x.state,{type:'source.next',resource:src(1),value:1}),/illegal/);
});
test('S18 sample: overwrite old value, emit only once per notifier next',()=>{
  const x=evaluate(createSampleModel(),[
    {type:'subscribe'}, {type:'source.next',value:'old'},
    {type:'source.next',value:'latest'}, {type:'notifier.next'},
    {type:'notifier.next'}, {type:'source.complete'}
  ]);
  assert.deepEqual(output(x),[{kind:'N',value:'latest'},{kind:'C'}]);
  assert.equal(x.state.reason,'complete');
});
test('S18 sample: presence bit preserves undefined and null as real payloads',()=>{
  const x=evaluate(createSampleModel(),[
    {type:'subscribe'}, {type:'source.next',value:undefined},
    {type:'notifier.next'}, {type:'source.next',value:null},
    {type:'notifier.next'}, {type:'source.complete'}
  ]);
  assert.deepEqual(output(x),[{kind:'N',value:undefined},{kind:'N',value:null},{kind:'C'}]);
});
test('S18 sample: notifier completion does not sample, flush, or terminate source',()=>{
  const x=evaluate(createSampleModel(),[
    {type:'subscribe'}, {type:'source.next',value:'pending'},
    {type:'notifier.complete'}, {type:'source.next',value:'later'},
    {type:'source.complete'}
  ]);
  assert.deepEqual(output(x),[{kind:'C'}]);
  assert.equal(counts(x,'unsubscribe','notifier'),1);
  assert.equal(x.state.phase,'Closed');
});
test('S18 sample: notifier error propagates exact identity; cancellation is silent',()=>{
  const reason={source:'notifier'};
  const x=evaluate(createSampleModel(),[
    {type:'subscribe'}, {type:'notifier.error',error:reason}
  ]);
  assert.equal(output(x)[0].error,reason);
  const c=evaluate(createSampleModel(),[
    {type:'subscribe'}, {type:'source.next',value:1}, {type:'cancel'}
  ]);
  assert.deepEqual(output(c),[]);
  assert.equal(counts(c,'unsubscribe','source'),1);
  assert.equal(counts(c,'unsubscribe','notifier'),1);
});
test('S18 sampleTime: first due tick emits latest, next empty tick does not duplicate',()=>{
  const m=createSampleTimeModel(3);
  const x=evaluate(m,[
    {type:'subscribe'}, {type:'source.next',value:'before'},
    {type:'timer.fire',resource:tick(0),now:3},
    {type:'timer.fire',resource:tick(1),now:6},
    {type:'source.complete'}
  ]);
  assert.deepEqual(output(x),[{kind:'N',value:'before'},{kind:'C'}]);
  assert.equal(counts(x,'schedule','periodic'),3);
  assert.equal(counts(x,'cancel-timer','periodic'),1);
});
test('S18 sampleTime: stale or premature scheduler ticks are illegal',()=>{
  const m=createSampleTimeModel(3);
  const x=evaluate(m,[{type:'subscribe'}]);
  assert.throws(()=>stepModel(m,x.state,{type:'timer.fire',resource:tick(1),now:3}),/illegal/);
  assert.throws(()=>stepModel(m,x.state,{type:'timer.fire',resource:tick(0),now:2}),/illegal/);
  assert.throws(()=>createSampleTimeModel(0),/1..1000/);
  assert.throws(()=>createSampleTimeModel(-1),/1..1000/);
});
test('S18 sampleTime: error before sampling discards pending memory and cancels timer',()=>{
  const reason={kind:'source'};
  const x=evaluate(createSampleTimeModel(4),[
    {type:'subscribe'}, {type:'source.next',value:8},
    {type:'source.error',error:reason}
  ]);
  assert.equal(output(x)[0].error,reason);
  assert.equal(counts(x,'cancel-timer','periodic'),1);
  assert.equal(x.state.reason,'error');
});
test('S18 sequenceEqual: interleaved FIFO matches yield exactly true and completion',()=>{
  const x=evaluate(createSequenceEqualModel(),[
    {type:'subscribe'},{type:'left.next',value:'a'},
    {type:'left.next',value:'b'},{type:'right.next',value:'a'},
    {type:'right.next',value:'b'},{type:'left.complete'},{type:'right.complete'}
  ]);
  assert.deepEqual(output(x),[{kind:'N',value:true},{kind:'C'}]);
  assert.equal(counts(x,'subscribe'),2);
  assert.equal(x.state.reason,'equal');
});
test('S18 sequenceEqual: empty streams equal, unequal aligned pair fails immediately',()=>{
  const empty=evaluate(createSequenceEqualModel(),[
    {type:'subscribe'},{type:'left.complete'},{type:'right.complete'}
  ]);
  assert.deepEqual(output(empty),[{kind:'N',value:true},{kind:'C'}]);
  const mismatch=evaluate(createSequenceEqualModel(),[
    {type:'subscribe'},{type:'right.next',value:1},{type:'left.next',value:2}
  ]);
  assert.deepEqual(output(mismatch),[{kind:'N',value:false},{kind:'C'}]);
});
test('S18 sequenceEqual: unequal length detected on next after completed opposite',()=>{
  const x=evaluate(createSequenceEqualModel(),[
    {type:'subscribe'},{type:'left.complete'},{type:'right.next',value:1}
  ]);
  assert.deepEqual(output(x),[{kind:'N',value:false},{kind:'C'}]);
});
test('S18 sequenceEqual: pending unmatched value at both completed terminals is unequal',()=>{
  const x=evaluate(createSequenceEqualModel(),[
    {type:'subscribe'},{type:'left.next',value:1},
    {type:'left.complete'},{type:'right.complete'}
  ]);
  assert.deepEqual(output(x),[{kind:'N',value:false},{kind:'C'}]);
});
test('S18 sequenceEqual: strict equality distinguishes NaN and object identities',()=>{
  const same={id:1};
  const yes=evaluate(createSequenceEqualModel(),[
    {type:'subscribe'},{type:'left.next',value:same},
    {type:'right.next',value:same},{type:'left.complete'},{type:'right.complete'}
  ]);
  assert.deepEqual(output(yes),[{kind:'N',value:true},{kind:'C'}]);
  const nan=evaluate(createSequenceEqualModel(),[
    {type:'subscribe'},{type:'left.next',value:NaN},{type:'right.next',value:NaN}
  ]);
  assert.deepEqual(output(nan),[{kind:'N',value:false},{kind:'C'}]);
});
test('S18 sequenceEqual: source error preserves identity; cancel never claims inequality',()=>{
  const e={reason:'fatal'};
  const err=evaluate(createSequenceEqualModel(),[
    {type:'subscribe'},{type:'right.error',error:e}
  ]);
  assert.equal(output(err)[0].error,e);
  const cancel=evaluate(createSequenceEqualModel(),[
    {type:'subscribe'},{type:'left.next',value:1},{type:'cancel'}
  ]);
  assert.deepEqual(output(cancel),[]);
  assert.equal(counts(cancel,'unsubscribe'),2);
});
test('S18 sequenceEqual: illegal new value on completed side and bounded FIFO limit',()=>{
  const m=createSequenceEqualModel(1);
  const x=evaluate(m,[{type:'subscribe'},{type:'left.complete'}]);
  assert.throws(()=>stepModel(m,x.state,{type:'left.next',value:1}),/illegal/);
  assert.throws(()=>createSequenceEqualModel(0),/1..4096/);
  const q=evaluate(m,[{type:'subscribe'},{type:'left.next',value:1}]);
  assert.throws(()=>stepModel(m,q.state,{type:'left.next',value:2}),/illegal/);
});
