import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable } from 'rxjs';
import { zip } from 'rxjs/operators';
import { runTrace } from '../dist/runner.js';
import { createZipModel } from '../dist/models/session23-zip.js';

// The native execution determines admitted events. No model state or guard drives it.
const observeNative=(count,seed,commands,ending,payload,fault)=>{
  let now=0,valueIndex=0,outer;const subscribers=[],inputs=[],actual=[];
  const record=action=>actual.push({time:now,action});
  const resource=index=>({id:'input:'+index,generation:0});
  const sources=Array.from({length:count},(_,index)=>new Observable(s=>{
    subscribers[index]=s;record({type:'subscribe',resource:resource(index)});
    return()=>record({type:'unsubscribe',resource:resource(index)});
  }));
  const accept=(event,operation)=>{inputs.push({time:now,event});operation();};
  const notify=notification=>record({type:'notify',target:'downstream',notification});
  accept({type:'subscribe'},()=>{outer=sources[0].pipe(zip(...sources.slice(1))).subscribe({
    next:value=>notify({kind:'N',value}),error:error=>notify({kind:'E',error}),complete:()=>notify({kind:'C'})});});
  const next=index=>{if(subscribers[index].closed)return;const value=[undefined,payload,null][valueIndex++%3];
    accept({type:'input.next',index,value},()=>subscribers[index].next(value));};
  const complete=index=>{if(!subscribers[index].closed)accept({type:'input.complete',index},()=>subscribers[index].complete());};
  if(seed!=='none'){next(0);next(0);if(seed==='completed-first')complete(0);}
  for(const [position,command] of commands.entries()){
    now=1+Math.floor(position/2); // Equal timestamps retain explicit native call order.
    const index=command.startsWith('last')?count-1:command.startsWith('middle')?Math.floor(count/2):0;
    if(command.endsWith('complete'))complete(index);else next(index);
  }
  now=3;
  if(!outer.closed){
    const live=subscribers.map((s,i)=>s.closed?-1:i).filter(i=>i!==-1);
    if(ending==='cancel')accept({type:'cancel'},()=>outer.unsubscribe());
    else if(ending==='complete')complete(live[0]);
    else {const index=ending==='error-first'?live[0]:live.at(-1);
      accept({type:'input.error',index,error:fault},()=>subscribers[index].error(fault));}
  }
  now=4;if(!outer.closed)accept({type:'cancel'},()=>outer.unsubscribe());
  assert.ok(outer.closed);assert.ok(subscribers.every(s=>s.closed));return {inputs,actual};
};

test('S23 DIFF zip: 7776 native-driven finite executions compare FIFO order, completion drain and resource lifetimes',()=>{
  const alphabet=['first','middle','last','first.complete','middle.complete','last.complete'];
  const payload=Object.freeze({opaque:'value'}),fault=Object.freeze({opaque:'error'});let comparisons=0;
  for(const count of [1,2,3])for(const seed of ['none','burst-first','completed-first'])
    for(const a of alphabet)for(const b of alphabet)for(const c of alphabet)
      for(const ending of ['complete','error-first','error-last','cancel']){
        const {inputs,actual}=observeNative(count,seed,[a,b,c],ending,payload,fault);
        // A schedule supplies at most five unmatched arrivals per input; bound eight never filters native events.
        const trace=runTrace(createZipModel(count,8),inputs,{executionId:'zip-diff-'+comparisons});
        const predicted=trace.steps.flatMap(step=>step.actions.map(action=>({time:step.time,action})));
        assert.deepEqual(predicted,actual,JSON.stringify({count,seed,commands:[a,b,c],ending}));
        assert.equal(trace.state.phase,'Closed');
        for(const {action} of actual)if(action.type==='notify'){
          if(action.notification.kind==='E')assert.equal(action.notification.error,fault);
          if(action.notification.kind==='N')for(const value of action.notification.value)if(value!=null)assert.equal(value,payload);
        }
        comparisons++;
      }
  assert.equal(comparisons,7776);console.log('SESSION23_ZIP_COMPARISONS',comparisons);
});
