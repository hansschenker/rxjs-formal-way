import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { actionErrors, complete, describe, error, metadata, natural, next, resource, source, subscribe, unsubscribe } from './session10-common.js';

/** delay delegates to delayWhen(() => timer(due)); delayWhen uses mergeMap to admit all inners. */
export type DelayOperator = 'delay' | 'delayWhen';
export type DelayParameters = Readonly<{ operator: DelayOperator; mode: 'timer' | 'selector'; due: number | null }>;
export type DelayItem<T> = Readonly<{ id: number; value: T; stage: 'calling' | 'pending'; deadline?: number }>;
export type DelayState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; sourceLive: boolean; nextId: number; items: readonly DelayItem<T>[] }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'duration-error' | 'callback-error' | 'cancel' }>;
export type DelayEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T; now: number }>
  | Readonly<{ type: 'source.error' | 'duration.error' | 'callback.throw'; error: unknown; resource?: ResourceRef }>
  | Readonly<{ type: 'callback.return' | 'duration.next' | 'duration.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'timer.fire'; resource: ResourceRef; now: number }>;
export type DelayModel<T> = OperatorModel<DelayParameters, DelayState<T>, DelayEvent<T>, Action<unknown>>;
const timer = (id:number):ResourceRef=>resource('timer',id);
const duration = (id:number):ResourceRef=>resource('duration',id);
const get = <T>(s:DelayState<T>,e:DelayEvent<T>,id:string): DelayItem<T>|undefined => {
  if(s.phase!=='Active'||!('resource' in e)||!e.resource)return undefined;
  return s.items.find(v=>v.id===e.resource?.generation && e.resource?.id===id);
};
const releasable = <T>(s:DelayState<T>,p:DelayParameters):Action<unknown>[] =>
  s.phase!=='Active'?[]:s.items.filter(v=>v.stage==='pending').map(v=>
    p.mode==='timer' ? {type:'cancel-timer',resource:timer(v.id)} : unsubscribe(duration(v.id)));
const after = <T>(s:Extract<DelayState<T>,{phase:'Active'}>, itemId:number,
  acts:Action<unknown>[]):{state:DelayState<T>;actions:readonly Action<unknown>[]}=>{
  const items=s.items.filter(i=>i.id!==itemId);
  if(!s.sourceLive && items.length===0)return {state:{phase:'Closed',reason:'complete'},actions:[...acts,complete]};
  return {state:{...s,items},actions:acts};
};

function create<T>(operator:DelayOperator,due:number|null):DelayModel<T>{
  const mode=operator==='delay'?'timer':'selector';
  if(mode==='timer' && (due===null||!natural(due)))throw RangeError('delay due must be a nonnegative safe integer');
  const p:DelayParameters={operator,mode,due};
  type S=DelayState<T>;type E=DelayEvent<T>;type A=Action<unknown>;type Rt=Rule<DelayParameters,S,E,A>;
  const d=(id:string,from:S['phase'],event:E['type'],to:S['phase'],guard:string,acts:string[],explanation:string)=>
    describe(operator,id,from,event,to,guard,acts,explanation);
  const closed=(reason:Extract<S,{phase:'Closed'}>['reason']):S=>({phase:'Closed',reason});
  const rules:Rt[]=[
    {description:d('INIT','Unsubscribed','subscribe','Active','fresh subscription',['subscribe source'],'Each result subscription owns a new source and pending-duration registry.'),
      enabled:()=>true,react:()=>({state:{phase:'Active',sourceLive:true,nextId:0,items:[]},actions:[subscribe(source)]})},
    {description:d('SOURCE-NEXT','Active','source.next','Active','source live; timer mode',
      ['remember input as independent pending timer','schedule due'], 'delay uses one timer per source value, not a single shared debounce timer.'),
      enabled:(s,e,q)=>q.mode==='timer' && s.phase==='Active'&&s.sourceLive&&e.type==='source.next'&&
        natural(e.now)&&natural(s.nextId)&&s.nextId<Number.MAX_SAFE_INTEGER,
      react:(s,e,q)=>{
        if(s.phase!=='Active'||e.type!=='source.next'||q.due===null)throw Error('not timer next');
        const id=s.nextId;const item:DelayItem<T>={id,value:e.value,stage:'pending',deadline:e.now+q.due};
        if(!Number.isSafeInteger(item.deadline))throw Error('deadline overflow');
        return {state:{...s,nextId:id+1,items:[...s.items,item]},actions:[
          {type:'schedule',resource:timer(id),delay:q.due}]};
      }},
    {description:d('SOURCE-SELECT','Active','source.next','Active','source live; selector mode',
      ['retain source value','request indexed duration selector'], 'delayWhen allows multiple independently pending durations; no replacement policy.'),
      enabled:(s,e,q)=>q.mode==='selector'&&s.phase==='Active'&&s.sourceLive&&e.type==='source.next'&&
        natural(e.now)&&natural(s.nextId)&&s.nextId<Number.MAX_SAFE_INTEGER,
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='source.next')throw Error('not selector next');
        const id=s.nextId;
        return {state:{...s,nextId:id+1,items:[...s.items,{id,value:e.value,stage:'calling'}]},
          actions:[{type:'invoke-callback',resource:resource('selector',id),index:id,value:e.value}]};
      }},
    {description:d('SELECTOR-RETURN','Active','callback.return','Active','matching pending callback',
      ['subscribe returned duration'], 'One successful selector return starts one independent duration subscription.'),
      enabled:(s,e,q)=>q.mode==='selector'&&get(s,e,'selector')?.stage==='calling',
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='callback.return')throw Error('invalid callback return');
        const id=e.resource.generation;
        return {state:{...s,items:s.items.map(v=>v.id===id?{...v,stage:'pending'}:v)},
          actions:[subscribe(duration(id))]};
      }},
    {description:d('SELECTOR-THROW','Active','callback.throw','Closed','matching pending callback',
      ['error','release outer and all admitted durations'], 'A selector failure aborts all outstanding delayed values.'),
      enabled:(s,e,q)=>q.mode==='selector'&&get(s,e,'selector')?.stage==='calling',
      react:(s,e,q)=>{
        if(e.type!=='callback.throw')throw Error('invalid callback throw');
        return {state:closed('callback-error'),actions:[error(e.error),...releasable(s,q),
          ...(s.phase==='Active'&&s.sourceLive?[unsubscribe(source)]:[])]};
      }},
    {description:d('TIMER-FIRE','Active','timer.fire','Active','current timer at/after deadline; source remains live or peers pending',
      ['cancel timer','emit its source payload'], 'Time is supplied by scheduler event; each timer releases only its own source value.'),
      enabled:(s,e,q)=>q.mode==='timer'&&e.type==='timer.fire'&&
        get(s,e,'timer')?.stage==='pending'&&e.now >= (get(s,e,'timer')?.deadline??Infinity)&&natural(e.now)&&
        (s.phase==='Active'&&(s.sourceLive||s.items.length>1)),
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='timer.fire')throw Error('invalid timer');
        const item=get(s,e,'timer');if(!item)throw Error('unknown timer');
        return after(s,item.id,[{type:'cancel-timer',resource:timer(item.id)},next(item.value)]);
      }},
    {description:d('TIMER-FINAL','Active','timer.fire','Closed','last timer at/after deadline and source already complete',
      ['emit value','complete'], 'Last pending timer completion finishes an already-completed source.'),
      enabled:(s,e,q)=>q.mode==='timer'&&e.type==='timer.fire'&&get(s,e,'timer')?.stage==='pending'&&
        e.now>=(get(s,e,'timer')?.deadline??Infinity)&&natural(e.now)&&
        s.phase==='Active'&&!s.sourceLive&&s.items.length===1,
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='timer.fire')throw Error('invalid final timer');
        const item=get(s,e,'timer');if(!item)throw Error('unknown final timer');
        return after(s,item.id,[{type:'cancel-timer',resource:timer(item.id)},next(item.value)]);
      }},
    ...(['duration.next','duration.complete'] as const).flatMap(kind=>(
      ['Active','Closed'] as const).map(to=>({
        description:d(kind==='duration.next'?'DURATION-NEXT-'+to:'DURATION-EMPTY-'+to,
          'Active',kind,to,'matching selected duration; closed only after outer finished and last item',
          kind==='duration.next'?['emit pending value after first duration next']:['discard pending value after empty completion'],
          kind==='duration.next'?'Duration next releases its bound source payload, regardless of selector output.':'An empty duration completes without releasing the source payload.'),
        enabled:(s:S,e:E,q:DelayParameters)=>q.mode==='selector'&&get(s,e,'duration')?.stage==='pending'&&
          s.phase==='Active'&&((to==='Closed')===(!s.sourceLive && s.items.length===1)),
        react:(s:S,e:E)=>{
          if(s.phase!=='Active'||!('resource' in e)||!e.resource)throw Error('invalid duration event');
          const item=get(s,e,'duration');if(!item)throw Error('unknown duration');
          return after(s,item.id,[unsubscribe(duration(item.id)),
            ...(kind==='duration.next'?[next(item.value)]:[])]);
        },
      } as Rt))
    )),
    {description:d('DURATION-ERROR','Active','duration.error','Closed','matching selected duration',
      ['error and release all subscriptions'], 'Any duration error fails the output immediately and discards other pending values.'),
      enabled:(s,e,q)=>q.mode==='selector'&&get(s,e,'duration')?.stage==='pending',
      react:(s,e,q)=>{
        if(e.type!=='duration.error')throw Error('invalid duration error');
        return {state:closed('duration-error'),actions:[error(e.error),...releasable(s,q),
          ...(s.phase==='Active'&&s.sourceLive?[unsubscribe(source)]:[])]};
      }},
    ...([true,false] as const).map(hasPending=>({
      description:d(hasPending?'SOURCE-COMPLETE-WAIT':'SOURCE-COMPLETE-EMPTY','Active','source.complete',
        hasPending?'Active':'Closed',hasPending?'some pending duration remains':'no pending durations',
        hasPending?['release source, await durations']:['complete and release source'],
        'An outer completion cannot force early delivery: all admitted durations must settle.'),
      enabled:(s:S)=>s.phase==='Active'&&s.sourceLive&&(s.items.length>0)===hasPending&&
        s.items.every(x=>x.stage==='pending'),
      react:(s:S)=>{
        if(s.phase!=='Active')throw Error('invalid outer completion');
        return hasPending?{state:{...s,sourceLive:false},actions:[unsubscribe(source)]}:
          {state:closed('complete'),actions:[complete,unsubscribe(source)]};
      },
    } as Rt)),
    {description:d('SOURCE-ERROR','Active','source.error','Closed','source live',
      ['propagate error and cancel all pending durations'],'A source error never waits for delayed values or flushes them.'),
      enabled:(s)=>s.phase==='Active'&&s.sourceLive,
      react:(s,e,q)=>{
        if(e.type!=='source.error')throw Error('invalid outer error');
        return {state:closed('source-error'),actions:[error(e.error),...releasable(s,q),unsubscribe(source)]};
      }},
    {description:d('CANCEL','Active','cancel','Closed','downstream unsubscribed',
      ['cancel pending durations and live source; no terminal output'], 'Cancellation is silent and never causes a duration to fire.'),
      enabled:()=>true,
      react:(s,_e,q)=>({state:closed('cancel'),actions:[
        ...releasable(s,q),...(s.phase==='Active'&&s.sourceLive?[unsubscribe(source)]:[])]})},
  ];
  return {
    parameters:p,rules,
    metadata:metadata({
      id:operator==='delay'?'delay-fixed-timer-'+due:'delayWhen-Observable-selectors',operator,
      purpose:operator==='delay'?'Delay each source value independently using a scheduled timer.':
        'Hold each source value until its own selected duration emits a next; allow overlapping waits.',
      cardinality:{signature:operator+' : T* -> T* (time-shifted subset for delayWhen)',
        conditions:['One inner per source value, independent concurrency and retained payload identity.',
          'Only a timer firing/duration next emits a value; empty selected duration discards it.',
          'Outer completion waits for admitted inner work; error/cancellation discard.']},
      scope:{parameters:operator==='delay'?'Relative nonnegative safe-integer due duration; virtual scheduler events. No Date or custom scheduler.':
          'Observable-valued duration selector; no deprecated subscriptionDelay overload.',
        callbacks:mode==='selector'?'Indexed selector invoked once per source next; modeled as correlated return/throw outcomes.':
          'No user selector; internal constant timer selection is lowered directly into schedule actions.',
        time:'Schedulers and duration sources own time; the model only uses supplied now and ordered events.',
        reentrancy:'Atomic non-reentrant notifications and selector resolution; no callback-driven source reentry.',
        exclusions:['Promise/iterable input conversion, Date absolute delay, custom schedulers, deprecated subscriptionDelay.',
          'Reentrant producer/observer/finalizer, cancellation during callback delivery, universal metric-time guarantee.']},
      initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'Acquire source at downstream subscription; each value independently admits its duration.'},
      ownership:{state:'subscription-local',sharing:'No implicit sharing or replay; multiple independent live timers/durations.',
        reset:'Fresh counter and pending list on every output subscription.',
        resources:[{id:'source',kind:'subscription',owner:'output subscription'},
          {id:'timer',kind:'timer',owner:'each admitted source value'},
          {id:'duration',kind:'subscription',owner:'each selector return'},
          {id:'selector',kind:'callback',owner:'output subscription'}]},
      dispatch:{policy:'atomic-non-reentrant',
        actionSemantics:'Each value enters a separately owned duration. A timer/first duration next releases that value. Completion waits; error aborts.',
        cancellationCheckpoints:['Between any source, timer or duration events.','Before late timer firing after cancellation.']},
      inputs:[
        {type:'subscribe',origin:'downstream',category:'lifecycle',description:'subscribe to output'},
        {type:'source.next',origin:'source',category:'notification',description:'admit one value and its duration'},
        {type:'callback.return',origin:'callback',category:'callback',description:'selected duration returned'},
        {type:'callback.throw',origin:'callback',category:'callback',description:'duration selector threw'},
        {type:'timer.fire',origin:'timer',category:'time',description:'scheduled timer executes at supplied now'},
        {type:'duration.next',origin:'inner',category:'notification',description:'first duration next'},
        {type:'duration.complete',origin:'inner',category:'notification',description:'duration completed without next'},
        {type:'duration.error',origin:'inner',category:'notification',description:'duration error'},
        {type:'source.complete',origin:'source',category:'notification',description:'source completion waits for inners'},
        {type:'source.error',origin:'source',category:'notification',description:'source error'},
        {type:'cancel',origin:'downstream',category:'lifecycle',description:'silent cancellation'},
      ],
      actionTypes:['notify','subscribe','unsubscribe','invoke-callback','schedule','cancel-timer'],
      controls:[
        {id:'Unsubscribed',description:'not connected',terminal:false},
        {id:'Active',description:'source maybe live and independent pending duration registry',terminal:false},
        {id:'Closed',description:'output terminated or unsubscribed',terminal:true}],
      sourcePaths:mode==='timer'?
        ['src/internal/operators/delay.ts','src/internal/operators/delayWhen.ts','src/internal/observable/timer.ts']:
        ['src/internal/operators/delayWhen.ts','src/internal/operators/mergeMap.ts','src/internal/operators/mergeInternals.ts'],
    }),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>{
      if(s.phase!=='Active')return [];
      if(!natural(s.nextId)||new Set(s.items.map(x=>x.id)).size!==s.items.length)return ['duplicate/invalid duration id'];
      if(s.items.some(x=>!natural(x.id)||x.id>=s.nextId||!['calling','pending'].includes(x.stage)))return ['invalid pending duration record'];
      if(mode==='timer'&&s.items.some(x=>x.stage!=='pending'||!Number.isSafeInteger(x.deadline)))return ['invalid timer record'];
      return [];
    },
    validateReaction:(_s,e,r)=>{
      const errs=actionErrors(r.actions);
      if((e.type==='cancel'||e.type.endsWith('.error'))&&r.actions.some(a=>a.type==='notify'&&a.notification.kind==='N'))
        errs.push('cannot flush on cancel/error');
      if(e.type==='duration.complete'&&r.actions.some(a=>a.type==='notify'&&a.notification.kind==='N'))
        errs.push('empty duration cannot release payload');
      return errs;
    },
  };
}
export const createDelayModel=<T>(due=3):DelayModel<T>=>create<T>('delay',due);
export const createDelayWhenModel=<T>():DelayModel<T>=>create<T>('delayWhen',null);
export const delayExample:readonly TimedEvent<DelayEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',now:1,value:1}},
  {time:2,event:{type:'source.next',now:2,value:2}},
  {time:3,event:{type:'source.complete'}},
  {time:4,event:{type:'timer.fire',resource:timer(0),now:4}},
  {time:5,event:{type:'timer.fire',resource:timer(1),now:5}},
];
export const delayWhenExample:readonly TimedEvent<DelayEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',now:1,value:1}},
  {time:1,event:{type:'callback.return',resource:resource('selector',0)}},
  {time:2,event:{type:'source.next',now:2,value:2}},
  {time:2,event:{type:'callback.return',resource:resource('selector',1)}},
  {time:3,event:{type:'source.complete'}},
  {time:4,event:{type:'duration.complete',resource:duration(0)}},
  {time:5,event:{type:'duration.next',resource:duration(1)}},
];
