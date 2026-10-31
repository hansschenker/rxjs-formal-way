import type { Action, OperatorModel, ResourceRef, TimedEvent } from '../schema.js';
import { createSwitchMapModel, createMergeMapModel, createConcatMapModel, createExhaustMapModel } from './flatten.js';
import type { FlattenEvent, FlattenModel, FlattenState, FlattenParameters } from './flatten.js';

/**
 * The RxJS 7.8.2 "All" operators are exact identity-projection lowerings.
 * Keeping the reviewed flattening transducer retains cancellation, FIFO queue,
 * concurrency, inner generation, lifecycle and teardown invariants.
 *
 * Calling/callback.return are TWO PURE, synchronous logical microsteps here.
 * They are NOT a user callback or a real scheduler boundary. The identity
 * result must be the identical input token. No callback.throw is legal.
 * A finite test driver closes these microsteps before any external event.
 */
export type AllOperator = 'switchAll' | 'mergeAll' | 'concatAll' | 'exhaustAll';
export type AllState<Source> = FlattenState<Source, Source>;
export type AllEvent<Source, Output> = FlattenEvent<Source, Output, Source>;
export type AllModel<Source, Output> = FlattenModel<Source, Output, Source>;
type AllNameMap = Readonly<Record<AllOperator, 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap'>>;
const implementation: AllNameMap = {
  switchAll: 'switchMap', mergeAll: 'mergeMap', concatAll: 'concatMap', exhaustAll: 'exhaustMap',
};
const rev = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const purposes: Record<AllOperator, string> = {
  switchAll: 'Only latest: replace the previous inner source subscription with the newest.',
  mergeAll: 'Allow overlap to the concurrency limit; buffer excess source objects in arrival order.',
  concatAll: 'Queue inner source objects; subscribe to exactly one at a time.',
  exhaustAll: 'Ignore new inner sources while the current inner is active; never subscribe to ignored sources.',
};
function makeAllModel<Source, Output>(name: AllOperator, concurrent: number = Infinity): AllModel<Source, Output> {
  const kind = implementation[name];
  const base: AllModel<Source, Output> = kind === 'switchMap' ? createSwitchMapModel<Source, Output, Source>('identity')
    : kind === 'mergeMap' ? createMergeMapModel<Source, Output, Source>(concurrent, 'identity')
    : kind === 'concatMap' ? createConcatMapModel<Source, Output, Source>('identity')
    : createExhaustMapModel<Source, Output, Source>('identity');
  const prefix = kind.toUpperCase();
  const alias = name.toUpperCase();
  const rules = base.rules.filter(r => r.description.event !== 'callback.throw').map(rule => ({
    ...rule,
    description: {
      ...rule.description,
      id: rule.description.id.replace(prefix, alias),
      obligations: rule.description.obligations.map(x => x.replace('S2-' + prefix, 'S3-' + alias)),
      explanation: rule.description.explanation.replaceAll('projection', 'identity conversion').replaceAll('projected', 'received'),
      guard: rule.description.event === 'callback.return' ? rule.description.guard + '; result is identical to pending inner source' : rule.description.guard,
    },
    enabled: (state: AllState<Source>, event: AllEvent<Source, Output>, p: FlattenParameters): boolean =>
      rule.enabled(state, event, p) && (event.type !== 'callback.return' ||
        (state.phase === 'Calling' && Object.is(state.input, event.value))),
  }));
  return {
    ...base, rules,
    metadata: {
      ...base.metadata, id: name + '-' + base.parameters.concurrent, operator: name, purpose: purposes[name],
      cardinality: {
        signature: name + ' : (T*)* -> T*',
        conditions: [
          'T* is each inner source; the outer delivers inner-source identities, not plain values.',
          'An accepted inner contributes zero or more values; ignored, replaced or queued inners have policy-specific lifetimes.',
          'This Cω-inspired shape excludes completion, error and cancellation, which are specified by guarded rules.',
        ],
      },
      scope: { ...base.metadata.scope,
        parameters: name === 'mergeAll' ? 'Observable-valued outer source; concurrency ' + base.parameters.concurrent : 'Observable-valued outer source; no user projection',
        callbacks: 'No user callback. A deterministic identity microstep maps an admitted outer source token to itself without time advancement or throwing.',
        exclusions: [
          'The identity microstep is a modeling refinement of the implementation, not an actual callback or a scheduling boundary.',
          'Arbitrary ObservableInput conversion, reentrant source/observer/finalizer behavior and synchronous nested teardown equivalence are outside the exact-trace profile.',
          'Invalid concurrency, throwing observers, and producer-abort guarantees are out of scope.',
        ],
      },
      sources: [
        { url: 'https://github.com/ReactiveX/rxjs/blob/' + rev + '/src/internal/operators/' + name + '.ts', revision: rev,
          purpose: 'Pinned exported alias definition' },
        ...base.metadata.sources,
      ],
      evidence: { modelTests: ['tests/session3-all-model.test.mjs'], runtimeTests: ['tests/session3-all-rxjs.test.mjs'],
        status: 'source-inspected' as const, record: 'evidence/SESSION-03.md' },
    },
  };
}
export const createSwitchAllModel = <Source, Output>(): AllModel<Source, Output> => makeAllModel('switchAll');
export const createMergeAllModel = <Source, Output>(concurrent = Infinity): AllModel<Source, Output> => makeAllModel('mergeAll', concurrent);
export const createConcatAllModel = <Source, Output>(): AllModel<Source, Output> => makeAllModel('concatAll');
export const createExhaustAllModel = <Source, Output>(): AllModel<Source, Output> => makeAllModel('exhaustAll');

const inner = (generation: number): ResourceRef => ({ id: 'inner', generation });
const identity = (generation: number): ResourceRef => ({ id: 'identity', generation });
const at = (time: number, event: AllEvent<string, string>): TimedEvent<AllEvent<string, string>> => ({ time, event });

export const switchAllExample = [
  at(0, { type: 'subscribe' }), at(1, { type: 'outer.next', value: 'A' }), at(1, { type: 'callback.return', resource: identity(0), value: 'A' }),
  at(2, { type: 'inner.next', resource: inner(0), value: 'a1' }), at(3, { type: 'outer.next', value: 'B' }), at(3, { type: 'callback.return', resource: identity(1), value: 'B' }),
  at(4, { type: 'outer.complete' }), at(5, { type: 'inner.next', resource: inner(1), value: 'b1' }), at(6, { type: 'inner.complete', resource: inner(1) }),
] as const;
export const mergeAllExample = [
  at(0, { type: 'subscribe' }), at(1, { type: 'outer.next', value: 'A' }), at(1, { type: 'callback.return', resource: identity(0), value: 'A' }),
  at(2, { type: 'outer.next', value: 'B' }), at(2, { type: 'callback.return', resource: identity(1), value: 'B' }),
  at(3, { type: 'outer.next', value: 'C' }), at(4, { type: 'outer.complete' }),
  at(5, { type: 'inner.complete', resource: inner(0) }), at(5, { type: 'callback.return', resource: identity(2), value: 'C' }),
  at(6, { type: 'inner.next', resource: inner(1), value: 'b1' }), at(7, { type: 'inner.complete', resource: inner(1) }),
  at(8, { type: 'inner.next', resource: inner(2), value: 'c1' }), at(9, { type: 'inner.complete', resource: inner(2) }),
] as const;
export const concatAllExample = [
  at(0, { type: 'subscribe' }), at(1, { type: 'outer.next', value: 'A' }), at(1, { type: 'callback.return', resource: identity(0), value: 'A' }),
  at(2, { type: 'outer.next', value: 'B' }), at(3, { type: 'outer.complete' }),
  at(4, { type: 'inner.next', resource: inner(0), value: 'a1' }), at(5, { type: 'inner.complete', resource: inner(0) }),
  at(5, { type: 'callback.return', resource: identity(1), value: 'B' }), at(6, { type: 'inner.next', resource: inner(1), value: 'b1' }),
  at(7, { type: 'inner.complete', resource: inner(1) }),
] as const;
export const exhaustAllExample = [
  at(0, { type: 'subscribe' }), at(1, { type: 'outer.next', value: 'A' }), at(1, { type: 'callback.return', resource: identity(0), value: 'A' }),
  at(2, { type: 'outer.next', value: 'ignored' }), at(3, { type: 'inner.next', resource: inner(0), value: 'a1' }),
  at(4, { type: 'inner.complete', resource: inner(0) }), at(5, { type: 'outer.next', value: 'B' }),
  at(5, { type: 'callback.return', resource: identity(1), value: 'B' }), at(6, { type: 'outer.complete' }),
  at(7, { type: 'inner.next', resource: inner(1), value: 'b1' }), at(8, { type: 'inner.complete', resource: inner(1) }),
] as const;
