import type { TimedEvent, Rule, Action } from '../schema.js';
import { createValueModel, matchesInvocation } from './value.js';
import type { ValueEvent, ValueModel, ValueParameters, ValueState } from './value.js';
export type FilterParameters = ValueParameters;
export type FilterState<T> = ValueState<T>;
/** Runtime truthiness is deliberate: JavaScript callers are not restricted to boolean outcomes. */
export type FilterEvent<T> = ValueEvent<T, unknown>;
export type FilterModel<T> = ValueModel<T, T, unknown>;

export function createFilterModel<T>(callbackId = 'predicate'): FilterModel<T> {
  const returns: readonly Rule<FilterParameters, FilterState<T>, FilterEvent<T>, Action<T, T>>[] = [
    {
      description: { id: 'FILTER-PASS', from: 'Calling', event: 'callback.return', guard: 'matching invocation and truthy result', to: 'Active',
        actions: ['forward the original incoming value unchanged'], nextState: 'active with the next callback index', obligations: ['M02-FILTER-03'],
        explanation: 'When the predicate returns a truthy result, filter forwards the original incoming value, not the predicate result. Payload identity is preserved.' },
      enabled: (s, e, p) => matchesInvocation(s, e, p) && e.type === 'callback.return' && Boolean(e.value),
      react: (s, e) => {
        if (s.phase !== 'Calling' || e.type !== 'callback.return') throw new Error('invalid filter pass');
        return { state: { phase: 'Active', index: s.index }, actions: [{ type: 'notify', target: 'downstream', notification: { kind: 'N', value: s.input } }] };
      },
    },
    {
      description: { id: 'FILTER-DROP', from: 'Calling', event: 'callback.return', guard: 'matching invocation and falsy result', to: 'Active',
        actions: [], nextState: 'active with the next callback index', obligations: ['M02-FILTER-03', 'M02-FILTER-02'],
        explanation: 'When the predicate returns a falsy result, filter emits nothing for that input and stays subscribed. The next input still receives the next index; dropping a value does not reset or pause the index.' },
      enabled: (s, e, p) => matchesInvocation(s, e, p) && e.type === 'callback.return' && !e.value,
      react: (s, e) => {
        if (s.phase !== 'Calling' || e.type !== 'callback.return') throw new Error('invalid filter drop');
        return { state: { phase: 'Active', index: s.index }, actions: [] };
      },
    },
  ];
  return createValueModel<T, T, unknown>('filter', callbackId, returns);
}

/** Literal outcomes illustrate x => x % 2 === 0. No predicate is executed by generation. */
export const filterExample: readonly TimedEvent<FilterEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 10, event: { type: 'source.next', value: 3 } },
  { time: 10, event: { type: 'callback.return', resource: { id: 'predicate', generation: 0 }, value: false } },
  { time: 20, event: { type: 'source.next', value: 4 } },
  { time: 20, event: { type: 'callback.return', resource: { id: 'predicate', generation: 1 }, value: true } },
  { time: 30, event: { type: 'source.complete' } },
];
