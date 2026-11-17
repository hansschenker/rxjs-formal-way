import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision } from './session10-common.js';

/** Shared state-dependent policy for throttle(durationSelector) and throttleTime(timer).
 * The selected scheduler is a virtual FIFO clock, never a wall-clock assumption.
 */
export type ThrottleMode='throttle'|'throttleTime';
export type ThrottleParameters=Readonly<{mode:ThrottleMode;leading:boolean;trailing:boolean;duration:number|null}>;
type Memory<T>=Readonly<{pending:boolean;value:T|null;window:number|null;nextWindow:number;due:number|null}>;
export type ThrottleState<T>=
  | Readonly<{phase:'Unsubscribed'}>
  | (Memory<T>&Readonly<{phase:'Active'}>)
  | (Memory<T>&Readonly<{phase:'Waiting'}>)
  | Readonly<{phase:'Closed';reason:'complete'|'error'|'cancel'}>;
export type ThrottleEvent<T>=
  | Readonly<{type:'subscribe'|'source.complete'|'cancel'}>
  | Readonly<{type:'source.next';value:T;now:number}>
  | Readonly<{type:'source.error';error:unknown}>
  | Readonly<{type:'duration.next'|'duration.complete';resource:ResourceRef}>
  | Readonly<{type:'duration.error';resource:ResourceRef;error:unknown}>
  | Readonly<{type:'timer.fire';resource:ResourceRef;now:number}>;
export type ThrottleModel<T>=OperatorModel<ThrottleParameters,ThrottleState<T>,ThrottleEvent<T>,Action<unknown>>;
const source:ResourceRef={id:'source',generation:0};
const ref=(id:string,generation:number):ResourceRef=>({id,generation});
const sub=(r:ResourceRef):Action<unknown>=>({type:'subscribe',resource:r});
const unsub=(r:ResourceRef):Action<unknown>=>({type:'unsubscribe',resource:r});
const next=(value:unknown):Action<unknown>=>({type:'notify',target:'downstream',notification:{kind:'N',value}});
const completed:Action<unknown>={type:'notify',target:'downstream',notification:{kind:'C'}};
const fail=(error:unknown):Action<unknown>=>({type:'notify',target:'downstream',notification:{kind:'E',error}});
const natural=(n:number)=>Number.isSafeInteger(n)&&n>=0;
const closed=(reason:'complete'|'error'|'cancel')=>({phase:'Closed' as const,reason});
const pin=(path:string)=>({url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,
  revision:pinnedRevision,purpose:'Pinned RxJS 7.8.2 duration and scheduling semantics'});

export function createThrottleModel<T>(mode:ThrottleMode,options:{
  leading?:boolean;trailing?:boolean;duration?:number
}={}):ThrottleModel<T> {
  const leading=options.leading??true,trailing=options.trailing??false;
  const duration=mode==='throttleTime'?options.duration??3:null;
  if(mode==='throttleTime'&&(!natural(duration!)||duration!<1||duration!>1000))
    throw RangeError('throttleTime scoped duration must be positive integer 1..1000');
  if(mode==='throttle'&&options.duration!==undefined)throw TypeError('throttle duration is selected by an Observable, not a configured timer');
  const p:ThrottleParameters={mode,leading,trailing,duration};
  type P=ThrottleParameters;type S=ThrottleState<T>;type E=ThrottleEvent<T>;type A=Action<unknown>;
  type Live=Extract<S,{phase:'Active'}>|Extract<S,{phase:'Waiting'}>;
  const active=(s:S):s is Extract<S,{phase:'Active'}>=>s.phase==='Active';
  const waiting=(s:S):s is Extract<S,{phase:'Waiting'}>=>s.phase==='Waiting';
  const live=(s:S):s is Live=>active(s)||waiting(s);
  const resource=(n:number)=>ref(mode==='throttle'?'duration':'throttle-timer',n);
  const start=(n:number):A[]=>mode==='throttle'?[sub(resource(n))]:
    [{type:'schedule',resource:resource(n),delay:duration!}];
  const stop=(n:number):A[]=>mode==='throttle'?[unsub(resource(n))]:
    [{type:'cancel-timer',resource:resource(n)}];
  const newWindow=(s:Live,now:number):Memory<T>=>({
    pending:false,value:null,window:s.nextWindow,nextWindow:s.nextWindow+1,
    due:mode==='throttleTime'?now+duration!:null
  });
  const due=(s:S,e:E):boolean=>{
    if(!live(s)||s.window===null||!('resource'in e))return false;
    if(e.resource.id!==resource(s.window).id||e.resource.generation!==s.window)return false;
    if(mode==='throttle')return e.type==='duration.next'||e.type==='duration.complete'||e.type==='duration.error';
    return e.type==='timer.fire'&&natural(e.now)&&e.now===s.due;
  };
  const timeOf=(e:E)=>e.type==='timer.fire'?e.now:0;
  const r=(id:string,from:S['phase'],kind:E['type'],to:S['phase'],guard:string,
    acts:string[],why:string,enabled:(s:S,e:E,q:P)=>boolean,
    react:(s:S,e:E,q:P)=>{state:S;actions:readonly A[]}):Rule<P,S,E,A>=>({
    description:{id:'S20-'+mode.toUpperCase()+'-'+id,from,event:kind,to,guard,actions:acts,explanation:why,
      nextState:to==='Closed'?'Terminal: all owned resources released.':'Subscription-local latest value and duration generation updated.',
      obligations:['S20-'+mode.toUpperCase()+'-'+id]},enabled,react
  });
  const rules:Rule<P,S,E,A>[]=[];
  rules.push(r('START','Unsubscribed','subscribe','Active','cold downstream connection',
    ['subscribe source; reset latest value and window generation'],
    'No timers or notifier subscriptions exist before downstream connects.',
    ()=>true,()=>({state:{phase:'Active',pending:false,value:null,window:null,nextWindow:0,due:null},actions:[sub(source)]})));
  for(const isLeading of [true,false]){
    rules.push(r(isLeading?'LEADING':'INITIAL-HOLD','Active','source.next','Active',
      'no active duration; leading='+isLeading+'; valid source clock',
      isLeading?['send incoming value immediately','start fresh duration']:
        ['retain latest value without output','start fresh duration'],
      isLeading?'Leading emits before its suppression window starts.':
        'Without leading, the initial value is eligible for trailing output when the duration signals.',
      (s,e,q)=>active(s)&&s.window===null&&e.type==='source.next'&&natural(e.now)&&q.leading===isLeading,
      (s,e)=>{
        if(!active(s)||e.type!=='source.next')throw Error('throttle opening');
        const n=s.nextWindow;
        return {state:{phase:'Active',pending:!isLeading,value:isLeading?null:e.value,window:n,
          nextWindow:n+1,due:mode==='throttleTime'?e.now+duration!:null},
          actions:[...(isLeading?[next(e.value)]:[]),...start(n)]};
      }));
  }
  rules.push(r('SUPPRESS','Active','source.next','Active','duration is active; clock valid',
    ['remember latest source value, replacing any prior candidate'],
    'Intermediate source values do not escape the active duration; presence distinguishes undefined values.',
    (s,e)=>active(s)&&s.window!==null&&e.type==='source.next'&&natural(e.now),
    (s,e)=>{
      if(!active(s)||e.type!=='source.next')throw Error('throttle suppress');
      return {state:{...s,pending:true,value:e.value},actions:[]};
    }));
  const endType=mode==='throttle'?'duration.next':'timer.fire';
  for(const flush of [true,false]){
    rules.push(r(flush?'DURATION-TRAILING':'DURATION-END','Active',endType,'Active',
      'matching active '+endType+' and trailing-pending='+flush,
      flush?['close previous duration','emit latest candidate','start new duration for emitted candidate']:
        ['close duration; do not emit'],
      flush?'Trailing send begins its own new suppression window if source is still live.':
        'A duration notification without a selected trailing candidate only unlocks the source.',
      (s,e,q)=>active(s)&&due(s,e)&&e.type===endType&&(q.trailing&&s.pending)===flush
        &&(!flush||(mode==='throttle'||timeOf(e)+duration!<=Number.MAX_SAFE_INTEGER)),
      (s,e)=>{
        if(!active(s)||s.window===null)throw Error('throttle duration');
        const actions:A[]=[...stop(s.window)];
        if(flush){
          const w=newWindow(s,timeOf(e));
          return {state:{phase:'Active',...w},
            actions:[...actions,next(s.value),...start(w.window!)]};
        }
        return {state:{...s,window:null,due:null},actions};
      }));
  }
  if(mode==='throttle'){
    rules.push(r('EMPTY-DURATION','Active','duration.complete','Active','matching duration completes without next',
      ['release empty duration, retain pending candidate but do not flush'],
      'Pinned throttle cleanupThrottling does not call send() on empty duration completion.',
      (s,e)=>active(s)&&due(s,e),
      s=>{if(!active(s)||s.window===null)throw Error('empty duration');return {
        state:{...s,window:null,due:null},actions:[unsub(resource(s.window))]};}));
  }
  rules.push(r('COMPLETE-WAIT','Active','source.complete','Waiting',
    'trailing enabled and pending candidate with active duration',
    ['release completed source; wait for duration next/complete'],
    'Source completion waits only when a trailing candidate is pending in an active window.',
    (s,_e,q)=>active(s)&&q.trailing&&s.pending&&s.window!==null,
    s=>{if(!active(s))throw Error('wait completion');return{
      state:{...s,phase:'Waiting'},actions:[unsub(source)]};}));
  rules.push(r('COMPLETE-NOW','Active','source.complete','Closed',
    'not waiting for a trailing candidate',
    ['complete output immediately; release source and duration'],
    'No hidden timer delays source completion unless a trailing candidate requires it.',
    (s,_e,q)=>active(s)&&!(q.trailing&&s.pending&&s.window!==null),
    s=>{if(!active(s))throw Error('complete');return {state:closed('complete'),
      actions:[completed,unsub(source),...(s.window===null?[]:stop(s.window))]};}));
  rules.push(r('WAIT-FLUSH','Waiting',endType,'Closed','matching duration sends pending trailing value',
    ['release duration','emit latest candidate','complete downstream'],
    'After outer completion the trailing emission cannot schedule another duration.',
    (s,e)=>waiting(s)&&due(s,e),
    s=>{if(!waiting(s)||s.window===null)throw Error('wait flush');
      return {state:closed('complete'),actions:[...stop(s.window),next(s.value),completed]};}));
  if(mode==='throttle'){
    rules.push(r('WAIT-EMPTY','Waiting','duration.complete','Closed',
      'duration completes without next while source already completed',
      ['complete without trailing emission'],
      'Empty duration completion cleanup is not endThrottling and does not send the pending value.',
      (s,e)=>waiting(s)&&due(s,e),
      s=>{if(!waiting(s)||s.window===null)throw Error('wait empty');
        return {state:closed('complete'),actions:[unsub(resource(s.window)),completed]};}));
  }
  for(const phase of ['Active','Waiting'] as const){
    if(mode==='throttle'){
      rules.push(r('DURATION-ERROR-'+phase.toUpperCase(),phase,'duration.error','Closed',
        'correlated duration fails',
        ['forward exact duration error; tear down all active resources'],
        'An inner duration error terminates the result immediately, regardless of outer completion.',
        (s,e)=>s.phase===phase&&due(s,e), (s,e)=>{
          if(!live(s)||s.window===null||e.type!=='duration.error')throw Error('duration error');
          return {state:closed('error'),actions:[fail(e.error),...(phase==='Active'?[unsub(source)]:[]),...stop(s.window)]};
        }));
    }
    rules.push(r('CANCEL-'+phase.toUpperCase(),phase,'cancel','Closed','consumer cancels',
      ['silently dispose owned source and active duration/timer'],
      'Cancellation releases pending work, never flushes buffered values.',
      s=>s.phase===phase,s=>{
        if(!live(s))throw Error('cancel');
        return {state:closed('cancel'),actions:[...(phase==='Active'?[unsub(source)]:[]),
          ...(s.window===null?[]:stop(s.window))]};
      }));
  }
  rules.push(r('SOURCE-ERROR','Active','source.error','Closed','source fails before completing',
    ['forward source error identity; release source and duration'],
    'Errors never flush a trailing candidate.',
    s=>active(s),(s,e)=>{
      if(!active(s)||e.type!=='source.error')throw Error('source error');
      return {state:closed('error'),actions:[fail(e.error),unsub(source),...(s.window===null?[]:stop(s.window))]};
    }));
  const inputs:ModelMetadata['inputs']=[
    {type:'subscribe',origin:'downstream',category:'lifecycle',description:'start a cold source subscription'},
    {type:'source.next',origin:'source',category:'notification',description:'source value with virtual current time'},
    {type:'source.complete',origin:'source',category:'notification',description:'source successfully finishes'},
    {type:'source.error',origin:'source',category:'notification',description:'source fails with exact error'},
    {type:'cancel',origin:'downstream',category:'lifecycle',description:'consumer closes connection'},
    ...(mode==='throttle'?[
      {type:'duration.next',origin:'inner' as const,category:'notification' as const,description:'duration selector observable emits'},
      {type:'duration.complete',origin:'inner' as const,category:'notification' as const,description:'duration completes without next'},
      {type:'duration.error',origin:'inner' as const,category:'notification' as const,description:'duration fails'}
    ]:[{type:'timer.fire',origin:'timer' as const,category:'time' as const,description:'virtual timer fires at due time'}])
  ];
  const metadata:ModelMetadata={
    schemaVersion:'1.1',id:'session20-'+mode+'-leading-'+leading+'-trailing-'+trailing,operator:mode,rxjsVersion:'7.8.2',
    purpose:'Throttle source values with explicit leading/trailing and duration lifetime policy.',
    cardinality:{signature:mode==='throttle'?
      'throttle(durationSelector,config): Cω(Signal,Policy) → T* → T*':
      'throttleTime(duration,scheduler,config): Cω(Time,Policy) → T* → T*',
      conditions:['At most one leading emission per unlocked source arrival.',
        'While throttled, only the latest value remains eligible for trailing output.',
        'Trailing emissions start new durations while source remains active.',
        'Completion may wait for a pending trailing value; cancellation and errors never flush.']},
    scope:{parameters:mode==='throttle'?
      'durationSelector returning one ordinary Observable for each selected source value; leading/trailing booleans.':
      'Positive integer virtual duration 1..1000, FIFO virtual TestScheduler; leading/trailing booleans.',
      callbacks:mode==='throttle'?'Synchronous total selector returning Observable; selector errors excluded.':
        'No user callback; throttleTime delegates to throttle(() => timer(duration,scheduler)).',
      time:mode==='throttle'?'Duration subscription controls silence; no built-in clock.':
        'Source next supplies virtual now; timer scheduled duration units after each emitted/selected value.',
      reentrancy:'Atomic non-reentrant source/duration events, no synchronous duration emissions during assignment.',
      exclusions:['Synchronous duration Observable during startThrottle assignment; Promise/Iterable conversion.',
        'Arbitrary downstream reentrancy, throwing selectors/teardown, custom scheduler behavior.',
        ...(mode==='throttleTime'?['Zero, negative, fractional and >1000 durations.']:[])]},
    initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'Subscribe to source lazily when downstream connects.'},
    ownership:{state:'subscription-local',sharing:'No sharing: window, latest candidate and clock independent for each subscriber.',
      reset:'Fresh presence bit and duration generation per connection; no events after Closed.',
      resources:[{id:'source',kind:'subscription',owner:'result'},
        {id:mode==='throttle'?'duration':'throttle-timer',kind:mode==='throttle'?'subscription':'timer',owner:'active window generation'}]},
    dispatch:{policy:mode==='throttleTime'?'scheduled':'atomic-non-reentrant',
      actionSemantics:'End current window before sending a trailing candidate. The event clock, not wall-clock time, chooses due time.',
      cancellationCheckpoints:['Before source/duration next and after downstream closes.']},
    inputs,actionTypes:mode==='throttle'?['subscribe','unsubscribe','notify']:
      ['subscribe','unsubscribe','notify','schedule','cancel-timer'],
    controls:[
      {id:'Unsubscribed',description:'no producer or duration yet',terminal:false},
      {id:'Active',description:'source live; possibly one duration and latest candidate',terminal:false},
      {id:'Waiting',description:'source completed with trailing candidate awaiting duration',terminal:false},
      {id:'Closed',description:'completed, failed or cancelled; no further notifications legal',terminal:true}
    ],
    sources:[pin('src/internal/operators/'+mode+'.ts'),
      ...(mode==='throttleTime'?[pin('src/internal/operators/throttle.ts'),pin('src/internal/observable/timer.ts')]:[])],
    evidence:{status:'source-inspected',record:'evidence/SESSION-20.md',
      modelTests:['tests/session20-model.test.mjs'],runtimeTests:['tests/session20-rxjs.test.mjs']}
  };
  const validState=(s:S):string[]=>{
    if(!live(s))return [];
    const issues:string[]=[];
    if(!natural(s.nextWindow))issues.push('bad next window generation');
    if(s.window!==null&&(!natural(s.window)||s.window>=s.nextWindow))issues.push('bad active window');
    if(mode==='throttleTime'&&s.window!==null&&(!natural(s.due!)||s.due===null))issues.push('timer due missing');
    if(s.phase==='Waiting'&&(!p.trailing||!s.pending||s.window===null))issues.push('illegal waiting phase');
    return issues;
  };
  return {metadata,parameters:p,initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:validState,validateReaction:(_s,_e,reaction)=>validateActionWord(reaction.actions),
    rules};
}
export const createThrottleSignalModel=<T>(config:{leading?:boolean;trailing?:boolean}={}):ThrottleModel<T> =>
  createThrottleModel<T>('throttle',config);
export const createThrottleTimeModel=<T>(duration:number,config:{leading?:boolean;trailing?:boolean}={}):ThrottleModel<T> =>
  createThrottleModel<T>('throttleTime',{...config,duration});

const d=(generation:number):ResourceRef=>ref('duration',generation);
const t=(generation:number):ResourceRef=>ref('throttle-timer',generation);
export const throttleExample:readonly TimedEvent<ThrottleEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:'A',now:1}},
  {time:2,event:{type:'source.next',value:'B',now:2}},
  {time:3,event:{type:'duration.next',resource:d(0)}},
  {time:4,event:{type:'source.next',value:'C',now:4}},
  {time:5,event:{type:'source.complete'}},
  {time:6,event:{type:'duration.next',resource:d(1)}}
];
export const throttleTimeExample:readonly TimedEvent<ThrottleEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:'A',now:1}},
  {time:2,event:{type:'source.next',value:'B',now:2}},
  {time:4,event:{type:'timer.fire',resource:t(0),now:4}},
  {time:5,event:{type:'source.next',value:'C',now:5}},
  {time:6,event:{type:'source.complete'}},
  {time:7,event:{type:'timer.fire',resource:t(1),now:7}}
];
