import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, RuleDescription, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';

/** Session 5: count and predicate gates. These are specifications, not RxJS replacements. */
export type GateSourceEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;
export type GateCloseReason = 'complete' | 'source-error' | 'predicate-false' | 'callback-error' | 'cancel';
export type SkipParameters = Readonly<{ count: number }>;
export type SkipState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; index: number }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'cancel' }>;
export type SkipEvent<T> = GateSourceEvent<T>;
export type SkipModel<T> = OperatorModel<SkipParameters, SkipState, SkipEvent<T>, Action<T, T>>;
export type WhileOperator = 'takeWhile' | 'skipWhile';
export type WhileParameters = Readonly<{ operator: WhileOperator; inclusive: boolean; callbackId: string }>;
export type WhileState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Testing'; index: number }>
  | Readonly<{ phase: 'Calling'; index: number; callId: number; input: T }>
  | Readonly<{ phase: 'Open' }>
  | Readonly<{ phase: 'Closed'; reason: GateCloseReason }>;
/** Truthiness of JS outcomes is modeled; the usual public TS predicate returns boolean. */
export type WhileEvent<T> = GateSourceEvent<T>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; value: unknown }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>;
export type WhileModel<T> = OperatorModel<WhileParameters, WhileState<T>, WhileEvent<T>, Action<T, T>>;

const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const source = { id: 'source', generation: 0 } as const;
const acquire = { type: 'subscribe', resource: source } as const;
const release = { type: 'unsubscribe', resource: source } as const;
const complete = { type: 'notify', target: 'downstream', notification: { kind: 'C' } } as const;
const next = <T>(value: T): Action<T, T> => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const error = <T>(value: unknown): Action<T, T> => ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: value } });
const safeIndex = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;
const terminalReason = (type: string): 'complete' | 'source-error' | 'cancel' => {
  if (type === 'source.complete') return 'complete';
  if (type === 'source.error') return 'source-error';
  if (type === 'cancel') return 'cancel';
  throw new Error('not a terminal event');
};
const terminalActions = <T>(event: GateSourceEvent<T>): readonly Action<T, T>[] => {
  if (event.type === 'source.complete') return [complete, release];
  if (event.type === 'source.error') return [error<T>(event.error), release];
  if (event.type === 'cancel') return [release];
  throw new Error('not a terminal event');
};

/** Identity-sensitive invariant helper. Never serializes payloads or executes user functions. */
export function gatingActionWordsEqual<T, I>(a: readonly Action<T, I>[], b: readonly Action<T, I>[]): boolean {
  return a.length === b.length && a.every((x, i) => {
    const y = b[i]!;
    if (x.type !== y.type) return false;
    if (x.type === 'notify' && y.type === 'notify') {
      const xn = x.notification, yn = y.notification;
      return x.target === y.target && xn.kind === yn.kind &&
        (xn.kind === 'N' ? yn.kind === 'N' && Object.is(xn.value, yn.value) :
          xn.kind === 'E' ? yn.kind === 'E' && Object.is(xn.error, yn.error) : true);
    }
    if (x.type === 'notify' || y.type === 'notify') return false;
    if (x.resource.id !== y.resource.id || x.resource.generation !== y.resource.generation) return false;
    if (x.type === 'invoke-callback' && y.type === 'invoke-callback') return x.index === y.index && Object.is(x.value, y.value);
    return x.type !== 'schedule' || (y.type === 'schedule' && x.delay === y.delay);
  });
}

function unaryMetadata(operator: 'skip' | WhileOperator, profile: string, parameterText: string, callbackId = 'predicate'): ModelMetadata {
  const predicate = operator !== 'skip';
  const taking = operator === 'takeWhile';
  const prefix = operator.toUpperCase();
  return {
    schemaVersion: '1.1', id: `${operator}-${profile}`, operator, rxjsVersion: '7.8.2',
    purpose: operator === 'skip' ? 'Drop the first count source values, then forward later values unchanged.' :
      taking ? 'Forward source values while the predicate is truthy, then complete at its first falsy result, optionally including that value.' :
        'Drop source values while the predicate is truthy, then permanently open on its first falsy result.',
    cardinality: {
      signature: operator === 'skip' ? 'skip : Count! -> T* -> T*' : taking ? 'takeWhile : (T! x Index! -> Boolean!) x Inclusive! -> T* -> T*' : 'skipWhile : (T! x Index! -> Boolean!) -> T* -> T*',
      conditions: [
        operator === 'skip' ? 'For m values and normal completion, exactly max(0,m-count) values are forwarded.' :
          taking ? 'The successful prefix is forwarded; inclusive adds at most the first predicate-failing value, never a value whose predicate throws.' :
            'The first predicate-failing value and all later source values are forwarded. There is no buffer of skipped values.',
        'Cω-style markers count values only; errors, cancellation and source lifetime remain separate parts of the contract.',
      ],
    },
    scope: {
      parameters: parameterText,
      callbacks: predicate ? 'One named synchronous predicate invocation per tested input; correlated return/throw is an input. No user function executes in a guard, reaction or generator.' : 'No user callback. The pinned internal filter comparison is modeled directly as count <= index.',
      time: 'No clock, timer or scheduler is created. Sources supply time; equal timestamps retain explicit delivery order. A predicate call/outcome is one synchronous logical reaction.',
      reentrancy: 'Non-reentrant reactions, with cancellation between resolved value reactions. Exact source teardown traces use post-setup delivery; synchronous native checks are separate.',
      exclusions: ['Arbitrary source/observer/predicate reentry, cancellation during a predicate call, and throwing observers/finalizers.',
        'Index overflow beyond nonnegative safe integers; invalid public callback arguments and compile-time narrowing proofs.',
        operator === 'skip' ? 'Negative, fractional, NaN and infinite counts are outside this numeric profile.' : 'A production predicate interpreter and guarantees that user functions are pure.'],
    },
    initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: 'One source connection on subscription, even for skip(0); no value is emitted by initialization.' },
    ownership: { state: 'subscription-local', sharing: 'No sharing is introduced. Each subscription owns its count or predicate gate even when the producer is hot.',
      reset: 'A fresh subscription starts with fresh bookkeeping. Closed executions accept no more model events.',
      resources: [{ id: 'source', kind: 'subscription', owner: 'current execution' }, ...(predicate ? [{ id: callbackId, kind: 'callback' as const, owner: 'external binding; invocation generation is execution-local' }] : [])] },
    dispatch: { policy: 'atomic-non-reentrant', actionSemantics: 'Compute the next state and ordered actions once. Predicate outcome must resolve before any subsequent external event; actions are descriptions, not executed effects.',
      cancellationCheckpoints: ['Between resolved inputs: release the source without a downstream complete notification.'] },
    inputs: [
      { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'a fresh result subscription connects' },
      { type: 'source.next', origin: 'source', category: 'notification', description: 'the source delivers a value' },
      ...(predicate ? [
        { type: 'callback.return', origin: 'callback' as const, category: 'callback' as const, description: 'the pending predicate returns its result' },
        { type: 'callback.throw', origin: 'callback' as const, category: 'callback' as const, description: 'the pending predicate throws' },
      ] : []),
      { type: 'source.complete', origin: 'source', category: 'notification', description: 'the source completes' },
      { type: 'source.error', origin: 'source', category: 'notification', description: 'the source errors' },
      { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream cancels the subscription' },
    ],
    actionTypes: predicate ? ['subscribe', 'invoke-callback', 'notify', 'unsubscribe'] : ['subscribe', 'notify', 'unsubscribe'],
    controls: [
      { id: 'Unsubscribed', description: 'no source connection', terminal: false },
      ...(predicate ? [
        { id: 'Testing', description: 'source connected; the next value must be tested', terminal: false },
        { id: 'Calling', description: 'one synchronous predicate invocation is unresolved', terminal: false },
        ...(!taking ? [{ id: 'Open', description: 'permanently forwarding; no further predicate calls', terminal: false }] : []),
      ] : [{ id: 'Active', description: 'source connected with its zero-based value index', terminal: false }]),
      { id: 'Closed', description: 'complete, errored or cancelled', terminal: true },
    ],
    sources: [`src/internal/operators/${operator}.ts`, ...(operator === 'skip' ? ['src/internal/operators/filter.ts'] : []), 'src/internal/operators/OperatorSubscriber.ts', 'src/internal/Subscriber.ts'].map(path => ({
      url: `https://github.com/ReactiveX/rxjs/blob/${revision}/${path}`, revision, purpose: `${prefix} pinned value, callback and termination semantics`,
    })),
    evidence: { modelTests: ['tests/session05-model.test.mjs'], runtimeTests: ['tests/session05-rxjs.test.mjs'], status: 'source-inspected', record: 'evidence/SESSION-05.md' },
  };
}

function description(prefix: string, id: string, from: string, event: string, guard: string, to: string,
  actions: readonly string[], nextState: string, witness: string, explanation: string): RuleDescription {
  return { id: `${prefix}-${id}`, from, event, guard, to, actions, nextState, obligations: [`S5-${prefix}-${witness}`], explanation };
}

export function createSkipModel<T>(count: number): SkipModel<T> {
  if (!safeIndex(count)) throw new TypeError('skip count must be a nonnegative safe integer');
  const rules: Rule<SkipParameters, SkipState, SkipEvent<T>, Action<T, T>>[] = [{
    description: description('SKIP', 'INIT', 'Unsubscribed', 'subscribe', 'fresh execution', 'Active', ['subscribe to the source'], 'active at index zero', '01',
      'Subscription acquires the source and starts an index at zero. A zero count forwards all source values; it does not avoid subscribing.'),
    enabled: () => true, react: () => ({ state: { phase: 'Active', index: 0 }, actions: [acquire] }),
  }];
  for (const drop of count === 0 ? [false] : [true, false]) rules.push({
    description: description('SKIP', drop ? 'DROP' : 'PASS', 'Active', 'source.next', drop ? 'index < count and index < MAX_SAFE_INTEGER' : 'count <= index < MAX_SAFE_INTEGER', 'Active',
      drop ? [] : ['forward the incoming value unchanged'], 'active with the source index increased by one', '02',
      drop ? 'The first count values are dropped without buffering, while their indices still advance.' : 'Once count values have been skipped, every later source value is forwarded unchanged.'),
    enabled: (s, _e, p) => s.phase === 'Active' && s.index < Number.MAX_SAFE_INTEGER && (drop ? s.index < p.count : s.index >= p.count),
    react: (s, e) => {
      if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid skip input');
      return { state: { phase: 'Active', index: s.index + 1 }, actions: drop ? [] : [next(e.value)] };
    },
  });
  for (const type of ['source.complete', 'source.error', 'cancel'] as const) rules.push({
    description: description('SKIP', type === 'cancel' ? 'CANCEL' : type === 'source.error' ? 'ERROR' : 'COMPLETE', 'Active', type, 'active source connection', 'Closed',
      type === 'cancel' ? ['release the source without notifying downstream'] : [type === 'source.error' ? 'forward the original error' : 'complete downstream', 'release the source'],
      `closed because of ${terminalReason(type)}`, '03',
      type === 'cancel' ? 'Cancellation releases the source without a completion notification.' : type === 'source.error' ? 'Source errors are forwarded even before count values have arrived. The source is released.' : 'Source completion is forwarded even when fewer than count values arrived; no extra value or error is invented.'),
    enabled: () => true, react: (_s, e) => ({ state: { phase: 'Closed', reason: terminalReason(e.type) }, actions: terminalActions(e) }),
  });
  return {
    metadata: unaryMetadata('skip', String(count), 'Nonnegative safe-integer count and source indices'), parameters: { count }, rules,
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: (s, p) => !safeIndex(p.count) ? ['invalid skip count'] : s.phase === 'Unsubscribed' ? [] : s.phase === 'Active' ?
      safeIndex(s.index) ? [] : ['invalid skip index'] : s.phase === 'Closed' && ['complete', 'source-error', 'cancel'].includes(s.reason) ? [] : ['invalid skip state'],
    validateReaction: (before, e, r, p) => {
      const errors = [...validateActionWord(r.actions)];
      const expected = e.type === 'subscribe' ? [acquire] : e.type === 'source.next' && before.phase === 'Active' ?
        before.index >= p.count ? [next(e.value)] : [] : terminalActions(e);
      if (!gatingActionWordsEqual(r.actions, expected)) errors.push('skip ordered-action/identity invariant');
      if (e.type === 'source.next' && before.phase === 'Active' && (r.state.phase !== 'Active' || r.state.index !== before.index + 1)) errors.push('skip must advance the index exactly once');
      return errors;
    },
  };
}

function createWhileModel<T>(operator: WhileOperator, inclusive: boolean, callbackId: string): WhileModel<T> {
  if (typeof inclusive !== 'boolean' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(callbackId) || ['source', 'notifier'].includes(callbackId)) throw new TypeError('invalid predicate profile');
  const taking = operator === 'takeWhile';
  const prefix = operator.toUpperCase();
  const matches = (s: WhileState<T>, e: WhileEvent<T>): boolean => s.phase === 'Calling' &&
    (e.type === 'callback.return' || e.type === 'callback.throw') && e.resource.id === callbackId && e.resource.generation === s.callId;
  const rules: Rule<WhileParameters, WhileState<T>, WhileEvent<T>, Action<T, T>>[] = [
    {
      description: description(prefix, 'INIT', 'Unsubscribed', 'subscribe', 'fresh execution', 'Testing', ['subscribe to the source'], 'testing with index zero', '01',
        'A result subscription connects to the source and starts its own predicate index at zero. No predicate runs until a source value arrives.'),
      enabled: () => true, react: () => ({ state: { phase: 'Testing', index: 0 }, actions: [acquire] }),
    },
    {
      description: description(prefix, 'CALL', 'Testing', 'source.next', 'index < MAX_SAFE_INTEGER', 'Calling', ['invoke the predicate once with the input and its zero-based index'], 'calling with retained input, invocation identity and advanced index', '02',
        'While testing, each source value requests one predicate call with the original value and its zero-based index. The predicate belongs to the user; the operator controls when it is called.'),
      enabled: s => s.phase === 'Testing' && s.index < Number.MAX_SAFE_INTEGER,
      react: (s, e) => {
        if (s.phase !== 'Testing' || e.type !== 'source.next') throw new Error('invalid predicate request');
        return { state: { phase: 'Calling', index: s.index + 1, callId: s.index, input: e.value }, actions: [
          { type: 'invoke-callback', resource: { id: callbackId, generation: s.index }, value: e.value, index: s.index },
        ] };
      },
    },
  ];
  for (const truthy of [true, false]) rules.push({
    description: description(prefix, truthy ? 'TRUE' : 'FALSE', 'Calling', 'callback.return', `matching invocation and ${truthy ? 'truthy' : 'falsy'} result`,
      truthy ? 'Testing' : taking ? 'Closed' : 'Open',
      taking ? truthy ? ['forward the original value'] : [...(inclusive ? ['forward the first predicate-failing value'] : []), 'complete downstream', 'release the source'] : truthy ? [] : ['forward the first predicate-failing value'],
      truthy ? 'testing with the already advanced index' : taking ? 'closed because the predicate failed' : 'permanently open; predicate no longer called', '03',
      taking ? truthy ? 'A truthy predicate result forwards the original value and continues testing.' :
        inclusive ? 'The first falsy predicate result forwards that value, completes downstream and releases the source, in that order.' : 'The first falsy predicate result completes downstream without forwarding that value and releases the source.' :
        truthy ? 'A truthy predicate result drops the value and keeps the gate closed.' : 'The first falsy predicate result opens the gate and forwards that same value. Later values no longer invoke the predicate.'),
    enabled: (s, e) => matches(s, e) && e.type === 'callback.return' && Boolean(e.value) === truthy,
    react: (s, e) => {
      if (s.phase !== 'Calling' || e.type !== 'callback.return') throw new Error('invalid predicate result');
      if (truthy) return { state: { phase: 'Testing', index: s.index }, actions: taking ? [next(s.input)] : [] };
      return taking ? { state: { phase: 'Closed', reason: 'predicate-false' }, actions: [...(inclusive ? [next(s.input)] : []), complete, release] } :
        { state: { phase: 'Open' }, actions: [next(s.input)] };
    },
  });
  if (!taking) rules.push({
    description: description(prefix, 'OPEN-PASS', 'Open', 'source.next', 'gate has opened', 'Open', ['forward the incoming value without invoking the predicate'], 'still permanently open', '04',
      'Once open, skipWhile forwards all subsequent values unchanged. The predicate is not called again, even for a later value that would have satisfied it.'),
    enabled: () => true, react: (_s, e) => {
      if (e.type !== 'source.next') throw new Error('invalid open value');
      return { state: { phase: 'Open' }, actions: [next(e.value)] };
    },
  });
  rules.push({
    description: description(prefix, 'THROW', 'Calling', 'callback.throw', 'matching pending invocation', 'Closed', ['forward the thrown value unchanged as an error', 'release the source'], 'closed because the predicate threw', '05',
      'A predicate throw errors downstream and releases the source. The failing input is never emitted, including with inclusive takeWhile.'),
    enabled: matches, react: (_s, e) => {
      if (e.type !== 'callback.throw') throw new Error('invalid predicate throw');
      return { state: { phase: 'Closed', reason: 'callback-error' }, actions: [error<T>(e.error), release] };
    },
  });
  for (const phase of taking ? ['Testing'] as const : ['Testing', 'Open'] as const) {
    for (const type of ['source.complete', 'source.error', 'cancel'] as const) rules.push({
      description: description(prefix, `${phase.toUpperCase()}-${type === 'cancel' ? 'CANCEL' : type === 'source.error' ? 'ERROR' : 'COMPLETE'}`, phase, type, 'no unresolved predicate invocation', 'Closed',
        type === 'cancel' ? ['release the source without notifying downstream'] : [type === 'source.error' ? 'forward the source error unchanged' : 'complete downstream', 'release the source'],
        `closed because of ${terminalReason(type)}`, '06',
        type === 'cancel' ? `Cancellation from ${phase} releases the source and does not complete downstream.` : type === 'source.error' ? `A source error from ${phase} is forwarded without calling the predicate, then releases the source.` : `Source completion from ${phase} completes downstream and releases the source without another predicate call or value.`),
      enabled: () => true,
      react: (_s, e) => {
        if (e.type !== 'source.complete' && e.type !== 'source.error' && e.type !== 'cancel') throw new Error('invalid terminal');
        return { state: { phase: 'Closed', reason: terminalReason(e.type) }, actions: terminalActions(e) };
      },
    });
  }
  return {
    metadata: unaryMetadata(operator, taking ? `${callbackId}-${inclusive ? 'inclusive' : 'exclusive'}` : callbackId,
      taking ? `inclusive=${inclusive}; named predicate; safe-integer indices` : 'Named predicate; safe-integer indices until the gate opens', callbackId),
    parameters: { operator, inclusive, callbackId }, rules,
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      if (s.phase === 'Testing') return safeIndex(s.index) ? [] : ['invalid predicate index'];
      if (s.phase === 'Calling') return safeIndex(s.callId) && s.callId < Number.MAX_SAFE_INTEGER && s.index === s.callId + 1 && Object.hasOwn(s, 'input') ? [] : ['invalid pending predicate'];
      if (s.phase === 'Open') return taking ? ['takeWhile cannot open a bypass gate'] : [];
      return s.phase === 'Closed' && ['complete', 'source-error', 'callback-error', 'cancel', ...(taking ? ['predicate-false'] : [])].includes(s.reason) ? [] : ['invalid predicate state'];
    },
    validateReaction: (before, e, r) => {
      const errors = [...validateActionWord(r.actions)];
      let expected: readonly Action<T, T>[];
      if (e.type === 'subscribe') expected = [acquire];
      else if (e.type === 'source.next' && before.phase === 'Testing') {
        expected = [{ type: 'invoke-callback', resource: { id: callbackId, generation: before.index }, value: e.value, index: before.index }];
        if (r.state.phase !== 'Calling' || r.state.index !== before.index + 1 || r.state.callId !== before.index || !Object.is(r.state.input, e.value)) errors.push('predicate request state invariant');
      } else if (e.type === 'source.next' && before.phase === 'Open') expected = [next(e.value)];
      else if (e.type === 'callback.return' && before.phase === 'Calling') {
        const yes = Boolean(e.value);
        expected = taking ? yes ? [next(before.input)] : [...(inclusive ? [next(before.input)] : []), complete, release] : yes ? [] : [next(before.input)];
        const target = yes ? 'Testing' : taking ? 'Closed' : 'Open';
        if (r.state.phase !== target || (r.state.phase === 'Testing' && r.state.index !== before.index)) errors.push('predicate result state invariant');
      } else if (e.type === 'callback.throw') expected = [error<T>(e.error), release];
      else if (e.type === 'source.complete' || e.type === 'source.error' || e.type === 'cancel') expected = terminalActions(e);
      else return [...errors, 'unrecognized predicate reaction'];
      if (!gatingActionWordsEqual(r.actions, expected)) errors.push('predicate ordered-action/identity invariant');
      return errors;
    },
  };
}

export const createTakeWhileModel = <T>(inclusive = false, callbackId = 'predicate'): WhileModel<T> => createWhileModel<T>('takeWhile', inclusive, callbackId);
export const createSkipWhileModel = <T>(callbackId = 'predicate'): WhileModel<T> => createWhileModel<T>('skipWhile', false, callbackId);

export const skipExample: readonly TimedEvent<SkipEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 'a' } },
  { time: 2, event: { type: 'source.next', value: 'b' } },
  { time: 3, event: { type: 'source.next', value: 'c' } },
  { time: 4, event: { type: 'source.complete' } },
];
export const takeWhileExample: readonly TimedEvent<WhileEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 1 } },
  { time: 1, event: { type: 'callback.return', resource: { id: 'predicate', generation: 0 }, value: true } },
  { time: 2, event: { type: 'source.next', value: 3 } },
  { time: 2, event: { type: 'callback.return', resource: { id: 'predicate', generation: 1 }, value: false } },
];
export const skipWhileExample: readonly TimedEvent<WhileEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 1 } },
  { time: 1, event: { type: 'callback.return', resource: { id: 'predicate', generation: 0 }, value: true } },
  { time: 2, event: { type: 'source.next', value: 3 } },
  { time: 2, event: { type: 'callback.return', resource: { id: 'predicate', generation: 1 }, value: false } },
  { time: 3, event: { type: 'source.next', value: 1 } },
  { time: 4, event: { type: 'source.complete' } },
];
