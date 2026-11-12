import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision, natural } from './session10-common.js';

export type PartitionBranch='pass'|'fail';
export type PartitionSlot<T>=Readonly<{
 status:'live'|'closed';index:number;
 pending:Readonly<{index:number;value:T}>|null;
}>;
export type PartitionParameters=Readonly<{predicate:'indexed';subscriptionMode:'two independent filtered outputs'}>;
export type PartitionState<T>=
 | Readonly<{phase:'Unsubscribed'}>
 | Readonly<{phase:'Active';pass:PartitionSlot<T>;fail:PartitionSlot<T>}>
 | Readonly<{phase:'Closed';reason:'both-closed'}>;
export type PartitionEvent<T>=
 | Readonly<{type:'subscribe'}>
 | Readonly<{type:'source.next';branch:PartitionBranch;value:T}>
 | Readonly<{type:'predicate.return';resource:ResourceRef;result:boolean}>
 | Readonly<{type:'predicate.throw';resource:ResourceRef;error:unknown}>
 | Readonly<{type:'source.complete';branch:PartitionBranch}>
 | Readonly<{type:'source.error';branch:PartitionBranch;error:unknown}>
 | Readonly<{type:'branch.cancel';branch:PartitionBranch}>;
export type PartitionModel<T>=OperatorModel<PartitionParameters,PartitionState<T>,PartitionEvent<T>,Action<T,T>>;
const gen=(b:PartitionBranch)=>b==='pass'?0:1;
const src=(b:PartitionBranch):ResourceRef=>({id:'source',generation:gen(b)});
const pred=(b:PartitionBranch,i:number):ResourceRef=>({id:'predicate-'+b,generation:i});
const subscription=<T>(b:PartitionBranch):Action<T,T>=>({type:'subscribe',resource:src(b)});
const release=<T>(b:PartitionBranch):Action<T,T>=>({type:'unsubscribe',resource:src(b)});
const note=<T>(b:PartitionBranch,value:T):Action<T,T>=>({type:'notify',target:b,notification:{kind:'N',value}});
const end=<T>(b:PartitionBranch):Action<T,T>=>({type:'notify',target:b,notification:{kind:'C'}});
const fail=<T>(b:PartitionBranch,e:unknown):Action<T,T>=>({type:'notify',target:b,notification:{kind:'E',error:e}});
const desc=(id:string,event:string,to:string,guard:string,actions:string[],explanation:string)=>({
 id:'S15-PARTITION-'+id,from:id==='INIT'?'Unsubscribed':'Active',event,to,guard,actions,
 nextState:to==='Closed'?'both independent source subscriptions closed':'independent branch indices and subscription ownership',
 obligations:['S15-PARTITION-'+id],explanation,
});
const active=<T>(s:PartitionState<T>):s is Extract<PartitionState<T>,{phase:'Active'}>=>s.phase==='Active';
const branchOf=(e:{resource:ResourceRef}):PartitionBranch|null=>
 e.resource.id==='predicate-pass'?'pass':e.resource.id==='predicate-fail'?'fail':null;
const closeBranch=<T>(s:Extract<PartitionState<T>,{phase:'Active'}>,b:PartitionBranch):PartitionState<T>=>{
 const slot:PartitionSlot<T>={...s[b],status:'closed',pending:null};
 const updated={...s,[b]:slot};
 return updated.pass.status==='closed'&&updated.fail.status==='closed'
   ?{phase:'Closed',reason:'both-closed'}:updated;
};

export function createPartitionModel<T>():PartitionModel<T>{
 const p:PartitionParameters={predicate:'indexed',subscriptionMode:'two independent filtered outputs'};
 type S=PartitionState<T>;type E=PartitionEvent<T>;type A=Action<T,T>;type R=Rule<PartitionParameters,S,E,A>;
 const live=(s:S,b:PartitionBranch)=>active(s)&&s[b].status==='live';
 const waiting=(s:S,b:PartitionBranch)=>live(s,b)&&active(s)&&s[b].pending===null;
 const pending=(s:S,e:E)=>{
  if(!active(s)||!('resource' in e))return null;
  const b=branchOf(e);return b&&s[b].status==='live'&&s[b].pending?.index===e.resource.generation?b:null;
 };
 const rules:R[]=[
  {description:desc('INIT','subscribe','Active','both returned Observables are subscribed as independent consumers',
    ['subscribe source once for pass branch','subscribe source separately for fail branch'],
    'partition is two filter calls, not one multicast router. Each branch has its own source subscription and predicate index.'),
   enabled:()=>true,react:()=>({state:{phase:'Active',pass:{status:'live',index:0,pending:null},
     fail:{status:'live',index:0,pending:null}},actions:[subscription<T>('pass'),subscription<T>('fail')]})},
  {description:desc('PREDICATE-REQUEST','source.next','Active','that branch is live and not awaiting a callback',
    ['request indexed branch predicate; retain opaque source value'],
    'The same cold source may execute twice, and predicate indices are independent per branch.'),
   enabled:(s,e)=>e.type==='source.next'&&waiting(s,e.branch),
   react:(s,e)=>{if(!active(s)||e.type!=='source.next')throw Error('not next');
    const b=e.branch,i=s[b].index;if(!natural(i))throw Error('invalid index');
    return {state:{...s,[b]:{...s[b],index:i+1,pending:{index:i,value:e.value}}},
      actions:[{type:'invoke-callback',resource:pred(b,i),index:i,value:e.value}]};}},
  {description:desc('PREDICATE-RETURN','predicate.return','Active','matching branch callback and boolean result',
    ['emit on matching branch only; otherwise discard','clear pending callback'],
    'Pass branch accepts true and fail branch accepts false; neither branch clones payloads.'),
   enabled:(s,e)=>e.type==='predicate.return'&&typeof e.result==='boolean'&&pending(s,e)!==null,
   react:(s,e)=>{if(!active(s)||e.type!=='predicate.return')throw Error('not return');
    const b=pending(s,e);if(!b)throw Error('invalid correlation');
    const saved=s[b].pending;if(!saved)throw Error('missing value');
    const accepted=(b==='pass')===e.result;
    return {state:{...s,[b]:{...s[b],pending:null}},actions:accepted?[note(b,saved.value)]:[]};}},
  ...(['predicate.throw','source.complete','source.error','branch.cancel'] as const).flatMap(kind=>
    (['pass','fail'] as const).flatMap(b=>
      ([false,true] as const).map(last=>{
        const id=kind.toUpperCase().replace('.','-')+'-'+b.toUpperCase()+'-'+(last?'LAST':'WAIT');
        return {
          description:desc(id,kind,last?'Closed':'Active',
            'only '+b+' branch live and other branch '+(last?'closed':'live'),
            kind==='branch.cancel'?['unsubscribe this branch silently']:
             kind==='source.complete'?['complete this branch','unsubscribe this source']:
             kind==='source.error'?['error only this branch','unsubscribe source']:
             ['forward predicate throw only to this branch','unsubscribe this branch'],
            'Each result Observable owns one independent source subscription and terminal state.'),
          enabled:(s:S,e:E)=>{
            if(!active(s)||s[b].status!=='live'||(s[b==='pass'?'fail':'pass'].status==='closed')!==last)return false;
            if(kind==='predicate.throw')return e.type===kind&&pending(s,e)===b;
            return e.type===kind&&e.branch===b&&s[b].pending===null;
          },
          react:(s:S,e:E)=>{
            if(!active(s))throw Error('not active');
            const actions:A[]=[];
            if(kind==='predicate.throw'&&e.type==='predicate.throw')actions.push(fail(b,e.error));
            else if(kind==='source.error'&&e.type==='source.error')actions.push(fail(b,e.error));
            else if(kind==='source.complete')actions.push(end<T>(b));
            actions.push(release<T>(b));
            return {state:closeBranch(s,b),actions};
          },
        } as R;
      })
    )
  ),
 ];
 const metadata:ModelMetadata={
  schemaVersion:'1.1',rxjsVersion:'7.8.2',operator:'partition',id:'partition-two-independent-branch-subscriptions',
  purpose:'Construct two separately subscribed filter results, with inverse predicate admission and independent indexed callback state.',
  cardinality:{signature:'partition : (T → Bool) × T* → (T*,T*)',
   conditions:['Each branch separately subscribes to the source; results are not necessarily a single shared execution.',
    'Pass accepts exactly values whose branch-specific predicate outcome is true; fail accepts values with false.',
    'Each subscription uses its own zero-based index; completion, error, cancellation and callback throw are branch-local.',
    'Predicate output is a routing decision, not a modification of the opaque payload.']},
  scope:{parameters:'Predicate/value input, no deprecated thisArg; both result branches separately subscribed in the model witness.',
   callbacks:'An indexed predicate callback runs once per source next PER BRANCH. Callback outcomes are correlated to branch and index, not computed internally.',
   time:'Each independent upstream subscription supplies its own time; cold sources can execute twice, hot sources can share an external producer.',
   reentrancy:'Atomic indexed predicate request and resolution before the next event for that branch.',
   exclusions:['A single shared-source router is explicitly not partition. Only one subscription per result branch is modeled; multiple subscribers to either result are out of scope.',
    'Synchronous reentrancy during predicate evaluation, deprecated thisArg and throwing observer/finalizers.']},
  initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'The modeled witness connects both returned Observables, resulting in TWO source subscriptions.'},
  ownership:{state:'subscription-local',sharing:'No implicit sharing. Two branches independently subscribe to the source; one closing does not close the other.',
   reset:'Each branch has its own index and pending predicate; source teardown is independent.',
   resources:[{id:'source',kind:'subscription',owner:'one source subscription per branch, generation 0/1'},
    {id:'predicate-pass',kind:'callback',owner:'pass branch indexed callback'},
    {id:'predicate-fail',kind:'callback',owner:'fail branch indexed callback'}]},
  dispatch:{policy:'atomic-non-reentrant',actionSemantics:'Request one predicate per input to each subscribed branch; only the appropriate branch may receive a next.',
   cancellationCheckpoints:['Between branch events and their resolved callbacks; cancellation is branch-local.']},
  inputs:[{type:'subscribe',origin:'downstream',category:'lifecycle',description:'subscribe to both returned branches in model witness'},
   {type:'source.next',origin:'source',category:'notification',description:'a value arriving at an independently subscribed branch'},
   {type:'predicate.return',origin:'callback',category:'callback',description:'one correlated boolean predicate outcome'},
   {type:'predicate.throw',origin:'callback',category:'callback',description:'predicate evaluation threw'},
   {type:'source.complete',origin:'source',category:'notification',description:'branch-local normal completion'},
   {type:'source.error',origin:'source',category:'notification',description:'branch-local source failure'},
   {type:'branch.cancel',origin:'downstream',category:'lifecycle',description:'cancel just one output branch'}],
  actionTypes:['notify','subscribe','unsubscribe','invoke-callback'],
  controls:[{id:'Unsubscribed',description:'two returned observables unconnected',terminal:false},
   {id:'Active',description:'at least one branch live',terminal:false},
   {id:'Closed',description:'both branches terminated/cancelled',terminal:true}],
  sources:['src/internal/operators/partition.ts','src/internal/operators/filter.ts',
   'src/internal/util/not.ts'].map(path=>({
    url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,revision:pinnedRevision,
    purpose:'Pinned independent filter and inverted predicate semantics'})),
  evidence:{modelTests:['tests/session15-model.test.mjs'],runtimeTests:['tests/session15-rxjs.test.mjs'],
   status:'source-inspected',record:'evidence/SESSION-15.md'},
 };
 return {parameters:p,metadata,rules,initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
  validateState:s=>active(s)?[
    ...(['pass','fail'] as const).flatMap(b=>[
      ...(!natural(s[b].index)?['invalid '+b+' index']:[]),
      ...(s[b].status==='closed'&&s[b].pending!==null?['closed branch retains callback']:[]),
    ]),
    ...(s.pass.status==='closed'&&s.fail.status==='closed'?['both closed should be terminal']:[]),
   ]:[],
  validateReaction:(_s,e,r)=>[
    ...validateActionWord(r.actions),
    ...(e.type==='branch.cancel'&&r.actions.some(a=>a.type==='notify')?['branch cancel must be silent']:[]),
    ...(e.type==='predicate.return'&&r.actions.some(a=>a.type==='notify'&&a.notification.kind==='N'&&
      a.target!==branchOf(e))?['predicate decision routed to wrong branch']:[]),
  ],
 };
}
export const partitionExample:readonly TimedEvent<PartitionEvent<number>>[]=[
 {time:0,event:{type:'subscribe'}},
 {time:1,event:{type:'source.next',branch:'pass',value:2}},
 {time:1,event:{type:'predicate.return',resource:pred('pass',0),result:true}},
 {time:2,event:{type:'source.next',branch:'fail',value:3}},
 {time:2,event:{type:'predicate.return',resource:pred('fail',0),result:false}},
 {time:3,event:{type:'source.complete',branch:'pass'}},
 {time:4,event:{type:'source.complete',branch:'fail'}},
];
