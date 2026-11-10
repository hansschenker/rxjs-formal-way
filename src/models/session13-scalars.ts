import type { Action, Control, InputDescriptor, ModelMetadata, OperatorModel, ResourceRef, Rule, RuleDescription, TimedEvent } from '../schema.js';
import { actionErrors, source, subscribe, unsubscribe, next, complete, error, pinnedRevision } from './session10-common.js';

/** Session 13: notification policies; opaque values are never examined by the operator. */
type TerminalReason = 'complete' | 'source-error' | 'predicate-error' | 'empty' | 'cancel';
export type SimpleSourceEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;

const sourceInputs: readonly InputDescriptor[] = [
  { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'start a fresh lazy execution' },
  { type: 'source.next', origin: 'source', category: 'notification', description: 'receive an opaque source value' },
  { type: 'source.complete', origin: 'source', category: 'notification', description: 'normal source completion' },
  { type: 'source.error', origin: 'source', category: 'notification', description: 'source failure with original error identity' },
  { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'silent downstream cancellation' },
];
const controls = (calling = false): readonly Control[] => [
  { id: 'Unsubscribed', description: 'description exists, source is not yet connected', terminal: false },
  { id: 'Active', description: 'one source execution is connected', terminal: false },
  ...(calling ? [{ id: 'Calling', description: 'one indexed predicate invocation is awaiting a correlated outcome', terminal: false }] : []),
  { id: 'Closed', description: 'completed, failed or cancelled; no later events are legal', terminal: true },
];
const ruleDesc = (operator: string, id: string, from: string, event: string, to: string,
  guard: string, actions: readonly string[], explanation: string): RuleDescription => ({
  id: 'S13-' + operator.toUpperCase() + '-' + id, from, event, to, guard, actions,
  nextState: to === 'Closed' ? 'terminal with no owned work' : 'updated control and subscription-local memory',
  obligations: ['S13-' + operator.toUpperCase() + '-' + id], explanation,
});
type Meta = Readonly<{
  operator: string; id: string; purpose: string; signature: string; conditions: readonly string[];
  parameters: string; callbacks: string; time: string; exclusions: readonly string[];
  sourcePaths: readonly string[]; calling?: boolean; inputs?: readonly InputDescriptor[];
}>;
const metadata = (c: Meta): ModelMetadata => ({
  schemaVersion: '1.1', rxjsVersion: '7.8.2', id: c.id, operator: c.operator,
  purpose: c.purpose,
  cardinality: { signature: c.signature, conditions: [...c.conditions,
    'Cω describes next cardinality. Error, complete, cancellation, and resource release are separate events.'] },
  scope: {
    parameters: c.parameters, callbacks: c.callbacks, time: c.time,
    reentrancy: 'Atomic non-reentrant source and callback-outcome steps. User observers may not synchronously re-enter the modeled execution.',
    exclusions: c.exclusions,
  },
  initialization: { control: 'Unsubscribed', event: 'subscribe',
    sourceSubscription: 'Acquire one upstream subscription only when the resulting Observable is subscribed.' },
  ownership: {
    state: 'subscription-local',
    sharing: 'No sharing, replay, or global storage; every output subscription has an independent machine.',
    reset: 'Fresh state on each output subscription; Closed rejects later events.',
    resources: [
      { id: 'source', kind: 'subscription', owner: 'current result subscription' },
      ...(c.calling ? [{ id: 'predicate', kind: 'callback' as const, owner: 'one indexed last predicate invocation' }] : []),
    ],
  },
  dispatch: { policy: 'atomic-non-reentrant',
    actionSemantics: 'Commit state, then deliver ordered next/terminal/connection actions. Callback outcomes are supplied externally.',
    cancellationCheckpoints: ['Between resolved source events; silence on cancellation.'] },
  inputs: c.inputs ?? sourceInputs, actionTypes: c.calling
    ? ['subscribe', 'unsubscribe', 'notify', 'invoke-callback'] : ['subscribe', 'unsubscribe', 'notify'],
  controls: controls(c.calling),
  sources: c.sourcePaths.map(path => ({
    url: 'https://github.com/ReactiveX/rxjs/blob/' + pinnedRevision + '/' + path,
    revision: pinnedRevision, purpose: 'Pinned RxJS 7.8.2 operator implementation and lifecycle',
  })),
  evidence: { modelTests: ['tests/session13-model.test.mjs'],
    runtimeTests: ['tests/session13-rxjs.test.mjs'],
    status: 'source-inspected', record: 'evidence/SESSION-13.md' },
});
const terminal = (reason: TerminalReason) => ({ phase: 'Closed' as const, reason });
const validPhase = (phase: string, calling: boolean) =>
  ['Unsubscribed', 'Active', 'Closed', ...(calling ? ['Calling'] : [])].includes(phase);

export type IgnoreElementsState =
  | Readonly<{ phase: 'Unsubscribed' | 'Active' }>
  | Readonly<{ phase: 'Closed'; reason: TerminalReason }>;
export type IgnoreElementsEvent<T> = SimpleSourceEvent<T>;
export type IgnoreElementsModel<T> = OperatorModel<Readonly<{ mode: 'discard-next' }>,
  IgnoreElementsState, IgnoreElementsEvent<T>, Action<never>>;

/** Ignore every source next, not the source's completion or failure. */
export function createIgnoreElementsModel<T>(): IgnoreElementsModel<T> {
  type P = Readonly<{ mode: 'discard-next' }>;
  type S = IgnoreElementsState; type E = IgnoreElementsEvent<T>; type A = Action<never>;
  const p: P = { mode: 'discard-next' };
  const d = (id: string, from: string, event: string, to: string, guard: string, actions: string[], why: string) =>
    ruleDesc('ignoreElements', id, from, event, to, guard, actions, why);
  const rules: Rule<P,S,E,A>[] = [
    { description: d('INIT','Unsubscribed','subscribe','Active','new result subscription',['subscribe source'],'Producer starts only when consumed.'),
      enabled:()=>true, react:()=>({state:{phase:'Active'},actions:[subscribe(source)]}) },
    { description: d('DROP','Active','source.next','Active','every source value',['no downstream next'],'Discard opaque payload but retain source connection.'),
      enabled:()=>true, react:()=>({state:{phase:'Active'},actions:[]}) },
    { description: d('COMPLETE','Active','source.complete','Closed','normal termination',['forward complete','release source'],'Completion is a protocol signal, never a value.'),
      enabled:()=>true, react:()=>({state:terminal('complete'),actions:[complete,unsubscribe(source)]}) },
    { description: d('ERROR','Active','source.error','Closed','failure',['forward identical error','release source'],'Errors are not dropped by ignoreElements.'),
      enabled:()=>true, react:(_s,e)=>{ if(e.type!=='source.error')throw Error('not an error');
        return {state:terminal('source-error'), actions:[error(e.error),unsubscribe(source)]}; } },
    { description: d('CANCEL','Active','cancel','Closed','downstream unsubscribed',['release source silently'],'Never synthesize terminal notifications.'),
      enabled:()=>true, react:()=>({state:terminal('cancel'),actions:[unsubscribe(source)]}) },
  ];
  return { parameters:p, rules,
    metadata:metadata({operator:'ignoreElements',id:'ignoreElements-discard-next',purpose:'Suppress all next payloads, forwarding only the terminal source protocol.',
      signature:'ignoreElements : T* -> ∅*',
      conditions:['Exactly zero output next notifications for all source histories.','Normal completion/error follows upstream; cancellation is silent.'],
      parameters:'No arguments.',callbacks:'No callbacks.',time:'No timer/scheduler; terminal time is the upstream terminal time.',
      exclusions:['Reentrant source/observer delivery and throwing downstream handlers.'],
      sourcePaths:['src/internal/operators/ignoreElements.ts','src/internal/operators/OperatorSubscriber.ts']}),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>validPhase(s.phase,false)?[]:['invalid control'],
    validateReaction:(_before,_event,r)=>[
      ...actionErrors(r.actions),
      ...(r.actions.some(a=>a.type==='notify'&&a.notification.kind==='N')?['ignoreElements must never emit next']:[]),
    ],
  };
}
export const ignoreElementsExample: readonly TimedEvent<IgnoreElementsEvent<number>>[] = [
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:1}},
  {time:2,event:{type:'source.next',value:2}},
  {time:3,event:{type:'source.complete'}},
];

export type IsEmptyState =
  | Readonly<{ phase: 'Unsubscribed' | 'Active' }>
  | Readonly<{ phase: 'Closed'; reason: TerminalReason }>;
export type IsEmptyEvent<T> = SimpleSourceEvent<T>;
export type IsEmptyModel<T> = OperatorModel<Readonly<{ mode: 'early-emptiness-test' }>,
  IsEmptyState, IsEmptyEvent<T>, Action<boolean>>;

/** Determine emptiness immediately on first source next, without buffering. */
export function createIsEmptyModel<T>(): IsEmptyModel<T> {
  type P=Readonly<{mode:'early-emptiness-test'}>; type S=IsEmptyState; type E=IsEmptyEvent<T>; type A=Action<boolean>;
  const p:P={mode:'early-emptiness-test'};
  const d=(id:string,from:string,event:string,to:string,guard:string,actions:string[],why:string)=>
    ruleDesc('isEmpty',id,from,event,to,guard,actions,why);
  const rules:Rule<P,S,E,A>[]=[
    {description:d('INIT','Unsubscribed','subscribe','Active','new result subscription',['subscribe source'],'Start upstream when the result is connected.'),
      enabled:()=>true,react:()=>({state:{phase:'Active'},actions:[subscribe(source)]})},
    {description:d('NONEMPTY','Active','source.next','Closed','first next value',['emit false','complete','unsubscribe source'],'Any source next, even undefined, disproves emptiness and terminates immediately.'),
      enabled:()=>true,react:()=>({state:terminal('complete'),actions:[next(false),complete,unsubscribe(source)]})},
    {description:d('EMPTY','Active','source.complete','Closed','source completed before next',['emit true','complete','release source'],'An empty, successfully terminated source has exactly one boolean output.'),
      enabled:()=>true,react:()=>({state:terminal('complete'),actions:[next(true),complete,unsubscribe(source)]})},
    {description:d('ERROR','Active','source.error','Closed','error before first next',['forward same error','release source'],'A failed source is not classified as empty.'),
      enabled:()=>true,react:(_s,e)=>{if(e.type!=='source.error')throw Error('not error');
        return {state:terminal('source-error'),actions:[error(e.error),unsubscribe(source)]};}},
    {description:d('CANCEL','Active','cancel','Closed','consumer closes before result',['release source silently'],'Cancellation gives no true/false answer.'),
      enabled:()=>true,react:()=>({state:terminal('cancel'),actions:[unsubscribe(source)]})},
  ];
  return {parameters:p,rules,
    metadata:metadata({operator:'isEmpty',id:'isEmpty-short-circuit',purpose:'Emit false and complete upon first next; emit true and complete only on empty successful completion.',
      signature:'isEmpty : T* -> Boolean?',
      conditions:['Successful finite execution emits exactly one boolean.','First source next ends the upstream subscription before further cooperative next values.','Error/cancel emits no boolean.'],
      parameters:'No arguments.',callbacks:'No callback or source value inspection.',time:'No timer; decision is synchronous on first next or empty completion.',
      exclusions:['Synchronous reentry within observer callbacks.'],
      sourcePaths:['src/internal/operators/isEmpty.ts','src/internal/operators/OperatorSubscriber.ts']}),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>validPhase(s.phase,false)?[]:['invalid control'],
    validateReaction:(_s,e,r)=>[...actionErrors(r.actions),
      ...(e.type==='source.next'&&r.actions[0]?.type==='notify'&&r.actions[0].notification.kind==='N'&&r.actions[0].notification.value!==false?['nonempty must yield false']:[]),
      ...(e.type==='source.complete'&&r.actions[0]?.type==='notify'&&r.actions[0].notification.kind==='N'&&r.actions[0].notification.value!==true?['empty must yield true']:[])],
  };
}
export const isEmptyExample: readonly TimedEvent<IsEmptyEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},{time:5,event:{type:'source.complete'}},
];

export type MapToParameters<R> = Readonly<{ value:R }>;
export type MapToState =
  | Readonly<{ phase:'Unsubscribed' | 'Active' }>
  | Readonly<{ phase:'Closed'; reason: TerminalReason }>;
export type MapToEvent<T> = SimpleSourceEvent<T>;
export type MapToModel<T,R> = OperatorModel<MapToParameters<R>,MapToState,MapToEvent<T>,Action<R>>;

/** Deprecated public alias by implementation delegation: map(() => constant). */
export function createMapToModel<T,R>(value:R):MapToModel<T,R>{
  type P=MapToParameters<R>;type S=MapToState;type E=MapToEvent<T>;type A=Action<R>;
  const p:P={value};
  const d=(id:string,from:string,event:string,to:string,guard:string,actions:string[],why:string)=>
    ruleDesc('mapTo',id,from,event,to,guard,actions,why);
  const rules:Rule<P,S,E,A>[]=[
    {description:d('INIT','Unsubscribed','subscribe','Active','new subscription',['subscribe source'],'Constant is captured at operator construction, independent source execution starts on subscription.'),
      enabled:()=>true,react:()=>({state:{phase:'Active'},actions:[subscribe(source)]})},
    {description:d('REPLACE','Active','source.next','Active','every input next',['emit original constant instance'],'No input payload is inspected and the constant is not cloned or invoked.'),
      enabled:()=>true,react:(_s,_e,q)=>({state:{phase:'Active'},actions:[next(q.value)]})},
    {description:d('COMPLETE','Active','source.complete','Closed','source completes',['complete','release source'],'No delayed values remain.'),
      enabled:()=>true,react:()=>({state:terminal('complete'),actions:[complete,unsubscribe(source)]})},
    {description:d('ERROR','Active','source.error','Closed','source errors',['forward error','release source'],'Error identity is unchanged.'),
      enabled:()=>true,react:(_s,e)=>{if(e.type!=='source.error')throw Error('not error');
        return {state:terminal('source-error'),actions:[error(e.error),unsubscribe(source)]};}},
    {description:d('CANCEL','Active','cancel','Closed','downstream cancels',['release source silently'],'Cancellation does not emit the constant.'),
      enabled:()=>true,react:()=>({state:terminal('cancel'),actions:[unsubscribe(source)]})},
  ];
  return {parameters:p,rules,
    metadata:metadata({operator:'mapTo',id:'mapTo-constant',purpose:'Preserve every emission moment but replace each input with the same captured constant.',
      signature:'mapTo(R!) : T* -> R*',
      conditions:['Exactly one output next for each source next while live.','Each output value is exactly the captured R reference, not a clone.','No extra time, subscription, sharing or scheduler policy.'],
      parameters:'One captured constant, including undefined or object identities. Deprecated operator export in RxJS 7.8.2.',
      callbacks:'Internally implemented by map(() => value); modeled as no external variable callback.',time:'Every output has the arrival time of its source next.',
      exclusions:['Callback binding and operator-construction anomalies; observer reentrancy.'],
      sourcePaths:['src/internal/operators/mapTo.ts','src/internal/operators/map.ts']}),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>validPhase(s.phase,false)?[]:['invalid control'],
    validateReaction:(_s,e,r,q)=>[...actionErrors(r.actions),
      ...(e.type==='source.next'&&
        !(r.actions[0]?.type==='notify'&&r.actions[0].notification.kind==='N'&&Object.is(r.actions[0].notification.value,q.value))
        ?['constant instance changed']:[])],
  };
}
export const mapToExample: readonly TimedEvent<MapToEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},{time:2,event:{type:'source.next',value:8}},
  {time:3,event:{type:'source.next',value:9}},{time:4,event:{type:'source.complete'}},
];

/** last: optional indexed predicate; keep the latest matching value, emit only on normal completion. */
export type LastParameters<D> = Readonly<{
  predicate: boolean; hasDefault: boolean; defaultValue:D; predicateId: 'predicate';
}>;
export type LastState<T> =
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Active';index:number;hasMatch:boolean;value:T|undefined}>
  | Readonly<{phase:'Calling';index:number;hasMatch:boolean;value:T|undefined;pending:T}>
  | Readonly<{phase:'Closed';reason:TerminalReason}>;
export type LastEvent<T> = SimpleSourceEvent<T> |
  Readonly<{type:'callback.return';resource:ResourceRef;value:unknown}> |
  Readonly<{type:'callback.throw';resource:ResourceRef;error:unknown}>;
export type LastModel<T,D> =
  OperatorModel<LastParameters<D>,LastState<T>,LastEvent<T>,Action<T|D,T>>;

export function createLastModel<T,D=T>(predicate=false, defaultOption?: Readonly<{value:D}>):LastModel<T,D>{
  const p:LastParameters<D>={predicate,hasDefault:defaultOption!==undefined,
    defaultValue:defaultOption?.value as D,predicateId:'predicate'};
  type P=LastParameters<D>;type S=LastState<T>;type E=LastEvent<T>;type A=Action<T|D,T>;
  const d=(id:string,from:string,event:string,to:string,guard:string,actions:string[],why:string)=>
    ruleDesc('last',id,from,event,to,guard,actions,why);
  const match=(s:S,e:E):boolean=>s.phase==='Calling'&&
    (e.type==='callback.return'||e.type==='callback.throw')&&
    e.resource.id==='predicate'&&e.resource.generation===s.index-1;
  const rules:Rule<P,S,E,A>[]=[
    {description:d('INIT','Unsubscribed','subscribe','Active','fresh subscription',['subscribe source'],'No candidate is present initially, including no phantom undefined candidate.'),
      enabled:()=>true,react:()=>({state:{phase:'Active',index:0,hasMatch:false,value:undefined},actions:[subscribe(source)]})},
    {description:d('TAKE','Active','source.next','Active','no predicate configured',['store last value; no output'],'Overwrite the candidate on every input without retaining older elements.'),
      enabled:(_s,_e,q)=>!q.predicate,
      react:(s,e)=>{if(s.phase!=='Active'||e.type!=='source.next')throw Error('bad last input');
        return {state:{phase:'Active',index:s.index+1,hasMatch:true,value:e.value},actions:[]};}},
    {description:d('CHECK','Active','source.next','Calling','predicate configured and source value arrives',['invoke indexed predicate'],'Do not decide acceptance before the external callback outcome.'),
      enabled:(_s,_e,q)=>q.predicate,
      react:(s,e)=>{if(s.phase!=='Active'||e.type!=='source.next')throw Error('bad source next');
        return {state:{phase:'Calling',index:s.index+1,hasMatch:s.hasMatch,value:s.value,pending:e.value},
          actions:[{type:'invoke-callback',resource:{id:'predicate',generation:s.index},value:e.value,index:s.index}]};}},
    {description:d('MATCH','Calling','callback.return','Active','correlated callback returned truthy',['remember pending value'],'Last matching value replaces the previous candidate; no next yet.'),
      enabled:(s,e)=>match(s,e)&&e.type==='callback.return'&&Boolean(e.value),
      react:(s)=>{if(s.phase!=='Calling')throw Error('bad match');
        return {state:{phase:'Active',index:s.index,hasMatch:true,value:s.pending},actions:[]};}},
    {description:d('REJECT','Calling','callback.return','Active','correlated callback returned falsy',['keep previous candidate'],'Predicate selection is a local state policy, not output filtering yet.'),
      enabled:(s,e)=>match(s,e)&&e.type==='callback.return'&&!Boolean(e.value),
      react:(s)=>{if(s.phase!=='Calling')throw Error('bad reject');
        return {state:{phase:'Active',index:s.index,hasMatch:s.hasMatch,value:s.value},actions:[]};}},
    {description:d('PREDICATE-ERROR','Calling','callback.throw','Closed','correlated callback throws',['forward same error','release source'],'An exception aborts the selection; no fallback is emitted.'),
      enabled:match,
      react:(_s,e)=>{if(e.type!=='callback.throw')throw Error('bad callback throw');
        return {state:terminal('predicate-error'),actions:[error(e.error),unsubscribe(source)]};}},
    {description:d('EMIT-LAST','Active','source.complete','Closed','candidate exists',['emit last candidate','complete','release source'],'Only successful completion can expose the retained candidate.'),
      enabled:(s)=>s.phase==='Active'&&s.hasMatch,
      react:(s)=>{if(s.phase!=='Active')throw Error('bad complete');
        return {state:terminal('complete'),actions:[next(s.value as T),complete,unsubscribe(source)]};}},
    {description:d('EMIT-DEFAULT','Active','source.complete','Closed','no candidate and default was explicitly supplied',['emit fallback','complete','release source'],'An explicit undefined fallback is distinct from no argument.'),
      enabled:(s,_e,q)=>s.phase==='Active'&&!s.hasMatch&&q.hasDefault,
      react:(_s,_e,q)=>({state:terminal('complete'),actions:[next(q.defaultValue),complete,unsubscribe(source)]})},
    {description:d('EMPTY-ERROR','Active','source.complete','Closed','no candidate and default absent',['emit EmptyError','release source'],'No matching input is an error without a configured fallback.'),
      enabled:(s,_e,q)=>s.phase==='Active'&&!s.hasMatch&&!q.hasDefault,
      react:()=>({state:terminal('empty'),actions:[error(Object.assign(new Error('no elements in sequence'),{name:'EmptyError'})),unsubscribe(source)]})},
    {description:d('SOURCE-ERROR','Active','source.error','Closed','source errors',['forward exact error','release source'],'No candidate or fallback is emitted when source fails.'),
      enabled:()=>true,react:(_s,e)=>{if(e.type!=='source.error')throw Error('bad error');
        return {state:terminal('source-error'),actions:[error(e.error),unsubscribe(source)]};}},
    {description:d('CANCEL','Active','cancel','Closed','consumer closes',['release source silently'],'A cancelled stream never emits the retained value.'),
      enabled:()=>true,react:()=>({state:terminal('cancel'),actions:[unsubscribe(source)]})},
  ];
  const callbackInputs:readonly InputDescriptor[]=[
    ...sourceInputs,
    {type:'callback.return',origin:'callback',category:'callback',description:'indexed predicate returned truthy or falsy'},
    {type:'callback.throw',origin:'callback',category:'callback',description:'indexed predicate threw the original error object'},
  ];
  return {parameters:p,rules,
    metadata:metadata({operator:'last',id:'last-'+(predicate?'predicate':'plain')+'-'+(p.hasDefault?'default':'required'),
      purpose:'Retain the final selected source value; reveal exactly one result only after source completes successfully.',
      signature:'last(P?,D?) : T* -> (T|D)?',
      conditions:['No downstream next before successful source completion.',
        'A matching candidate yields one next then complete. No candidate yields explicit default or EmptyError.',
        'Predicate indices count all source next notifications, including those rejected.'],
      parameters:'Predicate enabled '+predicate+'; explicit default supplied '+p.hasDefault+'; default can be undefined.',
      callbacks:'When selected, indexed predicate receives source value/index/original source; pure model requests callback and receives a correlated truthy/falsy or throw event.',
      time:'No timer. Output occurs at successful source completion time; cancellation or error produces no retained candidate.',
      exclusions:['Deprecated thisArg/BooleanConstructor type-narrowing signatures as distinct run-time policies; reentrant callback/source; observer throwing.'],
      sourcePaths:['src/internal/operators/last.ts','src/internal/operators/filter.ts','src/internal/operators/takeLast.ts','src/internal/operators/throwIfEmpty.ts','src/internal/operators/defaultIfEmpty.ts'],
      calling:predicate,inputs:callbackInputs}),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>s.phase==='Active'||s.phase==='Calling'
      ?(!Number.isSafeInteger(s.index)||s.index<0?['bad predicate index']:[]) : validPhase(s.phase,true)?[]:['invalid control'],
    validateReaction:(_s,e,r)=>[...actionErrors(r.actions),
      ...(e.type==='source.next'&&r.actions.some(a=>a.type==='notify')?['last emitted before source complete']:[])],
  };
}
export const lastExample: readonly TimedEvent<LastEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:1}},
  {time:2,event:{type:'callback.return',resource:{id:'predicate',generation:0},value:false}},
  {time:3,event:{type:'source.next',value:2}},
  {time:4,event:{type:'callback.return',resource:{id:'predicate',generation:1},value:true}},
  {time:5,event:{type:'source.next',value:3}},
  {time:6,event:{type:'callback.return',resource:{id:'predicate',generation:2},value:false}},
  {time:7,event:{type:'source.complete'}},
];
