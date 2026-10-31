import { Observable, shareReplay } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

/** Independent RxJS runtime oracle: real ReplaySubject buffering and actual clock. */
export function observeShareReplayRx(options, commands){
  const clock=new TestScheduler(()=>{}),observations=[],subscriptions=new Map();
  let sink=null, generation=0, nextSubscriber=0, connections=0;
  const log=entry=>observations.push({time:clock.now(),...entry});
  const source=new Observable(s=>{
    const current=generation++;sink=s;connections++;
    log({kind:'subscribe',id:'source',generation:current});
    return()=>{connections--;log({kind:'unsubscribe',id:'source',generation:current});};
  });
  const shared=source.pipe(shareReplay({...options,scheduler:clock}));
  const join=()=>{
    const target='s'+nextSubscriber++;
    const sub=shared.subscribe({
      next:value=>log({target,kind:'N',value}),
      error:error=>{log({target,kind:'E',error});subscriptions.delete(target);},
      complete:()=>{log({target,kind:'C'});subscriptions.delete(target);},
    });
    if(!sub.closed)subscriptions.set(target,sub);
  };
  const leave=()=>{
    const first=subscriptions.entries().next().value;
    if(first){first[1].unsubscribe();subscriptions.delete(first[0]);}
  };
  commands.forEach((command,index)=>clock.schedule(()=>{
    if(command==='join')join();
    else if(command==='leave')leave();
    else if(sink&&!sink.closed){
      if(command==='next')sink.next(clock.now());
      else if(command==='error')sink.error('source-fault');
      else sink.complete();
    }
    if(connections>1)throw new Error('two connections');
  },index+1));
  clock.schedule(()=>{
    while(subscriptions.size)leave();
    if(sink&&!sink.closed)sink.complete();
  },commands.length+1);
  clock.flush();
  return {observations,connected:connections!==0,liveSubscribers:subscriptions.size};
}
