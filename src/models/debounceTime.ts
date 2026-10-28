import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent, Trace } from '../schema.js';
import { runTrace, validateActionWord } from '../runner.js';

export type DebounceTimeParameters = Readonly<{ dueTime: number }>;
export type DebounceTimeState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Idle'; now: number; nextTimer: number }>
  | Readonly<{ phase: 'Pending'; now: number; nextTimer: number; value: T;
      lastTime: number; deadline: number; scheduledFor: number; timer: ResourceRef }>
  | Readonly<{ phase: 'Closed'; now: number; reason: 'complete' | 'error' | 'cancel' }>;
export type DebounceTimeEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete'; now: number }>
  | Readonly<{ type: 'source.next'; now: number; value: T }>
  | Readonly<{ type: 'source.error'; now: number; error: unknown }>
  | Readonly<{ type: 'timer.fire'; now: number; resource: ResourceRef }>;
export type DebounceTimeModel<T> = OperatorModel<DebounceTimeParameters, DebounceTimeState<T>, DebounceTimeEvent<T>, Action<T>>;

const natural = (n: number): boolean => Number.isSafeInteger(n) && n >= 0;
const source = { id: 'source', generation: 0 } as const;
const acquire = { type: 'subscribe', resource: source } as const;
const release = { type: 'unsubscribe', resource: source } as const;
const complete = { type: 'notify', target: 'downstream', notification: { kind: 'C' } } as const;
const timerRef = (generation: number): ResourceRef => ({ id: 'debounce-timer', generation });
const notify = <T>(value: T): Action<T> => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const cancelTimer = (resource: ResourceRef): Action<never> => ({ type: 'cancel-timer', resource });
const sameRef = (a: ResourceRef, b: ResourceRef): boolean => a.id === b.id && a.generation === b.generation;
const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';

/** Timer generations identify scheduled invocations, NOT JS Action objects or host timer handles. */
export function createDebounceTimeModel<T>(dueTime: number): DebounceTimeModel<T> {
  if (!natural(dueTime)) throw new RangeError('M02-C requires a nonnegative safe-integer dueTime');
  type S = DebounceTimeState<T>;
  type E = DebounceTimeEvent<T>;
  type R = Rule<DebounceTimeParameters, S, E, Action<T>>;
  const clock = (s: S, e: E): boolean => natural(e.now) && (s.phase === 'Unsubscribed' || e.now >= s.now);
  const nextClock = (s: S, e: E, p: DebounceTimeParameters): boolean => clock(s, e) && natural(e.now + p.dueTime);
  const firing = (s: S, e: E): boolean => clock(s, e) && s.phase === 'Pending' && e.type === 'timer.fire' &&
    sameRef(s.timer, e.resource) && e.now >= s.scheduledFor;
  const rules: R[] = [
    {
      description: { id: 'DEBOUNCE-INIT', from: 'Unsubscribed', event: 'subscribe', guard: 'fresh execution and valid clock', to: 'Idle',
        actions: ['subscribe to the source; schedule no timer'], nextState: 'idle with no pending value and timer generation zero', obligations: ['M02C-RX-01'],
        explanation: 'Subscribing connects to the source without scheduling a timer or emitting a value. Constructing the pipeline alone does not connect it.' },
      enabled: clock,
      react: (_s, e) => ({ state: { phase: 'Idle', now: e.now, nextTimer: 0 }, actions: [acquire] }),
    },
    {
      description: { id: 'DEBOUNCE-START', from: 'Idle', event: 'source.next', guard: 'valid clock/deadline and a fresh timer identity is available', to: 'Pending',
        actions: ['schedule a timer invocation after dueTime; emit no value'], nextState: 'pending with the incoming value, its time, deadline and scheduled wake-up', obligations: ['M02C-RX-02', 'M02C-RX-10'],
        explanation: 'When a value arrives with no timer active, remember that value and its arrival time and schedule a wake-up after dueTime. The value is not emitted yet, including at dueTime zero under this deferred-scheduler profile.' },
      enabled: (s, e, p) => nextClock(s, e, p) && s.phase === 'Idle' && s.nextTimer < Number.MAX_SAFE_INTEGER,
      react: (s, e, p) => {
        if (s.phase !== 'Idle' || e.type !== 'source.next') throw new Error('invalid start');
        const timer = timerRef(s.nextTimer);
        return { state: { phase: 'Pending', now: e.now, nextTimer: s.nextTimer + 1, value: e.value,
          lastTime: e.now, deadline: e.now + p.dueTime, scheduledFor: e.now + p.dueTime, timer },
          actions: [{ type: 'schedule', resource: timer, delay: p.dueTime }] };
      },
    },
    {
      description: { id: 'DEBOUNCE-REPLACE', from: 'Pending', event: 'source.next', guard: 'valid nondecreasing clock and representable deadline', to: 'Pending',
        actions: [], nextState: 'pending with the latest value and deadline, retaining the already scheduled invocation', obligations: ['M02C-RX-03', 'M02C-RX-04', 'M02C-RX-15'],
        explanation: 'While a timer is active, another value replaces the pending value and moves the silence deadline to its arrival time plus dueTime. RxJS 7.8.2 does not immediately cancel or reschedule the active task on this path.' },
      enabled: nextClock,
      react: (s, e, p) => {
        if (s.phase !== 'Pending' || e.type !== 'source.next') throw new Error('invalid replacement');
        return { state: { ...s, now: e.now, value: e.value, lastTime: e.now, deadline: e.now + p.dueTime }, actions: [] };
      },
    },
    {
      description: { id: 'DEBOUNCE-REARM', from: 'Pending', event: 'timer.fire', guard: 'matching due invocation; now < latest deadline; fresh identity available', to: 'Pending',
        actions: ['schedule a new invocation for deadline minus now; emit no value'], nextState: 'pending with the same value and deadline and a new scheduled-invocation generation', obligations: ['M02C-RX-03', 'M02C-RX-04'],
        explanation: 'When the scheduled task wakes before the latest silence deadline, it schedules another wake-up for the remaining duration. The pending value is retained and nothing is emitted.' },
      enabled: (s, e) => firing(s, e) && s.phase === 'Pending' && e.now < s.deadline && s.nextTimer < Number.MAX_SAFE_INTEGER,
      react: (s, e) => {
        if (s.phase !== 'Pending') throw new Error('invalid rearm');
        const timer = timerRef(s.nextTimer);
        return { state: { ...s, now: e.now, timer, nextTimer: s.nextTimer + 1, scheduledFor: s.deadline },
          actions: [{ type: 'schedule', resource: timer, delay: s.deadline - e.now }] };
      },
    },
    {
      description: { id: 'DEBOUNCE-EMIT', from: 'Pending', event: 'timer.fire', guard: 'matching due invocation; now >= latest deadline', to: 'Idle',
        actions: ['release the active timer task', 'emit the pending value unchanged'], nextState: 'idle with no pending value or active timer', obligations: ['M02C-RX-02', 'M02C-RX-12', 'M02C-RX-15'],
        explanation: 'When the current task wakes at or after the latest deadline, release the task and emit the pending value unchanged. Return to idle without completing the result. A late wake-up emits when it runs, not retroactively at the deadline.' },
      enabled: (s, e) => firing(s, e) && s.phase === 'Pending' && e.now >= s.deadline,
      react: (s, e) => {
        if (s.phase !== 'Pending') throw new Error('invalid emit');
        return { state: { phase: 'Idle', now: e.now, nextTimer: s.nextTimer }, actions: [cancelTimer(s.timer), notify(s.value)] };
      },
    },
  ];
  for (const phase of ['Idle', 'Pending'] as const) {
    for (const kind of ['complete', 'error', 'cancel'] as const) {
      const pending = phase === 'Pending';
      const flush = pending && kind === 'complete';
      const event = kind === 'cancel' ? 'cancel' : `source.${kind}`;
      rules.push({
        description: { id: `DEBOUNCE-${kind.toUpperCase()}-${phase.toUpperCase()}`, from: phase, event, guard: 'valid nondecreasing clock', to: 'Closed',
          actions: flush ? ['release the active timer task', 'emit the pending value unchanged', 'complete downstream', 'release the source subscription'] :
            [...(kind === 'cancel' ? [] : [kind === 'error' ? 'forward the source error unchanged' : 'complete downstream']),
              'release the source subscription', ...(pending ? ['release the active timer task and discard the pending value'] : [])],
          nextState: `closed by ${kind}, with no pending value or timer`, obligations: [`M02C-RX-${kind === 'complete' ? (pending ? '05' : '06') : kind === 'error' ? '07' : '08'}`],
          explanation: flush ? 'If the source completes with a value pending, release its timer and emit that value immediately, then complete and release upstream. Completion can flush before the silence deadline.' :
            kind === 'complete' ? 'If the source completes while idle, forward completion and release upstream without emitting another value.' :
            kind === 'error' ? `A source error is forwarded unchanged and upstream is released.${pending ? ' Any pending value is discarded and its timer is released.' : ''} No completion follows the error.` :
              `Downstream cancellation releases upstream without sending completion.${pending ? ' It also releases the timer and discards the pending value without emitting it.' : ''}` },
        enabled: clock,
        react: (s, e) => {
          if (s.phase !== phase) throw new Error('invalid terminal input');
          const actions: Action<T>[] = [];
          if (flush && s.phase === 'Pending') actions.push(cancelTimer(s.timer), notify(s.value));
          if (kind === 'complete') actions.push(complete);
          if (kind === 'error') {
            if (e.type !== 'source.error') throw new Error('invalid error');
            actions.push({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: e.error } });
          }
          actions.push(release);
          if (!flush && s.phase === 'Pending') actions.push(cancelTimer(s.timer));
          return { state: { phase: 'Closed', now: e.now, reason: kind }, actions };
        },
      });
    }
  }
  return {
    parameters: { dueTime }, rules,
    metadata: {
      schemaVersion: '1.1', id: `debounceTime-${dueTime}`, operator: 'debounceTime', rxjsVersion: '7.8.2',
      purpose: 'Keep the latest pending value and emit it after silence, or flush it on source completion.',
      cardinality: { signature: 'debounceTime(d) : T* -> T*', conditions: ['Outputs are an ordered subsequence of source values; replacement drops pending values.', 'Completion may flush before the deadline. Error and cancellation do not flush.', 'No universal minimum output gap is claimed: completion flush is an exception.'] },
      scope: { parameters: 'Nonnegative safe-integer dueTime; all clock readings, deadlines and generations remain in the safe-integer domain',
        callbacks: 'No user callback. Source and observer delivery and teardown are non-reentrant and nonthrowing.',
        time: 'One externally supplied monotone clock. Scheduling is deferred, even for delay zero. A deadline is not a delivery guarantee; explicit timer.fire events cause work.',
        reentrancy: 'Atomic external reactions after source subscription setup; equal-time order is supplied explicitly, not inferred from timestamps.',
        exclusions: ['Inline zero-delay schedulers such as queueScheduler, clock rollback, fractional/negative/nonfinite durations and unsafe arithmetic.', 'Reentrant source/observer/finalizer activity and cancellation inside downstream delivery.', 'Exact host timer IDs, wall-clock latency bounds, arbitrary SchedulerLike behavior and synchronous setup finalizer ordering.', 'A production timer interpreter or universal equivalence proof.'] },
      initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: 'Acquire the source; the first next, not subscription, schedules a task.' },
      ownership: { state: 'subscription-local', sharing: 'No sharing introduced. Pending values, deadlines and timer identities belong to each result subscription.',
        reset: 'Fresh bookkeeping per execution; Closed has no legal events. Payloads are retained by reference, not cloned.',
        resources: [{ id: 'source', kind: 'subscription', owner: 'current execution' }, { id: 'debounce-timer', kind: 'timer', owner: 'current execution; generation identifies each scheduled invocation' }] },
      dispatch: { policy: 'scheduled', actionSemantics: 'An external driver supplies clock readings and timer firings. A rearm consumes the old invocation and schedules a new generation, potentially on the same RxJS Action object. Cancel-timer releases that logical task even when executing. For post-setup source error/cancel, source release precedes task release.',
        cancellationCheckpoints: ['Between source/timer reactions; no completion or pending-value flush.', 'No external event is implicitly prioritized when timestamps tie.'] },
      inputs: [
        { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'a fresh downstream execution subscribes' },
        { type: 'source.next', origin: 'source', category: 'notification', description: 'the source delivers a value at the supplied clock time' },
        { type: 'timer.fire', origin: 'timer', category: 'time', description: 'the currently scheduled invocation fires at the supplied clock time' },
        { type: 'source.complete', origin: 'source', category: 'notification', description: 'the source completes' },
        { type: 'source.error', origin: 'source', category: 'notification', description: 'the source errors' },
        { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream unsubscribes' },
      ],
      actionTypes: ['subscribe', 'schedule', 'cancel-timer', 'notify', 'unsubscribe'],
      controls: [
        { id: 'Unsubscribed', description: 'not connected', terminal: false },
        { id: 'Idle', description: 'source connected, no pending value or timer', terminal: false },
        { id: 'Pending', description: 'latest value and silence deadline plus a scheduled invocation', terminal: false },
        { id: 'Closed', description: 'complete, errored or cancelled, no owned live resources', terminal: true },
      ],
      sources: ['src/internal/operators/debounceTime.ts', 'src/internal/Subscriber.ts', 'src/internal/Subscription.ts', 'src/internal/scheduler/VirtualTimeScheduler.ts'].map(path => ({
        url: `https://github.com/ReactiveX/rxjs/blob/${revision}/${path}`, revision, purpose: 'Pinned debounce scheduling, terminal cleanup and virtual same-frame ordering',
      })),
      evidence: { modelTests: ['tests/m02c-model.test.mjs'], runtimeTests: ['tests/m02c-rxjs.test.mjs'], status: 'source-inspected', record: 'evidence/M02-C.md' },
    },
    initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: (s, p) => {
      if (s.phase === 'Unsubscribed') return [];
      if (!natural(s.now)) return ['invalid state clock'];
      if (s.phase === 'Closed') return ['complete', 'error', 'cancel'].includes(s.reason) ? [] : ['invalid close reason'];
      if (!natural(s.nextTimer)) return ['invalid timer counter'];
      if (s.phase === 'Idle') return [];
      if (s.phase !== 'Pending' || !Object.hasOwn(s, 'value')) return ['missing pending value'];
      return natural(s.lastTime) && natural(s.deadline) && natural(s.scheduledFor) &&
        s.lastTime <= s.now && s.now <= s.deadline && s.deadline === s.lastTime + p.dueTime && s.scheduledFor <= s.deadline &&
        s.timer.id === 'debounce-timer' && natural(s.timer.generation) && s.timer.generation < Number.MAX_SAFE_INTEGER && s.nextTimer === s.timer.generation + 1
        ? [] : ['invalid pending time/identity invariant'];
    },
    validateReaction: (before, e, result, p) => {
      const errors = [...validateActionWord(result.actions)];
      const after = result.state;
      if (after.phase === 'Unsubscribed' || after.now !== e.now) errors.push('reaction clock mismatch');
      const values = result.actions.filter(a => a.type === 'notify' && a.notification.kind === 'N');
      for (const a of result.actions) {
        if (a.type === 'notify') {
          if (a.target !== 'downstream') errors.push('unknown subscriber');
          if (a.notification.kind === 'N' && (before.phase !== 'Pending' || !Object.is(a.notification.value, before.value))) errors.push('pending payload changed');
          if (a.notification.kind === 'E' && (e.type !== 'source.error' || !Object.is(a.notification.error, e.error))) errors.push('error changed');
        } else if (a.type === 'schedule') {
          if (after.phase !== 'Pending' || !sameRef(a.resource, after.timer) || a.delay !== after.scheduledFor - e.now) errors.push('wrong schedule');
        } else if (a.type === 'cancel-timer') {
          if (before.phase !== 'Pending' || !sameRef(a.resource, before.timer)) errors.push('wrong timer release');
        } else if (!['subscribe', 'unsubscribe'].includes(a.type) || !sameRef(a.resource, source)) errors.push('unknown action');
      }
      if (e.type === 'source.next' && (after.phase !== 'Pending' || !Object.is(after.value, e.value) || after.lastTime !== e.now || after.deadline !== e.now + p.dueTime)) errors.push('replacement invariant');
      if (before.phase === 'Pending' && after.phase === 'Pending' && e.type !== 'source.next' &&
          (!Object.is(after.value, before.value) || after.lastTime !== before.lastTime || after.deadline !== before.deadline)) errors.push('rearm changed pending memory');
      const shouldEmit = before.phase === 'Pending' && (e.type === 'source.complete' || (e.type === 'timer.fire' && e.now >= before.deadline));
      if (values.length !== (shouldEmit ? 1 : 0)) errors.push('incorrect emission count');
      const types = result.actions.map(a => a.type).join(',');
      let expected: string;
      if (e.type === 'subscribe') expected = 'subscribe';
      else if (e.type === 'source.next') expected = before.phase === 'Idle' ? 'schedule' : '';
      else if (e.type === 'timer.fire') expected = shouldEmit ? 'cancel-timer,notify' : 'schedule';
      else if (e.type === 'source.complete') expected = shouldEmit ? 'cancel-timer,notify,notify,unsubscribe' : 'notify,unsubscribe';
      else expected = `${e.type === 'source.error' ? 'notify,' : ''}unsubscribe${before.phase === 'Pending' ? ',cancel-timer' : ''}`;
      if (types !== expected) errors.push('incorrect action order/multiplicity');
      if (after.phase === 'Pending' && before.phase !== 'Unsubscribed' && before.phase !== 'Closed') {
        const replacing = e.type === 'source.next' && before.phase === 'Pending';
        if (after.nextTimer !== before.nextTimer + (replacing ? 0 : 1)) errors.push('timer generation drift');
        if (replacing && before.phase === 'Pending' && (!sameRef(after.timer, before.timer) || after.scheduledFor !== before.scheduledFor)) errors.push('replacement rescheduled a task');
      }
      return errors;
    },
  };
}

/** Clock-aware wrapper: rejects contradictory envelope timestamps before running any transition. */
export function runDebounceTimeTrace<T>(model: DebounceTimeModel<T>, inputs: readonly TimedEvent<DebounceTimeEvent<T>>[],
  options: Readonly<{ executionId: string; maxSteps?: number }>): Trace<DebounceTimeState<T>, DebounceTimeEvent<T>, Action<T>> {
  if (inputs.some(x => x.time !== x.event.now)) throw new Error('trace time must equal event.now');
  return runTrace(model, inputs, options);
}

/** Source b replaces a, the original wake-up rearms, and source completion later flushes c. */
export const debounceTimeExample: readonly TimedEvent<DebounceTimeEvent<string>>[] = [
  { type: 'subscribe', now: 0 },
  { type: 'source.next', now: 1, value: 'a' },
  { type: 'source.next', now: 3, value: 'b' },
  { type: 'timer.fire', now: 4, resource: timerRef(0) },
  { type: 'timer.fire', now: 6, resource: timerRef(1) },
  { type: 'source.next', now: 7, value: 'c' },
  { type: 'source.complete', now: 8 },
].map(event => ({ time: event.now, event: event as DebounceTimeEvent<string> }));
