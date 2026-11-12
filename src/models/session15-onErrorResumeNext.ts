import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision, natural } from './session10-common.js';

export type ResumeNextParameters=Readonly<{otherSources:number;mode:'sequential-error-swallow'}>;
export type ResumeNextState=
 | Readonly<{phase:'Unsubscribed'}>
 | Readonly<{phase:'Active';current:number;total:number}>
 | Readonly<{phase:'Closed';reason:'exhausted'|'cancel'}>;
export type ResumeNextEvent<T>=
 | Readonly<{type:'subscribe'|'cancel'}>
 | Readonly<{type:'input.next';resource:ResourceRef;value:T}>
 | Readonly<{type:'input.complete';resource:ResourceRef}>
 | Readonly<{type:'input.error';resource:ResourceRef;error:unknown}>;
export type ResumeNextModel<T>=OperatorModel<ResumeNextParameters,ResumeNextState,ResumeNextEvent<T>,Action<T>>;
const input=(n:number):ResourceRef=>({id:'input',generation:n});
const sub=<T>(n:number):Action<T>=>({type:'subscribe',resource:input(n)});
const unsub=<T>(n:number):Action<T>=>({type:'unsubscribe',resource:input(n)});
const note=<T>(v:T):Action<T>=>({type:'notify',target:'downstream',notification:{kind:'N',value:v}});
const complete=<T>():Action<T>=>({type:'notify',target:'downstream',notification:{kind:'C'}});
const d=(id:string,event:string,to:string,guard:string,actions:string[],explanation:string)=>({
 id:'S15-ONERRORRESUMENEXT-'+id,from:id==='INIT'?'Unsubscribed':'Active',event,to,guard,actions,explanation,
 nextState:to==='Closed'?'all source subscriptions released':'one current subscription; others waiting',
 obligations:['S15-ONERRORRESUMENEXT-'+id],
});
export function createOnErrorResumeNextModel<T>(otherSources=2):ResumeNextModel<T>{
 if(!natural(otherSources)||otherSources>32)throw RangeError('otherSources must be 0..32');
 const p:ResumeNextParameters={otherSources,mode:'sequential-error-swallow'};
 type S=ResumeNextState;type E=ResumeNextEvent<T>;type A=Action<T>;type R=Rule<ResumeNextParameters,S,E,A>;
 const active=(s:S):s is Extract<S,{phase:'Active'}>=>s.phase==='Active';
 const current=(s:S,e:E)=>active(s)&&'resource' in e&&e.resource.id==='input'&&e.resource.generation===s.current;
 const closed=(reason:'exhausted'|'cancel'):S=>({phase:'Closed',reason});
 const rules:R[]=[
  {description:d('INIT','subscribe','Active','first subscription',['connect piped source index 0'],'The pipeable export subscribes the original source first and defers every later source.'),
   enabled:()=>true,react:()=>({state:{phase:'Active',current:0,total:otherSources+1},actions:[sub<T>(0)]})},
  {description:d('NEXT','input.next','Active','matching current source',['forward opaque input value'],'Only the currently subscribed input may contribute next values.'),
   enabled:current,react:(s,e)=>{if(e.type!=='input.next')throw Error('not next');return {state:s,actions:[note(e.value)]};}},
  ...(['input.complete','input.error'] as const).flatMap(kind=>[
    {description:d(kind==='input.complete'?'COMPLETE-ADVANCE':'ERROR-ADVANCE',kind,'Active',
       'current input terminal and one later input remains',['release current','subscribe next input'],
       'Both completion and error advance to the next input; errors are deliberately swallowed.'),
     enabled:(s:S,e:E)=>current(s,e)&&active(s)&&s.current+1<s.total,
     react:(s:S)=>{if(!active(s))throw Error('not active');return {state:{...s,current:s.current+1},
       actions:[unsub<T>(s.current),sub<T>(s.current+1)]};}},
    {description:d(kind==='input.complete'?'COMPLETE-LAST':'ERROR-LAST',kind,'Closed',
       'final current input terminates',['release final input','complete result without propagating error'],
       'An error from the last input also produces normal completion, never an output error.'),
     enabled:(s:S,e:E)=>current(s,e)&&active(s)&&s.current+1===s.total,
     react:(s:S)=>{if(!active(s))throw Error('not active');return {state:closed('exhausted'),
       actions:[unsub<T>(s.current),complete<T>()]};}},
  ] as R[]),
  {description:d('CANCEL','cancel','Closed','downstream cancellation',['unsubscribe current; no output terminal'],
     'Cancellation drops all unstarted inputs, never resuming after an explicit unsubscribe.'),
   enabled:()=>true,react:s=>{if(!active(s))throw Error('not active');return {state:closed('cancel'),actions:[unsub<T>(s.current)]};}},
 ];
 const metadata:ModelMetadata={
  schemaVersion:'1.1',rxjsVersion:'7.8.2',id:'onErrorResumeNext-pipeable-'+otherSources,operator:'onErrorResumeNext',
  purpose:'Sequentially forward the original and later Observable sources, moving to the next on either completion or error.',
  cardinality:{signature:'onErrorResumeNext : T0* × ... × Tn* → (T0 | ... | Tn)*',
   conditions:['Exactly one input is subscribed at a time; values retain identity and order within an input.',
    'Either completion or error of a current input starts the next supplied source.',
    'When the final input completes or errors, emit a normal result completion; never emit an error notification.']},
  scope:{parameters:'Pipeable deprecated onErrorResumeNext alias of onErrorResumeNextWith; '+otherSources+
     ' other valid Observable sources, no promises or iterables.',
   callbacks:'No callbacks or inspection of error values. Error details are intentionally discarded.',
   time:'Only active source notifications determine time; no timer. Sequential resource acquisition is synchronous in each terminal reaction.',
   reentrancy:'Atomic nonreentrant source terminal steps and subscription acquisition.',
   exclusions:['Synchronous reentrant emission during subscription acquisition; arbitrary ObservableInput conversions and conversion throws.',
    'Unbounded argument counts over 32; any user observer callback reentry or throwing teardown.']},
  initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'Subscribe source at input index 0; other inputs wait for previous termination.'},
  ownership:{state:'subscription-local',sharing:'No sharing; one input active per result subscription.',
   reset:'Each result execution starts at index 0 and forgets earlier errors.',
   resources:[{id:'input',kind:'subscription',owner:'current result, generation is fixed source position'}]},
  dispatch:{policy:'atomic-non-reentrant',actionSemantics:'Current input terminal tears down its subscription before acquiring next. Error is never forwarded.',
   cancellationCheckpoints:['Between notifications; unsubscribe current and discard pending inputs.']},
  inputs:[{type:'subscribe',origin:'downstream',category:'lifecycle',description:'start result'},
   {type:'input.next',origin:'source',category:'notification',description:'current source value'},
   {type:'input.complete',origin:'source',category:'notification',description:'current source completed'},
   {type:'input.error',origin:'source',category:'notification',description:'current source failed; swallow error'},
   {type:'cancel',origin:'downstream',category:'lifecycle',description:'cancel result'}],
  actionTypes:['subscribe','unsubscribe','notify'],
  controls:[{id:'Unsubscribed',description:'not connected',terminal:false},
   {id:'Active',description:'exactly one input source live',terminal:false},
   {id:'Closed',description:'result complete or cancelled',terminal:true}],
  sources:['src/operators/index.ts','src/internal/operators/onErrorResumeNextWith.ts',
   'src/internal/observable/onErrorResumeNext.ts'].map(path=>({
    url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,revision:pinnedRevision,
    purpose:'Pinned pipeable alias and sequential error-resume execution'})),
  evidence:{modelTests:['tests/session15-model.test.mjs'],runtimeTests:['tests/session15-rxjs.test.mjs'],
   status:'source-inspected',record:'evidence/SESSION-15.md'},
 };
 return {parameters:p,metadata,rules,initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
  validateState:s=>active(s)&&(!natural(s.current)||s.current>=s.total||s.total!==otherSources+1)?['invalid current source position']:[],
  validateReaction:(_s,e,r)=>[
   ...validateActionWord(r.actions),
   ...(e.type==='input.error'&&r.actions.some(a=>a.type==='notify'&&a.notification.kind==='E')
      ?['onErrorResumeNext must swallow source errors']:[]),
   ...(e.type==='cancel'&&r.actions.some(a=>a.type==='notify')?['cancellation must remain silent']:[]),
  ],
 };
}
export const onErrorResumeNextExample:readonly TimedEvent<ResumeNextEvent<string>>[]=[
 {time:0,event:{type:'subscribe'}},
 {time:1,event:{type:'input.next',resource:input(0),value:'first'}},
 {time:2,event:{type:'input.error',resource:input(0),error:'swallowed'}},
 {time:3,event:{type:'input.next',resource:input(1),value:'recovery'}},
 {time:4,event:{type:'input.complete',resource:input(1)}},
 {time:5,event:{type:'input.error',resource:input(2),error:'also swallowed'}},
];
