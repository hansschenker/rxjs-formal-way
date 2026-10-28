import type { TimedEvent } from '../schema.js';
import { createValueModel, matchesInvocation } from './value.js';
import type { ValueEvent, ValueModel, ValueParameters, ValueState } from './value.js';
export type MapParameters = ValueParameters;
export type MapState<T> = ValueState<T>;
export type MapEvent<T, R> = ValueEvent<T, R>;
export type MapModel<T, R> = ValueModel<T, R, R>;

/** Pure behavioral model of map; callbackId is a symbolic binding, not executable code. */
export function createMapModel<T, R>(callbackId = 'project'): MapModel<T, R> {
  return createValueModel<T, R, R>('map', callbackId, [{
    description: { id: 'MAP-RETURN', from: 'Calling', event: 'callback.return', guard: 'outcome identifies the pending invocation', to: 'Active',
      actions: ['forward the returned result as one value'], nextState: 'active with the next callback index', obligations: ['M02-MAP-03'],
      explanation: 'A successful projection result is forwarded as exactly one value, including undefined, an object, or an Observable. Map does not flatten or subscribe to the returned value.' },
    enabled: matchesInvocation,
    react: (s, e) => {
      if (s.phase !== 'Calling' || e.type !== 'callback.return') throw new Error('invalid map return');
      return { state: { phase: 'Active', index: s.index }, actions: [{ type: 'notify', target: 'downstream', notification: { kind: 'N', value: e.value } }] };
    },
  }]);
}

/** Literal outcomes illustrate a user projection x => x * 10, not an executed callback. */
export const mapExample: readonly TimedEvent<MapEvent<number, number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 10, event: { type: 'source.next', value: 2 } },
  { time: 10, event: { type: 'callback.return', resource: { id: 'project', generation: 0 }, value: 20 } },
  { time: 20, event: { type: 'source.next', value: 3 } },
  { time: 20, event: { type: 'callback.return', resource: { id: 'project', generation: 1 }, value: 30 } },
  { time: 30, event: { type: 'source.complete' } },
];
