import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, RuleDescription, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { createSwitchMapModel } from './flatten.js';
import type { FlattenParameters, FlattenState, FlattenEvent, FlattenModel } from './flatten.js';
import { pinnedRevision, natural } from './session10-common.js';

/** Session 19: source-inspected, non-reentrant RxJS 7.8.2 operator policies.
 * Output actions are predictions, never a replacement for actual RxJS tests.
 */
const ref = (id: string, generation = 0): ResourceRef => ({ id, generation });
const source = ref('source');
const subscription = (r: ResourceRef): Action<unknown> => ({ type: 'subscribe', resource: r });
const release = (r: ResourceRef): Action<unknown> => ({ type: 'unsubscribe', resource: r });
const emit = (value: unknown): Action<unknown> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const complete: Action<unknown> = { type: 'notify', target: 'downstream', notification: { kind: 'C' } };
const fail = (error: unknown): Action<unknown> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error } });
const pin = (path: string) => ({
  url: 'https://github.com/ReactiveX/rxjs/blob/' + pinnedRevision + '/' + path,
  revision: pinnedRevision,
  purpose: 'Exact RxJS 7.8.2 operator and subscription semantics',
});
const signal = (
  type: string, origin: 'downstream' | 'source' | 'timer' | 'callback',
  category: 'notification' | 'lifecycle' | 'time' | 'callback', description: string,
) => ({ type, origin, category, description });
const standardInputs = [
  signal('subscribe', 'downstream', 'lifecycle', 'fresh subscription'),
  signal('source.next', 'source', 'notification', 'value from producer'),
  signal('source.complete', 'source', 'notification', 'producer completed'),
  signal('source.error', 'source', 'notification', 'producer failed'),
  signal('cancel', 'downstream', 'lifecycle', 'consumer cancellation'),
] as const;
const controls = (extra: readonly ModelMetadata['controls'][number][] = []): ModelMetadata['controls'] => [
  { id: 'Unsubscribed', description: 'lazy execution not connected', terminal: false },
  { id: 'Active', description: 'source is live with subscription-local state', terminal: false },
  ...extra,
  { id: 'Closed', description: 'terminal or cancelled; no further source notifications legal', terminal: true },
];
const metadata = (options: Readonly<{
  operator: string; id: string; purpose: string; signature: string;
  conditions: readonly string[]; parameters: string; callbacks: string;
  time: string; reentrancy: string; exclusions: readonly string[];
  sharing: string; reset: string; actionSemantics: string;
  resources: ModelMetadata['ownership']['resources'];
  inputs: ModelMetadata['inputs']; controls?: ModelMetadata['controls'];
  actionTypes: ModelMetadata['actionTypes']; sourcePaths: readonly string[];
}>): ModelMetadata => ({
  schemaVersion: '1.1', id: options.id, operator: options.operator, rxjsVersion: '7.8.2',
  purpose: options.purpose,
  cardinality: { signature: options.signature, conditions: options.conditions },
  scope: {
    parameters: options.parameters, callbacks: options.callbacks, time: options.time,
    reentrancy: options.reentrancy, exclusions: options.exclusions,
  },
  initialization: {
    control: 'Unsubscribed', event: 'subscribe',
    sourceSubscription: options.operator === 'subscribeOn'
      ? 'Schedule source acquisition; subscribe to source only on the selected scheduler action.'
      : 'Subscribe to the source lazily on downstream subscription.',
  },
  ownership: {
    state: 'subscription-local', sharing: options.sharing, reset: options.reset, resources: options.resources,
  },
  dispatch: {
    policy: options.operator === 'subscribeOn' ? 'scheduled' : 'atomic-non-reentrant',
    actionSemantics: options.actionSemantics,
    cancellationCheckpoints: ['Between reactions, on source termination and on downstream cancellation.'],
  },
  inputs: options.inputs, controls: options.controls ?? controls(),
  actionTypes: options.actionTypes,
  sources: options.sourcePaths.map(pin),
  evidence: {
    status: 'source-inspected', record: 'evidence/SESSION-19.md',
    modelTests: ['tests/session19-model.test.mjs'],
    runtimeTests: ['tests/session19-rxjs.test.mjs'],
  },
});
const makeRule = <P, S, E extends { type: string }, A>(
  op: string, suffix: string, from: string, event: E['type'], to: string,
  guard: string, actions: readonly string[], explanation: string,
  enabled: (s: S, e: E, p: P) => boolean,
  react: (s: S, e: E, p: P) => { state: S; actions: readonly A[] },
): Rule<P, S, E, A> => {
  const id = 'S19-' + op.toUpperCase() + '-' + suffix;
  const description: RuleDescription = {
    id, from, event, to, guard, actions,
    nextState: to === 'Closed' ? 'Final terminal reason; state is no longer admissible for input.'
      : 'Retain precisely the state memory and resource ownership described by this rule.',
    obligations: [id], explanation,
  };
  return { description, enabled, react };
};
const actionErrors = (actions: readonly Action<unknown>[]): string[] =>
  [...validateActionWord(actions), ...actions.filter(a => a.type === 'notify' && a.target !== 'downstream')
    .map(() => 'unknown notification target')];
const exception = (name: string, message: string): Error => Object.assign(new Error(message), { name });

export type SingleParameters = Readonly<{ predicate: boolean; predicateId: 'predicate' }>;
export type SingleState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; seen: boolean; hasValue: boolean; value: T | undefined; index: number }>
  | Readonly<{ phase: 'Calling'; seen: true; hasValue: boolean; value: T | undefined; index: number; candidate: T }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'empty' | 'not-found' | 'duplicate' | 'source-error' | 'predicate-error' | 'cancel' }>;
export type SingleEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; value: boolean }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>;
export type SingleModel<T> = OperatorModel<SingleParameters, SingleState<T>, SingleEvent<T>, Action<unknown>>;

export function createSingleModel<T>(predicate = false): SingleModel<T> {
  type P = SingleParameters; type S = SingleState<T>; type E = SingleEvent<T>; type A = Action<unknown>;
  const p: P = { predicate, predicateId: 'predicate' };
  const rule = (suffix: string, from: string, event: E['type'], to: string, guard: string,
    actions: string[], explanation: string, enabled: (s: S, e: E, p: P) => boolean,
    react: (s: S, e: E, p: P) => { state: S; actions: readonly A[] }) =>
    makeRule<P, S, E, A>('single', suffix, from, event, to, guard, actions, explanation, enabled, react);
  const active = (s: S): s is Extract<S, { phase: 'Active' }> => s.phase === 'Active';
  const calling = (s: S): s is Extract<S, { phase: 'Calling' }> => s.phase === 'Calling';
  const close = (reason: Extract<S, { phase: 'Closed' }>['reason']): S => ({ phase: 'Closed', reason });
  const matches = (s: S, e: E): boolean => calling(s) && 'resource' in e &&
    e.resource.id === 'predicate' && e.resource.generation === s.index;
  const rules = [
    rule('START', 'Unsubscribed', 'subscribe', 'Active', 'first downstream subscriber',
      ['subscribe source; initialize presence bits and index'],
      'The matching candidate is unknown until source completion; no speculative output.',
      () => true, () => ({ state: { phase: 'Active', seen: false, hasValue: false, value: undefined, index: 0 }, actions: [subscription(source)] })),
    rule('CANDIDATE', 'Active', 'source.next', 'Active', 'no predicate and no previous candidate',
      ['retain first source value without notifying'],
      'The first value may only be emitted after normal completion confirms uniqueness.',
      (s, _e, q) => active(s) && !q.predicate && !s.hasValue,
      (_s, e) => { if (e.type !== 'source.next') throw Error('single candidate expected'); return {
        state: { phase: 'Active', seen: true, hasValue: true, value: e.value, index: 0 }, actions: [],
      }; }),
    rule('SECOND', 'Active', 'source.next', 'Closed', 'no predicate and candidate already stored',
      ['error with SequenceError; unsubscribe source'],
      'A second matching value immediately violates the single-value contract.',
      (s, _e, q) => active(s) && !q.predicate && s.hasValue,
      () => ({ state: close('duplicate'), actions: [fail(exception('SequenceError', 'Too many matching values')), release(source)] })),
    rule('PREDICATE', 'Active', 'source.next', 'Calling', 'predicate selected and index safe',
      ['request indexed predicate for original source value'],
      'A predicate result is a separate correlated callback event; it never changes the source value.',
      (s, _e, q) => active(s) && q.predicate && natural(s.index) && s.index < Number.MAX_SAFE_INTEGER,
      (s, e) => { if (!active(s) || e.type !== 'source.next') throw Error('single predicate expected'); return {
        state: { phase: 'Calling', seen: true, hasValue: s.hasValue, value: s.value, index: s.index, candidate: e.value },
        actions: [{ type: 'invoke-callback', resource: ref('predicate', s.index), value: e.value, index: s.index }],
      }; }),
    rule('REJECT', 'Calling', 'callback.return', 'Active', 'correlated false predicate result',
      ['advance predicate index; retain previous candidate if any'],
      'Unmatched source values still establish that the source was non-empty, but are never emitted.',
      (s, e) => matches(s, e) && e.type === 'callback.return' && !e.value,
      s => { if (!calling(s)) throw Error('single reject expected'); return {
        state: { phase: 'Active', seen: true, hasValue: s.hasValue, value: s.value, index: s.index + 1 }, actions: [],
      }; }),
    rule('FIRST-MATCH', 'Calling', 'callback.return', 'Active', 'correlated true result and no prior match',
      ['retain original source value; advance predicate index'],
      'Do not emit the first match until successful completion has ruled out a second match.',
      (s, e) => matches(s, e) && e.type === 'callback.return' && e.value && calling(s) && !s.hasValue,
      s => { if (!calling(s)) throw Error('single first match expected'); return {
        state: { phase: 'Active', seen: true, hasValue: true, value: s.candidate, index: s.index + 1 }, actions: [],
      }; }),
    rule('DUPLICATE-MATCH', 'Calling', 'callback.return', 'Closed', 'correlated true result and prior matching value exists',
      ['error with SequenceError; release source immediately'],
      'Two matching values violate single even if later source values would not match.',
      (s, e) => matches(s, e) && e.type === 'callback.return' && e.value && calling(s) && s.hasValue,
      () => ({ state: close('duplicate'), actions: [fail(exception('SequenceError', 'Too many matching values')), release(source)] })),
    rule('PREDICATE-THROW', 'Calling', 'callback.throw', 'Closed', 'correlated predicate exception',
      ['propagate exact thrown object; release source'],
      'A thrown predicate is an error, not a false result or missing match.',
      matches, (_s, e) => { if (e.type !== 'callback.throw') throw Error('predicate throw expected'); return {
        state: close('predicate-error'), actions: [fail(e.error), release(source)],
      }; }),
    rule('FOUND', 'Active', 'source.complete', 'Closed', 'one matching candidate stored',
      ['emit retained original value; complete; release source'],
      'Exactly one match is confirmed only at successful completion.',
      s => active(s) && s.hasValue,
      s => { if (!active(s)) throw Error('found expected'); return { state: close('complete'), actions: [emit(s.value), complete, release(source)] }; }),
    rule('EMPTY', 'Active', 'source.complete', 'Closed', 'no source values ever observed',
      ['emit EmptyError; release source'],
      'EmptyError takes precedence over NotFoundError when the source is empty.',
      s => active(s) && !s.seen,
      () => ({ state: close('empty'), actions: [fail(exception('EmptyError', 'no elements in sequence')), release(source)] })),
    rule('NOT-FOUND', 'Active', 'source.complete', 'Closed', 'source was non-empty but predicate matched nothing',
      ['emit NotFoundError; release source'],
      'Only a supplied predicate can reject all values of a non-empty source.',
      (s, _e, q) => active(s) && q.predicate && s.seen && !s.hasValue,
      () => ({ state: close('not-found'), actions: [fail(exception('NotFoundError', 'No matching values')), release(source)] })),
    rule('SOURCE-ERROR', 'Active', 'source.error', 'Closed', 'live source fails',
      ['forward exact source error; release source'], 'No retained candidate is emitted on failure.',
      s => active(s),
      (_s, e) => { if (e.type !== 'source.error') throw Error('source error expected'); return {
        state: close('source-error'), actions: [fail(e.error), release(source)],
      }; }),
    ...(['Active', 'Calling'] as const).map(phase =>
      rule('CANCEL-' + phase.toUpperCase(), phase, 'cancel', 'Closed', 'consumer cancels',
        ['release source without a next/error/complete notification'],
        'Cancellation discards a candidate and any unfinished callback, without selecting it.',
        s => s.phase === phase,
        () => ({ state: close('cancel'), actions: [release(source)] }))),
  ];
  return {
    parameters: p, rules, initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => {
      if (active(s) || calling(s)) {
        return [...(!natural(s.index) || s.index >= Number.MAX_SAFE_INTEGER ? ['invalid predicate index'] : []),
          ...(s.hasValue && !s.seen ? ['matching value without source value'] : [])];
      }
      return [];
    },
    validateReaction: (before, event, result) => {
      const errors = actionErrors(result.actions);
      if (event.type === 'cancel' && result.actions.some(a => a.type === 'notify'))
        errors.push('cancellation must be silent');
      if (event.type === 'source.next' && before.phase === 'Active' && !p.predicate &&
          !before.hasValue && result.actions.some(a => a.type === 'notify'))
        errors.push('first candidate must not be emitted early');
      if (result.state.phase === 'Closed' && result.state.reason === 'complete' &&
          result.actions.filter(a => a.type === 'notify').length !== 2)
        errors.push('successful single requires exactly next and complete');
      return errors;
    },
    metadata: metadata({
      operator: 'single', id: 'single-' + (predicate ? 'indexed-predicate' : 'direct'),
      purpose: 'Assert exactly one matching source value, retaining candidate until successful completion; distinguish empty, no match, and duplicates.',
      signature: 'single(P?) : Cω(Predicate?) × T* → T?',
      conditions: ['A successful finite source emits exactly one original value and complete.',
        'A second match fails immediately; an empty source fails with EmptyError; a non-empty predicate no-match fails with NotFoundError.',
        'Errors and cancellation discard retained state; no emission before uniqueness is known.'],
      parameters: predicate ? 'Indexed boolean predicate; omitted BooleanConstructor and thisArg specialization.' : 'Predicate omitted; all source values match.',
      callbacks: predicate ? 'Exactly one correlated request/outcome for every inspected source value (value,index,source).' : 'No user callback.',
      time: 'Only source delivery order controls candidate storage; no new clock or scheduler.',
      reentrancy: 'A callback return/throw must resolve before another source notification.',
      exclusions: ['BooleanConstructor type-guard specialization, reentrant predicate/observer delivery and source initialization-time callbacks.'],
      sharing: 'None introduced; each downstream subscription independently evaluates uniqueness.',
      reset: 'Presence bits, match value and predicate index start fresh for each subscription.',
      actionSemantics: 'Indexed callback invocation is separate from source.next; candidate is held until completion.',
      resources: [
        { id: 'source', kind: 'subscription', owner: 'current downstream subscription' },
        { id: 'predicate', kind: 'callback', owner: 'indexed evaluation when enabled' },
      ],
      inputs: [...standardInputs,
        signal('callback.return', 'callback', 'callback', 'correlated predicate boolean'),
        signal('callback.throw', 'callback', 'callback', 'correlated thrown object')],
      controls: controls([{ id: 'Calling', description: 'exactly one indexed predicate outcome pending', terminal: false }]),
      actionTypes: ['subscribe', 'unsubscribe', 'invoke-callback', 'notify'],
      sourcePaths: ['src/internal/operators/single.ts', 'src/internal/operators/OperatorSubscriber.ts'],
    }),
  };
}
export const singleExample: readonly TimedEvent<SingleEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 3 } },
  { time: 1, event: { type: 'callback.return', resource: ref('predicate'), value: false } },
  { time: 2, event: { type: 'source.next', value: 4 } },
  { time: 2, event: { type: 'callback.return', resource: ref('predicate', 1), value: true } },
  { time: 3, event: { type: 'source.complete' } },
];

export type SkipLastParameters = Readonly<{ count: number; policy: 'bounded FIFO' }>;
export type SkipLastState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; pending: readonly T[]; seen: number }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'error' | 'cancel' }>;
export type SkipLastEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;
export type SkipLastModel<T> = OperatorModel<SkipLastParameters, SkipLastState<T>, SkipLastEvent<T>, Action<unknown>>;

export function createSkipLastModel<T>(count = 2): SkipLastModel<T> {
  if (!natural(count) || count > 8) throw RangeError('skipLast modeled count must be an integer 0..8');
  type P = SkipLastParameters; type S = SkipLastState<T>; type E = SkipLastEvent<T>; type A = Action<unknown>;
  const p: P = { count, policy: 'bounded FIFO' };
  const r = (id: string, from: string, event: E['type'], to: string, guard: string,
    actions: string[], explanation: string, enabled: (s: S, e: E, p: P) => boolean,
    react: (s: S, e: E, p: P) => { state: S; actions: readonly A[] }) =>
    makeRule<P, S, E, A>('skipLast', id, from, event, to, guard, actions, explanation, enabled, react);
  const active = (s: S): s is Extract<S, { phase: 'Active' }> => s.phase === 'Active';
  const closed = (reason: 'complete' | 'error' | 'cancel'): S => ({ phase: 'Closed', reason });
  const rules = [
    r('START', 'Unsubscribed', 'subscribe', 'Active', 'first subscription',
      ['subscribe source with empty FIFO'], 'No values are buffered before subscription.',
      () => true, () => ({ state: { phase: 'Active', pending: [], seen: 0 }, actions: [subscription(source)] })),
    r('IDENTITY', 'Active', 'source.next', 'Active', 'count is zero',
      ['forward value immediately'], 'skipLast(0) uses identity and does not retain payloads.',
      (_s, _e, q) => q.count === 0,
      (s, e) => { if (!active(s) || e.type !== 'source.next') throw Error('skipLast identity expected'); return {
        state: { ...s, seen: s.seen + 1 }, actions: [emit(e.value)],
      }; }),
    r('BUFFER', 'Active', 'source.next', 'Active', 'nonzero count and FIFO is not full',
      ['enqueue source value silently'], 'No value can be emitted before at least count subsequent values arrive.',
      (s, _e, q) => active(s) && q.count > 0 && s.pending.length < q.count,
      (s, e) => { if (!active(s) || e.type !== 'source.next') throw Error('skipLast buffer expected'); return {
        state: { ...s, seen: s.seen + 1, pending: [...s.pending, e.value] }, actions: [],
      }; }),
    r('RELEASE-OLDEST', 'Active', 'source.next', 'Active', 'positive count and FIFO already full',
      ['replace oldest buffered value with new source value', 'then emit previous oldest'],
      'Replacing the ring slot before notifying preserves correct state for synchronous observers.',
      (s, _e, q) => active(s) && q.count > 0 && s.pending.length === q.count,
      (s, e) => { if (!active(s) || e.type !== 'source.next') throw Error('skipLast release expected'); return {
        state: { ...s, seen: s.seen + 1, pending: [...s.pending.slice(1), e.value] }, actions: [emit(s.pending[0])],
      }; }),
    r('COMPLETE', 'Active', 'source.complete', 'Closed', 'source completes successfully',
      ['drop still-buffered suffix', 'complete without flushing'],
      'The last count values are never emitted, even on completion.',
      s => active(s), () => ({ state: closed('complete'), actions: [complete, release(source)] })),
    r('ERROR', 'Active', 'source.error', 'Closed', 'source fails',
      ['drop FIFO and propagate exact error', 'release source'],
      'Buffered prefix and suffix are discarded; no completion is synthesized.',
      s => active(s),
      (_s, e) => { if (e.type !== 'source.error') throw Error('skipLast error expected'); return {
        state: closed('error'), actions: [fail(e.error), release(source)],
      }; }),
    r('CANCEL', 'Active', 'cancel', 'Closed', 'consumer cancels',
      ['drop FIFO and unsubscribe silently'], 'Cancellation never flushes buffered values.',
      s => active(s), () => ({ state: closed('cancel'), actions: [release(source)] })),
  ];
  return {
    parameters: p, rules, initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => active(s)
      ? [...(!natural(s.seen) || s.seen >= Number.MAX_SAFE_INTEGER ? ['seen count invalid'] : []),
        ...(s.pending.length > count || (count === 0 && s.pending.length !== 0) ? ['FIFO bound exceeded'] : []),
        ...(s.pending.length > s.seen ? ['FIFO contains unseen value'] : [])] : [],
    validateReaction: (_s, e, out) => [
      ...actionErrors(out.actions),
      ...(e.type === 'cancel' && out.actions.some(a => a.type === 'notify') ? ['cancel emitted notification'] : []),
      ...(e.type === 'source.complete' && out.actions.some(a => a.type === 'notify' && a.notification.kind === 'N')
        ? ['skipLast must not flush on complete'] : []),
    ],
    metadata: metadata({
      operator: 'skipLast', id: 'skipLast-FIFO-' + count,
      purpose: 'Retain a bounded trailing suffix while immediately forwarding any value forced out by newer arrivals.',
      signature: 'skipLast(n) : Cω(Count) × T* → T*',
      conditions: ['For a finite successful source of N values output the first max(0,N-n) in order.',
        'A value is forwarded on arrival of the n-th subsequent source value, without a clock.',
        'Completion and cancellation never flush the retained suffix.'],
      parameters: 'Finite nonnegative safe integer count in 0..8; zero represents the identity fast path.',
      callbacks: 'No selector or user callback; FIFO logic only.',
      time: 'Emission occurs on the n-th later source next; no timer is created.',
      reentrancy: 'State replacement precedes notification; nested source emissions are outside this bounded model.',
      exclusions: ['Negative, fractional, infinite and huge allocation counts; arbitrary reentrant sources or observers.'],
      sharing: 'No Subject or sharing. Each result subscription owns its FIFO and source subscription.',
      reset: 'New FIFO and seen counter per subscription; release memory on terminal/cancel.',
      actionSemantics: 'On overflow, swap FIFO head before forwarding it downstream; never emit the trailing suffix.',
      resources: [{ id: 'source', kind: 'subscription', owner: 'current output subscription' }],
      inputs: standardInputs, actionTypes: ['subscribe', 'unsubscribe', 'notify'],
      sourcePaths: ['src/internal/operators/skipLast.ts', 'src/internal/operators/OperatorSubscriber.ts'],
    }),
  };
}
export const skipLastExample: readonly TimedEvent<SkipLastEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 'a' } },
  { time: 2, event: { type: 'source.next', value: 'b' } },
  { time: 3, event: { type: 'source.next', value: 'c' } },
  { time: 4, event: { type: 'source.complete' } },
];

export type SubscribeOnParameters = Readonly<{ delay: number; scheduler: 'virtual FIFO deferred' }>;
export type SubscribeOnState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Pending'; deadline: number }>
  | Readonly<{ phase: 'Active' }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'error' | 'cancel' }>;
export type SubscribeOnEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'timer.fire'; resource: ResourceRef; now: number }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;
export type SubscribeOnModel<T> = OperatorModel<SubscribeOnParameters, SubscribeOnState, SubscribeOnEvent<T>, Action<unknown>>;

export function createSubscribeOnModel<T>(delay = 2): SubscribeOnModel<T> {
  if (!natural(delay) || delay > 8) throw RangeError('subscribeOn modeled delay must be an integer 0..8');
  type P = SubscribeOnParameters; type S = SubscribeOnState; type E = SubscribeOnEvent<T>; type A = Action<unknown>;
  const p: P = { delay, scheduler: 'virtual FIFO deferred' };
  const r = (id: string, from: string, event: E['type'], to: string, guard: string,
    actions: string[], explanation: string, enabled: (s: S, e: E, p: P) => boolean,
    react: (s: S, e: E, p: P) => { state: S; actions: readonly A[] }) =>
    makeRule<P, S, E, A>('subscribeOn', id, from, event, to, guard, actions, explanation, enabled, react);
  const pending = (s: S): s is Extract<S, { phase: 'Pending' }> => s.phase === 'Pending';
  const closed = (reason: 'complete' | 'error' | 'cancel'): S => ({ phase: 'Closed', reason });
  const timer = ref('subscription-action', 0);
  const rules = [
    r('SCHEDULE', 'Unsubscribed', 'subscribe', 'Pending', 'downstream starts',
      ['schedule subscription action with delay', 'do not acquire source yet'],
      'subscribeOn defers producer connection, not each source notification.',
      () => true, () => ({ state: { phase: 'Pending', deadline: delay },
        actions: [{ type: 'schedule', resource: timer, delay }] })),
    r('CONNECT', 'Pending', 'timer.fire', 'Active', 'matching scheduler action at/after due time',
      ['subscribe source inside scheduled action'],
      'Scheduler executes acquisition once; the connected source can emit synchronously.',
      (s, e) => pending(s) && e.type === 'timer.fire' &&
        e.resource.id === timer.id && e.resource.generation === 0 && natural(e.now) && e.now >= s.deadline,
      () => ({ state: { phase: 'Active' }, actions: [subscription(source)] })),
    r('PENDING-CANCEL', 'Pending', 'cancel', 'Closed', 'unsubscribe before scheduled action runs',
      ['cancel scheduler action; never subscribe source'],
      'Early unsubscribe is sufficient to stop pending subscription without ever touching producer.',
      s => pending(s), () => ({ state: closed('cancel'), actions: [{ type: 'cancel-timer', resource: timer }] })),
    r('NEXT', 'Active', 'source.next', 'Active', 'scheduled source subscription is now live',
      ['forward source value immediately'],
      'subscribeOn changes connection timing, not downstream next delivery timing.',
      s => s.phase === 'Active',
      (_s, e) => { if (e.type !== 'source.next') throw Error('subscribeOn next expected'); return {
        state: { phase: 'Active' }, actions: [emit(e.value)],
      }; }),
    r('COMPLETE', 'Active', 'source.complete', 'Closed', 'live source completes',
      ['complete and release source'], 'Source completion is not scheduled a second time.',
      s => s.phase === 'Active', () => ({ state: closed('complete'), actions: [complete, release(source)] })),
    r('ERROR', 'Active', 'source.error', 'Closed', 'live source fails',
      ['propagate original error and release source'], 'Errors are not deferred beyond source delivery.',
      s => s.phase === 'Active',
      (_s, e) => { if (e.type !== 'source.error') throw Error('subscribeOn error expected'); return {
        state: closed('error'), actions: [fail(e.error), release(source)],
      }; }),
    r('ACTIVE-CANCEL', 'Active', 'cancel', 'Closed', 'consumer unsubscribes after source acquisition',
      ['unsubscribe source silently'], 'No delayed subscription is retained after cancellation.',
      s => s.phase === 'Active', () => ({ state: closed('cancel'), actions: [release(source)] })),
  ];
  return {
    parameters: p, rules, initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => pending(s) && s.deadline !== delay ? ['pending schedule deadline changed'] : [],
    validateReaction: (_s, e, out) => [
      ...actionErrors(out.actions),
      ...(e.type === 'subscribe' && out.actions.some(a => a.type === 'subscribe')
        ? ['source acquired before scheduled action'] : []),
      ...(e.type === 'cancel' && out.actions.some(a => a.type === 'notify')
        ? ['cancellation emitted notification'] : []),
    ],
    metadata: metadata({
      operator: 'subscribeOn', id: 'subscribeOn-virtualFIFO-delay-' + delay,
      purpose: 'Defer subscription to the producer using a scheduled action; preserve source notification ordering and cancellation.',
      signature: 'subscribeOn(scheduler,delay) : Cω(Scheduler,Duration) × T* → T*',
      conditions: ['One scheduled subscription action precedes any source acquisition.',
        'Cancelling before the scheduler fires prevents producer subscription entirely.',
        'Once connected, next/error/complete are not separately scheduled.'],
      parameters: 'One FIFO virtual scheduler with a safe integer 0..8 delay, including deferred delay=0.',
      callbacks: 'The scheduler executes a source-subscription thunk; no user projection callback.',
      time: 'Scheduler determines connection time. Source itself determines notification times after connection.',
      reentrancy: 'Deferred scheduler action (TestScheduler-like) and non-reentrant subsequent source delivery.',
      exclusions: ['queueScheduler synchronous zero-delay execution, arbitrary scheduler implementations/throws.',
        'Actual wall-clock drift, source delivery during the atomic scheduling reaction, reentrant observers.'],
      sharing: 'No sharing; each downstream subscription independently schedules its own source acquisition.',
      reset: 'One new scheduler action per subscription, with its cancellation ownership.',
      actionSemantics: 'schedule on subscribe; subscribe producer only on timer.fire; cancellation cancels timer or source based on state.',
      resources: [
        { id: 'subscription-action', kind: 'timer', owner: 'one pending downstream subscription' },
        { id: 'source', kind: 'subscription', owner: 'downstream after timer fired' },
      ],
      inputs: [...standardInputs, signal('timer.fire', 'timer', 'time', 'scheduled source acquisition fires')],
      controls: controls([{ id: 'Pending', description: 'scheduler owns one queued source subscription action', terminal: false }]),
      actionTypes: ['schedule', 'cancel-timer', 'subscribe', 'unsubscribe', 'notify'],
      sourcePaths: ['src/internal/operators/subscribeOn.ts', 'src/internal/util/lift.ts'],
    }),
  };
}
export const subscribeOnExample: readonly TimedEvent<SubscribeOnEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 2, event: { type: 'timer.fire', resource: ref('subscription-action'), now: 2 } },
  { time: 2, event: { type: 'source.next', value: 4 } },
  { time: 3, event: { type: 'source.complete' } },
];

export type SwitchMapToModel<I, O, S = string> = FlattenModel<I, O, S>;
export type SwitchMapToEvent<I, O, S = string> = FlattenEvent<I, O, S>;
export function createSwitchMapToModel<I, O, S = string>(constantSource: S): SwitchMapToModel<I, O, S> {
  const base = createSwitchMapModel<I, O, S>('constant');
  const rules = base.rules.filter(r => r.description.event !== 'callback.throw').map(r => ({
    ...r,
    description: {
      ...r.description,
      id: r.description.id.replace('SWITCHMAP', 'SWITCHMAPTO'),
      obligations: r.description.obligations.map(x => x.replace('S2-SWITCHMAP', 'S19-SWITCHMAPTO')),
      explanation: 'An outer value starts a new occurrence of the same configured Observable. ' + r.description.explanation,
    },
    enabled: (s: FlattenState<I, S>, e: FlattenEvent<I, O, S>, p: FlattenParameters) =>
      r.enabled(s, e, p) && (e.type !== 'callback.return' || Object.is(e.value, constantSource)),
  }));
  return {
    ...base, rules,
    metadata: {
      ...base.metadata, operator: 'switchMapTo', id: 'switchMapTo-constant',
      purpose: 'Restart subscription to the same constant inner Observable on each outer next; cancel the previous occurrence before replacement.',
      cardinality: { signature: 'switchMapTo(inner) : Cω(Observable) × T* → U*',
        conditions: ['Each outer next cancels its predecessor occurrence and starts a fresh subscription to the configured object.',
          'Only values from the latest occurrence flow; outer completion waits for the current inner to complete.',
          'A shared/hot configured Observable can remain active independently of per-occurrence cancellation.'] },
      scope: {
        ...base.metadata.scope,
        parameters: 'One fixed valid Observable token supplied at operator construction, no resultSelector.',
        callbacks: 'Internal constant-binding step correlates with the outer admission index; no user projection is invoked.',
        exclusions: ['Deprecated resultSelector overload and ObservableInput Promise/Iterable conversions.',
          'Synchronous inner acquisition-time emissions, observer reentrancy and throwing finalizers.'],
      },
      ownership: {
        ...base.metadata.ownership,
        sharing: 'Operator creates no sharing; each outer value subscribes anew to the SAME Observable object.',
        reset: 'One latest occurrence token and zero-based admission index per output subscription.',
      },
      sources: [pin('src/internal/operators/switchMapTo.ts'), pin('src/internal/operators/switchMap.ts'), ...base.metadata.sources],
      evidence: { modelTests: ['tests/session19-model.test.mjs'], runtimeTests: ['tests/session19-rxjs.test.mjs'],
        status: 'source-inspected' as const, record: 'evidence/SESSION-19.md' },
    },
  };
}
export const switchMapToExample: readonly TimedEvent<SwitchMapToEvent<number, string, string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'outer.next', value: 1 } },
  { time: 1, event: { type: 'callback.return', resource: ref('constant', 0), value: 'shared' } },
  { time: 2, event: { type: 'inner.next', resource: ref('inner', 0), value: 'old' } },
  { time: 3, event: { type: 'outer.next', value: 2 } },
  { time: 3, event: { type: 'callback.return', resource: ref('constant', 1), value: 'shared' } },
  { time: 4, event: { type: 'outer.complete' } },
  { time: 5, event: { type: 'inner.next', resource: ref('inner', 1), value: 'new' } },
  { time: 6, event: { type: 'inner.complete', resource: ref('inner', 1) } },
];

export type SwitchScanParameters<R> = FlattenParameters & Readonly<{ seed: R }>;
export type SwitchScanState<I, S, R> = FlattenState<I, S> & Readonly<{ accumulator: R }>;
export type SwitchScanEvent<I, R, S = string> = FlattenEvent<I, R, S>;
export type SwitchScanCallback<I, R> = Readonly<{ accumulator: R; value: I }>;
export type SwitchScanModel<I, R, S = string> = OperatorModel<
  SwitchScanParameters<R>, SwitchScanState<I, S, R>, SwitchScanEvent<I, R, S>,
  Action<R, SwitchScanCallback<I, R>>>;

export function createSwitchScanModel<I, R, S = string>(seed: R): SwitchScanModel<I, R, S> {
  const base = createSwitchMapModel<I, R, S>('accumulator');
  type P = SwitchScanParameters<R>;
  type ST = SwitchScanState<I, S, R>;
  type E = SwitchScanEvent<I, R, S>;
  type A = Action<R, SwitchScanCallback<I, R>>;
  const parameters: P = { ...base.parameters, seed };
  const rules: Rule<P, ST, E, A>[] = base.rules.map(rule => ({
    description: {
      ...rule.description,
      id: rule.description.id.replace('SWITCHMAP', 'SWITCHSCAN'),
      obligations: rule.description.obligations.map(x => x.replace('S2-SWITCHMAP', 'S19-SWITCHSCAN')),
      explanation: 'State supplied at admission is the last delivered inner value, initially the seed. ' + rule.description.explanation,
    },
    enabled: (s, e) => rule.enabled(s, e, base.parameters),
    react: (s, e) => {
      const original = rule.react(s, e, base.parameters);
      const errors = base.validateReaction(s, e, original, base.parameters);
      if (errors.length) throw Error('underlying switchMap invariant: ' + errors.join('; '));
      const accumulator = e.type === 'inner.next' ? e.value : s.accumulator;
      const state = { ...original.state, accumulator } as ST;
      const actions = original.actions.map(a => a.type === 'invoke-callback'
        ? ({ ...a, value: { accumulator: s.accumulator, value: a.value } } as A)
        : (a as A));
      return { state, actions };
    },
  }));
  return {
    parameters, rules, initialState: () => ({ ...base.initialState(), accumulator: seed } as ST),
    control: s => base.control(s),
    validateState: s => [
      ...base.validateState(s, base.parameters),
      ...(!Object.hasOwn(s, 'accumulator') ? ['missing accumulator state'] : []),
    ],
    validateReaction: (before, event, result) => [
      ...validateActionWord(result.actions),
      ...(event.type === 'inner.next' && !Object.is(result.state.accumulator, event.value)
        ? ['every active inner.next updates accumulator before forwarding'] : []),
      ...(event.type !== 'inner.next' && result.state.phase !== 'Closed' &&
        !Object.is(result.state.accumulator, before.accumulator)
        ? ['non-inner event changed accumulator'] : []),
      ...(result.actions.some(a => a.type === 'invoke-callback' &&
        !Object.is(a.value.accumulator, before.accumulator))
        ? ['accumulator snapshot changed inside callback invocation'] : []),
    ],
    metadata: {
      ...base.metadata, id: 'switchScan-latest-inner-seed', operator: 'switchScan',
      purpose: 'Switch to the latest accumulator-produced Observable, updating the accumulator from each delivered inner value.',
      cardinality: {
        signature: 'switchScan : Cω((R,T,Index)→R*,Seed) × T* → R*',
        conditions: ['Each source value cancels the preceding inner before selecting its replacement.',
          'The callback sees the latest inner output as its accumulator, not the previous callback result.',
          'Stale cancelled inner notifications are illegal; successful outer completion waits for current inner completion.'],
      },
      scope: {
        ...base.metadata.scope,
        parameters: 'Opaque explicit seed, valid Observable-returning indexed accumulator and one active inner.',
        callbacks: 'One correlated indexed invocation carries {accumulator,value}; latest delivered inner.next overwrites accumulator.',
        exclusions: ['Promise/Iterable conversion, undefined/invalid inner and synchronous reentrant projection.',
          'Deprecated inner result-selector mechanics outside the inspected switchScan implementation.'],
      },
      ownership: {
        ...base.metadata.ownership,
        reset: 'Latest accumulator starts at seed on every new downstream subscription; cancelled inner cannot update state.',
      },
      sources: [pin('src/internal/operators/switchScan.ts'), pin('src/internal/operators/switchMap.ts'), ...base.metadata.sources],
      evidence: { modelTests: ['tests/session19-model.test.mjs'], runtimeTests: ['tests/session19-rxjs.test.mjs'],
        status: 'source-inspected' as const, record: 'evidence/SESSION-19.md' },
    },
  };
}
export const switchScanExample: readonly TimedEvent<SwitchScanEvent<number, number, string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'outer.next', value: 1 } },
  { time: 1, event: { type: 'callback.return', resource: ref('accumulator', 0), value: 'a' } },
  { time: 2, event: { type: 'inner.next', resource: ref('inner', 0), value: 4 } },
  { time: 3, event: { type: 'outer.next', value: 2 } },
  { time: 3, event: { type: 'callback.return', resource: ref('accumulator', 1), value: 'b' } },
  { time: 4, event: { type: 'outer.complete' } },
  { time: 5, event: { type: 'inner.next', resource: ref('inner', 1), value: 7 } },
  { time: 6, event: { type: 'inner.complete', resource: ref('inner', 1) } },
];
