import type { Action, OperatorModel, ResourceRef, Rule, RuleDescription, TimedEvent, Trace } from '../schema.js';
import { runTrace, validateActionWord } from '../runner.js';
import { createShareModel } from './share.js';
import type { ShareEvent, ShareState } from './share.js';

/** RxJS 7.8.2 shareReplay: ReplaySubject(bufferSize,windowTime,timestampProvider)
 * through share({resetOnError:true,resetOnComplete:false,resetOnRefCountZero:refCount}).
 * One machine belongs to the shared Observable, not to each subscriber.
 */
export type ShareReplayOptions = Readonly<{ bufferSize?: number; windowTime?: number; refCount?: boolean }>;
export type ShareReplayParameters = Readonly<{
  bufferSize: number | 'unbounded'; windowTime: number | 'unbounded'; refCount: boolean;
}>;
export type ReplayItem<T> = Readonly<{ value: T; expiresAt: number | null }>;
export type ShareReplayState<T> = Readonly<{
  core: ShareState; buffer: readonly ReplayItem<T>[]; clock: number;
}>;
export type ShareReplayEvent<T> = ShareEvent<T> & Readonly<{ now: number }>;
export type ShareReplayModel<T> = OperatorModel<ShareReplayParameters, ShareReplayState<T>, ShareReplayEvent<T>, Action<T>>;
const rev = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const natural = (x: number): boolean => Number.isSafeInteger(x) && x >= 0;
const validTime = (x: number): boolean => Number.isFinite(x) && x >= 0;
const isSource = <T>(e: ShareReplayEvent<T>): e is ShareReplayEvent<T> & { resource: ResourceRef } => 'resource' in e;
const normalize = (x: number | undefined, name: string): number | 'unbounded' => {
  if (x === undefined || x === Infinity) return 'unbounded';
  if (!natural(x)) throw new RangeError(name + ' must be a nonnegative safe integer or Infinity');
  return Math.max(1, x); // ReplaySubject clamps zero to one, not to an empty buffer.
};
function trim<T>(buffer: readonly ReplayItem<T>[], now: number, p: ShareReplayParameters): ReplayItem<T>[] {
  const live = buffer.filter(item => item.expiresAt === null || item.expiresAt > now);
  return p.bufferSize === 'unbounded' ? live : live.slice(-p.bufferSize);
}
const sameRef = (a: ResourceRef, b: ResourceRef): boolean => a.id === b.id && a.generation === b.generation;
const sameActions = <T>(a: readonly Action<T>[], b: readonly Action<T>[]): boolean =>
  a.length === b.length && a.every((x, i) => {
    const y = b[i]!;
    if (x.type !== y.type) return false;
    if (x.type === 'notify' && y.type === 'notify') return x.target === y.target &&
      x.notification.kind === y.notification.kind &&
      (x.notification.kind === 'N' && y.notification.kind === 'N' ? Object.is(x.notification.value, y.notification.value)
        : x.notification.kind === 'E' && y.notification.kind === 'E' ? Object.is(x.notification.error, y.notification.error) : true);
    if ('resource' in x && 'resource' in y) return sameRef(x.resource, y.resource);
    return false;
  });

/** The pure rules never subscribe, store a scheduler, or evaluate a callback. */
export function createShareReplayModel<T>(options: ShareReplayOptions = {}): ShareReplayModel<T> {
  if (Object.keys(options).some(k => !['bufferSize', 'windowTime', 'refCount'].includes(k))) throw new TypeError('unsupported shareReplay option');
  if (options.refCount !== undefined && typeof options.refCount !== 'boolean') throw new TypeError('refCount must be boolean');
  const p: ShareReplayParameters = {
    bufferSize: normalize(options.bufferSize, 'bufferSize'),
    windowTime: normalize(options.windowTime, 'windowTime'),
    refCount: options.refCount ?? false,
  };
  const core = createShareModel<T>({
    resetOnError: true, resetOnComplete: false, resetOnRefCountZero: p.refCount,
  });
  type S = ShareReplayState<T>;
  type E = ShareReplayEvent<T>;
  type R = Rule<ShareReplayParameters, S, E, Action<T>>;
  const retained = (before: S, event: E): ReplayItem<T>[] =>
    event.type === 'source.next' || event.type === 'subscriber.subscribe'
      ? trim(before.buffer, event.now, p) : [...before.buffer];
  const replayActions = (target: string, values: readonly ReplayItem<T>[]): Action<T>[] =>
    values.map(item => ({ type: 'notify', target, notification: { kind: 'N', value: item.value } }));
  const rules: R[] = core.rules.map(rule => {
    const d = rule.description;
    const isJoin = d.event === 'subscriber.subscribe';
    const nextDescription: RuleDescription = {
      ...d, id: d.id.replace('SHARE-', 'SHAREREPLAY-'),
      obligations: d.obligations.map(s => s.replace('S2-SHARE-', 'S3-SHAREREPLAY-')),
      guard: d.guard + '; environment clock must not move backwards',
      actions: [
        ...(isJoin ? ['replay the nonexpired cached values in FIFO order before the terminal notification (if any)'] : []),
        ...(d.event === 'source.next' ? ['append incoming value to time/count-bounded replay memory'] : []),
        ...(d.event === 'source.error' || d.event === 'subscriber.unsubscribe' ? ['discard replay memory if connection resets'] : []),
        ...d.actions,
      ],
      nextState: d.nextState + '; replay memory retained, pruned or reset according to the event',
      explanation: isJoin
        ? 'A joining subscriber receives the current replay buffer, oldest first, synchronously. A completed shared source replays its retained buffer and then completes without reconnecting. ' + d.explanation.replace('without replay', 'with replay')
        : d.event === 'source.next'
          ? 'Store the unchanged value and its source-clock expiry (if finite); trim by count and time, then broadcast to currently subscribed observers. A retained connection continues buffering with zero observers.'
          : d.event === 'source.error'
            ? 'A source error ends present subscribers, tears down the connection and resets the replay buffer, so a later subscriber starts a new execution.'
            : d.event === 'source.complete'
              ? 'Completion terminates present subscribers and releases the source, but retains the ReplaySubject buffer for late subscribers; time-window expiry continues to apply.'
              : d.event === 'subscriber.unsubscribe'
                ? 'Unsubscribe this subscriber without sending completion. Last departure disconnects and clears replay memory only with refCount=true; otherwise keep connection and replay memory.'
                : d.explanation,
    };
    return {
      description: nextDescription,
      enabled: (s: S, e: E): boolean => validTime(e.now) && e.now >= s.clock && rule.enabled(s.core, e, core.parameters),
      react: (s: S, e: E) => {
        const baseline = rule.react(s.core, e, core.parameters);
        const original = core.validateReaction(s.core, e, baseline, core.parameters);
        if (original.length) throw new Error('share core reaction invalid: ' + original.join('; '));
        const kept = retained(s, e);
        let buffer: ReplayItem<T>[] = kept;
        if (e.type === 'source.next') {
          const expiresAt = p.windowTime === 'unbounded' ? null : e.now + p.windowTime;
          if (expiresAt !== null && !Number.isFinite(expiresAt)) throw new RangeError('replay expiry overflow');
          buffer = trim([...kept, { value: e.value, expiresAt }], e.now, p);
        }
        if (e.type === 'source.error' || (e.type === 'subscriber.unsubscribe' &&
          s.core.phase === 'Connected' && baseline.state.phase === 'Disconnected')) buffer = [];
        const actions: Action<T>[] = e.type === 'subscriber.subscribe'
          ? [...replayActions(e.subscriber, kept), ...baseline.actions] : [...baseline.actions];
        return { state: { core: baseline.state, buffer, clock: e.now }, actions };
      },
    };
  });
  return {
    parameters: p, rules,
    initialState: () => ({ core: core.initialState(), buffer: [], clock: 0 }),
    control: s => s.core.phase,
    metadata: {
      schemaVersion: '1.1', id: 'shareReplay-' + p.bufferSize + '-' + p.windowTime + '-' + Number(p.refCount),
      operator: 'shareReplay', rxjsVersion: '7.8.2',
      purpose: 'Share one producer and synchronously replay recent values to later subscribers, retaining successful completion.',
      cardinality: { signature: 'shareReplay : T* -> SharedReplay(T*)', conditions: [
        'SharedReplay is project notation for shared connection plus buffered late delivery, not a Cω primitive.',
        'Live subscribers receive current values; late subscribers also receive up to bufferSize eligible previous values.',
        'Each subscriber has its own output T*; replay fan-out changes total notification multiplicity, not source cardinality.',
      ] },
      scope: {
        parameters: 'ReplaySubject(bufferSize=' + p.bufferSize + ',windowTime=' + p.windowTime + '), refCount=' + p.refCount + '; nonnegative safe-integer sizes and windows; zero clamped to one',
        callbacks: 'No user callback, custom connector, observer side effects, or reset-notifier function is executed in the pure model.',
        time: 'Source-clock values are supplied by event.now. Expiry happens when ReplaySubject trims on next/subscribe; expireAt <= now is excluded. No timer runs to evict values.',
        reentrancy: 'Atomic, non-reentrant subscriber registration and source delivery after connection setup. Synchronous replay occurs before a retained terminal signal.',
        exclusions: [
          'Arbitrary reentrant subscriptions/teardown and throwing observers or finalizers.',
          'Custom timestamp providers not modeled as explicitly supplied event time, fractional/negative/infinite-boundary arithmetic, and arbitrary ObservableInput conversion.',
          'No production effect interpreter or claim that finite tests establish full equivalence.',
        ],
      },
      initialization: { control: 'Disconnected', event: 'subscriber.subscribe',
        sourceSubscription: 'First subscriber registers to a fresh ReplaySubject and connects upstream; no initial value exists.' },
      ownership: {
        state: 'external-instance', sharing: 'One replay buffer and source connection per resulting shared Observable, not per subscriber.',
        reset: 'Error always resets; successful completion never resets; last live departure resets only with refCount=true.',
        resources: [{ id: 'source', kind: 'subscription', owner: 'shared Observable source connection generation' }],
      },
      dispatch: { policy: 'atomic-non-reentrant',
        actionSemantics: 'After state update, append replay notifications before the baseline terminal action; preserve addressed live delivery and release ordering.',
        cancellationCheckpoints: ['One departure removes only that subscriber. Last departure disconnects only when refCount=true and source has not completed.',
          'Reset clears replay memory; completion retains memory but later subscriptions still trim by the supplied source clock.'] },
      inputs: core.metadata.inputs.map(input => ({ ...input, description: input.description + '; event carries an external clock reading' })),
      actionTypes: ['subscribe', 'unsubscribe', 'notify'],
      controls: core.metadata.controls,
      sources: [
        'src/internal/operators/shareReplay.ts', 'src/internal/ReplaySubject.ts', 'src/internal/operators/share.ts',
        'src/internal/Subject.ts', 'src/internal/scheduler/dateTimestampProvider.ts',
      ].map(path => ({ url: 'https://github.com/ReactiveX/rxjs/blob/' + rev + '/' + path, revision: rev,
        purpose: 'Pinned configuration, replay window, source connection, lifecycle and reset behavior' })),
      evidence: { modelTests: ['tests/session3-shareReplay-model.test.mjs'],
        runtimeTests: ['tests/session3-shareReplay-rxjs.test.mjs'], status: 'source-inspected', record: 'evidence/SESSION-03.md' },
    },
    validateState: s => {
      const errors = [...core.validateState(s.core, core.parameters)];
      if (!validTime(s.clock)) errors.push('invalid external clock');
      if (s.core.phase === 'Errored') errors.push('error retention is disabled');
      if (s.core.phase === 'Disconnected' && s.buffer.length) errors.push('disconnected source cannot retain replay values');
      if (p.bufferSize !== 'unbounded' && s.buffer.length > p.bufferSize) errors.push('buffer-size bound exceeded');
      for (const item of s.buffer) {
        if (!Object.hasOwn(item, 'value')) errors.push('missing retained payload');
        if (p.windowTime === 'unbounded' ? item.expiresAt !== null
          : item.expiresAt === null || !Number.isFinite(item.expiresAt)) errors.push('invalid expiry representation');
      }
      if (s.buffer.some((x, i) => i > 0 && x.expiresAt !== null && s.buffer[i - 1]!.expiresAt !== null &&
        x.expiresAt < s.buffer[i - 1]!.expiresAt!)) errors.push('out-of-order expiry');
      return errors;
    },
    validateReaction: (before, event, result) => {
      const errors = [...validateActionWord(result.actions)];
      if (!validTime(event.now) || event.now < before.clock || result.state.clock !== event.now) errors.push('clock must advance monotonically from environment');
      const expectedBuffer = (() => {
        const kept = retained(before, event);
        if (event.type === 'source.next') return trim([...kept, { value: event.value, expiresAt: p.windowTime === 'unbounded' ? null : event.now + p.windowTime }], event.now, p);
        if (event.type === 'source.error' || (event.type === 'subscriber.unsubscribe' && result.state.core.phase === 'Disconnected')) return [];
        return kept;
      })();
      if (result.state.buffer.length !== expectedBuffer.length || result.state.buffer.some((x, i) =>
        !Object.is(x.value, expectedBuffer[i]!.value) || x.expiresAt !== expectedBuffer[i]!.expiresAt)) errors.push('incorrect replay memory update');
      if (event.type === 'subscriber.subscribe') {
        const replay = replayActions(event.subscriber, retained(before, event));
        const remainder = result.actions.slice(replay.length);
        if (!sameActions(result.actions.slice(0, replay.length), replay)) errors.push('replay order or payload changed');
        const last = remainder.at(-1);
        if (before.core.phase === 'Completed' && !(last?.type === 'notify' && last.notification.kind === 'C')) errors.push('late completed subject must complete after replay');
        if (before.core.phase === 'Connected' && remainder.length) errors.push('live join must not create another connection');
      }
      if (event.type === 'source.next' && before.core.phase === 'Connected') {
        const subscribers = before.core.subscribers;
        const notifications = result.actions.filter(a => a.type === 'notify');
        if (notifications.length !== subscribers.length || notifications.some((a, i) => a.target !== subscribers[i] ||
          a.notification.kind !== 'N' || !Object.is(a.notification.value, event.value))) errors.push('live broadcast incorrect');
      }
      if (event.type === 'subscriber.unsubscribe' && result.actions.some(a => a.type === 'notify')) errors.push('cancellation cannot notify');
      if (isSource(event) && before.core.phase === 'Connected' && !sameRef(before.core.connection, event.resource)) errors.push('foreign connection');
      return errors;
    },
  };
}
export function runShareReplayTrace<T>(
  model: ShareReplayModel<T>, inputs: readonly TimedEvent<ShareReplayEvent<T>>[],
  options: Readonly<{ executionId: string; maxSteps?: number }>,
): Trace<ShareReplayState<T>, ShareReplayEvent<T>, Action<T>> {
  if (inputs.some(x => x.time !== x.event.now)) throw new Error('trace timestamp does not match source-clock input');
  return runTrace(model, inputs, options);
}

const at = (now: number, event: ShareEvent<string>): TimedEvent<ShareReplayEvent<string>> =>
  ({ time: now, event: { ...event, now } });
const src = (generation: number): ResourceRef => ({ id: 'source', generation });
export const shareReplayExample = [
  at(0, { type: 'subscriber.subscribe', subscriber: 'A' }),
  at(1, { type: 'source.next', resource: src(0), value: 'a' }),
  at(2, { type: 'source.next', resource: src(0), value: 'b' }),
  at(3, { type: 'subscriber.subscribe', subscriber: 'B' }),
  at(4, { type: 'source.next', resource: src(0), value: 'c' }),
  at(5, { type: 'subscriber.unsubscribe', subscriber: 'A' }),
  at(6, { type: 'source.complete', resource: src(0) }),
  at(7, { type: 'subscriber.subscribe', subscriber: 'C' }),
] as const;
