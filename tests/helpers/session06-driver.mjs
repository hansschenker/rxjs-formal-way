import { Observable, reduce, count, toArray, min, max } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { stepModel } from '../../dist/index.js';

export const fault = Object.freeze({ fault: 'session06' });
export const at = (time, type, fields={}) => ({time,event:{type,...fields}});
export const callbackFor = (model, opts={}) => {
  const op=model.parameters.operator;
  if(op==='reduce') return (a,x,i)=>(opts.reducer??((p,v)=>p+v))(a,x,i);
  if(op==='count') return (_a,x,i)=>(opts.predicate??((v)=>v%2===0))(x,i);
  if(op==='min') return (a,x)=>(opts.comparer??((p,v)=>p-v))(a,x);
  if(op==='max') return (a,x)=>(opts.comparer??((p,v)=>p-v))(a,x);
  throw new Error('no callback for '+op);
};
const callbackLog = (model, time, previous, incoming, index) => {
  if (model.parameters.operator==='reduce') return [time,'call',previous,incoming,index];
  if (model.parameters.operator==='count') return [time,'call',incoming,index];
  if ((model.parameters.operator==='min'||model.parameters.operator==='max')&&model.parameters.mode==='comparer')
    return [time,'call',previous,incoming];
  return null;
};
const actionRow = (action,time) => {
  if (action.type==='notify') {
    const n=action.notification;
    return n.kind==='N'?[time,'N',n.value]:n.kind==='E'?[time,'E',n.error]:[time,'C'];
  }
  if (action.type==='invoke-callback') return null;
  return [time,action.type,action.resource.id,action.resource.generation];
};

/** Model-predicted driver; the chosen user function executes only outside the canonical transition model. */
export function observeAggregateModel(model, inputs,opts={}) {
  const logs=[],rules=new Set(),fn=callbackFor(model,opts);
  let state=model.initialState();
  const dispatch=(event,time)=>{
    const {state:after,actions,ruleId}=stepModel(model,state,event);
    state=after;rules.add(ruleId);
    for (const action of actions) {
      if(action.type==='invoke-callback'){
        const {previous,incoming}=action.value;
        const row=callbackLog(model,time,previous,incoming,action.index);
        if(row)logs.push(row);
        let outcome,failed=false;
        try{outcome=fn(previous,incoming,action.index);}catch(e){failed=true;outcome=e;}
        dispatch(failed?{type:'callback.throw',resource:action.resource,error:outcome}:
          {type:'callback.return',resource:action.resource,value:outcome},time);
      } else logs.push(actionRow(action,time));
    }
  };
  dispatch({type:'subscribe'},0);
  for(const {time,event} of inputs)if(state.phase!=='Closed')dispatch(event,time);
  return {logs,rules:[...rules],state};
}
const rxjsOperator=(model,opts,record,now)=>{
  const {operator:op,mode,seed}=model.parameters;
  if(op==='reduce'){
    const callback=(a,x,i)=>{
      record([now(),'call',a,x,i]);
      return (opts.reducer??((p,v)=>p+v))(a,x,i);
    };
    return mode==='seeded'?reduce(callback,seed.value):reduce(callback);
  }
  if(op==='count'){
    if(mode==='plain')return count();
    return count((value,index)=>{
      record([now(),'call',value,index]);
      return (opts.predicate??((v)=>v%2===0))(value,index);
    });
  }
  if(op==='toArray')return toArray();
  if(op==='min'||op==='max'){
    let cmp;
    if(mode==='comparer')cmp=(a,b)=>{
      record([now(),'call',a,b]);
      return (opts.comparer??((p,v)=>p-v))(a,b);
    };
    return op==='min'?min(cmp):max(cmp);
  }
  throw new Error('unknown aggregate operator');
};

/** Independent native RxJS path. Notifications, callbacks and source lifetimes are observed from a real subscription. */
export function observeAggregateRxjs(model,inputs,opts={}){
  const scheduler=new TestScheduler(()=>{});
  const logs=[];
  let upstream;
  const src=new Observable(subscriber=>{
    upstream=subscriber;logs.push([scheduler.frame,'subscribe','source',0]);
    return ()=>logs.push([scheduler.frame,'unsubscribe','source',0]);
  });
  const op=rxjsOperator(model,opts,row=>logs.push(row),()=>scheduler.frame);
  const subscription=src.pipe(op).subscribe({
    next:value=>logs.push([scheduler.frame,'N',value]),
    error:error=>logs.push([scheduler.frame,'E',error]),
    complete:()=>logs.push([scheduler.frame,'C']),
  });
  for(const {time,event} of inputs){
    scheduler.schedule(()=>{
      if(event.type==='source.next')upstream.next(event.value);
      else if(event.type==='source.complete')upstream.complete();
      else if(event.type==='source.error')upstream.error(event.error);
      else if(event.type==='cancel')subscription.unsubscribe();
      else throw new Error('external schedule must not contain callback outcomes');
    },time);
  }
  scheduler.flush();
  return logs;
}
export const sourceWord=(tokens,tied=false)=>tokens.map((token,i)=>{
  const time=tied?Math.floor(i/2)+1:i+1;
  return token==='C'?at(time,'source.complete'):
    token==='E'?at(time,'source.error',{error:fault}):
    token==='X'?at(time,'cancel'):
    at(time,'source.next',{value:token});
});
export function words(maxDepth=3){
  const output=[];
  const visit=word=>{
    output.push(word);
    if(word.length===maxDepth||['C','E','X'].includes(word.at(-1)))return;
    for(const token of [0,1,2,'C','E','X'])visit([...word,token]);
  };
  visit([]);
  return output;
}
export const notifications=rows=>rows.filter(x=>x[1]==='N'||x[1]==='E'||x[1]==='C');
