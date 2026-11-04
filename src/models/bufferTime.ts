import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent, Trace } from '../schema.js';
import { runTrace, validateActionWord } from '../runner.js';

export type BufferTimeParameters = Readonly<{
  span: number; creationInterval: number | null; maxBufferSize: number | null;
}>;
export type TimedBuffer<T> = Readonly<{
  id: number; startedAt: number; closesAt: number; values: readonly T[];
}>;
export type BufferTimeState<T> =
  | Readonly<{ phase:'Unsubscribed' }>
  | Readonly<{ phase:'Active'; now:number; nextWindowId:number; nextCreationId:number;
      windows: readonly TimedBuffer<T>[]; creationAt:number|null; creation:ResourceRef|null }>
  | Readonly<{ phase:'Closed'; now:number; reason:'complete'|'source-error'|'cancel' }>;
export type BufferTimeEvent<T> =
  | Readonly<{type:'subscribe'|'source.complete'|'cancel';now:number}>
  | Readonly<{type:'source.next';now:number;value:T}>
  | Readonly<{type:'source.error';now:number;error:unknown}>
  | Readonly<{type:'window.fire'|'creation.fire';now:number;resource:ResourceRef}>;
export type BufferTimeModel<T> = OperatorModel<BufferTimeParameters,BufferTimeState<T>,BufferTimeEvent<T>,Action<T[]>>;

const rev='e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const source={id:'source',generation:0} as const;
const acquire={type:'subscribe',resource:source} as const;
const release={type:'unsubscribe',resource:source} as const;
const done={type:'notify',target:'downstream',notification:{kind:'C'}} as const;
const wref=(id:number):ResourceRef=>({id:'buffer-window',generation:id});
const cref=(id:number):ResourceRef=>({id:'buffer-creation',generation:id});
const same=(a:ResourceRef,b:ResourceRef):boolean=>a.id===b.id&&a.generation===b.generation;
const next=<T>(values:readonly T[]):Action<T[]>=>({type:'notify',target:'downstream',notification:{kind:'N',value:[...values]}});
const error=<T>(value:unknown):Action<T[]>=>({type:'notify',target:'downstream',notification:{kind:'E',error:value}});
const natural=(n:number):boolean=>Number.isSafeInteger(n)&&n>=0;

function metadata(p:BufferTimeParameters):ModelMetadata{
  const overlap=p.creationInterval!==null;
  return {
    schemaVersion:'1.1',id:'bufferTime-'+p.span+(overlap?'-every-'+p.creationInterval:'-restart')+
      (p.maxBufferSize===null?'':'-max-'+p.maxBufferSize),
    operator:'bufferTime',rxjsVersion:'7.8.2',
    purpose:'Accumulate source values in time-bounded windows, possibly overlapping, and emit each window on its timer or size threshold.',
    cardinality:{signature:'bufferTime(span,creation?,max?) : T* -> (T*)*',
      conditions:['Each window yields one array; empty windows also emit on timer expiry.',
        'A creation interval opens overlapping windows; omitted interval restarts one window on every close.',
        'A maximum size can close a window early, before its timer; completion flushes all open windows and errors/cancellation discard.',
        'When a value fills a window, a replacement window opened by this value does not receive that same value.']},
    scope:{parameters:'Positive safe-integer span, optional positive safe-integer creation interval, optional positive safe-integer max size; bounded virtual clock/timer generations',
      callbacks:'No user callback. Emitted arrays contain retained source references in arrival order.',
      time:'External monotone safe-integer clock. Timer fires are explicit events, never inferred from a deadline; due firings are allowed late but not early. Equal-time order is explicit.',
      reentrancy:'Deferred, non-reentrant scheduler and nonthrowing observers. Source notifications and timer firings are atomic, ordered by event sequence.',
      exclusions:['Negative/NaN/fractional/unsafe spans, zero span or zero creation interval, custom inline schedulers, arbitrary scheduler jitter guarantees.',
        'Reentrant observer/source events during a timer callback or buffer emission, throwing finalizers and cancellation inside delivery.',
        'Exact JS SchedulerAction identities, operator internals of Date.now and universal state-space equivalence.']},
    initialization:{control:'Unsubscribed',event:'subscribe',
      sourceSubscription:'Start one empty window and its closing timer before acquiring the source; if creation interval is supplied schedule repeated window openings.'},
    ownership:{state:'subscription-local',
      sharing:'No sharing. Each result subscription owns independent scheduled windows and accumulation arrays.',
      reset:'Fresh window identities and timer schedules on each subscription; terminal state drops all buffers.',
      resources:[{id:'source',kind:'subscription',owner:'current execution'},
        {id:'buffer-window',kind:'timer',owner:'each window generation'},
        ...(overlap?[{id:'buffer-creation',kind:'timer' as const,owner:'repeating creation schedule'}]:[])]},
    dispatch:{policy:'scheduled',
      actionSemantics:'A source next is copied into the windows open before that next. Full windows are removed then emitted; a no-interval replacement opens only after the value is processed. Expired window fires remove, emit, and optionally reopen.',
      cancellationCheckpoints:['Between external source, window and creation events; no silent final flush.',
        'All logical timers are cancelled on error or cancellation; the exact host Action object is intentionally abstracted.']},
    inputs:[
      {type:'subscribe',origin:'downstream',category:'lifecycle',description:'start windows and source'},
      {type:'source.next',origin:'source',category:'notification',description:'append value to currently open windows'},
      {type:'source.complete',origin:'source',category:'notification',description:'emit all active windows and complete'},
      {type:'source.error',origin:'source',category:'notification',description:'error without flush'},
      {type:'cancel',origin:'downstream',category:'lifecycle',description:'drop windows silently'},
      {type:'window.fire',origin:'timer',category:'time',description:'matching window reaches closing time'},
      ...(overlap?[{type:'creation.fire',origin:'timer' as const,category:'time' as const,
        description:'repeating interval opens an additional window'}]:[]),
    ],
    actionTypes:['subscribe','schedule','cancel-timer','notify','unsubscribe'],
    controls:[{id:'Unsubscribed',description:'not connected',terminal:false},
      {id:'Active',description:'windows and schedules active',terminal:false},
      {id:'Closed',description:'terminal or cancelled',terminal:true}],
    sources:['src/internal/operators/bufferTime.ts','src/internal/util/executeSchedule.ts',
      'src/internal/operators/OperatorSubscriber.ts','src/internal/Subscription.ts'].map(path=>({
        url:'https://github.com/ReactiveX/rxjs/blob/'+rev+'/'+path,revision:rev,
        purpose:'Pinned time-window scheduling, max-size early flush, overlap and terminal behavior'})),
    evidence:{modelTests:['tests/session07-buffer-model.test.mjs'],
      runtimeTests:['tests/session07-buffer-rxjs.test.mjs'],status:'source-inspected',record:'evidence/SESSION-07.md'},
  };
}
export function createBufferTimeModel<T>(span:number,creationInterval:number|null=null,
  maxBufferSize:number|null=null):BufferTimeModel<T>{
  if(!natural(span)||span===0||!natural(span+(creationInterval??0))||
      (creationInterval!==null&&(!natural(creationInterval)||creationInterval===0))||
      (maxBufferSize!==null&&(!natural(maxBufferSize)||maxBufferSize===0)))
    throw new RangeError('bufferTime scoped model requires positive safe-integer span/interval/max');
  const p:BufferTimeParameters={span,creationInterval,maxBufferSize};
  type S=BufferTimeState<T>;type E=BufferTimeEvent<T>;type R=Rule<BufferTimeParameters,S,E,Action<T[]>>;
  const description=(id:string,event:string,guard:string,to:string,actions:readonly string[],nextState:string,
    explanation:string):R['description']=>({
    id:'BUFFERTIME-'+id,from:id==='INIT'?'Unsubscribed':'Active',event,guard,to,actions,nextState,explanation,
    obligations:['S7-BUFFERTIME-'+id],
  });
  const clock=(s:S,e:E)=>natural(e.now)&&(s.phase==='Unsubscribed'||e.now>=s.now);
  const newWindow=(id:number,now:number):TimedBuffer<T>=>({id,startedAt:now,closesAt:now+span,values:[]});
  const scheduleWindow=(id:number):Action<T[]>=>({type:'schedule',resource:wref(id),delay:span});
  const cancelWindow=(w:TimedBuffer<T>):Action<T[]>=>({type:'cancel-timer',resource:wref(w.id)});
  const closeResources=(s:S):Action<T[]>[]=>s.phase==='Active'?
    [...s.windows.map(cancelWindow),...(s.creation?[{type:'cancel-timer' as const,resource:s.creation}]:[])]:[];
  const rules:R[]=[
    {
      description:description('INIT','subscribe','fresh clock and representable initial deadlines','Active',
        ['schedule initial closing timer','schedule creation interval if configured','subscribe source'],
        'active with one empty window and optional creation timer',
        'On subscription a first empty window opens; no source value is needed to start time accumulation.'),
      enabled:(_s,e)=>clock(_s,e)&&natural(e.now+span)&&
        (creationInterval===null||natural(e.now+creationInterval)),
      react:(_s,e)=>{
        const initial=newWindow(0,e.now);
        const creation=creationInterval===null?null:cref(0);
        return {state:{phase:'Active',now:e.now,nextWindowId:1,nextCreationId:creation?1:0,
          windows:[initial],creationAt:creationInterval===null?null:e.now+creationInterval,creation},
          actions:[scheduleWindow(0),...(creation?[{type:'schedule' as const,resource:creation,delay:creationInterval!}]:[]),acquire]};
      },
    },
    {
      description:description('NEXT','source.next','valid clock, window counter and capacity','Active',
        ['append to windows open before this notification','close full windows; emit arrays in opening order','restart if no creation interval'],
        'active with unfilled buffers and new timer identities',
        'A source next updates every already-open window. At a size threshold, windows close early and can cause a new non-overlap window to begin.'),
      enabled:(s,e)=>clock(s,e)&&s.phase==='Active'&&s.nextWindowId<Number.MAX_SAFE_INTEGER&&
        natural(e.now+span),
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='source.next')throw new Error('invalid bufferTime source next');
        const updated=s.windows.map(w=>({...w,values:[...w.values,e.value]}));
        const full=updated.filter(w=>maxBufferSize!==null&&w.values.length>=maxBufferSize);
        const live=updated.filter(w=>!full.includes(w));
        const restart=creationInterval===null&&full.length>0;
        const fresh=restart?newWindow(s.nextWindowId,e.now):null;
        return {state:{...s,now:e.now,nextWindowId:s.nextWindowId+(restart?1:0),
            windows:[...live,...(fresh?[fresh]:[])]},
          actions:[...full.flatMap(w=>[cancelWindow(w),next(w.values)]),
            ...(fresh?[scheduleWindow(fresh.id)]:[])]};
      },
    },
    {
      description:description('WINDOW-FIRE','window.fire','matching live window and due deadline','Active',
        ['cancel matching timer','emit this window, including empty','restart if no creation interval'],
        'active with remaining windows and optional new window',
        'A timer firing at or after the deadline closes its own window. A late timer does not backdate output.'),
      enabled:(s,e)=>clock(s,e)&&s.phase==='Active'&&e.type==='window.fire'&&
        s.windows.some(w=>same(wref(w.id),e.resource)&&e.now>=w.closesAt)&&
        s.nextWindowId<Number.MAX_SAFE_INTEGER&&natural(e.now+span),
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='window.fire')throw new Error('invalid bufferTime window firing');
        const w=s.windows.find(w=>same(wref(w.id),e.resource));
        if(!w)throw new Error('window must exist');
        const fresh=creationInterval===null?newWindow(s.nextWindowId,e.now):null;
        return {state:{...s,now:e.now,nextWindowId:s.nextWindowId+(fresh?1:0),
            windows:[...s.windows.filter(x=>x.id!==w.id),...(fresh?[fresh]:[])]},
          actions:[cancelWindow(w),next(w.values),...(fresh?[scheduleWindow(fresh.id)]:[])]};
      },
    },
    {
      description:description('SOURCE-COMPLETE','source.complete','valid clock','Closed',
        ['emit all remaining buffers in opening order','complete downstream','cancel timers and release source'],
        'closed with no active windows',
        'Source completion flushes every currently open window (including an empty one) and does not open another.'),
      enabled:clock,
      react:(s,e)=>{
        if(s.phase!=='Active')throw new Error('invalid bufferTime completion');
        return {state:{phase:'Closed',now:e.now,reason:'complete'},
          actions:[...s.windows.map(w=>next(w.values)),done,...closeResources(s),release]};
      },
    },
    {
      description:description('SOURCE-ERROR','source.error','valid clock','Closed',
        ['forward source error unchanged','cancel timers and discard all buffered values','release source'],
        'closed because of error','An error does not emit any currently accumulated window.'),
      enabled:clock,
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='source.error')throw new Error('invalid bufferTime error');
        return {state:{phase:'Closed',now:e.now,reason:'source-error'},
          actions:[error<T>(e.error),...closeResources(s),release]};
      },
    },
    {
      description:description('CANCEL','cancel','valid clock between reactions','Closed',
        ['cancel all timers','release source without downstream notification'],
        'closed with all buffers discarded','Downstream cancellation releases resources and never flushes.'),
      enabled:clock,
      react:(s,e)=>({state:{phase:'Closed',now:e.now,reason:'cancel'},actions:[...closeResources(s),release]}),
    },
  ];
  if(creationInterval!==null)rules.push({
    description:description('CREATION-FIRE','creation.fire','matching interval generation and due scheduled creation','Active',
      ['open another empty buffer with closing timer','schedule next creation interval'],
      'active with one additional open window',
      'The creation interval opens new time windows independent of current window lifetimes.'),
    enabled:(s,e)=>clock(s,e)&&s.phase==='Active'&&e.type==='creation.fire'&&
      s.creation!==null&&same(s.creation,e.resource)&&s.creationAt!==null&&e.now>=s.creationAt&&
      s.nextWindowId<Number.MAX_SAFE_INTEGER&&s.nextCreationId<Number.MAX_SAFE_INTEGER&&
      natural(e.now+span)&&natural(e.now+creationInterval),
    react:(s,e)=>{
      if(s.phase!=='Active')throw new Error('invalid buffer creation');
      const w=newWindow(s.nextWindowId,e.now);
      const creation=cref(s.nextCreationId);
      return {state:{...s,now:e.now,nextWindowId:s.nextWindowId+1,
          nextCreationId:s.nextCreationId+1,windows:[...s.windows,w],
          creationAt:e.now+creationInterval,creation},
        actions:[{type:'cancel-timer',resource:s.creation!},scheduleWindow(w.id),
          {type:'schedule',resource:creation,delay:creationInterval}]};
    },
  });
  return {
    metadata:metadata(p),parameters:p,rules,
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>{
      if(s.phase==='Unsubscribed')return [];
      if(!natural(s.now))return ['invalid clock'];
      if(s.phase==='Closed')return ['complete','source-error','cancel'].includes(s.reason)?[]:['invalid close reason'];
      if(!natural(s.nextWindowId)||!natural(s.nextCreationId)||!Array.isArray(s.windows))return ['invalid window counters'];
      if((creationInterval===null)!==(s.creation===null)|| (s.creation===null)!==(s.creationAt===null))
        return ['invalid creation schedule'];
      if(s.creation&&(!natural(s.creationAt!)||s.creation.id!=='buffer-creation'||s.creation.generation!==s.nextCreationId-1))
        return ['invalid creation generation'];
      const ids=new Set<number>();
      for(const w of s.windows){
        if(!natural(w.id)||w.id>=s.nextWindowId||ids.has(w.id)||!natural(w.startedAt)||
          w.closesAt!==w.startedAt+span||!natural(w.closesAt)||w.startedAt>s.now||
          !Array.isArray(w.values)||(maxBufferSize!==null&&w.values.length>=maxBufferSize))
          return ['invalid window state'];
        ids.add(w.id);
      }
      return [];
    },
    validateReaction:(s,e,r)=>{
      const problems=[...validateActionWord(r.actions)];
      if(r.state.phase==='Unsubscribed'||r.state.now!==e.now)problems.push('reaction clock mismatch');
      if(r.actions.some(a=>a.type==='notify'&&a.target!=='downstream'))problems.push('invalid output target');
      if(['source.error','cancel'].includes(e.type)&&r.actions.some(a=>a.type==='notify'&&a.notification.kind==='N'))
        problems.push('cancellation/error flushed a window');
      if(e.type==='source.next'&&s.phase==='Active'&&r.state.phase==='Active'){
        const emitted=r.actions.filter(a=>a.type==='notify'&&a.notification.kind==='N');
        const full=s.windows.filter(w=>maxBufferSize!==null&&w.values.length+1>=maxBufferSize).length;
        if(emitted.length!==full)problems.push('incorrect early buffer flush');
      }
      return problems;
    },
  };
}
export function runBufferTimeTrace<T>(model:BufferTimeModel<T>,events:readonly TimedEvent<BufferTimeEvent<T>>[],
  opts:Readonly<{executionId:string;maxSteps?:number}>):Trace<BufferTimeState<T>,BufferTimeEvent<T>,Action<T[]>>{
  if(events.some(x=>x.time!==x.event.now))throw new Error('trace envelope clock mismatch');
  return runTrace(model,events,opts);
}
export const bufferTimeExample:readonly TimedEvent<BufferTimeEvent<number>>[]=[
  {time:0,event:{type:'subscribe',now:0}},
  {time:1,event:{type:'source.next',now:1,value:1}},
  {time:2,event:{type:'source.next',now:2,value:2}},
  {time:3,event:{type:'window.fire',now:3,resource:wref(0)}},
  {time:4,event:{type:'source.next',now:4,value:3}},
  {time:5,event:{type:'source.complete',now:5}},
];
export const bufferTimeOverlapExample:readonly TimedEvent<BufferTimeEvent<number>>[]=[
  {time:0,event:{type:'subscribe',now:0}},
  {time:1,event:{type:'source.next',now:1,value:1}},
  {time:2,event:{type:'creation.fire',now:2,resource:cref(0)}},
  {time:3,event:{type:'source.next',now:3,value:2}},
  {time:4,event:{type:'window.fire',now:4,resource:wref(0)}},
  {time:6,event:{type:'window.fire',now:6,resource:wref(1)}},
  {time:7,event:{type:'source.complete',now:7}},
];
