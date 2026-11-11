import type { Action, OperatorModel, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { createMergeMapModel } from './flatten.js';
import type { FlattenModel, FlattenParameters, FlattenState, FlattenEvent } from './flatten.js';
import { pinnedRevision } from './session10-common.js';

const pin=(path:string,purpose:string)=>({
  url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,
  revision:pinnedRevision,purpose,
});

/** RxJS flatMap is exactly the mergeMap function object at the pinned export. */
export type FlatMapModel<I,O,S=string>=FlattenModel<I,O,S>;
export type FlatMapEvent<I,O,S=string>=FlattenEvent<I,O,S>;
export function createFlatMapModel<I,O,S=string>(concurrent=Infinity):FlatMapModel<I,O,S>{
  const base=createMergeMapModel<I,O,S>(concurrent);
  return {...base,
    rules:base.rules.map(rule=>({...rule,description:{
      ...rule.description,
      id:rule.description.id.replace('MERGEMAP','FLATMAP'),
      obligations:rule.description.obligations.map(s=>s.replace('S2-MERGEMAP','S14-FLATMAP')),
      explanation:'Pinned flatMap = mergeMap exact alias. '+rule.description.explanation,
    }})),
    metadata:{...base.metadata,id:'flatMap-exact-mergeMap-'+base.parameters.concurrent,operator:'flatMap',
      purpose:'Deprecated exact alias of mergeMap; allow overlapping inner subscriptions with configured concurrency.',
      cardinality:{signature:'flatMap : (T! × Index! -> U*) -> T* -> U*',conditions:[
        ...base.metadata.cardinality.conditions,'Alias equality is checked against the pinned RxJS export at runtime.',
      ]},
      sources:[pin('src/internal/operators/flatMap.ts','Exact flatMap = mergeMap export'),...base.metadata.sources],
      evidence:{modelTests:['tests/session14-model.test.mjs'],runtimeTests:['tests/session14-rxjs.test.mjs'],
        status:'source-inspected' as const,record:'evidence/SESSION-14.md'},
    },
  };
}

/** mergeMapTo repeatedly subscribes to the same constant valid Observable. */
export type MergeMapToModel<I,O,S=string>=FlattenModel<I,O,S>;
export type MergeMapToEvent<I,O,S=string>=FlattenEvent<I,O,S>;
export function createMergeMapToModel<I,O,S=string>(
  constantSource:S,concurrent=Infinity,
):MergeMapToModel<I,O,S>{
  const base=createMergeMapModel<I,O,S>(concurrent,'constant');
  const rules=base.rules.filter(rule=>rule.description.event!=='callback.throw').map(rule=>({
    ...rule,description:{
      ...rule.description,
      id:rule.description.id.replace('MERGEMAP','MERGEMAPTO'),
      obligations:rule.description.obligations.map(s=>s.replace('S2-MERGEMAP','S14-MERGEMAPTO')),
      guard:rule.description.event==='callback.return'
        ?rule.description.guard+'; source token is the exact configured constant':rule.description.guard,
      explanation:rule.description.explanation.replaceAll('projection','constant-source binding'),
    },
    enabled:(s:FlattenState<I,S>,e:FlattenEvent<I,O,S>,p:FlattenParameters)=>
      rule.enabled(s,e,p)&&(e.type!=='callback.return'||Object.is(e.value,constantSource)),
  }));
  return {...base,rules,metadata:{
    ...base.metadata,id:'mergeMapTo-constant-'+base.parameters.concurrent,operator:'mergeMapTo',
    purpose:'Allow overlapping subscriptions to the same configured inner Observable; a source next admits one new occurrence.',
    cardinality:{signature:'mergeMapTo : T* × U* -> U*',conditions:[
      'Each accepted source next starts a NEW subscription occurrence to the same Observable object.',
      'Concurrent occurrences can overlap and interleave; bounded concurrency queues outer values FIFO.',
      'Outer completion waits for admitted and queued occurrences, while errors or cancellation release owned inners.',
    ]},
    scope:{...base.metadata.scope,
      parameters:'One valid constant Observable source and concurrency '+base.parameters.concurrent+'; no resultSelector.',
      callbacks:'No user projection; immediate callback.return is a pure constant-source binding microstep.',
      exclusions:['Deprecated resultSelector overload, Promise/Iterable input, invalid constant source.',
        'Synchronous reentrant input/inner emission during acquisition, throwing observers or finalizers.'],
    },
    ownership:{...base.metadata.ownership,
      sharing:'No sharing introduced. Repeated subscriptions may be to the same external Observable identity, which can itself be hot.',
      reset:'Per-result subscription occurrence index, active resources and FIFO queue; constant source identity preserved.',
    },
    sources:[pin('src/internal/operators/mergeMapTo.ts','Delegation to mergeMap(() => constantSource)'),...base.metadata.sources],
    evidence:{modelTests:['tests/session14-model.test.mjs'],runtimeTests:['tests/session14-rxjs.test.mjs'],
      status:'source-inspected' as const,record:'evidence/SESSION-14.md'},
  }};
}
const resource=(id:string,generation:number)=>({id,generation});
export const flatMapExample:readonly TimedEvent<FlatMapEvent<number,string,string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'outer.next',value:1}},
  {time:1,event:{type:'callback.return',resource:resource('project',0),value:'a'}},
  {time:2,event:{type:'outer.next',value:2}},
  {time:2,event:{type:'callback.return',resource:resource('project',1),value:'b'}},
  {time:3,event:{type:'inner.next',resource:resource('inner',1),value:'B'}},
  {time:4,event:{type:'outer.complete'}},
  {time:5,event:{type:'inner.next',resource:resource('inner',0),value:'A'}},
  {time:6,event:{type:'inner.complete',resource:resource('inner',0)}},
  {time:7,event:{type:'inner.complete',resource:resource('inner',1)}},
];
export const mergeMapToExample:readonly TimedEvent<MergeMapToEvent<number,string,string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'outer.next',value:1}},
  {time:1,event:{type:'callback.return',resource:resource('constant',0),value:'shared'}},
  {time:2,event:{type:'outer.next',value:2}},
  {time:2,event:{type:'callback.return',resource:resource('constant',1),value:'shared'}},
  {time:3,event:{type:'outer.complete'}},
  {time:4,event:{type:'inner.next',resource:resource('inner',0),value:'A'}},
  {time:5,event:{type:'inner.next',resource:resource('inner',1),value:'B'}},
  {time:6,event:{type:'inner.complete',resource:resource('inner',0)}},
  {time:7,event:{type:'inner.complete',resource:resource('inner',1)}},
];

/**
 * MergeScan inherits mergeMap's admission/queue/teardown machine but expands
 * callback invocation with the last INNER output as accumulator.
 * In-flight projections see the value at their own admission, not at creation time.
 */
export type MergeScanParameters<R>=FlattenParameters & Readonly<{seed:R}>;
export type MergeScanState<I,S,R>=FlattenState<I,S> & Readonly<{accumulator:R}>;
export type MergeScanEvent<I,R,S=string>=FlattenEvent<I,R,S>;
export type AccumulatorInput<I,R>=Readonly<{accumulator:R;value:I}>;
export type MergeScanModel<I,R,S=string>=OperatorModel<MergeScanParameters<R>,
  MergeScanState<I,S,R>,MergeScanEvent<I,R,S>,Action<R,AccumulatorInput<I,R>>>;

export function createMergeScanModel<I,R,S=string>(seed:R,concurrent=Infinity):MergeScanModel<I,R,S>{
  const base=createMergeMapModel<I,R,S>(concurrent,'accumulator');
  type P=MergeScanParameters<R>;type ST=MergeScanState<I,S,R>;
  type E=MergeScanEvent<I,R,S>;type A=Action<R,AccumulatorInput<I,R>>;
  const parameters:P={...base.parameters,seed};
  const rules:Rule<P,ST,E,A>[]=base.rules.map(rule=>({
    description:{...rule.description,
      id:rule.description.id.replace('MERGEMAP','MERGESCAN'),
      obligations:rule.description.obligations.map(s=>s.replace('S2-MERGEMAP','S14-MERGESCAN')),
      actions:rule.description.actions.map(s=>s.replace('projection','accumulator callback')),
      explanation:'Accumulator snapshot for a new invocation is the latest inner next (or original seed). '+rule.description.explanation,
    },
    enabled:(s,e)=>rule.enabled(s,e,base.parameters),
    react:(s,e)=>{
      const original=rule.react(s,e,base.parameters);
      const problems=base.validateReaction(s,e,original,base.parameters);
      if(problems.length)throw new Error('underlying mergeMap invariant: '+problems.join('; '));
      const acc=e.type==='inner.next'?e.value:s.accumulator;
      const state={...original.state,accumulator:acc} as ST;
      const actions=original.actions.map(a=>a.type==='invoke-callback'
        ?({...a,value:{accumulator:s.accumulator,value:a.value}} as A)
        :(a as A));
      return {state,actions};
    },
  }));
  return {
    parameters, rules, initialState:()=>({...base.initialState(),accumulator:seed} as ST),
    control:s=>base.control(s),
    validateState:(s)=>[
      ...base.validateState(s,base.parameters),
      ...(!Object.hasOwn(s,'accumulator')?['missing accumulator snapshot']:[]),
    ],
    validateReaction:(before,event,result)=>[
      ...validateActionWord(result.actions),
      ...(event.type==='inner.next'&&!Object.is(result.state.accumulator,event.value)
        ?['inner.next must update accumulator before downstream next']:[]),
      ...(event.type!=='inner.next'&&result.state.phase!=='Closed'&&
        !Object.is(result.state.accumulator,before.accumulator)
        ?['non-inner event must not overwrite accumulator']:[]),
      ...((result.actions.filter(a=>a.type==='invoke-callback')).some(a=>
        !Object.is(a.value.accumulator,before.accumulator))
        ?['callback must receive current accumulator snapshot']:[]),
      ...(event.type==='inner.next'&&!result.actions.some(a=>a.type==='notify'&&a.notification.kind==='N'&&
        Object.is(a.notification.value,event.value))?['inner.next must be forwarded unchanged']:[]),
    ],
    metadata:{
      ...base.metadata,id:'mergeScan-accumulator-'+base.parameters.concurrent,operator:'mergeScan',
      purpose:'Merge projected inner Observables while the most recent inner next updates the accumulator used at later admission.',
      cardinality:{signature:'mergeScan : (R × T × Index -> R*) × R × T* -> R*',conditions:[
        'Each projected inner may emit zero, one, many or indefinite accumulator values.',
        'Each inner next updates the state before forwarding the same value downstream.',
        'Concurrent projections receive the accumulator snapshot at their own admission. Overlap permits nondeterministic interleaving.',
        'Bounded concurrency delays projection of queued values until a slot becomes free; completion waits for all accepted inner work.',
      ]},
      scope:{...base.metadata.scope,
        parameters:'Seed is a provided opaque R reference; concurrency '+base.parameters.concurrent+'; valid Observable-returning accumulator.',
        callbacks:'One synchronous callback request carries {accumulator,value}, plus exact zero-based admission index; only correlated return/throw accepted.',
        exclusions:['Promise/Iterable return conversions, reentrant projections, observer or finalizer throws.',
          'No promise of serial accumulation under concurrency greater than 1; this model intentionally admits stale snapshots across overlaps.'],
      },
      ownership:{...base.metadata.ownership,
        reset:'Each output subscription starts from the supplied seed reference. Latest inner output replaces accumulator by identity; no implicit cloning.',
      },
      sources:[pin('src/internal/operators/mergeScan.ts','Accumulator state assigned in onBeforeNext hook'),
        pin('src/internal/operators/mergeInternals.ts','Merge concurrency, inner emission, queue and teardown'),...base.metadata.sources],
      evidence:{modelTests:['tests/session14-model.test.mjs'],runtimeTests:['tests/session14-rxjs.test.mjs'],
        status:'source-inspected' as const,record:'evidence/SESSION-14.md'},
    },
  };
}
export const mergeScanExample:readonly TimedEvent<MergeScanEvent<number,number,string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'outer.next',value:1}},
  {time:1,event:{type:'callback.return',resource:resource('accumulator',0),value:'first'}},
  {time:2,event:{type:'outer.next',value:2}},
  {time:2,event:{type:'callback.return',resource:resource('accumulator',1),value:'second'}},
  {time:3,event:{type:'inner.next',resource:resource('inner',0),value:5}},
  {time:4,event:{type:'outer.next',value:3}},
  {time:5,event:{type:'outer.complete'}},
  {time:6,event:{type:'inner.complete',resource:resource('inner',0)}},
  {time:6,event:{type:'callback.return',resource:resource('accumulator',2),value:'third'}},
  {time:7,event:{type:'inner.next',resource:resource('inner',1),value:8}},
  {time:8,event:{type:'inner.complete',resource:resource('inner',1)}},
  {time:9,event:{type:'inner.next',resource:resource('inner',2),value:9}},
  {time:10,event:{type:'inner.complete',resource:resource('inner',2)}},
];
