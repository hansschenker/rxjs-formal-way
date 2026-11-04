import type { Action, ModelMetadata, OperatorModel, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';

export type BufferOperator = 'buffer' | 'bufferCount';
export type BufferParameters = Readonly<{
  operator: BufferOperator;
  bufferSize: number;
  startBufferEvery: number;
}>;
export type BufferRecord<T> = Readonly<{ start: number; values: readonly T[] }>;
export type BufferState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Active'; seen: number; notifierLive: boolean; records: readonly BufferRecord<T>[] }>
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'source-error' | 'notifier-error' | 'cancel' }>;
export type BufferEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' | 'notifier.next' | 'notifier.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error' | 'notifier.error'; error: unknown }>;
export type BufferModel<T> = OperatorModel<BufferParameters, BufferState<T>, BufferEvent<T>, Action<T[]>>;

const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const source = { id: 'source', generation: 0 } as const;
const notifier = { id: 'closing-notifier', generation: 0 } as const;
const subscribeSource = { type: 'subscribe', resource: source } as const;
const subscribeNotifier = { type: 'subscribe', resource: notifier } as const;
const releaseSource = { type: 'unsubscribe', resource: source } as const;
const releaseNotifier = { type: 'unsubscribe', resource: notifier } as const;
const done = { type: 'notify', target: 'downstream', notification: { kind: 'C' } } as const;
const emit = <T>(values: readonly T[]): Action<T[]> => ({
  type: 'notify', target: 'downstream', notification: { kind: 'N', value: [...values] },
});
const error = <T>(value: unknown): Action<T[]> => ({
  type: 'notify', target: 'downstream', notification: { kind: 'E', error: value },
});
const valid = (n: number): boolean => Number.isSafeInteger(n) && n >= 0;
const sourcePaths = (op: BufferOperator) =>
  ['src/internal/operators/' + op + '.ts', 'src/internal/operators/OperatorSubscriber.ts',
   'src/internal/Subscriber.ts', 'src/internal/Subscription.ts'].map(path => ({
    url: 'https://github.com/ReactiveX/rxjs/blob/' + revision + '/' + path,
    revision, purpose: 'Pinned buffer opening, flush, notifier and teardown semantics',
  }));

function metadata(p: BufferParameters): ModelMetadata {
  const count = p.operator === 'bufferCount';
  return {
    schemaVersion: '1.1', id: count ? 'bufferCount-' + p.bufferSize + '-every-' + p.startBufferEvery : 'buffer-Observable-closing-notifier',
    operator: p.operator, rxjsVersion: '7.8.2',
    purpose: count ?
      'Open a buffer every configured number of source values, emit full buffers, and flush residual open buffers on completion.' :
      'Collect source values, emitting and resetting the array on each closing-notifier value and flushing once on source completion.',
    cardinality: {
      signature: count ? 'bufferCount(n,k) : T* -> (T*)*' : 'buffer : U* -> T* -> (T*)*',
      conditions: count ? [
        'Each full buffer has size n, with possible shorter residual buffers flushed at completion.',
        'k can be less than n (overlap), equal to n (contiguous), or greater than n (gaps).',
        'An empty source completes without a bufferCount value; error and cancellation never flush.',
      ] : [
        'Notifier next emits one array even if no source value has arrived.',
        'Notifier completion alone has no effect on the buffered values or source lifetime.',
        'Source completion emits exactly one final array, including an empty array; error/cancellation do not flush.',
      ],
    },
    scope: {
      parameters: count ? 'Positive safe-integer size and stride; source count remains within safe-integer range' : 'One valid Observable closing notifier; source and notifier remain non-reentrant',
      callbacks: 'No user callback. Source values retain reference identity inside emitted arrays; emitted arrays are fresh snapshots.',
      time: 'No timer or scheduler introduced. Source/notifier order is supplied by input sequence, including equal timestamps.',
      reentrancy: 'Post-setup, atomic non-reentrant notifications; setup-time synchronous delivery, observer throw and cancellation during delivery are excluded.',
      exclusions: ['Invalid/zero/negative/fractional bufferCount arguments, count overflow and arbitrary producer reentrancy.',
        'Synchronous notifier/source delivery during subscription setup, throwing observers/finalizers and cancellation during output delivery.',
        'ObservableInput conversion outside Observable notifiers, universal symbolic equivalence and arbitrary mutation of output arrays by observers.'],
    },
    initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription:
      count ? 'Acquire the source with no open buffers until the first source next.' :
        'Subscribe source first, then closing notifier; the initial current buffer is empty.' },
    ownership: { state: 'subscription-local', sharing: 'No sharing or replay introduced. Every result subscription has its own buffers and counters.',
      reset: 'Fresh arrays/counters per execution; Closed has no legal inputs.',
      resources: [{ id: 'source', kind: 'subscription', owner: 'current execution' },
        ...(count ? [] : [{ id: 'closing-notifier', kind: 'subscription' as const, owner: 'current execution' }])],
    },
    dispatch: { policy: 'atomic-non-reentrant', actionSemantics:
      count ? 'Each source notification opens a buffer on stride boundaries, appends to every active buffer, then emits and removes every full buffer in open order.' :
        'Notifier next swaps to a fresh active buffer before emitting the old buffer; notifier complete only releases notifier.',
      cancellationCheckpoints: ['Between resolved notifications; unsubscribe without a final buffer or synthetic complete.',
        'No callback/scheduler work is introduced; exact finalizer microorder is excluded.'],
    },
    inputs: [
      { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'connect the operator to its inputs' },
      { type: 'source.next', origin: 'source', category: 'notification', description: 'append the source value to active buffers' },
      { type: 'source.complete', origin: 'source', category: 'notification', description: 'flush open buffers and complete' },
      { type: 'source.error', origin: 'source', category: 'notification', description: 'discard buffers and propagate error' },
      { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'cancel without flushing' },
      ...(!count ? [
        { type: 'notifier.next', origin: 'inner' as const, category: 'notification' as const, description: 'emit and reset current buffer' },
        { type: 'notifier.complete', origin: 'inner' as const, category: 'notification' as const, description: 'stop notifier; source keeps running' },
        { type: 'notifier.error', origin: 'inner' as const, category: 'notification' as const, description: 'error downstream and release source' },
      ] : []),
    ],
    actionTypes: ['subscribe', 'notify', 'unsubscribe'],
    controls: [
      { id: 'Unsubscribed', description: 'not subscribed', terminal: false },
      { id: 'Active', description: 'source connected, buffers and input count remembered', terminal: false },
      { id: 'Closed', description: 'completed, errored, or cancelled', terminal: true },
    ],
    sources: sourcePaths(p.operator),
    evidence: { modelTests: ['tests/session07-buffer-model.test.mjs'],
      runtimeTests: ['tests/session07-buffer-rxjs.test.mjs'], status: 'source-inspected', record: 'evidence/SESSION-07.md' },
  };
}

function createModel<T>(p: BufferParameters): BufferModel<T> {
  const count = p.operator === 'bufferCount';
  const prefix = count ? 'BUFFERCOUNT' : 'BUFFER';
  type S = BufferState<T>; type E = BufferEvent<T>;
  type R = Rule<BufferParameters, S, E, Action<T[]>>;
  const desc = (id: string, event: string, guard: string, to: string,
    effects: readonly string[], next: string, explanation: string): R['description'] => ({
    id: prefix + '-' + id, from: id === 'INIT' ? 'Unsubscribed' : 'Active', event, guard, to,
    actions: effects, nextState: next, obligations: ['S7-' + prefix + '-' + id], explanation,
  });
  const close = (reason: 'complete' | 'source-error' | 'notifier-error' | 'cancel'): S => ({ phase: 'Closed', reason });
  const terminalResources = (s: S): Action<T[]>[] =>
    s.phase === 'Active' ? [releaseSource, ...(s.notifierLive ? [releaseNotifier] : [])] : [];
  const rules: R[] = [
    {
      description: desc('INIT', 'subscribe', 'fresh execution', 'Active',
        count ? ['subscribe to source'] : ['subscribe source, then notifier'],
        'no input seen and no open buffers', 'Construction is lazy. Each subscription initializes new state and acquires source inputs.'),
      enabled: () => true,
      react: () => ({ state: { phase: 'Active', seen: 0, notifierLive: !count, records: count ? [] : [{ start: 0, values: [] }] },
        actions: count ? [subscribeSource] : [subscribeSource, subscribeNotifier] }),
    },
    {
      description: desc('NEXT', 'source.next', 'connected with valid counter', 'Active',
        count ? ['open on stride boundary, append to all open buffers, emit and remove full buffers'] : ['append to the current buffer'],
        'advance the input counter and retain incomplete buffers',
        count ? 'A buffer opens on source indices 0,k,2k,...; full buffers are emitted in order after the current value has been appended.' :
          'Every source value is collected in the current array; no output is produced until a notifier signal or source completion.'),
      enabled: s => s.phase === 'Active' && s.seen < Number.MAX_SAFE_INTEGER,
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'source.next') throw new Error('invalid buffer next');
        const records = count && s.seen % p.startBufferEvery === 0 ?
          [...s.records, { start: s.seen, values: [] as readonly T[] }] : [...s.records];
        const updated = records.map(x => ({ start: x.start, values: [...x.values, e.value] }));
        if (!count) return { state: { ...s, seen: s.seen + 1, records: updated }, actions: [] };
        const full = updated.filter(x => x.values.length >= p.bufferSize);
        return { state: { ...s, seen: s.seen + 1, records: updated.filter(x => x.values.length < p.bufferSize) },
          actions: full.map(x => emit(x.values)) };
      },
    },
    {
      description: desc('SOURCE-COMPLETE', 'source.complete', 'connected', 'Closed',
        ['emit all remaining buffers', 'complete downstream', 'release owned subscriptions'],
        'closed and buffers discarded',
        count ? 'Completion flushes only open residual buffers; it never emits a new empty buffer if no source values created one.' :
          'Completion emits the current array, including an empty array, then completes downstream.'),
      enabled: () => true,
      react: s => {
        if (s.phase !== 'Active') throw new Error('invalid buffer completion');
        return { state: close('complete'), actions: [...s.records.map(x => emit(x.values)), done, ...terminalResources(s)] };
      },
    },
    {
      description: desc('SOURCE-ERROR', 'source.error', 'connected', 'Closed',
        ['forward original source error', 'release subscriptions without flush'],
        'closed with buffered values discarded', 'Source error propagates unchanged; stored values are not emitted.'),
      enabled: () => true,
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'source.error') throw new Error('invalid buffer source error');
        return { state: close('source-error'), actions: [error<T>(e.error), ...terminalResources(s)] };
      },
    },
    {
      description: desc('CANCEL', 'cancel', 'connected between reactions', 'Closed',
        ['release subscriptions with no notification'],
        'closed with buffered values discarded', 'Cancellation silently stops the operator and releases its owned subscriptions.'),
      enabled: () => true,
      react: s => ({ state: close('cancel'), actions: terminalResources(s) }),
    },
  ];
  if (!count) rules.push(
    {
      description: desc('NOTIFIER-NEXT', 'notifier.next', 'closing notifier still active', 'Active',
        ['emit the current buffer, including empty; start a fresh empty buffer'],
        'active with a new empty buffer', 'Each notifier value causes one output array and starts fresh collection; the notifier payload is ignored.'),
      enabled: s => s.phase === 'Active' && s.notifierLive,
      react: s => {
        if (s.phase !== 'Active') throw new Error('invalid notifier signal');
        return { state: { ...s, records: [{ start: s.seen, values: [] }] }, actions: [emit(s.records[0]!.values)] };
      },
    },
    {
      description: desc('NOTIFIER-COMPLETE', 'notifier.complete', 'closing notifier still active', 'Active',
        ['release completed notifier but keep collecting source values'],
        'active with the same accumulated buffer', 'Notifier completion without next neither flushes nor terminates the source.'),
      enabled: s => s.phase === 'Active' && s.notifierLive,
      react: s => {
        if (s.phase !== 'Active') throw new Error('invalid notifier completion');
        return { state: { ...s, notifierLive: false }, actions: [releaseNotifier] };
      },
    },
    {
      description: desc('NOTIFIER-ERROR', 'notifier.error', 'closing notifier still active', 'Closed',
        ['forward original notifier error', 'release subscriptions without flush'],
        'closed and values discarded', 'Notifier error propagates unchanged and cancels the source; no buffered values are emitted.'),
      enabled: s => s.phase === 'Active' && s.notifierLive,
      react: (s, e) => {
        if (s.phase !== 'Active' || e.type !== 'notifier.error') throw new Error('invalid notifier error');
        return { state: close('notifier-error'), actions: [error<T>(e.error), ...terminalResources(s)] };
      },
    },
  );
  return {
    metadata: metadata(p), parameters: p, rules,
    initialState: () => ({ phase: 'Unsubscribed' }),
    control: s => s.phase,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      if (s.phase === 'Closed') return ['complete', 'source-error', 'notifier-error', 'cancel'].includes(s.reason) ? [] : ['invalid close reason'];
      if (!valid(s.seen) || (count && s.notifierLive) || (!count && s.records.length !== 1)) return ['invalid buffer ownership/count'];
      if (s.records.some(x => !valid(x.start) || x.start > s.seen || !Array.isArray(x.values) ||
        (count && (!x.values.length || x.values.length >= p.bufferSize || x.start % p.startBufferEvery !== 0)))) return ['invalid active buffer record'];
      return [];
    },
    validateReaction: (s, e, r) => {
      const problems = [...validateActionWord(r.actions)];
      if (r.actions.some(a => a.type === 'notify' && a.target !== 'downstream')) problems.push('wrong notification target');
      if (e.type === 'source.next' && s.phase === 'Active') {
        if (r.state.phase !== 'Active' || r.state.seen !== s.seen + 1) problems.push('incorrect source index advancement');
      }
      const outputs = r.actions.filter(a => a.type === 'notify' && a.notification.kind === 'N');
      if (outputs.some(a => a.type === 'notify' && a.notification.kind === 'N' && !Array.isArray(a.notification.value)))
        problems.push('buffer output must be an array');
      if ((e.type === 'source.error' || e.type === 'notifier.error' || e.type === 'cancel') && outputs.length)
        problems.push('terminal error or cancellation flushed a buffer');
      if (e.type === 'source.complete' && r.actions.at(-1)?.type !== 'unsubscribe') problems.push('source completion did not release source');
      return problems;
    },
  };
}

export function createBufferModel<T>(): BufferModel<T> {
  return createModel<T>({ operator: 'buffer', bufferSize: 0, startBufferEvery: 0 });
}
export function createBufferCountModel<T>(bufferSize: number, startBufferEvery: number | null = null): BufferModel<T> {
  const stride = startBufferEvery ?? bufferSize;
  if (!Number.isSafeInteger(bufferSize) || bufferSize <= 0 ||
      !Number.isSafeInteger(stride) || stride <= 0)
    throw new RangeError('bufferCount scoped model requires positive safe-integer size and stride');
  return createModel<T>({ operator: 'bufferCount', bufferSize, startBufferEvery: stride });
}
export const bufferExample: readonly TimedEvent<BufferEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 1 } },
  { time: 2, event: { type: 'source.next', value: 2 } },
  { time: 3, event: { type: 'notifier.next' } },
  { time: 4, event: { type: 'notifier.next' } },
  { time: 5, event: { type: 'source.next', value: 3 } },
  { time: 6, event: { type: 'source.complete' } },
];
export const bufferCountExample: readonly TimedEvent<BufferEvent<number>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 1 } },
  { time: 2, event: { type: 'source.next', value: 2 } },
  { time: 3, event: { type: 'source.next', value: 3 } },
  { time: 4, event: { type: 'source.next', value: 4 } },
  { time: 5, event: { type: 'source.complete' } },
];
