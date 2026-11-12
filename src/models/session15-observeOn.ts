import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision, source, subscribe, unsubscribe, next, complete, error, natural } from './session10-common.js';

export type ObserveOnParameters = Readonly<{delay:number;scheduler:'virtual FIFO'}>;
export type ScheduledNotification<T> =
  | Readonly<{id:number;due:number;kind:'N';value:T}>
  | Readonly<{id:number;due:number;kind:'C'}>
  | Readonly<{id:number;due:number;kind:'E';error:unknown}>;
export type ObserveOnState<T> =
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Active';sourceLive:boolean;nextId:number;lastSourceTime:number;pending:readonly ScheduledNotification<T>[]}>
  | Readonly<{phase:'Closed';reason:'complete'|'source-error'|'cancel'}>;
export type ObserveOnEvent<T> =
  | Readonly<{type:'subscribe'|'cancel'}>
  | Readonly<{type:'source.next';value:T;now:number}>
  | Readonly<{type:'source.complete';now:number}>
  | Readonly<{type:'source.error';error:unknown;now:number}>
  | Readonly<{type:'timer.fire';resource:ResourceRef;now:number}>;
export type ObserveOnModel<T> =
  OperatorModel<ObserveOnParameters,ObserveOnState<T>,ObserveOnEvent<T>,Action<T>>;
const timer=(id:number):ResourceRef=>({id:'scheduled',generation:id});
const done=(reason:'complete'|'source-error'|'cancel'):ObserveOnState<never>=>({phase:'Closed',reason});
const desc=(id:string,event:string,to:string,guard:string,actions:string[],explanation:string)=>({
  id:'S15-OBSERVEON-'+id,from:id==='INIT'?'Unsubscribed':'Active',event,to,guard,
  actions,explanation,obligations:['S15-OBSERVEON-'+id],
  nextState:to==='Closed'?'terminal; no scheduled notifications remain':'ordered notifications and source ownership retained',
});

export function createObserveOnModel<T>(delay=2):ObserveOnModel<T>{
  if(!natural(delay))throw RangeError('observeOn delay must be a nonnegative safe integer');
  const p:ObserveOnParameters={delay,scheduler:'virtual FIFO'};
  type S=ObserveOnState<T>;type E=ObserveOnEvent<T>;type A=Action<T>;
  type R=Rule<ObserveOnParameters,S,E,A>;
  const active=(s:S):s is Extract<S,{phase:'Active'}>=>s.phase==='Active';
  const validNow=(s:S,e:E):boolean=> active(s)&&'now' in e&&natural(e.now)
    &&e.now>=s.lastSourceTime&&Number.isSafeInteger(e.now+delay);
  const eligible=(s:S,e:E,kind:'N'|'E'|'C')=> active(s)&&e.type==='timer.fire'
    &&e.resource.id==='scheduled'&&s.pending[0]?.id===e.resource.generation
    &&s.pending[0].kind===kind&&natural(e.now)&&e.now>=s.pending[0].due;
  const add=(s:Extract<S,{phase:'Active'}>,item:ScheduledNotification<T>):S=>({
    ...s,nextId:s.nextId+1,lastSourceTime:item.due-delay,pending:[...s.pending,item],
  });
  const rules:R[]=[
    {description:desc('INIT','subscribe','Active','first subscription',['subscribe source'],'The source is acquired only when a consumer subscribes.'),
      enabled:()=>true,react:()=>({state:{phase:'Active',sourceLive:true,nextId:0,lastSourceTime:0,pending:[]},actions:[subscribe(source)]})},
    {description:desc('QUEUE-NEXT','source.next','Active','source live and time is valid',['queue one scheduled next'],'No immediate downstream next; each source emission owns an independent scheduler action.'),
      enabled:(s,e)=>active(s)&&s.sourceLive&&e.type==='source.next'&&validNow(s,e),
      react:(s,e)=>{if(!active(s)||e.type!=='source.next')throw Error('unexpected next');
        const item:ScheduledNotification<T>={id:s.nextId,due:e.now+delay,kind:'N',value:e.value};
        return {state:add(s,item),actions:[{type:'schedule',resource:timer(item.id),delay}]};}},
    {description:desc('QUEUE-COMPLETE','source.complete','Active','source live and time valid',['queue scheduled completion','release source'],'Completion is also scheduled, unlike delay. A source completion does not immediately terminate the result.'),
      enabled:(s,e)=>active(s)&&s.sourceLive&&e.type==='source.complete'&&validNow(s,e),
      react:(s,e)=>{if(!active(s)||e.type!=='source.complete')throw Error('unexpected complete');
        const item:ScheduledNotification<T>={id:s.nextId,due:e.now+delay,kind:'C'};
        const q=add(s,item);if(!active(q))throw Error('bad scheduled state');
        return {state:{...q,sourceLive:false},actions:[{type:'schedule',resource:timer(item.id),delay},unsubscribe(source)]};}},
    {description:desc('QUEUE-ERROR','source.error','Active','source live and time valid',['queue original error','release source'],'Errors are scheduled rather than immediately forwarded; previously queued notifications retain FIFO priority.'),
      enabled:(s,e)=>active(s)&&s.sourceLive&&e.type==='source.error'&&validNow(s,e),
      react:(s,e)=>{if(!active(s)||e.type!=='source.error')throw Error('unexpected error');
        const item:ScheduledNotification<T>={id:s.nextId,due:e.now+delay,kind:'E',error:e.error};
        const q=add(s,item);if(!active(q))throw Error('bad scheduled state');
        return {state:{...q,sourceLive:false},actions:[{type:'schedule',resource:timer(item.id),delay},unsubscribe(source)]};}},
    {description:desc('FIRE-NEXT','timer.fire','Active','head scheduled notification is next and due',['emit remembered payload','retire timer'],'Delivery occurs at the scheduler-supplied fire event, not the original source event.'),
      enabled:(s,e)=>eligible(s,e,'N'),react:(s,e)=>{
        if(!active(s)||e.type!=='timer.fire'||s.pending[0]?.kind!=='N')throw Error('invalid scheduled next');
        return {state:{...s,pending:s.pending.slice(1)},actions:[next(s.pending[0].value),{type:'cancel-timer',resource:e.resource}]};}},
    {description:desc('FIRE-COMPLETE','timer.fire','Closed','head scheduled completion is due',['complete result','retire timer'],'The result completes only when the scheduled completion action fires.'),
      enabled:(s,e)=>eligible(s,e,'C')&&active(s)&&!s.sourceLive&&s.pending.length===1,
      react:(_s,e)=>{if(e.type!=='timer.fire')throw Error('unexpected timer');
        return {state:done('complete'),actions:[complete,{type:'cancel-timer',resource:e.resource}]};}},
    {description:desc('FIRE-ERROR','timer.fire','Closed','head scheduled source error is due',['forward exact original error','retire timer'],'The error object is unchanged but its delivery is rescheduled.'),
      enabled:(s,e)=>eligible(s,e,'E')&&active(s)&&!s.sourceLive&&s.pending.length===1,
      react:(s,e)=>{if(!active(s)||e.type!=='timer.fire'||s.pending[0]?.kind!=='E')throw Error('unexpected error timer');
        return {state:done('source-error'),actions:[error(s.pending[0].error),{type:'cancel-timer',resource:e.resource}]};}},
    {description:desc('CANCEL','cancel','Closed','downstream unsubscribed',['cancel all scheduled actions','release live source, no terminal'],'Consumer cancellation is immediate and silent; it does not force queued work.'),
      enabled:()=>true,react:s=>{if(!active(s))throw Error('not active');
        return {state:done('cancel'),actions:[...s.pending.map(i=>({type:'cancel-timer' as const,resource:timer(i.id)})),
          ...(s.sourceLive?[unsubscribe(source)]:[])]};}},
  ];
  const metadata:ModelMetadata={
    schemaVersion:'1.1',rxjsVersion:'7.8.2',id:'observeOn-virtual-fifo-'+delay,operator:'observeOn',
    purpose:'Reschedule all source notifications, including completion and errors, with independently owned scheduler tasks.',
    cardinality:{signature:'observeOn : T* → T* (notification-time shifted)',
      conditions:['Every source next becomes exactly one scheduled next unless cancelled first.',
        'Source complete and source error are both scheduled notifications, never immediate result signals.',
        'FIFO scheduler tie order preserves input order at equal deadlines; consumer cancellation releases every queued action.']},
    scope:{parameters:'Virtual FIFO scheduler supplied externally; nonnegative safe integer delay '+delay+'.',
      callbacks:'No user projection callbacks; opaque source values and error identities remain unchanged.',
      time:'Source arrival and scheduler.fire times are inputs. Due time is arrival+delay, and only a legal head-of-queue timer can fire.',
      reentrancy:'Atomic nonreentrant delivery. Scheduler callbacks do not reenter current transitions.',
      exclusions:['Custom or non-FIFO schedulers; negative/nonintegral/overflow delay, synchronous recursive SchedulerActions.',
        'Downstream observer reentrancy and throwing teardown; source acquisition may not synchronously deliver reentrant events.']},
    initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'Subscribe source immediately; reschedule its notifications independently.'},
    ownership:{state:'subscription-local',sharing:'None; each consumer gets fresh source and scheduled-action subscriptions.',
      reset:'New queue and token counter per subscription; cancellation clears queued actions.',
      resources:[{id:'source',kind:'subscription',owner:'result subscriber'},
        {id:'scheduled',kind:'timer',owner:'result subscriber until fire or cancel'}]},
    dispatch:{policy:'scheduled',actionSemantics:'Queue arrival in stable order. Emit downstream only when scheduler returns the matching token at or after its deadline.',
      cancellationCheckpoints:['Between source arrivals and queued timer actions.']},
    inputs:[{type:'subscribe',origin:'downstream',category:'lifecycle',description:'connect source'},
      {type:'source.next',origin:'source',category:'notification',description:'queue a source value'},
      {type:'source.complete',origin:'source',category:'notification',description:'queue source completion'},
      {type:'source.error',origin:'source',category:'notification',description:'queue source error'},
      {type:'timer.fire',origin:'timer',category:'time',description:'scheduler executes queued action'},
      {type:'cancel',origin:'downstream',category:'lifecycle',description:'cancel scheduled work'}],
    actionTypes:['notify','subscribe','unsubscribe','schedule','cancel-timer'],
    controls:[{id:'Unsubscribed',description:'not connected',terminal:false},
      {id:'Active',description:'source may be live and queued notifications await scheduler',terminal:false},
      {id:'Closed',description:'completed, errored or cancelled',terminal:true}],
    sources:['src/internal/operators/observeOn.ts','src/internal/util/executeSchedule.ts'].map(path=>({
      url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,revision:pinnedRevision,
      purpose:'Pinned implementation and scheduled notification teardown'})),
    evidence:{modelTests:['tests/session15-model.test.mjs'],runtimeTests:['tests/session15-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-15.md'},
  };
  return {parameters:p,metadata,rules,initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>active(s) ? [
      ...(!natural(s.nextId)?['invalid token counter']:[]),
      ...(s.pending.some((item,i)=>!natural(item.id)||!natural(item.due)||
        (i>0&&(s.pending[i-1]?.id??-1)>=item.id))?['invalid ordered scheduler queue']:[]),
    ] : s.phase==='Closed'&&!['complete','source-error','cancel'].includes(s.reason)?['invalid reason']:[],
    validateReaction:(_s,e,r)=>[
      ...validateActionWord(r.actions),
      ...(e.type==='source.next'&&r.actions.some(a=>a.type==='notify')?['source next must not emit synchronously']:[]),
      ...(e.type==='cancel'&&r.actions.some(a=>a.type==='notify')?['cancellation cannot notify']:[]),
    ],
  };
}
export const observeOnExample:readonly TimedEvent<ObserveOnEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:'a',now:1}},
  {time:2,event:{type:'source.next',value:'b',now:2}},
  {time:3,event:{type:'source.complete',now:3}},
  {time:3,event:{type:'timer.fire',resource:timer(0),now:3}},
  {time:4,event:{type:'timer.fire',resource:timer(1),now:4}},
  {time:5,event:{type:'timer.fire',resource:timer(2),now:5}},
];
