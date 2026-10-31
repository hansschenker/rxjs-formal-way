import { stepModel } from '../../dist/runner.js';

/** Pure specification drive; the effect words are observed, never executed as real subscriptions. */
export function observeShareReplayModel(model, commands) {
  let state=model.initialState(), connection=null, index=0, time=0;
  const observations=[],rules=new Set();
  function dispatch(event){
    const reaction=stepModel(model,state,event);
    rules.add(reaction.ruleId);state=reaction.state;
    for(const action of reaction.actions){
      if(action.type==='notify')observations.push({time,target:action.target,...action.notification});
      else if(action.type==='subscribe'){
        if(connection)throw new Error('overlapping source connections');
        connection=action.resource;observations.push({time,kind:'subscribe',...connection});
      }else if(action.type==='unsubscribe'){
        if(!connection||connection.generation!==action.resource.generation)throw new Error('unknown source release');
        observations.push({time,kind:'unsubscribe',...connection});connection=null;
      }else throw new Error('unsupported action '+action.type);
    }
  }
  const leave=()=>{if(state.core.phase==='Connected'&&state.core.subscribers.length)
    dispatch({type:'subscriber.unsubscribe',subscriber:state.core.subscribers[0],now:time});};
  for(const command of commands){
    time++;
    if(command==='join')dispatch({type:'subscriber.subscribe',subscriber:'s'+index++,now:time});
    else if(command==='leave')leave();
    else if(connection){
      const event=command==='next'?{type:'source.next',resource:connection,value:time,now:time}
        :command==='error'?{type:'source.error',resource:connection,error:'source-fault',now:time}
        :{type:'source.complete',resource:connection,now:time};
      dispatch(event);
    }
  }
  time++;
  while(state.core.phase==='Connected'&&state.core.subscribers.length)leave();
  if(connection)dispatch({type:'source.complete',resource:connection,now:time});
  return {observations,rules,state,connected:connection!==null};
}
