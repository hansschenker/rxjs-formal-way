import type { Action, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { acquire, emit, failWith, finish, natural, release, sessionMetadata, sourceRef } from './session21-common.js';

export type LatestParameters = Readonly<{ inputCount: number; projector: 'none' }>;
export type LatestMemory = Readonly<{
  latest: readonly unknown[];
  hasValue: readonly boolean[];
  live: readonly boolean[];
  ready: boolean;
}>;
export type LatestState =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (LatestMemory & Readonly<{ phase: 'Active' }>)
  | Readonly<{ phase: 'Closed'; reason: 'source-complete' | 'source-error' | 'aux-error' | 'cancel' }>;
export type LatestEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>
  | Readonly<{ type: 'aux.next'; index: number; value: unknown }>
  | Readonly<{ type: 'aux.complete'; index: number }>
  | Readonly<{ type: 'aux.error'; index: number; error: unknown }>;
export type LatestModel<T> = OperatorModel<LatestParameters, LatestState, LatestEvent<T>, Action<unknown>>;
const auxRef = (index: number): ResourceRef => ({ id: 'aux:' + index, generation: 0 });
const closed = (reason: Extract<LatestState, { phase: 'Closed' }>['reason']): LatestState => ({ phase: 'Closed', reason });
const detach = (s: LatestMemory): readonly Action<unknown>[] =>
  [release(sourceRef), ...s.live.flatMap((yes, i) => yes ? [release(auxRef(i))] : [])];
const legalAux = (s: LatestState, e: LatestEvent<unknown>): boolean =>
  s.phase === 'Active' && 'index' in e && natural(e.index) && e.index < s.live.length && s.live[e.index] === true;

export function createWithLatestFromModel<T>(inputCount = 2): LatestModel<T> {
  if (!Number.isSafeInteger(inputCount) || inputCount < 1 || inputCount > 16)
    throw new RangeError('withLatestFrom scoped model needs 1 to 16 auxiliary Observables');
  const p: LatestParameters = { inputCount, projector: 'none' };
  type S = LatestState; type E = LatestEvent<T>;
  const rules: Rule<LatestParameters, S, E, Action<unknown>>[] = [];
  const add = (
    name: string, from: S['phase'], event: E['type'], to: S['phase'],
    guard: string, actions: readonly string[], nextState: string, explanation: string,
    enabled: (s: S, e: E) => boolean,
    react: (s: S, e: E) => Readonly<{ state: S; actions: readonly Action<unknown>[] }>,
  ): void => { rules.push({ description: { id: 'S22-WITHLATESTFROM-' + name, from, event, to, guard, actions,
    nextState, explanation, obligations: ['S22-WITHLATESTFROM-' + name] }, enabled, react }); };

  add('START', 'Unsubscribed', 'subscribe', 'Active', 'no subscription exists',
    ['subscribe to each auxiliary Observable in argument order', 'subscribe source last'],
    'All readiness bits start false; no result is emitted until every auxiliary has a value.',
    'Auxiliary subscriptions precede source subscription even though only source next can trigger output.',
    s => s.phase === 'Unsubscribed',
    () => ({ state: { phase: 'Active', latest: Array(inputCount).fill(undefined),
      hasValue: Array(inputCount).fill(false), live: Array(inputCount).fill(true), ready: false },
      actions: [...Array.from({ length: inputCount }, (_, i) => acquire(auxRef(i))), acquire(sourceRef)] }));

  add('AUX-NEXT', 'Active', 'aux.next', 'Active', 'addressed auxiliary remains subscribed',
    ['update latest auxiliary value and first-value presence bit, emit nothing'],
    'Readiness changes only when all auxiliaries have emitted at least once.',
    'Undefined is a valid present value. An auxiliary next never emits an output tuple.',
    (s, e) => e.type === 'aux.next' && legalAux(s, e),
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'aux.next') throw Error('expected auxiliary next');
      const latest = [...s.latest]; latest[e.index] = e.value;
      const hasValue = [...s.hasValue]; hasValue[e.index] = true;
      return { state: { ...s, latest, hasValue, ready: hasValue.every(Boolean) }, actions: [] }; });

  add('AUX-COMPLETE', 'Active', 'aux.complete', 'Active', 'addressed auxiliary remains subscribed',
    ['release completed auxiliary input only'],
    'The last value/presence bit is retained; empty completion can permanently block readiness.',
    'Auxiliary completion is not output completion. Its last value remains usable on future source next events.',
    (s, e) => e.type === 'aux.complete' && legalAux(s, e),
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'aux.complete') throw Error('expected auxiliary complete');
      const live = [...s.live]; live[e.index] = false;
      return { state: { ...s, live }, actions: [release(auxRef(e.index))] }; });

  add('AUX-ERROR', 'Active', 'aux.error', 'Closed', 'addressed auxiliary remains subscribed',
    ['error downstream with identical payload', 'cancel source and other live auxiliaries'],
    'Result terminates; no source value can recover auxiliary failure.',
    'One auxiliary error ends the result even if readiness was never reached.',
    (s, e) => e.type === 'aux.error' && legalAux(s, e),
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'aux.error') throw Error('expected auxiliary error');
      return { state: closed('aux-error'), actions: [failWith(e.error), ...detach(s)] }; });

  add('SOURCE-BLOCKED', 'Active', 'source.next', 'Active', 'at least one auxiliary has not yet produced a value',
    ['drop the source value; do not enqueue it for later replay'],
    'Latest ancillary values may still change but there is no source-triggered output.',
    'When readiness becomes true, earlier source values are lost rather than replayed.',
    s => s.phase === 'Active' && !s.ready,
    s => ({ state: s, actions: [] }));

  add('SOURCE-READY', 'Active', 'source.next', 'Active', 'every auxiliary has previously produced at least one value',
    ['emit a fresh tuple containing current source value and latest ancillary values'],
    'Auxiliary memory remains unchanged until another auxiliary next.',
    'The source, not auxiliary emission, determines output timing. Tuple members retain original value identity.',
    s => s.phase === 'Active' && s.ready,
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'source.next') throw Error('expected ready source next');
      return { state: s, actions: [emit([e.value, ...s.latest])] }; });

  add('SOURCE-COMPLETE', 'Active', 'source.complete', 'Closed', 'source completes regardless of readiness',
    ['complete downstream', 'release source and any remaining auxiliaries'],
    'Closed without a final snapshot or synthetic tuple.',
    'Auxiliary completion is irrelevant to source completion; no pending emissions wait for input readiness.',
    s => s.phase === 'Active',
    s => { if (s.phase !== 'Active') throw Error('expected source complete');
      return { state: closed('source-complete'), actions: [finish, ...detach(s)] }; });

  add('SOURCE-ERROR', 'Active', 'source.error', 'Closed', 'source fails',
    ['error downstream with same error', 'release source and live auxiliaries'],
    'Closed without retries or output tuples.',
    'Errors propagate by identity and are never projected into a value.',
    s => s.phase === 'Active',
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'source.error') throw Error('expected source error');
      return { state: closed('source-error'), actions: [failWith(e.error), ...detach(s)] }; });

  add('CANCEL', 'Active', 'cancel', 'Closed', 'outer downstream closes its connection',
    ['release source and all live auxiliaries, emit nothing'],
    'Closed; no retained latest values after teardown.',
    'Auxiliary subscriptions are owned by each result execution; no implicit share/replay.',
    s => s.phase === 'Active',
    s => { if (s.phase !== 'Active') throw Error('expected cancellation');
      return { state: closed('cancel'), actions: detach(s) }; });

  const basis = sessionMetadata({
    operator: 'withLatestFrom', id: 'withLatestFrom-' + inputCount + '-tuple',
    purpose: 'Use latest auxiliary values only at source emission time, gated by all auxiliaries having produced a value.',
    signature: 'withLatestFrom : (U₀*,…,Uₙ*) → T* → (T × U₀ × … × Uₙ)*',
    conditions: [
      'An output can occur only on source.next after every auxiliary has produced at least one next.',
      'Auxiliary next updates latest memory but never emits downstream; unready source values are dropped.',
      'Auxiliary completion retains last value and never terminates outer; source complete/error terminates regardless of readiness.',
    ],
    parameters: 'One to sixteen valid Observable auxiliaries; tuple output without deprecated result-selector projection.',
    callbacks: 'No user callback in this profile. Each output is a fresh array; each member is the unchanged opaque value/reference.',
    time: 'No scheduler added; source and auxiliary notifications supply time. Same-time ordering is explicit input order.',
    initialization: 'Subscribe auxiliary inputs in argument order first, then subscribe source; post-setup notifications only.',
    sharing: 'Independent result subscriptions own independent latest memory and auxiliary/source connections; no sharing or replay introduced.',
    exclusions: ['Zero auxiliary arguments, whose pinned implementation leaves ready false indefinitely.',
      'Deprecated resultSelector/projector overload, throwing projector and callback reentrancy.',
      'Synchronous setup-time notifications/errors and ObservableInput conversion from Promise/Iterable.',
      'Unbounded auxiliary counts and arbitrary arbitrary subscription-side effects.'],
    controls: ['Unsubscribed', 'Active', 'Closed'], testStem: 'session22-withLatestFrom',
    resources: [{ id: 'aux:*', kind: 'subscription', owner: 'result execution; input-indexed subscriptions' }],
    inputs: [
      { type: 'aux.next', origin: 'inner', category: 'notification', description: 'One auxiliary emits an opaque latest value.' },
      { type: 'aux.complete', origin: 'inner', category: 'notification', description: 'One auxiliary stops without terminating result.' },
      { type: 'aux.error', origin: 'inner', category: 'notification', description: 'One auxiliary fails and terminates result.' },
    ],
  });
  return {
    metadata: { ...basis,
      evidence: { ...basis.evidence, record: 'evidence/SESSION-22.md',
        scenarios: 'docs/SESSION-22-LATEST-GATE.md', coverage: 'docs/SESSION-22-LATEST-GATE.md' } },
    parameters: p, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase, rules,
    validateState: s => {
      if (s.phase !== 'Active') return s.phase === 'Closed' && !['source-complete', 'source-error', 'aux-error', 'cancel'].includes(s.reason)
        ? ['Invalid close reason.'] : [];
      const issues: string[] = [];
      if (s.latest.length !== inputCount || s.hasValue.length !== inputCount || s.live.length !== inputCount)
        issues.push('Auxiliary memory must match configured input count.');
      if (s.hasValue.some(v => typeof v !== 'boolean') || s.live.some(v => typeof v !== 'boolean'))
        issues.push('Presence and subscription liveness must be Boolean.');
      if (s.ready !== s.hasValue.every(Boolean)) issues.push('Readiness must reflect all presence bits.');
      return issues;
    },
    validateReaction: (before, event, r) => [
      ...validateActionWord(r.actions),
      ...(event.type === 'cancel' && r.actions.some(a => a.type === 'notify') ? ['Cancellation cannot emit.'] : []),
      ...(event.type === 'aux.next' && r.actions.some(a => a.type === 'notify') ? ['Auxiliary next cannot emit.'] : []),
      ...(event.type === 'source.next' && before.phase === 'Active' &&
         r.actions.some(a => a.type === 'notify' && a.notification.kind === 'N') !== before.ready ?
          ['Output occurs exactly when all auxiliaries are ready.'] : []),
    ],
  };
}

export const withLatestFromExample: readonly TimedEvent<LatestEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 'early' } },
  { time: 2, event: { type: 'aux.next', index: 0, value: 'left' } },
  { time: 3, event: { type: 'source.next', value: 'still-early' } },
  { time: 4, event: { type: 'aux.next', index: 1, value: undefined } },
  { time: 5, event: { type: 'source.next', value: 'first' } },
  { time: 6, event: { type: 'aux.complete', index: 1 } },
  { time: 7, event: { type: 'aux.next', index: 0, value: 'new-left' } },
  { time: 8, event: { type: 'source.next', value: 'second' } },
  { time: 9, event: { type: 'source.complete' } },
];
export const withLatestFromEmptyExample: readonly TimedEvent<LatestEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'aux.complete', index: 0 } },
  { time: 2, event: { type: 'aux.next', index: 1, value: 'ready-on-one' } },
  { time: 3, event: { type: 'source.next', value: 'discarded' } },
  { time: 4, event: { type: 'source.complete' } },
];
