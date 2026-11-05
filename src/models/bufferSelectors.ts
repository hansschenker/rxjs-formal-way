import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';

export type SelectorBufferOperator = 'bufferToggle' | 'bufferWhen';
export type SelectorBufferParameters = Readonly<{ operator: SelectorBufferOperator }>;
export type SelectorBufferRecord<T> = Readonly<{ id: number; values: readonly T[]; closingLive: boolean }>;
export type SelectorBufferState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active' | 'Calling'; sourceLive: boolean; openingsLive: boolean;
      nextId: number; records: readonly SelectorBufferRecord<T>[]; pending?: number }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'openings-error' | 'closing-error' | 'selector-error' | 'cancel' }>;
export type SelectorBufferEvent<T, O = unknown> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'openings.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'openings.next'; value: O }>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef }>
  | Readonly<{ type: 'callback.throw' | 'source.error' | 'openings.error'; error: unknown; resource?: ResourceRef }>
  | Readonly<{ type: 'closing.next' | 'closing.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'closing.error'; resource: ResourceRef; error: unknown }>;
export type SelectorBufferModel<T, O = unknown> = OperatorModel<SelectorBufferParameters, SelectorBufferState<T>, SelectorBufferEvent<T,O>, Action<T[],unknown>>;

const rev = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const ref = (id: string, generation: number): ResourceRef => ({ id, generation });
const source = ref('source',0), openings = ref('openings',0);
const acquire = (resource: ResourceRef): Action<unknown> => ({ type: 'subscribe', resource });
const release = (resource: ResourceRef): Action<unknown> => ({ type: 'unsubscribe', resource });
const next = <T>(values: readonly T[]): Action<T[],unknown> => ({ type: 'notify', target:'downstream', notification:{ kind:'N', value:[...values] } });
const done: Action<never,unknown> = { type:'notify', target:'downstream', notification:{kind:'C'} };
const fail = <T>(error:unknown): Action<T[],unknown> => ({type:'notify',target:'downstream',notification:{kind:'E',error}});
const natural = (n:number):boolean => Number.isSafeInteger(n) && n>=0;
const same=(a:ResourceRef,b:ResourceRef):boolean=>a.id===b.id&&a.generation===b.generation;
const live = <T>(s:SelectorBufferState<T>): s is Extract<SelectorBufferState<T>,{phase:'Active'|'Calling'}> =>
  s.phase==='Active'||s.phase==='Calling';

function metadata(name:SelectorBufferOperator):ModelMetadata {
  const toggle=name==='bufferToggle';
  return {
    schemaVersion:'1.1',id:name+'-Observable-selector',operator:name,rxjsVersion:'7.8.2',
    purpose:toggle?
      'Open possibly overlapping buffers for each openings value; each selected closing notifier next releases only its own buffer.':
      'Open one buffer immediately; each selected closing notifier next flushes it and starts a fresh buffer.',
    cardinality:{signature:toggle?'bufferToggle : O* × T* -> (T*)*':'bufferWhen : T* -> (T*)*',
      conditions:toggle?[
        'No openings implies no buffers or values; one source item can appear in multiple overlapping buffers.',
        'A closing notifier next emits one array, including an empty array; closing completion does not flush.',
        'Source completion flushes every still-open buffer in opening order, then completes.',
      ]:[
        'An initial buffer is opened before source subscription; each closing next emits it, even empty.',
        'A fresh closing selector is called for each newly opened buffer.',
        'A closing notifier completing without next never closes its buffer; source completion flushes that buffer.',
      ]},
    scope:{parameters:toggle?'Observable openings and Observable closing streams':'Observable closing streams; selector called once per buffer',
      callbacks:'Selector invocation and return/throw modeled as correlated synchronous microsteps. The pure transition model never executes callbacks.',
      time:'Time and equal-time order come from externally ordered source/openings/closing notifications. No clock or scheduler is introduced.',
      reentrancy:'Atomic post-setup notifications; no reentrant notifications or cancellation inside selector, observers or teardown.',
      exclusions:['Non-Observable ObservableInput conversion (Promises, etc.), arbitrary synchronous/reentrant closing notification during subscription, throwing downstream observers/finalizers.',
        'Cancellation inside selector or between output notification and resource release, callback side effects and arbitrary mutation of previously emitted array references.',
        'Universal symbolic equivalence beyond the finite scoped protocol.']},
    initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:toggle?
      'Subscribe to openings first, then source; no buffer exists until an opening value.':
      'Open initial empty buffer, invoke closing selector and subscribe its result before subscribing to source.'},
    ownership:{state:'subscription-local',sharing:'No sharing or replay; each result subscription owns all buffers and closing subscriptions.',
      reset:'Fresh buffer identity and selector generation per execution.',
      resources:[{id:'source',kind:'subscription',owner:'result subscriber'},
        ...(toggle?[{id:'openings',kind:'subscription' as const,owner:'result subscriber'}]:[]),
        {id:'closing',kind:'subscription',owner:'each open buffer'},
        {id:'selector',kind:'callback',owner:'each opening'}]},
    dispatch:{policy:'atomic-non-reentrant',actionSemantics:toggle?
      'Openings next creates a buffer before selector invocation; source appends to all buffers, closing next removes one before emission.':
      'Closing next releases old closing subscription, swaps to an empty buffer, emits prior array then requests the next selector.',
      cancellationCheckpoints:['Between complete callback/notification reactions; cancel is silent and releases all owned resources.',
        'Selection return/throw are correlated to the pending buffer generation.']},
    inputs:[
      {type:'subscribe',origin:'downstream',category:'lifecycle',description:'start a new operator execution'},
      {type:'source.next',origin:'source',category:'notification',description:'append to open buffers'},
      {type:'source.complete',origin:'source',category:'notification',description:'flush active buffers then complete'},
      {type:'source.error',origin:'source',category:'notification',description:'error without flushing'},
      {type:'cancel',origin:'downstream',category:'lifecycle',description:'silent disposal'},
      {type:'callback.return',origin:'callback',category:'callback',description:'selected Observable is available'},
      {type:'callback.throw',origin:'callback',category:'callback',description:'selector threw'},
      {type:'closing.next',origin:'inner',category:'notification',description:'close selected buffer'},
      {type:'closing.complete',origin:'inner',category:'notification',description:'closing without next does not flush'},
      {type:'closing.error',origin:'inner',category:'notification',description:'closing error propagates'},
      ...(toggle?[
        {type:'openings.next',origin:'outer' as const,category:'notification' as const,description:'open an additional buffer'},
        {type:'openings.complete',origin:'outer' as const,category:'notification' as const,description:'stop opening but keep source'},
        {type:'openings.error',origin:'outer' as const,category:'notification' as const,description:'openings error propagates'},
      ]:[]),
    ],
    actionTypes:['subscribe','unsubscribe','notify','invoke-callback'],
    controls:[{id:'Unsubscribed',description:'lazy not yet subscribed',terminal:false},
      {id:'Active',description:'source and notifier resources managed',terminal:false},
      {id:'Calling',description:'selector awaiting correlated outcome',terminal:false},
      {id:'Closed',description:'completed, errored or cancelled',terminal:true}],
    sources:[
      {url:'https://github.com/ReactiveX/rxjs/blob/'+rev+'/src/internal/operators/'+name+'.ts',revision:rev,purpose:'Pinned selector/opening/closing source order and lifecycle'},
      {url:'https://github.com/ReactiveX/rxjs/blob/'+rev+'/src/internal/operators/OperatorSubscriber.ts',revision:rev,purpose:'Notification and teardown semantics'},
    ],
    evidence:{modelTests:['tests/session08-model.test.mjs'],runtimeTests:['tests/session08-rxjs.test.mjs'],status:'source-inspected',record:'evidence/SESSION-08.md'},
  };
}

function build<T,O>(name:SelectorBufferOperator):SelectorBufferModel<T,O>{
  const toggle=name==='bufferToggle',p:SelectorBufferParameters={operator:name};
  type S=SelectorBufferState<T>; type E=SelectorBufferEvent<T,O>; type R=Rule<SelectorBufferParameters,S,E,Action<T[],unknown>>;
  const prefix=name.toUpperCase();
  const describe=(id:string,from:'Unsubscribed'|'Active'|'Calling',event:E['type'],to:S['phase'],guard:string,actions:string[],explanation:string):R['description']=>({
    id:prefix+'-'+id,from,event,to,guard,actions,nextState:to==='Closed'?'terminal':to==='Calling'?'await selector':'retain exact buffer and resource bindings',
    obligations:['S8-'+prefix+'-'+id],explanation,
  });
  const close=(reason:Extract<S,{phase:'Closed'}>['reason']):S=>({phase:'Closed',reason});
  const resources=(s:S):Action<T[],unknown>[]=>live(s)?[
    ...(s.sourceLive?[release(source)]:[]),
    ...(s.openingsLive?[release(openings)]:[]),
    ...s.records.filter(x=>x.closingLive).map(x=>release(ref('closing',x.id)))
  ]:[];
  const choose=(id:number,value:unknown):Action<T[],unknown>=>({
    type:'invoke-callback',resource:ref('selector',id),index:id,value,
  });
  const rules:R[]=[
    {description:describe('INIT','Unsubscribed','subscribe',toggle?'Active':'Calling','fresh subscription',
      toggle?['connect openings','connect source']:['open empty buffer','invoke initial closing selector'],
      'No work begins before subscription; bufferToggle subscribes openings first, bufferWhen asks for closing before source.'),
      enabled:()=>true,react:()=>toggle?
        {state:{phase:'Active',sourceLive:true,openingsLive:true,nextId:0,records:[]},actions:[acquire(openings),acquire(source)]}:
        {state:{phase:'Calling',sourceLive:false,openingsLive:false,nextId:1,records:[{id:0,values:[],closingLive:false}],pending:0},actions:[choose(0,undefined)]}
    },
    {description:describe('CALLBACK-RETURN','Calling','callback.return','Active','matching selector generation',
      ['connect selected closing Observable','connect source if first buffer'],
      'The returned closing Observable is subscribed; on bufferWhen setup this happens before source connection.'),
      enabled:(s,e)=>s.phase==='Calling'&&e.type==='callback.return'&&s.pending!==undefined&&same(e.resource,ref('selector',s.pending)),
      react:(s)=>{
        if(s.phase!=='Calling'||s.pending===undefined)throw new Error('selector result without pending call');
        const pending=s.pending;
        return {state:{...s,phase:'Active',sourceLive:true,pending:undefined,
          records:s.records.map(x=>x.id===pending?{...x,closingLive:true}:x)},
          actions:[acquire(ref('closing',pending)),...(s.sourceLive?[]:[acquire(source)])]};
      }},
    {description:describe('CALLBACK-THROW','Calling','callback.throw','Closed','matching selector generation',
      ['forward exact thrown error','release all owned subscriptions without flush'],
      'Selector exceptions error the output and dispose resources; they do not close/flush pending buffers.'),
      enabled:(s,e)=>s.phase==='Calling'&&e.type==='callback.throw'&&s.pending!==undefined&&
        (e.resource===undefined||same(e.resource,ref('selector',s.pending))),
      react:(s,e)=>{
        if(e.type!=='callback.throw')throw new Error('invalid callback.throw');
        return {state:close('selector-error'),actions:[fail<T>(e.error),...resources(s)]};
      }},
    {description:describe('SOURCE-NEXT','Active','source.next','Active','source connected',
      ['append source value to every open buffer'], 'Values are opaque; source values belong to all currently open buffers.'),
      enabled:s=>s.phase==='Active'&&s.sourceLive,
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='source.next')throw new Error('invalid source next');
        return {state:{...s,records:s.records.map(x=>({...x,values:[...x.values,e.value]}))},actions:[]};
      }},
    {description:describe('SOURCE-COMPLETE','Active','source.complete','Closed','source connected',
      ['flush all open buffers in opening order','complete','release resources'],
      'Completion flushes open buffers, including the one current buffer for bufferWhen.'),
      enabled:s=>s.phase==='Active'&&s.sourceLive,
      react:s=>{
        if(s.phase!=='Active')throw new Error('invalid completion');
        return {state:close('complete'),actions:[...s.records.map(x=>next(x.values)),done,...resources(s)]};
      }},
    {description:describe('SOURCE-ERROR','Active','source.error','Closed','source connected',
      ['forward error','dispose without flush'],'An error does not emit pending arrays.'),
      enabled:s=>s.phase==='Active'&&s.sourceLive,
      react:(s,e)=>{
        if(e.type!=='source.error')throw new Error('invalid source error');
        return {state:close('source-error'),actions:[fail<T>(e.error),...resources(s)]};
      }},
    {description:describe('CANCEL-ACTIVE','Active','cancel','Closed','active execution',
      ['release resources; do not notify downstream'],'Cancellation is silent.'),
      enabled:()=>true,react:s=>({state:close('cancel'),actions:resources(s)})},
    {description:describe('CANCEL-CALLING','Calling','cancel','Closed','pending selector call, between microsteps',
      ['release owned subscriptions; do not notify'],'Model cancellation is at an explicit checkpoint, not inside executing user selector.'),
      enabled:()=>true,react:s=>({state:close('cancel'),actions:resources(s)})},
    {description:describe('CLOSING-NEXT','Active','closing.next',toggle?'Active':'Calling','matching live closing generation',
      toggle?['remove selected buffer','emit array','unsubscribe selected closing']:
        ['close previous selector subscription','replace with empty buffer','emit old array','invoke next selector'],
      toggle?'A closing emission affects only the buffer associated with that subscription.':
        'One closing emission flushes the old array and starts selection for the next buffer.'),
      enabled:(s,e)=>s.phase==='Active'&&e.type==='closing.next'&&s.records.some(x=>x.id===e.resource.generation&&e.resource.id==='closing'&&x.closingLive)&&s.nextId<Number.MAX_SAFE_INTEGER,
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='closing.next')throw new Error('invalid closing next');
        const found=s.records.find(x=>x.id===e.resource.generation)!;
        if(toggle)return {state:{...s,records:s.records.filter(x=>x.id!==found.id)},
          actions:[next(found.values),release(ref('closing',found.id))]};
        const id=s.nextId;
        return {state:{...s,phase:'Calling',nextId:id+1,pending:id,records:[{id,values:[],closingLive:false}]},
          actions:[release(ref('closing',found.id)),next(found.values),choose(id,undefined)]};
      }},
    {description:describe('CLOSING-COMPLETE','Active','closing.complete','Active','matching live closing generation',
      ['release completed closing subscription; do not flush'],'Completion without next leaves its buffer for source completion.'),
      enabled:(s,e)=>s.phase==='Active'&&e.type==='closing.complete'&&s.records.some(x=>x.id===e.resource.generation&&e.resource.id==='closing'&&x.closingLive),
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='closing.complete')throw new Error('invalid closing complete');
        return {state:{...s,records:s.records.map(x=>x.id===e.resource.generation?{...x,closingLive:false}:x)},
          actions:[release(e.resource)]};
      }},
    {description:describe('CLOSING-ERROR','Active','closing.error','Closed','matching live closing generation',
      ['forward closing error','release all resources'],'Any active closing Observable error terminates the entire result.'),
      enabled:(s,e)=>s.phase==='Active'&&e.type==='closing.error'&&s.records.some(x=>x.id===e.resource.generation&&e.resource.id==='closing'&&x.closingLive),
      react:(s,e)=>{
        if(e.type!=='closing.error')throw new Error('invalid closing error');
        return {state:close('closing-error'),actions:[fail<T>(e.error),...resources(s)]};
      }},
  ];
  if(toggle)rules.push(
    {description:describe('OPENINGS-NEXT','Active','openings.next','Calling','openings still subscribed, safe generation',
      ['add open buffer','invoke closing selector with opening value'],
      'Every opening starts an independent buffer. Its value is passed to the closing selector, not downstream.'),
      enabled:s=>s.phase==='Active'&&s.openingsLive&&s.nextId<Number.MAX_SAFE_INTEGER,
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='openings.next')throw new Error('invalid opening');
        const id=s.nextId;
        return {state:{...s,phase:'Calling',nextId:id+1,pending:id,
          records:[...s.records,{id,values:[],closingLive:false}]},actions:[choose(id,e.value)]};
      }},
    {description:describe('OPENINGS-COMPLETE','Active','openings.complete','Active','openings still subscribed',
      ['release openings subscription; preserve buffers and source'],
      'Openings completion stops new buffers but does not close existing buffers or the source.'),
      enabled:s=>s.phase==='Active'&&s.openingsLive,
      react:s=>{
        if(s.phase!=='Active')throw new Error('invalid openings complete');
        return {state:{...s,openingsLive:false},actions:[release(openings)]};
      }},
    {description:describe('OPENINGS-ERROR','Active','openings.error','Closed','openings still subscribed',
      ['forward error','release all resources without flush'],'Openings errors propagate without emitting buffered values.'),
      enabled:s=>s.phase==='Active'&&s.openingsLive,
      react:(s,e)=>{
        if(e.type!=='openings.error')throw new Error('invalid openings error');
        return {state:close('openings-error'),actions:[fail<T>(e.error),...resources(s)]};
      }},
  );
  return {metadata:metadata(name),parameters:p,rules,initialState:()=>({phase:'Unsubscribed'}),
    control:s=>s.phase,validateState:s=>{
      if(s.phase==='Unsubscribed')return [];
      if(s.phase==='Closed')return [];
      if(!natural(s.nextId)||s.nextId===Number.MAX_SAFE_INTEGER||(!toggle&&s.openingsLive)
        ||(!toggle&&s.records.length!==1)||s.records.some(x=>!natural(x.id)||x.id>=s.nextId||!Array.isArray(x.values))
        ||new Set(s.records.map(x=>x.id)).size!==s.records.length)return ['invalid buffer identity/state'];
      if(s.phase==='Calling'&&(s.pending===undefined||!s.records.some(x=>x.id===s.pending)))return ['missing pending selector'];
      if(s.phase==='Active'&&s.pending!==undefined)return ['orphan pending selector'];
      return [];
    },validateReaction:(s,e,r)=>{
      const errors=[...validateActionWord(r.actions)];
      const outputs=r.actions.filter(x=>x.type==='notify'&&x.notification.kind==='N');
      if((e.type==='cancel'||e.type.endsWith('.error')||e.type==='callback.throw')&&outputs.length)
        errors.push('terminal path must not flush');
      if(e.type==='source.next'&&r.actions.length)errors.push('source next must only accumulate');
      if(e.type==='closing.complete'&&outputs.length)errors.push('closing completion must not flush');
      if(s.phase==='Active'&&e.type==='closing.next'&&outputs.length!==1)errors.push('one closing signal must emit one array');
      return errors;
    }};
}
export const createBufferToggleModel = <T,O=unknown>():SelectorBufferModel<T,O> => build<T,O>('bufferToggle');
export const createBufferWhenModel = <T>():SelectorBufferModel<T> => build<T,unknown>('bufferWhen');
const e=(time:number,event:SelectorBufferEvent<number,string>):TimedEvent<SelectorBufferEvent<number,string>>=>({time,event});
export const bufferToggleExample=[
  e(0,{type:'subscribe'}),e(1,{type:'openings.next',value:'a'}),
  e(1,{type:'callback.return',resource:ref('selector',0)}),
  e(2,{type:'source.next',value:1}),e(3,{type:'openings.next',value:'b'}),
  e(3,{type:'callback.return',resource:ref('selector',1)}),
  e(4,{type:'source.next',value:2}),e(5,{type:'closing.next',resource:ref('closing',0)}),
  e(6,{type:'source.next',value:3}),e(7,{type:'source.complete'}),
] as const;
export const bufferWhenExample=[
  e(0,{type:'subscribe'}),e(0,{type:'callback.return',resource:ref('selector',0)}),
  e(1,{type:'source.next',value:1}),e(2,{type:'source.next',value:2}),
  e(3,{type:'closing.next',resource:ref('closing',0)}),
  e(3,{type:'callback.return',resource:ref('selector',1)}),
  e(4,{type:'source.next',value:3}),e(5,{type:'source.complete'}),
] as const;
