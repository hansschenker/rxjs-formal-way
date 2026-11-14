import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision, natural } from './session10-common.js';

/** Source-generation restart algebra for bounded repeat and retry.
 * Callbacks, timers, synchronous resubscription recursion and infinite bounds
 * are intentionally out of scope; all source notifications arrive post-setup.
 */
export type RestartOperator = 'repeat' | 'retry';
export type RestartParameters = Readonly<{
  operator: RestartOperator;
  count: number;
  resetOnSuccess: boolean;
  delays: 'none';
}>;
export type RestartState =
  | Readonly<{ phase:'Unsubscribed'; generation:0; attempts:0; failures:0; reason:'none' }>
  | Readonly<{ phase:'Active'; generation:number; attempts:number; failures:number; reason:'none' }>
  | Readonly<{ phase:'Closed'; generation:number; attempts:number; failures:number; reason:'complete'|'error'|'cancel'|'empty' }>;
export type RestartEvent<T> =
  | Readonly<{type:'subscribe'|'cancel'}>
  | Readonly<{type:'source.next';resource:ResourceRef;value:T}>
  | Readonly<{type:'source.complete';resource:ResourceRef}>
  | Readonly<{type:'source.error';resource:ResourceRef;error:unknown}>;
export type RestartModel<T> = OperatorModel<RestartParameters,RestartState,RestartEvent<T>,Action<unknown>>;
const ref=(gen:number):ResourceRef=>({id:'source',generation:gen});
const sub=(gen:number):Action<unknown>=>({type:'subscribe',resource:ref(gen)});
const unsub=(gen:number):Action<unknown>=>({type:'unsubscribe',resource:ref(gen)});
const note=(value:unknown):Action<unknown>=>({type:'notify',target:'downstream',notification:{kind:'N',value}});
const done:Action<unknown>={type:'notify',target:'downstream',notification:{kind:'C'}};
const fail=(error:unknown):Action<unknown>=>({type:'notify',target:'downstream',notification:{kind:'E',error}});
const reference=(path:string)=>({
  url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,
  revision:pinnedRevision,purpose:'Pinned RxJS 7.8.2 restart, completion/error and resource lifecycle'
});
const input=(type:string,origin:'downstream'|'source',description:string)=>({
  type,origin,category:(origin==='downstream'?'lifecycle':'notification') as 'lifecycle'|'notification',description
});

export function createRestartModel<T>(
  operator:RestartOperator,count=2,resetOnSuccess=false
):RestartModel<T>{
  if(!natural(count)||count>8)throw RangeError('accepted finite restart bound 0..8');
  if(operator==='repeat'&&resetOnSuccess)throw Error('resetOnSuccess applies to retry only');
  const p:RestartParameters={operator,count,resetOnSuccess,delays:'none'};
  type S=RestartState;type E=RestartEvent<T>;type A=Action<unknown>;
  type R=Rule<RestartParameters,S,E,A>;
  const matching=(s:S,e:E):boolean=>s.phase==='Active'&&'resource'in e&&
    e.resource.id==='source'&&e.resource.generation===s.generation;
  const close=(s:S,reason:'complete'|'error'|'cancel'|'empty'):S=>({...s,phase:'Closed',reason});
  const d=(suffix:string,from:S['phase'],event:E['type'],to:S['phase'],
    guard:string,actions:readonly string[],explanation:string,nextState:string)=>({
      id:'S17-'+operator.toUpperCase()+'-'+suffix,
      from,event,to,guard,actions,explanation,nextState,
      obligations:['S17-'+operator.toUpperCase()+'-'+suffix]
    });
  const rules:R[]=[];
  const add=(suffix:string,from:S['phase'],event:E['type'],to:S['phase'],
    guard:string,actions:readonly string[],explanation:string,nextState:string,
    enabled:(s:S,e:E)=>boolean,react:(s:S,e:E)=>{state:S;actions:readonly A[]}):void=>{
    rules.push({description:d(suffix,from,event,to,guard,actions,explanation,nextState),
      enabled,react});
  };
  if(operator==='repeat'&&count===0){
    add('EMPTY','Unsubscribed','subscribe','Closed','count=0',
      ['complete immediately without subscribing to source'],
      'repeat(0) is EMPTY and never acquires the producer.',
      'Closed empty with zero attempts.',()=>true,
      s=>({state:close(s,'empty'),actions:[done]}));
  }else{
    add('START','Unsubscribed','subscribe','Active','first downstream subscription',
      ['subscribe source generation 0'],
      'The output subscribes to the producer lazily; a fresh source execution begins.',
      'Active with attempt=1 and failure counter=0.',()=>true,
      _s=>({state:{phase:'Active',generation:0,attempts:1,failures:0,reason:'none'},actions:[sub(0)]}));
  }
  add('NEXT','Active','source.next','Active','matching live source generation',
    ['forward value unchanged'+(resetOnSuccess?' and reset the retry failure count':'')],
    resetOnSuccess?
      'A successful value resets the consecutive error-retry counter to zero; values are not rolled back across attempts.':
      'Every source value is delivered even when later source completion/error causes another subscription.',
    'Remain Active with the current generation and updated failure counter.',
    matching,(s,e)=>{
      if(s.phase!=='Active'||e.type!=='source.next')throw Error('expected next');
      return {state:{...s,failures:resetOnSuccess?0:s.failures},actions:[note(e.value)]};
    });
  if(operator==='repeat'){
    add('RESTART','Active','source.complete','Active','matching source and attempts<count',
      ['release completed source','subscribe a new source generation'],
      'A successful completion triggers a new source subscription until the total subscription count is reached.',
      'New generation active with attempts incremented; old source disposed.',
      (s,e)=>matching(s,e)&&s.phase==='Active'&&s.attempts<count,
      s=>{
        if(s.phase!=='Active')throw Error('expected active');
        return {state:{...s,generation:s.generation+1,attempts:s.attempts+1},
          actions:[unsub(s.generation),sub(s.generation+1)]};
      });
    add('FINAL-COMPLETE','Active','source.complete','Closed','matching source and attempts=count',
      ['complete result','release final source'],
      'The count is total subscriptions, not additional resubscriptions.',
      'Closed complete after the specified number of source executions.',
      (s,e)=>matching(s,e)&&s.phase==='Active'&&s.attempts===count,
      s=>({state:close(s,'complete'),actions:[done,unsub(s.generation)]}));
    add('ERROR','Active','source.error','Closed','any matching source error',
      ['forward exact error and release source'],
      'Repeat never retries failures. Error ends the entire result at once.',
      'Closed in error.',
      matching,(s,e)=>{
        if(e.type!=='source.error')throw Error('expected error');
        return {state:close(s,'error'),actions:[fail(e.error),unsub(s.generation)]};
      });
  }else{
    add('COMPLETE','Active','source.complete','Closed','successful source completion',
      ['complete downstream and release source'],
      'Retry responds to errors, not successful completion.',
      'Closed complete.',matching,
      s=>({state:close(s,'complete'),actions:[done,unsub(s.generation)]}));
    add('RETRY','Active','source.error','Active','matching source and failureCount<count',
      ['release failed source','subscribe next source execution'],
      'A source failure is suppressed while the configured retry budget remains; the old subscription is disposed before the next.',
      'New generation active; failure counter and attempt incremented.',
      (s,e)=>matching(s,e)&&s.phase==='Active'&&s.failures<count,
      s=>{
        if(s.phase!=='Active')throw Error('expected active');
        return {state:{...s,generation:s.generation+1,attempts:s.attempts+1,failures:s.failures+1},
          actions:[unsub(s.generation),sub(s.generation+1)]};
      });
    add('RETRY-EXHAUSTED','Active','source.error','Closed','matching error and retry budget exhausted',
      ['emit original error unchanged','dispose final source'],
      'Count is the maximum number of retry attempts after the first subscription. The final error is not converted to complete.',
      'Closed in error.',
      (s,e)=>matching(s,e)&&s.phase==='Active'&&s.failures>=count,
      (s,e)=>{
        if(e.type!=='source.error')throw Error('expected error');
        return {state:close(s,'error'),actions:[fail(e.error),unsub(s.generation)]};
      });
  }
  add('CANCEL','Active','cancel','Closed','downstream cancels active subscription',
    ['release current source without an output notification'],
    'Cancellation ends the current attempt and prevents later restarts; no result completion is synthesized.',
    'Closed cancel.',s=>s.phase==='Active',
    s=>({state:close(s,'cancel'),actions:[unsub(s.generation)]}));

  const metadata:ModelMetadata={
    schemaVersion:'1.1',rxjsVersion:'7.8.2',id:operator+'-bounded-restart-'+count+(resetOnSuccess?'-reset':''),
    operator,purpose:operator==='repeat'?
      'Repeat source after successful completion up to a total source-subscription count.':
      'Retry failed source subscriptions up to a bounded additional-attempt budget.',
    cardinality:{
      signature:operator==='repeat'?'repeat(count) : Cω(count) -> T* -> T*':'retry(count,resetOnSuccess) : Cω(count,reset) -> T* -> T*',
      conditions:operator==='repeat'?[
        'count=0 produces no source subscription and only successful empty completion.',
        'Each source success except the final causes a fresh source subscription.',
        'An error terminates the result; values across all completed attempts remain delivered.'
      ]:[
        'A source error is retried at most count times in addition to the first attempt.',
        'All next values across failed and successful attempts are retained in delivery order.',
        'resetOnSuccess clears the retry counter after a next value, not the total attempt count.'
      ]
    },
    scope:{
      parameters:'Finite safe-integer bound in 0..8. '+(operator==='retry'?
        'Both resetOnSuccess=false/true are modeled.':'Total subscriptions including the initial one.'),
      callbacks:'No notifier callback or delay selector in this profile.',
      time:'Resubscription is immediate following source terminal delivery. Time of later notifications belongs to each new producer.',
      reentrancy:'Nonreentrant, post-setup notifications; only bounded finite runs.',
      exclusions:[
        'Unbounded (Infinity), fractional/negative counts, numeric or notifier-function delays and scheduler-driven resubscription.',
        'Synchronous terminal notifications during subscription setup, reentrant observers and teardown exceptions.'
      ]
    },
    initialization:{
      control:'Unsubscribed',event:'subscribe',
      sourceSubscription:operator==='repeat'&&count===0?
        'No subscription; immediate complete.':
        'Acquire one source generation 0 at first downstream subscription.'
    },
    ownership:{
      state:'subscription-local',sharing:'None: each result subscription independently executes and restarts source.',
      reset:'New result subscription resets generation, attempts and error counter.',
      resources:[{id:'source',kind:'subscription',owner:'current attempt; generation increments on restart'}]
    },
    dispatch:{
      policy:'atomic-non-reentrant',
      actionSemantics:'Terminal source event may dispose the current generation then subscribe the next; actions are ordered within a transition.',
      cancellationCheckpoints:['Between source notifications and after every restarted source acquisition.']
    },
    inputs:[
      input('subscribe','downstream','connect a result'),
      input('source.next','source','value from current source generation'),
      input('source.complete','source','successful source completion'),
      input('source.error','source','source failed'),
      input('cancel','downstream','downstream cancellation')
    ],
    actionTypes:['subscribe','unsubscribe','notify'],
    controls:[
      {id:'Unsubscribed',description:'no producer connection',terminal:false},
      {id:'Active',description:'one active source generation with restart counters',terminal:false},
      {id:'Closed',description:'complete, error or cancel',terminal:true}
    ],
    sources:[
      reference('src/internal/operators/'+operator+'.ts'),
      reference('src/internal/operators/OperatorSubscriber.ts'),
      reference('src/internal/Subscription.ts')
    ],
    evidence:{modelTests:['tests/session17-model.test.mjs'],
      runtimeTests:['tests/session17-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-17.md'}
  };
  return {
    metadata,parameters:p,rules,
    initialState:()=>({phase:'Unsubscribed',generation:0,attempts:0,failures:0,reason:'none'}),
    control:s=>s.phase,
    validateState:s=>{
      const failures:string[]=[];
      if(!natural(s.generation)||!natural(s.attempts)||!natural(s.failures))
        failures.push('restart counters must be nonnegative safe integers');
      if(s.phase==='Unsubscribed'&&(s.attempts!==0||s.generation!==0||s.failures!==0||s.reason!=='none'))
        failures.push('unconnected restart state malformed');
      if(s.phase==='Active'&&(s.attempts!==s.generation+1||s.attempts<1||s.reason!=='none'))
        failures.push('active attempt generation mismatch');
      if(operator==='repeat'&&s.phase==='Active'&&s.attempts>count)
        failures.push('repeat subscription count exceeded');
      if(operator==='retry'&&s.failures>count)
        failures.push('retry failure budget exceeded');
      if(s.phase==='Closed'&&!['complete','error','cancel','empty'].includes(s.reason))failures.push('closed lacks reason');
      return failures;
    },
    validateReaction:(_before,e,r)=>[
      ...validateActionWord(r.actions),
      ...(e.type==='source.next'&&
        !(r.actions.length===1&&r.actions[0]?.type==='notify'&&
          r.actions[0].notification.kind==='N'&&
          Object.is(r.actions[0].notification.value,e.value))
        ?['source.next must forward exact identity once']:[]),
      ...(e.type==='cancel'&&r.actions.some(a=>a.type==='notify')
        ?['cancellation must not notify downstream']:[]),
    ],
  };
}
export const createRepeatModel=<T>(count=2):RestartModel<T>=>createRestartModel<T>('repeat',count,false);
export const createRetryModel=<T>(count=2,resetOnSuccess=false):RestartModel<T>=>
  createRestartModel<T>('retry',count,resetOnSuccess);

export const repeatExample:readonly TimedEvent<RestartEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',resource:ref(0),value:'cycle-1'}},
  {time:2,event:{type:'source.complete',resource:ref(0)}},
  {time:3,event:{type:'source.next',resource:ref(1),value:'cycle-2'}},
  {time:4,event:{type:'source.complete',resource:ref(1)}}
];
export const retryExample:readonly TimedEvent<RestartEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',resource:ref(0),value:'partial'}},
  {time:2,event:{type:'source.error',resource:ref(0),error:'fail-one'}},
  {time:3,event:{type:'source.next',resource:ref(1),value:'success'}},
  {time:4,event:{type:'source.complete',resource:ref(1)}}
];
