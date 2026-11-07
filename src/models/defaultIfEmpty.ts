import type { Action, OperatorModel, Rule, TimedEvent } from '../schema.js';
import { actionErrors, complete, describe, error, metadata, next, source, subscribe, unsubscribe } from './session10-common.js';

/** Source payload and fallback are opaque; hasValue is a presence flag, not truthiness. */
export type DefaultIfEmptyParameters<R> = Readonly<{ fallback: R }>;
export type DefaultIfEmptyState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; hasValue: boolean }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'error' | 'cancel' }>;
export type DefaultIfEmptyEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;
export type DefaultIfEmptyModel<T, R> =
  OperatorModel<DefaultIfEmptyParameters<R>, DefaultIfEmptyState, DefaultIfEmptyEvent<T>, Action<T | R>>;

export function createDefaultIfEmptyModel<T, R>(fallback: R): DefaultIfEmptyModel<T, R> {
  type S = DefaultIfEmptyState; type E = DefaultIfEmptyEvent<T>; type A = Action<T | R>;
  type Rt = Rule<DefaultIfEmptyParameters<R>, S, E, A>;
  const d = (id: string, from: S['phase'], event: E['type'], to: S['phase'],
    guard: string, acts: string[], explanation: string) =>
    describe('defaultIfEmpty', id, from, event, to, guard, acts, explanation);
  const closed = (reason: Extract<S, { phase: 'Closed' }>['reason']): S => ({ phase: 'Closed', reason });
  const rules: Rt[] = [
    { description: d('INIT', 'Unsubscribed', 'subscribe', 'Active', 'new subscription',
      ['acquire source'], 'Subscription starts source execution, not construction of the dataflow.'),
      enabled: () => true,
      react: () => ({ state: { phase: 'Active', hasValue: false }, actions: [subscribe(source)] }) },
    { description: d('NEXT', 'Active', 'source.next', 'Active', 'source live',
      ['remember that at least one value arrived', 'forward exact value'],
      'The remembered bit distinguishes no value from a literal undefined or null value.'),
      enabled: () => true, react: (_s, e) => {
        if (e.type !== 'source.next') throw Error('invalid next');
        return { state: { phase: 'Active', hasValue: true }, actions: [next(e.value)] };
      } },
    { description: d('EMPTY', 'Active', 'source.complete', 'Closed', 'no source value was seen',
      ['emit configured fallback once', 'complete', 'release source'],
      'The fallback is emitted only after an empty source successfully completes.'),
      enabled: s => s.phase === 'Active' && !s.hasValue,
      react: (_s, _e, p) => ({ state: closed('complete'),
        actions: [next(p.fallback), complete, unsubscribe(source)] }) },
    { description: d('NONEMPTY', 'Active', 'source.complete', 'Closed', 'some source next was seen',
      ['complete without fallback', 'release source'],
      'A nonempty source completes with no extra value.'),
      enabled: s => s.phase === 'Active' && s.hasValue,
      react: () => ({ state: closed('complete'), actions: [complete, unsubscribe(source)] }) },
    { description: d('ERROR', 'Active', 'source.error', 'Closed', 'source errored',
      ['forward exact error', 'release source; no fallback'],
      'An error is not treated as an empty successful completion.'),
      enabled: () => true, react: (_s, e) => {
        if (e.type !== 'source.error') throw Error('invalid source error');
        return { state: closed('error'), actions: [error(e.error), unsubscribe(source)] };
      } },
    { description: d('CANCEL', 'Active', 'cancel', 'Closed', 'downstream unsubscribed',
      ['release source silently'], 'Cancellation neither emits fallback nor completes.'),
      enabled: () => true,
      react: () => ({ state: closed('cancel'), actions: [unsubscribe(source)] }) },
  ];
  return {
    parameters: { fallback }, rules,
    metadata: metadata({
      id: 'defaultIfEmpty-opaque-fallback', operator: 'defaultIfEmpty',
      purpose: 'Pass every value unchanged; on successful empty completion emit the specified fallback.',
      cardinality: { signature: 'defaultIfEmpty(R) : T* -> (T | R)+ on successful completion',
        conditions: ['One output per input next; append exactly one fallback iff zero source next events and normal completion.',
          'An error or cancellation never produces a fallback.'] },
      scope: { parameters: 'One explicitly supplied fallback value; may be undefined or an object.',
        callbacks: 'None; fallback and source payload are not inspected or cloned.',
        time: 'No clock/scheduler: fallback is emitted synchronously during source completion.',
        reentrancy: 'Atomic notifications, no downstream cancellation reentry during next delivery.',
        exclusions: ['Throwing observers or finalizers, reentrant source emissions, coercive fallback policy.'] },
      initialization: { control: 'Unsubscribed', event: 'subscribe',
        sourceSubscription: 'Acquire one source per output subscription.' },
      ownership: { state: 'subscription-local', sharing: 'No sharing or replay; independent presence flag per subscriber.',
        reset: 'On a new subscription, hasValue=false; terminal runs cannot restart.',
        resources: [{ id: 'source', kind: 'subscription', owner: 'result subscription' }] },
      dispatch: { policy: 'atomic-non-reentrant',
        actionSemantics: 'Maintain presence separately from payload; only successful completion decides fallback.',
        cancellationCheckpoints: ['Between source notifications; no fallback after cancellation.'] },
      inputs: [
        { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'start one dataflow execution' },
        { type: 'source.next', origin: 'source', category: 'notification', description: 'receive opaque source value' },
        { type: 'source.complete', origin: 'source', category: 'notification', description: 'successful source completion' },
        { type: 'source.error', origin: 'source', category: 'notification', description: 'source error' },
        { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'cancel output' },
      ],
      actionTypes: ['subscribe', 'unsubscribe', 'notify'],
      controls: [
        { id: 'Unsubscribed', description: 'not connected', terminal: false },
        { id: 'Active', description: 'source live; presence flag maintained', terminal: false },
        { id: 'Closed', description: 'terminal or cancelled', terminal: true },
      ],
      sourcePaths: ['src/internal/operators/defaultIfEmpty.ts', 'src/internal/operators/OperatorSubscriber.ts'],
    }),
    initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => s.phase === 'Active' && typeof s.hasValue !== 'boolean' ? ['invalid presence flag'] : [],
    validateReaction: (_s, e, reaction, p) => {
      const errors = actionErrors(reaction.actions);
      if (e.type === 'source.next') {
        const a = reaction.actions.find(x => x.type === 'notify');
        if (a?.type !== 'notify' || a.notification.kind !== 'N' ||
          !Object.is(a.notification.value, e.value)) errors.push('source payload changed');
      }
      if (e.type === 'source.complete' && reaction.actions.some(a =>
        a.type === 'notify' && a.notification.kind === 'N' && !Object.is(a.notification.value, p.fallback)))
        errors.push('unexpected completion payload');
      return errors;
    },
  };
}
export const defaultIfEmptyExample: readonly TimedEvent<DefaultIfEmptyEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 3, event: { type: 'source.complete' } },
];
