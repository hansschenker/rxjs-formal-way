import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';

export type CatchErrorParameters = Readonly<{ operator: 'catchError'; replacement: 'one-Observable'; }>;
export type CatchErrorState =
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Source'}>
  | Readonly<{phase:'Calling'; originalError:unknown}>
  | Readonly<{phase:'Replacement'}>
  | Readonly<{phase:'Closed'; reason:'complete'|'source-error'|'replacement-error'|'selector-error'|'cancel'}>;
export type CatchErrorEvent<T,R> =
  | Readonly<{type:'subscribe'|'source.complete'|'replacement.complete'|'cancel'}>
  | Readonly<{type:'source.next';value:T}>
  | Readonly<{type:'replacement.next';value:R}>
  | Readonly<{type:'source.error'|'replacement.error'|'callback.throw';error:unknown;resource?:ResourceRef}>
  | Readonly<{type:'callback.return';resource:ResourceRef; replacement:unknown}>;
export type CatchErrorModel<T,R> = OperatorModel<CatchErrorParameters,CatchErrorState,CatchErrorEvent<T,R>,Action<T|R,unknown>>;

const rev='e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const source={id:'source',generation:0} as const;
const replacement={id:'replacement',generation:0} as const;
const selector={id:'selector',generation:0} as const;
const subscribe=(resource:ResourceRef):Action<never,unknown>=>({type:'subscribe',resource});
const unsubscribe=(resource:ResourceRef):Action<never,unknown>=>({type:'unsubscribe',resource});
const emit=<T,R>(value:T|R):Action<T|R,unknown>=>({type:'notify',target:'downstream',notification:{kind:'N',value}});
const complete:Action<never,unknown>={type:'notify',target:'downstream',notification:{kind:'C'}};
const error=<T,R>(err:unknown):Action<T|R,unknown>=>({type:'notify',target:'downstream',notification:{kind:'E',error:err}});

const metadata:ModelMetadata={
  schemaVersion:'1.1',id:'catchError-one-Observable-replacement',operator:'catchError',rxjsVersion:'7.8.2',
  purpose:'Forward source values; on the first source error, invoke a selector and subscribe to its replacement stream.',
  cardinality:{signature:'catchError : T* × (E -> R*) -> (T|R)*',conditions:[
    'Source next values flow unchanged until source error or completion.',
    'One source error is intercepted, not delivered downstream, and replaced by zero or more values from the selected Observable.',
    'Replacement completion completes output; replacement error propagates without another selector call in this scoped single-replacement execution.',
  ]},
  scope:{parameters:'One source and one Observable replacement, without recursive caught resubscription.',
    callbacks:'The selector receives the exact error and a caught Observable. The model requests a correlated callback invocation and receives a resolved return/throw event; it does not execute user code.',
    time:'No new timing policy. The replacement Observable determines emission times; synchronous source errors require original-source teardown before replacement connection.',
    reentrancy:'Model resolution of synchronous selector call is atomic; no arbitrary recursion/reentrant downstream/finalizer behavior.',
    exclusions:['Selectors returning Promise or arbitrary ObservableInput conversion; returning caught recursively; synchronous reentrant producer or observer behavior.',
      'Selector cancellation in the middle of execution and observer/finalizer throws.',
      'A universal retry/resubscription model, which must be specified separately.']},
  initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'Connect original source; no replacement subscription until first source error is handled.'},
  ownership:{state:'subscription-local',sharing:'No sharing; each output subscription owns its original and possible replacement source subscriptions.',
    reset:'Error handling is local to one execution; replacement does not reset upstream history unless the selected Observable explicitly does.',
    resources:[{id:'source',kind:'subscription',owner:'current execution'},{id:'replacement',kind:'subscription',owner:'current execution'},
      {id:'selector',kind:'callback',owner:'current execution'}]},
  dispatch:{policy:'atomic-non-reentrant',
    actionSemantics:'Forward source.next until source.error; invoke selector; on return release original source before subscribing replacement; replacement notifications flow unchanged.',
    cancellationCheckpoints:['Cancel silently before failure, during pending selector outcome, or during replacement.',
      'No implicit retry, timer, or sharing.']},
  inputs:[
    {type:'subscribe',origin:'downstream',category:'lifecycle',description:'start source subscription'},
    {type:'source.next',origin:'source',category:'notification',description:'forward original value'},
    {type:'source.complete',origin:'source',category:'notification',description:'complete without selector'},
    {type:'source.error',origin:'source',category:'notification',description:'invoke recovery selector'},
    {type:'callback.return',origin:'callback',category:'callback',description:'replacement Observable returned'},
    {type:'callback.throw',origin:'callback',category:'callback',description:'recovery selector threw'},
    {type:'replacement.next',origin:'inner',category:'notification',description:'forward replacement value'},
    {type:'replacement.complete',origin:'inner',category:'notification',description:'complete replacement'},
    {type:'replacement.error',origin:'inner',category:'notification',description:'propagate replacement error without catching again'},
    {type:'cancel',origin:'downstream',category:'lifecycle',description:'silent teardown'},
  ],
  actionTypes:['subscribe','unsubscribe','notify','invoke-callback'],
  controls:[{id:'Unsubscribed',description:'not started',terminal:false},
    {id:'Source',description:'original source running',terminal:false},
    {id:'Calling',description:'selector outcome pending',terminal:false},
    {id:'Replacement',description:'recovery Observable running',terminal:false},
    {id:'Closed',description:'completed, errored or cancelled',terminal:true}],
  sources:[
    {url:'https://github.com/ReactiveX/rxjs/blob/'+rev+'/src/internal/operators/catchError.ts',revision:rev,purpose:'Original error interception, sync teardown and selector ordering'},
    {url:'https://github.com/ReactiveX/rxjs/blob/'+rev+'/src/internal/operators/OperatorSubscriber.ts',revision:rev,purpose:'Notifications and resource ownership'},
  ],
  evidence:{modelTests:['tests/session08-model.test.mjs'],runtimeTests:['tests/session08-rxjs.test.mjs'],
    status:'source-inspected',record:'evidence/SESSION-08.md'},
};

export function createCatchErrorModel<T,R>():CatchErrorModel<T,R>{
  type S=CatchErrorState;type E=CatchErrorEvent<T,R>;type A=Action<T|R,unknown>;
  type RuleT=Rule<CatchErrorParameters,S,E,A>;
  const desc=(id:string,from:S['phase'],event:E['type'],to:S['phase'],guard:string,actions:string[],explanation:string):RuleT['description']=>({
    id:'CATCHERROR-'+id,from,event,to,guard,actions,nextState:to==='Closed'?'closed':'await or execute selected source',
    obligations:['S8-CATCHERROR-'+id],explanation,
  });
  const closed=(reason:Extract<S,{phase:'Closed'}>['reason']):S=>({phase:'Closed',reason});
  const rules:RuleT[]=[
    {description:desc('INIT','Unsubscribed','subscribe','Source','fresh execution',['subscribe original source'],'Only a subscriber starts source work.'),
      enabled:()=>true,react:()=>({state:{phase:'Source'},actions:[subscribe(source)]})},
    {description:desc('SOURCE-NEXT','Source','source.next','Source','original connected',['forward exact value'],'The source value is forwarded without transformation.'),
      enabled:()=>true,react:(_s,e)=>{
        if(e.type!=='source.next')throw new Error('invalid source next');
        return {state:{phase:'Source'},actions:[emit<T,R>(e.value)]};
      }},
    {description:desc('SOURCE-ERROR','Source','source.error','Calling','source connected',['request recovery selector with error and caught source'],'The original error is not sent downstream; it is handed to selector.'),
      enabled:()=>true,react:(_s,e)=>{
        if(e.type!=='source.error')throw new Error('invalid source error');
        return {state:{phase:'Calling',originalError:e.error},
          actions:[{type:'invoke-callback',resource:selector,index:0,value:e.error}]};
      }},
    {description:desc('SELECTOR-RETURN','Calling','callback.return','Replacement','matching callback resource',
      ['release original source','subscribe replacement Observable'],
      'The original producer is finalized before recovery subscribes, even after a synchronous error.'),
      enabled:(_s,e)=>e.type==='callback.return'&&e.resource.id==='selector'&&e.resource.generation===0,
      react:()=>({state:{phase:'Replacement'},actions:[unsubscribe(source),subscribe(replacement)]})},
    {description:desc('SELECTOR-THROW','Calling','callback.throw','Closed','matching selector (or synchronous throw without resource)',
      ['error with thrown value','release source'],'Selector failure terminates without subscribing replacement.'),
      enabled:(_s,e)=>e.type==='callback.throw'&&(e.resource===undefined||
        (e.resource.id==='selector'&&e.resource.generation===0)),
      react:(_s,e)=>{
        if(e.type!=='callback.throw')throw new Error('invalid selector throw');
        return {state:closed('selector-error'),actions:[error<T,R>(e.error),unsubscribe(source)]};
      }},
    {description:desc('SOURCE-COMPLETE','Source','source.complete','Closed','original connected',
      ['complete','release original source'],'Successful completion never invokes recovery selector.'),
      enabled:()=>true,react:()=>({state:closed('complete'),actions:[complete,unsubscribe(source)]})},
    {description:desc('REPLACEMENT-NEXT','Replacement','replacement.next','Replacement','replacement connected',
      ['forward replacement value'],'Every replacement value is forwarded unchanged.'),
      enabled:()=>true,react:(_s,e)=>{
        if(e.type!=='replacement.next')throw new Error('invalid replacement next');
        return {state:{phase:'Replacement'},actions:[emit<T,R>(e.value)]};
      }},
    {description:desc('REPLACEMENT-COMPLETE','Replacement','replacement.complete','Closed','replacement connected',
      ['complete','release replacement'],'Output completes when recovery finishes.'),
      enabled:()=>true,react:()=>({state:closed('complete'),actions:[complete,unsubscribe(replacement)]})},
    {description:desc('REPLACEMENT-ERROR','Replacement','replacement.error','Closed','replacement connected',
      ['propagate replacement error','release replacement'],'Errors from the replacement are not intercepted by the same selector.'),
      enabled:()=>true,react:(_s,e)=>{
        if(e.type!=='replacement.error')throw new Error('invalid replacement error');
        return {state:closed('replacement-error'),actions:[error<T,R>(e.error),unsubscribe(replacement)]};
      }},
    ...(['Source','Calling','Replacement'] as const).map(from=>({
      description:desc('CANCEL-'+from.toUpperCase(),from,'cancel','Closed','active subscription',
        ['unsubscribe current resource without output'],'Explicit cancellation never synthesizes a complete or error notification.'),
      enabled:()=>true,react:()=>({state:closed('cancel'),actions:[
        unsubscribe(from==='Replacement'?replacement:source)]}),
    })),
  ];
  return {metadata,parameters:{operator:'catchError',replacement:'one-Observable'},rules,
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>s.phase==='Closed'&&!['complete','source-error','replacement-error','selector-error','cancel'].includes(s.reason)?
      ['invalid termination']:[],
    validateReaction:(_s,e,r)=>{
      const problems=[...validateActionWord(r.actions)];
      const outputs=r.actions.filter(a=>a.type==='notify'&&a.notification.kind==='N');
      if((e.type==='source.error'||e.type==='callback.throw'||e.type==='replacement.error'||e.type==='cancel')&&outputs.length)
        problems.push('error/cancel path emitted a value');
      if(e.type==='callback.return'&&!(r.actions[0]?.type==='unsubscribe'&&r.actions[1]?.type==='subscribe'))
        problems.push('recovery must tear down original source before subscribing');
      return problems;
    },
  };
}

const at=(time:number,event:CatchErrorEvent<number,string>):TimedEvent<CatchErrorEvent<number,string>>=>({time,event});
export const catchErrorExample=[
  at(0,{type:'subscribe'}),at(1,{type:'source.next',value:1}),
  at(2,{type:'source.error',error:'fail'}),
  at(2,{type:'callback.return',resource:selector,replacement:'recovery'}),
  at(3,{type:'replacement.next',value:'fallback'}),
  at(4,{type:'replacement.complete'}),
] as const;
