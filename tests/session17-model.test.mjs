import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRaceLegacyModel, createRaceWithModel, createRepeatModel,
  createRepeatWhenModel, createRetryModel,
  raceExample, raceWithExample, repeatExample, repeatWhenExample, retryExample,
  validateModel, toManifest, stepModel, runTrace
} from '../dist/index.js';

const ref=(id,gen)=>({id,generation:gen});
const source=n=>ref('source',n);
const candidate=n=>ref('input',n);
const evaluate=(model,events)=>{
  let state=model.initialState();
  const steps=[];
  for(const event of events){
    const result=stepModel(model,state,event);
    steps.push({event,rule:result.ruleId,actions:result.actions,state:result.state});
    state=result.state;
  }
  return {state,steps,actions:steps.flatMap(s=>s.actions)};
};
const notes=x=>x.actions.filter(a=>a.type==='notify'&&a.target==='downstream').map(a=>a.notification);
const ids=(actions,type)=>actions.filter(a=>a.type===type).map(a=>a.resource.generation);
const names=[
  ['race',createRaceLegacyModel(2),raceExample],
  ['raceWith',createRaceWithModel(2),raceWithExample],
  ['repeat',createRepeatModel(2),repeatExample],
  ['repeatWhen',createRepeatWhenModel(),repeatWhenExample],
  ['retry',createRetryModel(2),retryExample],
];

for(const [name,model,example] of names){
  test('S17 MODEL '+name+': rule schema, pinned evidence, trace and export identity',()=>{
    assert.deepEqual(validateModel(model),[]);
    const manifest=toManifest(model);
    assert.equal(manifest.metadata.operator,name);
    assert.equal(manifest.metadata.rxjsVersion,'7.8.2');
    assert.ok(manifest.metadata.sources.every(x=>x.revision==='e5351d02e225e275ac0e497c7b66eaa5f0c88791'));
    assert.ok(manifest.rules.every(x=>x.explanation&&x.guard&&x.obligations.length));
    assert.ok(manifest.metadata.scope.time.length>0);
    assert.ok(manifest.metadata.ownership.sharing.length>0);
    assert.ok(manifest.metadata.scope.exclusions.length>0);
    const trace=runTrace(model,example,{executionId:'session17-'+name});
    assert.equal(trace.status,'finished-input');
    assert.equal(trace.consumed,example.length);
    assert.ok(trace.steps.every(s=>s.ruleId.startsWith('S17-')));
  });
}
test('S17 RACE: subscriptions are source-first; first value cancels losers before forwarding',()=>{
  const m=createRaceLegacyModel(2);
  const [initial,win]=evaluate(m,[
    {type:'subscribe'},
    {type:'input.next',resource:candidate(2),value:{packet:1}}
  ]).steps;
  assert.deepEqual(ids(initial.actions,'subscribe'),[0,1,2]);
  assert.deepEqual(ids(win.actions,'unsubscribe'),[0,1]);
  assert.equal(win.actions[2].type,'notify');
  assert.equal(win.state.winner,2);
  assert.deepEqual(win.state.live,[2]);
});
test('S17 RACE: winner delivers multiple values then completes normally',()=>{
  const obj={id:'winner'};
  const x=evaluate(createRaceLegacyModel(2),[
    {type:'subscribe'},
    {type:'input.next',resource:candidate(1),value:obj},
    {type:'input.next',resource:candidate(1),value:42},
    {type:'input.complete',resource:candidate(1)}
  ]);
  assert.deepEqual(notes(x),[{kind:'N',value:obj},{kind:'N',value:42},{kind:'C'}]);
  assert.equal(notes(x)[0].value,obj);
  assert.equal(x.state.reason,'complete');
  assert.equal(x.state.winner,1);
});
test('S17 RACEWITH: early completion ends all input subscriptions before any winner',()=>{
  const x=evaluate(createRaceWithModel(2),[
    {type:'subscribe'},
    {type:'input.complete',resource:candidate(1)}
  ]);
  assert.deepEqual(notes(x),[{kind:'C'}]);
  assert.deepEqual(ids(x.steps[1].actions,'unsubscribe'),[0,1,2]);
  assert.equal(x.state.winner,null);
});
test('S17 RACEWITH: exact early error identity and cleanup',()=>{
  const err=new Error('early');
  const x=evaluate(createRaceWithModel(2),[
    {type:'subscribe'},
    {type:'input.error',resource:candidate(2),error:err}
  ]);
  assert.equal(notes(x)[0].error,err);
  assert.equal(x.state.reason,'error');
  assert.deepEqual(ids(x.steps[1].actions,'unsubscribe'),[0,1,2]);
});
test('S17 RACE: cancellation before a winner is silent and clears all resources',()=>{
  const x=evaluate(createRaceLegacyModel(2),[{type:'subscribe'},{type:'cancel'}]);
  assert.deepEqual(notes(x),[]);
  assert.deepEqual(ids(x.steps[1].actions,'unsubscribe'),[0,1,2]);
  assert.equal(x.state.reason,'cancel');
});
test('S17 RACE: losing source notifications are illegal after winner chosen',()=>{
  const m=createRaceWithModel(2);
  const x=evaluate(m,[{type:'subscribe'},{type:'input.next',resource:candidate(0),value:'a'}]);
  assert.throws(()=>stepModel(m,x.state,{type:'input.next',resource:candidate(2),value:'loser'}),/illegal transition/);
});
test('S17 RACE: zero other inputs is identity-shaped',()=>{
  const x=evaluate(createRaceWithModel(0),[
    {type:'subscribe'},
    {type:'input.next',resource:candidate(0),value:7},
    {type:'input.complete',resource:candidate(0)}
  ]);
  assert.deepEqual(ids(x.steps[0].actions,'subscribe'),[0]);
  assert.deepEqual(notes(x),[{kind:'N',value:7},{kind:'C'}]);
});
test('S17 RACE: rejects malformed source ownership state',()=>{
  const m=createRaceLegacyModel(2);
  assert.ok(m.validateState({phase:'Racing',live:[0,0,2],winner:null,reason:'none'},m.parameters).length);
  assert.throws(()=>createRaceLegacyModel(-1),/0..32/);
});

test('S17 REPEAT: repeat(0) completes without subscribing the source',()=>{
  const x=evaluate(createRepeatModel(0),[{type:'subscribe'}]);
  assert.deepEqual(notes(x),[{kind:'C'}]);
  assert.deepEqual(ids(x.actions,'subscribe'),[]);
  assert.equal(x.state.attempts,0);
  assert.equal(x.state.reason,'empty');
});
test('S17 REPEAT: completion resubscribes once and includes values from both executions',()=>{
  const x=evaluate(createRepeatModel(2),[
    {type:'subscribe'},
    {type:'source.next',resource:source(0),value:'a'},
    {type:'source.complete',resource:source(0)},
    {type:'source.next',resource:source(1),value:'b'},
    {type:'source.complete',resource:source(1)}
  ]);
  assert.deepEqual(notes(x),[{kind:'N',value:'a'},{kind:'N',value:'b'},{kind:'C'}]);
  assert.deepEqual(ids(x.actions,'subscribe'),[0,1]);
  assert.deepEqual(ids(x.actions,'unsubscribe'),[0,1]);
  assert.equal(x.state.attempts,2);
  assert.equal(x.state.reason,'complete');
});
test('S17 REPEAT: source error fails and never triggers another attempt',()=>{
  const error=new Error('fatal');
  const x=evaluate(createRepeatModel(3),[
    {type:'subscribe'},
    {type:'source.error',resource:source(0),error}
  ]);
  assert.deepEqual(ids(x.actions,'subscribe'),[0]);
  assert.equal(notes(x)[0].error,error);
});
test('S17 REPEAT: cancellation releases current second generation silently',()=>{
  const x=evaluate(createRepeatModel(3),[
    {type:'subscribe'},{type:'source.complete',resource:source(0)},{type:'cancel'}
  ]);
  assert.deepEqual(ids(x.steps[2].actions,'unsubscribe'),[1]);
  assert.equal(x.state.reason,'cancel');
  assert.equal(notes(x).length,0);
});
test('S17 REPEAT: illegal stale generations and finite count guards',()=>{
  const m=createRepeatModel(2);
  const x=evaluate(m,[{type:'subscribe'},{type:'source.complete',resource:source(0)}]);
  assert.throws(()=>stepModel(m,x.state,{type:'source.next',resource:source(0),value:42}),/illegal transition/);
  assert.throws(()=>createRepeatModel(9),/0..8/);
});
test('S17 RETRY: count is additional subscriptions, not total attempts',()=>{
  const e1={e:1},e2={e:2},e3={e:3};
  const x=evaluate(createRetryModel(2),[
    {type:'subscribe'},
    {type:'source.error',resource:source(0),error:e1},
    {type:'source.error',resource:source(1),error:e2},
    {type:'source.error',resource:source(2),error:e3}
  ]);
  assert.deepEqual(ids(x.actions,'subscribe'),[0,1,2]);
  assert.deepEqual(notes(x),[{kind:'E',error:e3}]);
  assert.equal(x.state.reason,'error');
  assert.equal(x.state.failures,2);
});
test('S17 RETRY: a successful later attempt forwards all values and completion',()=>{
  const x=evaluate(createRetryModel(2),[
    {type:'subscribe'},
    {type:'source.next',resource:source(0),value:1},
    {type:'source.error',resource:source(0),error:'transient'},
    {type:'source.next',resource:source(1),value:2},
    {type:'source.complete',resource:source(1)}
  ]);
  assert.deepEqual(notes(x),[{kind:'N',value:1},{kind:'N',value:2},{kind:'C'}]);
  assert.equal(x.state.reason,'complete');
});
test('S17 RETRY: resetOnSuccess clears failure count, allowing more retry cycles',()=>{
  const x=evaluate(createRetryModel(1,true),[
    {type:'subscribe'},
    {type:'source.error',resource:source(0),error:'first'},
    {type:'source.next',resource:source(1),value:'ok'},
    {type:'source.error',resource:source(1),error:'second'},
    {type:'source.next',resource:source(2),value:'again'},
    {type:'source.complete',resource:source(2)}
  ]);
  assert.deepEqual(ids(x.actions,'subscribe'),[0,1,2]);
  assert.deepEqual(notes(x),[{kind:'N',value:'ok'},{kind:'N',value:'again'},{kind:'C'}]);
  assert.equal(x.state.attempts,3);
});
test('S17 RETRY: retry(0) is identity for fatal error and retry cancellation is silent',()=>{
  const error={message:'no retries'};
  const fail=evaluate(createRetryModel(0),[
    {type:'subscribe'},{type:'source.error',resource:source(0),error}
  ]);
  assert.equal(notes(fail)[0].error,error);
  assert.deepEqual(ids(fail.actions,'subscribe'),[0]);
  const cancel=evaluate(createRetryModel(2),[{type:'subscribe'},{type:'cancel'}]);
  assert.deepEqual(notes(cancel),[]);
  assert.deepEqual(ids(cancel.actions,'unsubscribe'),[0]);
});
test('S17 RETRY: invalid reset option on repeat rejected; no stale generation events',()=>{
  assert.throws(()=>createRetryModel(-1),/0..8/);
  const m=createRetryModel(2);
  const x=evaluate(m,[{type:'subscribe'},{type:'source.error',resource:source(0),error:1}]);
  assert.throws(()=>stepModel(m,x.state,{type:'source.next',resource:source(0),value:2}),/illegal transition/);
});
test('S17 REPEATWHEN: notifier created lazily and only once; completion signals are internal',()=>{
  const x=evaluate(createRepeatWhenModel(),[
    {type:'subscribe'},
    {type:'source.complete',resource:source(0)},
    {type:'notifier.next'},
    {type:'source.complete',resource:source(1)},
    {type:'notifier.complete'}
  ]);
  assert.deepEqual(ids(x.actions,'subscribe'),[0,0,1]);
  assert.deepEqual(x.actions.filter(a=>a.type==='notify'&&a.target==='completionsSubject').length,2);
  assert.deepEqual(notes(x),[{kind:'C'}]);
  assert.equal(x.state.reason,'complete');
});
test('S17 REPEATWHEN: notifier completion during active source waits for that source',()=>{
  const m=createRepeatWhenModel();
  const x=evaluate(m,[
    {type:'subscribe'},
    {type:'source.complete',resource:source(0)},
    {type:'notifier.next'},
    {type:'notifier.complete'},
    {type:'source.next',resource:source(1),value:42},
    {type:'source.complete',resource:source(1)}
  ]);
  assert.equal(x.steps[3].state.phase,'Active');
  assert.equal(x.steps[3].state.notifier,'completed');
  assert.deepEqual(notes(x),[{kind:'N',value:42},{kind:'C'}]);
});
test('S17 REPEATWHEN: notifier errors with exact error object and cancels owned resources',()=>{
  const e={why:'fail'};
  const x=evaluate(createRepeatWhenModel(),[
    {type:'subscribe'},
    {type:'source.complete',resource:source(0)},
    {type:'notifier.next'},
    {type:'notifier.error',error:e}
  ]);
  assert.equal(notes(x)[0].error,e);
  assert.deepEqual(x.steps[3].actions.filter(a=>a.type==='unsubscribe').map(a=>a.resource.id),['source','notifier']);
});
test('S17 REPEATWHEN: source errors are forwarded, never converted to completion Subject signals',()=>{
  const e=new Error('source');
  const x=evaluate(createRepeatWhenModel(),[{type:'subscribe'},{type:'source.error',resource:source(0),error:e}]);
  assert.equal(notes(x)[0].error,e);
  assert.equal(x.actions.filter(a=>a.type==='notify'&&a.target==='completionsSubject').length,0);
});
test('S17 REPEATWHEN: cancellation while waiting releases notifier and notifies no downstream',()=>{
  const x=evaluate(createRepeatWhenModel(),[
    {type:'subscribe'},{type:'source.complete',resource:source(0)},{type:'cancel'}
  ]);
  assert.deepEqual(x.steps[2].actions,[{type:'unsubscribe',resource:{id:'notifier',generation:0}}]);
  assert.deepEqual(notes(x),[]);
  assert.equal(x.state.reason,'cancel');
});
test('S17 REPEATWHEN: notifier next during active source is excluded and rejected',()=>{
  const m=createRepeatWhenModel();
  const x=evaluate(m,[
    {type:'subscribe'},{type:'source.complete',resource:source(0)},{type:'notifier.next'}
  ]);
  assert.throws(()=>stepModel(m,x.state,{type:'notifier.next'}),/illegal transition/);
});
