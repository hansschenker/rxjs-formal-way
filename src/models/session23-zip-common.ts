import type { Action, OperatorModel, ResourceRef, Rule } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { acquire, emit, failWith, finish, natural, release, sessionMetadata } from './session21-common.js';

export type ZipOperator = 'zip' | 'zipWith';
export type ZipParameters = Readonly<{
  operator: ZipOperator; inputCount: number; bufferLimit: number; projector: 'none';
}>;
export type ZipMemory = Readonly<{
  queues: readonly (readonly unknown[])[];
  live: readonly boolean[];
  received: readonly number[];
  emitted: number;
}>;
export type ZipState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (ZipMemory & Readonly<{ phase: 'Active' }>)
  | Readonly<{ phase: 'Closed'; reason: 'exhausted' | 'error' | 'cancel' }>;
export type ZipEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' }>
  | Readonly<{ type: 'input.next'; index: number; value: T }>
  | Readonly<{ type: 'input.complete'; index: number }>
  | Readonly<{ type: 'input.error'; index: number; error: unknown }>;
export type ZipModel<T> = OperatorModel<ZipParameters, ZipState, ZipEvent<T>, Action<unknown>>;
export const zipInputRef = (index: number): ResourceRef => ({ id: 'input:' + index, generation: 0 });
const close = (reason: Extract<ZipState, { phase: 'Closed' }>['reason']): ZipState => ({ phase: 'Closed', reason });
const detach = (s: ZipMemory): readonly Action<unknown>[] =>
  s.live.flatMap((live, index) => live ? [release(zipInputRef(index))] : []);
const liveInput = (s: ZipState, e: ZipEvent<unknown>): boolean =>
  s.phase === 'Active' && 'index' in e && natural(e.index) && e.index < s.live.length && s.live[e.index] === true;
const readyAfter = (s: ZipMemory, index: number): boolean =>
  s.queues.every((queue, i) => queue.length + (i === index ? 1 : 0) > 0);
const exhaustedAfter = (s: ZipMemory, index: number): boolean =>
  readyAfter(s, index) && s.queues.some((queue, i) => !s.live[i] && queue.length === 1);
const append = (s: ZipMemory, index: number, value: unknown): ZipMemory => ({
  ...s,
  queues: s.queues.map((queue, i) => i === index ? [...queue, value] : queue),
  received: s.received.map((count, i) => count + (i === index ? 1 : 0)),
});

/** Shared pinned FIFO semantics. Export identity and evidence stay specific to each pipeable operator. */
export function createZipFamilyModel<T>(operator: ZipOperator, inputCount = 3, bufferLimit = 8): ZipModel<T> {
  if (operator !== 'zip' && operator !== 'zipWith') throw new RangeError('Unknown zip-family export');
  if (!Number.isSafeInteger(inputCount) || inputCount < 1 || inputCount > 16)
    throw new RangeError('Scoped zip input count must be 1..16, including source');
  if (!Number.isSafeInteger(bufferLimit) || bufferLimit < 1 || bufferLimit > 32)
    throw new RangeError('Scoped zip FIFO bound must be 1..32');
  const parameters: ZipParameters = { operator, inputCount, bufferLimit, projector: 'none' };
  type S = ZipState; type E = ZipEvent<T>;
  const rules: Rule<ZipParameters, S, E, Action<unknown>>[] = [];
  const add = (
    name: string, from: S['phase'], event: E['type'], to: S['phase'], guard: string,
    actions: readonly string[], nextState: string, explanation: string,
    enabled: (s: S, e: E) => boolean,
    react: (s: S, e: E) => Readonly<{ state: S; actions: readonly Action<unknown>[] }>,
  ): void => {
    const id = 'S23-' + operator.toUpperCase() + '-' + name;
    rules.push({ description: { id, from, event, to, guard, actions, nextState, explanation, obligations: [id] }, enabled, react });
  };
  const legalNext = (s: S, e: E): boolean => s.phase === 'Active' && e.type === 'input.next' &&
    liveInput(s, e) && s.queues[e.index]!.length < bufferLimit &&
    s.received[e.index]! < Number.MAX_SAFE_INTEGER && (!readyAfter(s, e.index) || s.emitted < Number.MAX_SAFE_INTEGER);

  add('START', 'Unsubscribed', 'subscribe', 'Active', 'no connection yet',
    ['acquire source input zero, then each auxiliary in argument order'],
    'Every FIFO is empty, every input is live, and received/emitted counts are zero.',
    'Pipeable zip and zipWith acquire the upstream source first. No producer runs during model construction.',
    s => s.phase === 'Unsubscribed',
    () => ({ state: { phase: 'Active', queues: Array.from({ length: inputCount }, () => []),
      live: Array(inputCount).fill(true), received: Array(inputCount).fill(0), emitted: 0 },
      actions: Array.from({ length: inputCount }, (_, i) => acquire(zipInputRef(i))) }));

  add('BUFFER', 'Active', 'input.next', 'Active', 'addressed input live; within FIFO/count scope; another FIFO remains empty',
    ['append the opaque value to its input FIFO; emit nothing'],
    'Only that FIFO and its received count change.',
    'Fast arrivals are retained in order. There is no latest-value replacement, source throttling or implicit backpressure.',
    (s, e) => legalNext(s, e) && s.phase === 'Active' && 'index' in e && !readyAfter(s, e.index),
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'input.next') throw Error('Expected active input next');
      return { state: { phase: 'Active', ...append(s, e.index, e.value) }, actions: [] }; });

  add('EMIT', 'Active', 'input.next', 'Active', 'addressed input live; every FIFO becomes nonempty; no completed FIFO is exhausted',
    ['append input value', 'remove one oldest value from every FIFO', 'emit one fresh tuple in input order'],
    'Received count advances for arriving input; emitted count advances once; unmatched values remain queued.',
    'Any input can trigger a tuple. Exactly one tuple is emitted per admitted arrival because a stable state has an empty FIFO.',
    (s, e) => legalNext(s, e) && s.phase === 'Active' && 'index' in e && readyAfter(s, e.index) && !exhaustedAfter(s, e.index),
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'input.next') throw Error('Expected active input next');
      const next = append(s, e.index, e.value);
      return { state: { phase: 'Active', ...next, queues: next.queues.map(queue => queue.slice(1)), emitted: s.emitted + 1 },
        actions: [emit(next.queues.map(queue => queue[0]))] }; });

  add('EMIT-LAST', 'Active', 'input.next', 'Closed', 'addressed input live; tuple ready; removing it exhausts a previously completed FIFO',
    ['emit one final tuple in input order', 'complete downstream', 'release remaining live inputs in subscription order'],
    'Closed and all queued values released.',
    'A completed input can contribute its queued values, but no tuple is possible after its final queued value is consumed.',
    (s, e) => legalNext(s, e) && s.phase === 'Active' && 'index' in e && exhaustedAfter(s, e.index),
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'input.next') throw Error('Expected active input next');
      const next = append(s, e.index, e.value);
      return { state: close('exhausted'), actions: [emit(next.queues.map(queue => queue[0])), finish, ...detach(s)] }; });

  add('COMPLETE-BUFFERED', 'Active', 'input.complete', 'Active', 'addressed input live and its FIFO is nonempty',
    ['release this completed input connection only'],
    'Input becomes non-live; its FIFO remains available for later tuples.',
    'Completion stops future arrivals, not already buffered contributions. Other inputs may still drain the retained values.',
    (s, e) => liveInput(s, e) && s.phase === 'Active' && 'index' in e && s.queues[e.index]!.length > 0,
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'input.complete') throw Error('Expected active input complete');
      return { state: { ...s, live: s.live.map((live, i) => i === e.index ? false : live) }, actions: [release(zipInputRef(e.index))] }; });

  add('COMPLETE-EMPTY', 'Active', 'input.complete', 'Closed', 'addressed input live and its FIFO is empty',
    ['complete downstream', 'release all remaining live inputs in subscription order'],
    'Closed; unmatched values in other FIFOs are discarded.',
    'Once one completed input has no remaining value, no future complete tuple can be formed.',
    (s, e) => liveInput(s, e) && s.phase === 'Active' && 'index' in e && s.queues[e.index]!.length === 0,
    s => { if (s.phase !== 'Active') throw Error('Expected active state');
      return { state: close('exhausted'), actions: [finish, ...detach(s)] }; });

  add('ERROR', 'Active', 'input.error', 'Closed', 'addressed input live',
    ['error downstream with the same opaque payload', 'release every remaining live input in subscription order'],
    'Closed; queued values are discarded without a final tuple.',
    'Any input error terminates the combined result immediately.',
    liveInput,
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'input.error') throw Error('Expected active input error');
      return { state: close('error'), actions: [failWith(e.error), ...detach(s)] }; });

  add('CANCEL', 'Active', 'cancel', 'Closed', 'result connection remains active',
    ['release remaining live input connections without a notification'],
    'Closed; queued values are released.',
    'Closing the result connection is silent cancellation, not successful completion.',
    s => s.phase === 'Active',
    s => { if (s.phase !== 'Active') throw Error('Expected active state');
      return { state: close('cancel'), actions: detach(s) }; });

  const basis = sessionMetadata({
    operator, id: operator + '-' + inputCount + '-fifo-' + bufferLimit,
    purpose: 'Pair values by arrival index using one FIFO per input; retain completed input queues until exhausted.',
    signature: operator + ' : (U₁*, …, Uₙ*) → T* → (T × U₁ × … × Uₙ)*',
    conditions: ['Input zero is the upstream source; remaining inputs are supplied as rest Observable arguments.',
      'Output tuple k contains value k from each input; every admitted value contributes to at most one tuple.',
      'The result completes when a completed input has no remaining queued value, including immediately after the last tuple.',
      'With zero auxiliaries, each upstream value becomes a singleton tuple; no identity shortcut is assumed.'],
    parameters: 'One to sixteen total Observable inputs including source, tuple output, FIFO analysis bound 1..32 per input. The bound limits modeled histories; RxJS itself does not enforce it.',
    callbacks: 'No user projector in the canonical profile. Payloads remain opaque and retain identity inside fresh output tuples.',
    time: 'Source and auxiliary notifications supply time; the operator introduces no clock or scheduler. Equal-time arrivals retain explicit event order.',
    initialization: 'At first connection, source input zero then auxiliary inputs connect in argument order. Acquisition is non-notifying in this canonical profile.',
    exclusions: ['Synchronous acquisition-time notifications, arbitrary ObservableInput conversions and unbounded FIFO histories.',
      'Optional legacy zip projector and array-argument overload behavior; these are separately characterized natively.',
      'Unsafe count overflow and more than sixteen inputs.'],
    controls: ['Unsubscribed', 'Active', 'Closed'], testStem: 'session23-' + operator, differential: true,
    additionalSources: ['src/internal/observable/zip.ts', 'spec/observables/zip-spec.ts', ...(operator === 'zipWith' ? ['src/internal/operators/zip.ts'] : [])],
  });
  return {
    metadata: { ...basis,
      ownership: { ...basis.ownership, resources: [{ id: 'input:*', kind: 'subscription', owner: 'result execution; source index zero then auxiliary indexes' }] },
      inputs: [
        { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'First connection to the result.' },
        { type: 'input.next', origin: 'inner', category: 'notification', description: 'Opaque value from an indexed live input; input zero is upstream source.' },
        { type: 'input.complete', origin: 'inner', category: 'notification', description: 'Indexed input completes; its queued values may remain usable.' },
        { type: 'input.error', origin: 'inner', category: 'notification', description: 'Indexed input fails with an opaque error.' },
        { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'Close the result connection silently.' },
      ],
      evidence: { ...basis.evidence, record: 'evidence/SESSION-23.md', scenarios: 'docs/SESSION-23-' + (operator === 'zip' ? 'ZIP' : 'ZIP-WITH') + '.md', coverage: 'docs/SESSION-23-SCENARIOS.md' },
    },
    parameters, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase, rules,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      if (s.phase === 'Closed') return ['exhausted', 'error', 'cancel'].includes(s.reason) ? [] : ['Invalid close reason.'];
      if (s.phase !== 'Active') return ['Unknown control state.'];
      if (!Array.isArray(s.queues) || !Array.isArray(s.live) || !Array.isArray(s.received) ||
        s.queues.length !== inputCount || s.live.length !== inputCount || s.received.length !== inputCount)
        return ['FIFO, liveness and received arrays must match the configured total input count.'];
      const issues: string[] = [];
      if (!s.queues.every(Array.isArray)) return ['Every FIFO must be an array.'];
      if (!s.live.every(value => typeof value === 'boolean')) issues.push('Input liveness must be Boolean.');
      if (!natural(s.emitted) || !s.received.every(natural)) issues.push('Received/emitted counters must be nonnegative safe integers.');
      if (s.queues.some(queue => queue.length > bufferLimit)) issues.push('FIFO exceeds declared analysis bound.');
      if (!s.queues.some(queue => queue.length === 0)) issues.push('Stable active state must have at least one empty FIFO.');
      if (s.queues.some((queue, i) => !s.live[i] && queue.length === 0)) issues.push('Completed empty FIFO requires result termination.');
      if (s.queues.some((queue, i) => s.received[i]! - s.emitted !== queue.length)) issues.push('Each FIFO length equals received count minus emitted tuple count.');
      return issues;
    },
    validateReaction: (_before, event, reaction) => [
      ...validateActionWord(reaction.actions),
      ...(event.type === 'cancel' && reaction.actions.some(a => a.type === 'notify') ? ['Cancellation cannot notify.'] : []),
      ...(reaction.actions.filter(a => a.type === 'notify' && a.notification.kind === 'N').length > 1 ? ['One atomic input arrival emits at most one tuple.'] : []),
      ...(event.type !== 'subscribe' && reaction.actions.some(a => a.type === 'subscribe') ? ['Input connections are acquired only at initialization.'] : []),
    ],
  };
}
