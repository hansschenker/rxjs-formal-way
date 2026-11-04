import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createAuditModel,createAuditTimeModel,auditExample,auditTimeExample,runAuditTrace,
 validateModel,toManifest,stepModel,
 renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior,renderTrace
} from '../dist/index.js';
const note=actions=>actions.filter(a=>a.type==='notify').map(a=>a.notification);
const D=(generation)=>({id:'duration',generation});
const C=(generation)=>({id:'duration-selector',generation});
const TIMER=(generation)=>({id:'audit-timer',generation});
const e=(type,now,fields={})=>({type,now,...fields});
const execute=(model,events)=>{
 let state=model.initialState(),history=[],actions=[];
 for(const input of events){
  const step=stepModel(model,state,input);
  history.push(step.ruleId);actions.push(...step.actions);state=step.state;
 }
 return {state,actions,history};
};
for(const [name,make,example] of [
 ['audit',()=>createAuditModel(),auditExample],
 ['auditTime',()=>createAuditTimeModel(3),auditTimeExample],
]){
 test('S7-AUDIT-MODEL '+name+': six-tuple, guarded rules and eight render projections',()=>{
  const model=make(),manifest=toManifest(model);
  assert.deepEqual(validateModel(model),[]);
  assert.equal(model.metadata.rxjsVersion,'7.8.2');
  assert.equal(model.metadata.evidence.record,'evidence/SESSION-07.md');
  assert.equal(new Set(model.rules.map(r=>r.description.id)).size,model.rules.length);
  for(const fn of [renderTable,renderBdd,renderDiagram,renderObligations,renderBehavior]){
    const output=fn(manifest);
    assert.equal(output,fn(manifest));
    for(const rule of model.rules)assert.ok(output.includes(rule.description.id),rule.description.id);
  }
  const trace=runAuditTrace(model,example,{executionId:'s7-'+name});
  assert.equal(trace.status,'finished-input');
  assert.equal(trace.state.phase,'Closed');
  assert.match(renderTrace(trace),/Four lanes/);
  assert.ok(trace.steps.some(step=>step.actions.some(a=>a.type==='notify'&&a.notification.kind==='N')));
 });
}
test('S7-AUDIT-01: first value requests duration, later values replace latest without selector calls',()=>{
 const m=createAuditModel();
 const r=execute(m,[
  e('subscribe',0),e('source.next',1,{value:'a'}),e('callback.return',1,{resource:C(0)}),
  e('source.next',2,{value:'b'}),e('duration.next',3,{resource:D(0)}),
  e('source.next',4,{value:'c'}),e('callback.return',4,{resource:C(1)}),
  e('source.complete',5),e('duration.next',7,{resource:D(1)})]);
 assert.deepEqual(note(r.actions),[{kind:'N',value:'b'},{kind:'N',value:'c'},{kind:'C'}]);
 assert.equal(r.actions.filter(a=>a.type==='invoke-callback').length,2);
 assert.equal(r.state.reason,'complete');
});
test('S7-AUDIT-02: empty duration completion is not a next signal, so does not flush',()=>{
 const m=createAuditModel();
 const r=execute(m,[e('subscribe',0),e('source.next',1,{value:1}),
  e('callback.return',1,{resource:C(0)}),e('duration.complete',2,{resource:D(0)}),
  e('source.next',3,{value:2}),e('callback.return',3,{resource:C(1)}),
  e('duration.next',4,{resource:D(1)}),e('source.complete',5)]);
 assert.deepEqual(note(r.actions),[{kind:'N',value:2},{kind:'C'}]);
 const wait=execute(m,[e('subscribe',0),e('source.next',1,{value:'pending'}),
  e('callback.return',1,{resource:C(0)}),e('source.complete',2),
  e('duration.complete',3,{resource:D(0)})]);
 assert.deepEqual(note(wait.actions),[{kind:'C'}]);
});
test('S7-AUDIT-03: error, throw and cancellation discard pending and preserve error identity',()=>{
 const m=createAuditModel(),fault={reason:'custom'};
 for(const events of [
  [e('source.next',1,{value:'x'}),e('callback.throw',1,{resource:C(0),error:fault})],
  [e('source.next',1,{value:'x'}),e('callback.return',1,{resource:C(0)}),
   e('duration.error',2,{resource:D(0),error:fault})],
  [e('source.next',1,{value:'x'}),e('callback.return',1,{resource:C(0)}),
   e('source.error',2,{error:fault})],
 ]){
  const r=execute(m,[e('subscribe',0),...events]);
  assert.deepEqual(note(r.actions),[{kind:'E',error:fault}]);
  assert.equal(r.state.phase,'Closed');
 }
 const cancelled=execute(m,[e('subscribe',0),e('source.next',1,{value:'x'}),
  e('callback.return',1,{resource:C(0)}),e('cancel',2)]);
 assert.deepEqual(note(cancelled.actions),[]);
 assert.throws(()=>stepModel(m,cancelled.state,e('duration.next',3,{resource:D(0)})),/illegal/);
});
test('S7-AUDIT-04: state-dependent callback and duration resource legality',()=>{
 const m=createAuditModel();
 const s=stepModel(m,stepModel(m,m.initialState(),e('subscribe',0)).state,e('source.next',1,{value:1})).state;
 assert.equal(s.phase,'Calling');
 for(const event of [
  e('callback.return',1,{resource:C(1)}),e('source.next',1,{value:2}),
  e('duration.next',1,{resource:D(0)}),e('source.complete',1),
 ])assert.throws(()=>stepModel(m,s,event),/illegal/);
 const pending=stepModel(m,s,e('callback.return',1,{resource:C(0)})).state;
 assert.throws(()=>stepModel(m,pending,e('duration.next',2,{resource:D(4)})),/illegal/);
 assert.throws(()=>stepModel(m,pending,e('callback.return',2,{resource:C(0)})),/illegal/);
});
test('S7-AUDITTIME-01: fixed-duration window never restarts on replacement and completion waits',()=>{
 const m=createAuditTimeModel(3);
 const r=execute(m,[e('subscribe',0),e('source.next',1,{value:'a'}),
  e('source.next',2,{value:'b'}),e('source.complete',3),
  e('timer.fire',4,{resource:TIMER(0)})]);
 assert.deepEqual(note(r.actions),[{kind:'N',value:'b'},{kind:'C'}]);
 assert.equal(r.actions.filter(a=>a.type==='schedule').length,1);
 assert.equal(r.state.phase,'Closed');
});
test('S7-AUDITTIME-02: timers cannot fire early/stale, no automatic deadline emission',()=>{
 const m=createAuditTimeModel(3);
 let s=stepModel(m,m.initialState(),e('subscribe',0)).state;
 s=stepModel(m,s,e('source.next',1,{value:'v'})).state;
 assert.equal(s.phase,'Pending');
 assert.throws(()=>stepModel(m,s,e('timer.fire',3,{resource:TIMER(0)})),/illegal/);
 assert.throws(()=>stepModel(m,s,e('timer.fire',4,{resource:TIMER(3)})),/illegal/);
 assert.throws(()=>stepModel(m,s,e('duration.complete',4,{resource:D(0)})),/illegal/);
 const result=stepModel(m,s,e('timer.fire',4,{resource:TIMER(0)}));
 assert.deepEqual(note(result.actions),[{kind:'N',value:'v'}]);
 assert.equal(result.state.phase,'Idle');
});
test('S7-AUDITTIME-03: invalid duration, clock regression and trace envelope rejected',()=>{
 for(const d of [0,-1,NaN,1.2,Infinity])assert.throws(()=>createAuditTimeModel(d),/positive/);
 const m=createAuditTimeModel(3);
 const s=stepModel(m,m.initialState(),e('subscribe',5)).state;
 assert.throws(()=>stepModel(m,s,e('source.next',4,{value:1})),/illegal/);
 assert.throws(()=>runAuditTrace(m,[{time:0,event:e('subscribe',1)}],{executionId:'bad'}),/clock/);
});
