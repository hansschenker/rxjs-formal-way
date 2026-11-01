import type { Action, OperatorModel, Rule, TimedEvent } from '../schema.js';
import {
  checkedActions, notifyComplete, notifyError, notifyNext,
  session4Metadata, subscribeSource, unsubscribeSource,
} from './session4-common.js';

export type PairwiseParameters = Readonly<{ pairsStartAtSecondValue: true }>;
export type PairwiseState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; hasPrevious: boolean; previous?: T | undefined }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'error' | 'cancel' }>;
export type PairwiseEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;
export type PairwiseModel<T> = OperatorModel<PairwiseParameters, PairwiseState<T>, PairwiseEvent<T>, Action<[T, T]>>;

const active = <T>(hasPrevious: boolean, previous?: T): PairwiseState<T> => ({
  phase: 'Active', hasPrevious, ...(hasPrevious ? { previous } : {}),
});
const closed = <T>(reason: 'complete' | 'error' | 'cancel'): PairwiseState<T> => ({ phase: 'Closed', reason });

export function createPairwiseModel<T>(): PairwiseModel<T> {
  const rules: readonly Rule<PairwiseParameters, PairwiseState<T>, PairwiseEvent<T>, Action<[T, T]>>[] = [
    {
      description: { id: 'PAIRWISE-INIT', from: 'Unsubscribed', event: 'subscribe', guard: 'new execution',
        to: 'Active', actions: ['subscribe source; no previous value yet'], nextState: 'active with no previous item',
        obligations: ['S4-PAIRWISE-INIT'], explanation: 'Pairwise subscribes lazily and starts with no previous value. It does not emit an initial pair.' },
      enabled: () => true,
      react: () => ({ state: active<T>(false), actions: [subscribeSource] }),
    },
    {
      description: { id: 'PAIRWISE-FIRST', from: 'Active', event: 'source.next', guard: 'no previous source value',
        to: 'Active', actions: ['remember the first source value without emitting'],
        nextState: 'active remembering the first value', obligations: ['S4-PAIRWISE-FIRST'],
        explanation: 'The first source value is remembered, not emitted; it becomes the left member of the first pair.' },
      enabled: s => s.phase === 'Active' && !s.hasPrevious,
      react: (_s, e) => {
        if (e.type !== 'source.next') throw new Error('invalid first input');
        return { state: active<T>(true, e.value), actions: [] };
      },
    },
    {
      description: { id: 'PAIRWISE-NEXT', from: 'Active', event: 'source.next', guard: 'previous value remembered',
        to: 'Active', actions: ['store current value before emitting [previous, current]'],
        nextState: 'active remembering the current value', obligations: ['S4-PAIRWISE-NEXT'],
        explanation: 'Every subsequent value emits a fresh two-element array [previous, current], preserving the original value references; current becomes the next previous value before output.' },
      enabled: s => s.phase === 'Active' && s.hasPrevious,
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid pair input');
        return { state: active<T>(true, e.value), actions: [notifyNext<[T, T]>([s.previous as T, e.value])] };
      },
    },
    {
      description: { id: 'PAIRWISE-COMPLETE', from: 'Active', event: 'source.complete', guard: 'source finishes with any number of values',
        to: 'Closed', actions: ['forward completion without flushing an incomplete pair', 'release source'],
        nextState: 'closed after completion', obligations: ['S4-PAIRWISE-LIFECYCLE'],
        explanation: 'An empty or singleton source produces no pair. Source completion forwards completion without inventing a final pair.' },
      enabled: () => true,
      react: () => ({ state: closed<T>('complete'), actions: [notifyComplete, unsubscribeSource] }),
    },
    {
      description: { id: 'PAIRWISE-ERROR', from: 'Active', event: 'source.error', guard: 'source errors',
        to: 'Closed', actions: ['forward the original error', 'release source'], nextState: 'closed after error',
        obligations: ['S4-PAIRWISE-LIFECYCLE'], explanation: 'An error forwards immediately; the stored previous value is not emitted or flushed.' },
      enabled: () => true,
      react: (_s, e) => {
        if (e.type !== 'source.error') throw new Error('invalid pair error');
        return { state: closed<T>('error'), actions: [notifyError(e.error), unsubscribeSource] };
      },
    },
    {
      description: { id: 'PAIRWISE-CANCEL', from: 'Active', event: 'cancel', guard: 'downstream unsubscribes',
        to: 'Closed', actions: ['release source without completion'], nextState: 'closed by cancellation',
        obligations: ['S4-PAIRWISE-LIFECYCLE'], explanation: 'Cancellation drops the retained previous value and releases the source without sending completion.' },
      enabled: () => true,
      react: () => ({ state: closed<T>('cancel'), actions: [unsubscribeSource] }),
    },
  ];
  return {
    parameters: { pairsStartAtSecondValue: true }, rules,
    metadata: session4Metadata({
      id: 'pairwise-reference', operator: 'pairwise', purpose: 'Emit overlapping adjacent pairs of ORIGINAL source values, starting at the second next notification.',
      cardinality: { signature: 'pairwise : T* -> (T x T)*',
        conditions: ['For n successfully delivered source values, exactly max(n-1,0) pairs are emitted before an error or cancellation.', 'Pair arrays are freshly allocated; their two item references retain identity.'] },
      scope: { parameters: 'No user parameters.', callbacks: 'No user function or projection is invoked.',
        time: 'No timer or scheduling; the pair appears in the same logical source-delivery time point as its right member.',
        reentrancy: 'Atomic non-reentrant delivery. Model updates previous before emitting.',
        exclusions: ['Nested observer delivery, throwing subscriber/finalizer, physical source abort guarantees.'] },
      initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: 'Connect to one source; do not synthesize a first pair.' },
      ownership: { state: 'subscription-local', sharing: 'Does not create sharing. Each subscriber owns an independent previous-value slot.',
        reset: 'Each subscription starts with no previous value; no reset while active.',
        resources: [{ id: 'source', kind: 'subscription', owner: 'current result subscription' }] },
      dispatch: { policy: 'atomic-non-reentrant', actionSemantics: 'Remember current source value before producing a pair; ordered notification and lifecycle actions are descriptive.',
        cancellationCheckpoints: ['Between complete next reactions. Cancel without emitting an incomplete pair.'] },
      inputs: [
        { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'new downstream subscription' },
        { type: 'source.next', origin: 'source', category: 'notification', description: 'source emits another item' },
        { type: 'source.complete', origin: 'source', category: 'notification', description: 'source completes' },
        { type: 'source.error', origin: 'source', category: 'notification', description: 'source errors' },
        { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream unsubscribes' },
      ],
      actionTypes: ['subscribe', 'unsubscribe', 'notify'],
      controls: [
        { id: 'Unsubscribed', description: 'not yet connected', terminal: false },
        { id: 'Active', description: 'source live; previous value absent or present', terminal: false },
        { id: 'Closed', description: 'terminated or cancelled', terminal: true },
      ],
      sourcePaths: ['src/internal/operators/pairwise.ts', 'src/internal/operators/OperatorSubscriber.ts'],
    }),
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      if (s.phase === 'Closed') return ['complete','error','cancel'].includes(s.reason) ? [] : ['invalid closed reason'];
      if (s.phase !== 'Active' || typeof s.hasPrevious !== 'boolean') return ['invalid active state'];
      if (s.hasPrevious !== Object.hasOwn(s, 'previous')) return ['previous memory presence differs from hasPrevious'];
      return [];
    },
    validateReaction: (_s, e, result) => {
      const errors = checkedActions(result.actions, ['source']);
      if (e.type === 'source.next' && result.actions.filter(a=>a.type==='notify').length > 1) errors.push('pairwise emits at most once per value');
      return errors;
    },
  };
}
export const pairwiseExample: readonly TimedEvent<PairwiseEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 'a' } },
  { time: 2, event: { type: 'source.next', value: 'b' } },
  { time: 3, event: { type: 'source.next', value: 'c' } },
  { time: 4, event: { type: 'source.complete' } },
];
