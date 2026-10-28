import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule } from '../schema.js';
import { validateActionWord } from '../runner.js';

export type ValueParameters = Readonly<{ callbackId: string }>;
export type ValueState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; index: number }>
  | Readonly<{ phase: 'Calling'; index: number; callId: number; input: T }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'callback-error' | 'cancel' }>;
export type ValueEvent<T, Result> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; value: Result }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>;
export type ValueModel<T, Output, Result> = OperatorModel<ValueParameters, ValueState<T>, ValueEvent<T, Result>, Action<Output, T>>;

const source = { id: 'source', generation: 0 } as const;
const acquire = { type: 'subscribe', resource: source } as const;
const release = { type: 'unsubscribe', resource: source } as const;
const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const close = <T>(reason: Extract<ValueState<T>, { phase: 'Closed' }>['reason']): ValueState<T> => ({ phase: 'Closed', reason });
const validIndex = (index: number): boolean => Number.isSafeInteger(index) && index >= 0;

function metadata(operator: 'map' | 'filter', callbackId: string): ModelMetadata {
  const isMap = operator === 'map';
  return {
    schemaVersion: '1.1', id: `${operator}-${callbackId}`, operator, rxjsVersion: '7.8.2',
    purpose: isMap ? 'Transform each incoming value through a supplied projection without changing its delivery policy.' : 'Forward the original incoming value only when the supplied predicate returns a truthy result.',
    cardinality: { signature: isMap ? 'map : (T! x Index! -> R!) -> T* -> R*' : 'filter : (T! x Index! -> Boolean!) -> T* -> T*',
      conditions: [
        isMap ? 'One output per successfully returned projection while the subscription remains active; throwing produces an error instead.' : 'Zero or one output per predicate result; dropped values still consume an input index.',
        'Signatures describe successful value flow, not guarantees against errors or cancellation.',
        'The full callback receives a zero-based source-notification index. Filter runtime truthiness is modeled even though its usual TypeScript predicate returns boolean.',
      ] },
    scope: { parameters: 'A named callback binding; nonnegative safe-integer callback indices below overflow',
      callbacks: 'Callback invocation is an action; return/throw is a correlated input. No callback function runs inside a guard, reaction, validator, or generator.',
      time: 'No timer or clock is introduced. Calling is a synchronous logical phase, not a scheduled delay; example sequence numbers order same-frame events.',
      reentrancy: 'Non-reentrant source, callback and observer behavior; cancellation only between fully resolved value reactions.',
      exclusions: ['Deprecated thisArg overload and invalid non-function callback arguments.', 'Nested notifications or cancellation inside callbacks or observer delivery; throwing observers or finalizers.', 'Counter precision loss beyond the safe-integer domain; proof of TypeScript predicate narrowing.', 'A production callback/effect interpreter, runtime snapshot codec, or callback purity guarantee.'] },
    initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: 'Acquire exactly one source subscription; no invocation before its first next.' },
    ownership: { state: 'subscription-local', sharing: 'No sharing introduced. Each result subscription has its own index, even with a shared or hot producer.',
      reset: 'A fresh execution starts at index zero. Closed executions have no admissible inputs.',
      resources: [{ id: 'source', kind: 'subscription', owner: 'current execution' },
        { id: callbackId, kind: 'callback', owner: 'external binding; invocation identity belongs to this execution' }] },
    dispatch: { policy: 'atomic-non-reentrant',
      actionSemantics: 'Source next creates one invoke-callback request, with its pre-increment index. Only its correlated return/throw is admissible while Calling. Resolve it before another external input; no callback is executed by the specification runner.',
      cancellationCheckpoints: ['Active between resolved source reactions; release upstream without complete.', 'Cancellation during Calling or downstream notification delivery requires a refined profile and is excluded.'] },
    inputs: [
      { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'a fresh downstream execution subscribes' },
      { type: 'source.next', origin: 'source', category: 'notification', description: 'the source delivers a value' },
      { type: 'callback.return', origin: 'callback', category: 'callback', description: 'the pending callback returns a result' },
      { type: 'callback.throw', origin: 'callback', category: 'callback', description: 'the pending callback throws' },
      { type: 'source.complete', origin: 'source', category: 'notification', description: 'the source completes' },
      { type: 'source.error', origin: 'source', category: 'notification', description: 'the source errors' },
      { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream unsubscribes' },
    ],
    actionTypes: ['subscribe', 'invoke-callback', 'notify', 'unsubscribe'],
    controls: [
      { id: 'Unsubscribed', description: 'not connected; callback has not run', terminal: false },
      { id: 'Active', description: 'connected; remembers the next callback index', terminal: false },
      { id: 'Calling', description: 'one unresolved synchronous callback; retains its input and invocation identity', terminal: false },
      { id: 'Closed', description: 'complete, errored or cancelled; no legal inputs', terminal: true },
    ],
    sources: [`src/internal/operators/${operator}.ts`, 'src/internal/operators/OperatorSubscriber.ts', 'src/internal/Subscriber.ts'].map(path => ({
      url: `https://github.com/ReactiveX/rxjs/blob/${revision}/${path}`, revision, purpose: 'Pinned callback index, return/throw, notification and lifecycle behavior',
    })),
    evidence: { modelTests: ['tests/m02-model.test.mjs'], runtimeTests: ['tests/m02-rxjs.test.mjs'], status: 'source-inspected', record: 'evidence/M02.md' },
  };
}

/** Shared lifecycle specification. Successful return rules are supplied by each operator, not business functions. */
export function createValueModel<T, Output, Result>(
  operator: 'map' | 'filter', callbackId: string,
  returns: readonly Rule<ValueParameters, ValueState<T>, ValueEvent<T, Result>, Action<Output, T>>[],
): ValueModel<T, Output, Result> {
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(callbackId) || callbackId === 'source') throw new TypeError('callbackId must be a distinct identifier, not source');
  const prefix = operator.toUpperCase();
  const witness = (suffix: string): readonly string[] => [`M02-${prefix}-${suffix}`];
  const rules: readonly Rule<ValueParameters, ValueState<T>, ValueEvent<T, Result>, Action<Output, T>>[] = [
    {
      description: { id: `${prefix}-INIT`, from: 'Unsubscribed', event: 'subscribe', guard: 'fresh execution', to: 'Active',
        actions: ['subscribe to the source without invoking the callback'], nextState: 'active with callback index zero', obligations: witness('01'),
        explanation: `Subscribing to ${operator} connects to the source and starts a fresh callback index at zero. Constructing the pipeline does not invoke the callback.` },
      enabled: () => true,
      react: () => ({ state: { phase: 'Active', index: 0 }, actions: [acquire] }),
    },
    {
      description: { id: `${prefix}-CALL`, from: 'Active', event: 'source.next', guard: 'index < Number.MAX_SAFE_INTEGER', to: 'Calling',
        actions: ['request exactly one callback invocation with the incoming value and the current zero-based index'], nextState: 'calling with the input retained and the next index increased by one', obligations: witness('02'),
        explanation: 'Each incoming value invokes the supplied function once with that value and its zero-based source index. The index advances for every invocation, independently of whether a value is subsequently forwarded.' },
      enabled: s => s.phase === 'Active' && s.index < Number.MAX_SAFE_INTEGER,
      react: (s, e, p) => {
        if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid callback input');
        return { state: { phase: 'Calling', index: s.index + 1, callId: s.index, input: e.value },
          actions: [{ type: 'invoke-callback', resource: { id: p.callbackId, generation: s.index }, index: s.index, value: e.value }] };
      },
    },
    ...returns,
    {
      description: { id: `${prefix}-THROW`, from: 'Calling', event: 'callback.throw', guard: 'outcome identifies the pending invocation', to: 'Closed',
        actions: ['forward the thrown error unchanged', 'release the source subscription'], nextState: 'closed because the callback threw', obligations: witness('04'),
        explanation: 'If the supplied function throws, the thrown value is sent through the error channel and the source subscription is released. The failing input produces no next notification and no completion follows.' },
      enabled: matchesInvocation,
      react: (_s, e) => {
        if (e.type !== 'callback.throw') throw new Error('invalid callback throw');
        return { state: close('callback-error'), actions: [{ type: 'notify', target: 'downstream', notification: { kind: 'E', error: e.error } }, release] };
      },
    },
    {
      description: { id: `${prefix}-COMPLETE`, from: 'Active', event: 'source.complete', guard: 'no unresolved callback', to: 'Closed',
        actions: ['complete downstream', 'release the source subscription'], nextState: 'closed because the source completed', obligations: witness('05'),
        explanation: 'Source completion is forwarded without invoking the callback or creating another value. The source subscription is released.' },
      enabled: () => true,
      react: () => ({ state: close('complete'), actions: [{ type: 'notify', target: 'downstream', notification: { kind: 'C' } }, release] }),
    },
    {
      description: { id: `${prefix}-ERROR`, from: 'Active', event: 'source.error', guard: 'no unresolved callback', to: 'Closed',
        actions: ['forward the source error unchanged', 'release the source subscription'], nextState: 'closed because the source errored', obligations: witness('06'),
        explanation: 'A source error is forwarded unchanged without invoking the callback. It releases the source subscription and is not followed by completion.' },
      enabled: () => true,
      react: (_s, e) => {
        if (e.type !== 'source.error') throw new Error('invalid source error');
        return { state: close('source-error'), actions: [{ type: 'notify', target: 'downstream', notification: { kind: 'E', error: e.error } }, release] };
      },
    },
    {
      description: { id: `${prefix}-CANCEL`, from: 'Active', event: 'cancel', guard: 'between resolved value reactions', to: 'Closed',
        actions: ['release the source subscription without notifying downstream'], nextState: 'closed because downstream cancelled', obligations: witness('07'),
        explanation: 'Downstream cancellation releases the source subscription and stops further callback invocations. Cancellation does not emit completion.' },
      enabled: () => true,
      react: () => ({ state: close('cancel'), actions: [release] }),
    },
  ];
  return {
    parameters: { callbackId }, metadata: metadata(operator, callbackId), rules,
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      if (s.phase === 'Active') return validIndex(s.index) ? [] : ['invalid callback index'];
      if (s.phase === 'Calling') return validIndex(s.index) && validIndex(s.callId) && s.index === s.callId + 1 && s.callId < Number.MAX_SAFE_INTEGER && Object.hasOwn(s, 'input') ? [] : ['invalid pending callback'];
      return s.phase === 'Closed' && ['complete', 'source-error', 'callback-error', 'cancel'].includes(s.reason) ? [] : ['invalid control state'];
    },
    validateReaction: (before, event, result, p) => {
      const errors = [...validateActionWord(result.actions)];
      for (const action of result.actions) {
        if (action.type === 'invoke-callback') {
          if (before.phase !== 'Active' || event.type !== 'source.next' || action.resource.id !== p.callbackId || action.index !== before.index || !Object.is(action.value, event.value)) errors.push('invalid invocation request');
        } else if (action.type === 'notify') {
          if (action.target !== 'downstream') errors.push('unknown subscriber');
        } else if (!['subscribe', 'unsubscribe'].includes(action.type) || action.resource.id !== 'source' || action.resource.generation !== 0) errors.push('unknown lifecycle action');
      }
      if (result.state.phase === 'Calling' && (result.actions.length !== 1 || result.actions[0]?.type !== 'invoke-callback')) errors.push('Calling requires exactly one request');
      if (result.state.phase !== 'Calling' && result.actions.some(a => a.type === 'invoke-callback')) errors.push('invocation requires Calling');
      if (result.state.phase === 'Active' && result.actions.some(a => a.type === 'notify' && a.notification.kind !== 'N')) errors.push('active after terminal');
      return errors;
    },
  };
}

/** Check only identity and state. Never evaluate a user callback in a guard. */
export function matchesInvocation<T, Result>(s: ValueState<T>, e: ValueEvent<T, Result>, p: ValueParameters): boolean {
  return s.phase === 'Calling' && (e.type === 'callback.return' || e.type === 'callback.throw') &&
    e.resource.id === p.callbackId && e.resource.generation === s.callId;
}
