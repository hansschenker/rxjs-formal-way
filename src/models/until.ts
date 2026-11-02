import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, RuleDescription, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { gatingActionWordsEqual } from './gating.js';

export type UntilOperator = 'takeUntil' | 'skipUntil';
export type UntilParameters = Readonly<{ operator: UntilOperator }>;
export type UntilCloseReason = 'complete' | 'source-error' | 'notifier-next' | 'notifier-error' | 'cancel';
export type UntilState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Starting'; open: boolean; notifierLive: boolean }>
  | Readonly<{ phase: 'Active'; open: boolean; notifierLive: boolean }>
  /** RxJS 7.8.2 skipUntil still calls source.subscribe with a closed subscriber after a synchronous notifier error. */
  | Readonly<{ phase: 'StoppedBeforeSource'; reason: 'notifier-error' }>
  | Readonly<{ phase: 'Closed'; reason: UntilCloseReason }>;
export type UntilEvent<T> =
  | Readonly<{ type: 'subscribe' | 'setup.ready' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'notifier.next'; resource: ResourceRef; value: unknown }>
  | Readonly<{ type: 'notifier.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'notifier.error'; resource: ResourceRef; error: unknown }>;
export type UntilModel<T> = OperatorModel<UntilParameters, UntilState, UntilEvent<T>, Action<T>>;

const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const source = { id: 'source', generation: 0 } as const;
const notifier = { id: 'notifier', generation: 0 } as const;
const acquireSource = { type: 'subscribe', resource: source } as const;
const releaseSource = { type: 'unsubscribe', resource: source } as const;
const acquireNotifier = { type: 'subscribe', resource: notifier } as const;
const releaseNotifier = { type: 'unsubscribe', resource: notifier } as const;
const complete = { type: 'notify', target: 'downstream', notification: { kind: 'C' } } as const;
const next = <T>(value: T): Action<T> => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const error = <T>(value: unknown): Action<T> => ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: value } });
const cleanup = (s: UntilState): readonly Action<never>[] => s.phase === 'Starting' || s.phase === 'Active' ?
  [...(s.notifierLive ? [releaseNotifier] : []), ...(s.phase === 'Active' ? [releaseSource] : [])] : [];
const liveNotifier = <T>(s: UntilState, e: UntilEvent<T>): boolean => (s.phase === 'Starting' || s.phase === 'Active') && s.notifierLive &&
  (e.type === 'notifier.next' || e.type === 'notifier.complete' || e.type === 'notifier.error') && e.resource.id === 'notifier' && e.resource.generation === 0;

function metadata(operator: UntilOperator): ModelMetadata {
  const taking = operator === 'takeUntil';
  return {
    schemaVersion: '1.1', id: `${operator}-Observable-notifier`, operator, rxjsVersion: '7.8.2',
    purpose: taking ? 'Forward source values until the first notifier value completes the result.' : 'Drop source values until the first notifier value permanently opens the gate.',
    cardinality: { signature: `${operator} : U* -> T* -> T*`, conditions: [
      taking ? 'Forward a prefix of source values before the notifier signal or another terminating event.' : 'Forward a suffix beginning after the notifier signal; skipped source values are not buffered.',
      'Notifier values never become output values. Every next is a signal, including undefined, false and null. Completion without next is not a signal.',
      'The shape counts values, not notifications, subscriptions or setup continuation steps.',
    ] },
    scope: { parameters: 'A valid Observable notifier; one source and one notifier occurrence per result subscription',
      callbacks: 'No user predicate. setup.ready is an environment continuation marking return from notifier subscription, not a user callback or scheduler turn.',
      time: 'Source and notifier supply time and ordering. No timer is introduced. Setup and synchronous notifier delivery occur at the subscription timestamp; equal-time inputs retain sequence order.',
      reentrancy: 'Non-reentrant post-setup notifications plus explicitly modeled synchronous notifier initialization. Arbitrary nested delivery and cancellation within setup remain excluded.',
      exclusions: ['Non-Observable ObservableInput conversion, throwing observers/finalizers, arbitrary reentry and producer-abort guarantees.',
        'Source synchronous delivery/finalizer-registration order is characterized separately from exact post-setup action traces.',
        'subscribe/unsubscribe actions describe subscription lifecycle; an already-closed source attempt is not a live source connection.'] },
    initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: taking ?
      'Subscribe to notifier first. After setup.ready, connect source only if no synchronous notifier next/error already closed the result.' :
      'Subscribe to notifier first, then source. A synchronous notifier next opens the gate; a synchronous error still leads to an already-closed source subscription attempt in RxJS 7.8.2.' },
    ownership: { state: 'subscription-local', sharing: 'No sharing introduced. Each result subscription owns its gate and source/notifier subscriptions; either producer may independently be hot or shared.',
      reset: 'A new execution creates fresh gate state. Late producer attempts are suppressed by closed RxJS Subscribers and are not legal model notifications.',
      resources: [{ id: 'notifier', kind: 'subscription', owner: 'current execution; acquired first' }, { id: 'source', kind: 'subscription', owner: 'current execution; attempted after notifier setup' }] },
    dispatch: { policy: 'atomic-non-reentrant', actionSemantics: 'Notifier setup is explicit. Resolve synchronous notifier events, then setup.ready. After setup, terminal notification precedes cleanup in notifier-then-source registration order. skipUntil opening releases notifier without notifying downstream.',
      cancellationCheckpoints: ['Active between resolved notifications: release live notifier and source, without completing downstream.', 'Cancellation inside notifier setup or observer callbacks is outside the exact-trace profile.'] },
    inputs: [
      { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'a fresh result subscription connects' },
      { type: 'setup.ready', origin: 'environment', category: 'lifecycle', description: 'notifier subscription returns and synchronous initialization continues' },
      { type: 'source.next', origin: 'source', category: 'notification', description: 'the connected source delivers a value' },
      { type: 'source.complete', origin: 'source', category: 'notification', description: 'the connected source completes' },
      { type: 'source.error', origin: 'source', category: 'notification', description: 'the connected source errors' },
      { type: 'notifier.next', origin: 'inner', category: 'notification', description: 'the live notifier delivers a value' },
      { type: 'notifier.complete', origin: 'inner', category: 'notification', description: 'the notifier completes without another value' },
      { type: 'notifier.error', origin: 'inner', category: 'notification', description: 'the notifier errors' },
      { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream cancels after setup' },
    ],
    actionTypes: ['subscribe', 'notify', 'unsubscribe'],
    controls: [
      { id: 'Unsubscribed', description: 'no subscriptions acquired', terminal: false },
      { id: 'Starting', description: 'notifier setup in progress; source not attempted yet', terminal: false },
      { id: 'Active', description: 'source acquired; gate and notifier liveness remembered', terminal: false },
      ...(!taking ? [{ id: 'StoppedBeforeSource', description: 'downstream errored; one closed-subscriber source attempt still follows', terminal: false }] : []),
      { id: 'Closed', description: 'downstream terminated or cancelled; no pending setup work', terminal: true },
    ],
    sources: [`src/internal/operators/${operator}.ts`, 'src/internal/operators/OperatorSubscriber.ts', 'src/internal/Subscriber.ts', 'src/internal/Observable.ts', 'src/internal/Subscription.ts'].map(path => ({
      url: `https://github.com/ReactiveX/rxjs/blob/${revision}/${path}`, revision, purpose: 'Pinned notifier-first setup, closed-subscriber source attempts and teardown order',
    })),
    evidence: { modelTests: ['tests/session05-model.test.mjs'], runtimeTests: ['tests/session05-rxjs.test.mjs'], status: 'source-inspected', record: 'evidence/SESSION-05.md' },
  };
}

function createUntilModel<T>(operator: UntilOperator): UntilModel<T> {
  const taking = operator === 'takeUntil';
  const prefix = operator.toUpperCase();
  const d = (id: string, from: string, event: string, guard: string, to: string, actions: readonly string[], nextState: string, witness: string, explanation: string): RuleDescription =>
    ({ id: `${prefix}-${id}`, from, event, guard, to, actions, nextState, obligations: [`S5-${prefix}-${witness}`], explanation });
  const rules: Rule<UntilParameters, UntilState, UntilEvent<T>, Action<T>>[] = [
    {
      description: d('INIT', 'Unsubscribed', 'subscribe', 'fresh execution', 'Starting', ['subscribe to the notifier, before the source'],
        taking ? 'starting with an open source gate' : 'starting with a closed source gate', 'SETUP',
        `${operator} subscribes to the notifier before attempting the source subscription. Construction alone acquires neither subscription.`),
      enabled: () => true, react: () => ({ state: { phase: 'Starting', open: taking, notifierLive: true }, actions: [acquireNotifier] }),
    },
    {
      description: d('SOURCE-CONNECT', 'Starting', 'setup.ready', 'notifier setup returned without terminating downstream', 'Active', ['subscribe to the source'],
        'active with the existing gate and notifier-liveness state', 'SETUP', 'After notifier setup returns, an unterminated result connects to the source using the gate state established by any synchronous notifier notifications.'),
      enabled: () => true, react: s => {
        if (s.phase !== 'Starting') throw new Error('invalid setup continuation');
        return { state: { ...s, phase: 'Active' }, actions: [acquireSource] };
      },
    },
  ];
  for (const phase of ['Starting', 'Active'] as const) {
    const where = phase === 'Starting' ? 'SETUP' : 'LIVE';
    rules.push({
      description: d(`${where}-NOTIFIER-NEXT`, phase, 'notifier.next', 'matching live notifier subscription', taking ? 'Closed' : phase,
        taking ? ['complete downstream', 'release notifier', ...(phase === 'Active' ? ['release source'] : [])] : ['release notifier without emitting any value'],
        taking ? 'closed because notifier emitted' : 'gate permanently open with notifier disconnected', phase === 'Starting' ? 'SETUP' : 'SIGNAL',
        taking ? `Any notifier value completes the result${phase === 'Starting' ? ' before the source is subscribed' : ' and releases notifier then source'}. The notifier payload is not emitted.` :
          'The first notifier value releases the notifier and permanently opens the gate. It emits no source value and does not replay previously skipped values.'),
      enabled: liveNotifier, react: s => {
        if (s.phase !== phase) throw new Error('invalid notifier signal');
        return taking ? { state: { phase: 'Closed', reason: 'notifier-next' }, actions: [complete, ...cleanup(s)] } :
          { state: { ...s, open: true, notifierLive: false }, actions: [releaseNotifier] };
      },
    });
    rules.push({
      description: d(`${where}-NOTIFIER-COMPLETE`, phase, 'notifier.complete', 'matching live notifier subscription', phase, ['release notifier without completing downstream or changing the gate'],
        'same gate with notifier disconnected', phase === 'Starting' ? 'SETUP' : 'EMPTY',
        taking ? 'Notifier completion without a value does not stop takeUntil. The notifier is released and source values may continue.' :
          'Notifier completion without a value does not open skipUntil. Source values continue to be skipped until the source itself terminates or downstream cancels.'),
      enabled: liveNotifier, react: s => {
        if (s.phase !== phase) throw new Error('invalid notifier completion');
        return { state: { ...s, notifierLive: false }, actions: [releaseNotifier] };
      },
    });
    rules.push({
      description: d(`${where}-NOTIFIER-ERROR`, phase, 'notifier.error', 'matching live notifier subscription', !taking && phase === 'Starting' ? 'StoppedBeforeSource' : 'Closed',
        ['forward the notifier error unchanged', 'release notifier', ...(phase === 'Active' ? ['release source'] : [])],
        !taking && phase === 'Starting' ? 'downstream stopped but closed-subscriber source attempt still pending' : 'closed because notifier errored', 'ERROR',
        !taking && phase === 'Starting' ? 'A synchronous notifier error stops downstream. RxJS 7.8.2 skipUntil nevertheless continues to source.subscribe with an already-closed subscriber after notifier setup returns.' :
          `A notifier error is forwarded unchanged and releases the owned subscriptions${phase === 'Starting' ? ', without acquiring the source' : ''}.`),
      enabled: liveNotifier, react: (s, e) => {
        if (s.phase !== phase || e.type !== 'notifier.error') throw new Error('invalid notifier error');
        return { state: !taking && phase === 'Starting' ? { phase: 'StoppedBeforeSource', reason: 'notifier-error' } : { phase: 'Closed', reason: 'notifier-error' }, actions: [error<T>(e.error), ...cleanup(s)] };
      },
    });
  }
  if (!taking) rules.push({
    description: d('CLOSED-SOURCE-ATTEMPT', 'StoppedBeforeSource', 'setup.ready', 'notifier setup returned after synchronous error', 'Closed', ['attempt source subscription with an already-closed subscriber', 'dispose the returned source teardown immediately'],
      'fully closed with no live subscriptions', 'ERROR',
      'Because skipUntil has no closed check before source.subscribe, a source initializer can still run with subscriber.closed already true. Any returned teardown is immediately disposed and no downstream value or second terminal notification is allowed.'),
    enabled: () => true, react: () => ({ state: { phase: 'Closed', reason: 'notifier-error' }, actions: [acquireSource, releaseSource] }),
  });
  for (const open of taking ? [true] : [false, true]) rules.push({
    description: d(open ? 'PASS' : 'DROP', 'Active', 'source.next', open ? 'gate is open' : 'gate is closed', 'Active',
      open ? ['forward the source value unchanged'] : [], 'same gate and notifier-liveness state', 'VALUES',
      open ? 'With the gate open, source values are forwarded unchanged.' : 'With the gate closed, source values are dropped without buffering. A later notifier signal does not recover them.'),
    enabled: s => s.phase === 'Active' && s.open === open,
    react: (s, e) => {
      if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid source value');
      return { state: s, actions: open ? [next(e.value)] : [] };
    },
  });
  for (const type of ['source.complete', 'source.error', 'cancel'] as const) rules.push({
    description: d(type === 'cancel' ? 'CANCEL' : type === 'source.error' ? 'SOURCE-ERROR' : 'SOURCE-COMPLETE', 'Active', type, 'source connected, regardless of gate state', 'Closed',
      [...(type === 'source.complete' ? ['complete downstream'] : type === 'source.error' ? ['forward the source error unchanged'] : []), 'release notifier if still live, then release source'],
      `closed because of ${type}`, 'TERMINAL',
      type === 'cancel' ? 'Cancellation releases the live notifier, if any, and the source, without sending completion.' : type === 'source.error' ?
        'A source error is forwarded even while the skipUntil gate is closed, then releases both owned subscriptions.' :
        'Source completion completes downstream even while the skipUntil gate is closed. It releases the notifier if still live, then the source.'),
    enabled: () => true, react: (s, e) => {
      if (s.phase !== 'Active' || (e.type !== 'source.complete' && e.type !== 'source.error' && e.type !== 'cancel')) throw new Error('invalid source terminal');
      return { state: { phase: 'Closed', reason: e.type === 'cancel' ? 'cancel' : e.type === 'source.error' ? 'source-error' : 'complete' },
        actions: [...(e.type === 'source.complete' ? [complete] : e.type === 'source.error' ? [error<T>(e.error)] : []), ...cleanup(s)] };
    },
  });
  return {
    metadata: metadata(operator), parameters: { operator }, rules,
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      if (s.phase === 'Starting' || s.phase === 'Active') return typeof s.open === 'boolean' && typeof s.notifierLive === 'boolean' &&
        (taking ? s.open : !(s.open && s.notifierLive)) ? [] : ['invalid notifier gate/liveness'];
      if (s.phase === 'StoppedBeforeSource') return !taking && s.reason === 'notifier-error' ? [] : ['invalid stopped setup'];
      return s.phase === 'Closed' && ['complete', 'source-error', 'notifier-error', 'cancel', ...(taking ? ['notifier-next'] : [])].includes(s.reason) ? [] : ['invalid until state'];
    },
    validateReaction: (s, e, r) => {
      const errors = [...validateActionWord(r.actions)];
      let expected: readonly Action<T>[];
      if (e.type === 'subscribe') expected = [acquireNotifier];
      else if (e.type === 'setup.ready') expected = s.phase === 'StoppedBeforeSource' ? [acquireSource, releaseSource] : [acquireSource];
      else if (e.type === 'notifier.next') expected = taking ? [complete, ...cleanup(s)] : [releaseNotifier];
      else if (e.type === 'notifier.complete') expected = [releaseNotifier];
      else if (e.type === 'notifier.error') expected = [error<T>(e.error), ...cleanup(s)];
      else if (e.type === 'source.next' && s.phase === 'Active') expected = s.open ? [next(e.value)] : [];
      else if (e.type === 'source.complete') expected = [complete, ...cleanup(s)];
      else if (e.type === 'source.error') expected = [error<T>(e.error), ...cleanup(s)];
      else if (e.type === 'cancel') expected = cleanup(s);
      else return [...errors, 'unrecognized notifier reaction'];
      if (!gatingActionWordsEqual(r.actions, expected)) errors.push('until ordered-action/identity invariant');
      if ((s.phase === 'Starting' || s.phase === 'Active') && (r.state.phase === 'Starting' || r.state.phase === 'Active')) {
        const expectedOpen = e.type === 'notifier.next' ? true : s.open;
        const expectedLive = e.type === 'notifier.next' || e.type === 'notifier.complete' ? false : s.notifierLive;
        if (r.state.open !== expectedOpen || r.state.notifierLive !== expectedLive) errors.push('until gate/liveness transition invariant');
      }
      return errors;
    },
  };
}

export const createTakeUntilModel = <T>(): UntilModel<T> => createUntilModel<T>('takeUntil');
export const createSkipUntilModel = <T>(): UntilModel<T> => createUntilModel<T>('skipUntil');
export const takeUntilExample: readonly TimedEvent<UntilEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 0, event: { type: 'setup.ready' } },
  { time: 1, event: { type: 'source.next', value: 'a' } },
  { time: 2, event: { type: 'source.next', value: 'b' } },
  { time: 3, event: { type: 'notifier.next', resource: notifier, value: false } },
];
export const skipUntilExample: readonly TimedEvent<UntilEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 0, event: { type: 'setup.ready' } },
  { time: 1, event: { type: 'source.next', value: 'a' } },
  { time: 2, event: { type: 'notifier.next', resource: notifier, value: false } },
  { time: 3, event: { type: 'source.next', value: 'b' } },
  { time: 4, event: { type: 'source.complete' } },
];
