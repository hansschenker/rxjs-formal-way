import type { Action, ModelMetadata, OperatorModel, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision, source, subscribe, unsubscribe } from './session10-common.js';

/** Observable value is a Notification record; an error in the SOURCE becomes a value. */
export type MaterializedValue<T> =
  | Readonly<{ kind:'N'; value:T; hasValue:true }>
  | Readonly<{ kind:'E'; error:unknown; hasValue:false }>
  | Readonly<{ kind:'C'; hasValue:false }>;
export type MaterializeState =
  | Readonly<{phase:'Unsubscribed'|'Active'}>
  | Readonly<{phase:'Closed';reason:'complete'|'error'|'cancel'}>;
export type MaterializeEvent<T> =
  | Readonly<{type:'subscribe'|'source.complete'|'cancel'}>
  | Readonly<{type:'source.next';value:T}>
  | Readonly<{type:'source.error';error:unknown}>;
export type MaterializeModel<T> = OperatorModel<Readonly<{mode:'notification-as-value'}>,
  MaterializeState,MaterializeEvent<T>,Action<MaterializedValue<T>>>;

const terminal:Action<MaterializedValue<never>> =
  {type:'notify',target:'downstream',notification:{kind:'C'}};
const wrapped=<T>(value:MaterializedValue<T>):Action<MaterializedValue<T>> =>
  ({type:'notify',target:'downstream',notification:{kind:'N',value}});
const connect=subscribe(source) as Action<MaterializedValue<never>>;
const disconnect=unsubscribe(source) as Action<MaterializedValue<never>>;
const close=(reason:'complete'|'error'|'cancel'):MaterializeState=>({phase:'Closed',reason});

export function createMaterializeModel<T>():MaterializeModel<T>{
  type P=Readonly<{mode:'notification-as-value'}>;type S=MaterializeState;
  type E=MaterializeEvent<T>;type A=Action<MaterializedValue<T>>;
  const d=(id:string,from:string,event:string,to:string,guard:string,actions:string[],explanation:string)=>
    ({id:'S14-MATERIALIZE-'+id,from,event,to,guard,actions,explanation,
      nextState:to==='Closed'?'no owned source and no legal late events':'one subscribed source',
      obligations:['S14-MATERIALIZE-'+id]});
  const rules:Rule<P,S,E,A>[]=[
    {description:d('INIT','Unsubscribed','subscribe','Active','first consumer subscription',['subscribe source'],'The declared dataflow is lazy.'),
      enabled:()=>true,react:()=>({state:{phase:'Active'},actions:[connect]})},
    {description:d('NEXT','Active','source.next','Active','source next value, including undefined',['emit N Notification as next'],'Wrap each source value without looking inside it.'),
      enabled:()=>true,react:(_s,e)=>{if(e.type!=='source.next')throw Error('next required');
        return {state:{phase:'Active'},actions:[wrapped({kind:'N',value:e.value,hasValue:true})]};}},
    {description:d('END','Active','source.complete','Closed','source completes normally',['emit C Notification as next','complete output','release source'],'The source completion is encoded as a value, then the result completes.'),
      enabled:()=>true,react:()=>({state:close('complete'),actions:[wrapped({kind:'C',hasValue:false}),terminal,disconnect]})},
    {description:d('FAIL','Active','source.error','Closed','source errors',['emit E Notification as next','complete output','release source'],'The original error is retained by identity as the E payload; the RESULT completes, not errors.'),
      enabled:()=>true,react:(_s,e)=>{if(e.type!=='source.error')throw Error('error required');
        return {state:close('error'),actions:[wrapped({kind:'E',error:e.error,hasValue:false}),terminal,disconnect]};}},
    {description:d('CANCEL','Active','cancel','Closed','consumer cancels',['release source without notifications'],'Cancellation is silent and does not fabricate a terminal Notification value.'),
      enabled:()=>true,react:()=>({state:close('cancel'),actions:[disconnect]})},
  ];
  const meta:ModelMetadata={
    schemaVersion:'1.1',rxjsVersion:'7.8.2',id:'materialize-notifications',operator:'materialize',
    purpose:'Turn next, error and completion protocol signals into typed next values, then complete on original terminal signals.',
    cardinality:{signature:'materialize : T* -> Notification<T>*',conditions:[
      'Every source next maps to one N value at the same notification moment.',
      'Successful completion adds a C value followed by result completion.',
      'Source failure adds an E value retaining error identity, then result completion.',
      'Nonterminating or cancelled sources have no synthetic terminal Notification value.',
    ]},
    scope:{parameters:'No arguments.',callbacks:'No user callbacks or value inspection.',
      time:'Source timing and ordering are preserved; no timer or scheduler is introduced.',
      reentrancy:'Non-reentrant source delivery after subscription setup.',
      exclusions:['No equivalence claim for Notification class prototype, cached C instance, or property descriptors; semantic kind/value/error/hasValue are modeled.',
        'Synchronous reentrancy, observer throws and teardown throws are not modeled.']},
    initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'Acquire exactly one source upon result subscription.'},
    ownership:{state:'subscription-local',sharing:'No sharing. Every output subscription has its own source connection.',
      reset:'Closed never accepts further input.',resources:[{id:'source',kind:'subscription',owner:'result subscriber'}]},
    dispatch:{policy:'atomic-non-reentrant',actionSemantics:'Emit value-wrapped terminal first, then complete result; release source once.',
      cancellationCheckpoints:['Between notifications; cancel releases upstream silently.']},
    inputs:[
      {type:'subscribe',origin:'downstream',category:'lifecycle',description:'start lazy execution'},
      {type:'source.next',origin:'source',category:'notification',description:'source payload'},
      {type:'source.complete',origin:'source',category:'notification',description:'source normal end'},
      {type:'source.error',origin:'source',category:'notification',description:'source failure'},
      {type:'cancel',origin:'downstream',category:'lifecycle',description:'consumer cancellation'},
    ],
    actionTypes:['subscribe','unsubscribe','notify'],
    controls:[
      {id:'Unsubscribed',description:'not yet connected',terminal:false},
      {id:'Active',description:'source connected',terminal:false},
      {id:'Closed',description:'terminal or cancelled',terminal:true}],
    sources:['src/internal/operators/materialize.ts','src/internal/Notification.ts',
      'src/internal/operators/OperatorSubscriber.ts'].map(path=>({url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,
        revision:pinnedRevision,purpose:'Pinned 7.8.2 Notification construction, completion and teardown'})),
    evidence:{modelTests:['tests/session14-model.test.mjs'],runtimeTests:['tests/session14-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-14.md'},
  };
  return {parameters:{mode:'notification-as-value'},metadata:meta,rules,
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>s.phase==='Closed'&&!['complete','error','cancel'].includes(s.reason)?['invalid reason']:[],
    validateReaction:(_s,e,result)=>[
      ...validateActionWord(result.actions),
      ...(e.type==='source.error'&&result.actions.some(a=>a.type==='notify'&&a.notification.kind==='E')
        ?['materialize must not propagate an error as a terminal result error']:[]),
      ...((e.type==='source.error'||e.type==='source.complete')&&
        (result.actions.length<2||result.actions[0]?.type!=='notify'||
          result.actions[0].notification.kind!=='N'||result.actions[1]?.type!=='notify'||
          result.actions[1].notification.kind!=='C')?['missing wrapped terminal-before-complete order']:[]),
    ],
  };
}
export const materializeExample:readonly TimedEvent<MaterializeEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:'alpha'}},
  {time:3,event:{type:'source.next',value:'beta'}},
  {time:4,event:{type:'source.complete'}},
];
