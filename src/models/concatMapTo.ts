import type { TimedEvent } from '../schema.js';
import type { FlattenEvent, FlattenModel, FlattenParameters, FlattenState } from './flatten.js';
import { createConcatMapModel } from './flatten.js';

/**
 * The pinned concatMapTo implementation is concatMap(() => innerObservable).
 * A constant binding is resolved as a pure microstep rather than invoking a
 * user projection. The same Observable identity can be subscribed repeatedly,
 * once for each admitted outer value; queued values are not subscribed yet.
 */
export type ConcatMapToState<Input, Source> = FlattenState<Input, Source>;
export type ConcatMapToEvent<Input, Output, Source> = FlattenEvent<Input, Output, Source>;
export type ConcatMapToModel<Input, Output, Source> = FlattenModel<Input, Output, Source>;
const revision='e5351d02e225e275ac0e497c7b66eaa5f0c88791';

export function createConcatMapToModel<Input, Output, Source>(
  constantSource: Source,
): ConcatMapToModel<Input, Output, Source> {
  const base = createConcatMapModel<Input, Output, Source>('constant');
  const rules = base.rules.filter(rule => rule.description.event !== 'callback.throw').map(rule => ({
    ...rule,
    description: {
      ...rule.description,
      id: rule.description.id.replace('CONCATMAP', 'CONCATMAPTO'),
      obligations: rule.description.obligations.map(s => s.replace('S2-CONCATMAP', 'S9-CONCATMAPTO')),
      guard: rule.description.event === 'callback.return'
        ? rule.description.guard + '; returned source is identical to constant binding'
        : rule.description.guard,
      explanation: rule.description.explanation
        .replaceAll('projection', 'constant source binding')
        .replaceAll('projected', 'repeated'),
    },
    enabled: (state: ConcatMapToState<Input, Source>,
      event: ConcatMapToEvent<Input, Output, Source>, p: FlattenParameters) =>
      rule.enabled(state, event, p) &&
      (event.type !== 'callback.return' || Object.is(event.value, constantSource)),
  }));
  return {
    ...base, rules,
    metadata: {
      ...base.metadata,
      id: 'concatMapTo-constant-Observable',
      operator: 'concatMapTo',
      purpose: 'Queue each outer value; repeatedly connect the SAME configured inner Observable one at a time.',
      cardinality: {
        signature: 'concatMapTo : T* × U* → U*',
        conditions: [
          'Each outer next adds one occurrence of the constant inner Observable identity.',
          'Only one occurrence is subscribed at a time; excess occurrences queue in arrival order.',
          'A new subscription to the SAME Observable is opened after the previous inner completes.',
          'Outer completion waits for the currently active occurrence and queued occurrences; an infinite inner prevents further progress.',
        ],
      },
      scope: {
        parameters: 'One bound valid Observable, reused as the constant inner source; no resultSelector overload.',
        callbacks: 'No user projection. callback.return is a pure, immediate constant-source binding microstep required by the existing guarded flattening runner; only the exact constant token is admissible.',
        time: 'All input and inner notifications are externally ordered; no timers or schedulers are introduced.',
        reentrancy: 'Non-reentrant post-setup notifications, callback binding resolved synchronously before the next external event.',
        exclusions: [
          'Deprecated resultSelector overload, Promise/Iterable conversion, invalid inner source, synchronous reentrant inner delivery during subscription.',
          'Observer/finalizer throws and cancellation inside a notification or resource acquisition.',
          'No guarantee that unsubscribing cancels external work lacking actual Observable teardown.',
        ],
      },
      initialization: {
        control: 'Unsubscribed', event: 'subscribe',
        sourceSubscription: 'Connect outer; the first admitted outer next starts an occurrence of the configured inner Observable.',
      },
      ownership: {
        ...base.metadata.ownership,
        sharing: 'No sharing is created. Multiple subscriptions may connect to one and the same externally supplied Observable object; the producer may independently be hot.',
        reset: 'Per-result FIFO queue and inner occurrence indices reset on every result subscription; constant source identity is preserved.',
      },
      dispatch: {
        ...base.metadata.dispatch,
        actionSemantics: 'Queue like concatMap with concurrency 1; immediate callback.return resolves the same constant source for each admitted occurrence. Distinct inner subscription generations do not imply distinct source objects.',
      },
      sources: [
        { url: 'https://github.com/ReactiveX/rxjs/blob/' + revision + '/src/internal/operators/concatMapTo.ts',
          revision, purpose: 'Exact delegation to concatMap(() => innerObservable)' },
        ...base.metadata.sources,
      ],
      evidence: {
        modelTests: ['tests/session09-model.test.mjs'],
        runtimeTests: ['tests/session09-rxjs.test.mjs'],
        status: 'source-inspected' as const,
        record: 'evidence/SESSION-09.md',
      },
    },
  };
}

const ref = (id: string, generation: number) => ({ id, generation });
const at = (time: number, event: ConcatMapToEvent<number, string, string>):
 TimedEvent<ConcatMapToEvent<number, string, string>> => ({ time, event });
export const concatMapToExample = [
  at(0, { type: 'subscribe' }),
  at(1, { type: 'outer.next', value: 1 }),
  at(1, { type: 'callback.return', resource: ref('constant', 0), value: 'shared' }),
  at(2, { type: 'outer.next', value: 2 }),
  at(3, { type: 'outer.complete' }),
  at(4, { type: 'inner.next', resource: ref('inner', 0), value: 'a' }),
  at(5, { type: 'inner.complete', resource: ref('inner', 0) }),
  at(5, { type: 'callback.return', resource: ref('constant', 1), value: 'shared' }),
  at(6, { type: 'inner.next', resource: ref('inner', 1), value: 'b' }),
  at(7, { type: 'inner.complete', resource: ref('inner', 1) }),
] as const;
