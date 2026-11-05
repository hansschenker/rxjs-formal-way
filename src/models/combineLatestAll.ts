import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';

export type LatestAllOperator='combineLatestAll'|'combineAll';
export type LatestAllParameters=Readonly<{operator:LatestAllOperator;projector:'none'}>;
export type LatestSlot<T>=Readonly<{source:unknown;ready:boolean;value?:T;live:boolean}>;
export type LatestAllState<T> =
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Collecting';sources:readonly unknown[]}>
  | Readonly<{phase:'Joining';slots:readonly LatestSlot<T>[]}>
  | Readonly<{phase:'Closed';reason:'complete'|'outer-error'|'inner-error'|'cancel'}>;
export type LatestAllEvent<T> =
  | Readonly<{type:'subscribe'|'outer.complete'|'cancel'}>
  | Readonly<{type:'outer.next';value:unknown}>
  | Readonly<{type:'outer.error';error:unknown}>
  | Readonly<{type:'inner.next';resource:ResourceRef;value:T}>
  | Readonly<{type:'inner.complete';resource:ResourceRef}>
  | Readonly<{type:'inner.error';resource:ResourceRef;error:unknown}>;
export type LatestAllModel<T> = OperatorModel<LatestAllParameters,LatestAllState<T>,LatestAllEvent<T>,Action<T[],unknown>>;

const rev='e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const outer={id:'outer',generation:0} as const;
const inner=(n:number):ResourceRef=>({id:'inner',generation:n});
const acquire=(resource:ResourceRef):Action<never,unknown>=>({type:'subscribe',resource});
const release=(resource:ResourceRef):Action<never,unknown>=>({type:'unsubscribe',resource});
const emit=<T>(values:readonly T[]):Action<T[],unknown>=>({type:'notify',target:'downstream',notification:{kind:'N',value:[...values]}});
const done:Action<never,unknown>={type:'notify',target:'downstream',notification:{kind:'C'}};
const err=<T>(error:unknown):Action<T[],unknown>=>({type:'notify',target:'downstream',notification:{kind:'E',error}});
const natural=(x:number):boolean=>Number.isSafeInteger(x)&&x>=0;

function metadata(operator:LatestAllOperator):ModelMetadata {
 const alias=operator==='combineAll';
 return {
  schemaVersion:'1.1',id:operator+'-deferred-latest-array',operator,rxjsVersion:'7.8.2',
  purpose:'Collect inner sources until the outer completes; then subscribe and emit fresh arrays whenever an inner updates after all first values arrive.',
  cardinality:{signature:operator+' : (T*)* -> (T[])*',conditions:[
    'The outer emits inner Observable identities; no inner is subscribed until outer completion.',
    'After outer completion, with n nonempty sources, no output is permitted until every inner has emitted at least once.',
    'Thereafter each inner next emits a fresh n-element latest-value array in outer-source order; completion waits for every inner to complete.',
    'An empty outer completes with no next. Any inner errors terminate immediately.',
  ]},
  scope:{parameters:alias?'Deprecated exact alias to combineLatestAll; no projector.':'Observable-valued outer source, nonempty or empty; no optional projector.',
    callbacks:'No user callback for this profile; projector overload must be specified/tested separately and is not claimed here.',
    time:'No internal timer. Collection barrier is outer completion; subsequent ordering is determined by inner notifications, including equal-time arrival order.',
    reentrancy:'Inner notifications delivered after all initial inner subscriptions have been installed; arbitrary synchronous emissions during that setup excluded.',
    exclusions:['Optional project function, arbitrary ObservableInput/Promise conversion and synchronous/reentrant emission during inner subscription setup.',
      'Observer/finalizer throw, cancellation inside output delivery, outer observable reference mutation and universal symbolic equivalence.',
      'No early completion when an inner completes without a value: pinned RxJS combineLatestInit waits for every inner completion.']},
  initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'Connect outer only, retain inner-source tokens, subscribe to all collected inners only after outer completion.'},
  ownership:{state:'subscription-local',sharing:'No sharing. One execution holds source collection and one subscription per collected inner.',
    reset:'Each subscription starts without latest values. Ready flags distinguish not-yet-emitted from a real undefined value.',
    resources:[{id:'outer',kind:'subscription',owner:'current execution'},{id:'inner',kind:'subscription',owner:'each collected inner source'}]},
  dispatch:{policy:'atomic-non-reentrant',actionSemantics:'Collect while outer is live, then connect inners in order; each latest notification replaces one slot and emits only when every slot is ready.',
    cancellationCheckpoints:['Explicit cancellation disposes live sources without completion or pending value output.',
      'Source completion and inner completion are separate; no scheduler or sharing is implied.']},
  inputs:[{type:'subscribe',origin:'downstream',category:'lifecycle',description:'start outer subscription'},
    {type:'outer.next',origin:'outer',category:'notification',description:'store inner source token'},
    {type:'outer.complete',origin:'outer',category:'notification',description:'start all inner sources or complete for empty outer'},
    {type:'outer.error',origin:'outer',category:'notification',description:'terminate without subscribing any inner'},
    {type:'inner.next',origin:'inner',category:'notification',description:'update latest slot and maybe emit tuple'},
    {type:'inner.complete',origin:'inner',category:'notification',description:'mark inner finished, terminate when all finished'},
    {type:'inner.error',origin:'inner',category:'notification',description:'error and dispose every active inner'},
    {type:'cancel',origin:'downstream',category:'lifecycle',description:'silent cancellation'}],
  actionTypes:['subscribe','unsubscribe','notify'],
  controls:[{id:'Unsubscribed',description:'not connected',terminal:false},
    {id:'Collecting',description:'collecting inner source identities, no inner connected',terminal:false},
    {id:'Joining',description:'inner values and ready/liveness flags',terminal:false},
    {id:'Closed',description:'completed, errored or cancelled',terminal:true}],
  sources:[
    ...(alias?[{url:'https://github.com/ReactiveX/rxjs/blob/'+rev+'/src/internal/operators/combineAll.ts',revision:rev,purpose:'Exact deprecated function alias to combineLatestAll'}]:[]),
    {url:'https://github.com/ReactiveX/rxjs/blob/'+rev+'/src/internal/operators/combineLatestAll.ts',revision:rev,purpose:'Delegation to joinAllInternals'},
    {url:'https://github.com/ReactiveX/rxjs/blob/'+rev+'/src/internal/operators/joinAllInternals.ts',revision:rev,purpose:'toArray then mergeMap join after outer completes'},
    {url:'https://github.com/ReactiveX/rxjs/blob/'+rev+'/src/internal/observable/combineLatest.ts',revision:rev,purpose:'Ready flag, emitted latest array and active completion policy'}],
  evidence:{modelTests:['tests/session08-model.test.mjs'],runtimeTests:['tests/session08-rxjs.test.mjs'],status:'source-inspected',record:'evidence/SESSION-08.md'},
 };
}
function create<T>(operator:LatestAllOperator):LatestAllModel<T>{
 type S=LatestAllState<T>;type E=LatestAllEvent<T>;type A=Action<T[],unknown>;
 type R=Rule<LatestAllParameters,S,E,A>;
 const prefix=operator.toUpperCase();
 const desc=(id:string,from:S['phase'],event:E['type'],to:S['phase'],guard:string,actions:string[],explanation:string):R['description']=>({
  id:prefix+'-'+id,from,event,to,guard,actions,nextState:to==='Closed'?'terminal':'preserve ordered source and latest bindings',
  obligations:['S8-'+prefix+'-'+id],explanation,
 });
 const close=(reason:Extract<S,{phase:'Closed'}>['reason']):S=>({phase:'Closed',reason});
 const resources=(s:S):A[]=>s.phase==='Collecting'?[release(outer)]:
   s.phase==='Joining'?s.slots.flatMap((x,i)=>x.live?[release(inner(i))]:[]):[];
 const matching=(s:S,e:E):boolean=>s.phase==='Joining'&&'resource' in e&&
   e.resource.id==='inner'&&natural(e.resource.generation)&&
   e.resource.generation<s.slots.length&&s.slots[e.resource.generation]?.live===true;
 const rules:R[]=[
  {description:desc('INIT','Unsubscribed','subscribe','Collecting','fresh subscription',['connect outer'],'Inner streams are not connected during collection.'),
   enabled:()=>true,react:()=>({state:{phase:'Collecting',sources:[]},actions:[acquire(outer)]})},
  {description:desc('OUTER-NEXT','Collecting','outer.next','Collecting','outer still open; bounded count',
    ['retain source identity in arrival order'],'No inner subscribes when its token arrives.'),
   enabled:s=>s.phase==='Collecting'&&s.sources.length<Number.MAX_SAFE_INTEGER,
   react:(s,e)=>{
    if(s.phase!=='Collecting'||e.type!=='outer.next')throw new Error('invalid outer next');
    return {state:{phase:'Collecting',sources:[...s.sources,e.value]},actions:[]};
   }},
  {description:desc('OUTER-EMPTY','Collecting','outer.complete','Closed','no collected inner sources',
    ['complete without value','release outer'],'Combining zero input sources completes without emitting an empty array.'),
   enabled:s=>s.phase==='Collecting'&&s.sources.length===0,
   react:()=>({state:close('complete'),actions:[done,release(outer)]})},
  {description:desc('OUTER-JOIN','Collecting','outer.complete','Joining','at least one collected inner source',
    ['release outer','subscribe all collected inner sources in arrival order'],'A join begins only after outer completes.'),
   enabled:s=>s.phase==='Collecting'&&s.sources.length>0,
   react:s=>{
    if(s.phase!=='Collecting')throw new Error('invalid outer complete');
    return {state:{phase:'Joining',slots:s.sources.map(source=>({source,ready:false,live:true}))},
      actions:[release(outer),...s.sources.map((_x,i)=>acquire(inner(i)))]};
   }},
  {description:desc('OUTER-ERROR','Collecting','outer.error','Closed','outer still active',
    ['error without joining any inners','release outer'],'Outer errors terminate without subscribing the retained inner tokens.'),
   enabled:()=>true,react:(_s,e)=>{
    if(e.type!=='outer.error')throw new Error('invalid outer error');
    return {state:close('outer-error'),actions:[err<T>(e.error),release(outer)]};
   }},
  {description:desc('INNER-WAIT','Joining','inner.next','Joining','live inner and at least one slot remains unready',
    ['record latest and first-value status; no output'],'Each inner must deliver its first value before the result can emit.'),
   enabled:(s,e)=>{
    if(!matching(s,e)||e.type!=='inner.next')return false;
    const slots=s.phase==='Joining'?s.slots:[];
    return slots.some((x,i)=>i!==e.resource.generation&&!x.ready);
   },
   react:(s,e)=>{
    if(s.phase!=='Joining'||e.type!=='inner.next')throw new Error('invalid inner wait');
    return {state:{...s,slots:s.slots.map((x,i)=>i===e.resource.generation?{...x,ready:true,value:e.value}:x)},actions:[]};
   }},
  {description:desc('INNER-EMIT','Joining','inner.next','Joining','live inner and every other slot ready',
    ['update one latest value','emit fresh ordered tuple'],'Once all first values exist, each subsequent inner next emits one full latest snapshot.'),
   enabled:(s,e)=>matching(s,e)&&e.type==='inner.next'&&s.phase==='Joining'&&
      s.slots.every((x,i)=>i===e.resource.generation||x.ready),
   react:(s,e)=>{
    if(s.phase!=='Joining'||e.type!=='inner.next')throw new Error('invalid inner emit');
    const slots=s.slots.map((x,i)=>i===e.resource.generation?{...x,ready:true,value:e.value}:x);
    return {state:{...s,slots},actions:[emit(slots.map(x=>x.value as T))]};
   }},
  {description:desc('INNER-COMPLETE-WAIT','Joining','inner.complete','Joining','live inner and another still live',
    ['release completed inner, retain its last value'],'An inner completing without a first value prevents further output but does not complete result until all inners end.'),
   enabled:(s,e)=>matching(s,e)&&s.phase==='Joining'&&s.slots.some((x,i)=>i!==(e.type==='inner.complete'?e.resource.generation:-1)&&x.live),
   react:(s,e)=>{
    if(s.phase!=='Joining'||e.type!=='inner.complete')throw new Error('invalid inner complete');
    return {state:{...s,slots:s.slots.map((x,i)=>i===e.resource.generation?{...x,live:false}:x)},
      actions:[release(e.resource)]};
   }},
  {description:desc('INNER-COMPLETE-LAST','Joining','inner.complete','Closed','final live inner',
    ['complete','release final inner'],'The joined stream completes only after its last active inner completes.'),
   enabled:(s,e)=>matching(s,e)&&s.phase==='Joining'&&s.slots.every((x,i)=>i===(e.type==='inner.complete'?e.resource.generation:-1)||!x.live),
   react:(_s,e)=>{
    if(e.type!=='inner.complete')throw new Error('invalid inner last');
    return {state:close('complete'),actions:[done,release(e.resource)]};
   }},
  {description:desc('INNER-ERROR','Joining','inner.error','Closed','matching live inner',
    ['error immediately','release all live inner subscriptions'],'Inner errors propagate unchanged, without retaining a partial tuple.'),
   enabled:(s,e)=>matching(s,e),
   react:(s,e)=>{
    if(e.type!=='inner.error')throw new Error('invalid inner error');
    return {state:close('inner-error'),actions:[err<T>(e.error),...resources(s)]};
   }},
  {description:desc('CANCEL-COLLECT','Collecting','cancel','Closed','outer live',
    ['release outer silently'],'Discard collected tokens without subscribing to them.'),
   enabled:()=>true,react:s=>({state:close('cancel'),actions:resources(s)})},
  {description:desc('CANCEL-JOIN','Joining','cancel','Closed','join live',
    ['release live inners silently'],'Cancel all active inner sources, without completing downstream.'),
   enabled:()=>true,react:s=>({state:close('cancel'),actions:resources(s)})},
 ];
 return {metadata:metadata(operator),parameters:{operator,projector:'none'},rules,
   initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
   validateState:s=>{
    if(s.phase==='Collecting'&&s.sources.length>=Number.MAX_SAFE_INTEGER)return ['source count overflow'];
    if(s.phase==='Joining'&&(!s.slots.length||s.slots.length>=Number.MAX_SAFE_INTEGER||
      s.slots.some(x=>typeof x.ready!=='boolean'||typeof x.live!=='boolean')))return ['invalid slot state'];
    return [];
   },validateReaction:(_s,e,r)=>{
    const problems=[...validateActionWord(r.actions)];
    if(e.type==='outer.next'&&r.actions.length)problems.push('early source subscription');
    if((e.type==='cancel'||e.type.endsWith('.error'))&&r.actions.some(x=>x.type==='notify'&&x.notification.kind==='N'))
      problems.push('terminal error/cancel emitted');
    if(e.type==='inner.next'&&r.actions.filter(x=>x.type==='notify').length>1)
      problems.push('one input may emit at most one latest tuple');
    return problems;
   }};
}
export const createCombineLatestAllModel=<T>():LatestAllModel<T>=>create<T>('combineLatestAll');
/** Exact deprecated exported alias in RxJS 7.8.2; the same guarded machine, independently attributed. */
export const createCombineAllModel=<T>():LatestAllModel<T>=>create<T>('combineAll');
const at=(time:number,event:LatestAllEvent<number>):TimedEvent<LatestAllEvent<number>>=>({time,event});
export const combineLatestAllExample=[
 at(0,{type:'subscribe'}),
 at(1,{type:'outer.next',value:'left'}),
 at(2,{type:'outer.next',value:'right'}),
 at(3,{type:'outer.complete'}),
 at(4,{type:'inner.next',resource:inner(0),value:1}),
 at(5,{type:'inner.next',resource:inner(1),value:10}),
 at(6,{type:'inner.next',resource:inner(0),value:2}),
 at(7,{type:'inner.complete',resource:inner(0)}),
 at(8,{type:'inner.complete',resource:inner(1)}),
] as const;
export const combineAllExample=combineLatestAllExample;
