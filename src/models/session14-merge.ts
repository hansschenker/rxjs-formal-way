import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision } from './session10-common.js';

export type MergeParameters=Readonly<{otherSources:number;concurrent:number|'unbounded';scheduler:'none'}>;
export type MergeState=
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Active';live:readonly number[];pending:readonly number[];total:number}>
  | Readonly<{phase:'Closed';reason:'complete'|'input-error'|'cancel'}>;
export type MergeEvent<T>=
  | Readonly<{type:'subscribe'|'cancel'}>
  | Readonly<{type:'input.next';resource:ResourceRef;value:T}>
  | Readonly<{type:'input.complete';resource:ResourceRef}>
  | Readonly<{type:'input.error';resource:ResourceRef;error:unknown}>;
export type MergeModel<T>=OperatorModel<MergeParameters,MergeState,MergeEvent<T>,Action<T>>;
const ref=(n:number):ResourceRef=>({id:'input',generation:n});
const sub=<T>(n:number):Action<T>=>({type:'subscribe',resource:ref(n)});
const unsub=<T>(n:number):Action<T>=>({type:'unsubscribe',resource:ref(n)});
const note=<T>(value:T):Action<T>=>({type:'notify',target:'downstream',notification:{kind:'N',value}});
const complete=<T>():Action<T>=>({type:'notify',target:'downstream',notification:{kind:'C'}});
const fail=<T>(error:unknown):Action<T>=>({type:'notify',target:'downstream',notification:{kind:'E',error}});
const close=(reason:'complete'|'input-error'|'cancel'):MergeState=>({phase:'Closed',reason});
const natural=(n:number)=>Number.isSafeInteger(n)&&n>=0;

export function createMergeModel<T>(otherSources=2,concurrent=Infinity):MergeModel<T>{
  if(!natural(otherSources)||otherSources>32)throw RangeError('otherSources out of range 0..32');
  if(!(concurrent===Infinity||(natural(concurrent)&&concurrent>0)))throw RangeError('concurrency must be positive integer or Infinity');
  const p:MergeParameters={otherSources,concurrent:concurrent===Infinity?'unbounded':concurrent,scheduler:'none'};
  const cap=concurrent===Infinity?otherSources+1:concurrent;
  type S=MergeState;type E=MergeEvent<T>;type A=Action<T>;type R=Rule<MergeParameters,S,E,A>;
  const active=(s:S):s is Extract<S,{phase:'Active'}>=>s.phase==='Active';
  const matching=(s:S,e:E):boolean=>active(s)&&'resource' in e&&e.resource.id==='input'&&s.live.includes(e.resource.generation);
  const d=(id:string,event:string,to:string,guard:string,actions:string[],explanation:string)=>({
    id:'S14-MERGE-'+id,from:id==='INIT'?'Unsubscribed':'Active',event,to,guard,actions,explanation,
    nextState:to==='Closed'?'terminal, no subscriptions':'live and pending indices respect FIFO admission',
    obligations:['S14-MERGE-'+id]});
  const rules:R[]=[
    {description:d('INIT','subscribe','Active','first consumer connection',['subscribe source first then available others'],'All inputs are fixed at operator construction; the source at input 0 is subscribed first.'),
      enabled:()=>true,react:()=>{const initial=Math.min(otherSources+1,cap);
        return {state:{phase:'Active',live:Array.from({length:initial},(_x,i)=>i),
          pending:Array.from({length:otherSources+1-initial},(_x,i)=>i+initial),total:otherSources+1},
          actions:Array.from({length:initial},(_x,i)=>sub<T>(i))};}},
    {description:d('NEXT','input.next','Active','resource is currently subscribed',['forward exact payload'],'Any admitted input contributes values in actual event order without changing subscription ownership.'),
      enabled:matching,react:(s,e)=>{if(!active(s)||e.type!=='input.next')throw Error('not live');
        return {state:s,actions:[note(e.value)]};}},
    {description:d('REFILL','input.complete','Active','live input complete and pending FIFO is nonempty',['release completed input','subscribe next waiting input'],'At a bounded concurrency limit, completion frees a slot for the next supplied source.'),
      enabled:(s,e)=>matching(s,e)&&active(s)&&s.pending.length>0,
      react:(s,e)=>{if(!active(s)||e.type!=='input.complete')throw Error('not live');
        const nextIndex=s.pending[0]!;
        return {state:{...s,live:[...s.live.filter(x=>x!==e.resource.generation),nextIndex],pending:s.pending.slice(1)},
          actions:[unsub<T>(e.resource.generation),sub<T>(nextIndex)]};}},
    {description:d('COMPLETE-WAIT','input.complete','Active','pending empty and other inputs live',['release completed input'],'Completion waits for every connected input and queued source to finish.'),
      enabled:(s,e)=>matching(s,e)&&active(s)&&!s.pending.length&&s.live.length>1,
      react:(s,e)=>{if(!active(s)||e.type!=='input.complete')throw Error('not live');
        return {state:{...s,live:s.live.filter(x=>x!==e.resource.generation)},actions:[unsub<T>(e.resource.generation)]};}},
    {description:d('COMPLETE-LAST','input.complete','Closed','pending empty, final live input',['complete result','release final input'],'Only the final input completion ends the result normally.'),
      enabled:(s,e)=>matching(s,e)&&active(s)&&!s.pending.length&&s.live.length===1,
      react:(_s,e)=>{if(e.type!=='input.complete')throw Error('not complete');
        return {state:close('complete'),actions:[complete<T>(),unsub<T>(e.resource.generation)]};}},
    {description:d('ERROR','input.error','Closed','any live source fails',['forward exact error','release every subscribed input'],'A single source failure immediately tears down all live sources and discards pending subscriptions.'),
      enabled:matching,react:(s,e)=>{if(!active(s)||e.type!=='input.error')throw Error('not error');
        return {state:close('input-error'),actions:[fail<T>(e.error),...s.live.map(n=>unsub<T>(n))]};}},
    {description:d('CANCEL','cancel','Closed','consumer unsubscribe',['release all live sources, no notification'],'Downstream cancellation is silent; queued inputs are never subscribed.'),
      enabled:()=>true,react:s=>{if(!active(s))throw Error('not active');
        return {state:close('cancel'),actions:s.live.map(n=>unsub<T>(n))};}},
  ];
  const meta:ModelMetadata={
    schemaVersion:'1.1',rxjsVersion:'7.8.2',id:'merge-static-'+otherSources+'-concurrency-'+p.concurrent,
    operator:'merge',purpose:'Merge one piped source and configured other Observables; bounded concurrency starts later sources FIFO.',
    cardinality:{signature:'merge : T0* × ... × Tn* → (T0 | ... | Tn)*',conditions:[
      'Every connected input next forwards exactly once in actual arrival order.',
      'Output completion requires every input completion; any input error terminates immediately.',
      'A bounded concurrency limit delays subscriptions to later supplied sources, not their values.',
    ]},
    scope:{parameters:'Pipeable deprecated merge export with '+otherSources+' other valid Observable inputs; concurrency '+p.concurrent+'; no scheduler.',
      callbacks:'No callbacks. Input payloads are opaque and preserve identity.',
      time:'No internal clock; all inputs supply their notification times. Source-first subscriptions are ordered.',
      reentrancy:'Atomic nonreentrant subscriptions; synchronous input delivery during acquisition is excluded.',
      exclusions:['Deprecated scheduler overload and Promise/Iterable conversions, synchronous sources during subscription setup.',
        'Reentrant observers and source callbacks, teardown throws and unbounded scenario counts over 32 others.']},
    initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'Acquire source 0 before other Observable arguments; up to concurrency limit.'},
    ownership:{state:'subscription-local',sharing:'Merge does not create sharing; each result subscription independently acquires input subscriptions.',
      reset:'Fresh live and pending indices; no shared queue between consumers.',
      resources:[{id:'input',kind:'subscription',owner:'result execution; generation is input argument index'}]},
    dispatch:{policy:'atomic-non-reentrant',actionSemantics:'Preserve event arrival order and release completed sources; concurrency slots are FIFO.',
      cancellationCheckpoints:['Between external notifications; cancel all live sources silently, discard pending.']},
    inputs:[
      {type:'subscribe',origin:'downstream',category:'lifecycle',description:'connect result'},
      {type:'input.next',origin:'source',category:'notification',description:'value from a subscribed source'},
      {type:'input.complete',origin:'source',category:'notification',description:'one input completed'},
      {type:'input.error',origin:'source',category:'notification',description:'one input failed'},
      {type:'cancel',origin:'downstream',category:'lifecycle',description:'consumer unsubscribed'},
    ],actionTypes:['subscribe','unsubscribe','notify'],
    controls:[{id:'Unsubscribed',description:'no active subscriptions',terminal:false},
      {id:'Active',description:'zero or more live inputs and ordered pending sources',terminal:false},
      {id:'Closed',description:'terminated or cancelled',terminal:true}],
    sources:['src/internal/operators/merge.ts','src/internal/operators/mergeAll.ts',
      'src/internal/operators/mergeInternals.ts'].map(path=>({
        url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,
        revision:pinnedRevision,purpose:'Pinned pipeable merge and concurrency/pending admission semantics'})),
    evidence:{modelTests:['tests/session14-model.test.mjs'],runtimeTests:['tests/session14-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-14.md'},
  };
  return {parameters:p,metadata:meta,rules,
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>{if(s.phase!=='Active')return [];
      const ids=[...s.live,...s.pending];
      return [
        ...(new Set(ids).size!==ids.length?['duplicate source indices']:[]),
        ...(ids.some(n=>!natural(n)||n>=s.total)?['index outside source inventory']:[]),
        ...(s.live.length>cap?['concurrency bound exceeded']:[]),
        ...(s.pending.some((n,i,a)=>i>0&&n<=a[i-1]!)?['pending queue not FIFO']:[]),
        ...(s.live.length===0?['active control cannot have zero live sources']:[]),
      ];},
    validateReaction:(_s,e,r)=>[
      ...validateActionWord(r.actions),
      ...(e.type==='input.next'&&
        !(r.actions.length===1&&r.actions[0]?.type==='notify'&&r.actions[0].notification.kind==='N'&&
          Object.is(r.actions[0].notification.value,e.value))?['input.next must forward exactly once by identity']:[]),
    ],
  };
}
const a=(n:number)=>ref(n);
export const mergeExample:readonly TimedEvent<MergeEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'input.next',resource:a(0),value:1}},
  {time:2,event:{type:'input.next',resource:a(1),value:10}},
  {time:3,event:{type:'input.complete',resource:a(0)}},
  {time:4,event:{type:'input.next',resource:a(2),value:20}},
  {time:5,event:{type:'input.complete',resource:a(1)}},
  {time:6,event:{type:'input.complete',resource:a(2)}},
];
