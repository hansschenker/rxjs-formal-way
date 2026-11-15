import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { natural, pinnedRevision } from './session10-common.js';

/** retryWhen: one lazily constructed persistent errors Subject and notifier.
 * An error is published to errorsSubject rather than downstream; the notifier
 * decides whether to retry (next), finish (complete) or fail (error).
 * Only post-setup and waiting-time notifier signals are admitted.
 */
export type RetryWhenParameters = Readonly<{
  notifier:'one-persistent-Observable';errorSignals:'exact-original-error'
}>;
export type RetryWhenState =
  | Readonly<{phase:'Unsubscribed';generation:0;notifier:'absent';reason:'none'}>
  | Readonly<{phase:'Active';generation:number;notifier:'absent'|'open';reason:'none'}>
  | Readonly<{phase:'Waiting';generation:number;notifier:'open';reason:'none'}>
  | Readonly<{phase:'Closed';generation:number;notifier:'absent'|'open';
      reason:'complete'|'error'|'cancel'}>;
export type RetryWhenEvent<T> =
  | Readonly<{type:'subscribe'|'cancel'|'notifier.next'|'notifier.complete'}>
  | Readonly<{type:'notifier.error';error:unknown}>
  | Readonly<{type:'source.next';resource:ResourceRef;value:T}>
  | Readonly<{type:'source.complete';resource:ResourceRef}>
  | Readonly<{type:'source.error';resource:ResourceRef;error:unknown}>;
export type RetryWhenModel<T> =
  OperatorModel<RetryWhenParameters,RetryWhenState,RetryWhenEvent<T>,Action<unknown>>;
const source=(gen:number):ResourceRef=>({id:'source',generation:gen});
const notifier:ResourceRef={id:'notifier',generation:0};
const acquire=(resource:ResourceRef):Action<unknown>=>({type:'subscribe',resource});
const release=(resource:ResourceRef):Action<unknown>=>({type:'unsubscribe',resource});
const note=(value:unknown):Action<unknown>=>({
  type:'notify',target:'downstream',notification:{kind:'N',value}});
const signal=(reason:unknown):Action<unknown>=>({
  type:'notify',target:'errorsSubject',notification:{kind:'N',value:reason}});
const complete:Action<unknown>={type:'notify',target:'downstream',notification:{kind:'C'}};
const fail=(reason:unknown):Action<unknown>=>({
  type:'notify',target:'downstream',notification:{kind:'E',error:reason}});
const reference=(path:string)=>({
  url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,
  revision:pinnedRevision,purpose:'Pinned retryWhen error Subject, notifier and syncResub semantics'
});
const input=(type:string,origin:'source'|'inner'|'downstream',
  category:'notification'|'lifecycle',description:string)=>({type,origin,category,description});

export function createRetryWhenModel<T>():RetryWhenModel<T>{
  const p:RetryWhenParameters={notifier:'one-persistent-Observable',errorSignals:'exact-original-error'};
  type S=RetryWhenState;type E=RetryWhenEvent<T>;type A=Action<unknown>;
  type R=Rule<RetryWhenParameters,S,E,A>;
  const sourceActive=(s:S,e:E):boolean=>s.phase==='Active'&&'resource'in e&&
    e.resource.id==='source'&&e.resource.generation===s.generation;
  const close=(s:S,reason:'complete'|'error'|'cancel'):S=>({...s,phase:'Closed',reason});
  const rules:R[]=[];
  const add=(suffix:string,from:S['phase'],event:E['type'],to:S['phase'],
    guard:string,actions:readonly string[],explanation:string,nextState:string,
    enabled:(s:S,e:E)=>boolean,react:(s:S,e:E)=>{state:S;actions:readonly A[]}):void=>{
    rules.push({description:{
      id:'S18-RETRYWHEN-'+suffix,from,event,to,guard,actions,explanation,nextState,
      obligations:['S18-RETRYWHEN-'+suffix]
    },enabled,react});
  };
  add('START','Unsubscribed','subscribe','Active',
    'first result subscription',
    ['subscribe source generation 0'],
    'The notifier selector and errors Subject are created lazily on the first source error.',
    'Active with no notifier.',()=>true,
    ()=>({state:{phase:'Active',generation:0,notifier:'absent',reason:'none'},
      actions:[acquire(source(0))]}));
  add('FORWARD','Active','source.next','Active',
    'current source generation sends a value',
    ['forward original payload exactly once'],
    'Successful source values pass immediately, even if that source errors later and is retried.',
    'Same current source and notifier state.',sourceActive,
    (s,e)=>{if(e.type!=='source.next')throw Error('expected next');
      return {state:s,actions:[note(e.value)]};});
  add('FIRST-ERROR','Active','source.error','Waiting',
    'matching source error and notifier absent',
    ['release errored source','subscribe to persistent notifier','send original error to errors Subject'],
    'On the first source failure, allocate one Subject, call the notifier selector once, and publish the error to it.',
    'Waiting for notifier next, complete or error.',
    (s,e)=>sourceActive(s,e)&&s.phase==='Active'&&s.notifier==='absent',
    (s,e)=>{if(s.phase!=='Active'||e.type!=='source.error')throw Error('expected first error');
      return {state:{phase:'Waiting',generation:s.generation,notifier:'open',reason:'none'},
        actions:[release(source(s.generation)),acquire(notifier),signal(e.error)]};});
  add('LATER-ERROR','Active','source.error','Waiting',
    'matching source error and notifier already open',
    ['release errored source','notify original error on existing Subject'],
    'Subsequent retries reuse the same notifier subscription and Subject, without invoking the selector again.',
    'Waiting for the next notifier decision.',
    (s,e)=>sourceActive(s,e)&&s.phase==='Active'&&s.notifier==='open',
    (s,e)=>{if(s.phase!=='Active'||e.type!=='source.error')throw Error('expected later error');
      return {state:{phase:'Waiting',generation:s.generation,notifier:'open',reason:'none'},
        actions:[release(source(s.generation)),signal(e.error)]};});
  add('RETRY','Waiting','notifier.next','Active',
    'one notifier next while source is stopped',
    ['subscribe fresh source generation'],
    'The notifier next is a control signal, not an output value; it triggers a new source execution.',
    'Active with next source generation; notifier remains open.',
    s=>s.phase==='Waiting',
    s=>{if(s.phase!=='Waiting')throw Error('expected waiting');
      return {state:{phase:'Active',generation:s.generation+1,notifier:'open',reason:'none'},
        actions:[acquire(source(s.generation+1))]};});
  for(const phase of ['Active','Waiting'] as const){
    add('NOTIFIER-COMPLETE-'+phase.toUpperCase(),phase,'notifier.complete','Closed',
      'open notifier completes',
      ['complete downstream','release all live resources'],
      'Unlike repeatWhen, a retryWhen notifier completion terminates the result immediately, even during an active retried source.',
      'Closed successfully.',
      s=>s.phase===phase&&s.notifier==='open',
      s=>({state:close(s,'complete'),actions:[
        complete,...(phase==='Active'?[release(source(s.generation))]:[]),release(notifier)]}));
    add('NOTIFIER-ERROR-'+phase.toUpperCase(),phase,'notifier.error','Closed',
      'open notifier errors',
      ['forward exact notifier error','release active source and notifier'],
      'Notifier errors terminate instead of retrying. No original source error is substituted.',
      'Closed on notifier error.',
      s=>s.phase===phase&&s.notifier==='open',
      (s,e)=>{if(e.type!=='notifier.error')throw Error('expected notifier error');
        return {state:close(s,'error'),actions:[
          fail(e.error),...(phase==='Active'?[release(source(s.generation))]:[]),release(notifier)]};});
    add('CANCEL-'+phase.toUpperCase(),phase,'cancel','Closed',
      'consumer cancels',
      ['release source if live','release notifier if already allocated','no output notification'],
      'Cancellation is silent and prevents all subsequent resubscriptions.',
      'Closed cancel.',
      s=>s.phase===phase,
      s=>({state:close(s,'cancel'),actions:[
        ...(phase==='Active'?[release(source(s.generation))]:[]),
        ...(s.notifier==='open'?[release(notifier)]:[])]}));
  }
  add('SOURCE-COMPLETE','Active','source.complete','Closed',
    'matching source generation completes',
    ['complete downstream','release source and notifier if present'],
    'A successful source completion terminates retryWhen immediately, without waiting for the notifier.',
    'Closed complete.',
    sourceActive,
    s=>({state:close(s,'complete'),actions:[
      complete,release(source(s.generation)),...(s.notifier==='open'?[release(notifier)]:[])]}));

  const metadata:ModelMetadata={
    schemaVersion:'1.1',rxjsVersion:'7.8.2',id:'retryWhen-persistent-errors-notifier',
    operator:'retryWhen',
    purpose:'Use source errors as control signals for one persistent notifier that governs fresh source subscriptions.',
    cardinality:{
      signature:'retryWhen(errors$ → notifier$) : Cω(Signal) → T* → T*',
      conditions:[
        'Each successful source next is forwarded; source errors are sent to errorsSubject and not downstream.',
        'A notifier next while waiting subscribes another source generation; repeated errors reuse the same notifier.',
        'A source completion or notifier completion ends successfully. Notifier error ends with that exact error.'
      ]},
    scope:{
      parameters:'One persistent notifier Observable constructed once at the first source error; no delay selector.',
      callbacks:'Notifier selector is modeled by a successful externally supplied Observable; selector throws and invalid inputs excluded.',
      time:'Retry only when notifier next arrives; no clock belongs to this operator.',
      reentrancy:'Post-setup source notifications; notifier next admitted only while waiting after a source error.',
      exclusions:[
        'Synchronous notifier next during original subscription or errorsSubject.next and the special syncResub recursion.',
        'Notifier next while a retried source is still active, which can cause overlapping subscriptions.',
        'Promises/async iterable notifier conversions, callback throws, teardown throws and reentrant observers.'
      ]},
    initialization:{control:'Unsubscribed',event:'subscribe',
      sourceSubscription:'Subscribe source generation 0; create errors Subject and notifier only after first source error.'},
    ownership:{state:'subscription-local',sharing:'Internal errors Subject is shared with exactly one notifier subscription per result execution.',
      reset:'New downstream subscription owns a new source generation counter and lazily created notifier.',
      resources:[{id:'source',kind:'subscription',owner:'current source generation'},
        {id:'notifier',kind:'subscription',owner:'persistent errors Subject notifier'}]},
    dispatch:{policy:'atomic-non-reentrant',
      actionSemantics:'Publish original errors to an internal Subject. Notifier next controls source resubscription; no error value becomes a downstream next.',
      cancellationCheckpoints:['After source failure and while waiting for notifier decision; before every new source acquisition.']},
    inputs:[
      input('subscribe','downstream','lifecycle','start source'),
      input('source.next','source','notification','source value'),
      input('source.complete','source','notification','successful source completion'),
      input('source.error','source','notification','source error to publish internally'),
      input('notifier.next','inner','notification','start a new attempt'),
      input('notifier.complete','inner','notification','complete result'),
      input('notifier.error','inner','notification','fail result'),
      input('cancel','downstream','lifecycle','cancel source and notifier')
    ],
    actionTypes:['subscribe','unsubscribe','notify'],
    controls:[
      {id:'Unsubscribed',description:'cold source description',terminal:false},
      {id:'Active',description:'one current source, optionally with notifier',terminal:false},
      {id:'Waiting',description:'source absent and notifier awaiting retry decision',terminal:false},
      {id:'Closed',description:'complete, error or cancellation',terminal:true}
    ],
    sources:[
      reference('src/internal/operators/retryWhen.ts'),
      reference('src/internal/Subject.ts'),
      reference('src/internal/operators/OperatorSubscriber.ts'),
      reference('src/internal/Subscription.ts')
    ],
    evidence:{modelTests:['tests/session18-model.test.mjs'],runtimeTests:['tests/session18-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-18.md'}
  };
  return {metadata,parameters:p,rules,
    initialState:()=>({phase:'Unsubscribed',generation:0,notifier:'absent',reason:'none'}),
    control:s=>s.phase,
    validateState:s=>{
      const errors:string[]=[];
      if(!natural(s.generation))errors.push('invalid source generation');
      if(s.phase==='Unsubscribed'&&(s.generation!==0||s.notifier!=='absent'||s.reason!=='none'))
        errors.push('unsubscribed must own no resources');
      if(s.phase==='Waiting'&&s.notifier!=='open')errors.push('waiting must have open notifier');
      if((s.phase==='Active'||s.phase==='Waiting')&&s.reason!=='none')
        errors.push('live state must have no terminal reason');
      return errors;
    },
    validateReaction:(_s,e,r)=>[
      ...validateActionWord(r.actions),
      ...(e.type==='source.next'&&!(r.actions.length===1&&r.actions[0]?.type==='notify'&&
        r.actions[0].target==='downstream'&&r.actions[0].notification.kind==='N'&&
        Object.is(r.actions[0].notification.value,e.value))?
        ['source next must be forwarded exactly once without conversion']:[]),
      ...(e.type==='source.error'&&r.actions.some(a=>a.type==='notify'&&a.target==='downstream')?
        ['source errors must signal the notifier, not downstream']:[]),
      ...(e.type==='cancel'&&r.actions.some(a=>a.type==='notify')?
        ['cancel must emit no notifications']:[])
    ]};
}
const src=(generation:number):ResourceRef=>({id:'source',generation});
export const retryWhenExample:readonly TimedEvent<RetryWhenEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',resource:src(0),value:'first'}},
  {time:2,event:{type:'source.error',resource:src(0),error:'transient'}},
  {time:5,event:{type:'notifier.next'}},
  {time:6,event:{type:'source.next',resource:src(1),value:'recovered'}},
  {time:7,event:{type:'source.complete',resource:src(1)}}
];
