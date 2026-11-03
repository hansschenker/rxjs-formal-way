import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';

/** Session 6: terminal aggregation, with effects represented as ordered actions. */
export type AggregateOperator = 'reduce' | 'count' | 'toArray' | 'min' | 'max';
export type AggregateMode = 'seeded' | 'unseeded' | 'plain' | 'predicate' | 'default' | 'comparer';
export type AggregateMemory<M> =
  | Readonly<{ present: false }>
  | Readonly<{ present: true; value: M }>;
export type AggregateParameters<M> = Readonly<{
  operator: AggregateOperator;
  mode: AggregateMode;
  seed: AggregateMemory<M>;
  callbackId: string;
}>;
export type AggregateArguments<T, M> = Readonly<{ previous: M; incoming: T }>;
export type AggregateCloseReason = 'complete' | 'source-error' | 'callback-error' | 'cancel';
export type AggregateState<T, M> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Collecting'; index: number; memory: AggregateMemory<M> }>
  | Readonly<{ phase: 'Calling'; index: number; callId: number; memory: Readonly<{present:true; value:M}>; input: T }>
  | Readonly<{ phase: 'Closed'; reason: AggregateCloseReason }>;
export type AggregateEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; value: unknown }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>;
export type AggregateModel<T, M> = OperatorModel<AggregateParameters<M>, AggregateState<T, M>, AggregateEvent<T>, Action<M, AggregateArguments<T, M>>>;

const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const source = { id: 'source', generation: 0 } as const;
const acquire = { type: 'subscribe', resource: source } as const;
const release = { type: 'unsubscribe', resource: source } as const;
const complete = { type: 'notify', target: 'downstream', notification: { kind: 'C' } } as const;
const next = <T, M>(value: M): Action<M, AggregateArguments<T, M>> => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const error = <T, M>(e: unknown): Action<M, AggregateArguments<T, M>> => ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: e } });
const some = <M>(value: M): AggregateMemory<M> => ({ present: true, value });
const none = <M>(): AggregateMemory<M> => ({ present: false });
const safe = (n: number): boolean => Number.isSafeInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER;
const callbackNeeded = (p: AggregateParameters<unknown>, memory: AggregateMemory<unknown>): boolean =>
  (p.operator === 'reduce' || p.operator === 'min' || p.operator === 'max' ||
    (p.operator === 'count' && p.mode === 'predicate')) && memory.present;
const witnesses = (operator: string, ...suffix: string[]): readonly string[] => suffix.map(s => 'S6-' + operator.toUpperCase() + '-' + s);

function metadata<M>(p: AggregateParameters<M>): ModelMetadata {
  const op = p.operator;
  const hasCallback = op === 'reduce' || op === 'min' || op === 'max' || p.mode === 'predicate';
  const shapes: Record<AggregateOperator, string> = {
    reduce: 'reduce : ((A + S)! x T! x Index! -> A!) x S? -> T* -> A?',
    count: 'count : (T! x Index! -> Boolean!)? -> T* -> Number?',
    toArray: 'toArray : T* -> (T[])?',
    min: 'min : (T! x T! -> Number!)? -> T* -> T?',
    max: 'max : (T! x T! -> Number!)? -> T* -> T?',
  };
  const behavior: Record<AggregateOperator, string> = {
    reduce: 'Accumulate every source value, but emit the final accumulation only on successful source completion.',
    count: 'Remember the number of source values (or matching predicate results) and emit it only on completion.',
    toArray: 'Collect source values into a fresh per-subscription array and emit that array only on completion.',
    min: 'Remember the candidate minimum and emit it on completion; equal or incomparable comparisons choose the later item.',
    max: 'Remember the candidate maximum and emit it on completion; equal or incomparable comparisons choose the later item.',
  };
  return {
    schemaVersion: '1.1', id: op + '-' + p.mode, operator: op, rxjsVersion: '7.8.2',
    purpose: behavior[op],
    cardinality: {
      signature: shapes[op],
      conditions: [
        'Cω-inspired successful value-shape notation; terminal and subscription behavior are specified independently.',
        'Only a normally completing source causes an output: one value for seeded reduce, count and toArray; at most one for unseeded reduce, min and max.',
        'No value is emitted during accumulation. Errors and cancellation discard pending results.',
        op === 'reduce' ? 'An absent seed differs from a supplied undefined seed; the first unseeded value bypasses the reducer.' :
          op === 'count' ? 'An empty source emits zero; a predicate is invoked with the original value and source index.' :
          op === 'toArray' ? 'An empty source emits an empty array allocated separately for each result subscription.' :
          'An empty source emits no extremum; candidate comparison is against the prior remembered value.',
      ],
    },
    scope: {
      parameters: op + ' in ' + p.mode + ' profile; safe-integer source indices',
      callbacks: hasCallback
        ? 'The model requests a correlated callback with {previous, incoming} and source index. An external adapter invokes the reducer, predicate or comparison once; return/throw arrives as an explicit input.'
        : 'No externally supplied callback. The count increment and toArray append are pure internal transitions.',
      time: 'No clock, timer or scheduler allocated. Input times and equal-time order are supplied by the source/test environment.',
      reentrancy: 'Non-reentrant source and callback/observer reactions; only correlated callback outcomes are legal while Calling.',
      exclusions: [
        'Reentrant synchronous source delivery or cancellation within reducer/predicate/comparer or destination.next.',
        'Throwing finalizers or downstream observers, arbitrary ObservableInput coercion, invalid count/index overflows.',
        'Array mutation by consumers before emission, object property getter side effects, custom comparator reentrancy.',
        'Finite bounded tests are not universal equivalence proofs or a production interpreter.',
      ],
    },
    initialization: {
      control: 'Unsubscribed', event: 'subscribe',
      sourceSubscription: 'Connect lazily. Create fresh count/array memory at each subscription; never emit an initial result.',
    },
    ownership: {
      state: 'subscription-local', sharing: 'Each result subscription owns its own accumulation and index; no replay or sharing is introduced. Payload references are opaque.',
      reset: 'Fresh bookkeeping and a fresh toArray buffer per subscription; any caller-supplied reduce seed is held by identity, not deep-cloned.',
      resources: [
        { id: 'source', kind: 'subscription', owner: 'one result subscriber' },
        ...(hasCallback ? [{ id: p.callbackId, kind: 'callback' as const, owner: 'external synchronous callback invocation' }] : []),
      ],
    },
    dispatch: {
      policy: 'atomic-non-reentrant',
      actionSemantics: 'Only a matching callback.return or callback.throw can exit Calling; transition outputs are descriptive commands, not executed effects.',
      cancellationCheckpoints: ['Between resolved source values: release source without flushing.', 'Calling/observer-delivery cancellation is outside the accepted profile.'],
    },
    inputs: [
      { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'a new result subscriber starts execution' },
      { type: 'source.next', origin: 'source', category: 'notification', description: 'the source delivers one original value' },
      { type: 'callback.return', origin: 'callback', category: 'callback', description: 'the matching reducer/predicate/comparison returns' },
      { type: 'callback.throw', origin: 'callback', category: 'callback', description: 'the matching reducer/predicate/comparison throws' },
      { type: 'source.complete', origin: 'source', category: 'notification', description: 'the source completes successfully' },
      { type: 'source.error', origin: 'source', category: 'notification', description: 'the source fails' },
      { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'the result subscriber unsubscribes' },
    ],
    actionTypes: hasCallback ? ['subscribe', 'invoke-callback', 'notify', 'unsubscribe'] : ['subscribe', 'notify', 'unsubscribe'],
    controls: [
      { id: 'Unsubscribed', description: 'before connection', terminal: false },
      { id: 'Collecting', description: 'remembering a candidate/count/array; no downstream values yet', terminal: false },
      { id: 'Calling', description: 'waiting for a named synchronous callback outcome', terminal: false },
      { id: 'Closed', description: 'completed, errored or cancelled', terminal: true },
    ],
    sources: ['src/internal/operators/' + op + '.ts',
      'src/internal/operators/reduce.ts', 'src/internal/operators/scanInternals.ts',
      'src/internal/operators/OperatorSubscriber.ts'].filter((s, i, a) => a.indexOf(s) === i)
      .map(path => ({url:'https://github.com/ReactiveX/rxjs/blob/' + revision + '/' + path,revision,purpose:'Pinned 7.8.2 aggregation and callback/termination policy'})),
    evidence: {
      modelTests: ['tests/session06-model.test.mjs'],
      runtimeTests: ['tests/session06-rxjs.test.mjs'],
      status: 'source-inspected', record: 'evidence/SESSION-06.md',
    },
  };
}

const chooseInitial = <M>(p: AggregateParameters<M>): AggregateMemory<M> => {
  if (p.operator === 'count') return some(0 as M);
  if (p.operator === 'toArray') return some([] as unknown as M);
  return p.seed;
};

function build<T, M>(p: AggregateParameters<M>): AggregateModel<T, M> {
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(p.callbackId) || p.callbackId === 'source') throw new TypeError('invalid callback binding');
  if ((p.operator === 'reduce' && !['seeded','unseeded'].includes(p.mode)) ||
    (p.operator === 'count' && !['plain','predicate'].includes(p.mode)) ||
    (p.operator === 'toArray' && p.mode !== 'plain') ||
    ((p.operator === 'min' || p.operator === 'max') && !['default','comparer'].includes(p.mode))) {
    throw new TypeError('invalid aggregate operator/profile');
  }
  const rules: Rule<AggregateParameters<M>, AggregateState<T,M>, AggregateEvent<T>, Action<M,AggregateArguments<T,M>>>[] = [];
  const rule = (
    id: string, from: AggregateState<T,M>['phase'], event: AggregateEvent<T>['type'], guard: string,
    to: AggregateState<T,M>['phase'], explanation: string, actions: string[], obligations: string[],
    enabled: (s: AggregateState<T,M>, e: AggregateEvent<T>) => boolean,
    react: (s: AggregateState<T,M>, e: AggregateEvent<T>) => {state: AggregateState<T,M>; actions: readonly Action<M,AggregateArguments<T,M>>[]},
  ): void => {
    rules.push({description:{
      id: 'AGG-' + p.operator.toUpperCase() + '-' + p.mode.toUpperCase() + '-' + id,
      from, event, guard, to, actions, nextState: explanation,
      explanation, obligations: witnesses(p.operator, ...obligations),
    }, enabled, react});
  };
  rule('INIT','Unsubscribed','subscribe','fresh subscription','Collecting',
    'Subscription allocates a fresh local aggregate; no seed or count value is emitted yet.',
    ['connect source','initialize private accumulation'],['01','02'],()=>true,
    () => ({state:{phase:'Collecting',index:0,memory:chooseInitial(p)},actions:[acquire]}));
  rule('FIRST','Collecting','source.next','no memory and a safe source index','Collecting',
    'Without seed, the first source value becomes memory. It does not invoke a reducer or comparer.',
    ['remember original value, no output'],['03','04'],
    s=>s.phase==='Collecting'&&!s.memory.present&&s.index<Number.MAX_SAFE_INTEGER,
    (s,e)=>{
      if(s.phase!=='Collecting'||e.type!=='source.next') throw new Error('invalid first value');
      return {state:{phase:'Collecting',index:s.index+1,memory:some(e.value as unknown as M)},actions:[]};
    });
  rule('PLAIN-COUNT','Collecting','source.next','count without predicate; safe source index','Collecting',
    'Count every source next; retain only the new count and source index. No value is emitted until completion.',
    ['increment private count; no output'],['05'],
    s=>s.phase==='Collecting'&&p.operator==='count'&&p.mode==='plain'&&s.index<Number.MAX_SAFE_INTEGER,
    (s,e)=>{
      if(s.phase!=='Collecting'||e.type!=='source.next'||!s.memory.present) throw new Error('invalid count');
      const count=s.memory.value as number;
      if(!safe(count+1)) throw new RangeError('count exceeds safe domain');
      return {state:{phase:'Collecting',index:s.index+1,memory:some((count+1) as M)},actions:[]};
    });
  rule('APPEND','Collecting','source.next','array profile; safe source index','Collecting',
    'Keep a new immutable model snapshot of the values seen so far. Native toArray owns a mutable array, but emits only after completion.',
    ['remember one original reference in the ordered array; no output'],['05'],
    s=>s.phase==='Collecting'&&p.operator==='toArray'&&s.index<Number.MAX_SAFE_INTEGER,
    (s,e)=>{
      if(s.phase!=='Collecting'||e.type!=='source.next'||!s.memory.present||!Array.isArray(s.memory.value))throw new Error('invalid array');
      return {state:{phase:'Collecting',index:s.index+1,memory:some([...s.memory.value,e.value] as unknown as M)},actions:[]};
    });
  rule('CALL','Collecting','source.next','memory exists and callback is required; safe index','Calling',
    'Request exactly one callback, with the remembered value, incoming input and zero-based source index. No callback is run by the pure model.',
    ['invoke named callback with retained arguments'],['06','07'],
    s=>s.phase==='Collecting'&&callbackNeeded(p,s.memory)&&s.index<Number.MAX_SAFE_INTEGER,
    (s,e)=>{
      if(s.phase!=='Collecting'||e.type!=='source.next'||!s.memory.present)throw new Error('invalid callback call');
      return {
        state:{phase:'Calling',index:s.index+1,callId:s.index,memory:s.memory,input:e.value},
        actions:[{type:'invoke-callback',resource:{id:p.callbackId,generation:s.index},index:s.index,value:{previous:s.memory.value,incoming:e.value}}],
      };
    });
  const matched=(s:AggregateState<T,M>,e:AggregateEvent<T>):boolean=>s.phase==='Calling'&&
    (e.type==='callback.return'||e.type==='callback.throw')&&e.resource.id===p.callbackId&&e.resource.generation===s.callId;
  rule('RETURN','Calling','callback.return','matches pending callback identity','Collecting',
    'Store the reducer result, add the predicate truthiness to count, or select the extremum based on comparison sign; still emit nothing.',
    ['update aggregate from correlated callback outcome; no output'],['06','07','08'],matched,
    (s,e)=>{
      if(s.phase!=='Calling'||e.type!=='callback.return')throw new Error('invalid callback return');
      let value:M;
      if(p.operator==='reduce') value=e.value as M;
      else if(p.operator==='count'){
        const count=s.memory.value as number;
        const n=count+(e.value?1:0);
        if(!safe(n))throw new RangeError('count exceeds safe domain');
        value=n as M;
      } else {
        // RxJS comparator semantics: strict sign; ties, NaN and zero choose the later value.
        const keep=(p.operator==='min' ? (e.value as number)<0 : (e.value as number)>0);
        value=keep?s.memory.value:s.input as unknown as M;
      }
      return {state:{phase:'Collecting',index:s.index,memory:some(value)},actions:[]};
    });
  rule('THROW','Calling','callback.throw','matches pending callback identity','Closed',
    'Callback failure forwards the exact thrown value, cancels upstream and discards the pending aggregate.',
    ['notify error unchanged','unsubscribe source'],['09'],matched,
    (_s,e)=>{
      if(e.type!=='callback.throw')throw new Error('invalid callback throw');
      return {state:{phase:'Closed',reason:'callback-error'},actions:[error<T,M>(e.error),release]};
    });
  rule('COMPLETE-SOME','Collecting','source.complete','aggregate memory is present','Closed',
    'Only source completion emits the final aggregate once followed by completion, then releases the source.',
    ['notify final next','notify complete','unsubscribe source'],['02','10'],
    s=>s.phase==='Collecting'&&s.memory.present,
    s=>{
      if(s.phase!=='Collecting'||!s.memory.present)throw new Error('missing aggregate');
      return {state:{phase:'Closed',reason:'complete'},actions:[next<T,M>(s.memory.value),complete,release]};
    });
  rule('COMPLETE-EMPTY','Collecting','source.complete','no seed and no source values','Closed',
    'Empty unseeded reduce and empty min/max complete without emitting a value.',
    ['notify complete','unsubscribe source'],['02','10'],
    s=>s.phase==='Collecting'&&!s.memory.present,
    ()=>({state:{phase:'Closed',reason:'complete'},actions:[complete,release]}));
  rule('ERROR','Collecting','source.error','no unresolved callback','Closed',
    'Source errors discard the aggregate and preserve the original error identity; no completion follows.',
    ['notify source error unchanged','unsubscribe source'],['11'],
    ()=>true,(_s,e)=>{
      if(e.type!=='source.error')throw new Error('invalid source error');
      return {state:{phase:'Closed',reason:'source-error'},actions:[error<T,M>(e.error),release]};
    });
  rule('CANCEL','Collecting','cancel','between resolved notifications','Closed',
    'Unsubscription releases the upstream resource silently, without flushing the aggregate.',
    ['unsubscribe source without any terminal notification'],['12'],()=>true,
    ()=>({state:{phase:'Closed',reason:'cancel'},actions:[release]}));

  return {
    parameters:p, metadata:metadata(p), rules,
    initialState:()=>({phase:'Unsubscribed'}),
    control:s=>s.phase,
    validateState:s=>{
      if(s.phase==='Unsubscribed')return [];
      if(s.phase==='Closed')return ['complete','source-error','callback-error','cancel'].includes(s.reason)?[]:['invalid terminal reason'];
      if(!safe(s.index))return ['invalid index'];
      if(s.phase==='Calling'){
        if(!safe(s.callId)||s.callId>=Number.MAX_SAFE_INTEGER||s.index!==s.callId+1||!Object.hasOwn(s,'input')||
          !s.memory.present||!callbackNeeded(p,s.memory))return ['invalid pending callback or index'];
        return [];
      }
      const memory=s.memory;
      if(!memory||typeof memory.present!=='boolean'||(memory.present&&!Object.hasOwn(memory,'value')))return ['invalid memory presence'];
      if((p.operator==='count'&&(!memory.present||typeof memory.value!=='number'||!safe(memory.value)))||
         (p.operator==='toArray'&&(!memory.present||!Array.isArray(memory.value)||memory.value.length!==s.index))||
         ((p.operator==='min'||p.operator==='max'||(p.operator==='reduce'&&p.mode==='unseeded'))&&
           (s.index===0 ? memory.present : !memory.present))||
         (p.operator==='reduce'&&p.mode==='seeded'&&!memory.present))return ['invalid aggregate state'];
      return [];
    },
    validateReaction:(before,event,result)=>{
      const errors=[...validateActionWord(result.actions)];
      for(const a of result.actions){
        if(a.type==='notify' && a.target!=='downstream')errors.push('unknown subscriber');
        else if(a.type==='invoke-callback'){
          if(before.phase!=='Collecting'||event.type!=='source.next'||!before.memory.present||
             a.resource.id!==p.callbackId||a.index!==before.index||!Object.is(a.value.previous,before.memory.value)||
             !Object.is(a.value.incoming,event.value))errors.push('invalid callback request');
        } else if(a.type!=='notify' && (a.resource.id!=='source'||a.resource.generation!==0))errors.push('unknown resource');
      }
      const kinds=result.actions.map(a=>a.type==='notify'?a.notification.kind:a.type);
      const same=(a:readonly string[])=>a.length===kinds.length&&a.every((v,i)=>v===kinds[i]);
      if(event.type==='source.complete'&&before.phase==='Collecting'&&!same(before.memory.present?['N','C','unsubscribe']:['C','unsubscribe']))errors.push('incorrect completion/flush word');
      if(event.type==='source.error'&&!same(['E','unsubscribe']))errors.push('incorrect error word');
      if(event.type==='callback.throw'&&!same(['E','unsubscribe']))errors.push('incorrect callback error word');
      if(event.type==='cancel'&&!same(['unsubscribe']))errors.push('incorrect cancellation word');
      if(event.type==='source.next'&&result.state.phase==='Calling'&&!same(['invoke-callback']))errors.push('missing callback request');
      if(event.type==='source.next'&&result.state.phase==='Collecting'&&kinds.length)errors.push('accumulation must remain silent');
      if(event.type==='callback.return'&&kinds.length)errors.push('callback success must remain silent');
      return errors;
    },
  };
}

export const createSeededReduceModel = <T,M>(seed:M): AggregateModel<T,M> => build<T,M>({operator:'reduce',mode:'seeded',seed:some(seed),callbackId:'aggregate-callback'});
export const createUnseededReduceModel = <T>(): AggregateModel<T,T> => build<T,T>({operator:'reduce',mode:'unseeded',seed:none(),callbackId:'aggregate-callback'});
export const createCountModel = <T>(withPredicate=false): AggregateModel<T,number> => build<T,number>({operator:'count',mode:withPredicate?'predicate':'plain',seed:some(0),callbackId:'aggregate-callback'});
export const createToArrayModel = <T>(): AggregateModel<T,readonly T[]> => build<T,readonly T[]>({operator:'toArray',mode:'plain',seed:some([]),callbackId:'aggregate-callback'});
export const createMinModel = <T>(customComparer=false): AggregateModel<T,T> => build<T,T>({operator:'min',mode:customComparer?'comparer':'default',seed:none(),callbackId:'aggregate-callback'});
export const createMaxModel = <T>(customComparer=false): AggregateModel<T,T> => build<T,T>({operator:'max',mode:customComparer?'comparer':'default',seed:none(),callbackId:'aggregate-callback'});

const cb=(generation:number)=>({id:'aggregate-callback',generation});
const at=<T>(time:number,event:AggregateEvent<T>):TimedEvent<AggregateEvent<T>>=>({time,event});
export const reduceSeededExample: readonly TimedEvent<AggregateEvent<number>>[]=[
  at(0,{type:'subscribe'}),at(1,{type:'source.next',value:2}),at(1,{type:'callback.return',resource:cb(0),value:2}),
  at(2,{type:'source.next',value:3}),at(2,{type:'callback.return',resource:cb(1),value:5}),at(3,{type:'source.complete'}),
];
export const reduceUnseededExample: readonly TimedEvent<AggregateEvent<number>>[]=[
  at(0,{type:'subscribe'}),at(1,{type:'source.next',value:2}),at(2,{type:'source.next',value:3}),
  at(2,{type:'callback.return',resource:cb(1),value:5}),at(3,{type:'source.complete'}),
];
export const countExample: readonly TimedEvent<AggregateEvent<number>>[]=[
  at(0,{type:'subscribe'}),at(1,{type:'source.next',value:1}),at(2,{type:'source.next',value:2}),at(3,{type:'source.complete'}),
];
export const countPredicateExample: readonly TimedEvent<AggregateEvent<number>>[]=[
  at(0,{type:'subscribe'}),at(1,{type:'source.next',value:1}),at(1,{type:'callback.return',resource:cb(0),value:true}),
  at(2,{type:'source.next',value:2}),at(2,{type:'callback.return',resource:cb(1),value:false}),at(3,{type:'source.complete'}),
];
export const toArrayExample: readonly TimedEvent<AggregateEvent<string>>[]=[
  at(0,{type:'subscribe'}),at(1,{type:'source.next',value:'a'}),at(2,{type:'source.next',value:'b'}),at(3,{type:'source.complete'}),
];
export const minExample: readonly TimedEvent<AggregateEvent<number>>[]=[
  at(0,{type:'subscribe'}),at(1,{type:'source.next',value:5}),at(2,{type:'source.next',value:3}),
  at(2,{type:'callback.return',resource:cb(1),value:2}),at(3,{type:'source.next',value:4}),
  at(3,{type:'callback.return',resource:cb(2),value:-1}),at(4,{type:'source.complete'}),
];
export const maxExample: readonly TimedEvent<AggregateEvent<number>>[]=[
  at(0,{type:'subscribe'}),at(1,{type:'source.next',value:5}),at(2,{type:'source.next',value:3}),
  at(2,{type:'callback.return',resource:cb(1),value:2}),at(3,{type:'source.next',value:9}),
  at(3,{type:'callback.return',resource:cb(2),value:-4}),at(4,{type:'source.complete'}),
];
