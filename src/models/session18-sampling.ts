import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision, natural } from './session10-common.js';

/** Source-first sampling: source values are remembered, never forwarded on arrival.
 * sample uses a separate notifier; sampleTime uses a virtual periodic scheduler.
 * A presence bit distinguishes an actual null/undefined payload from no value.
 */
export type SamplingMode = 'sample' | 'sampleTime';
export type SamplingParameters = Readonly<{ mode: SamplingMode; period: number | null }>;
export type SamplingState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Listening'; hasValue: boolean; lastValue: T | null;
      notifier: 'open' | 'completed'; tick: number; due: number }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'error' | 'cancel' }>;
export type SamplingEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'notifier.next' | 'notifier.complete' }>
  | Readonly<{ type: 'notifier.error'; error: unknown }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.complete' }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'timer.fire'; resource: ResourceRef; now: number }>;
export type SamplingModel<T> = OperatorModel<SamplingParameters, SamplingState<T>, SamplingEvent<T>, Action<unknown>>;
const source: ResourceRef = { id: 'source', generation: 0 };
const notifier: ResourceRef = { id: 'notifier', generation: 0 };
const timer = (tick: number): ResourceRef => ({ id: 'periodic', generation: tick });
const acquire = (resource: ResourceRef): Action<unknown> => ({ type: 'subscribe', resource });
const release = (resource: ResourceRef): Action<unknown> => ({ type: 'unsubscribe', resource });
const next = (value: unknown): Action<unknown> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const complete: Action<unknown> = { type: 'notify', target: 'downstream', notification: { kind: 'C' } };
const error = (reason: unknown): Action<unknown> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: reason } });
const clock = (tick: number, delay: number): Action<unknown> =>
  ({ type: 'schedule', resource: timer(tick), delay });
const stopClock = (tick: number): Action<unknown> =>
  ({ type: 'cancel-timer', resource: timer(tick) });
const sourceRef = (path: string) => ({
  url: 'https://github.com/ReactiveX/rxjs/blob/' + pinnedRevision + '/' + path,
  revision: pinnedRevision, purpose: 'Pinned RxJS 7.8.2 sampling policy, scheduler and ownership'
});
const input = (type: string, origin: 'source' | 'inner' | 'timer' | 'downstream',
  category: 'notification' | 'time' | 'lifecycle', description: string) =>
  ({ type, origin, category, description });

export function createSamplingModel<T>(mode: SamplingMode, period: number | null = null): SamplingModel<T> {
  if (mode === 'sampleTime' && (!natural(period) || period === 0 || period > 1000))
    throw new RangeError('sampleTime virtual period must be a positive safe integer in 1..1000');
  if (mode === 'sample' && period !== null) throw new TypeError('sample does not take a timer period');
  const p: SamplingParameters = { mode, period };
  type S = SamplingState<T>; type E = SamplingEvent<T>; type A = Action<unknown>;
  type R = Rule<SamplingParameters, S, E, A>;
  const listening = (s: S): s is Extract<S,{phase:'Listening'}> => s.phase === 'Listening';
  const closed = (reason: 'complete' | 'error' | 'cancel'): S => ({ phase: 'Closed', reason });
  const releaseOther = (s: Extract<S,{phase:'Listening'}>): A[] =>
    mode === 'sample'
      ? s.notifier === 'open' ? [release(notifier)] : []
      : [stopClock(s.tick)];
  const matchesTick = (s:S,e:E): boolean => listening(s) && mode === 'sampleTime'
    && e.type === 'timer.fire' && e.resource.id === 'periodic'
    && e.resource.generation === s.tick && natural(e.now) && e.now === s.due;
  const readyNotifier = (s:S): boolean => listening(s) && mode === 'sample' && s.notifier === 'open';
  const rules: R[] = [];
  const add = (id:string,from:S['phase'],event:E['type'],to:S['phase'],guard:string,
    actions:readonly string[],explanation:string,nextState:string,
    enabled:(s:S,e:E)=>boolean,react:(s:S,e:E)=>{state:S;actions:readonly A[]}):void => {
    rules.push({ description: { id:'S18-'+mode.toUpperCase()+'-'+id,from,event,to,
      guard,actions,explanation,nextState,obligations:['S18-'+mode.toUpperCase()+'-'+id] },
      enabled,react });
  };
  add('START','Unsubscribed','subscribe','Listening','first result subscription',
    mode === 'sample'
      ? ['subscribe source before notifier']
      : ['subscribe source', 'schedule first virtual tick'],
    'Sampling does nothing until a consumer subscribes. Subscription to the source precedes clock/notifier setup.',
    'Listening with no remembered value and one sampling mechanism.',
    ()=>true,()=>({state:{phase:'Listening',hasValue:false,lastValue:null,
      notifier:'open',tick:0,due:mode === 'sampleTime' ? period! : 0},
      actions:mode === 'sample' ? [acquire(source),acquire(notifier)]
        : [acquire(source),clock(0,period!)]}));
  add('REMEMBER','Listening','source.next','Listening','live source emission (any payload)',
    ['replace remembered value with exact payload; no downstream notification'],
    'A new source value overwrites the previous value. No callbacks, timing or output occur on source.next.',
    'hasValue=true; lastValue replaced.',
    s=>listening(s),(s,e)=>{
      if (!listening(s) || e.type!=='source.next') throw Error('expected source next');
      return {state:{...s,hasValue:true,lastValue:e.value},actions:[]};
    });
  if (mode === 'sample') {
    for (const hasValue of [true,false]) {
      add(hasValue?'NOTIFIER-EMIT':'NOTIFIER-EMPTY','Listening','notifier.next','Listening',
        hasValue?'notifier next with pending value':'notifier next with no value since last sample',
        hasValue?['emit latest value once and clear presence']:['do not emit'],
        hasValue?'Each notifier next releases the most recent unsampled value exactly once.':
          'A notifier next without a new value does not duplicate old output.',
        'Clear remembered presence on every sample.',
        (s)=>readyNotifier(s)&&listening(s)&&s.hasValue===hasValue,
        s=>{if(!listening(s))throw Error('expected sampling state');
          return {state:{...s,hasValue:false,lastValue:null},
            actions:hasValue?[next(s.lastValue)]:[]};});
    }
    add('NOTIFIER-COMPLETE','Listening','notifier.complete','Listening',
      'notifier is open; completion is not a sampling notification',
      ['release notifier; do not flush latest value or terminate source'],
      'The pinned sample operator supplies noop as its notifier completion handler.',
      'Source continues with notifier completed and unsampled memory retained.',
      (s)=>readyNotifier(s),
      s=>{if(!listening(s))throw Error('expected notifier completion');
        return {state:{...s,notifier:'completed'},actions:[release(notifier)]};});
    add('NOTIFIER-ERROR','Listening','notifier.error','Closed','notifier is open',
      ['forward exact error','teardown source and notifier'],
      'Notifier failure fails the result and prevents further source emissions.',
      'Closed on error.',
      (s)=>readyNotifier(s),
      (_s,e)=>{
        if(e.type!=='notifier.error')throw Error('expected notifier error');
        return {state:closed('error'),actions:[error(e.error),release(source),release(notifier)]};
      });
  } else {
    for (const hasValue of [true,false]) {
      add(hasValue?'TICK-EMIT':'TICK-EMPTY','Listening','timer.fire','Listening',
        'current scheduled tick reaches due time; hasValue='+hasValue,
        hasValue?['emit latest unsampled value','schedule following tick']:['schedule following tick without output'],
        'sampleTime delegates to sample(interval(period,scheduler)); each tick samples at most one latest payload.',
        'No pending value and next periodic tick advances.',
        (s,e)=>matchesTick(s,e)&&listening(s)&&s.hasValue===hasValue
          &&Number.isSafeInteger(s.due+period!),
        s=>{if(!listening(s))throw Error('expected timer state');
          return {state:{...s,hasValue:false,lastValue:null,tick:s.tick+1,due:s.due+period!},
            actions:[...(hasValue?[next(s.lastValue)]:[]),clock(s.tick+1,period!)]};});
    }
  }
  add('COMPLETE','Listening','source.complete','Closed','source completes',
    ['complete immediately, without flushing pending value','release source and sampling mechanism'],
    'Source completion is not a sampling tick. Unobserved last values are discarded.',
    'Closed complete.',s=>listening(s),
    s=>{if(!listening(s))throw Error('expected completion');
      return {state:closed('complete'),actions:[complete,release(source),...releaseOther(s)]};});
  add('ERROR','Listening','source.error','Closed','source fails',
    ['forward exact error immediately','release source and sampling mechanism'],
    'Source errors terminate without flushing the pending value.',
    'Closed error.',s=>listening(s),
    (s,e)=>{if(!listening(s)||e.type!=='source.error')throw Error('expected source error');
      return {state:closed('error'),actions:[error(e.error),release(source),...releaseOther(s)]};});
  add('CANCEL','Listening','cancel','Closed','consumer cancels',
    ['release subscriptions or timer; never notify'],
    'Cancellation ends source and sampling ownership silently.',
    'Closed cancel.',s=>listening(s),
    s=>{if(!listening(s))throw Error('expected cancellation');
      return {state:closed('cancel'),actions:[release(source),...releaseOther(s)]};});

  const metadata: ModelMetadata = {
    schemaVersion:'1.1',id:mode+'-source-first-'+(period??'notifier'),operator:mode,rxjsVersion:'7.8.2',
    purpose:mode === 'sample'?'Sample a remembered latest source value on notifier next only.':
      'Sample a remembered source value at fixed virtual scheduler ticks.',
    cardinality: { signature:mode==='sample'?
      'sample(notifier$) : Cω(Signal) → T* → T*':
      'sampleTime(period,scheduler) : Cω(Time) → T* → T*',
      conditions:[
        'Each output corresponds to one distinct source value observed since the preceding sampling event.',
        'A sampling event without a pending value emits nothing. Intermediate overwritten values are dropped.',
        'Source completes/errors immediately; pending values do not flush on source termination.'
      ] },
    scope: {
      parameters:mode==='sample'?'One external Observable notifier, no scheduling or conversion of Promise inputs.':
        'Positive safe-integer period 1..1000 with a virtual FIFO scheduler and non-overlapping ticks.',
      callbacks:'No user predicate or projection; notifier payloads are ignored.',
      time:mode==='sample'?'Time belongs to the source and notifier; the operator introduces no clock.':
        'Ticks at period, 2×period, ... beginning at the subscription instant, using a supplied virtual scheduler.',
      reentrancy:'Atomic post-setup notifications, no simultaneous/torn-down scheduler action execution.',
      exclusions:[
        'Synchronous notifier activity while initial source/notifier subscriptions are being constructed.',
        'Non-Observable notifier inputs, source/observer reentrancy, throwing teardown and scheduler errors.',
        ...(mode==='sampleTime'?['Negative, zero, fractional or unbounded periods and custom scheduler implementations.']:[])
      ]
    },
    initialization:{control:'Unsubscribed',event:'subscribe',
      sourceSubscription:mode==='sample'?'Connect source first, then notifier.':
        'Connect source first and schedule the first periodic virtual tick.'},
    ownership:{state:'subscription-local',sharing:'None; one independent memory and clock/notifier per result subscription.',
      reset:'New subscription starts with hasValue=false and a new notifier or timer.',
      resources:mode==='sample'
        ?[{id:'source',kind:'subscription',owner:'result'},{id:'notifier',kind:'subscription',owner:'result'}]
        :[{id:'source',kind:'subscription',owner:'result'},{id:'periodic',kind:'timer',owner:'result tick generation'}]},
    dispatch:{policy:mode==='sample'?'atomic-non-reentrant':'scheduled',
      actionSemantics:'Value presence and clock generation are committed before downstream delivery. Tick resources are scheduler-owned.',
      cancellationCheckpoints:['Before each notifier/timer notification and on consumer cancellation.']},
    inputs:[
      input('subscribe','downstream','lifecycle','start the result'),
      input('source.next','source','notification','record latest value'),
      input('source.complete','source','notification','complete result immediately'),
      input('source.error','source','notification','fail result immediately'),
      input('cancel','downstream','lifecycle','cancel result'),
      ...(mode==='sample'?
        [input('notifier.next','inner','notification','sample on notifier next'),
          input('notifier.complete','inner','notification','notifier ends without sampling'),
          input('notifier.error','inner','notification','notifier fails')]:
        [input('timer.fire','timer','time','virtual scheduled sampling tick')])
    ],
    actionTypes:mode==='sample'?['subscribe','unsubscribe','notify']:
      ['subscribe','unsubscribe','notify','schedule','cancel-timer'],
    controls:[
      {id:'Unsubscribed',description:'cold description; no subscriptions or timers',terminal:false},
      {id:'Listening',description:'live source and newest unsampled value, if any',terminal:false},
      {id:'Closed',description:'complete/error/cancel; no further events admitted',terminal:true}
    ],
    sources:[sourceRef('src/internal/operators/'+mode+'.ts'),
      ...(mode==='sampleTime'?[sourceRef('src/internal/observable/interval.ts')]:[]),
      sourceRef('src/internal/operators/OperatorSubscriber.ts')],
    evidence:{modelTests:['tests/session18-model.test.mjs'],runtimeTests:['tests/session18-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-18.md'}
  };
  return {metadata,parameters:p,rules,initialState:()=>({phase:'Unsubscribed'}),
    control:s=>s.phase,
    validateState:s=>{
      const errors:string[]=[];
      if(listening(s)){
        if(!natural(s.tick)||!natural(s.due))errors.push('invalid timer state');
        if(mode==='sampleTime'&&s.due!==((s.tick+1)*period!))errors.push('tick must match scheduler period');
        if(mode==='sample'&&(s.tick!==0||s.due!==0))errors.push('sample may not own periodic clock');
        if(!s.hasValue&&s.lastValue!==null)errors.push('empty memory must be cleared');
        if(mode==='sampleTime'&&s.notifier!=='open')errors.push('periodic timer never completes itself');
      }
      return errors;
    },
    validateReaction:(before,event,result)=>[
      ...validateActionWord(result.actions),
      ...(event.type==='source.next'&&result.actions.some(a=>a.type==='notify')?
        ['source.next may only remember latest value']:[]),
      ...(event.type==='cancel'&&result.actions.some(a=>a.type==='notify')?
        ['cancellation must be silent']:[]),
      ...((event.type==='notifier.next'||event.type==='timer.fire')&&listening(before) &&
        result.actions.filter(a=>a.type==='notify').length!==Number(before.hasValue)?
        ['sample must notify iff a value has arrived since previous sampling']:[])
    ]};
}
export const createSampleModel = <T>(): SamplingModel<T> => createSamplingModel<T>('sample');
export const createSampleTimeModel = <T>(period=3): SamplingModel<T> =>
  createSamplingModel<T>('sampleTime',period);

export const sampleExample: readonly TimedEvent<SamplingEvent<string>>[] = [
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:'old'}},
  {time:2,event:{type:'source.next',value:'latest'}},
  {time:3,event:{type:'notifier.next'}},
  {time:4,event:{type:'notifier.next'}},
  {time:5,event:{type:'source.next',value:'discarded'}},
  {time:6,event:{type:'notifier.complete'}},
  {time:7,event:{type:'source.complete'}}
];
export const sampleTimeExample: readonly TimedEvent<SamplingEvent<string>>[] = [
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:'before tick'}},
  {time:3,event:{type:'timer.fire',resource:timer(0),now:3}},
  {time:4,event:{type:'source.next',value:'after tick'}},
  {time:6,event:{type:'timer.fire',resource:timer(1),now:6}},
  {time:7,event:{type:'source.complete'}}
];
