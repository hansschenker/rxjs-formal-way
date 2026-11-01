import type { Action, OperatorModel, Rule, TimedEvent } from '../schema.js';
import {
  checkedActions, notifyComplete, notifyError, notifyNext,
  session4Metadata, subscribeSource, unsubscribeSource, validIndex,
} from './session4-common.js';

export type StartWithParameters<P> = Readonly<{ prefix: readonly P[]; scheduler: 'none' }>;
export type StartWithState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Prefix'; index: number }>
  | Readonly<{ phase: 'Active' }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'error' | 'cancel' }>;
export type StartWithEvent<T> =
  | Readonly<{ type: 'subscribe' | 'prefix.next' | 'prefix.complete' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;
export type StartWithModel<T, P> = OperatorModel<StartWithParameters<P>, StartWithState, StartWithEvent<T>, Action<T | P>>;
const closed = (reason: 'complete' | 'error' | 'cancel'): StartWithState => ({ phase: 'Closed', reason });

/** Prefix steps are explicit synchronous logical microsteps; they do not represent a timer or extra source subscription. */
export function createStartWithModel<T, P>(prefix: readonly P[]): StartWithModel<T, P> {
  const parameters: StartWithParameters<P> = { prefix: [...prefix], scheduler: 'none' };
  const rules: readonly Rule<StartWithParameters<P>, StartWithState, StartWithEvent<T>, Action<T | P>>[] = [
    {
      description: { id: 'STARTWITH-INIT-EMPTY', from: 'Unsubscribed', event: 'subscribe', guard: 'zero supplied values',
        to: 'Active', actions: ['subscribe source immediately'], nextState: 'active with source subscription',
        obligations: ['S4-STARTWITH-EMPTY'], explanation: 'Without prefix values, the source is subscribed to immediately and is forwarded unchanged.' },
      enabled: (_s, _e, p) => p.prefix.length === 0,
      react: () => ({ state: { phase: 'Active' }, actions: [subscribeSource] }),
    },
    {
      description: { id: 'STARTWITH-INIT-PREFIX', from: 'Unsubscribed', event: 'subscribe', guard: 'one or more prefix values',
        to: 'Prefix', actions: ['begin synchronous prefix delivery without subscribing to source'],
        nextState: 'prefix phase with index zero', obligations: ['S4-STARTWITH-PREFIX'],
        explanation: 'At subscription, startWith emits its supplied values before connecting to the source. Construction of the pipeline is lazy.' },
      enabled: (_s, _e, p) => p.prefix.length > 0,
      react: () => ({ state: { phase: 'Prefix', index: 0 }, actions: [] }),
    },
    {
      description: { id: 'STARTWITH-EMIT', from: 'Prefix', event: 'prefix.next', guard: 'prefix index < configured length',
        to: 'Prefix', actions: ['emit the current prefix payload synchronously'],
        nextState: 'prefix phase with advanced index', obligations: ['S4-STARTWITH-PREFIX'],
        explanation: 'Each configured prefix value is forwarded in argument order, including undefined, null and repeated values. It is emitted synchronously in the default unscheduled profile.' },
      enabled: (s, _e, p) => s.phase === 'Prefix' && s.index < p.prefix.length,
      react: (s, _e, p) => {
        if (s.phase !== 'Prefix') throw new Error('invalid prefix emission');
        return { state: { phase: 'Prefix', index: s.index + 1 }, actions: [notifyNext<T | P>(p.prefix[s.index] as P)] };
      },
    },
    {
      description: { id: 'STARTWITH-CONNECT', from: 'Prefix', event: 'prefix.complete', guard: 'every prefix value emitted',
        to: 'Active', actions: ['subscribe source after the last prefix notification returns'],
        nextState: 'active; source now subscribed', obligations: ['S4-STARTWITH-ORDER'],
        explanation: 'Only after the entire prefix sequence completes does startWith subscribe to the source. An observer that cancels during the prefix prevents source acquisition.' },
      enabled: (s, _e, p) => s.phase === 'Prefix' && s.index === p.prefix.length,
      react: () => ({ state: { phase: 'Active' }, actions: [subscribeSource] }),
    },
    {
      description: { id: 'STARTWITH-CANCEL-PREFIX', from: 'Prefix', event: 'cancel', guard: 'cancel before source acquisition',
        to: 'Closed', actions: ['stop prefix delivery; no source subscription to release'],
        nextState: 'closed before subscribing to source', obligations: ['S4-STARTWITH-CANCEL'],
        explanation: 'Cancellation during prefix delivery suppresses remaining prefix values and prevents the source from ever being subscribed.' },
      enabled: () => true,
      react: () => ({ state: closed('cancel'), actions: [] }),
    },
    {
      description: { id: 'STARTWITH-NEXT', from: 'Active', event: 'source.next', guard: 'source connected',
        to: 'Active', actions: ['forward source value unchanged'],
        nextState: 'active', obligations: ['S4-STARTWITH-ORDER'],
        explanation: 'After the prefix, all source values flow unchanged in their original order and arrival times.' },
      enabled: () => true,
      react: (_s, e) => {
        if (e.type !== 'source.next') throw new Error('invalid startWith source value');
        return { state: { phase: 'Active' }, actions: [notifyNext<T | P>(e.value)] };
      },
    },
    {
      description: { id: 'STARTWITH-COMPLETE', from: 'Active', event: 'source.complete', guard: 'source completed after prefix',
        to: 'Closed', actions: ['complete downstream', 'release source'],
        nextState: 'closed after completion', obligations: ['S4-STARTWITH-LIFECYCLE'],
        explanation: 'Once prefix delivery and the source finish, the output completes. An empty source still receives all prefix values first.' },
      enabled: () => true,
      react: () => ({ state: closed('complete'), actions: [notifyComplete, unsubscribeSource] }),
    },
    {
      description: { id: 'STARTWITH-ERROR', from: 'Active', event: 'source.error', guard: 'source errored after prefix',
        to: 'Closed', actions: ['forward exact error', 'release source'],
        nextState: 'closed after error', obligations: ['S4-STARTWITH-LIFECYCLE'],
        explanation: 'A source error arrives only after the prefix has been emitted. It passes through unchanged; no completion follows.' },
      enabled: () => true,
      react: (_s, e) => {
        if (e.type !== 'source.error') throw new Error('invalid startWith error');
        return { state: closed('error'), actions: [notifyError(e.error), unsubscribeSource] };
      },
    },
    {
      description: { id: 'STARTWITH-CANCEL-ACTIVE', from: 'Active', event: 'cancel', guard: 'source already subscribed',
        to: 'Closed', actions: ['release source without completion'],
        nextState: 'closed by cancellation', obligations: ['S4-STARTWITH-CANCEL'],
        explanation: 'Cancellation after prefix completion releases the source and stops future values without synthesizing completion.' },
      enabled: () => true,
      react: () => ({ state: closed('cancel'), actions: [unsubscribeSource] }),
    },
  ];
  return {
    parameters, rules,
    metadata: session4Metadata({
      id: 'startWith-unscheduled-' + prefix.length, operator: 'startWith',
      purpose: 'Before subscribing to source, synchronously emit all supplied prefix values in order, then forward source notifications.',
      cardinality: { signature: 'startWith(P*) : T* -> (P + T)*', conditions: [
        'Successful output begins with exactly the supplied prefix word, followed by the source word.',
        'Prefix is not replayed in addition to each source value; cancellation during prefix prevents source acquisition.',
      ] },
      scope: { parameters: 'A finite frozen snapshot of supplied prefix values; no SchedulerLike argument.',
        callbacks: 'No user projection. Prefix values are opaque and forwarded without inspection.',
        time: 'Unscheduled prefix values are synchronous on subscription; source time begins only when subscribed. No internal clock or timer.',
        reentrancy: 'Atomic non-reentrant prefix microsteps and source delivery; supports downstream cancellation between prefix emissions.',
        exclusions: ['Deprecated SchedulerLike overload, which uses scheduling and changes when the source is subscribed.',
          'Throwing observer/finalizer, nested synchronous reentry or guaranteed physical producer abort.'] },
      initialization: { control: 'Unsubscribed', event: 'subscribe',
        sourceSubscription: 'After every prefix next, unless zero prefixes or downstream cancellation; no eager source connection.' },
      ownership: { state: 'subscription-local', sharing: 'No multicasting. Each result subscription repeats prefix and owns its own source subscription.',
        reset: 'New subscription starts from prefix index zero; closed execution is not restarted.',
        resources: [{ id: 'source', kind: 'subscription', owner: 'result subscription, only after prefix' }] },
      dispatch: { policy: 'atomic-non-reentrant',
        actionSemantics: 'Synthetic prefix.next and prefix.complete microsteps model the synchronous concat(values,source) behavior; they are not source events or timers.',
        cancellationCheckpoints: ['After each prefix next and before source acquisition.', 'After source acquisition and between source events.'] },
      inputs: [
        { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'fresh downstream subscription begins prefix delivery' },
        { type: 'prefix.next', origin: 'environment', category: 'lifecycle', description: 'next configured prefix item is delivered synchronously' },
        { type: 'prefix.complete', origin: 'environment', category: 'lifecycle', description: 'all prefix notifications finished; connect to source' },
        { type: 'source.next', origin: 'source', category: 'notification', description: 'source delivers value after prefix' },
        { type: 'source.complete', origin: 'source', category: 'notification', description: 'source completes' },
        { type: 'source.error', origin: 'source', category: 'notification', description: 'source errors' },
        { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream cancels' },
      ],
      actionTypes: ['notify', 'subscribe', 'unsubscribe'],
      controls: [
        { id: 'Unsubscribed', description: 'not yet connected', terminal: false },
        { id: 'Prefix', description: 'emitting configured values; source not yet connected', terminal: false },
        { id: 'Active', description: 'prefix complete and source connected', terminal: false },
        { id: 'Closed', description: 'terminated or cancelled', terminal: true },
      ],
      sourcePaths: ['src/internal/operators/startWith.ts','src/internal/observable/concat.ts','src/internal/util/args.ts'],
    }),
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: (s, p) => {
      if (s.phase === 'Unsubscribed' || s.phase === 'Active') return [];
      if (s.phase === 'Closed') return ['complete', 'error', 'cancel'].includes(s.reason) ? [] : ['invalid reason'];
      if (s.phase === 'Prefix' && validIndex(s.index) && s.index <= p.prefix.length) return [];
      return ['invalid prefix index'];
    },
    validateReaction: (s, e, result, p) => {
      const errors = checkedActions(result.actions, ['source']);
      if (s.phase === 'Prefix' && e.type === 'prefix.next' && (result.actions.length !== 1 || result.actions[0]?.type !== 'notify' ||
         result.actions[0].notification.kind !== 'N' ||
         !Object.is(result.actions[0].notification.value, p.prefix[s.index]))) errors.push('prefix payload/order changed');
      return errors;
    },
  };
}
export const startWithExample: readonly TimedEvent<StartWithEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 0, event: { type: 'prefix.next' } },
  { time: 0, event: { type: 'prefix.next' } },
  { time: 0, event: { type: 'prefix.complete' } },
  { time: 1, event: { type: 'source.next', value: 5 } },
  { time: 2, event: { type: 'source.next', value: 6 } },
  { time: 3, event: { type: 'source.complete' } },
];
