import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { actionErrors, complete, describe, error, metadata, natural, next, resource, source, subscribe, unsubscribe } from './session10-common.js';

export type DebounceParameters = Readonly<{ durationSelector: 'Observable-next'; }>;
export type DebouncePending<T> = Readonly<{ id: number; value: T; live: boolean }>;
export type DebounceState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; nextId: number; pending?: DebouncePending<T> }>
  | Readonly<{ phase: 'Calling'; nextId: number; pending: DebouncePending<T> }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'duration-error' | 'selector-error' | 'cancel' }>;
export type DebounceEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error' | 'duration.error' | 'callback.throw'; error: unknown; resource?: ResourceRef }>
  | Readonly<{ type: 'callback.return' | 'duration.next' | 'duration.complete'; resource: ResourceRef }>;
export type DebounceModel<T> = OperatorModel<DebounceParameters, DebounceState<T>, DebounceEvent<T>, Action<unknown>>;
const duration = (id: number): ResourceRef => resource('duration', id);
const invocation = <T>(id: number, value: T): Action<unknown> =>
  ({ type: 'invoke-callback', resource: resource('selector', id), index: id, value });
const owns = <T>(s: DebounceState<T>, e: DebounceEvent<T>, id: string): boolean =>
  s.phase === 'Active' && s.pending?.live === true &&
  'resource' in e && e.resource?.id === id && e.resource.generation === s.pending.id;
const pendingRelease = <T>(s: DebounceState<T>): Action<unknown>[] =>
  ('pending' in s && s.pending?.live) ? [unsubscribe(duration(s.pending.id))] : [];

export function createDebounceModel<T>(): DebounceModel<T> {
  type S = DebounceState<T>; type E = DebounceEvent<T>; type A = Action<unknown>;
  type Rt = Rule<DebounceParameters, S, E, A>;
  const d = (id: string, from: S['phase'], event: E['type'], to: S['phase'], guard: string,
    acts: string[], explanation: string) => describe('debounce', id, from, event, to, guard, acts, explanation);
  const closed = (reason: Extract<S, { phase: 'Closed' }>['reason']): S => ({ phase: 'Closed', reason });
  const rules: Rt[] = [
    { description: d('INIT','Unsubscribed','subscribe','Active','fresh subscription',
      ['subscribe source'], 'No duration selector is called before the first source value.'),
      enabled:()=>true,react:()=>({state:{phase:'Active',nextId:0},actions:[subscribe(source)]}) },
    { description: d('NEW-VALUE','Active','source.next','Calling','source live; pending duration may exist',
      ['cancel old duration if live','replace cached value','invoke duration selector'],
      'A new source value suppresses the previous pending value; only a new duration may release it.'),
      enabled:(s)=>s.phase==='Active'&&natural(s.nextId)&&s.nextId<Number.MAX_SAFE_INTEGER,
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='source.next')throw Error('invalid value');
        const id=s.nextId;
        return {state:{phase:'Calling',nextId:id+1,pending:{id,value:e.value,live:false}},
          actions:[...pendingRelease(s),invocation(id,e.value)]};
      } },
    { description:d('DURATION-RETURN','Calling','callback.return','Active','matching pending selector invocation',
      ['subscribe selected duration Observable'], 'The callback returns an Observable; no duration values have been delivered yet.'),
      enabled:(s,e)=>s.phase==='Calling'&&e.type==='callback.return'&&e.resource.id==='selector'&&e.resource.generation===s.pending.id,
      react:s=>{
        if(s.phase!=='Calling')throw Error('not calling');
        return {state:{phase:'Active',nextId:s.nextId,pending:{...s.pending,live:true}},
          actions:[subscribe(duration(s.pending.id))]};
      } },
    { description:d('DURATION-THROW','Calling','callback.throw','Closed','matching selector invocation',
      ['propagate exact thrown error','release source'], 'A failing selector terminates the dataflow.'),
      enabled:(s,e)=>s.phase==='Calling'&&e.type==='callback.throw'&&e.resource?.id==='selector'&&e.resource.generation===s.pending.id,
      react:(_s,e)=>{
        if(e.type!=='callback.throw')throw Error('not a throw');
        return {state:closed('selector-error'),actions:[error(e.error),unsubscribe(source)]};
      } },
    { description:d('DURATION-NEXT','Active','duration.next','Active','matching live duration',
      ['unsubscribe duration','emit cached latest value once'], 'Only a next from the currently selected duration releases the latest value.'),
      enabled:(s,e)=>owns(s,e,'duration'),
      react:s=>{
        if(s.phase!=='Active'||!s.pending)throw Error('no pending value');
        return {state:{phase:'Active',nextId:s.nextId},actions:[unsubscribe(duration(s.pending.id)),next(s.pending.value)]};
      } },
    { description:d('DURATION-EMPTY','Active','duration.complete','Active','matching live duration completed without next',
      ['release duration; retain latest value'], 'Duration completion alone never emits; source completion can still flush this value.'),
      enabled:(s,e)=>owns(s,e,'duration'),
      react:s=>{
        if(s.phase!=='Active'||!s.pending)throw Error('no pending duration');
        return {state:{phase:'Active',nextId:s.nextId,pending:{...s.pending,live:false}},
          actions:[unsubscribe(duration(s.pending.id))]};
      } },
    { description:d('DURATION-ERROR','Active','duration.error','Closed','matching live duration',
      ['propagate exact error','release duration and source'], 'Duration error discards the latest cached value.'),
      enabled:(s,e)=>owns(s,e,'duration'),
      react:(s,e)=>{
        if(s.phase!=='Active'||e.type!=='duration.error')throw Error('bad error');
        return {state:closed('duration-error'),actions:[error(e.error),...pendingRelease(s),unsubscribe(source)]};
      } },
    { description:d('SOURCE-COMPLETE','Active','source.complete','Closed','source completes',
      ['cancel live duration','flush cached value if present','complete','release source'],
      'Source completion flushes the most recent value even after a duration completed silently.'),
      enabled:()=>true,
      react:s=>{
        if(s.phase!=='Active')throw Error('bad completion');
        return {state:closed('complete'),actions:[
          ...pendingRelease(s),...(s.pending?[next(s.pending.value)]:[]),complete,unsubscribe(source)]};
      } },
    ...(['Active','Calling'] as const).flatMap(from=>[
      {description:d('SOURCE-ERROR-'+from.toUpperCase(),from,'source.error','Closed','source errors',
        ['forward error and release owned resources'], 'An error never flushes pending debounced values.'),
        enabled:()=>true,react:(s:S,e:E)=>{
          if(e.type!=='source.error')throw Error('bad source error');
          return {state:closed('source-error'),actions:[error(e.error),...pendingRelease(s),unsubscribe(source)]};
        }},
      {description:d('CANCEL-'+from.toUpperCase(),from,'cancel','Closed','downstream cancels',
        ['release active duration and source silently'], 'Unsubscription is not completion.'),
        enabled:()=>true,react:(s:S)=>({state:closed('cancel'),actions:[...pendingRelease(s),unsubscribe(source)]})},
    ] as Rt[]),
  ];
  return {
    parameters:{durationSelector:'Observable-next'},rules,
    metadata:metadata({
      id:'debounce-Observable-duration',operator:'debounce',
      purpose:'Keep only the latest source value and release it on the current duration next, or flush on source completion.',
      cardinality:{signature:'debounce : T* × (T -> Duration*) -> T*',
        conditions:['Every source.next replaces the pending value and its duration subscription.',
          'Duration next emits latest once; duration complete without next does not emit.',
          'Source complete flushes pending; error and cancellation never flush.']},
      scope:{parameters:'Duration selectors returning an Observable; no Promise or other ObservableInput conversion.',
        callbacks:'One synchronous selector invocation per source next; callback outcome modeled as a separate correlated event.',
        time:'Duration Observable controls delivery; no clock or timer is created by debounce itself.',
        reentrancy:'Atomic non-reentrant selector outcomes; reentrant source and observer delivery excluded.',
        exclusions:['Promise/iterable duration, selector reentry, throwing observers/finalizers, cancellation during nested callback execution.']},
      initialization:{control:'Unsubscribed',event:'subscribe',sourceSubscription:'Subscribe original source before any selector.'},
      ownership:{state:'subscription-local',sharing:'No sharing or replay; own latest value and one live duration per output subscriber.',
        reset:'Fresh pending state and indices on each new subscription.',
        resources:[{id:'source',kind:'subscription',owner:'output subscriber'},
          {id:'duration',kind:'subscription',owner:'current selected duration'},
          {id:'selector',kind:'callback',owner:'output subscriber'}]},
      dispatch:{policy:'atomic-non-reentrant',
        actionSemantics:'Cancel previous duration, update latest memory, invoke selector, subscribe returned duration. Next releases value. Empty completion does not.',
        cancellationCheckpoints:['On every replacement before opening a new duration.','Between source and duration events.']},
      inputs:[
        {type:'subscribe',origin:'downstream',category:'lifecycle',description:'connect source'},
        {type:'source.next',origin:'source',category:'notification',description:'replace pending source value'},
        {type:'callback.return',origin:'callback',category:'callback',description:'duration selector returns Observable'},
        {type:'callback.throw',origin:'callback',category:'callback',description:'duration selector throws'},
        {type:'duration.next',origin:'inner',category:'notification',description:'current duration releases value'},
        {type:'duration.complete',origin:'inner',category:'notification',description:'current duration finishes without emission'},
        {type:'duration.error',origin:'inner',category:'notification',description:'duration errors'},
        {type:'source.complete',origin:'source',category:'notification',description:'complete and flush'},
        {type:'source.error',origin:'source',category:'notification',description:'source error'},
        {type:'cancel',origin:'downstream',category:'lifecycle',description:'silent cancellation'},
      ],
      actionTypes:['notify','subscribe','unsubscribe','invoke-callback'],
      controls:[
        {id:'Unsubscribed',description:'no source acquired',terminal:false},
        {id:'Active',description:'source live; possible cached value and duration',terminal:false},
        {id:'Calling',description:'waiting on synchronous selector outcome',terminal:false},
        {id:'Closed',description:'terminal or cancelled',terminal:true}],
      sourcePaths:['src/internal/operators/debounce.ts','src/internal/operators/OperatorSubscriber.ts'],
    }),
    initialState:()=>({phase:'Unsubscribed'}),control:s=>s.phase,
    validateState:s=>{
      if(s.phase==='Active'||s.phase==='Calling'){
        if(!natural(s.nextId))return ['invalid selector counter'];
        if(s.pending&&(!natural(s.pending.id)||s.pending.id>=s.nextId))return ['invalid pending identity'];
        if(s.phase==='Calling'&&s.pending.live)return ['calling cannot have duration subscription'];
      }
      return [];
    },
    validateReaction:(_s,e,r)=>{
      const errs=actionErrors(r.actions);
      if((e.type==='cancel'||e.type.endsWith('.error'))&&r.actions.some(a=>
        a.type==='notify'&&a.notification.kind==='N'))errs.push('invalid flush on cancellation/error');
      return errs;
    },
  };
}
export const debounceExample:readonly TimedEvent<DebounceEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'source.next',value:1}},
  {time:1,event:{type:'callback.return',resource:resource('selector',0)}},
  {time:2,event:{type:'source.next',value:2}},
  {time:2,event:{type:'callback.return',resource:resource('selector',1)}},
  {time:3,event:{type:'duration.next',resource:resource('duration',1)}},
  {time:4,event:{type:'source.complete'}},
];
