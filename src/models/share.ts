import type { Action, OperatorModel, ResourceRef, Rule, RuleDescription, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';

export type ShareParameters = Readonly<{
  resetOnError: boolean; resetOnComplete: boolean; resetOnRefCountZero: boolean;
}>;
type Registry = Readonly<{ nextConnection: number; used: readonly string[] }>;
export type ShareState =
  | (Readonly<{ phase: 'Disconnected' }> & Registry)
  | (Readonly<{ phase: 'Connected'; connection: ResourceRef; subscribers: readonly string[] }> & Registry)
  | (Readonly<{ phase: 'Completed' }> & Registry)
  | (Readonly<{ phase: 'Errored'; error: unknown }> & Registry);
export type ShareEvent<T> =
  | Readonly<{ type: 'subscriber.subscribe' | 'subscriber.unsubscribe'; subscriber: string }>
  | Readonly<{ type: 'source.next'; resource: ResourceRef; value: T }>
  | Readonly<{ type: 'source.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'source.error'; resource: ResourceRef; error: unknown }>;
export type ShareModel<T> = OperatorModel<ShareParameters, ShareState, ShareEvent<T>, Action<T>>;
const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const natural = (x: number): boolean => Number.isSafeInteger(x) && x >= 0;
const same = (a: ResourceRef, b: ResourceRef): boolean => a.id === b.id && a.generation === b.generation;

/** Default Subject connector and immediate boolean reset policies only; no replay or reset notifiers. */
export function createShareModel<T>(options: Partial<ShareParameters> = {}): ShareModel<T> {
  const p: ShareParameters = { resetOnError: true, resetOnComplete: true, resetOnRefCountZero: true, ...options };
  if (Object.keys(p).some(k => !['resetOnError', 'resetOnComplete', 'resetOnRefCountZero'].includes(k)) || Object.values(p).some(v => typeof v !== 'boolean')) throw new TypeError('share profile accepts boolean reset options only');
  type E = ShareEvent<T>;
  type R = Rule<ShareParameters, ShareState, E, Action<T>>;
  const rules: R[] = [];
  const memory = (s: ShareState): Registry => ({ nextConnection: s.nextConnection, used: s.used });
  const fresh = (s: ShareState, e: E): boolean => e.type === 'subscriber.subscribe' && e.subscriber.trim().length > 0 && !s.used.includes(e.subscriber);
  const current = (s: ShareState, e: E): boolean => s.phase === 'Connected' && 'resource' in e && same(s.connection, e.resource);
  const leaving = (s: ShareState, e: E): boolean => s.phase === 'Connected' && e.type === 'subscriber.unsubscribe' && s.subscribers.includes(e.subscriber);
  const release = (resource: ResourceRef) => ({ type: 'unsubscribe', resource } as const);
  const add = (suffix: string, from: string, event: string, guard: string, to: string, actions: readonly string[], nextState: string,
    explanation: string, witness: string, enabled: R['enabled'], react: R['react']): void => {
    const description: RuleDescription = { id: `SHARE-${suffix}`, from, event, guard, to, actions, nextState, explanation, obligations: [`S2-SHARE-${witness}`] };
    rules.push({ description, enabled, react });
  };
  add('CONNECT', 'Disconnected', 'subscriber.subscribe', 'fresh subscription ID and available connection generation', 'Connected', ['subscribe to the source under a fresh connection generation'], 'one registered subscriber and one connection',
    'Constructing the shared Observable starts nothing. Its first subscriber creates a Subject-backed connection to the source; that connection is shared by overlapping subscribers.', '01',
    (s, e) => fresh(s, e) && s.nextConnection < Number.MAX_SAFE_INTEGER,
    (s, e) => { if (e.type !== 'subscriber.subscribe') throw new Error('invalid connection'); const connection = { id: 'source', generation: s.nextConnection };
      return { state: { phase: 'Connected', connection, subscribers: [e.subscriber], used: [...s.used, e.subscriber], nextConnection: s.nextConnection + 1 }, actions: [{ type: 'subscribe', resource: connection }] }; });
  add('JOIN', 'Connected', 'subscriber.subscribe', 'fresh subscription ID', 'Connected', [], 'append subscriber to the existing connection, without replay',
    'A subscriber joining a live connection receives future values, not past values. It does not create another source subscription. Sharing is not replay.', '02', fresh,
    (s, e) => { if (s.phase !== 'Connected' || e.type !== 'subscriber.subscribe') throw new Error('invalid join');
      return { state: { ...s, subscribers: [...s.subscribers, e.subscriber], used: [...s.used, e.subscriber] }, actions: [] }; });
  add('NEXT', 'Connected', 'source.next', 'current source generation', 'Connected', ['forward the value to each currently registered subscriber in registration order'], 'retain the connection and registry',
    'A source value is forwarded unchanged to each currently subscribed observer. With no observers, a retained connection can still receive values, but share stores none of them.', '03', current,
    (s, e) => { if (s.phase !== 'Connected' || e.type !== 'source.next') throw new Error('invalid next');
      return { state: s, actions: s.subscribers.map(target => ({ type: 'notify', target, notification: { kind: 'N', value: e.value } })) }; });
  add('LEAVE', 'Connected', 'subscriber.unsubscribe', 'registered subscriber and at least one other remains', 'Connected', [], 'remove only this subscriber',
    'When one subscriber leaves while others remain, remove only that subscriber. The shared source continues and no completion is sent to the departing observer.', '04',
    (s, e) => leaving(s, e) && s.phase === 'Connected' && s.subscribers.length > 1,
    (s, e) => { if (s.phase !== 'Connected' || e.type !== 'subscriber.unsubscribe') throw new Error('invalid leave'); return { state: { ...s, subscribers: s.subscribers.filter(x => x !== e.subscriber) }, actions: [] }; });
  if (p.resetOnRefCountZero) add('LAST-RESET', 'Connected', 'subscriber.unsubscribe', 'the last registered subscriber leaves; resetOnRefCountZero=true', 'Disconnected', ['unsubscribe the source'], 'reset the connection with no live subscribers',
    'When the last subscriber leaves a nonterminated connection, resetOnRefCountZero=true disconnects and resets it. A future subscriber starts a new source execution. No completion notification is synthesized.', '05',
    (s, e) => leaving(s, e) && s.phase === 'Connected' && s.subscribers.length === 1,
    s => { if (s.phase !== 'Connected') throw new Error('invalid reset'); return { state: { phase: 'Disconnected', ...memory(s) }, actions: [release(s.connection)] }; });
  else add('LAST-RETAIN', 'Connected', 'subscriber.unsubscribe', 'the last registered subscriber leaves; resetOnRefCountZero=false', 'Connected', [], 'keep the source connected with an empty subscriber registry',
    'With resetOnRefCountZero=false, the source remains connected even when nobody is listening. A later subscriber joins that same live connection without receiving missed values.', '06',
    (s, e) => leaving(s, e) && s.phase === 'Connected' && s.subscribers.length === 1,
    s => { if (s.phase !== 'Connected') throw new Error('invalid retain'); return { state: { ...s, subscribers: [] }, actions: [] }; });

  for (const kind of ['complete', 'error'] as const) {
    const resets = kind === 'complete' ? p.resetOnComplete : p.resetOnError;
    const target = resets ? 'Disconnected' : kind === 'complete' ? 'Completed' : 'Errored';
    add(`${kind.toUpperCase()}-${resets ? 'RESET' : 'RETAIN'}`, 'Connected', `source.${kind}`, `current generation; resetOn${kind === 'complete' ? 'Complete' : 'Error'}=${resets}`, target,
      [`send ${kind} to each current subscriber`, 'release the source connection'], resets ? 'reset for a later fresh subscription' : 'retain terminal status with no live connection or registered subscribers',
      `On source ${kind}, notify current subscribers and release that source connection. ${resets ? 'The configured reset permits a future subscriber to start fresh; it does not retry the terminated subscriptions.' : 'The retained Subject remains terminated; future subscribers receive only that terminal notification and do not reconnect.'}`, kind === 'complete' ? '07' : '08', current,
      (s, e) => {
        if (s.phase !== 'Connected' || (e.type !== 'source.complete' && e.type !== 'source.error')) throw new Error('invalid termination');
        const state: ShareState = resets ? { phase: 'Disconnected', ...memory(s) } : e.type === 'source.error'
          ? { phase: 'Errored', ...memory(s), error: e.error } : { phase: 'Completed', ...memory(s) };
        const actions: Action<T>[] = s.subscribers.map(subscriber => e.type === 'source.error'
          ? { type: 'notify', target: subscriber, notification: { kind: 'E', error: e.error } }
          : { type: 'notify', target: subscriber, notification: { kind: 'C' } });
        actions.push(release(s.connection));
        return { state, actions };
      });
    if (!resets) add(`LATE-${kind.toUpperCase()}`, target, 'subscriber.subscribe', 'fresh subscription ID; retained terminal Subject', target,
      [`send the cached ${kind} to this subscriber only`], 'remain terminated without connecting or retaining the new subscriber',
      `A subscriber arriving after retained ${kind} immediately receives that ${kind}, with no replayed value and no new source connection.`, '09', fresh,
      (s, e) => { if (e.type !== 'subscriber.subscribe') throw new Error('invalid late subscribe');
        return { state: { ...s, used: [...s.used, e.subscriber] }, actions: [s.phase === 'Errored'
          ? { type: 'notify', target: e.subscriber, notification: { kind: 'E', error: s.error } }
          : { type: 'notify', target: e.subscriber, notification: { kind: 'C' } }] }; });
  }
  return {
    parameters: p, rules, initialState: () => ({ phase: 'Disconnected', nextConnection: 0, used: [] }), control: s => s.phase,
    metadata: {
      schemaVersion: '1.1', id: `share-${Number(p.resetOnError)}${Number(p.resetOnComplete)}${Number(p.resetOnRefCountZero)}`, operator: 'share', rxjsVersion: '7.8.2',
      purpose: 'Share one live source connection among subscribers using a Subject and explicit boolean reset policies.',
      cardinality: { signature: 'share : T* -> Shared(T*)', conditions: [
        'Shared is project teaching notation for a connection/ownership policy, not original Cω syntax.',
        'A subscriber observes a subsequence determined by its connection interval, not a replay of all source values.',
        'Broadcasts are addressed to subscriptions. Total addressed deliveries may exceed the number of source values.',
      ] },
      scope: { parameters: `Subject connector with boolean resetOnError=${p.resetOnError}, resetOnComplete=${p.resetOnComplete}, resetOnRefCountZero=${p.resetOnRefCountZero}`,
        callbacks: 'No custom connector or reset-notifier functions. Observer/source/finalizer activity is non-reentrant and nonthrowing.',
        time: 'No timer or clock is introduced. Ordered source and subscriber events determine membership at each delivery.',
        reentrancy: 'Atomic post-setup reactions. Each subscriber ID denotes one subscription occurrence and must not be reused.',
        exclusions: ['Custom SubjectLike connectors, replay and notifier-driven delayed resets.', 'Reentrant joins/leaves during notification, source setup or teardown; throwing observers/finalizers.', 'Physical producer abortion, lossless snapshots and a production shared-effect interpreter.'] },
      initialization: { control: 'Disconnected', event: 'subscriber.subscribe', sourceSubscription: 'Only the first live subscriber acquires a connection; later subscribers join it.' },
      ownership: { state: 'external-instance', sharing: 'One machine per shared Observable instance, not per subscriber. Each reset creates a fresh connection generation.',
        reset: 'Boolean policies reset after error, completion or last live departure. Retained terminal subjects still accept late subscription events.',
        resources: [{ id: 'source', kind: 'subscription', owner: 'shared Observable; connection generation distinguishes reconnects' }] },
      dispatch: { policy: 'atomic-non-reentrant', actionSemantics: 'Commit registry/reset state before delivering addressed notifications; observe source release after terminal delivery under post-setup execution. IDs are unique subscription occurrences, not reusable observer names.',
        cancellationCheckpoints: ['A leave affects one subscriber. Only a last leave with reset enabled disconnects the source.', 'Source termination ends existing subscriptions; resetting is not retrying those subscribers.'] },
      inputs: [
        { type: 'subscriber.subscribe', origin: 'downstream', category: 'lifecycle', description: 'a fresh subscriber joins' },
        { type: 'subscriber.unsubscribe', origin: 'downstream', category: 'lifecycle', description: 'a registered subscriber leaves' },
        { type: 'source.next', origin: 'source', category: 'notification', description: 'the current connection delivers a value' },
        { type: 'source.complete', origin: 'source', category: 'notification', description: 'the current connection completes' },
        { type: 'source.error', origin: 'source', category: 'notification', description: 'the current connection errors' },
      ],
      actionTypes: ['subscribe', 'unsubscribe', 'notify'],
      controls: [
        { id: 'Disconnected', description: 'no current source connection', terminal: false },
        { id: 'Connected', description: 'one live source; zero or more observers according to reset policy', terminal: false },
        ...(!p.resetOnComplete ? [{ id: 'Completed', description: 'retained completed Subject; late subscription remains legal', terminal: false }] : []),
        ...(!p.resetOnError ? [{ id: 'Errored', description: 'retained errored Subject; late subscription remains legal', terminal: false }] : []),
      ],
      sources: ['src/internal/operators/share.ts', 'src/internal/Subject.ts', 'src/internal/Subscriber.ts', 'src/internal/Subscription.ts'].map(path => ({
        url: `https://github.com/ReactiveX/rxjs/blob/${revision}/${path}`, revision, purpose: 'Pinned registration, addressed delivery, reset and source teardown policies',
      })),
      evidence: { modelTests: ['tests/session2-share-model.test.mjs'], runtimeTests: ['tests/session2-share-rxjs.test.mjs'], status: 'source-inspected', record: 'evidence/SESSION-02.md' },
    },
    validateState: s => {
      const errors: string[] = [];
      if (!['Disconnected', 'Connected', 'Completed', 'Errored'].includes(s.phase)) errors.push('invalid share control');
      if ((s.phase === 'Completed' || s.phase === 'Errored') && s.nextConnection === 0) errors.push('terminal Subject requires a previous connection');
      if (!natural(s.nextConnection) || new Set(s.used).size !== s.used.length || s.used.some(x => !x.trim())) errors.push('invalid connection counter or subscription IDs');
      if (s.phase === 'Connected') {
        if (s.connection.id !== 'source' || !natural(s.connection.generation) || s.connection.generation !== s.nextConnection - 1) errors.push('invalid current connection');
        if (new Set(s.subscribers).size !== s.subscribers.length || s.subscribers.some(x => !s.used.includes(x))) errors.push('invalid registry');
        if (!s.subscribers.length && p.resetOnRefCountZero) errors.push('empty live connection must reset');
      } else if (s.phase === 'Completed' && p.resetOnComplete) errors.push('completed retention disabled');
      else if (s.phase === 'Errored' && (p.resetOnError || !Object.hasOwn(s, 'error'))) errors.push('errored retention invalid');
      return errors;
    },
    validateReaction: (before, event, result) => {
      const errors = [...validateActionWord(result.actions)];
      const notifications = result.actions.filter(a => a.type === 'notify');
      for (const a of result.actions) {
        if (a.type === 'notify') {
          const allowed = before.phase === 'Connected' ? before.subscribers : event.type === 'subscriber.subscribe' ? [event.subscriber] : [];
          if (!allowed.includes(a.target)) errors.push('notification to unregistered subscription');
        } else if ((a.type !== 'subscribe' && a.type !== 'unsubscribe') || a.resource.id !== 'source') errors.push('unknown share resource action');
      }
      if (before.phase === 'Connected' && event.type === 'source.next') {
        if (notifications.length !== before.subscribers.length || notifications.some((a, i) => a.target !== before.subscribers[i] || a.notification.kind !== 'N' || !Object.is(a.notification.value, event.value))) errors.push('broadcast changed payload, order or multiplicity');
      }
      if (event.type === 'subscriber.unsubscribe' && notifications.length) errors.push('cancellation is not a notification');
      if (event.type === 'subscriber.subscribe' && result.state.used.length !== before.used.length + 1) errors.push('subscription occurrence not recorded');
      return errors;
    },
  };
}

const at = (time: number, event: ShareEvent<string>): TimedEvent<ShareEvent<string>> => ({ time, event });
const source = (generation: number): ResourceRef => ({ id: 'source', generation });
export const shareExample = [
  at(0, { type: 'subscriber.subscribe', subscriber: 'A' }), at(1, { type: 'subscriber.subscribe', subscriber: 'B' }),
  at(2, { type: 'source.next', resource: source(0), value: 'x' }), at(3, { type: 'subscriber.unsubscribe', subscriber: 'A' }),
  at(4, { type: 'subscriber.unsubscribe', subscriber: 'B' }), at(5, { type: 'subscriber.subscribe', subscriber: 'C' }),
  at(6, { type: 'source.next', resource: source(1), value: 'y' }), at(7, { type: 'source.complete', resource: source(1) }),
  at(8, { type: 'subscriber.subscribe', subscriber: 'D' }), at(9, { type: 'source.error', resource: source(2), error: 'fault' }),
] as const;
