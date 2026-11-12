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

/** mergeWith is exactly the unscheduled, unbounded-concurrency pipeable merge profile. */
export function createMergeWithModel<T>(otherSources = 2): MergeModel<T> {
  const base = createMergeModel<T>(otherSources);
  return {
    ...base,
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
        exclusions: ['No Promise/Iterable source conversion or reentrant synchronous emissions during acquisition.',
          'No deprecated concurrency/scheduler overload (these belong to merge, not mergeWith).'],
      },
      ownership: { ...base.metadata.ownership,
        sharing: 'No sharing: every result subscription independently subscribes to all input Observables.' },
      sources: [source('src/internal/operators/mergeWith.ts'), source('src/internal/operators/merge.ts'),
        source('src/internal/operators/mergeInternals.ts')],
      evidence,
    },
    rules: base.rules.map(rule => ({
      ...rule, description: { ...rule.description,
        id: rule.description.id.replace('S14-MERGE-', 'S15-MERGEWITH-'),
        obligations: rule.description.obligations.map(x => x.replace('S14-MERGE-', 'S15-MERGEWITH-')) },
    })),
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
