import type { Action, InputDescriptor, ModelMetadata, OperatorModel, ResourceRef, Rule, RuleDescription, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision, source, subscribe, unsubscribe, next, complete, error } from './session10-common.js';

/**
 * groupBy's default Subject profile.
 * Actions addressed to group:<n> represent Subject notifications, not direct observer callbacks.
 * A GroupToken represents a GroupedObservable for pure modeling; an actual RxJS GroupedObservable
 * is produced only by the separately tested library execution.
 */
export type GroupToken<K> = Readonly<{ key: K; groupId: number }>;
export type GroupRecord<K> = Readonly<{ key: K; groupId: number; subscribers: 0 | 1 }>;
export type GroupByParameters = Readonly<{
  keySelectorId: 'key'; element: 'identity'; duration: 'none'; connector: 'Subject';
  subscribersPerGroup: 'at-most-one';
}>;
type GroupMemory<K> = Readonly<{ groups: readonly GroupRecord<K>[]; nextGroupId: number; index: number }>;
export type GroupByState<T,K> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (Readonly<{ phase: 'Active' | 'Orphaned' }> & GroupMemory<K>)
  | (Readonly<{ phase: 'Calling'; resume: 'Active' | 'Orphaned'; pending: T }> & GroupMemory<K>)
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'key-error' | 'cancel' | 'last-child-left' }>;
export type GroupByEvent<T,K> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; value: K }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>
  | Readonly<{ type: 'group.subscribe' | 'group.unsubscribe'; groupId: number }>;
export type GroupByModel<T,K> = OperatorModel<
  GroupByParameters, GroupByState<T,K>, GroupByEvent<T,K>, Action<GroupToken<K> | T,T>
>;

const sameKey = (a: unknown,b:unknown): boolean => a===b || (a!==a && b!==b);
const groupResource = (groupId:number):ResourceRef => ({id:'group:'+groupId,generation:0});
const groupNotify = <T>(groupId:number,value:T):Action<T> =>
  ({type:'notify',target:'group:'+groupId,notification:{kind:'N',value}});
const groupDone = (groupId:number):Action<never> =>
  ({type:'notify',target:'group:'+groupId,notification:{kind:'C'}});
const groupError = (groupId:number,originalError:unknown):Action<never> =>
  ({type:'notify',target:'group:'+groupId,notification:{kind:'E',error:originalError}});
const desc=(id:string,from:string,event:string,to:string,guard:string,acts:readonly string[],why:string):RuleDescription=>({
  id:'S13-GROUPBY-'+id,from,event,to,guard,actions:acts,explanation:why,
  nextState:to==='Closed'?'terminal, group registry cleared on upstream teardown':'group keys and child subscriber leases remain subscription-local',
  obligations:['S13-GROUPBY-'+id],
});
const inputs:readonly InputDescriptor[]=[
  {type:'subscribe',origin:'downstream',category:'lifecycle',description:'outer observer subscribes, enabling one upstream execution'},
  {type:'source.next',origin:'source',category:'notification',description:'upstream value requires key selection'},
  {type:'source.complete',origin:'source',category:'notification',description:'complete each known group before outer completion'},
  {type:'source.error',origin:'source',category:'notification',description:'propagate identical error to groups and outer'},
  {type:'callback.return',origin:'callback',category:'callback',description:'correlated key selector returns a key, using Map SameValueZero identity'},
  {type:'callback.throw',origin:'callback',category:'callback',description:'key selector threw; error is sent to groups and outer'},
  {type:'group.subscribe',origin:'inner',category:'lifecycle',description:'one subscriber begins observing an emitted grouped Observable'},
  {type:'group.unsubscribe',origin:'inner',category:'lifecycle',description:'group subscriber releases its lease'},
  {type:'cancel',origin:'downstream',category:'lifecycle',description:'outer consumer unsubscribes; child groups may keep upstream connected'},
];
const metadata:ModelMetadata={
  schemaVersion:'1.1',rxjsVersion:'7.8.2',
  id:'groupBy-default-subject-key-leases',operator:'groupBy',
  purpose:'Publish a grouped Observable once per new key; route each subsequent input to its keyed Subject; preserve upstream while an emitted child remains subscribed.',
  cardinality:{
    signature:'groupBy(key:T!→K!) : T* -> GroupedObservable<K,T>*; each group: T*',
    conditions:[
      'Outer next cardinality equals distinct keys seen by the key selector under Map SameValueZero identity while outer is subscribed.',
      'Every source next causes one key selector invocation and one Subject.next for that key, including the first value after group creation.',
      'Group and outer completion/error are separate notifications with group-first ordering; cancellation is not completion.',
    ],
  },
  scope:{
    parameters:'key selector only; identity elements, default Subject connector, no group duration; keys use JS Map SameValueZero.',
    callbacks:'One synchronous key selector outcome per source value, supplied externally; pure model never executes application logic.',
    time:'No timer/scheduler. Keys are assigned in source arrival order. A new group is announced before its first Subject.next.',
    reentrancy:'Atomic non-reentrant key callback; grouped subscribers can attach between modeled source notifications. At most one active subscriber per group.',
    exclusions:[
      'Optional element, duration and custom connector profiles, including duration-driven group closure and reuse.',
      'Multiple simultaneous subscribers per group; subscription inside the very same source-next action word is represented by ordered effects, not a nested model microstep.',
      'User callback/observer reentrancy, throwing group subscribers and group subscriptions after terminal teardown.',
    ],
  },
  initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'One upstream source connects only when the outer result is subscribed.'},
  ownership:{
    state:'subscription-local',
    sharing:'The original source is shared between grouped Subject consumers by this operator instance; output groups themselves are live multicast Subjects.',
    reset:'New result subscription creates a new group registry and source lease. Orphaned outer subscription retains upstream only for active children.',
    resources:[
      {id:'source',kind:'subscription',owner:'outer/grouped shared execution'},
      {id:'key',kind:'callback',owner:'one correlated key-selection call per source.next'},
      {id:'group:*',kind:'subscription',owner:'per-key Subject subscription owned by grouped consumers'},
    ],
  },
  dispatch:{
    policy:'atomic-non-reentrant',
    actionSemantics:'On a new key notify the outer observer about the GroupToken BEFORE the new Subject is fed its first opaque value. Target group:<n> is the Subject, not the outer observer. Group child subscriber leases delay source teardown.',
    cancellationCheckpoints:['After a resolved key selection/Subject delivery; cancel outer silently, retain the source for subscribed children.'],
  },
  inputs, actionTypes:['subscribe','unsubscribe','notify','invoke-callback'],
  controls:[
    {id:'Unsubscribed',description:'not connected; no groups exist',terminal:false},
    {id:'Active',description:'outer result and source connected; keyed groups in registry',terminal:false},
    {id:'Calling',description:'waiting for one correlated key callback outcome',terminal:false},
    {id:'Orphaned',description:'outer canceled, but at least one child subscriber retains source',terminal:false},
    {id:'Closed',description:'source stopped; all owned groups and connections released',terminal:true},
  ],
  sources:[
    'src/internal/operators/groupBy.ts','src/internal/Subject.ts','src/internal/operators/OperatorSubscriber.ts',
  ].map(path=>({url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,revision:pinnedRevision,
    purpose:'Pinned source: Map registry, group Subject dispatch, subscription lease and deferred teardown'})),
  evidence:{modelTests:['tests/session13-model.test.mjs'],runtimeTests:['tests/session13-rxjs.test.mjs'],
    status:'source-inspected',record:'evidence/SESSION-13.md'},
};

export function createGroupByModel<T,K>():GroupByModel<T,K>{
  type P=GroupByParameters;type S=GroupByState<T,K>;type E=GroupByEvent<T,K>;type A=Action<GroupToken<K>|T,T>;
  type M=GroupMemory<K>;
  const p:P={keySelectorId:'key',element:'identity',duration:'none',connector:'Subject',subscribersPerGroup:'at-most-one'};
  const rules:Rule<P,S,E,A>[]=[];
  const add=(id:string,from:string,event:string,to:string,guard:string,acts:string[],why:string,
    enabled:Rule<P,S,E,A>['enabled'],react:Rule<P,S,E,A>['react'])=>
    rules.push({description:desc(id,from,event,to,guard,acts,why),enabled,react});
  const connected=(s:S):s is Extract<S,{phase:'Active'|'Orphaned'}> =>
    s.phase==='Active'||s.phase==='Orphaned';
  const hasChild=(s:M):boolean=>s.groups.some(g=>g.subscribers===1);
  const findGroup=(s:M,key:K):GroupRecord<K>|undefined=>s.groups.find(g=>sameKey(g.key,key));
  const byId=(s:M,id:number):GroupRecord<K>|undefined=>s.groups.find(g=>g.groupId===id);
  const validCallback=(s:S,e:E):boolean=>s.phase==='Calling'&&
    (e.type==='callback.return'||e.type==='callback.throw')&&
    e.resource.id==='key'&&e.resource.generation===s.index-1;
  const completeGroups=(s:M):A[]=>s.groups.map(g=>groupDone(g.groupId) as A);
  const errorGroups=(s:M,e:unknown):A[]=>s.groups.map(g=>groupError(g.groupId,e) as A);
  const close=(reason:Extract<S,{phase:'Closed'}>['reason']):S=>({phase:'Closed',reason});
  const nextState=(s:M,outer:'Active'|'Orphaned',groups=s.groups):S=>({
    phase:outer,index:s.index,nextGroupId:s.nextGroupId,groups
  });
  const distribute=(s:Extract<S,{phase:'Calling'}>,key:K):{state:S;actions:A[]}=>{
    const existing=findGroup(s,key);
    if(existing)return {state:nextState(s,s.resume),actions:[groupNotify(existing.groupId,s.pending) as A]};
    const groupId=s.nextGroupId;
    const added:GroupRecord<K>={groupId,key,subscribers:0};
    const after:GroupMemory<K>={index:s.index,nextGroupId:groupId+1,groups:[...s.groups,added]};
    return {state:nextState(after,s.resume),actions:[
      ...(s.resume==='Active'?[next({key,groupId}) as A]:[]),
      groupNotify(groupId,s.pending) as A,
    ]};
  };
  add('INIT','Unsubscribed','subscribe','Active','fresh outer subscriber',['connect source'],'Nothing runs until subscribed.',
    ()=>true,()=>({state:{phase:'Active',index:0,nextGroupId:0,groups:[]},actions:[subscribe(source)]}));
  for(const phase of ['Active','Orphaned'] as const){
    add('SELECT-'+phase,phase,'source.next','Calling','shared source live; key index is safe',
      ['request one indexed key callback'],'Key is computed before any grouped-value delivery.',
      s=>s.phase===phase&&s.index<Number.MAX_SAFE_INTEGER,
      (s,e)=>{if(s.phase!==phase||e.type!=='source.next')throw Error('not source next');
        return {state:{phase:'Calling',resume:phase,index:s.index+1,nextGroupId:s.nextGroupId,
            groups:s.groups,pending:e.value},actions:[{
          type:'invoke-callback',resource:{id:'key',generation:s.index},index:s.index,value:e.value
        }]};});
    add('DONE-'+phase,phase,'source.complete','Closed','source ends normally',
      ['complete all groups before outer','release source'],'The source completion is shared across all live groups, even if outer has already unsubscribed.',
      ()=>true,(s)=>{if(!connected(s))throw Error('not connected');
        return {state:close('complete'),actions:[
          ...completeGroups(s),...(phase==='Active'?[complete as A]:[]),unsubscribe(source)
        ]};});
    add('ERROR-'+phase,phase,'source.error','Closed','source errors',
      ['error all groups before outer','release source'],'Original error object reaches all subscribed groups and (unless canceled) outer.',
      ()=>true,(s,e)=>{if(!connected(s)||e.type!=='source.error')throw Error('not source error');
        return {state:close('source-error'),actions:[
          ...errorGroups(s,e.error),...(phase==='Active'?[error(e.error) as A]:[]),unsubscribe(source)
        ]};});
    add('ATTACH-'+phase,phase,'group.subscribe',phase,'known group has no active subscriber',
      ['attach one group consumer'],'Group subscriptions share upstream and increase its lifetime lease.',
      (s,e)=>connected(s)&&e.type==='group.subscribe'&&byId(s,e.groupId)?.subscribers===0,
      (s,e)=>{if(!connected(s)||e.type!=='group.subscribe')throw Error('not group subscription');
        const groups=s.groups.map(g=>g.groupId===e.groupId?{...g,subscribers:1 as const}:g);
        return {state:nextState(s,phase,groups),actions:[subscribe(groupResource(e.groupId))]};});
    if(phase==='Active'){
      add('DETACH-ACTIVE',phase,'group.unsubscribe',phase,'known group has its one active subscriber',
        ['release child lease'],'Outer remains subscribed and keeps upstream regardless of child count.',
        (s,e)=>connected(s)&&e.type==='group.unsubscribe'&&byId(s,e.groupId)?.subscribers===1,
        (s,e)=>{if(s.phase!=='Active'||e.type!=='group.unsubscribe')throw Error('not active detach');
          return {state:nextState(s,'Active',s.groups.map(g=>g.groupId===e.groupId?{...g,subscribers:0 as const}:g)),
            actions:[unsubscribe(groupResource(e.groupId))]};});
    } else {
      add('DETACH-RETAIN',phase,'group.unsubscribe',phase,'another group remains subscribed',
        ['release this group lease','retain source'],'Orphaned outer has no ownership, but another child still does.',
        (s,e)=>s.phase==='Orphaned'&&e.type==='group.unsubscribe'&&
          byId(s,e.groupId)?.subscribers===1&&s.groups.some(g=>g.groupId!==e.groupId&&g.subscribers===1),
        (s,e)=>{if(s.phase!=='Orphaned'||e.type!=='group.unsubscribe')throw Error('not detach');
          return {state:nextState(s,'Orphaned',s.groups.map(g=>g.groupId===e.groupId?{...g,subscribers:0 as const}:g)),
            actions:[unsubscribe(groupResource(e.groupId))]};});
      add('DETACH-LAST',phase,'group.unsubscribe','Closed','last live child lease released after outer cancellation',
        ['release child lease','disconnect source'],'This is the deferred groupBy teardown observed when group subscriptions outlive the outer consumer.',
        (s,e)=>s.phase==='Orphaned'&&e.type==='group.unsubscribe'&&
          byId(s,e.groupId)?.subscribers===1&&
          !s.groups.some(g=>g.groupId!==e.groupId&&g.subscribers===1),
        (_s,e)=>{if(e.type!=='group.unsubscribe')throw Error('not detach');
          return {state:close('last-child-left'),
            actions:[unsubscribe(groupResource(e.groupId)),unsubscribe(source)]};});
    }
  }
  for(const resume of ['Active','Orphaned'] as const){
    add('KEY-EXISTING-'+resume,'Calling','callback.return',resume,
      'correlated key and Map has an existing subject',
      ['emit one value into existing keyed Subject'],'No second outer GroupedObservable is emitted for the same key.',
      (s,e)=>validCallback(s,e)&&s.phase==='Calling'&&s.resume===resume&&e.type==='callback.return'&&!!findGroup(s,e.value),
      (s,e)=>{if(s.phase!=='Calling'||e.type!=='callback.return')throw Error('bad callback');
        return distribute(s,e.value);});
    add('KEY-NEW-'+resume,'Calling','callback.return',resume,
      'correlated key not yet in Map',
      [resume==='Active'?'announce GroupedObservable then Subject.next':'do not announce new group to cancelled outer',
        'feed original source value into new Subject'],
      'Group announcements precede first keyed value, allowing a synchronous outer observer to subscribe.',
      (s,e)=>validCallback(s,e)&&s.phase==='Calling'&&s.resume===resume&&e.type==='callback.return'&&!findGroup(s,e.value),
      (s,e)=>{if(s.phase!=='Calling'||e.type!=='callback.return')throw Error('bad callback');
        return distribute(s,e.value);});
    add('KEY-THROW-'+resume,'Calling','callback.throw','Closed','correlated key selector throws',
      ['error grouped subjects','error outer when subscribed','release source'],
      'The key selector error is delivered to all groups before the outer, with exact identity.',
      (s,e)=>validCallback(s,e)&&s.phase==='Calling'&&s.resume===resume&&e.type==='callback.throw',
      (s,e)=>{if(s.phase!=='Calling'||e.type!=='callback.throw')throw Error('bad throw');
        return {state:close('key-error'),actions:[
          ...errorGroups(s,e.error),...(resume==='Active'?[error(e.error) as A]:[]),unsubscribe(source)
        ]};});
  }
  add('CANCEL-NO-CHILD','Active','cancel','Closed','outer unsubscribes with no active group subscribers',
    ['unsubscribe source silently'],'No live consumer keeps the source connected.',
    s=>s.phase==='Active'&&!hasChild(s),
    ()=>({state:close('cancel'),actions:[unsubscribe(source)]}));
  add('CANCEL-WITH-CHILD','Active','cancel','Orphaned','at least one group subscriber remains',
    ['outer subscription ends, shared source stays connected'],'groupBy intentionally keeps source alive for subscribed child groups.',
    s=>s.phase==='Active'&&hasChild(s),
    s=>{if(s.phase!=='Active')throw Error('not active');
      return {state:nextState(s,'Orphaned'),actions:[]};});
  return {
    parameters:p,rules,metadata,
    initialState:()=>({phase:'Unsubscribed'}),
    control:s=>s.phase,
    validateState:s=>{
      if(s.phase==='Unsubscribed'||s.phase==='Closed')return [];
      const issues:string[]=[];
      if(!Number.isSafeInteger(s.index)||s.index<0||!Number.isSafeInteger(s.nextGroupId)||s.nextGroupId<0)
        issues.push('invalid key index or group generation');
      if(s.groups.some(g=>!Number.isSafeInteger(g.groupId)||g.groupId<0||g.groupId>=s.nextGroupId||
          (g.subscribers!==0&&g.subscribers!==1))) issues.push('invalid group registry entry');
      if(s.groups.some((a,i)=>s.groups.slice(i+1).some(b=>sameKey(a.key,b.key))))
        issues.push('duplicate group for SameValueZero key');
      if(s.phase==='Orphaned'&&!hasChild(s))issues.push('orphaned source without active group lease');
      if(s.phase==='Calling'&&s.resume==='Orphaned'&&!hasChild(s))issues.push('orphaned key evaluation without active child');
      if(s.phase==='Calling'&&s.index===0)issues.push('callback has no indexed source input');
      return issues;
    },
    validateReaction:(_s,e,r)=>{
      const errors=[...validateActionWord(r.actions)];
      if(e.type==='callback.return'){
        const childValues=r.actions.filter(a=>a.type==='notify'&&a.target.startsWith('group:')&&a.notification.kind==='N');
        if(childValues.length!==1)errors.push('one source next must feed exactly one keyed Subject');
      }
      if(e.type==='cancel'&&r.actions.some(a=>a.type==='notify'))errors.push('outer cancellation is silent');
      return errors;
    },
  };
}
export const groupByExample: readonly TimedEvent<GroupByEvent<number,string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:1}},
  {time:1,event:{type:'callback.return',resource:{id:'key',generation:0},value:'odd'}},
  {time:2,event:{type:'group.subscribe',groupId:0}},
  {time:3,event:{type:'source.next',value:3}},
  {time:3,event:{type:'callback.return',resource:{id:'key',generation:1},value:'odd'}},
  {time:4,event:{type:'source.next',value:2}},
  {time:4,event:{type:'callback.return',resource:{id:'key',generation:2},value:'even'}},
  {time:5,event:{type:'source.complete'}},
];
