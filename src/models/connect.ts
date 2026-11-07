import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { actionErrors, complete, describe, error, metadata, next, resource, source, subscribe, unsubscribe } from './session10-common.js';

/**
 * Scope: default Subject connector; selector is merge(shared$, shared$).
 * This is an explicit 2-branch witness for connect's subscription order,
 * not a claim that an arbitrary selector has two outputs.
 */
export type ConnectParameters = Readonly<{ connector: 'Subject'; selector: 'merge-two-shared-branches' }>;
export type ConnectState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Preparing' }>
  | Readonly<{ phase: 'Active' }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'selector-error' | 'cancel' }>;
export type ConnectEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'selector.return'; resource: ResourceRef }>
  | Readonly<{ type: 'selector.throw' | 'source.error'; error: unknown; resource?: ResourceRef }>
  | Readonly<{ type: 'source.next'; value: T }>;
export type ConnectModel<T> = OperatorModel<ConnectParameters, ConnectState, ConnectEvent<T>, Action<unknown>>;
const selector: ResourceRef = resource('selector',0);
const selected: ResourceRef = resource('selected',0);
const cleanup = [unsubscribe(selected),unsubscribe(source)];
export function createConnectModel<T>(): ConnectModel<T> {
  type S=ConnectState; type E=ConnectEvent<T>;type A=Action<unknown>;
  type Rt=Rule<ConnectParameters,S,E,A>;
  const d=(id:string,from:S['phase'],event:E['type'],to:S['phase'],guard:string,
    acts:string[],explanation:string)=>describe('connect',id,from,event,to,guard,acts,explanation);
  const closed=(reason:Extract<S,{phase:'Closed'}>['reason']):S=>({phase:'Closed',reason});
  const rules:Rt[]=[
    {description:d('INIT','Unsubscribed','subscribe','Preparing','fresh subscriber',
      ['create local Subject','request configured selector before source connection'],
      'A fresh Subject is allocated per subscription, followed by synchronous selector invocation.'),
      enabled:()=>true,react:()=>({state:{phase:'Preparing'},actions:[
        {type:'invoke-callback',resource:selector,index:0,value:undefined}]})},
    {description:d('SELECTOR-READY','Preparing','selector.return','Active','matching selected Observable',
      ['subscribe the selected output and its two shared branches','only then subscribe original source'],
      'Both selected branches listen to the multicast Subject before a synchronous source can emit.'),
      enabled:(_s,e)=>e.type==='selector.return'&&e.resource.id==='selector'&&e.resource.generation===0,
      react:()=>({state:{phase:'Active'},actions:[subscribe(selected),subscribe(source)]})},
    {description:d('SELECTOR-THROW','Preparing','selector.throw','Closed','selector threw before source subscription',
      ['error without subscribing source'], 'No source is connected when selector construction fails.'),
      enabled:(_s,e)=>e.type==='selector.throw'&&e.resource?.id==='selector'&&e.resource.generation===0,
      react:(_s,e)=>{
        if(e.type!=='selector.throw')throw Error('not selector throw');
        return {state:closed('selector-error'),actions:[error(e.error)]};
      }},
    {description:d('BROADCAST','Active','source.next','Active','source subscribed through Subject',
      ['broadcast opaque value to branch 1','broadcast same value to branch 2'],
      'Both branches receive the same object without cloning; selector merge emits two output notifications.'),
      enabled:()=>true,react:(_s,e)=>{
        if(e.type!=='source.next')throw Error('bad source value');
        return {state:{phase:'Active'},actions:[next(e.value),next(e.value)]};
      }},
    {description:d('COMPLETE','Active','source.complete','Closed','source completes',
      ['Subject completes selected branches','complete result','tear down selected then source'],
      'Completion propagates through the configured selected stream, not as a second output completion.'),
      enabled:()=>true,react:()=>({state:closed('complete'),actions:[complete,...cleanup]})},
    {description:d('ERROR','Active','source.error','Closed','source errors',
      ['Subject errors selected branches','forward original error','release both subscriptions'],
      'The original error identity is preserved; no values are emitted after termination.'),
      enabled:()=>true,react:(_s,e)=>{
        if(e.type!=='source.error')throw Error('not a source error');
        return {state:closed('source-error'),actions:[error(e.error),...cleanup]};
      }},
    {description:d('CANCEL','Active','cancel','Closed','downstream cancels',
      ['tear down selected and source, no terminal notification'],
      'Explicit cancellation stops the one source and both selected consumers silently.'),
      enabled:()=>true,react:()=>({state:closed('cancel'),actions:[...cleanup]})},
  ];
  return {
    parameters:{connector:'Subject',selector:'merge-two-shared-branches'},rules,
    metadata:metadata({
      id:'connect-default-Subject-merge-two',operator:'connect',
      purpose:'Establish two downstream branches before connecting one shared, possibly synchronous source.',
      cardinality:{signature:'connect(merge(shared,shared)) : T* -> (T + T)*',
        conditions:['Each source next is delivered twice in selected branch order after one source subscription.',
          'The selected result is subscribed before the original source starts.',
          'Every result subscription owns a new connector Subject; connect does not automatically share separate outer subscriptions.']},
      scope:{parameters:'Default Subject connector; selector specifically merge(shared$, shared$). No custom SubjectLike or arbitrary selected graph.',
        callbacks:'Selector construction modeled as a synchronous correlated callback; no source side effect before selected subscription.',
        time:'No scheduler or timer. Source dictates the timing; one source next causes two same-moment selected outputs.',
        reentrancy:'Synchronous source notifications after completed selector setup are supported; arbitrary selector reentry and synchronous selected-result termination are excluded.',
        exclusions:['Custom connector, selector returning Promise/iterable, arbitrary selector topology or early selected-result termination.',
          'Observer exceptions/reentrancy, finalizer throws and cancellation during synchronous observer notification.']},
      initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'Create Subject, call selector, subscribe selected output, then connect original source.'},
      ownership:{state:'subscription-local',sharing:'Subject multicasts inside one result subscription; two selected branches observe one source. Separate outer subscriptions do not share.',
        reset:'New Subject and selected subscriptions for each fresh output subscription.',
        resources:[{id:'selector',kind:'callback',owner:'result subscription'},
          {id:'selected',kind:'subscription',owner:'result and two Subject subscribers'},
          {id:'source',kind:'subscription',owner:'one shared source connection per selected result'}]},
      dispatch:{policy:'atomic-non-reentrant',
        actionSemantics:'Subscribe selected Observable before subscribing producer; each producer next broadcasts same payload into both registered branches.',
        cancellationCheckpoints:['After selector setup; between source notifications.', 'Release selected subscriptions and original source on termination.']},
      inputs:[
        {type:'subscribe',origin:'downstream',category:'lifecycle',description:'new connect result subscription'},
        {type:'selector.return',origin:'callback',category:'callback',description:'configured selector returns Observable'},
        {type:'selector.throw',origin:'callback',category:'callback',description:'selector construction failed'},
        {type:'source.next',origin:'source',category:'notification',description:'single producer emission'},
        {type:'source.complete',origin:'source',category:'notification',description:'producer completes'},
        {type:'source.error',origin:'source',category:'notification',description:'producer errors'},
        {type:'cancel',origin:'downstream',category:'lifecycle',description:'cancel result'},
      ],
      actionTypes:['notify','subscribe','unsubscribe','invoke-callback'],
      controls:[
        {id:'Unsubscribed',description:'no connector built',terminal:false},
        {id:'Preparing',description:'selector output not yet subscribed',terminal:false},
        {id:'Active',description:'Subject consumers installed before source',terminal:false},
        {id:'Closed',description:'terminal or cancelled',terminal:true}],
      sourcePaths:['src/internal/operators/connect.ts','src/internal/Subject.ts','src/internal/observable/fromSubscribable.ts'],
    }),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:()=>[],
    validateReaction:(_s,e,r)=>{
      const errs=actionErrors(r.actions);
      if(e.type==='selector.return'&&
        (r.actions[0]?.type!=='subscribe'||r.actions[0].resource.id!=='selected'||
          r.actions[1]?.type!=='subscribe'||r.actions[1].resource.id!=='source'))
        errs.push('selected result must be subscribed before source');
      if(e.type==='source.next'){
        const out=r.actions.filter(a=>a.type==='notify');
        if(out.length!==2||out.some(a=>a.notification.kind!=='N'||
          !Object.is(a.notification.value,e.value)))errs.push('exactly two identity broadcasts required');
      }
      return errs;
    },
  };
}
export const connectExample:readonly TimedEvent<ConnectEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:0,event:{type:'selector.return',resource:selector}},
  {time:1,event:{type:'source.next',value:1}},
  {time:2,event:{type:'source.next',value:2}},
  {time:3,event:{type:'source.complete'}},
];
