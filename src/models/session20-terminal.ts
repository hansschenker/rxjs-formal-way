import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import {
  acquire, release, sourceRef, emit, finish, failWith, invoke, sameResource,
  sessionMetadata, namedRule, callbackInputs, checkActions,
} from './session20-common.js';
import type { CloseReason, SourceEvent } from './session20-common.js';

export type TakeLastParameters = Readonly<{ count: number }>;
export type TakeLastState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Collecting'; buffer: readonly T[] }>
  | Readonly<{ phase: 'Closed'; reason: CloseReason }>;
export type TakeLastEvent<T> = SourceEvent<T>;
export type TakeLastModel<T> = OperatorModel<TakeLastParameters, TakeLastState<T>, TakeLastEvent<T>, Action<unknown>>;

/** Scope: bounded integer counts -8..8; completion flush is an atomic, non-reentrant action word. */
export function createTakeLastModel<T>(count = 2): TakeLastModel<T> {
  if (!Number.isSafeInteger(count) || count < -8 || count > 8) throw new RangeError('takeLast model count must be an integer in -8..8');
  type S = TakeLastState<T>; type E = TakeLastEvent<T>;
  const rule = namedRule<TakeLastParameters, S, E>;
  const rules: Rule<TakeLastParameters, S, E, Action<unknown>>[] = [];
  const collecting = (s: S): s is Extract<S, { phase: 'Collecting' }> => s.phase === 'Collecting';
  if (count <= 0) {
    rules.push(rule('takeLast', 'START-EMPTY', 'Unsubscribed', 'subscribe', 'Closed', 'configured count is nonpositive',
      ['complete result without acquiring source'], 'Closed complete; no source was subscribed.',
      'A nonpositive count selects EMPTY rather than subscribing and dropping values.', () => true,
      () => ({ state: { phase: 'Closed', reason: 'complete' }, actions: [finish] })));
  } else {
    rules.push(rule('takeLast', 'START', 'Unsubscribed', 'subscribe', 'Collecting', 'first consumer connection and count > 0',
      ['subscribe source'], 'Collecting with an empty FIFO buffer.', 'The buffer belongs to this connection and is created lazily.', () => true,
      () => ({ state: { phase: 'Collecting', buffer: [] }, actions: [acquire(sourceRef)] })));
    for (const full of [false, true]) {
      rules.push(rule('takeLast', full ? 'REPLACE-OLDEST' : 'APPEND', 'Collecting', 'source.next', 'Collecting',
        full ? 'buffer has count values' : 'buffer has fewer than count values',
        [full ? 'drop oldest buffered reference and append the new value; emit nothing' : 'append the new value; emit nothing'],
        full ? 'FIFO contains exactly the newest count references.' : 'FIFO grows by one and retains arrival order.',
        'Only subsequent values establish which values are last; no item is emitted before successful completion.',
        s => collecting(s) && (s.buffer.length === count) === full,
        (s, e) => { if (!collecting(s) || e.type !== 'source.next') throw Error('expected collecting next');
          return { state: { phase: 'Collecting', buffer: [...(full ? s.buffer.slice(1) : s.buffer), e.value] }, actions: [] }; }));
    }
    rules.push(rule('takeLast', 'COMPLETE-FLUSH', 'Collecting', 'source.complete', 'Closed', 'source completes successfully',
      ['emit retained references in FIFO order', 'complete result', 'release source'],
      'Closed complete; the retained buffer is discarded after its output word.',
      'A short source emits all retained values; an empty source only completes. No new clock is introduced.', collecting,
      s => { if (!collecting(s)) throw Error('expected collecting');
        return { state: { phase: 'Closed', reason: 'complete' }, actions: [...s.buffer.map(emit), finish, release(sourceRef)] }; }));
    rules.push(rule('takeLast', 'ERROR', 'Collecting', 'source.error', 'Closed', 'source fails',
      ['forward the exact error', 'release source without flushing'], 'Closed error; buffered values are discarded.',
      'Failure does not certify a successful final suffix.', collecting,
      (_s, e) => { if (e.type !== 'source.error') throw Error('expected error');
        return { state: { phase: 'Closed', reason: 'error' }, actions: [failWith(e.error), release(sourceRef)] }; }));
    rules.push(rule('takeLast', 'CANCEL', 'Collecting', 'cancel', 'Closed', 'consumer closes the connection',
      ['release source without output'], 'Closed cancel; buffered values are discarded.',
      'Cancellation is not source completion and cannot flush a suffix.', collecting,
      () => ({ state: { phase: 'Closed', reason: 'cancel' }, actions: [release(sourceRef)] })));
  }
  return {
    metadata: sessionMetadata({ operator: 'takeLast', id: 'takeLast-' + count,
      purpose: 'Retain a bounded suffix and emit it only after successful source completion.',
      signature: 'takeLast : Cω(Count) → T* → T≤max(0,Count)',
      conditions: ['For positive count, every output occurs at successful source completion.', 'Error and cancellation discard the retained suffix; nonpositive count never subscribes.'],
      parameters: 'Safe integer count in -8..8; positive counts bound retained FIFO memory.', callbacks: 'No user callback.',
      exclusions: ['Counts outside -8..8, fractional counts, Infinity and NaN.', 'Consumer cancellation or reentry during the synchronous completion-flush word.'],
      controls: count <= 0 ? ['Unsubscribed', 'Closed'] : ['Unsubscribed', 'Collecting', 'Closed'],
    }), parameters: { count }, rules, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => collecting(s) && (count <= 0 || !Array.isArray(s.buffer) || s.buffer.length > count)
      ? ['Unreachable or oversized takeLast buffer.'] : [],
    validateReaction: (_s, e, r) => [
      ...checkActions(e, r.state.phase, r.actions),
      ...(e.type === 'source.next' && r.actions.length ? ['Input values must only update the FIFO.'] : []),
      ...((e.type === 'source.error' || e.type === 'cancel') && r.actions.some(a => a.type === 'notify' && a.notification.kind === 'N') ? ['Only successful completion flushes.'] : []),
    ],
  };
}

export type ThrowIfEmptyParameters = Readonly<{ factory: 'default' | 'custom' }>;
export type ThrowIfEmptyState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Listening'; hasValue: boolean }>
  | Readonly<{ phase: 'CreatingError' }>
  | Readonly<{ phase: 'Closed'; reason: CloseReason }>;
export type ThrowIfEmptyEvent<T> = SourceEvent<T>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; value: unknown }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>;
export type ThrowIfEmptyModel<T> = OperatorModel<ThrowIfEmptyParameters, ThrowIfEmptyState, ThrowIfEmptyEvent<T>, Action<unknown>>;
const factoryRef: ResourceRef = { id: 'errorFactory', generation: 0 };

/** The factory is a binding, not executed by this model; even undefined can be the error payload. */
export function createThrowIfEmptyModel<T>(factory: 'default' | 'custom' = 'default'): ThrowIfEmptyModel<T> {
  if (factory !== 'default' && factory !== 'custom') throw new TypeError('invalid factory binding');
  type S = ThrowIfEmptyState; type E = ThrowIfEmptyEvent<T>;
  const rule = namedRule<ThrowIfEmptyParameters, S, E>;
  const listening = (s: S): s is Extract<S, { phase: 'Listening' }> => s.phase === 'Listening';
  const matches = (_s: S, e: E): boolean => (e.type === 'callback.return' || e.type === 'callback.throw') && sameResource(e.resource, factoryRef);
  const rules: Rule<ThrowIfEmptyParameters, S, E, Action<unknown>>[] = [
    rule('throwIfEmpty', 'START', 'Unsubscribed', 'subscribe', 'Listening', 'first consumer connection',
      ['subscribe source'], 'Listening with hasValue=false.', 'Emptiness is assessed separately for each subscription.', () => true,
      () => ({ state: { phase: 'Listening', hasValue: false }, actions: [acquire(sourceRef)] })),
    rule('throwIfEmpty', 'NEXT', 'Listening', 'source.next', 'Listening', 'source subscription is live',
      ['forward exact source value'], 'Listening with hasValue=true, including when the value is undefined.',
      'The presence bit, not the payload, establishes nonemptiness.', listening,
      (_s, e) => { if (e.type !== 'source.next') throw Error('expected next');
        return { state: { phase: 'Listening', hasValue: true }, actions: [emit(e.value)] }; }),
    rule('throwIfEmpty', 'COMPLETE-NONEMPTY', 'Listening', 'source.complete', 'Closed', 'at least one value has arrived',
      ['complete result', 'release source'], 'Closed complete; never invoke the factory.',
      'A nonempty source is mirrored without manufacturing an extra value.', s => listening(s) && s.hasValue,
      () => ({ state: { phase: 'Closed', reason: 'complete' }, actions: [finish, release(sourceRef)] })),
    rule('throwIfEmpty', 'COMPLETE-EMPTY', 'Listening', 'source.complete', 'CreatingError', 'no value has arrived',
      ['invoke the selected error factory once'], 'CreatingError; waiting only for its correlated synchronous outcome.',
      'The factory is called at empty completion, not at construction, source failure, or cancellation.', s => listening(s) && !s.hasValue,
      () => ({ state: { phase: 'CreatingError' }, actions: [invoke('errorFactory', 0, undefined)] })),
    rule('throwIfEmpty', 'FACTORY-RETURN', 'CreatingError', 'callback.return', 'Closed', 'outcome belongs to errorFactory invocation zero',
      ['error with the exact returned value', 'release source'], 'Closed error; no completion notification.',
      'Returned values are error-channel payloads, not next values. The default binding supplies a fresh EmptyError instance.', matches,
      (_s, e) => { if (e.type !== 'callback.return') throw Error('expected factory return');
        return { state: { phase: 'Closed', reason: 'error' }, actions: [failWith(e.value), release(sourceRef)] }; }),
    ...(factory === 'custom' ? [rule('throwIfEmpty', 'FACTORY-THROW', 'CreatingError', 'callback.throw', 'Closed', 'outcome belongs to errorFactory invocation zero',
      ['forward the exact thrown value as error', 'release source'], 'Closed error; no completion notification.',
      'A throwing custom factory is intercepted by the operator subscriber.', matches,
      (_s, e) => { if (e.type !== 'callback.throw') throw Error('expected factory throw');
        return { state: { phase: 'Closed', reason: 'error' }, actions: [failWith(e.error), release(sourceRef)] }; })] : []),
    rule('throwIfEmpty', 'SOURCE-ERROR', 'Listening', 'source.error', 'Closed', 'source fails, regardless of value presence',
      ['forward exact source error', 'release source'], 'Closed error; factory never invoked.',
      'Source failure is not empty successful completion.', listening,
      (_s, e) => { if (e.type !== 'source.error') throw Error('expected source error');
        return { state: { phase: 'Closed', reason: 'error' }, actions: [failWith(e.error), release(sourceRef)] }; }),
    rule('throwIfEmpty', 'CANCEL', 'Listening', 'cancel', 'Closed', 'consumer cancels before source termination',
      ['release source silently'], 'Closed cancel; factory never invoked.', 'A cancelled empty subscription is not an EmptyError.', listening,
      () => ({ state: { phase: 'Closed', reason: 'cancel' }, actions: [release(sourceRef)] })),
  ];
  return {
    metadata: sessionMetadata({ operator: 'throwIfEmpty', id: 'throwIfEmpty-' + factory,
      purpose: 'Mirror source values, but turn successful empty completion into a lazily created error.',
      signature: 'throwIfEmpty : Cω(() → Error) → T* → T*',
      conditions: ['Every source next is forwarded unchanged.', 'Successful completion without next invokes one factory and errors; cancellation invokes none.'],
      parameters: 'Default EmptyError factory binding or a custom synchronous error factory.',
      callbacks: 'One explicit invocation at empty completion. Its return/throw is supplied as a correlated outcome; the canonical model never calls it.',
      exclusions: ['Concrete EmptyError prototype construction is checked natively; the model treats the valid default-factory outcome as an opaque object.', 'An outcome attributed to the default binding is assumed to come from that pinned constructor, not an arbitrary substituted factory.'],
      controls: ['Unsubscribed', 'Listening', 'CreatingError', 'Closed'], inputs: callbackInputs,
      resources: [{ id: 'errorFactory', kind: 'callback', owner: 'empty-completion reaction' }],
      actionTypes: ['subscribe', 'unsubscribe', 'notify', 'invoke-callback'],
      additionalSources: ['src/internal/util/EmptyError.ts'],
    }), parameters: { factory }, rules, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => listening(s) && typeof s.hasValue !== 'boolean' ? ['Invalid presence bit.'] : [],
    validateReaction: (_s, e, r) => [
      ...checkActions(e, r.state.phase, r.actions),
      ...(e.type !== 'source.complete' && r.actions.some(a => a.type === 'invoke-callback') ? ['Factory may only be invoked at empty completion.'] : []),
    ],
  };
}
export const takeLastExample: readonly TimedEvent<TakeLastEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 'A' } },
  { time: 2, event: { type: 'source.next', value: 'B' } },
  { time: 4, event: { type: 'source.next', value: 'C' } },
  { time: 6, event: { type: 'source.complete' } },
];
export const takeLastZeroExample: readonly TimedEvent<TakeLastEvent<string>>[] = [{ time: 0, event: { type: 'subscribe' } }];
export const throwIfEmptyExample: readonly TimedEvent<ThrowIfEmptyEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 4, event: { type: 'source.complete' } },
  { time: 4, event: { type: 'callback.return', resource: factoryRef, value: 'empty-source' } },
];
