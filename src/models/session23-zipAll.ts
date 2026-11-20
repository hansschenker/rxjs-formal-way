import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { acquire, emit, failWith, finish, natural, release, sessionMetadata } from './session21-common.js';

/** Bounds restrict admitted model histories; native RxJS does not impose these capacities. */
export type ZipAllParameters = Readonly<{ maxInners: number; bufferLimit: number; projector: 'none' }>;
export type ZipAllSlot<T> = Readonly<{
  source: unknown;
  queue: readonly T[];
  live: boolean;
  received: number;
}>;
export type ZipAllState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Collecting'; sources: readonly unknown[] }>
  | Readonly<{ phase: 'Joining'; slots: readonly ZipAllSlot<T>[]; emitted: number }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'outer-error' | 'inner-error' | 'cancel' }>;
export type ZipAllEvent<T> =
  | Readonly<{ type: 'subscribe' | 'outer.complete' | 'cancel' }>
  | Readonly<{ type: 'outer.next'; value: unknown }>
  | Readonly<{ type: 'outer.error'; error: unknown }>
  | Readonly<{ type: 'inner.next'; index: number; value: T }>
  | Readonly<{ type: 'inner.complete'; index: number }>
  | Readonly<{ type: 'inner.error'; index: number; error: unknown }>;
export type ZipAllModel<T> = OperatorModel<ZipAllParameters, ZipAllState<T>, ZipAllEvent<T>, Action<unknown>>;

const outerRef: ResourceRef = { id: 'outer', generation: 0 };
const innerRef = (index: number): ResourceRef => ({ id: 'inner', generation: index });
const close = <T>(reason: Extract<ZipAllState<T>, { phase: 'Closed' }>['reason']): ZipAllState<T> =>
  ({ phase: 'Closed', reason });
const liveResources = <T>(s: ZipAllState<T>): readonly ResourceRef[] =>
  s.phase === 'Collecting' ? [outerRef] : s.phase === 'Joining'
    ? s.slots.flatMap((slot, i) => slot.live ? [innerRef(i)] : []) : [];
const releaseLive = <T>(s: ZipAllState<T>): readonly Action<unknown>[] => liveResources(s).map(release);
const matching = <T>(s: ZipAllState<T>, e: ZipAllEvent<T>): boolean =>
  s.phase === 'Joining' && 'index' in e && natural(e.index) && s.slots[e.index]?.live === true;
const readyAfter = <T>(s: Extract<ZipAllState<T>, { phase: 'Joining' }>, index: number): boolean =>
  s.slots.every((slot, i) => i === index || slot.queue.length > 0);
const exhaustsAfter = <T>(s: Extract<ZipAllState<T>, { phase: 'Joining' }>): boolean =>
  s.slots.some(slot => !slot.live && slot.queue.length === 1);

/** Collect descriptions first; after outer completion, pair each inner's kth value by FIFO order. */
export function createZipAllModel<T>(maxInners = 8, bufferLimit = 8): ZipAllModel<T> {
  if (!natural(maxInners) || maxInners > 16) throw new RangeError('zipAll model maxInners must be an integer in 0..16');
  if (!natural(bufferLimit) || bufferLimit < 1 || bufferLimit > 16)
    throw new RangeError('zipAll model bufferLimit must be an integer in 1..16');
  type S = ZipAllState<T>; type E = ZipAllEvent<T>;
  const parameters: ZipAllParameters = { maxInners, bufferLimit, projector: 'none' };
  const rules: Rule<ZipAllParameters, S, E, Action<unknown>>[] = [];
  const add = (
    name: string, from: S['phase'], event: E['type'], to: S['phase'], guard: string,
    actions: readonly string[], nextState: string, explanation: string,
    enabled: (s: S, e: E) => boolean,
    react: (s: S, e: E) => Readonly<{ state: S; actions: readonly Action<unknown>[] }>,
  ): void => {
    const id = 'S23-ZIPALL-' + name;
    rules.push({ description: { id, from, event, to, guard, actions, nextState, explanation, obligations: [id] }, enabled, react });
  };
  const canNext = (s: S, e: E): boolean => matching(s, e) && s.phase === 'Joining' && e.type === 'inner.next' &&
    s.slots[e.index]!.received < Number.MAX_SAFE_INTEGER && s.slots[e.index]!.queue.length < bufferLimit &&
    (!readyAfter(s, e.index) || s.emitted < Number.MAX_SAFE_INTEGER);
  const acceptValue = (s: Extract<S, { phase: 'Joining' }>, e: Extract<E, { type: 'inner.next' }>): readonly ZipAllSlot<T>[] =>
    s.slots.map((slot, i) => i === e.index ? { ...slot, queue: [...slot.queue, e.value], received: slot.received + 1 } : slot);

  add('START', 'Unsubscribed', 'subscribe', 'Collecting', 'fresh execution', ['acquire outer only'],
    'Empty ordered source collection.', 'Descriptions do nothing until a result connection exists.',
    () => true, () => ({ state: { phase: 'Collecting', sources: [] }, actions: [acquire(outerRef)] }));
  add('COLLECT', 'Collecting', 'outer.next', 'Collecting', 'collected count is below maxInners',
    ['retain the opaque inner description; do not connect it'], 'Append one source occurrence in outer arrival order.',
    'Repeated occurrences of the same producer remain distinct future subscriptions.',
    s => s.phase === 'Collecting' && s.sources.length < maxInners,
    (s, e) => {
      if (s.phase !== 'Collecting' || e.type !== 'outer.next') throw Error('expected collected source');
      return { state: { ...s, sources: [...s.sources, e.value] }, actions: [] };
    });
  add('OUTER-EMPTY', 'Collecting', 'outer.complete', 'Closed', 'no collected source occurrences',
    ['complete downstream without an empty tuple', 'release outer'], 'Closed complete; discard collection.',
    'Joining zero streams is EMPTY. No inner connection occurs.',
    s => s.phase === 'Collecting' && s.sources.length === 0,
    () => ({ state: close('complete'), actions: [finish, release(outerRef)] }));
  add('OUTER-JOIN', 'Collecting', 'outer.complete', 'Joining', 'at least one collected source occurrence',
    ['acquire all inners in collection order', 'release outer after inner acquisition'],
    'One empty FIFO and live connection for each occurrence; emitted count zero.',
    'toArray forwards its collected list during completion. The deferred inner connections are established before the outer producer teardown runs.',
    s => s.phase === 'Collecting' && s.sources.length > 0,
    s => {
      if (s.phase !== 'Collecting') throw Error('expected collecting state');
      return { state: { phase: 'Joining', emitted: 0, slots: s.sources.map(source => ({ source, queue: [], live: true, received: 0 })) },
        actions: [...s.sources.map((_, i) => acquire(innerRef(i))), release(outerRef)] };
    });
  add('OUTER-ERROR', 'Collecting', 'outer.error', 'Closed', 'outer is live',
    ['error downstream with the same payload', 'release outer without connecting inners'], 'Closed outer-error; discard descriptions.',
    'An outer error does not convert the accumulated descriptions into a join.',
    () => true, (_s, e) => {
      if (e.type !== 'outer.error') throw Error('expected outer error');
      return { state: close('outer-error'), actions: [failWith(e.error), release(outerRef)] };
    });
  add('CANCEL-COLLECT', 'Collecting', 'cancel', 'Closed', 'outer connection is active',
    ['release outer silently'], 'Closed cancel; discard descriptions.', 'Cancellation is not completion and never activates the collected inners.',
    () => true, s => ({ state: close('cancel'), actions: releaseLive(s) }));
  add('INNER-BUFFER', 'Joining', 'inner.next', 'Joining', 'live addressed inner, room in bounded scope, another FIFO empty',
    ['append value to addressed FIFO; emit nothing'], 'Increase that occurrence\'s received count; retain all other queues.',
    'An unmatched value waits. It is neither overwritten by a newer value nor used as backpressure.',
    (s, e) => canNext(s, e) && s.phase === 'Joining' && e.type === 'inner.next' && !readyAfter(s, e.index),
    (s, e) => {
      if (s.phase !== 'Joining' || e.type !== 'inner.next') throw Error('expected inner value');
      return { state: { ...s, slots: acceptValue(s, e) }, actions: [] };
    });
  add('INNER-EMIT', 'Joining', 'inner.next', 'Joining', 'live addressed inner, all FIFOs ready after append, no completed FIFO exhausted',
    ['append value', 'remove the oldest value from every FIFO', 'emit one fresh tuple in collection order'],
    'Increment emitted count and retain each unconsumed FIFO suffix.',
    'The arrival supplying the final missing member triggers the tuple; at most one tuple is produced by this atomic arrival.',
    (s, e) => canNext(s, e) && s.phase === 'Joining' && e.type === 'inner.next' && readyAfter(s, e.index) && !exhaustsAfter(s),
    (s, e) => {
      if (s.phase !== 'Joining' || e.type !== 'inner.next') throw Error('expected inner value');
      const slots = acceptValue(s, e);
      return { state: { ...s, emitted: s.emitted + 1, slots: slots.map(slot => ({ ...slot, queue: slot.queue.slice(1) })) },
        actions: [emit(slots.map(slot => slot.queue[0]))] };
    });
  add('INNER-DRAIN', 'Joining', 'inner.next', 'Closed', 'all FIFOs ready after append; a completed FIFO has its final value',
    ['emit the last pairable tuple', 'release still-live inners in collection order', 'complete downstream after releases'],
    'Closed complete; no unmatched suffix retained.',
    'The joinAll mergeMap waits for zip finalization before delivering successful completion; producer releases precede downstream complete.',
    (s, e) => canNext(s, e) && s.phase === 'Joining' && e.type === 'inner.next' && readyAfter(s, e.index) && exhaustsAfter(s),
    (s, e) => {
      if (s.phase !== 'Joining' || e.type !== 'inner.next') throw Error('expected draining value');
      const slots = acceptValue(s, e);
      return { state: close('complete'), actions: [emit(slots.map(slot => slot.queue[0])), ...releaseLive(s), finish] };
    });
  add('INNER-COMPLETE-BUFFERED', 'Joining', 'inner.complete', 'Joining', 'live addressed inner has queued values',
    ['release only the completed inner producer'], 'Mark slot no longer live, retaining its FIFO suffix.',
    'Completion does not discard values already available for future tuples.',
    (s, e) => matching(s, e) && s.phase === 'Joining' && e.type === 'inner.complete' && s.slots[e.index]!.queue.length > 0,
    (s, e) => {
      if (s.phase !== 'Joining' || e.type !== 'inner.complete') throw Error('expected buffered completion');
      return { state: { ...s, slots: s.slots.map((slot, i) => i === e.index ? { ...slot, live: false } : slot) }, actions: [release(innerRef(e.index))] };
    });
  add('INNER-COMPLETE-EMPTY', 'Joining', 'inner.complete', 'Closed', 'live addressed inner has no queued values',
    ['release all still-live inners in collection order', 'complete downstream after releases'], 'Closed complete; discard unmatched suffixes.',
    'No further tuple is possible when a completed input has no value remaining, even if other inners never complete.',
    (s, e) => matching(s, e) && s.phase === 'Joining' && e.type === 'inner.complete' && s.slots[e.index]!.queue.length === 0,
    s => ({ state: close('complete'), actions: [...releaseLive(s), finish] }));
  add('INNER-ERROR', 'Joining', 'inner.error', 'Closed', 'addressed inner is still live',
    ['error downstream with original payload', 'release all live inner producers in collection order'], 'Closed inner-error; discard all FIFO values.',
    'Error is forwarded before teardown; it does not use the successful-completion finalization path.',
    (s, e) => matching(s, e), (s, e) => {
      if (e.type !== 'inner.error') throw Error('expected inner error');
      return { state: close('inner-error'), actions: [failWith(e.error), ...releaseLive(s)] };
    });
  add('CANCEL-JOIN', 'Joining', 'cancel', 'Closed', 'join owns live inputs',
    ['release live inners in collection order without notification'], 'Closed cancel; discard queues.',
    'Cancellation does not flush a partial tuple or notify completion.',
    () => true, s => ({ state: close('cancel'), actions: releaseLive(s) }));

  const basis = sessionMetadata({
    operator: 'zipAll', id: 'zipAll-deferred-fifo-' + maxInners + '-' + bufferLimit,
    purpose: 'Collect inner descriptions until outer completion, then pair each inner\'s kth value with FIFO memory.',
    signature: 'zipAll : (T*)* → [T]*',
    conditions: ['Outer next retains one description; no inner is connected before outer completes.',
      'After collection of n > 0 inputs, each tuple contains one oldest queued value from every occurrence in outer order.',
      'A completed input remains usable until its FIFO is empty; then the result completes without waiting for the other inputs.',
      'Empty outer completes without a tuple. An outer that never completes never activates its collected inner descriptions.'],
    parameters: 'Tuple-output profile; 0..' + maxInners + ' valid Observable occurrences; at most ' + bufferLimit + ' unmatched queued values per input. Constructor bounds maxInners 0..16 and bufferLimit 1..16 are model scope, not RxJS capacities.',
    callbacks: 'No projector in the canonical profile. Values and source tokens are opaque references; no user function runs in guards or transitions.',
    time: 'No clock, scheduler or timer is introduced. Outer/inner sources supply notification times; equal-time inputs retain explicit arrival order.',
    initialization: 'Construction is inert. First connection acquires outer only; outer completion acquires collected inners in order before releasing outer.',
    sharing: 'No implicit sharing or replay. Each result connection owns collection and FIFO state; repeated descriptions create separate input subscriptions even when they refer to one shared producer.',
    reentrancy: 'Post-setup non-reentrant notifications. Outer and inner subscription setup return without notifying or advancing time; cancellation occurs between reactions.',
    exclusions: ['Optional projector return/throw and synchronous outer or inner setup are separately native-characterized, outside this canonical alphabet.',
      'Non-Observable inputs and arbitrary ObservableInput conversions.',
      'Histories exceeding source/FIFO bounds, unsafe counters, arbitrary reentrancy, producer-token mutation and cancellation during a notification.'],
    controls: ['Unsubscribed', 'Collecting', 'Joining', 'Closed'], testStem: 'session23-zipAll', differential: true,
    additionalSources: ['src/internal/operators/joinAllInternals.ts', 'src/internal/observable/zip.ts', 'src/internal/operators/toArray.ts', 'src/internal/operators/mergeInternals.ts'],
  });
  return {
    metadata: { ...basis,
      ownership: { ...basis.ownership, resources: [{ id: 'outer', kind: 'subscription', owner: 'collection phase' },
        { id: 'inner', kind: 'subscription', owner: 'joined occurrence indexed by generation in outer collection order' }] },
      inputs: [
        { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'Connect one fresh result execution.' },
        { type: 'outer.next', origin: 'outer', category: 'notification', description: 'Retain one opaque valid Observable description occurrence.' },
        { type: 'outer.complete', origin: 'outer', category: 'notification', description: 'Activate collected inputs, or complete if none exist.' },
        { type: 'outer.error', origin: 'outer', category: 'notification', description: 'Fail without activating collected inputs.' },
        { type: 'inner.next', origin: 'inner', category: 'notification', description: 'Append one value to an addressed live input FIFO.' },
        { type: 'inner.complete', origin: 'inner', category: 'notification', description: 'Release one input and retain its queue until exhausted.' },
        { type: 'inner.error', origin: 'inner', category: 'notification', description: 'Fail the entire join with this exact error.' },
        { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'Close owned connections without notification.' },
      ],
      evidence: { ...basis.evidence, record: 'evidence/SESSION-23.md', scenarios: 'docs/SESSION-23-ZIP-ALL.md', coverage: 'docs/SESSION-23-ZIP-ALL.md' },
    }, parameters, rules, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      const issues: string[] = [];
      if (s.phase === 'Collecting') {
        if (!Array.isArray(s.sources) || s.sources.length > maxInners) issues.push('Collected count exceeds declared scope.');
      } else if (s.phase === 'Joining') {
        if (!Array.isArray(s.slots) || !s.slots.length || s.slots.length > maxInners) return ['Invalid joined occurrence count.'];
        if (!natural(s.emitted)) issues.push('Emitted count must be a nonnegative safe integer.');
        for (const slot of s.slots) {
          if (!Array.isArray(slot.queue) || slot.queue.length > bufferLimit) issues.push('Invalid FIFO or model capacity exceeded.');
          else {
            if (!natural(slot.received) || slot.received < s.emitted || slot.queue.length !== slot.received - s.emitted)
              issues.push('FIFO length must equal received minus emitted count.');
            if (!slot.live && slot.queue.length === 0) issues.push('A completed empty FIFO must terminate the join.');
          }
          if (typeof slot.live !== 'boolean') issues.push('Liveness must be Boolean.');
        }
        if (s.slots.every(slot => Array.isArray(slot.queue) && slot.queue.length > 0)) issues.push('A stable join cannot leave a complete tuple queued.');
      } else if (s.phase === 'Closed') {
        if (!['complete', 'outer-error', 'inner-error', 'cancel'].includes(s.reason)) issues.push('Invalid close reason.');
      } else if (s.phase !== 'Unsubscribed') issues.push('Invalid control state.');
      return issues;
    },
    validateReaction: (before, event, result) => {
      const issues = [...validateActionWord(result.actions)];
      const key = (r: ResourceRef): string => r.id + ':' + r.generation;
      const live = new Set(liveResources(before).map(key));
      for (const action of result.actions) {
        if (action.type === 'subscribe') {
          if (live.has(key(action.resource))) issues.push('Duplicate owned connection acquisition.');
          live.add(key(action.resource));
        } else if (action.type === 'unsubscribe') {
          if (!live.delete(key(action.resource))) issues.push('Released resource was not owned.');
        } else if (action.type !== 'notify') issues.push('zipAll introduces no timer or callback action.');
        else if (action.target !== 'downstream') issues.push('Unexpected notification target.');
      }
      const after = new Set(liveResources(result.state).map(key));
      if (live.size !== after.size || [...live].some(k => !after.has(k))) issues.push('Action ownership does not match next state.');
      const notes = result.actions.filter(a => a.type === 'notify');
      if (event.type === 'cancel' && notes.length) issues.push('Cancellation cannot notify.');
      if (event.type === 'outer.next' && result.actions.length) issues.push('Collecting a description cannot activate it.');
      if (notes.filter(a => a.notification.kind === 'N').length > 1) issues.push('One atomic value can form at most one tuple.');
      if (before.phase === 'Joining' && result.state.phase === 'Closed' && result.state.reason === 'complete' &&
          result.actions.at(-1)?.type !== 'notify') issues.push('Successful joined completion follows inner releases.');
      return issues;
    },
  };
}

export const zipAllExample: readonly TimedEvent<ZipAllEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'outer.next', value: 'letters' } },
  { time: 2, event: { type: 'outer.next', value: 'digits' } },
  { time: 3, event: { type: 'outer.complete' } },
  { time: 4, event: { type: 'inner.next', index: 0, value: 'A' } },
  { time: 5, event: { type: 'inner.next', index: 0, value: 'B' } },
  { time: 6, event: { type: 'inner.complete', index: 0 } },
  { time: 7, event: { type: 'inner.next', index: 1, value: '1' } },
  { time: 8, event: { type: 'inner.next', index: 1, value: '2' } },
];
export const zipAllEmptyExample: readonly TimedEvent<ZipAllEvent<unknown>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 3, event: { type: 'outer.complete' } },
];
export const zipAllCancelExample: readonly TimedEvent<ZipAllEvent<unknown>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'outer.next', value: 'left' } },
  { time: 2, event: { type: 'outer.next', value: 'right' } },
  { time: 3, event: { type: 'outer.complete' } },
  { time: 4, event: { type: 'inner.next', index: 0, value: 'unmatched' } },
  { time: 5, event: { type: 'cancel' } },
];
