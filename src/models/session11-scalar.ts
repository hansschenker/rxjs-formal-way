import type { Action, ModelMetadata, InputDescriptor, Control, OperatorModel, Rule, RuleDescription, TimedEvent, Notification, ResourceRef } from '../schema.js';
import { actionErrors, source, subscribe, unsubscribe, next, complete, error, natural, pinnedRevision } from './session10-common.js';

/** Session 11: one semantic contract per export; no business callback executes in the pure models. */
type Reason = 'complete' | 'source-error' | 'notification-error' | 'missing' | 'predicate-false' | 'callback-error' | 'cancel';
type SourceEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;
const closed = (reason: Reason): { phase: 'Closed'; reason: Reason } => ({ phase: 'Closed', reason });
const srcInputs: readonly InputDescriptor[] = [
  { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'begin a fresh execution, acquiring the source only now' },
  { type: 'source.next', origin: 'source', category: 'notification', description: 'source delivers an opaque value' },
  { type: 'source.complete', origin: 'source', category: 'notification', description: 'source completes successfully' },
  { type: 'source.error', origin: 'source', category: 'notification', description: 'source fails with its original error object' },
  { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'release work silently without completion' },
];
const controls = (extra: readonly Control[] = []): readonly Control[] => [
  { id: 'Unsubscribed', description: 'cold description not yet subscribed', terminal: false },
  { id: 'Active', description: 'source connected with execution-local state', terminal: false },
  ...extra,
  { id: 'Closed', description: 'completed, errored or cancelled; no further events accepted', terminal: true },
];
const description = (op: string, id: string, from: string, event: string, to: string,
  guard: string, actions: readonly string[], explanation: string): RuleDescription => ({
  id: op.toUpperCase() + '-' + id, from, event, to, guard, actions,
  nextState: 'control and memory updated atomically; resource lifetime follows ordered actions',
  obligations: ['S11-' + op.toUpperCase() + '-' + id], explanation,
});
type MetaConfig = Readonly<{
  operator: string; id: string; purpose: string; signature: string;
  conditions: readonly string[]; parameters: string; callbacks: string; time: string;
  inputs?: readonly InputDescriptor[]; controls?: readonly Control[];
  actionTypes?: readonly Action<unknown>['type'][]; callbackResource?: boolean;
  extraResources?: readonly {id: string;kind:'subscription'|'timer'|'callback';owner:string}[];
  paths: readonly string[]; exclusions: readonly string[];
  initialization?: string; actionSemantics: string;
}>;
const metadata = (c: MetaConfig): ModelMetadata => ({
  schemaVersion: '1.1', rxjsVersion: '7.8.2', id: c.id, operator: c.operator,
  purpose: c.purpose, cardinality: { signature: c.signature, conditions: [
    ...c.conditions, 'Cω counts next values; terminal notifications, resource release and cancellation are separate obligations.',
  ] },
  scope: {
    parameters: c.parameters, callbacks: c.callbacks, time: c.time,
    reentrancy: 'Atomic non-reentrant source and callback outcome delivery; no observer/finalizer reentry inside the modeled reaction.',
    exclusions: c.exclusions,
  },
  initialization: { control: 'Unsubscribed', event: 'subscribe',
    sourceSubscription: c.initialization ?? 'One independently owned source connection is acquired at subscription, not construction.' },
  ownership: { state: 'subscription-local', sharing: 'None; independent operator state per subscription even if the upstream happens to be shared.',
    reset: 'Fresh subscription starts with new state; closed execution rejects all subsequent model inputs.',
    resources: [{ id: 'source', kind: 'subscription', owner: 'current result subscription' },
      ...(c.callbackResource ? [{ id: 'predicate', kind: 'callback' as const, owner: 'one correlated external callback per tested input' }] : []),
      ...(c.extraResources ?? [])] },
  dispatch: { policy: 'atomic-non-reentrant', actionSemantics: c.actionSemantics,
    cancellationCheckpoints: ['Between source notifications or completed synchronous logical microsteps; silent release only.'] },
  inputs: c.inputs ?? srcInputs, controls: c.controls ?? controls(),
  actionTypes: c.actionTypes ?? ['subscribe','notify','unsubscribe'],
  sources: c.paths.map(path => ({ url: 'https://github.com/ReactiveX/rxjs/blob/' + pinnedRevision + '/' + path,
    revision: pinnedRevision, purpose: 'Pinned implementation and lifecycle evidence' })),
  evidence: { modelTests: ['tests/session11-model.test.mjs'],
    runtimeTests: ['tests/session11-rxjs.test.mjs'], status: 'source-inspected',
    record: 'evidence/SESSION-11.md' },
});

/** dematerialize unwraps notifications delivered as source VALUES, including early terminal notifications. */
export type DematerializeState =
  | Readonly<{ phase: 'Unsubscribed' | 'Active' }>
  | Readonly<{ phase: 'Closed'; reason: Reason }>;
export type DematerializeEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; notification: Notification<T> }>
  | Readonly<{ type: 'source.error'; error: unknown }>;
export type DematerializeModel<T> = OperatorModel<Readonly<{mode:'notification-unwrapping'}>,
  DematerializeState, DematerializeEvent<T>, Action<T>>;
export function createDematerializeModel<T>(): DematerializeModel<T> {
  type S = DematerializeState; type E = DematerializeEvent<T>; type A = Action<T>;
  const op='dematerialize', d=(id:string,from:string,event:string,to:string,guard:string,acts:string[],why:string)=>
    description(op,id,from,event,to,guard,acts,why);
  const rules: Rule<Readonly<{mode:'notification-unwrapping'}>,S,E,A>[] = [
    {description:d('INIT','Unsubscribed','subscribe','Active','fresh subscription',['acquire source'],'Nothing executes until subscribed.'),
      enabled:()=>true,react:()=>({state:{phase:'Active'},actions:[subscribe(source)]})},
    {description:d('NEXT','Active','source.next','Active','notification.kind=N',['forward embedded payload'],'A materialized next is a downstream next.'),
      enabled:(_s,e)=>e.type==='source.next'&&e.notification.kind==='N',
      react:(_s,e)=>{if(e.type!=='source.next'||e.notification.kind!=='N')throw Error('invalid N');
        return {state:{phase:'Active'},actions:[next(e.notification.value)]};}},
    {description:d('EMBEDDED-COMPLETE','Active','source.next','Closed','notification.kind=C',['complete downstream','release source'],'An embedded complete terminates before the outer sequence needs to complete.'),
      enabled:(_s,e)=>e.type==='source.next'&&e.notification.kind==='C',
      react:()=>({state:closed('complete'),actions:[complete,unsubscribe(source)]})},
    {description:d('EMBEDDED-ERROR','Active','source.next','Closed','notification.kind=E',['error with embedded identity','release source'],'An embedded error is the terminal error, with its original identity.'),
      enabled:(_s,e)=>e.type==='source.next'&&e.notification.kind==='E',
      react:(_s,e)=>{if(e.type!=='source.next'||e.notification.kind!=='E')throw Error('invalid E');
        return {state:closed('notification-error'),actions:[error(e.notification.error),unsubscribe(source)]};}},
    {description:d('SOURCE-COMPLETE','Active','source.complete','Closed','source completes without embedded terminal',['complete','release source'],'An ordinary outer completion is still forwarded.'),
      enabled:()=>true,react:()=>({state:closed('complete'),actions:[complete,unsubscribe(source)]})},
    {description:d('SOURCE-ERROR','Active','source.error','Closed','outer errors',['forward source error','release source'],'Malformed upstream failure does not count as a materialized value.'),
      enabled:()=>true,react:(_s,e)=>{if(e.type!=='source.error')throw Error('invalid error');
        return {state:closed('source-error'),actions:[error(e.error),unsubscribe(source)]};}},
    {description:d('CANCEL','Active','cancel','Closed','downstream closes',['release source silently'],'Cancellation never synthesizes completion.'),
      enabled:()=>true,react:()=>({state:closed('cancel'),actions:[unsubscribe(source)]})},
  ];
  return {
    parameters:{mode:'notification-unwrapping'},rules,
    metadata:metadata({operator:op,id:'dematerialize-notification-values',purpose:'Turn source next(notification) into the represented downstream next, error or complete.',
      signature:'dematerialize : Notification<T>* -> T*',
      conditions:['N forwards exactly one payload; E/C terminate immediately, even if the upstream would send more values.',
        'An upstream ordinary complete or error is forwarded when no embedded terminal has arrived.'],
      parameters:'No arguments. Source values are well-formed RxJS Notification objects with kind N, E or C.',
      callbacks:'None. Notification payloads and error objects remain opaque.',time:'No scheduler or timer; synchronous arrival order controls termination.',
      exclusions:['Malformed notification objects and observer exceptions.','Nested synchronous reentry and delivery after terminal are rejected by the model.'],
      paths:['src/internal/operators/dematerialize.ts','src/internal/Notification.ts','src/internal/operators/OperatorSubscriber.ts'],
      inputs:srcInputs.map(x=>x.type==='source.next'?{...x,description:'source value is a Notification<T> record'}:x),
      actionSemantics:'Inspect only the protocol tag of each Notification; no payload transformation or timestamp creation.'}),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>['Unsubscribed','Active','Closed'].includes(s.phase)?[]:['invalid phase'],
    validateReaction:(_s,e,out)=>{
      const errors=actionErrors(out.actions);
      if(e.type==='source.next'&&e.notification.kind==='N'){
        const a=out.actions[0];if(a?.type!=='notify'||a.notification.kind!=='N'||!Object.is(a.notification.value,e.notification.value))
          errors.push('notification payload identity changed');
      }
      return errors;
    },
  };
}
export const dematerializeExample: readonly TimedEvent<DematerializeEvent<string>>[] = [
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',notification:{kind:'N',value:'a'}}},
  {time:2,event:{type:'source.next',notification:{kind:'N',value:'b'}}},
  {time:3,event:{type:'source.next',notification:{kind:'C'}}},
];

/** elementAt uses zero-based input POSITION, not time; missing index is an error unless a default was actually supplied. */
export type ElementAtParameters<D> = Readonly<{ index:number; hasDefault:boolean; defaultValue:D }>;
export type ElementAtState =
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Active'; index:number}>
  | Readonly<{phase:'Closed';reason:Reason}>;
export type ElementAtEvent<T> = SourceEvent<T>;
export type ElementAtModel<T,D> = OperatorModel<ElementAtParameters<D>,ElementAtState,ElementAtEvent<T>,Action<T|D>>;
export function createElementAtModel<T,D=T>(index:number, defaultValue?:D):ElementAtModel<T,D>{
  if(!natural(index))throw new RangeError('elementAt index must be a nonnegative safe integer in the modeled profile');
  const hasDefault=arguments.length>=2;
  const p:ElementAtParameters<D>={index,hasDefault,defaultValue:defaultValue as D};
  type S=ElementAtState;type E=ElementAtEvent<T>;type A=Action<T|D>;
  const op='elementAt',d=(id:string,from:string,event:string,to:string,guard:string,acts:string[],why:string)=>
    description(op,id,from,event,to,guard,acts,why);
  const missingError=()=>Object.assign(new Error('argument out of range'),{name:'ArgumentOutOfRangeError'});
  const rules:Rule<ElementAtParameters<D>,S,E,A>[]=[
    {description:d('INIT','Unsubscribed','subscribe','Active','valid index',['subscribe source'],'A fresh source index starts at zero.'),
      enabled:()=>true,react:()=>({state:{phase:'Active',index:0},actions:[subscribe(source)]})},
    {description:d('SKIP','Active','source.next','Active','current index differs from requested index',['advance index without emission'],'Discard values at other positions, retaining no payload.'),
      enabled:(s,_e,q)=>s.phase==='Active'&&s.index!==q.index,
      react:(s)=>{if(s.phase!=='Active')throw Error('bad index');return {state:{phase:'Active',index:s.index+1},actions:[]};}},
    {description:d('HIT','Active','source.next','Closed','current index equals requested index',['emit same source value','complete','release source'],'The indexed value emits and terminates immediately without waiting for source completion.'),
      enabled:(s,_e,q)=>s.phase==='Active'&&s.index===q.index,
      react:(_s,e)=>{if(e.type!=='source.next')throw Error('bad value');
        return {state:closed('complete'),actions:[next(e.value),complete,unsubscribe(source)]};}},
    {description:d('MISSING-DEFAULT','Active','source.complete','Closed','index not reached and default supplied',['emit fallback','complete','release source'],'A literal undefined default is still supplied when argument two exists.'),
      enabled:(_s,_e,q)=>q.hasDefault,
      react:(_s,_e,q)=>({state:closed('complete'),actions:[next(q.defaultValue),complete,unsubscribe(source)]})},
    {description:d('MISSING-ERROR','Active','source.complete','Closed','index not reached and no default',['report ArgumentOutOfRangeError','release source'],'An unfulfilled position is not an empty successful result.'),
      enabled:(_s,_e,q)=>!q.hasDefault,
      react:()=>({state:closed('missing'),actions:[error(missingError()),unsubscribe(source)]})},
    {description:d('SOURCE-ERROR','Active','source.error','Closed','source fails before indexed value',['forward exact source error','release source'],'An upstream error retains its identity and suppresses default.'),
      enabled:()=>true,react:(_s,e)=>{if(e.type!=='source.error')throw Error('bad error');
        return {state:closed('source-error'),actions:[error(e.error),unsubscribe(source)]};}},
    {description:d('CANCEL','Active','cancel','Closed','downstream closes early',['release source silently'],'No value, default or synthesized completion on cancellation.'),
      enabled:()=>true,react:()=>({state:closed('cancel'),actions:[unsubscribe(source)]})},
  ];
  return {parameters:p,rules,
    metadata:metadata({operator:op,id:'elementAt-'+index+(hasDefault?'-default':'-required'),
      purpose:'Select exactly the zero-based index, terminating as soon as it appears, or handle a missing index at source completion.',
      signature:'elementAt(i,D?) : T* -> (T|D)?',
      conditions:['At most one next value, followed by completion on hit; normal empty source with default emits exactly one default.',
        'Missing index without default errors with ArgumentOutOfRangeError, with no emitted value.'],
      parameters:'Nonnegative safe-integer index '+index+'; '+(hasDefault?'explicit default is present':'no default supplied')+'. Negative/fractional indices excluded.',
      callbacks:'No user projection; skip indexed inputs by position without inspecting values.',
      time:'No timer. The selected item is forwarded at its source arrival; source completion decides only missing-index outcomes.',
      exclusions:['Invalid, NaN, fractional and overflowing index values; construction-time negative-index error is not an execution transition.',
        'The missing-error model uses a structurally named ArgumentOutOfRangeError; native RxJS error constructor is separately checked.',
        'Observer reentry, throwing finalizers and callback-time cancellation.'],
      paths:['src/internal/operators/elementAt.ts','src/internal/operators/filter.ts','src/internal/operators/take.ts','src/internal/operators/throwIfEmpty.ts'],
      actionSemantics:'Index gate counts all source next events; when count equals requested index, output and complete then release upstream.'}),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>s.phase!=='Active'||natural(s.index)?[]:['invalid source index'],
    validateReaction:(_s,e,out)=>{const errors=actionErrors(out.actions);
      if(e.type==='source.next'&&out.actions[0]?.type==='notify'&&out.actions[0].notification.kind==='N'&&
        !Object.is(out.actions[0].notification.value,e.value))errors.push('selected payload changed');
      return errors;},
  };
}
export const elementAtExample:readonly TimedEvent<ElementAtEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:'a'}},
  {time:2,event:{type:'source.next',value:'b'}},
  {time:3,event:{type:'source.next',value:'c'}},
];

/** endWith runs a finite, synchronous suffix after source completion; unlike startWith, source is acquired first. */
export type EndWithParameters<P> = Readonly<{ suffix:readonly P[]; scheduler:'none' }>;
export type EndWithState =
  | Readonly<{phase:'Unsubscribed'|'Active'}>
  | Readonly<{phase:'Suffix';index:number}>
  | Readonly<{phase:'Closed';reason:Reason}>;
export type EndWithEvent<T> = SourceEvent<T> | Readonly<{type:'suffix.next'|'suffix.complete'}>;
export type EndWithModel<T,P> = OperatorModel<EndWithParameters<P>,EndWithState,EndWithEvent<T>,Action<T|P>>;
export function createEndWithModel<T,P>(values:readonly P[]):EndWithModel<T,P>{
  const p:EndWithParameters<P>={suffix:[...values],scheduler:'none'};
  type S=EndWithState;type E=EndWithEvent<T>;type A=Action<T|P>;
  const op='endWith',d=(id:string,from:string,event:string,to:string,guard:string,acts:string[],why:string)=>
    description(op,id,from,event,to,guard,acts,why);
  const rules:Rule<EndWithParameters<P>,S,E,A>[]=[
    {description:d('INIT','Unsubscribed','subscribe','Active','new subscription',['connect source'],'Suffix values do not emit before source ends.'),
      enabled:()=>true,react:()=>({state:{phase:'Active'},actions:[subscribe(source)]})},
    {description:d('PASS','Active','source.next','Active','source live',['forward exact source payload'],'All source values flow unchanged.'),
      enabled:()=>true,react:(_s,e)=>{if(e.type!=='source.next')throw Error('bad value');
        return {state:{phase:'Active'},actions:[next(e.value)]};}},
    {description:d('SUFFIX-BEGIN','Active','source.complete','Suffix','source successfully completed',['release source','begin synchronous suffix'],'Only successful source completion initiates the suffix.'),
      enabled:()=>true,react:()=>({state:{phase:'Suffix',index:0},actions:[unsubscribe(source)]})},
    {description:d('SUFFIX-NEXT','Suffix','suffix.next','Suffix','suffix index < number of values',['emit next suffix payload'],'Each supplied suffix value is synchronously delivered in argument order.'),
      enabled:(s,_e,q)=>s.phase==='Suffix'&&s.index<q.suffix.length,
      react:(s,_e,q)=>{if(s.phase!=='Suffix')throw Error('bad suffix');
        return {state:{phase:'Suffix',index:s.index+1},actions:[next(q.suffix[s.index] as P)]};}},
    {description:d('SUFFIX-COMPLETE','Suffix','suffix.complete','Closed','all suffix values emitted',['complete downstream'],'The internal finite of(...values) finishes; it is not a new external source.'),
      enabled:(s,_e,q)=>s.phase==='Suffix'&&s.index===q.suffix.length,
      react:()=>({state:closed('complete'),actions:[complete]})},
    {description:d('ERROR','Active','source.error','Closed','source fails',['forward exact error','release source; suppress suffix'],'An error never acts as normal source completion.'),
      enabled:()=>true,react:(_s,e)=>{if(e.type!=='source.error')throw Error('bad error');
        return {state:closed('source-error'),actions:[error(e.error),unsubscribe(source)]};}},
    {description:d('CANCEL-ACTIVE','Active','cancel','Closed','cancel during source',['release source silently'],'No suffix on cancellation.'),
      enabled:()=>true,react:()=>({state:closed('cancel'),actions:[unsubscribe(source)]})},
    {description:d('CANCEL-SUFFIX','Suffix','cancel','Closed','cancel between suffix emissions',['stop suffix without completion'],'The source is already released; remaining suffix values are suppressed.'),
      enabled:()=>true,react:()=>({state:closed('cancel'),actions:[]})},
  ];
  return {parameters:p,rules,
    metadata:metadata({operator:op,id:'endWith-unscheduled-'+values.length,
      purpose:'After successful source completion, synchronously append a finite word of supplied values.',
      signature:'endWith(P*) : T* -> (T|P)*',
      conditions:['On success, emitted word is the source word concatenated with the finite suffix word.',
        'An error or explicit cancellation does not append the suffix. No suffix value is emitted before source completion.'],
      parameters:'Finite fixed suffix of '+values.length+' values, no deprecated SchedulerLike overload.',
      callbacks:'None. Values are opaque, including undefined and object identity.',
      time:'Source timing preserved; suffix is delivered synchronously at normal completion, without scheduling.',
      exclusions:['Deprecated scheduler overload and implicit scheduled suffix semantics.','Observer reentry or throwing finalizers.'],
      paths:['src/internal/operators/endWith.ts','src/internal/observable/concat.ts','src/internal/observable/of.ts'],
      controls:controls([{id:'Suffix',description:'source complete; synchronous suffix microsteps remain',terminal:false}]),
      inputs:[...srcInputs,{type:'suffix.next',origin:'environment',category:'lifecycle',description:'synchronous append of next configured suffix value'},
        {type:'suffix.complete',origin:'environment',category:'lifecycle',description:'finite suffix sequence finishes'}],
      actionSemantics:'Source completes then is released; suffix microsteps emit in order and finally complete. No timer or sharing.'}),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:(s,q)=>s.phase!=='Suffix'||natural(s.index)&&s.index<=q.suffix.length?[]:['invalid suffix cursor'],
    validateReaction:(s,e,out,q)=>{const errors=actionErrors(out.actions);
      if(s.phase==='Suffix'&&e.type==='suffix.next'){
        const a=out.actions[0];
        if(a?.type!=='notify'||a.notification.kind!=='N'||!Object.is(a.notification.value,q.suffix[s.index]))
          errors.push('suffix order or identity mismatch');
      }
      return errors;},
  };
}
export const endWithExample:readonly TimedEvent<EndWithEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:1}},
  {time:2,event:{type:'source.complete'}},
  {time:2,event:{type:'suffix.next'}},
  {time:2,event:{type:'suffix.next'}},
  {time:2,event:{type:'suffix.complete'}},
];

/** every evaluates a predicate only while the prefix remains valid; one false ends the stream early. */
export type EveryParameters=Readonly<{predicateId:'predicate'}>;
export type EveryState<T> =
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Active';index:number}>
  | Readonly<{phase:'Calling';index:number;value:T}>
  | Readonly<{phase:'Closed';reason:Reason}>;
export type EveryEvent<T> = SourceEvent<T>
  | Readonly<{type:'callback.return';resource:ResourceRef;value:unknown}>
  | Readonly<{type:'callback.throw';resource:ResourceRef;error:unknown}>;
export type EveryModel<T>=OperatorModel<EveryParameters,EveryState<T>,EveryEvent<T>,Action<boolean,T>>;
const predicateRef=(index:number):ResourceRef=>({id:'predicate',generation:index});
export function createEveryModel<T>():EveryModel<T>{
  type S=EveryState<T>;type E=EveryEvent<T>;type A=Action<boolean,T>;
  const op='every',d=(id:string,from:string,event:string,to:string,guard:string,acts:string[],why:string)=>
    description(op,id,from,event,to,guard,acts,why);
  const matches=(s:S,e:E)=>s.phase==='Calling'&&('resource'in e)&&
    e.resource.id==='predicate'&&e.resource.generation===s.index;
  const rules:Rule<EveryParameters,S,E,A>[]=[
    {description:d('INIT','Unsubscribed','subscribe','Active','fresh execution',['subscribe source with index zero'],'Every subscriber has independent predicate index.'),
      enabled:()=>true,react:()=>({state:{phase:'Active',index:0},actions:[subscribe(source)]})},
    {description:d('CALL','Active','source.next','Calling','source next at valid index',['invoke predicate with original value and index'],'The predicate is a user function; the canonical model requests its outcome but never executes it.'),
      enabled:s=>s.phase==='Active'&&natural(s.index)&&s.index<Number.MAX_SAFE_INTEGER,
      react:(s,e)=>{if(s.phase!=='Active'||e.type!=='source.next')throw Error('bad next');
        return {state:{phase:'Calling',index:s.index,value:e.value},
          actions:[{type:'invoke-callback',resource:predicateRef(s.index),value:e.value,index:s.index}]};}},
    {description:d('TRUE','Calling','callback.return','Active','correlated truthy predicate outcome',['advance index, no output'],'Every true predicate result is silent until source completion.'),
      enabled:(s,e)=>matches(s,e)&&e.type==='callback.return'&&Boolean(e.value),
      react:(s)=>{if(s.phase!=='Calling')throw Error('bad true');
        return {state:{phase:'Active',index:s.index+1},actions:[]};}},
    {description:d('FALSE','Calling','callback.return','Closed','correlated falsy predicate outcome',['emit false once','complete','unsubscribe'],'First falsy predicate result terminates immediately; no later source values are evaluated.'),
      enabled:(s,e)=>matches(s,e)&&e.type==='callback.return'&&!Boolean(e.value),
      react:()=>({state:closed('predicate-false'),actions:[next(false),complete,unsubscribe(source)]})},
    {description:d('THROW','Calling','callback.throw','Closed','correlated throwing predicate',['forward exact thrown identity','release source'],'Thrown errors are not interpreted as false.'),
      enabled:(s,e)=>matches(s,e)&&e.type==='callback.throw',
      react:(_s,e)=>{if(e.type!=='callback.throw')throw Error('bad throw');
        return {state:closed('callback-error'),actions:[error(e.error),unsubscribe(source)]};}},
    {description:d('SOURCE-COMPLETE','Active','source.complete','Closed','no falsy predicate occurred',['emit true once','complete','release source'],'Vacuous truth applies to the empty sequence.'),
      enabled:()=>true,react:()=>({state:closed('complete'),actions:[next(true),complete,unsubscribe(source)]})},
    {description:d('SOURCE-ERROR','Active','source.error','Closed','upstream errors',['forward error without boolean','release source'],'Source error does not produce a final truth value.'),
      enabled:()=>true,react:(_s,e)=>{if(e.type!=='source.error')throw Error('bad source error');
        return {state:closed('source-error'),actions:[error(e.error),unsubscribe(source)]};}},
    {description:d('CANCEL','Active','cancel','Closed','explicit cancellation',['release source silently'],'Cancellation before decision produces no boolean.'),
      enabled:()=>true,react:()=>({state:closed('cancel'),actions:[unsubscribe(source)]})},
  ];
  return {parameters:{predicateId:'predicate'},rules,
    metadata:metadata({operator:op,id:'every-indexed-predicate',
      purpose:'Quantify that all source values satisfy an indexed predicate, short-circuiting on the first falsy result.',
      signature:'every(p) : T* -> Boolean!',
      conditions:['On successful finite completion emit true once, including the empty input (vacuous truth).',
        'On first falsy result emit false once and complete early; source error, callback throw or cancellation never emits a boolean.'],
      parameters:'Required synchronous indexed predicate; without thisArg overload.',
      callbacks:'Synchronous predicate (value,index,source), represented as a correlated invocation/outcome pair; user code is not executed by model.',
      time:'No clock; predicate return is a synchronous logical microstep. Completion or first falsy result determines output time.',
      exclusions:['thisArg overload and user callback reentrancy.','Callback cancellation and Index > MAX_SAFE_INTEGER.','Thrown downstream observer/finalizer exceptions.'],
      paths:['src/internal/operators/every.ts','src/internal/operators/OperatorSubscriber.ts'],
      controls:controls([{id:'Calling',description:'one predicate invocation is pending a correlated outcome',terminal:false}]),
      inputs:[...srcInputs,
        {type:'callback.return',origin:'callback',category:'callback',description:'pending predicate returns a truthy/falsy result'},
        {type:'callback.throw',origin:'callback',category:'callback',description:'pending predicate throws an arbitrary error'}],
      actionTypes:['subscribe','invoke-callback','notify','unsubscribe'],
      callbackResource:true,
      actionSemantics:'Evaluate exactly one predicate for each reached source next; do not emit on success; false immediately ends the execution.'}),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>('index'in s)&&!natural(s.index)?['invalid source index']:[],
    validateReaction:(_s,e,out)=>{
      const errors=actionErrors(out.actions as readonly Action<boolean>[]);
      if(e.type==='source.next'){
        const a=out.actions[0];if(a?.type!=='invoke-callback'||!Object.is(a.value,e.value))errors.push('predicate input changed');
      }
      return errors;
    },
  };
}
export const everyExample:readonly TimedEvent<EveryEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:2}},
  {time:1,event:{type:'callback.return',resource:{id:'predicate',generation:0},value:true}},
  {time:2,event:{type:'source.next',value:4}},
  {time:2,event:{type:'callback.return',resource:{id:'predicate',generation:1},value:true}},
  {time:3,event:{type:'source.complete'}},
];
