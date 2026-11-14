import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision, natural } from './session10-common.js';

/** Pipeable race/raceWith: one dataflow policy, two distinct RxJS exports.
 * Scope: source and finite additional *Observable* inputs, all subscribed before
 * the first external notification. Synchronous subscription-time winners are
 * expressly not covered by this atomic-setup profile.
 */
export type RaceOperator = 'race' | 'raceWith';
export type RaceParameters = Readonly<{ operator: RaceOperator; others: number }>;
export type RaceState =
  | Readonly<{ phase: 'Unsubscribed'; live: readonly number[]; winner: null; reason: 'none' }>
  | Readonly<{ phase: 'Racing'; live: readonly number[]; winner: null; reason: 'none' }>
  | Readonly<{ phase: 'Winner'; live: readonly number[]; winner: number; reason: 'none' }>
  | Readonly<{ phase: 'Closed'; live: readonly number[]; winner: number | null; reason: 'complete' | 'error' | 'cancel' }>;
export type RaceEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' }>
  | Readonly<{ type: 'input.next'; resource: ResourceRef; value: T }>
  | Readonly<{ type: 'input.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'input.error'; resource: ResourceRef; error: unknown }>;
export type RaceModel<T> = OperatorModel<RaceParameters, RaceState, RaceEvent<T>, Action<unknown>>;

const ref = (n: number): ResourceRef => ({ id: 'input', generation: n });
const acquire = (n: number): Action<unknown> => ({ type: 'subscribe', resource: ref(n) });
const release = (n: number): Action<unknown> => ({ type: 'unsubscribe', resource: ref(n) });
const next = (v: unknown): Action<unknown> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value: v } });
const complete: Action<unknown> = { type: 'notify', target: 'downstream', notification: { kind: 'C' } };
const error = (err: unknown): Action<unknown> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: err } });
const source = (path: string) => ({
  url: 'https://github.com/ReactiveX/rxjs/blob/' + pinnedRevision + '/' + path,
  revision: pinnedRevision, purpose: 'Version-pinned RxJS 7.8.2 actual race delegation and raceInit'
});
const input = (type: string, origin: 'source' | 'downstream', description: string) =>
  ({ type, origin, category: (origin === 'downstream' ? 'lifecycle' : 'notification') as 'notification' | 'lifecycle', description });

export function createRaceModel<T>(operator: RaceOperator, others = 2): RaceModel<T> {
  if (!natural(others) || others > 32) throw new RangeError('others must be in 0..32');
  const p: RaceParameters = { operator, others };
  type S = RaceState; type E = RaceEvent<T>; type A = Action<unknown>;
  type R = Rule<RaceParameters,S,E,A>;
  const n = others + 1;
  const all = Array.from({ length: n }, (_, i) => i);
  const closed = (s:S, reason:'complete'|'error'|'cancel'):S =>
    ({ phase:'Closed', live:[], winner:s.winner, reason });
  const isLive = (s:S,e:E):boolean =>
    (s.phase==='Racing'||s.phase==='Winner') && 'resource' in e &&
    e.resource.id==='input' && s.live.includes(e.resource.generation);
  const d = (suffix:string,from:S['phase'],event:E['type'],to:S['phase'],
    guard:string,actions:readonly string[],explanation:string,nextState:string) => ({
      id:'S17-'+operator.toUpperCase()+'-'+suffix,from,event,to,guard,actions,explanation,nextState,
      obligations:['S17-'+operator.toUpperCase()+'-'+suffix]
    });
  const rules:R[] = [
    { description:d('SUBSCRIBE','Unsubscribed','subscribe','Racing',
        'first result subscription with valid fixed Observable inputs',
        ['subscribe source input 0 and then every additional input in order'],
        'Each observer owns one independent race; no producer is shared.', 'All source subscriptions live; no winner.'),
      enabled:()=>true,
      react:()=>({state:{phase:'Racing',live:all,winner:null,reason:'none'},
        actions:all.map(acquire)}) },
    { description:d('FIRST-NEXT','Racing','input.next','Winner',
        'any live input emits the first value after connection setup',
        ['unsubscribe every losing input','forward winner payload'],
        'Only a next notification elects a winner. Losing subscriptions are cancelled synchronously and never resume.',
        'The winning input alone remains live; its index is permanent.'),
      enabled:isLive,
      react:(s,e)=>{
        if(s.phase!=='Racing'||e.type!=='input.next')throw Error('expected racing value');
        const who=e.resource.generation;
        return {state:{phase:'Winner',live:[who],winner:who,reason:'none'},
          actions:[...s.live.filter(i=>i!==who).map(release),next(e.value)]};
      } },
    { description:d('WINNER-NEXT','Winner','input.next','Winner',
        'value is from selected winner subscription',
        ['forward next value unchanged'],
        'Once a winner is chosen all its subsequent values are forwarded; first value is not the end of the race subscription.',
        'Winner and resource identity unchanged.'),
      enabled:isLive,
      react:(s,e)=>{
        if(e.type!=='input.next')throw Error('expected value');
        return {state:s,actions:[next(e.value)]};
      } },
    { description:d('EARLY-COMPLETE','Racing','input.complete','Closed',
        'any racing input completes without a prior next',
        ['complete result','release every competing subscription'],
        'A completion before any first next closes the downstream subscriber. It does not select a continuing winner.',
        'Closed successfully without a winner.'),
      enabled:isLive,
      react:s=>({state:closed(s,'complete'),actions:[complete,...s.live.map(release)]}) },
    { description:d('EARLY-ERROR','Racing','input.error','Closed',
        'any racing input errors before any first next',
        ['forward exact error','release every competing subscription'],
        'A failure before a first value fails the result and tears down every live candidate.',
        'Closed in error without a winner.'),
      enabled:isLive,
      react:(s,e)=>{
        if(e.type!=='input.error')throw Error('expected error');
        return {state:closed(s,'error'),actions:[error(e.error),...s.live.map(release)]};
      } },
    { description:d('WINNER-COMPLETE','Winner','input.complete','Closed',
        'selected winner completes',
        ['complete downstream','release winning source'],
        'Completion from the selected winner terminates the result.',
        'Closed successfully, original winner remains recorded.'),
      enabled:isLive,
      react:s=>({state:closed(s,'complete'),actions:[complete,...s.live.map(release)]}) },
    { description:d('WINNER-ERROR','Winner','input.error','Closed',
        'selected winner errors',
        ['forward exact error','release winning source'],
        'The winner is not protected from subsequent errors.',
        'Closed with original winner recorded.'),
      enabled:isLive,
      react:(s,e)=>{
        if(e.type!=='input.error')throw Error('expected error');
        return {state:closed(s,'error'),actions:[error(e.error),...s.live.map(release)]};
      } },
    { description:d('CANCEL-RACE','Racing','cancel','Closed',
        'downstream cancels before a winner',
        ['unsubscribe every candidate without notifying downstream'],
        'Downstream owns the subscriptions and may cancel them all.',
        'Closed by cancellation.'),
      enabled:()=>true,
      react:s=>({state:closed(s,'cancel'),actions:s.live.map(release)}) },
    { description:d('CANCEL-WINNER','Winner','cancel','Closed',
        'downstream cancels selected source',
        ['unsubscribe winner without downstream terminal notification'],
        'Cancellation is distinct from successful or failed termination.',
        'Closed by cancellation.'),
      enabled:()=>true,
      react:s=>({state:closed(s,'cancel'),actions:s.live.map(release)}) },
  ];
  const metadata:ModelMetadata = {
    schemaVersion:'1.1',rxjsVersion:'7.8.2',
    id:operator+'-fixed-observables-atomic-subscription',operator,
    purpose:'Race source and other Observables, cancel losing sources on the first next; early error/complete terminates.',
    cardinality:{signature:operator+' : (T0*, T1*, ..., Tn*) -> (T0 | ... | Tn)*',
      conditions:[
        'The first next from any input elects exactly one winner and the winner contributes all later next values.',
        'An error or completion before any next terminates immediately even if another input may have produced a value later.',
        'After first next, only the winning source may complete or error the result.',
      ]},
    scope:{
      parameters:'0..32 additional ordinary Observable inputs; race legacy array/variadic overloads normalized to same candidate order.',
      callbacks:'No user callbacks or result selectors; opaque input values preserve identity.',
      time:'Notifications are ordered by source/scheduler arrival. Race itself creates no timers or scheduler.',
      reentrancy:'Atomic non-reentrant post-setup notifications; every input subscribed in source-first argument order before delivery.',
      exclusions:[
        'Synchronous emission/completion/error during subscription acquisition, which may prevent later candidate subscriptions.',
        'Promises/iterables, errors during input conversion, observer reentrancy, throwing teardown and scheduler-specific interleavings.',
      ],
    },
    initialization:{control:'Unsubscribed',event:'subscribe',
      sourceSubscription:'A fresh, result-local connection subscribes input 0 then each other input; zero others is identity.'},
    ownership:{
      state:'subscription-local',sharing:'No sharing; each downstream subscription creates a new race across inputs.',
      reset:'Fresh input live set and winner=null per result subscription.',
      resources:[{id:'input',kind:'subscription',owner:'result subscription; generation is fixed input index'}],
    },
    dispatch:{policy:'atomic-non-reentrant',
      actionSemantics:'First next cancels all earlier/later losing subscriptions before forwarding its payload. Early error/complete terminates all inputs.',
      cancellationCheckpoints:['Between notifications, and immediately on first winner.']},
    inputs:[
      input('subscribe','downstream','connect the race'),
      input('input.next','source','candidate emitted value'),
      input('input.complete','source','candidate completed'),
      input('input.error','source','candidate failed'),
      input('cancel','downstream','consumer cancels')],
    actionTypes:['subscribe','unsubscribe','notify'],
    controls:[
      {id:'Unsubscribed',description:'not connected',terminal:false},
      {id:'Racing',description:'all candidates live; no first next yet',terminal:false},
      {id:'Winner',description:'only selected winner live',terminal:false},
      {id:'Closed',description:'terminated or cancelled',terminal:true},
    ],
    sources:[source('src/internal/operators/'+operator+'.ts'),
      source('src/internal/operators/raceWith.ts'),
      source('src/internal/observable/race.ts')],
    evidence:{modelTests:['tests/session17-model.test.mjs'],
      runtimeTests:['tests/session17-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-17.md'},
  };
  return {
    metadata,parameters:p,rules,
    initialState:()=>({phase:'Unsubscribed',live:[],winner:null,reason:'none'}),
    control:s=>s.phase,
    validateState:s=>{
      const errors:string[]=[];
      if(s.live.some(i=>!natural(i)||i>=n) || new Set(s.live).size!==s.live.length)
        errors.push('invalid or repeated racing source');
      if(s.phase==='Unsubscribed'&&(s.live.length!==0||s.winner!==null||s.reason!=='none'))
        errors.push('illegal unconnected state');
      if(s.phase==='Racing'&&(s.live.length!==n||s.live.some((i,k)=>i!==k)||s.winner!==null||s.reason!=='none'))
        errors.push('racing must retain all candidates and no winner');
      if(s.phase==='Winner'&&(s.live.length!==1||s.winner!==s.live[0]||s.reason!=='none'))
        errors.push('winner must be only live source');
      if(s.phase==='Closed'&&(s.live.length!==0||s.reason==='none'))
        errors.push('closed must have no source and one terminal reason');
      return errors;
    },
    validateReaction:(before,event,result)=>[
      ...validateActionWord(result.actions),
      ...(event.type==='input.next'&&result.actions.filter(a=>a.type==='notify').length!==1
        ?['an admitted value must notify downstream exactly once']:[]),
      ...(event.type==='cancel'&&result.actions.some(a=>a.type==='notify')
        ?['downstream cancellation must be silent']:[]),
      ...(before.phase==='Racing'&&event.type==='input.next'&&
        result.actions.filter(a=>a.type==='unsubscribe').length!==others
        ?['first next must cancel every losing candidate']:[]),
    ],
  };
}
export const createRaceLegacyModel = <T>(others=2):RaceModel<T> => createRaceModel<T>('race',others);
export const createRaceWithModel = <T>(others=2):RaceModel<T> => createRaceModel<T>('raceWith',others);

const resource=(i:number):ResourceRef=>ref(i);
export const raceExample:readonly TimedEvent<RaceEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'input.next',resource:resource(2),value:'winner first'}},
  {time:2,event:{type:'input.next',resource:resource(2),value:'winner second'}},
  {time:3,event:{type:'input.complete',resource:resource(2)}},
];
export const raceWithExample:readonly TimedEvent<RaceEvent<number>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:2,event:{type:'input.next',resource:resource(1),value:10}},
  {time:3,event:{type:'input.next',resource:resource(1),value:11}},
  {time:4,event:{type:'input.complete',resource:resource(1)}},
];
