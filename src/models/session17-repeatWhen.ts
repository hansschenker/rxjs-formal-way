import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { natural, pinnedRevision } from './session10-common.js';

/** Deprecated repeatWhen's persistent completion Subject and notifier.
 * Synchronous notifier next during source.subscribe and notifier next while a
 * different source generation is active are separately excluded.
 */
export type RepeatWhenParameters = Readonly<{ notifier: 'one-persistent-Observable'; completionSignals:'void' }>;
export type RepeatWhenState =
  | Readonly<{phase:'Unsubscribed';generation:0;notifier:'absent';reason:'none'}>
  | Readonly<{phase:'Active'|'Waiting';generation:number;notifier:'absent'|'open'|'completed';reason:'none'}>
  | Readonly<{phase:'Closed';generation:number;notifier:'absent'|'open'|'completed';reason:'complete'|'error'|'cancel'}>;
export type RepeatWhenEvent<T> =
  | Readonly<{type:'subscribe'|'cancel'|'notifier.next'|'notifier.complete'}>
  | Readonly<{type:'notifier.error';error:unknown}>
  | Readonly<{type:'source.next';resource:ResourceRef;value:T}>
  | Readonly<{type:'source.complete';resource:ResourceRef}>
  | Readonly<{type:'source.error';resource:ResourceRef;error:unknown}>;
export type RepeatWhenModel<T> = OperatorModel<RepeatWhenParameters,RepeatWhenState,RepeatWhenEvent<T>,Action<unknown>>;
const src=(n:number):ResourceRef=>({id:'source',generation:n});
const notifier:ResourceRef={id:'notifier',generation:0};
const acquire=(r:ResourceRef):Action<unknown>=>({type:'subscribe',resource:r});
const release=(r:ResourceRef):Action<unknown>=>({type:'unsubscribe',resource:r});
const value=(v:unknown):Action<unknown>=>({type:'notify',target:'downstream',notification:{kind:'N',value:v}});
const completionSignal:Action<unknown>={type:'notify',target:'completionsSubject',notification:{kind:'N',value:undefined}};
const done:Action<unknown>={type:'notify',target:'downstream',notification:{kind:'C'}};
const fail=(err:unknown):Action<unknown>=>({type:'notify',target:'downstream',notification:{kind:'E',error:err}});
const reference=(path:string)=>({
  url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,
  revision:pinnedRevision,purpose:'Pinned repeatWhen Subject/notifier subscription ownership'
});
const inp=(type:string,origin:'downstream'|'source'|'inner',description:string)=>{
  const category=origin==='downstream'?'lifecycle':'notification';
  return {type,origin,category:category as 'lifecycle'|'notification',description};
};
export function createRepeatWhenModel<T>():RepeatWhenModel<T>{
  const p:RepeatWhenParameters={notifier:'one-persistent-Observable',completionSignals:'void'};
  type S=RepeatWhenState;type E=RepeatWhenEvent<T>;type A=Action<unknown>;
  type R=Rule<RepeatWhenParameters,S,E,A>;
  const active=(s:S,e:E):boolean=>s.phase==='Active'&&'resource'in e&&
    e.resource.id==='source'&&e.resource.generation===s.generation;
  const close=(s:S,reason:'complete'|'error'|'cancel'):S=>({...s,phase:'Closed',reason});
  const description=(suffix:string,from:S['phase'],event:E['type'],to:S['phase'],
    guard:string,actions:readonly string[],explanation:string,nextState:string)=>({
    id:'S17-REPEATWHEN-'+suffix,from,event,to,guard,actions,explanation,nextState,
    obligations:['S17-REPEATWHEN-'+suffix]
  });
  const rules:R[]=[];
  const add=(suffix:string,from:S['phase'],event:E['type'],to:S['phase'],
    guard:string,actions:readonly string[],explanation:string,nextState:string,
    enabled:(s:S,e:E)=>boolean,react:(s:S,e:E)=>{state:S;actions:readonly A[]}):void=>{
      rules.push({description:description(suffix,from,event,to,guard,actions,explanation,nextState),enabled,react});
    };
  add('START','Unsubscribed','subscribe','Active','first downstream connection',
    ['subscribe source generation 0'],
    'Notifier selector has not yet been invoked: it is lazy until the first successful source completion.',
    'Active with no notifier.',()=>true,
    _s=>({state:{phase:'Active',generation:0,notifier:'absent',reason:'none'},actions:[acquire(src(0))]}));
  add('VALUE','Active','source.next','Active','source generation is current',
    ['forward source value unchanged'],
    'The notifier only governs repetition; values from every successful attempt reach the downstream observer.',
    'Current generation and notifier state unchanged.',active,
    (s,e)=>{
      if(e.type!=='source.next')throw Error('expected source value');
      return {state:s,actions:[value(e.value)]};
    });
  add('FIRST-SOURCE-COMPLETE','Active','source.complete','Waiting',
    'current source completes, and notifier has never been constructed',
    ['unsubscribe the completed source','subscribe to single notifier','emit void to completion Subject'],
    'On first completion allocate the Subject, invoke the user notifier exactly once and subscribe its result; notify it of the completion.',
    'Waiting for first notifier next or terminal notification.',
    (s,e)=>active(s,e)&&s.phase==='Active'&&s.notifier==='absent',
     s=>{if(s.phase!=='Active')throw Error('expected active source completion');
      return {state:{phase:'Waiting',generation:s.generation,notifier:'open',reason:'none'},
        actions:[release(src(s.generation)),acquire(notifier),completionSignal]};});
  add('SOURCE-COMPLETE-WAIT','Active','source.complete','Waiting',
    'current source completes and notifier is still open',
    ['unsubscribe source','emit one void completion Subject signal'],
    'Subsequent completions reuse the same Subject and notifier subscription, not a fresh notifier selector call.',
    'Waiting with the notifier still open.',
    (s,e)=>active(s,e)&&s.phase==='Active'&&s.notifier==='open',
     s=>{if(s.phase!=='Active')throw Error('expected active source completion');
      return {state:{phase:'Waiting',generation:s.generation,notifier:'open',reason:'none'},
        actions:[release(src(s.generation)),completionSignal]};});
  add('SOURCE-COMPLETE-STOP','Active','source.complete','Closed',
    'current source completes after notifier has completed',
    ['unsubscribe final source','complete downstream'],
    'If the notifier has already completed, downstream completes when the current source finally completes.',
    'Closed successfully; no source or notifier connection.',
    (s,e)=>active(s,e)&&s.phase==='Active'&&s.notifier==='completed',
    s=>({state:close(s,'complete'),actions:[release(src(s.generation)),done]}));
  add('RESTART','Waiting','notifier.next','Active',
    'notifier is open and source has completed',
    ['subscribe one new source generation'],
    'Every notifier next while waiting restarts exactly one new producer execution; notifier connection is retained.',
    'Active at next source generation.',
    s=>s.phase==='Waiting'&&s.notifier==='open',
     s=>{if(s.phase!=='Waiting')throw Error('expected waiting notifier next');
      return {state:{phase:'Active',generation:s.generation+1,notifier:'open',reason:'none'},
        actions:[acquire(src(s.generation+1))]};});
  add('NOTIFIER-COMPLETE-WAIT','Waiting','notifier.complete','Closed',
    'notifier completes with main source finished',
    ['unsubscribe notifier','complete downstream'],
    'An empty/finished notifier ends the repetition while waiting; it does not subscribe a new source.',
    'Closed successfully.',
    s=>s.phase==='Waiting'&&s.notifier==='open',
    s=>({state:close(s,'complete'),actions:[release(notifier),done]}));
  add('NOTIFIER-COMPLETE-ACTIVE','Active','notifier.complete','Active',
    'notifier completes while restarted source is still active',
    ['release notifier without terminating current source'],
    'Notifier completion is recorded. Do not interrupt the current source: completion awaits its own successful termination.',
    'Active with notifier completed.',
    s=>s.phase==='Active'&&s.notifier==='open',
     s=>{if(s.phase!=='Active')throw Error('expected active notifier completion');
      return {state:{phase:'Active',generation:s.generation,notifier:'completed',reason:'none'},
        actions:[release(notifier)]};});
  for(const phase of ['Active','Waiting'] as const){
    add('NOTIFIER-ERROR-'+phase.toUpperCase(),phase,'notifier.error','Closed',
      'notifier is open',
      ['forward exact notifier error','release all live resources'],
      'Notifier error terminates the result whether waiting or inside a restarted source execution.',
      'Closed in error.',
      s=>s.phase===phase&&s.notifier==='open',
      (s,e)=>{
        if(e.type!=='notifier.error')throw Error('expected notifier error');
        return {state:close(s,'error'),actions:[fail(e.error),
          ...(phase==='Active'?[release(src(s.generation))]:[]),release(notifier)]};
      });
    add('CANCEL-'+phase.toUpperCase(),phase,'cancel','Closed',
      'downstream cancellation',
      ['dispose current source if active','dispose notifier if open','no terminal notification'],
      'Cancellation never sends a synthetic complete or error.',
      'Closed by cancellation.',
      s=>s.phase===phase,
      s=>({state:close(s,'cancel'),actions:[
        ...(phase==='Active'?[release(src(s.generation))]:[]),
        ...(s.notifier==='open'?[release(notifier)]:[])
      ]}));
  }
  add('SOURCE-ERROR','Active','source.error','Closed',
    'current source generation fails',
    ['error downstream immediately','release source and existing notifier'],
    'repeatWhen observes successful completion only; a source error never triggers its notifier.',
    'Closed in error.',
    active,(s,e)=>{
      if(e.type!=='source.error')throw Error('expected source error');
      return {state:close(s,'error'),actions:[
        fail(e.error),release(src(s.generation)),
        ...(s.notifier==='open'?[release(notifier)]:[])
      ]};
    });
  const metadata:ModelMetadata={
    schemaVersion:'1.1',rxjsVersion:'7.8.2',
    id:'repeatWhen-persistent-notifier-post-setup',operator:'repeatWhen',
    purpose:'Repeat on source completion, controlled by a single persistent notifier and completion Subject.',
    cardinality:{
      signature:'repeatWhen(completions$ -> notifier$) : Cω(Signal) -> T* -> T*',
      conditions:[
        'Each source next forwards once; a source completion emits one void notification on the completion Subject.',
        'Notifier next while waiting starts one new source; notifier completion ends repetition after any active source completes.',
        'Source or notifier error terminates immediately. Cancellation silently releases both subscriptions.'
      ]
    },
    scope:{
      parameters:'One notifier function returning a non-synchronously-emitting Observable; selector called exactly once after first source completion.',
      callbacks:'Notifier selector is represented by its successful Observable result; callback throws/invalid inputs are excluded.',
      time:'Source notifications and notifier next/complete/error carry their own times; no new clock is introduced.',
      reentrancy:'Atomic post-subscription notifications; notifier next is only admitted while waiting after a source completion.',
      exclusions:[
        'Synchronous notifier next or complete during its original subscription, source subscription setup recursion and syncResub flag mechanics.',
        'Notifier next while a source is already active (can start overlapping source executions), Promise inputs and arbitrary reentrancy.',
        'Notifier selector throws, teardown throws and notifier emissions following terminal notification.'
      ]
    },
    initialization:{
      control:'Unsubscribed',event:'subscribe',
      sourceSubscription:'One initial source; lazily create completion Subject and one notifier subscription at first successful completion.'
    },
    ownership:{
      state:'subscription-local',sharing:'The completion Subject is internal to one result subscription; it is not multicast among downstream subscribers.',
      reset:'New downstream subscription creates a new notifier selector/Subject when first needed.',
      resources:[
        {id:'source',kind:'subscription',owner:'current source generation'},
        {id:'notifier',kind:'subscription',owner:'persistent notifier created on first source completion'}
      ]
    },
    dispatch:{
      policy:'atomic-non-reentrant',
      actionSemantics:'Completion signals go to internal Subject, not the downstream. Notifier next triggers a new source subscription; no value is invented.',
      cancellationCheckpoints:['After each notification, before new source acquisition and while awaiting notifier next.']
    },
    inputs:[
      inp('subscribe','downstream','start source'),
      inp('source.next','source','source value'),
      inp('source.complete','source','completed source generation'),
      inp('source.error','source','source failure'),
      inp('notifier.next','inner','notifier trigger'),
      inp('notifier.complete','inner','notifier terminal completion'),
      inp('notifier.error','inner','notifier failure'),
      inp('cancel','downstream','consumer cancelled')
    ],
    actionTypes:['subscribe','unsubscribe','notify'],
    controls:[
      {id:'Unsubscribed',description:'no source connected',terminal:false},
      {id:'Active',description:'source running, notifier may be absent/open/completed',terminal:false},
      {id:'Waiting',description:'source completed; persistent notifier awaiting next or terminal',terminal:false},
      {id:'Closed',description:'complete, failure or silent cancellation',terminal:true}
    ],
    sources:[
      reference('src/internal/operators/repeatWhen.ts'),
      reference('src/internal/Subject.ts'),
      reference('src/internal/operators/OperatorSubscriber.ts')
    ],
    evidence:{modelTests:['tests/session17-model.test.mjs'],runtimeTests:['tests/session17-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-17.md'}
  };
  return {
    metadata,parameters:p,rules,
    initialState:()=>({phase:'Unsubscribed',generation:0,notifier:'absent',reason:'none'}),
    control:s=>s.phase,
    validateState:s=>{
      const errors:string[]=[];
      if(!natural(s.generation))errors.push('invalid source generation');
      if(s.phase==='Unsubscribed'&&(s.generation!==0||s.notifier!=='absent'||s.reason!=='none'))
        errors.push('unconnected must not own notifier');
      if(s.phase==='Waiting'&&s.notifier!=='open')errors.push('waiting must retain open notifier');
      if((s.phase==='Active'||s.phase==='Waiting')&&s.reason!=='none')
        errors.push('live cannot have terminal reason');
      if(s.phase==='Closed'&&!['complete','error','cancel'].includes(s.reason))errors.push('closed without terminal cause');
      return errors;
    },
    validateReaction:(_s,e,r)=>[
      ...validateActionWord(r.actions),
      ...(e.type==='source.next'&&
        !(r.actions.length===1&&r.actions[0]?.type==='notify'&&
          r.actions[0].target==='downstream'&&r.actions[0].notification.kind==='N'&&
          Object.is(r.actions[0].notification.value,e.value))
        ?['forward source value unchanged']:[]),
      ...(e.type==='cancel'&&r.actions.some(a=>a.type==='notify')
        ?['cancellation must be silent']:[])
    ]
  };
}
export const repeatWhenExample:readonly TimedEvent<RepeatWhenEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',resource:src(0),value:'initial'}},
  {time:2,event:{type:'source.complete',resource:src(0)}},
  {time:5,event:{type:'notifier.next'}},
  {time:6,event:{type:'source.next',resource:src(1),value:'repeated'}},
  {time:7,event:{type:'source.complete',resource:src(1)}},
  {time:8,event:{type:'notifier.complete'}}
];
