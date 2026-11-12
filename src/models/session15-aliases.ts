import type { TimedEvent } from '../schema.js';
import { createMergeModel, type MergeModel, type MergeEvent } from './session14-merge.js';
import { createConnectModel, type ConnectModel, type ConnectEvent } from './connect.js';
import { pinnedRevision } from './session10-common.js';

const evidence = {
  modelTests: ['tests/session15-model.test.mjs'],
  runtimeTests: ['tests/session15-rxjs.test.mjs'],
  status: 'source-inspected' as const,
  record: 'evidence/SESSION-15.md',
};
const source = (path: string) => ({
  url: 'https://github.com/ReactiveX/rxjs/blob/' + pinnedRevision + '/' + path,
  revision: pinnedRevision,
  purpose: 'Pinned RxJS 7.8.2 export delegation and subscription semantics',
});

/** Specialize the reusable merge machine, not merely its rule identifiers.
 * This profile excludes input delivery during subscription acquisition.
 * The pending field is retained for type compatibility, but is invariantly empty.
 */
export function createMergeWithModel<T>(otherSources = 2): MergeModel<T> {
  const base = createMergeModel<T>(otherSources);
  const descriptions = {
    INIT: {
      guard: 'first consumer connection',
      actions: ['subscribe source 0 first, then every configured other input in argument order'],
      nextState: 'Active; live inputs are 0 through ' + otherSources + '; pending is empty',
      explanation: 'All configured inputs are subscribed in argument order. There is no concurrency limit or waiting-source admission policy in mergeWith.',
    },
    NEXT: {
      guard: 'input resource belongs to the current live-input set',
      actions: ['forward the exact input payload once'],
      nextState: 'Active; the live-input set is unchanged; pending remains empty',
      explanation: 'A value from any live input flows downstream unchanged in delivery order; it does not change subscription ownership.',
    },
    'COMPLETE-WAIT': {
      guard: 'the completing input is live and at least one other input remains live',
      actions: ['release the completed input; emit no result notification'],
      nextState: 'Active; remove the completed input from the live-input set; pending remains empty',
      explanation: 'One input completion removes only that input. The result waits while any other input remains live.',
    },
    'COMPLETE-LAST': {
      guard: 'the completing input is the only live input',
      actions: ['release the final input and run its registered teardown', 'complete the result'],
      nextState: 'Closed with reason complete; no owned input subscriptions',
      explanation: 'For completion delivered after subscription setup, the final input teardown precedes normal result completion. Subscription-time emissions and late teardown registration are outside this profile.',
    },
    ERROR: {
      guard: 'the failing input belongs to the live-input set',
      actions: ['forward the exact error', 'release every live input in subscription order'],
      nextState: 'Closed with reason input-error; no owned input subscriptions',
      explanation: 'An input failure errors the result and tears down every live input, including the failing one. No value is manufactured.',
    },
    CANCEL: {
      guard: 'the result is Active and the consumer unsubscribes',
      actions: ['release every live input in subscription order; emit no result notification'],
      nextState: 'Closed with reason cancel; no owned input subscriptions',
      explanation: 'Consumer cancellation is silent downstream and releases all live input subscriptions. No completion notification is synthesized.',
    },
  };
  const rules: MergeModel<T>['rules'] = base.rules
    .filter(rule => rule.description.id !== 'S14-MERGE-REFILL')
    .filter(rule => otherSources > 0 || rule.description.id !== 'S14-MERGE-COMPLETE-WAIT')
    .map(rule => {
      const suffix = rule.description.id.slice('S14-MERGE-'.length) as keyof typeof descriptions;
      return {
        ...rule,
        description: {
          ...rule.description,
          ...descriptions[suffix],
          id: 'S15-MERGEWITH-' + suffix,
          obligations: ['S15-MERGEWITH-' + suffix],
        },
        react: (state, event, parameters) => {
          const reaction = rule.react(state, event, parameters);
          // RxJS mergeInternals checks final completion in onFinalize, after
          // OperatorSubscriber has unsubscribed its registered input teardown.
          return suffix === 'COMPLETE-LAST'
            ? { ...reaction, actions: [...reaction.actions].reverse() }
            : reaction;
        },
      };
    });
  return {
    ...base,
    rules,
    validateState: (state, parameters) => [
      ...base.validateState(state, parameters),
      ...(state.phase === 'Active' && state.pending.length !== 0 ? ['mergeWith cannot have pending input subscriptions'] : []),
      ...(state.phase === 'Active' && state.total !== otherSources + 1 ? ['mergeWith input inventory does not match its profile'] : []),
      ...(parameters.concurrent !== 'unbounded' ? ['mergeWith concurrency must be unbounded'] : []),
    ],
    metadata: {
      ...base.metadata, id: 'mergeWith-unbounded-' + otherSources, operator: 'mergeWith',
      purpose: 'Unbounded pipeable merge of the source and fixed other Observable inputs.',
      cardinality: {
        signature: 'mergeWith : T* × U1* × ... × Un* → (T | U1 | ... | Un)*',
        conditions: [
          'Each live input next is forwarded once, as soon as delivered.',
          'The source is subscribed first, then every configured other Observable; there is no concurrency argument.',
          'Completion waits for all sources; first error terminates and cancels the rest.',
        ],
      },
      scope: {
        ...base.metadata.scope,
        parameters: 'Exactly ' + otherSources + ' other valid Observable inputs; unbounded concurrency, no scheduler argument.',
        reentrancy: 'Subscription setup is atomic. Inputs deliver only after all subscriptions and their teardowns have been registered. No observer or teardown reentry.',
        exclusions: ['No Promise/Iterable source conversion or synchronous input emissions during subscription acquisition.',
          'No concurrency/scheduler argument; equal-time delivery order belongs to the supplied sources and scheduler.',
          'No cancellation inside observer delivery, throwing/reentrant observers or finalizers, or input inventories above 32 others.'],
      },
      initialization: { ...base.metadata.initialization,
        sourceSubscription: 'Acquire source 0 first, then every configured other input; no pending queue.' },
      dispatch: { ...base.metadata.dispatch,
        actionSemantics: 'Ordered subscription, notification and registered-input-teardown observations. Normal final input teardown precedes result completion; error notification precedes result-owned cleanup.',
        cancellationCheckpoints: ['Between external notifications; cancel every live input silently.'],
      },
      ownership: { ...base.metadata.ownership,
        reset: 'Fresh live-input set per result subscription; pending is always empty.',
        sharing: 'No sharing: every result subscription independently subscribes to all input Observables.' },
      controls: base.metadata.controls.map(control => control.id === 'Active'
        ? { ...control, description: 'one or more live inputs; no pending input subscriptions' } : control),
      sources: [source('src/internal/operators/mergeWith.ts'), source('src/internal/operators/merge.ts'),
        source('src/internal/operators/mergeInternals.ts'), source('src/internal/operators/OperatorSubscriber.ts'),
        source('spec/operators/mergeWith-spec.ts')],
      evidence: {
        ...evidence,
        modelTests: [...evidence.modelTests, 'tests/mergeWith-refinement.test.mjs'],
        runtimeTests: [...evidence.runtimeTests, 'tests/mergeWith-refinement.test.mjs'],
        record: 'evidence/REFINEMENT-MERGEWITH.md',
        scenarios: 'generated/mergeWith.scenarios.md',
        coverage: 'generated/mergeWith.coverage.md',
      },
    },
  };
}

/** Scope: factory-based multicast selector form, using a Subject and two selected branches.
 * The selector-less ConnectableObservable is intentionally NOT claimed by this profile. */
export function createMulticastModel<T>(): ConnectModel<T> {
  const base = createConnectModel<T>();
  return {
    ...base,
    metadata: {
      ...base.metadata, id: 'multicast-factory-selector-two-branches', operator: 'multicast',
      purpose: 'Deprecated multicast(() => new Subject(), selector) with two branches set up before connecting one original source.',
      cardinality: {
        signature: 'multicast(SubjectFactory, merge(shared$,shared$)) : T* → (T + T)*',
        conditions: [
          'One source subscription per selected-result subscription, despite two consumers of the shared Subject.',
          'The selected output is subscribed before the source is acquired, including synchronous producers.',
          'A factory creates a fresh Subject for every output subscription; a fixed Subject instance has different reuse semantics and is out of scope.',
        ],
      },
      scope: { ...base.metadata.scope,
        parameters: 'Deprecated subjectFactory plus selector overload. Factory returns fresh plain Subject; selector merges shared$ twice.',
        exclusions: ['Subject instance reuse, selector-less ConnectableObservable.connect/refCount, ReplaySubject/BehaviorSubject/AsyncSubject, custom connector and arbitrary selectors.',
          'Synchronous selected-result early termination, observer reentrancy and throwing finalizers.'],
      },
      ownership: { ...base.metadata.ownership,
        sharing: 'Within one selected-result subscription, one Subject multicasts a single source connection to two selected branches. Separate result subscriptions get separate Subjects.' },
      sources: [source('src/internal/operators/multicast.ts'),source('src/internal/operators/connect.ts'),
        source('src/internal/observable/ConnectableObservable.ts')],
      evidence,
    },
    rules: base.rules.map(rule => ({
      ...rule, description: { ...rule.description,
        id: rule.description.id.replace('CONNECT-', 'S15-MULTICAST-'),
        obligations: rule.description.obligations.map(x => x.replace('CONNECT-', 'S15-MULTICAST-')) },
    })),
  };
}

export const mergeWithExample: readonly TimedEvent<MergeEvent<string>>[] = [
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'input.next',resource:{id:'input',generation:1},value:'other'}},
  {time:2,event:{type:'input.next',resource:{id:'input',generation:0},value:'source'}},
  {time:3,event:{type:'input.complete',resource:{id:'input',generation:0}}},
  {time:4,event:{type:'input.complete',resource:{id:'input',generation:1}}},
  {time:5,event:{type:'input.complete',resource:{id:'input',generation:2}}},
];
export const multicastExample: readonly TimedEvent<ConnectEvent<number>>[] = [
  {time:0,event:{type:'subscribe'}},
  {time:0,event:{type:'selector.return',resource:{id:'selector',generation:0}}},
  {time:1,event:{type:'source.next',value:1}},
  {time:2,event:{type:'source.next',value:2}},
  {time:3,event:{type:'source.complete'}},
];
