import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { natural, pinnedRevision } from './session10-common.js';

/**
 * Session 16: five export names, two composable behaviors.
 * pluck is source-local projection. The four publish variants are long-lived
 * connectable objects, NOT ordinary subscription-local pipeable transforms.
 * All observations and commands are returned as pure data.
 */
export type PluckParameters = Readonly<{ path: readonly string[] }>;
export type PluckState = Readonly<{
  phase: 'Unsubscribed' | 'Active' | 'Closed';
  count: number;
  reason: 'none' | 'complete' | 'error' | 'cancel';
}>;
export type PluckEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;
export type PluckModel<T> = OperatorModel<PluckParameters, PluckState, PluckEvent<T>, Action<unknown>>;

const source = (generation = 0): ResourceRef => ({ id: 'source', generation });
const observer = (n: number): ResourceRef => ({ id: 'observer', generation: n });
const sub = (ref: ResourceRef): Action<unknown> => ({ type: 'subscribe', resource: ref });
const unsub = (ref: ResourceRef): Action<unknown> => ({ type: 'unsubscribe', resource: ref });
const notify = (target: string, value: unknown): Action<unknown> =>
  ({ type: 'notify', target, notification: { kind: 'N', value } });
const done = (target: string): Action<unknown> =>
  ({ type: 'notify', target, notification: { kind: 'C' } });
const fail = (target: string, error: unknown): Action<unknown> =>
  ({ type: 'notify', target, notification: { kind: 'E', error } });
const input = (type: string, origin: 'downstream' | 'source', description: string) => ({
  type, origin, category: (origin === 'downstream' ? 'lifecycle' : 'notification') as 'lifecycle' | 'notification', description,
});
const reference = (path: string) => ({
  url: 'https://github.com/ReactiveX/rxjs/blob/' + pinnedRevision + '/' + path,
  revision: pinnedRevision, purpose: 'Pinned RxJS 7.8.2 source and subscription lifecycle',
});
const description = (
  operator: string, id: string, from: string, event: string, to: string,
  guard: string, actions: readonly string[], explanation: string, nextState: string,
) => ({
  id: 'S16-' + operator.toUpperCase() + '-' + id,
  from, event, to, guard, actions, explanation, nextState,
  obligations: ['S16-' + operator.toUpperCase() + '-' + id],
});

/** The path is data, not a user callback. No getters/proxies in the accepted domain. */
export function pluckPath(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const key of path) {
    const projected = current == null ? undefined : (current as Record<string, unknown>)[key];
    if (typeof projected === 'undefined') return undefined;
    current = projected;
  }
  return current;
}
export function createPluckModel<T>(path: readonly string[] = ['person', 'name']): PluckModel<T> {
  if (!path.length || path.some(key => !key.length)) throw new Error('non-empty property path required');
  const p: PluckParameters = { path: [...path] };
  type S = PluckState; type E = PluckEvent<T>; type A = Action<unknown>;
  type R = Rule<PluckParameters, S, E, A>;
  const closed = (s: S, reason: S['reason']): S => ({ phase: 'Closed', count: s.count, reason });
  const rules: R[] = [
    {
      description: description('pluck','INIT','Unsubscribed','subscribe','Active',
        'first downstream connection',['subscribe one source'], 'One independent cold execution begins for each downstream subscription.',
        'Active with zero projected values.'),
      enabled: () => true,
      react: () => ({ state: { phase: 'Active', count: 0, reason: 'none' }, actions: [sub(source())] }),
    },
    {
      description: description('pluck','NEXT','Active','source.next','Active',
        'plain-data property path can be read',['emit one nested property value, including undefined'],
        'Walk the configured keys in order. A null or undefined intermediate stops the walk and produces undefined.',
        'Active with source value count increased by one.'),
      enabled: () => true,
      react: (s, e) => {
        if (e.type !== 'source.next') throw Error('expected next');
        return { state: { ...s, count: s.count + 1 }, actions: [notify('downstream', pluckPath(e.value, p.path))] };
      },
    },
    {
      description: description('pluck','COMPLETE','Active','source.complete','Closed','source completes',
        ['forward completion and release source'], 'The operator adds no values on completion.',
        'Closed complete; no source ownership.'),
      enabled: () => true, react: s => ({ state: closed(s, 'complete'), actions: [unsub(source()), done('downstream')] }),
    },
    {
      description: description('pluck','ERROR','Active','source.error','Closed','source errors',
        ['forward exact error and release source'], 'Source failure is not converted into a property value.',
        'Closed error; no source ownership.'),
      enabled: () => true, react: (s, e) => {
        if (e.type !== 'source.error') throw Error('expected error');
        return { state: closed(s, 'error'), actions: [fail('downstream', e.error), unsub(source())] };
      },
    },
    {
      description: description('pluck','CANCEL','Active','cancel','Closed','downstream cancels',
        ['release source without notifying downstream'], 'Cancellation stops this independent projection execution.',
        'Closed cancelled; no source ownership.'),
      enabled: () => true, react: s => ({ state: closed(s, 'cancel'), actions: [unsub(source())] }),
    },
  ];
  const metadata: ModelMetadata = {
    schemaVersion: '1.1', id: 'pluck-plain-data-path', operator: 'pluck', rxjsVersion: '7.8.2',
    purpose: 'Deprecated nested-property projection implemented as a map; preserves value order and timing.',
    cardinality: {
      signature: 'pluck(path) : T* -> U* (one output next per source next)',
      conditions: [
        'Every source next yields exactly one projected value, even if the property is missing.',
        'The source error/completion and the downstream cancellation control termination; there is no inner Observable.',
        'Projection does not share, resubscribe or schedule the input.',
      ],
    },
    scope: {
      parameters: 'One to three non-empty own/plain-data string property keys; no empty paths.',
      callbacks: 'No user callback; read nested plain data directly as in the pinned map-based implementation.',
      time: 'No clock or scheduler is introduced; every projected output occurs in its source notification step.',
      reentrancy: 'Atomic non-reentrant source notifications and primitive/plain-object property access.',
      exclusions: ['Getters and proxies with side effects or throws, symbol keys, dynamically mutated paths.',
        'Constructor-time error for zero path elements is represented by factory rejection, not a stream notification.'],
    },
    initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: 'Exactly one source subscription per result execution.' },
    ownership: {
      state: 'subscription-local', sharing: 'None; each subscription independently projects one source.',
      reset: 'New downstream subscription resets count; no caches or shared Subjects.',
      resources: [{ id: 'source', kind: 'subscription', owner: 'downstream execution' }],
    },
    dispatch: {
      policy: 'atomic-non-reentrant', actionSemantics: 'Synchronous notification forwarding, no invented timers.',
      cancellationCheckpoints: ['Between source notifications; a cancelled result cannot receive more values.'],
    },
    inputs: [input('subscribe','downstream','start independent source'),input('source.next','source','receive data'),
      input('source.complete','source','complete source'),input('source.error','source','source failure'),
      input('cancel','downstream','downstream unsubscribe')],
    actionTypes: ['subscribe', 'unsubscribe', 'notify'],
    controls: [{id:'Unsubscribed',description:'no source connection',terminal:false},
      {id:'Active',description:'source live',terminal:false},
      {id:'Closed',description:'complete, error or cancellation',terminal:true}],
    sources: [reference('src/internal/operators/pluck.ts'),reference('src/internal/operators/map.ts')],
    evidence: { modelTests: ['tests/session16-model.test.mjs'], runtimeTests:['tests/session16-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-16.md' },
  };
  return { metadata, parameters:p, rules, initialState:() => ({phase:'Unsubscribed',count:0,reason:'none'}),
    control:s=>s.phase,
    validateState:s=>natural(s.count)?[]:['invalid projected count'],
    validateReaction:(_s,e,r)=>[
      ...validateActionWord(r.actions),
      ...(e.type==='source.next' &&
        (r.actions.filter(a=>a.type==='notify'&&a.notification.kind==='N').length!==1 ||
         !Object.is((r.actions.find(a=>a.type==='notify') as Extract<A,{type:'notify'}> | undefined)?.notification.kind === 'N'
           ? (r.actions.find(a=>a.type==='notify') as {notification:{value?:unknown}}).notification.value : undefined,pluckPath(e.value,p.path)))
        ? ['projection must emit the exact path result once']:[]),
      ...(e.type==='cancel'&&r.actions.some(a=>a.type==='notify')?['cancel must be silent']:[]),
    ],
  };
}

export type PublishOperator = 'publish' | 'publishBehavior' | 'publishLast' | 'publishReplay';
export type PublishParameters<T> = Readonly<{
  operator: PublishOperator;
  seed: T | undefined;
  bufferSize: number;
  windowTime: 'unbounded';
}>;
export type PublishState<T> = Readonly<{
  phase: 'Ready' | 'Connected' | 'Stopped';
  subscribers: readonly number[];
  generation: number;
  retained: readonly T[];
  last: T | undefined;
  hasLast: boolean;
  terminal: 'complete' | 'error' | null;
  error: unknown;
}>;
export type PublishEvent<T> =
  | Readonly<{ type: 'observer.subscribe' | 'observer.cancel'; observer: number }>
  | Readonly<{ type: 'connect' | 'disconnect' }>
  | Readonly<{ type: 'source.next'; resource: ResourceRef; value: T }>
  | Readonly<{ type: 'source.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'source.error'; resource: ResourceRef; error: unknown }>;
export type PublishModel<T> = OperatorModel<PublishParameters<T>, PublishState<T>, PublishEvent<T>, Action<unknown>>;

const target = (n: number): string => 'observer-' + n;
const isRetaining = (name: PublishOperator): boolean => name !== 'publish';
const replayFor = <T>(name: PublishOperator, s: PublishState<T>): readonly T[] => {
  if (name === 'publishReplay') return s.retained;
  if (name === 'publishBehavior' && s.phase !== 'Stopped' && s.hasLast) return [s.last as T];
  if (name === 'publishLast' && s.phase === 'Stopped' && s.terminal === 'complete' && s.hasLast) return [s.last as T];
  return [];
};
const replayTo = <T>(name: PublishOperator,s: PublishState<T>,n: number): Action<unknown>[] =>
  replayFor(name,s).map(v=>notify(target(n),v));
const currentConnection = <T>(s:PublishState<T>,e:PublishEvent<T>):boolean =>
  s.phase==='Connected' && 'resource' in e && e.resource.id==='source' && e.resource.generation===s.generation;

/**
 * Models the legacy fixed-Subject, selector-less ConnectableObservable overload.
 * This is ONE connectable instance with independently managed observer subscriptions,
 * NOT a new connection per observer and NOT an automatic refCount/share boundary.
 */
export function createPublishModel<T>(operator: PublishOperator, options: Partial<Pick<PublishParameters<T>,'seed'|'bufferSize'>> = {}): PublishModel<T> {
  const bufferSize = options.bufferSize ?? 2;
  if (!natural(bufferSize) || bufferSize > 32) throw new RangeError('bufferSize must be in 0..32');
  const p: PublishParameters<T> = {
    operator, seed: options.seed, bufferSize: Math.max(1,bufferSize), windowTime:'unbounded',
  };
  type S=PublishState<T>; type E=PublishEvent<T>; type A=Action<unknown>;
  type R=Rule<PublishParameters<T>,S,E,A>;
  const id=(suffix:string)=>'S16-'+operator.toUpperCase()+'-'+suffix;
  const d=(suffix:string,from:S['phase'],event:E['type'],to:S['phase'],
    guard:string,actions:readonly string[],explanation:string,nextState:string) =>
    description(operator,suffix,from,event,to,guard,actions,explanation,nextState);
  const observerAllowed=(s:S,e:E):boolean=>'observer' in e&&natural(e.observer)&&
    !s.subscribers.includes(e.observer);
  const observerPresent=(s:S,e:E):boolean=>'observer' in e&&s.subscribers.includes(e.observer);
  const rules:R[]=[];
  for(const phase of ['Ready','Connected'] as const){
    rules.push({
      description:d('JOIN-'+phase.toUpperCase(),phase,'observer.subscribe',phase,
        'new nonnegative observer id', ['register subscriber','synchronously replay variant-specific current memory'],
        'A new consumer joins the existing Subject; no new upstream source subscription is acquired.',
        'Existing connection and all previous subscriber registrations remain.'),
      enabled:observerAllowed,
      react:(s,e)=>{
        if(e.type!=='observer.subscribe')throw Error('not join');
        return {state:{...s,subscribers:[...s.subscribers,e.observer]},
          actions:[sub(observer(e.observer)),...replayTo(operator,s,e.observer)]};
      },
    });
    rules.push({
      description:d('LEAVE-'+phase.toUpperCase(),phase,'observer.cancel',phase,
        'observer is registered',['unsubscribe only that observer, not the source connection'],
        'Manual observer cancellation does not disconnect the source; there is no refCount.',
        'The Subject remains live; other observers and the source are unaffected.'),
      enabled:observerPresent,
      react:(s,e)=>{
        if(e.type!=='observer.cancel')throw Error('not leave');
        return {state:{...s,subscribers:s.subscribers.filter(n=>n!==e.observer)},actions:[unsub(observer(e.observer))]};
      },
    });
  }
  rules.push({
    description:d('CONNECT','Ready','connect','Connected','no active upstream source connection',
      ['acquire one source subscription'], 'Manual connect starts the producer once for all current observers.',
      'Connected; source subscription generation owned by this connectable object.'),
    enabled:()=>true,
    react:s=>({state:{...s,phase:'Connected'},actions:[sub(source(s.generation))]}),
  });
  rules.push({
    description:d('CONNECT-IDEMPOTENT','Connected','connect','Connected','connection already live',
      ['return existing connection, no new subscribe'], 'A second connect call reuses the live upstream connection.',
      'Same source generation and observer set.'),
    enabled:()=>true,react:s=>({state:s,actions:[]}),
  });
  rules.push({
    description:d('DISCONNECT','Connected','disconnect','Ready','explicit upstream connection cancellation',
      ['unsubscribe only the source connection, never complete subject observers'],
      'Manual connection unsubscribe preserves fixed Subject state, subscribers and cached values.',
      'Ready for a further manual connection; source generation advances.'),
    enabled:()=>true,
    react:s=>({state:{...s,phase:'Ready',generation:s.generation+1},actions:[unsub(source(s.generation))]}),
  });
  rules.push({
    description:d('SOURCE-NEXT','Connected','source.next','Connected','notification from current source generation',
      ['update Subject memory according to connector','forward immediately except AsyncSubject publishLast'],
      'Publish/Behavior/Replay forward now; AsyncSubject holds only the last value until successful completion.',
      'Connected with variant-specific memory and unchanged subscriber ownership.'),
    enabled:currentConnection,
    react:(s,e)=>{
      if(e.type!=='source.next')throw Error('not next');
      const liveForward=operator!=='publishLast';
      const retained=operator==='publishReplay'?[...s.retained,e.value].slice(-p.bufferSize):s.retained;
      return {state:{...s,retained,last:isRetaining(operator)?e.value:s.last,
        hasLast:isRetaining(operator)?true:s.hasLast},
        actions:liveForward?s.subscribers.map(n=>notify(target(n),e.value)):[]};
    },
  });
  rules.push({
    description:d('SOURCE-COMPLETE','Connected','source.complete','Stopped','current source completed',
      ['disconnect source','AsyncSubject emits last value if present','complete all current consumers'],
      'One completed fixed Subject retains its connector-specific completion semantics for future subscribers.',
      'Stopped successfully; no subscribed observers or upstream connection.'),
    enabled:currentConnection,
    react:s=>{
      const list=s.subscribers;
      const last=operator==='publishLast'&&s.hasLast?list.map(n=>notify(target(n),s.last)):[];
      return {state:{...s,phase:'Stopped',terminal:'complete',subscribers:[]},
        actions:[unsub(source(s.generation)),...last,...list.map(n=>done(target(n)))]};
    },
  });
  rules.push({
    description:d('SOURCE-ERROR','Connected','source.error','Stopped','current source fails',
      ['disconnect source','error every current consumer with same object'],
      'An error is terminal. ReplaySubject retains its prior values for a late subscriber; other Subjects do not.',
      'Stopped in error with unchanged ReplaySubject cache; no observers.'),
    enabled:currentConnection,
    react:(s,e)=>{
      if(e.type!=='source.error')throw Error('not error');
      return {state:{...s,phase:'Stopped',terminal:'error',error:e.error,subscribers:[]},
        actions:[unsub(source(s.generation)),...s.subscribers.map(n=>fail(target(n),e.error))]};
    },
  });
  rules.push({
    description:d('LATE-SUBSCRIBE','Stopped','observer.subscribe','Stopped','new nonnegative observer id',
      ['deliver terminal retained memory allowed by the Subject subtype','deliver terminal notification'],
      'Late subscribers receive connector-specific replay: ReplaySubject even before an error, AsyncSubject only after completion.',
      'Stopped; subscriber is not retained and source is never re-acquired.'),
    enabled:(_s,e)=>'observer' in e&&natural(e.observer),
    react:(s,e)=>{
      if(e.type!=='observer.subscribe')throw Error('not late subscribe');
      return {state:s,actions:[...replayTo(operator,s,e.observer),
        s.terminal==='error'?fail(target(e.observer),s.error):done(target(e.observer))]};
    },
  });
  const connectorPath={
    publish:'src/internal/operators/publish.ts',publishBehavior:'src/internal/operators/publishBehavior.ts',
    publishLast:'src/internal/operators/publishLast.ts',publishReplay:'src/internal/operators/publishReplay.ts',
  }[operator];
  const variants={
    publish:'Plain Subject has no memory: values only reach current observers; late successful subscriber completes.',
    publishBehavior:'BehaviorSubject sends its seed or most recent value immediately to newly registered live observers; after termination it does not replay.',
    publishLast:'AsyncSubject buffers the latest value without forwarding and emits it only after successful completion; empty completion emits none.',
    publishReplay:'ReplaySubject replays at most bufferSize latest values to late observers (including after error) in FIFO order.',
  };
  const metadata:ModelMetadata={
    schemaVersion:'1.1',rxjsVersion:'7.8.2',id:operator+'-legacy-fixed-subject',operator,
    purpose:variants[operator]+' An explicit connect() controls the source, not the number of observers.',
    cardinality:{
      signature:operator==='publishLast'?'publishLast : T* -> (T?) per observer at completion':
        operator+' : T* -> T* per observer (connection-scoped)',
      conditions:[
        'Manual connection and observer subscription are separate operations; observers never automatically start or stop the source.',
        variants[operator], 'Unsubscribe of one observer is silent, and a source error forwards the exact error object.',
      ],
    },
    scope:{
      parameters:operator==='publishReplay'?'Selector-less legacy ConnectableObservable; count bufferSize='+p.bufferSize+
        ', infinite time window, fixed ReplaySubject instance.':
        operator==='publishBehavior'?'Selector-less legacy ConnectableObservable; explicitly captured seed; fixed BehaviorSubject instance.':
        'Selector-less legacy ConnectableObservable; one fixed Subject instance and explicit connect.',
      callbacks:'No user selector, projection or subscriber callback executes inside the pure model.',
      time:'No scheduler is added; source events occur at supplied times. Replay has infinite time window and count-only eviction. New subscriptions synchronously replay memory.',
      reentrancy:'Non-reentrant event delivery; source is not synchronous within connect() acquisition. Registered teardowns and one terminal connection only.',
      exclusions:[
        'Selector overloads of publish/publishReplay, timestamp-provider/windowTime expiration, arbitrary scheduler ties and getter side effects.',
        'Reconnect after a terminal source notification, synchronous emission during connect(), observer callbacks that unsubscribe reentrantly.',
        'RefCount auto-connection, arbitrary custom Subject subclass, throwing observer or teardown.',
      ],
    },
    initialization:{
      control:'Ready',event:'observer.subscribe',sourceSubscription:'No source subscribed until explicit connect() is called; subscription to the connectable Subject may precede connect.',
    },
    ownership:{
      state:'external-instance',
      sharing:'One fixed '+operator+' Subject and one explicitly owned upstream connection serve all observers of the same connectable instance.',
      reset:'Explicit disconnect releases upstream but preserves subject and subscribers; source terminal stops the subject for this profile. New operator application makes a new instance.',
      resources:[{id:'source',kind:'subscription',owner:'connectable instance / manual connection'},
        {id:'observer',kind:'subscription',owner:'individually registered Subject observers'}],
    },
    dispatch:{
      policy:'atomic-non-reentrant',actionSemantics:'Ordered Subject notifications with exact cache and terminal behavior; no callbacks or work are executed by the model.',
      cancellationCheckpoints:['Observer cancellation never implicitly disconnects upstream.',
        'Explicit disconnect is silent and retains observers; no next is legal without a source connection.'],
    },
    inputs:[
      input('observer.subscribe','downstream','attach an addressed Subject consumer'),
      input('observer.cancel','downstream','remove only one consumer'),
      input('connect','downstream','explicit source connection'),
      input('disconnect','downstream','explicit upstream connection cancellation'),
      input('source.next','source','current connected source value'),
      input('source.complete','source','source successful terminal'),
      input('source.error','source','source failure'),
    ],
    actionTypes:['subscribe','unsubscribe','notify'],
    controls:[{id:'Ready',description:'Subject exists but upstream not connected',terminal:false},
      {id:'Connected',description:'one source live, many observers may be live',terminal:false},
      {id:'Stopped',description:'Subject terminated and upstream released',terminal:true}],
    sources:[reference(connectorPath),reference('src/internal/operators/multicast.ts'),
      reference('src/internal/observable/ConnectableObservable.ts'),
      reference('src/internal/'+({publish:'Subject',publishBehavior:'BehaviorSubject',publishLast:'AsyncSubject',
        publishReplay:'ReplaySubject'}[operator])+'.ts')],
    evidence:{modelTests:['tests/session16-model.test.mjs'],runtimeTests:['tests/session16-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-16.md'},
  };
  const initialState=():S=>({
    phase:'Ready',subscribers:[],generation:0,retained:[],
    last:operator==='publishBehavior'?p.seed:undefined,
    hasLast:operator==='publishBehavior',terminal:null,error:undefined,
  });
  return {metadata,parameters:p,initialState,control:s=>s.phase,rules,
    validateState:s=>{
      const errors:string[]=[];
      if(!natural(s.generation))errors.push('invalid source connection generation');
      if(s.subscribers.some(n=>!natural(n))||new Set(s.subscribers).size!==s.subscribers.length)
        errors.push('duplicate or invalid subscriber identifiers');
      if(s.retained.length>p.bufferSize)errors.push('replay buffer exceeds the bound');
      if(operator!=='publishReplay'&&s.retained.length)errors.push('only ReplaySubject retains replay list');
      if((s.phase==='Stopped')!==(s.terminal!==null))errors.push('terminal status does not match phase');
      if(s.phase==='Stopped'&&s.subscribers.length)errors.push('terminal subject must not retain observers');
      return errors;
    },
    validateReaction:(s,e,r)=>{
      const errors=[...validateActionWord(r.actions)];
      if(e.type==='observer.cancel'&&r.actions.some(a=>a.type==='notify'))
        errors.push('observer cancellation must be silent');
      if(e.type==='source.next'&&operator==='publishLast'&&r.actions.some(a=>a.type==='notify'))
        errors.push('AsyncSubject cannot emit before completion');
      if(e.type==='source.next'&&operator!=='publishLast'){
        const notes=r.actions.filter(a=>a.type==='notify'&&a.notification.kind==='N');
        if(notes.length!==s.subscribers.length||
          notes.some(a=>a.type==='notify'&&a.notification.kind==='N'&&!Object.is(a.notification.value,e.value)))
          errors.push('source value must reach every live observer once and preserve identity');
      }
      return errors;
    },
  };
}
export const createPublishPlainModel=<T>()=>createPublishModel<T>('publish');
export const createPublishBehaviorModel=<T>(seed:T)=>createPublishModel<T>('publishBehavior',{seed});
export const createPublishLastModel=<T>()=>createPublishModel<T>('publishLast');
export const createPublishReplayModel=<T>(bufferSize=2)=>createPublishModel<T>('publishReplay',{bufferSize});

export const pluckExample: readonly TimedEvent<PluckEvent<{person?:{name?:string}}>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:{person:{name:'Ada'}}}},
  {time:2,event:{type:'source.next',value:{person:{}}}},
  {time:3,event:{type:'source.complete'}},
];
const connection=(generation=0):ResourceRef=>({id:'source',generation});
export const publishExample: readonly TimedEvent<PublishEvent<number>>[]=[
  {time:0,event:{type:'observer.subscribe',observer:0}},
  {time:1,event:{type:'connect'}},
  {time:2,event:{type:'source.next',resource:connection(),value:5}},
  {time:3,event:{type:'observer.subscribe',observer:1}},
  {time:4,event:{type:'source.complete',resource:connection()}},
  {time:5,event:{type:'observer.subscribe',observer:2}},
];
export const publishBehaviorExample: readonly TimedEvent<PublishEvent<number>>[]=[
  {time:0,event:{type:'observer.subscribe',observer:0}},
  {time:1,event:{type:'connect'}},
  {time:2,event:{type:'source.next',resource:connection(),value:5}},
  {time:3,event:{type:'observer.subscribe',observer:1}},
  {time:4,event:{type:'source.complete',resource:connection()}},
  {time:5,event:{type:'observer.subscribe',observer:2}},
];
export const publishLastExample: readonly TimedEvent<PublishEvent<number>>[]=[
  {time:0,event:{type:'observer.subscribe',observer:0}},
  {time:1,event:{type:'connect'}},
  {time:2,event:{type:'source.next',resource:connection(),value:3}},
  {time:3,event:{type:'source.next',resource:connection(),value:5}},
  {time:4,event:{type:'observer.subscribe',observer:1}},
  {time:5,event:{type:'source.complete',resource:connection()}},
  {time:6,event:{type:'observer.subscribe',observer:2}},
];
export const publishReplayExample: readonly TimedEvent<PublishEvent<number>>[]=[
  {time:0,event:{type:'observer.subscribe',observer:0}},
  {time:1,event:{type:'connect'}},
  {time:2,event:{type:'source.next',resource:connection(),value:3}},
  {time:3,event:{type:'source.next',resource:connection(),value:5}},
  {time:4,event:{type:'source.next',resource:connection(),value:7}},
  {time:5,event:{type:'observer.subscribe',observer:1}},
  {time:6,event:{type:'source.complete',resource:connection()}},
  {time:7,event:{type:'observer.subscribe',observer:2}},
];
