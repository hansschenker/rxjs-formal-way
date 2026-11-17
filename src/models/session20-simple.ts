import type { Action, InputDescriptor, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision } from './session10-common.js';

/** Session 20: cold per-subscription machines. Callback outcomes are explicit input events. */
const source: ResourceRef = { id: 'source', generation: 0 };
const ref = (id: string, generation = 0): ResourceRef => ({ id, generation });
const acquire = (): Action<unknown> => ({ type: 'subscribe', resource: source });
const release = (): Action<unknown> => ({ type: 'unsubscribe', resource: source });
const emit = (value: unknown): Action<unknown> => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const done: Action<unknown> = { type: 'notify', target: 'downstream', notification: { kind: 'C' } };
const fail = (reason: unknown): Action<unknown> => ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: reason } });
const closed = (reason: 'complete' | 'error' | 'cancel' | 'callback-error') => ({ phase: 'Closed' as const, reason });
const event = (type: string, origin: InputDescriptor['origin'], category: InputDescriptor['category'], description: string): InputDescriptor =>
  ({ type, origin, category, description });
const baseInputs: InputDescriptor[] = [
  event('subscribe','downstream','lifecycle','begin a new lazy execution'),
  event('source.next','source','notification','opaque upstream value'),
  event('source.complete','source','notification','successful upstream terminal'),
  event('source.error','source','notification','upstream error identity'),
  event('cancel','downstream','lifecycle','silent downstream teardown'),
];
const controls = (extra: ModelMetadata['controls'] = []): ModelMetadata['controls'] => [
  { id: 'Unsubscribed', description: 'no source subscription yet', terminal: false },
  { id: 'Active', description: 'source subscribed, operator state is local', terminal: false },
  ...extra,
  { id: 'Closed', description: 'complete/error/cancel, no later events legal', terminal: true },
];
const metadata = (o: {
  operator: string; signature: string; purpose: string; conditions: string[];
  parameters: string; callbacks: string; time: string; exclusions: string[];
  inputs?: InputDescriptor[]; controls?: ModelMetadata['controls']; actionTypes?: ModelMetadata['actionTypes'];
  resources?: ModelMetadata['ownership']['resources'];
}): ModelMetadata => ({
  schemaVersion: '1.1', id: 'session20-' + o.operator + '-scoped', operator: o.operator, rxjsVersion: '7.8.2',
  purpose: o.purpose, cardinality: { signature: o.signature, conditions: o.conditions },
  scope: { parameters: o.parameters, callbacks: o.callbacks, time: o.time,
    reentrancy: 'Non-reentrant atomic source/callback outcome events; downstream observers do not synchronously re-enter.',
    exclusions: o.exclusions },
  initialization: { control:'Unsubscribed',event:'subscribe',
    sourceSubscription: 'Cold: acquire source on subscribe, except takeLast(0) which is EMPTY and never acquires its upstream.' },
  ownership: { state:'subscription-local',sharing:'None: independent state and source per downstream connection.',
    reset:'Each new connection starts with empty local memory; closed states have no legal further input.',
    resources: o.resources ?? [{ id:'source',kind:'subscription',owner:'result connection' }] },
  dispatch: { policy:'atomic-non-reentrant',
    actionSemantics:'Commit the new control/memory state before ordered output and teardown; callbacks are separate correlated observations.',
    cancellationCheckpoints:['Before each notification/callback outcome and after downstream cancellation.'] },
  inputs:o.inputs ?? baseInputs, controls:o.controls ?? controls(),
  actionTypes:o.actionTypes ?? ['subscribe','unsubscribe','notify'],
  sources:[{ url:'https://github.com/ReactiveX/rxjs/blob/' + pinnedRevision + '/src/internal/operators/' + o.operator + '.ts',
    revision:pinnedRevision, purpose:'Pinned RxJS 7.8.2 operator implementation' }],
  evidence:{status:'source-inspected',record:'evidence/SESSION-20.md',
    modelTests:['tests/session20-model.test.mjs'],runtimeTests:['tests/session20-rxjs.test.mjs']}
});
const rule = <P,S,E extends {type:string}>(op:string,id:string,from:string,kind:E['type'],to:string,
  guard:string,acts:string[],why:string,enabled:(s:S,e:E,p:P)=>boolean,
  react:(s:S,e:E,p:P)=>{state:S;actions:readonly Action<unknown>[]}):Rule<P,S,E,Action<unknown>> => ({
  description:{id:'S20-'+op.toUpperCase()+'-'+id,from,event:kind,to,guard,actions:acts,explanation:why,
    nextState: to==='Closed'?'Terminal reason fixed; no owned notifications remain.':'Memory and resource state updated as specified by guard.',
    obligations:['S20-'+op.toUpperCase()+'-'+id]},
  enabled,react
});
const checkActions = (actions:readonly Action<unknown>[]):string[] => [...validateActionWord(actions),
  ...actions.filter(a=>a.type==='notify'&&a.target!=='downstream').map(()=> 'unknown output target')];

export type SimpleSourceEvent<T> =
  | Readonly<{type:'subscribe'|'source.complete'|'cancel'}>
  | Readonly<{type:'source.next';value:T}>
  | Readonly<{type:'source.error';error:unknown}>;

export type TakeLastParameters = Readonly<{count:number;policy:'completion FIFO flush'}>;
export type TakeLastState<T> =
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Active';pending:readonly T[]}>
  | Readonly<{phase:'Closed';reason:'complete'|'error'|'cancel'}>;
export type TakeLastEvent<T> = SimpleSourceEvent<T>;
export type TakeLastModel<T> = OperatorModel<TakeLastParameters,TakeLastState<T>,TakeLastEvent<T>,Action<unknown>>;

/** A bounded FIFO defers all values until successful completion. takeLast(0) subscribes to EMPTY. */
export function createTakeLastModel<T>(count:number):TakeLastModel<T> {
  if (!Number.isSafeInteger(count)||count<0||count>8) throw RangeError('takeLast model supports integer count 0..8');
  type P=TakeLastParameters;type S=TakeLastState<T>;type E=TakeLastEvent<T>;
  const p:P={count,policy:'completion FIFO flush'};
  const active=(s:S):s is Extract<S,{phase:'Active'}>=>s.phase==='Active';
  const rules:Rule<P,S,E,Action<unknown>>[]=[
    rule('takeLast','EMPTY','Unsubscribed','subscribe','Closed','count = 0',
      ['complete without subscribing source'],'The pinned operator returns EMPTY when count <= 0.',
      (_s,_e,q)=>q.count===0,()=>({state:closed('complete'),actions:[done]})),
    rule('takeLast','START','Unsubscribed','subscribe','Active','count > 0',
      ['subscribe source; initialize FIFO'],'Only a subscription activates source execution.',
      (_s,_e,q)=>q.count>0,()=>({state:{phase:'Active',pending:[]},actions:[acquire()]})),
    rule('takeLast','APPEND','Active','source.next','Active','buffer shorter than capacity',
      ['append value; no downstream output'],'All values wait until successful source completion.',
      (s,_e,q)=>active(s)&&s.pending.length<q.count,(s,e)=>{
        if(!active(s)||e.type!=='source.next')throw Error('takeLast append');
        return {state:{phase:'Active',pending:[...s.pending,e.value]},actions:[]};
      }),
    rule('takeLast','ROLL','Active','source.next','Active','FIFO is full',
      ['drop oldest and append incoming value'],'Keeps the most recent count source values, preserving order.',
      (s,_e,q)=>active(s)&&s.pending.length===q.count,(s,e)=>{
        if(!active(s)||e.type!=='source.next')throw Error('takeLast roll');
        return {state:{phase:'Active',pending:[...s.pending.slice(1),e.value]},actions:[]};
      }),
    rule('takeLast','FLUSH','Active','source.complete','Closed','successful source completion',
      ['emit buffered values in original order','complete result; release source'],
      'Values are emitted only at successful completion, including when the source contained fewer than count.',
      s=>active(s),s=>{
        if(!active(s))throw Error('takeLast complete');
        return {state:closed('complete'),actions:[...s.pending.map(emit),done,release()]};
      }),
    rule('takeLast','ERROR','Active','source.error','Closed','source fails',
      ['propagate exact error; discard FIFO; release source'],
      'Error is not a successful completion, so buffered values never flush.',
      s=>active(s),(_s,e)=>{
        if(e.type!=='source.error')throw Error('takeLast error');
        return {state:closed('error'),actions:[fail(e.error),release()]};
      }),
    rule('takeLast','CANCEL','Active','cancel','Closed','downstream closes',
      ['silently discard FIFO; release source'],'Unsubscribe is not a flushing event.',
      s=>active(s),()=>({state:closed('cancel'),actions:[release()]})),
  ];
  return {parameters:p,rules,initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>active(s)&&s.pending.length>count?['FIFO exceeded count']:[],
    validateReaction:(_s,_e,r)=>checkActions(r.actions),
    metadata:metadata({operator:'takeLast',purpose:'Remember the last N payloads and release them only on successful completion.',
      signature:'takeLast(count): Cω(Count) → T* → T{0..count}',
      conditions:['No next before source completion.','Error and cancellation discard the FIFO.','Count zero is immediate EMPTY without upstream subscription.'],
      parameters:'Integer count from 0 through 8; count 0 selects EMPTY.',callbacks:'None.',
      time:'Completion is the flush trigger; values are not time-delayed by a scheduler.',
      exclusions:['Fractional, NaN, infinite and counts above eight; callback/observer reentrancy.']})};
}
export const takeLastExample:readonly TimedEvent<TakeLastEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},{time:1,event:{type:'source.next',value:'a'}},
  {time:2,event:{type:'source.next',value:'b'}},{time:3,event:{type:'source.next',value:'c'}},
  {time:4,event:{type:'source.complete'}}
];

export type TapParameters=Readonly<{withNext:boolean;callbackId:'tap-next'}>;
export type TapState<T>=
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Active';index:number}>
  | Readonly<{phase:'Calling';index:number;value:T}>
  | Readonly<{phase:'Closed';reason:'complete'|'error'|'cancel'|'callback-error'}>;
export type TapEvent<T>=SimpleSourceEvent<T>
  | Readonly<{type:'callback.return';resource:ResourceRef}>
  | Readonly<{type:'callback.throw';resource:ResourceRef;error:unknown}>;
export type TapModel<T>=OperatorModel<TapParameters,TapState<T>,TapEvent<T>,Action<unknown>>;

/** Only the next-handler and identity forms; other TapObserver hooks are explicitly out of scope. */
export function createTapModel<T>(withNext=true):TapModel<T> {
  type P=TapParameters;type S=TapState<T>;type E=TapEvent<T>;
  const p:P={withNext,callbackId:'tap-next'};
  const active=(s:S):s is Extract<S,{phase:'Active'}>=>s.phase==='Active';
  const calling=(s:S):s is Extract<S,{phase:'Calling'}>=>s.phase==='Calling';
  const match=(s:S,e:E)=>calling(s)&&'resource'in e&&e.resource.id==='tap-next'&&e.resource.generation===s.index;
  const rules:Rule<P,S,E,Action<unknown>>[]=[
    rule('tap','START','Unsubscribed','subscribe','Active','new connection',
      ['subscribe source'],'A tap description is lazy and per-subscriber.',()=>true,
      ()=>({state:{phase:'Active',index:0},actions:[acquire()]})),
    rule('tap','IDENTITY','Active','source.next','Active','no observer/handler supplied',
      ['forward identical value'],'tap() without callbacks is exactly the source identity.',
      (s,_e,q)=>active(s)&&!q.withNext,(s,e)=>{
        if(!active(s)||e.type!=='source.next')throw Error('tap identity');
        return {state:{phase:'Active',index:s.index+1},actions:[emit(e.value)]};
      }),
    rule('tap','CALL-NEXT','Active','source.next','Calling','next handler present and index safe',
      ['invoke tap next handler before forwarding'],'The callback is an effect boundary; its outcome is correlated, not assumed.',
      (s,_e,q)=>active(s)&&q.withNext&&Number.isSafeInteger(s.index)&&s.index<Number.MAX_SAFE_INTEGER,
      (s,e)=>{
        if(!active(s)||e.type!=='source.next')throw Error('tap invoke');
        return {state:{phase:'Calling',index:s.index,value:e.value},
          actions:[{type:'invoke-callback',resource:ref('tap-next',s.index),value:e.value,index:s.index}]};
      }),
    rule('tap','NEXT-RETURN','Calling','callback.return','Active','matching handler success',
      ['forward original source value unchanged'],'The handler result is ignored; downstream gets the exact object originally received.',
      (s,e)=>match(s,e),s=>{
        if(!calling(s))throw Error('tap return');
        return {state:{phase:'Active',index:s.index+1},actions:[emit(s.value)]};
      }),
    rule('tap','NEXT-THROW','Calling','callback.throw','Closed','matching handler throws',
      ['propagate exact thrown error and release upstream'],'A synchronous tap handler failure replaces the pending next with error.',
      (s,e)=>match(s,e),(_s,e)=>{
        if(e.type!=='callback.throw')throw Error('tap throw');
        return {state:closed('callback-error'),actions:[fail(e.error),release()]};
      }),
    rule('tap','COMPLETE','Active','source.complete','Closed','source completes',
      ['forward complete; release source'],'No next handler is invoked on successful completion.',
      s=>active(s),()=>({state:closed('complete'),actions:[done,release()]})),
    rule('tap','ERROR','Active','source.error','Closed','source fails',
      ['forward identical error and release source'],'No next handler is invoked on an upstream error.',
      s=>active(s),(_s,e)=>{
        if(e.type!=='source.error')throw Error('tap error');
        return {state:closed('error'),actions:[fail(e.error),release()]};
      }),
    ...(['Active','Calling'] as const).map(phase=>rule<P,S,E>('tap','CANCEL-'+phase.toUpperCase(),phase,'cancel','Closed',
      'consumer cancels',['silently release source'],'No callbacks or notifications after cancellation.',
      s=>s.phase===phase,()=>({state:closed('cancel'),actions:[release()]})))
  ];
  return {parameters:p,rules,initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>('index'in s&&(!Number.isSafeInteger(s.index)||s.index<0))?['bad callback index']:[],
    validateReaction:(_s,_e,r)=>checkActions(r.actions),
    metadata:metadata({operator:'tap',purpose:'Inspect each next value through a correlated handler without modifying it.',
      signature:'tap(observer.next?): Cω(Effect) → T* → T*',
      conditions:['A successful callback forwards the exact source value once.','A thrown handler error terminates and releases source.','Source terminal/errors pass through unchanged.'],
      parameters:'A supplied next-only handler or no handler (identity).',
      callbacks:'One synchronous next handler, modeled as callback invocation and return/throw inputs.',
      time:'No scheduler or timing changes. The next handler runs before downstream next.',
      exclusions:['TapObserver subscribe, unsubscribe, finalize, error and complete hooks; deprecated positional overload; reentrancy and throwing teardown.'],
      controls:controls([{id:'Calling',description:'await correlated next callback outcome',terminal:false}]),
      inputs:[...baseInputs,event('callback.return','callback','callback','next handler returns normally'),
        event('callback.throw','callback','callback','next handler throws exact error')],
      resources:[{id:'source',kind:'subscription',owner:'result'},{id:'tap-next',kind:'callback',owner:'one source notification'}],
      actionTypes:['subscribe','unsubscribe','notify','invoke-callback']})};
}
export const tapExample:readonly TimedEvent<TapEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},{time:1,event:{type:'source.next',value:'one'}},
  {time:1,event:{type:'callback.return',resource:ref('tap-next',0)}},
  {time:2,event:{type:'source.next',value:'two'}},
  {time:2,event:{type:'callback.return',resource:ref('tap-next',1)}},
  {time:3,event:{type:'source.complete'}}
];

export type ThrowIfEmptyParameters=Readonly<{factory:'default'|'custom'}>;
export type ThrowIfEmptyState=
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Active';seen:boolean}>
  | Readonly<{phase:'CallingFactory'}>
  | Readonly<{phase:'Closed';reason:'complete'|'error'|'cancel'|'callback-error'}>;
export type ThrowIfEmptyEvent<T>=SimpleSourceEvent<T>
  | Readonly<{type:'factory.return';resource:ResourceRef;value:unknown}>
  | Readonly<{type:'factory.throw';resource:ResourceRef;error:unknown}>;
export type ThrowIfEmptyModel<T>=OperatorModel<ThrowIfEmptyParameters,ThrowIfEmptyState,ThrowIfEmptyEvent<T>,Action<unknown>>;

/** Error factory is invoked *only* at the successful completion of an empty source. */
export function createThrowIfEmptyModel<T>(factory:'default'|'custom'='default'):ThrowIfEmptyModel<T> {
  type P=ThrowIfEmptyParameters;type S=ThrowIfEmptyState;type E=ThrowIfEmptyEvent<T>;
  const p:P={factory};
  const active=(s:S):s is Extract<S,{phase:'Active'}>=>s.phase==='Active';
  const matches=(e:E)=>'resource'in e&&e.resource.id==='errorFactory'&&e.resource.generation===0;
  const rules:Rule<P,S,E,Action<unknown>>[]=[
    rule('throwIfEmpty','START','Unsubscribed','subscribe','Active','new downstream subscription',
      ['subscribe source'],'The seen-value bit is local to the subscription.',()=>true,
      ()=>({state:{phase:'Active',seen:false},actions:[acquire()]})),
    rule('throwIfEmpty','FORWARD','Active','source.next','Active','any value, including undefined',
      ['mark nonempty and forward identical value'],'Presence, not truthiness or content, determines emptiness.',
      s=>active(s),(s,e)=>{
        if(e.type!=='source.next')throw Error('throwIfEmpty next');
        return {state:{phase:'Active',seen:true},actions:[emit(e.value)]};
      }),
    rule('throwIfEmpty','COMPLETE-NONEMPTY','Active','source.complete','Closed','seen at least one source next',
      ['complete normally, release source'],'No factory invocation for a non-empty source.',
      s=>active(s)&&s.seen,()=>({state:closed('complete'),actions:[done,release()]})),
    rule('throwIfEmpty','COMPLETE-EMPTY-DEFAULT','Active','source.complete','Closed','empty and default factory',
      ['signal EmptyError, release source'],'The default EmptyError is created at completion.',
      (s,_e,q)=>active(s)&&!s.seen&&q.factory==='default',()=>({
        state:closed('error'),actions:[fail(Object.assign(new Error('no elements in sequence'),{name:'EmptyError'})),release()]})),
    rule('throwIfEmpty','COMPLETE-EMPTY-CUSTOM','Active','source.complete','CallingFactory','empty and custom error factory',
      ['release completed source','invoke error factory once'],'Factory invocation occurs only after confirmed empty completion.',
      (s,_e,q)=>active(s)&&!s.seen&&q.factory==='custom',()=>({
        state:{phase:'CallingFactory'},actions:[release(),{type:'invoke-callback',resource:ref('errorFactory'),value:null,index:0}]})),
    rule('throwIfEmpty','FACTORY-RETURN','CallingFactory','factory.return','Closed','correlated factory return',
      ['error with exact factory-produced value'],'An errorFactory return is the error payload, never a next value.',
      (_s,e)=>matches(e),(_s,e)=>{
        if(e.type!=='factory.return')throw Error('factory return');
        return {state:closed('error'),actions:[fail(e.value)]};
      }),
    rule('throwIfEmpty','FACTORY-THROW','CallingFactory','factory.throw','Closed','correlated factory throw',
      ['error with exact thrown value'],'A throwing factory also terminates the result with error.',
      (_s,e)=>matches(e),(_s,e)=>{
        if(e.type!=='factory.throw')throw Error('factory throw');
        return {state:closed('callback-error'),actions:[fail(e.error)]};
      }),
    rule('throwIfEmpty','SOURCE-ERROR','Active','source.error','Closed','source fails',
      ['forward source error identity; release source'],'Upstream error is not replaced with EmptyError.',
      s=>active(s),(_s,e)=>{
        if(e.type!=='source.error')throw Error('source error');
        return {state:closed('error'),actions:[fail(e.error),release()]};
      }),
    rule('throwIfEmpty','CANCEL','Active','cancel','Closed','downstream cancels',
      ['release source silently'],'Cancellation does not trigger an empty error.',
      s=>active(s),()=>({state:closed('cancel'),actions:[release()]}))
  ];
  return {parameters:p,rules,initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:()=>[],validateReaction:(_s,_e,r)=>checkActions(r.actions),
    metadata:metadata({operator:'throwIfEmpty',purpose:'Forward an existing stream; turn only an empty successful completion into an error.',
      signature:'throwIfEmpty(factory?): Cω(ErrorFactory) → T* → T*',
      conditions:['Every source next is forwarded unchanged.','Empty successful completion yields one error.','Factory not invoked on a source error or cancellation.'],
      parameters:'Default EmptyError or a synchronous user errorFactory.',
      callbacks:'Custom factory invocation and its return/throw are correlated events.',
      time:'Immediate passthrough; factory runs only on completed empty source.',
      exclusions:['Reentrant callback/outcome, throwing teardown and malformed factory inputs.'],
      controls:controls([{id:'CallingFactory',description:'empty source ended; custom factory result awaited',terminal:false}]),
      inputs:[...baseInputs,event('factory.return','callback','callback','factory returns exact error value'),
        event('factory.throw','callback','callback','factory throws exact value')],
      resources:[{id:'source',kind:'subscription',owner:'result'},{id:'errorFactory',kind:'callback',owner:'empty completion'}],
      actionTypes:['subscribe','unsubscribe','notify','invoke-callback']})};
}
export const throwIfEmptyExample:readonly TimedEvent<ThrowIfEmptyEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},{time:1,event:{type:'source.complete'}}
];
