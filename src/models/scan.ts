import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';

/** Presence is separate from value: an explicitly supplied undefined seed is still a seed. */
export type ScanSeed<S> = Readonly<{ provided: false }> | Readonly<{ provided: true; value: S }>;
export type ScanParameters<S> = Readonly<{ callbackId: string; seed: ScanSeed<S> }>;
/** This product is the callback request payload, not one RxJS reducer argument. */
export type ScanArguments<T, M> = Readonly<{ accumulator: M; value: T }>;
export type ScanState<T, M> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Empty'; index: 0 }>
  | Readonly<{ phase: 'Active'; index: number; accumulator: M }>
  | Readonly<{ phase: 'Calling'; index: number; callId: number; accumulator: M; input: T }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'callback-error' | 'cancel' }>;
export type ScanEvent<T, R> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; value: R }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>;
export type ScanModel<T, R, M, O = R> = OperatorModel<ScanParameters<M>, ScanState<T, M>, ScanEvent<T, R>, Action<O, ScanArguments<T, M>>>;
type ScanRule<T, R, M, O> = Rule<ScanParameters<M>, ScanState<T, M>, ScanEvent<T, R>, Action<O, ScanArguments<T, M>>>;

const source = { id: 'source', generation: 0 } as const;
const acquire = { type: 'subscribe', resource: source } as const;
const release = { type: 'unsubscribe', resource: source } as const;
const complete = { type: 'notify', target: 'downstream', notification: { kind: 'C' } } as const;
const next = <O>(value: O) => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } } as const);
const error = (value: unknown) => ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: value } } as const);
const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const validIndex = (n: number): boolean => Number.isSafeInteger(n) && n >= 0;
const witness = (...ids: string[]): readonly string[] => ids.map(id => `M02B-SCAN-${id}`);

function metadata(seeded: boolean, callbackId: string): ModelMetadata {
  const mode = seeded ? 'seeded' : 'unseeded';
  return {
    schemaVersion: '1.1', id: `scan-${mode}-${callbackId}`, operator: 'scan', rxjsVersion: '7.8.2',
    purpose: seeded ? 'Remember each reducer result and emit it as values arrive, starting from a supplied but un-emitted seed.' : 'Emit the first value as initial state, then remember and emit each subsequent reducer result.',
    cardinality: {
      signature: seeded ? 'scan : ((A + S)! x T! x Index! -> A!) x S! -> T* -> A*' : 'scan : ((A + T)! x T! x Index! -> A!) -> T* -> (T + A)*',
      conditions: ['Cω-inspired project shorthand for successful value flow; Index is the zero-based source index.',
        'One value per successfully processed source next while active; errors and cancellation can end the execution earlier.',
        'An empty source emits no accumulated value. Completion adds no final value.',
        seeded ? 'S is the seed type, which may differ from the reducer result type A. The seed itself is not emitted.' : 'The first input is forwarded without invoking the reducer. The first reducer call uses index 1.'],
    },
    scope: { parameters: `${mode} scan; a named reducer binding and safe-integer source indices`,
      callbacks: 'The pure model requests a call with { accumulator, value } and index; an external adapter invokes reducer(accumulator, value, index) exactly once and returns a correlated outcome.',
      time: 'No clock or timer. Source and callback-outcome events use supplied timestamps and explicit sequence order.',
      reentrancy: 'Non-reentrant source, reducer and observer; cancellation only between resolved value reactions.',
      exclusions: ['Nested input or cancellation during reducer/observer delivery; throwing finalizers or observers.',
        'Index precision loss, invalid reducer arguments, and universal symbolic equivalence.',
        'Deep cloning or freezing of seed/results, lossless arbitrary-value JSON encoding, and a production interpreter.',
        'Arbitrary mutation of referenced objects is not represented as a separate state event; immutable reducers are the differential-test domain.'] },
    initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: 'Acquire the source; never emit the seed or invoke the reducer at subscription.' },
    ownership: { state: 'subscription-local', sharing: 'Each subscription owns its index and accumulation binding; no sharing or replay is introduced. Seed/result object references are not cloned and may be externally shared.',
      reset: 'A new execution creates fresh bookkeeping but uses the same supplied seed reference. Closed executions have no legal inputs.',
      resources: [{ id: 'source', kind: 'subscription', owner: 'current execution' }, { id: callbackId, kind: 'callback', owner: 'external reducer binding; call generation is the source index' }] },
    dispatch: { policy: 'atomic-non-reentrant', actionSemantics: 'Calling is a logical synchronous phase. Only its matching return/throw may resolve it; actions are data, not executed by the model runner.',
      cancellationCheckpoints: ['Empty or Active between resolved source reactions; release upstream without completion.', 'Calling and observer-delivery cancellation are outside this profile; no FIFO queue is silently introduced.'] },
    inputs: [
      { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'a fresh execution subscribes' },
      { type: 'source.next', origin: 'source', category: 'notification', description: 'the source delivers a value' },
      { type: 'callback.return', origin: 'callback', category: 'callback', description: 'the pending reducer returns a result' },
      { type: 'callback.throw', origin: 'callback', category: 'callback', description: 'the pending reducer throws' },
      { type: 'source.complete', origin: 'source', category: 'notification', description: 'the source completes' },
      { type: 'source.error', origin: 'source', category: 'notification', description: 'the source errors' },
      { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream unsubscribes' },
    ],
    actionTypes: ['subscribe', 'invoke-callback', 'notify', 'unsubscribe'],
    controls: [
      { id: 'Unsubscribed', description: 'not connected', terminal: false },
      ...(!seeded ? [{ id: 'Empty', description: 'connected without an accumulated value', terminal: false }] : []),
      { id: 'Active', description: 'has an accumulation and the next source index', terminal: false },
      { id: 'Calling', description: 'retains prior accumulation, input and pending reducer identity', terminal: false },
      { id: 'Closed', description: 'terminated or cancelled', terminal: true },
    ],
    sources: ['src/internal/operators/scan.ts', 'src/internal/operators/scanInternals.ts', 'src/internal/operators/OperatorSubscriber.ts', 'src/internal/Subscriber.ts'].map(path => ({ url: `https://github.com/ReactiveX/rxjs/blob/${revision}/${path}`, revision, purpose: 'Seed presence, index advancement, reducer outcomes and lifecycle' })),
    evidence: { modelTests: ['tests/m02b-model.test.mjs'], runtimeTests: ['tests/m02b-rxjs.test.mjs'], status: 'source-inspected', record: 'evidence/M02-B.md' },
  };
}

/** Shared mechanics; Result is assignable to both stored memory and downstream output. */
function buildScanModel<T, M, O, R extends M & O>(
  parameters: ScanParameters<M>, firstRule?: ScanRule<T, R, M, O>,
): ScanModel<T, R, M, O> {
  const { callbackId, seed } = parameters;
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(callbackId) || callbackId === 'source') throw new TypeError('callbackId must be a distinct identifier, not source');
  const matches = (s: ScanState<T, M>, e: ScanEvent<T, R>): boolean => s.phase === 'Calling' &&
    (e.type === 'callback.return' || e.type === 'callback.throw') && e.resource.id === callbackId && e.resource.generation === s.callId;
  const rules: ScanRule<T, R, M, O>[] = [{
    description: { id: seed.provided ? 'SCAN-INIT-SEEDED' : 'SCAN-INIT-UNSEEDED', from: 'Unsubscribed', event: 'subscribe', guard: 'fresh execution', to: seed.provided ? 'Active' : 'Empty',
      actions: ['subscribe to the source without emitting a value or invoking the reducer'], nextState: seed.provided ? 'active with the seed reference and index zero' : 'empty with index zero', obligations: witness('01', '02', '03'),
      explanation: seed.provided ? 'On subscription, scan remembers the supplied seed, even when it is undefined, and connects to the source. It does not emit the seed or call the reducer yet.' : 'On subscription, scan connects to the source without an accumulation. No value is emitted and the reducer has not run.' },
    enabled: () => true,
    react: () => ({ state: seed.provided ? { phase: 'Active', accumulator: seed.value, index: 0 } : { phase: 'Empty', index: 0 }, actions: [acquire] }),
  }];
  if (firstRule) rules.push(firstRule);
  rules.push({
    description: { id: 'SCAN-CALL', from: 'Active', event: 'source.next', guard: 'index < Number.MAX_SAFE_INTEGER', to: 'Calling',
      actions: ['request one reducer call with the previous accumulation, incoming value and current source index'], nextState: 'calling with prior accumulation and input retained; next index increased by one', obligations: witness('04', '05', '06'),
      explanation: 'Once an accumulation exists, each source value invokes the reducer once with the previous accumulation, the new value and its source index. The first index is 0 with a seed and 1 without a seed.' },
    enabled: s => s.phase === 'Active' && s.index < Number.MAX_SAFE_INTEGER,
    react: (s, e) => {
      if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid scan call');
      return { state: { phase: 'Calling', accumulator: s.accumulator, input: e.value, callId: s.index, index: s.index + 1 },
        actions: [{ type: 'invoke-callback', resource: { id: callbackId, generation: s.index }, value: { accumulator: s.accumulator, value: e.value }, index: s.index }] };
    },
  }, {
    description: { id: 'SCAN-RETURN', from: 'Calling', event: 'callback.return', guard: 'outcome identifies the pending invocation', to: 'Active',
      actions: ['emit the returned accumulation once'], nextState: 'active with the returned accumulation and the already advanced index', obligations: witness('04', '05', '07', '08'),
      explanation: 'A successful reducer result becomes the new accumulation and is emitted unchanged. An undefined result is still a stored value. Equal successive results are not suppressed, and Observable results are not subscribed to.' },
    enabled: matches,
    react: (s, e) => {
      if (s.phase !== 'Calling' || e.type !== 'callback.return') throw new Error('invalid scan return');
      return { state: { phase: 'Active', accumulator: e.value, index: s.index }, actions: [next(e.value)] };
    },
  }, {
    description: { id: 'SCAN-THROW', from: 'Calling', event: 'callback.throw', guard: 'outcome identifies the pending invocation', to: 'Closed',
      actions: ['forward the thrown error unchanged', 'release the source subscription'], nextState: 'closed because the reducer threw', obligations: witness('09'),
      explanation: 'If the reducer throws, scan forwards the thrown value through the error channel and releases the source subscription. It emits no accumulated value for the failing input and does not complete afterwards.' },
    enabled: matches,
    react: (_s, e) => {
      if (e.type !== 'callback.throw') throw new Error('invalid scan throw');
      return { state: { phase: 'Closed', reason: 'callback-error' }, actions: [error(e.error), release] };
    },
  });
  for (const from of (seed.provided ? ['Active'] : ['Empty', 'Active'])) {
    rules.push({
      description: { id: `SCAN-${from.toUpperCase()}-COMPLETE`, from, event: 'source.complete', guard: 'no pending reducer', to: 'Closed',
        actions: ['complete downstream without another value', 'release the source subscription'], nextState: 'closed because the source completed', obligations: witness('02', '10'),
        explanation: from === 'Empty' ? 'An empty source completes without emitting a value or invoking the reducer.' : 'Source completion completes the result and releases upstream. There is no extra final accumulated value, even when a seed was supplied.' },
      enabled: () => true,
      react: () => ({ state: { phase: 'Closed', reason: 'complete' }, actions: [complete, release] }),
    }, {
      description: { id: `SCAN-${from.toUpperCase()}-ERROR`, from, event: 'source.error', guard: 'no pending reducer', to: 'Closed',
        actions: ['forward the source error unchanged', 'release the source subscription'], nextState: 'closed because the source errored', obligations: witness('11'),
        explanation: `A source error ${from === 'Empty' ? 'before the first value' : 'while an accumulation exists'} is forwarded without invoking the reducer or emitting an extra accumulation. The source is released.` },
      enabled: () => true,
      react: (_s, e) => {
        if (e.type !== 'source.error') throw new Error('invalid scan error');
        return { state: { phase: 'Closed', reason: 'source-error' }, actions: [error(e.error), release] };
      },
    }, {
      description: { id: `SCAN-${from.toUpperCase()}-CANCEL`, from, event: 'cancel', guard: 'between resolved value reactions', to: 'Closed',
        actions: ['release the source subscription without notifying downstream'], nextState: 'closed because downstream cancelled', obligations: witness('12'),
        explanation: `Cancellation ${from === 'Empty' ? 'before the first value' : 'between accumulated values'} releases the source and stops further work. It does not emit an accumulation or completion.` },
      enabled: () => true,
      react: () => ({ state: { phase: 'Closed', reason: 'cancel' }, actions: [release] }),
    });
  }
  return {
    parameters, metadata: metadata(seed.provided, callbackId), rules,
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      if (s.phase === 'Empty') return !seed.provided && s.index === 0 ? [] : ['invalid empty state'];
      if (s.phase === 'Active') return validIndex(s.index) && (seed.provided || s.index > 0) && Object.hasOwn(s, 'accumulator') ? [] : ['invalid accumulation/index'];
      if (s.phase === 'Calling') return validIndex(s.index) && validIndex(s.callId) && s.callId < Number.MAX_SAFE_INTEGER &&
        s.index === s.callId + 1 && (seed.provided || s.callId > 0) && Object.hasOwn(s, 'accumulator') && Object.hasOwn(s, 'input') ? [] : ['invalid pending reducer'];
      return s.phase === 'Closed' && ['complete', 'source-error', 'callback-error', 'cancel'].includes(s.reason) ? [] : ['invalid control state'];
    },
    validateReaction: (before, event, result) => {
      const errors = [...validateActionWord(result.actions)];
      for (const a of result.actions) {
        if (a.type === 'invoke-callback') {
          if (before.phase !== 'Active' || event.type !== 'source.next' || a.resource.id !== callbackId || a.index !== before.index ||
            !Object.is(a.value.accumulator, before.accumulator) || !Object.is(a.value.value, event.value)) errors.push('invalid reducer arguments');
        } else if (a.type === 'notify') {
          if (a.target !== 'downstream') errors.push('unknown subscriber');
        } else if (!['subscribe', 'unsubscribe'].includes(a.type) || a.resource.id !== 'source' || a.resource.generation !== 0) errors.push('unknown lifecycle action');
      }
      const after = result.state;
      if (after.phase === 'Calling') {
        if (before.phase !== 'Active' || event.type !== 'source.next' || after.index !== before.index + 1 || after.callId !== before.index ||
          !Object.is(after.accumulator, before.accumulator) || !Object.is(after.input, event.value)) errors.push('invalid pending accumulation');
        if (result.actions.length !== 1 || result.actions[0]?.type !== 'invoke-callback') errors.push('Calling requires exactly one request');
      } else if (result.actions.some(a => a.type === 'invoke-callback')) errors.push('invocation requires Calling');
      if (event.type === 'callback.return' && before.phase === 'Calling') {
        const a = result.actions[0];
        if (after.phase !== 'Active' || after.index !== before.index || !Object.is(after.accumulator, event.value) || result.actions.length !== 1 ||
          a?.type !== 'notify' || a.notification.kind !== 'N' || !Object.is(a.notification.value, event.value)) errors.push('return must store and emit the same result once');
      }
      if (after.phase === 'Active' && result.actions.some(a => a.type === 'notify' && a.notification.kind !== 'N')) errors.push('active after terminal');
      return errors;
    },
  };
}

/** Seed is required here, so undefined is unambiguously a supplied seed. Seed and result types may differ. */
export function createSeededScanModel<T, R, S = R>(seed: S, callbackId = 'accumulator'): ScanModel<T, R, R | S> {
  return buildScanModel<T, R | S, R, R>({ callbackId, seed: { provided: true, value: seed } });
}

/** No seed: the first source value is both stored and emitted, without a reducer call. */
export function createUnseededScanModel<T, R = T>(callbackId = 'accumulator'): ScanModel<T, R, T | R, T | R> {
  const first: ScanRule<T, R, T | R, T | R> = {
    description: { id: 'SCAN-FIRST', from: 'Empty', event: 'source.next', guard: 'first source value; no seed supplied', to: 'Active',
      actions: ['emit the first source value without invoking the reducer'], nextState: 'active with the first value as accumulation and source index one', obligations: witness('05', '06'),
      explanation: 'Without a seed, the first source value is stored and forwarded unchanged without calling the reducer. The source index still advances, so the next value invokes the reducer with index 1.' },
    enabled: () => true,
    react: (_s, e) => {
      if (e.type !== 'source.next') throw new Error('invalid first value');
      return { state: { phase: 'Active', accumulator: e.value, index: 1 }, actions: [next(e.value)] };
    },
  };
  return buildScanModel<T, T | R, T | R, R>({ callbackId, seed: { provided: false } }, first);
}

/** Explicit predicted inputs for addition; no reducer is executed to generate these examples. */
export const seededScanExample: readonly TimedEvent<ScanEvent<number, number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 10, event: { type: 'source.next', value: 1 } },
  { time: 10, event: { type: 'callback.return', resource: { id: 'accumulator', generation: 0 }, value: 1 } },
  { time: 20, event: { type: 'source.next', value: 2 } },
  { time: 20, event: { type: 'callback.return', resource: { id: 'accumulator', generation: 1 }, value: 3 } },
  { time: 30, event: { type: 'source.complete' } },
];
export const unseededScanExample: readonly TimedEvent<ScanEvent<number, number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 10, event: { type: 'source.next', value: 1 } },
  { time: 20, event: { type: 'source.next', value: 2 } },
  { time: 20, event: { type: 'callback.return', resource: { id: 'accumulator', generation: 1 }, value: 3 } },
  { time: 30, event: { type: 'source.complete' } },
];
