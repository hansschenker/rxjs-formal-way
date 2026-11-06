import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';

/** Source index 0 is always the piped source, followed by the supplied inputs. */
export type JoinOperator = 'combineLatest' | 'combineLatestWith' | 'concat' | 'concatWith';
export type JoinPolicy = 'latest' | 'serial';
export type JoinParameters = Readonly<{
  operator: JoinOperator; otherSources: number; policy: JoinPolicy;
  projector: 'none'; scheduler: 'none';
}>;
export type JoinSlot<T> = Readonly<{ ready: boolean; live: boolean; value?: T }>;
export type JoinState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; slots: readonly JoinSlot<T>[]; current: number }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'input-error' | 'cancel' }>;
export type JoinEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' }>
  | Readonly<{ type: 'input.next'; resource: ResourceRef; value: T }>
  | Readonly<{ type: 'input.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'input.error'; resource: ResourceRef; error: unknown }>;
export type JoinModel<T> = OperatorModel<JoinParameters, JoinState<T>, JoinEvent<T>, Action<T[] | T>>;

const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const input = (index: number): ResourceRef => ({ id: 'input', generation: index });
const acquire = (index: number): Action<never> => ({ type: 'subscribe', resource: input(index) });
const release = (index: number): Action<never> => ({ type: 'unsubscribe', resource: input(index) });
const next = <T>(value: T | T[]): Action<T | T[]> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const completed: Action<never> = { type: 'notify', target: 'downstream', notification: { kind: 'C' } };
const failed = (error: unknown): Action<never> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error } });
const natural = (n: number): boolean => Number.isSafeInteger(n) && n >= 0;
const latest = (operator: JoinOperator): boolean => operator.startsWith('combineLatest');

function metadata(p: JoinParameters): ModelMetadata {
  const isLatest = p.policy === 'latest';
  const alias = p.operator === 'combineLatest' || p.operator === 'concat';
  const sources = [
    'src/internal/operators/' + p.operator + '.ts',
    ...(p.operator === 'combineLatestWith' ? ['src/internal/operators/combineLatest.ts'] : []),
    ...(p.operator === 'concatWith' ? ['src/internal/operators/concat.ts'] : []),
    isLatest ? 'src/internal/observable/combineLatest.ts' : 'src/internal/operators/concatAll.ts',
    isLatest ? 'src/internal/operators/OperatorSubscriber.ts' : 'src/internal/operators/mergeAll.ts',
    'src/internal/Subscription.ts',
  ];
  return {
    schemaVersion: '1.1', id: p.operator + '-' + p.otherSources + '-observable-inputs',
    operator: p.operator, rxjsVersion: '7.8.2',
    purpose: isLatest
      ? 'Combine source-first latest snapshots after every input has emitted a first value.'
      : 'Forward the source and then each supplied Observable in strict subscription order.',
    cardinality: {
      signature: isLatest ? p.operator + ' : T0* × ... × Tn* → (T0 × ... × Tn)*'
        : p.operator + ' : T0* × ... × Tn* → (T0 | ... | Tn)*',
      conditions: isLatest ? [
        'Source index 0 comes first. All input subscriptions begin at connection, without a timer.',
        'Every source must emit at least one value before the first full latest snapshot.',
        'Each subsequent next from a live source emits a newly allocated source-ordered array.',
        'An input may complete before its first value; the output is then silent until the remaining inputs also complete.',
      ] : [
        'Exactly one input subscription is live at a time; source index 0 always starts first.',
        'The next supplied source is subscribed only after the previous source completes.',
        'Each incoming value is emitted unchanged; completion requires all inputs to complete.',
      ],
    },
    scope: {
      parameters: 'One piped source and ' + p.otherSources + ' supplied Observable inputs; 0–32 others. ' +
        (alias ? 'Deprecated operator export. ' : '') +
        'No projector or scheduler overload.',
      callbacks: 'No user callbacks; no result selector projection. Observable values preserve reference identity.',
      time: 'Inputs supply all notification ordering; no clock, scheduler or delay is created by this profile.',
      reentrancy: 'All input subscriptions established atomically before external notifications. Synchronous producer emissions during setup are excluded.',
      exclusions: [
        'Promise/iterable ObservableInput conversion, synchronous or reentrant notifications during subscription acquisition.',
        'Deprecated result selector for combineLatest and deprecated scheduler overload for concat.',
        'Callbacks throwing during observer delivery, synchronous finalizer reentrancy, cancellation during next handling.',
        'Finite scenarios are evidence, not universal equivalence. Input count beyond 32 is not modeled.',
      ],
    },
    initialization: {
      control: 'Unsubscribed', event: 'subscribe',
      sourceSubscription: isLatest ? 'Acquire input 0, then other inputs in argument order.'
        : 'Subscribe only the piped source; remaining sources wait for completion.',
    },
    ownership: {
      state: 'subscription-local',
      sharing: 'No multicasting, sharing or replay. Each result subscription owns independent latest slots or serial position.',
      reset: 'Fresh first-value flags and subscriptions for every execution; closed states accept no notifications.',
      resources: [{ id: 'input', kind: 'subscription', owner: 'each result subscription, generation is source index' }],
    },
    dispatch: {
      policy: 'atomic-non-reentrant',
      actionSemantics: isLatest
        ? 'Store each latest value; emit a fresh full tuple only when all slots are ready. Input completion preserves any last value.'
        : 'Forward each input next unchanged; release an input at completion before acquiring the next.',
      cancellationCheckpoints: [
        'Between resolved notifications; cancel active subscriptions without a terminal notification.',
        'Termination releases only live resources and never creates a late shared subscription.',
      ],
    },
    inputs: [
      { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'connect the output subscription' },
      { type: 'input.next', origin: 'source', category: 'notification', description: 'one live source delivers a value' },
      { type: 'input.complete', origin: 'source', category: 'notification', description: 'one live source completes' },
      { type: 'input.error', origin: 'source', category: 'notification', description: 'one live source errors' },
      { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'unsubscribe from result' },
    ],
    actionTypes: ['subscribe', 'unsubscribe', 'notify'],
    controls: [
      { id: 'Unsubscribed', description: 'no subscriptions yet', terminal: false },
      { id: 'Active', description: 'latest slots or serial active input', terminal: false },
      { id: 'Closed', description: 'complete, error or silent cancellation', terminal: true },
    ],
    sources: sources.map(path => ({
      url: 'https://github.com/ReactiveX/rxjs/blob/' + revision + '/' + path,
      revision, purpose: 'Version-pinned 7.8.2 joining, subscription and teardown behavior',
    })),
    evidence: {
      modelTests: ['tests/session09-model.test.mjs'], runtimeTests: ['tests/session09-rxjs.test.mjs'],
      status: 'source-inspected', record: 'evidence/SESSION-09.md',
    },
  };
}
function create<T>(operator: JoinOperator, otherSources: number): JoinModel<T> {
  if (!natural(otherSources) || otherSources > 32) throw new RangeError('otherSources must be an integer in 0..32');
  const policy: JoinPolicy = latest(operator) ? 'latest' : 'serial';
  const p: JoinParameters = { operator, otherSources, policy, projector: 'none', scheduler: 'none' };
  type S = JoinState<T>; type E = JoinEvent<T>; type A = Action<T | T[]>;
  type R = Rule<JoinParameters, S, E, A>;
  const prefix = operator.toUpperCase();
  const desc = (id: string, from: S['phase'], event: E['type'], to: S['phase'],
    guard: string, actions: string[], explanation: string): R['description'] => ({
    id: prefix + '-' + id, from, event, to, guard, actions,
    nextState: to === 'Closed' ? 'terminal; resources discarded' : 'valid ordered input bindings',
    obligations: ['S9-' + prefix + '-' + id], explanation,
  });
  const close = (reason: Extract<S, { phase: 'Closed' }>['reason']): S => ({ phase: 'Closed', reason });
  const matches = (s: S, e: E): boolean =>
    s.phase === 'Active' && 'resource' in e &&
    e.resource.id === 'input' && natural(e.resource.generation) &&
    e.resource.generation < s.slots.length && s.slots[e.resource.generation]?.live === true;
  const owned = (s: S): A[] =>
    s.phase === 'Active' ? s.slots.flatMap((slot, index) => slot.live ? [release(index)] : []) : [];
  const rules: R[] = [{
    description: desc('INIT', 'Unsubscribed', 'subscribe', 'Active', 'first downstream connection',
      [policy === 'latest' ? 'acquire every input in argument order' : 'acquire source index zero'],
      'Construction is lazy. Source index zero is the piped source.'),
    enabled: () => true,
    react: () => ({
      state: { phase: 'Active', current: 0,
        slots: Array.from({ length: otherSources + 1 }, (_x, i) =>
          ({ ready: false, live: policy === 'latest' || i === 0 })) },
      actions: policy === 'latest'
        ? Array.from({ length: otherSources + 1 }, (_x, i) => acquire(i)) : [acquire(0)],
    }),
  }];
  if (policy === 'latest') rules.push(
    {
      description: desc('WAIT', 'Active', 'input.next', 'Active', 'live source; some other source unready',
        ['replace latest value; no output'], 'The first-value barrier applies to every source.'),
      enabled: (s, e) => matches(s, e) && s.phase === 'Active' && e.type === 'input.next' &&
        s.slots.some((slot, i) => i !== e.resource.generation && !slot.ready),
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'input.next') throw new Error('illegal latest wait');
        return { state: { ...s, slots: s.slots.map((x, i) =>
          i === e.resource.generation ? { ...x, ready: true, value: e.value } : x) }, actions: [] };
      },
    },
    {
      description: desc('EMIT', 'Active', 'input.next', 'Active', 'live source; every other source ready',
        ['update one latest value', 'emit copied source-ordered array'], 'One emission produces one fresh latest tuple.'),
      enabled: (s, e) => matches(s, e) && s.phase === 'Active' && e.type === 'input.next' &&
        s.slots.every((slot, i) => i === e.resource.generation || slot.ready),
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'input.next') throw new Error('illegal latest emit');
        const slots = s.slots.map((x, i) =>
          i === e.resource.generation ? { ...x, ready: true, value: e.value } : x);
        return { state: { ...s, slots }, actions: [next(slots.map(x => x.value as T))] };
      },
    },
    {
      description: desc('COMPLETE-WAIT', 'Active', 'input.complete', 'Active', 'live source; another source remains live',
        ['release completing input; retain latest value'], 'No early completion even if this source never emitted.'),
      enabled: (s, e) => matches(s, e) && s.phase === 'Active' && e.type === 'input.complete' &&
        s.slots.some((slot, i) => i !== e.resource.generation && slot.live),
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'input.complete') throw new Error('illegal latest completion');
        return { state: { ...s, slots: s.slots.map((x, i) =>
          i === e.resource.generation ? { ...x, live: false } : x) }, actions: [release(e.resource.generation)] };
      },
    },
    {
      description: desc('COMPLETE-LAST', 'Active', 'input.complete', 'Closed', 'final live input',
        ['complete downstream', 'release final input'], 'Completion waits for all inputs, independent of readiness.'),
      enabled: (s, e) => matches(s, e) && s.phase === 'Active' && e.type === 'input.complete' &&
        s.slots.every((slot, i) => i === e.resource.generation || !slot.live),
      react: (_s, e) => {
        if (e.type !== 'input.complete') throw new Error('illegal last completion');
        return { state: close('complete'), actions: [completed, release(e.resource.generation)] };
      },
    },
  );
  else rules.push(
    {
      description: desc('NEXT', 'Active', 'input.next', 'Active', 'only active input',
        ['forward value unchanged'], 'Concatenation preserves the identity and order of every value.'),
      enabled: (s, e) => matches(s, e) && e.type === 'input.next',
      react: (s, e) => {
        if (e.type !== 'input.next') throw new Error('illegal serial next');
        return { state: s, actions: [next(e.value)] };
      },
    },
    {
      description: desc('COMPLETE-ADVANCE', 'Active', 'input.complete', 'Active', 'next input exists',
        ['release current input', 'connect next source'], 'Only completion permits advancing the serial source.'),
      enabled: (s, e) => matches(s, e) && s.phase === 'Active' &&
        e.type === 'input.complete' && s.current < p.otherSources,
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'input.complete') throw new Error('illegal serial advance');
        const nextIndex = s.current + 1;
        return { state: { ...s, current: nextIndex,
          slots: s.slots.map((x, i) => ({ ...x, live: i === nextIndex })) },
          actions: [release(e.resource.generation), acquire(nextIndex)] };
      },
    },
    {
      description: desc('COMPLETE-LAST', 'Active', 'input.complete', 'Closed', 'last input has completed',
        ['complete downstream', 'release final input'], 'There is no next subscription after the last input.'),
      enabled: (s, e) => matches(s, e) && s.phase === 'Active' &&
        e.type === 'input.complete' && s.current === p.otherSources,
      react: (_s, e) => {
        if (e.type !== 'input.complete') throw new Error('illegal serial last');
        return { state: close('complete'), actions: [completed, release(e.resource.generation)] };
      },
    },
  );
  rules.push(
    {
      description: desc('ERROR', 'Active', 'input.error', 'Closed', 'currently subscribed input',
        ['propagate original error', 'cancel all active inputs'], 'Failure aborts the join, without subscribing to more sources.'),
      enabled: (s, e) => matches(s, e),
      react: (s, e) => {
        if (e.type !== 'input.error') throw new Error('illegal input error');
        return { state: close('input-error'), actions: [failed(e.error), ...owned(s)] };
      },
    },
    {
      description: desc('CANCEL', 'Active', 'cancel', 'Closed', 'downstream cancels',
        ['unsubscribe active inputs, no terminal output'], 'Cancellation is silent and does not create late subscriptions.'),
      enabled: () => true,
      react: s => ({ state: close('cancel'), actions: owned(s) }),
    },
  );
  return {
    metadata: metadata(p), parameters: p, rules,
    initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => {
      if (s.phase !== 'Active') return [];
      if (s.slots.length !== otherSources + 1 || s.slots.some(slot =>
        typeof slot.live !== 'boolean' || typeof slot.ready !== 'boolean')) return ['invalid input slots'];
      if (!natural(s.current) || s.current > otherSources) return ['invalid current input'];
      if (policy === 'serial' && s.slots.some((slot, i) =>
        slot.live !== (i === s.current))) return ['serial source ownership invariant violated'];
      if (policy === 'serial' && s.slots.some((slot, i) =>
        i > s.current && slot.ready)) return ['not-yet-connected source has latest value'];
      return [];
    },
    validateReaction: (before, event, reaction) => {
      const errors = [...validateActionWord(reaction.actions)];
      if (reaction.actions.some(a => a.type === 'notify' && a.target !== 'downstream'))
        errors.push('invalid notification target');
      const values = reaction.actions.filter(a => a.type === 'notify' && a.notification.kind === 'N');
      if (event.type === 'input.next' && policy === 'serial' &&
        (values.length !== 1 || !Object.is(values[0]?.notification.kind === 'N' && values[0].notification.value, event.value)))
        errors.push('serial input not forwarded once by identity');
      if (event.type === 'input.next' && policy === 'latest' && values.some(a =>
        a.notification.kind === 'N' && (!Array.isArray(a.notification.value) ||
        (before.phase === 'Active' && a.notification.value.length !== before.slots.length))))
        errors.push('latest output is not a complete source-ordered array');
      if ((event.type === 'cancel' || event.type === 'input.error') && values.length)
        errors.push('invalid value output on cancellation or error');
      return errors;
    },
  };
}

export const createCombineLatestModel = <T>(otherSources = 1): JoinModel<T> => create<T>('combineLatest', otherSources);
export const createCombineLatestWithModel = <T>(otherSources = 1): JoinModel<T> => create<T>('combineLatestWith', otherSources);
export const createConcatModel = <T>(otherSources = 2): JoinModel<T> => create<T>('concat', otherSources);
export const createConcatWithModel = <T>(otherSources = 2): JoinModel<T> => create<T>('concatWith', otherSources);
const at = (time: number, event: JoinEvent<number>): TimedEvent<JoinEvent<number>> => ({ time, event });
const a = (index: number): ResourceRef => input(index);
export const combineLatestExample = [
  at(0, { type: 'subscribe' }),
  at(1, { type: 'input.next', resource: a(0), value: 1 }),
  at(2, { type: 'input.next', resource: a(1), value: 10 }),
  at(3, { type: 'input.next', resource: a(0), value: 2 }),
  at(4, { type: 'input.complete', resource: a(0) }),
  at(5, { type: 'input.next', resource: a(1), value: 11 }),
  at(6, { type: 'input.complete', resource: a(1) }),
] as const;
export const combineLatestWithExample = combineLatestExample;
export const concatExample = [
  at(0, { type: 'subscribe' }),
  at(1, { type: 'input.next', resource: a(0), value: 1 }),
  at(2, { type: 'input.complete', resource: a(0) }),
  at(3, { type: 'input.next', resource: a(1), value: 2 }),
  at(4, { type: 'input.complete', resource: a(1) }),
  at(5, { type: 'input.next', resource: a(2), value: 3 }),
  at(6, { type: 'input.complete', resource: a(2) }),
] as const;
export const concatWithExample = concatExample;
