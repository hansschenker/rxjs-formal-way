import type { Action, ModelMetadata, OperatorModel, Reaction, ResourceRef, Rule, RuleDescription, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';

export type FlattenOperator = 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap';
export type FlattenParameters = Readonly<{
  operator: FlattenOperator; concurrent: number | 'unbounded'; callbackId: string;
}>;
/** A source token names an external Observable binding; it is not a subscription identity. */
export type InnerBinding<Source> = Readonly<{ resource: ResourceRef; source: Source }>;
type Memory<Input, Source> = Readonly<{
  index: number; active: readonly InnerBinding<Source>[]; queue: readonly Input[];
}>;
export type FlattenState<Input, Source = string> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | (Readonly<{ phase: 'Active' | 'Draining' }> & Memory<Input, Source>)
  | (Readonly<{ phase: 'Calling'; resume: 'Active' | 'Draining'; input: Input; callId: number }> & Memory<Input, Source>)
  | Readonly<{ phase: 'Closed'; reason: 'complete' | 'outer-error' | 'inner-error' | 'project-error' | 'cancel' }>;
export type FlattenEvent<Input, Output, Source = string> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'outer.complete' }>
  | Readonly<{ type: 'outer.next'; value: Input }>
  | Readonly<{ type: 'outer.error'; error: unknown }>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef; value: Source }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>
  | Readonly<{ type: 'inner.next'; resource: ResourceRef; value: Output }>
  | Readonly<{ type: 'inner.complete'; resource: ResourceRef }>
  | Readonly<{ type: 'inner.error'; resource: ResourceRef; error: unknown }>;
export type FlattenModel<Input, Output, Source = string> = OperatorModel<
  FlattenParameters, FlattenState<Input, Source>, FlattenEvent<Input, Output, Source>, Action<Output, Input>>;

const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const outer = { id: 'outer', generation: 0 } as const;
const acquireOuter = { type: 'subscribe', resource: outer } as const;
const releaseOuter = { type: 'unsubscribe', resource: outer } as const;
const complete = { type: 'notify', target: 'downstream', notification: { kind: 'C' } } as const;
const natural = (x: number): boolean => Number.isSafeInteger(x) && x >= 0;
const same = (a: ResourceRef, b: ResourceRef): boolean => a.id === b.id && a.generation === b.generation;
const release = (resource: ResourceRef) => ({ type: 'unsubscribe', resource } as const);
const fail = (error: unknown) => ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error } } as const);
const limit = (p: FlattenParameters): number => p.concurrent === 'unbounded' ? Infinity : p.concurrent;

function metadata(p: FlattenParameters): ModelMetadata {
  const purposes: Record<FlattenOperator, string> = {
    switchMap: 'Only the latest: replace the current inner subscription before projecting the next outer value.',
    mergeMap: 'Allow overlap up to the concurrency limit; queue excess outer values before projection.',
    concatMap: 'Queue outer values and subscribe to one projected inner at a time.',
    exhaustMap: 'Ignore new outer values while an inner is active; resume admission when it completes.',
  };
  return {
    schemaVersion: '1.1', id: `${p.operator}-${p.concurrent}`, operator: p.operator, rxjsVersion: '7.8.2',
    purpose: purposes[p.operator],
    cardinality: { signature: `${p.operator} : (T! x Index! -> R*) -> T* -> R*`, conditions: [
      'A projection describes an inner stream, not one guaranteed result; each accepted inner may emit zero, many or indefinitely many values.',
      'The signature omits termination, cancellation and scheduling; the named rules supply those policies.',
      p.operator === 'exhaustMap' ? 'Ignored arrivals do not invoke the projection and do not advance its index.' : 'The index advances when projection starts, not while a value waits in a queue.',
    ] },
    scope: {
      parameters: `Named projection binding; concurrency ${p.concurrent}; nonnegative safe-integer invocation indices`,
      callbacks: 'A pure rule requests projection once; a correlated return names an external valid Observable binding. A driver resolves inner subscription resources through the returned source-token registry.',
      time: 'No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.',
      reentrancy: 'Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.',
      exclusions: ['Deprecated resultSelector, arbitrary ObservableInput conversion, invalid project results and unsafe index overflow.',
        'Reentrant source/projection/observer/finalizer calls, cancellation inside notification delivery, throwing observers or finalizers.',
        'No producer-abort guarantee: unsubscribe stops this subscription; external work stops only if its teardown implements cancellation.',
        'Synchronous inner notification behavior is characterized separately; post-setup cleanup order is not asserted for every synchronous producer.'],
    },
    initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: 'Acquire one outer subscription; no projection or inner subscription before an accepted outer value.' },
    ownership: { state: 'subscription-local', sharing: 'No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.',
      reset: 'Fresh bookkeeping per result subscription. Closed has no admissible events. Payloads and source tokens are retained by reference.',
      resources: [{ id: 'outer', kind: 'subscription', owner: 'this result subscription' },
        { id: 'inner', kind: 'subscription', owner: 'this result subscription; generation is its admission index' },
        { id: p.callbackId, kind: 'callback', owner: 'external projection binding; generation correlates the invocation' }] },
    dispatch: { policy: 'atomic-non-reentrant', actionSemantics: 'Commit next state, then interpret the ordered actions. A return is resolved before the next external input. Never replace RxJS delivery with an implicit event FIFO.',
      cancellationCheckpoints: ['Between fully resolved reactions; release the outer if still open and all active inners; discard queued values without completing.', 'Outer completion is not cancellation of admitted or queued inner work.'] },
    inputs: [
      { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'a fresh result subscription connects' },
      { type: 'outer.next', origin: 'outer', category: 'notification', description: 'the outer source delivers a value' },
      { type: 'callback.return', origin: 'callback', category: 'callback', description: 'the pending projection returns a valid inner-source token' },
      { type: 'callback.throw', origin: 'callback', category: 'callback', description: 'the pending projection throws' },
      { type: 'inner.next', origin: 'inner', category: 'notification', description: 'an admitted inner subscription delivers a value' },
      { type: 'inner.complete', origin: 'inner', category: 'notification', description: 'an admitted inner subscription completes' },
      { type: 'inner.error', origin: 'inner', category: 'notification', description: 'an admitted inner subscription errors' },
      { type: 'outer.complete', origin: 'outer', category: 'notification', description: 'the outer source completes' },
      { type: 'outer.error', origin: 'outer', category: 'notification', description: 'the outer source errors' },
      { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'downstream unsubscribes' },
    ],
    actionTypes: ['subscribe', 'unsubscribe', 'invoke-callback', 'notify'],
    controls: [
      { id: 'Unsubscribed', description: 'not connected', terminal: false },
      { id: 'Active', description: 'outer open; active inners and queue are explicit stored data', terminal: false },
      { id: 'Calling', description: 'one unresolved synchronous projection, with a reserved concurrency slot', terminal: false },
      { id: 'Draining', description: 'outer completed; wait for admitted/queued work', terminal: false },
      { id: 'Closed', description: 'completed, errored or cancelled; owns no live subscriptions', terminal: true },
    ],
    sources: [`src/internal/operators/${p.operator}.ts`, ...(p.operator === 'mergeMap' || p.operator === 'concatMap' ? ['src/internal/operators/mergeInternals.ts'] : []),
      'src/internal/operators/OperatorSubscriber.ts', 'src/internal/Subscriber.ts', 'src/internal/Subscription.ts'].map(path => ({
        url: `https://github.com/ReactiveX/rxjs/blob/${revision}/${path}`, revision, purpose: 'Pinned admission, projection, completion and teardown behavior',
      })),
    evidence: { modelTests: ['tests/session2-flatten-model.test.mjs'], runtimeTests: ['tests/session2-flatten-rxjs.test.mjs'], status: 'source-inspected', record: 'evidence/SESSION-02.md' },
  };
}

/** Shared policy machinery, not an implementation of an RxJS operator. */
function createFlattenModel<Input, Output, Source>(p: FlattenParameters): FlattenModel<Input, Output, Source> {
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(p.callbackId) || ['outer', 'inner'].includes(p.callbackId)) throw new TypeError('projection binding must be distinct from subscription resource names');
  const capacity = limit(p), queues = p.operator === 'mergeMap' || p.operator === 'concatMap';
  if (!(capacity === Infinity || (natural(capacity) && capacity > 0))) throw new RangeError('concurrency must be a positive safe integer or Infinity');
  type S = FlattenState<Input, Source>;
  type E = FlattenEvent<Input, Output, Source>;
  type A = Action<Output, Input>;
  type R = Rule<FlattenParameters, S, E, A>;
  const prefix = p.operator.toUpperCase();
  const rules: R[] = [];
  const add = (suffix: string, from: string, event: string, guard: string, to: string, actions: readonly string[], nextState: string,
    explanation: string, witness: string, enabled: R['enabled'], react: R['react']): void => {
    const description: RuleDescription = { id: `${prefix}-${suffix}`, from, event, guard, to, actions, nextState, explanation, obligations: [`S2-${prefix}-${witness}`] };
    rules.push({ description, enabled, react });
  };
  const core = (s: Memory<Input, Source>): Memory<Input, Source> => ({ index: s.index, active: s.active, queue: s.queue });
  const connected = (s: S): s is Extract<S, { phase: 'Active' | 'Draining' }> => s.phase === 'Active' || s.phase === 'Draining';
  const outerOpen = (s: S): boolean => s.phase === 'Active' || (s.phase === 'Calling' && s.resume === 'Active');
  const close = (reason: Extract<S, { phase: 'Closed' }>['reason']): S => ({ phase: 'Closed', reason });
  const cleanup = (s: Extract<S, { phase: 'Active' | 'Draining' | 'Calling' }>): A[] => [
    ...(outerOpen(s) ? [releaseOuter] : []), ...s.active.map(x => release(x.resource)),
  ];
  const call = (s: Memory<Input, Source>, resume: 'Active' | 'Draining', input: Input): Reaction<S, A> => ({
    state: { phase: 'Calling', resume, ...core(s), index: s.index + 1, callId: s.index, input },
    actions: [{ type: 'invoke-callback', resource: { id: p.callbackId, generation: s.index }, value: input, index: s.index }],
  });
  const matchesCall = (s: S, e: E): boolean => s.phase === 'Calling' && (e.type === 'callback.return' || e.type === 'callback.throw') &&
    e.resource.id === p.callbackId && e.resource.generation === s.callId;
  const matchesInner = (s: S, e: E): boolean => connected(s) && (e.type === 'inner.next' || e.type === 'inner.complete' || e.type === 'inner.error') &&
    s.active.some(x => same(x.resource, e.resource));

  add('INIT', 'Unsubscribed', 'subscribe', 'fresh execution', 'Active', ['subscribe to the outer source'], 'outer open with index zero and no active inners or queued values',
    'Subscription connects to the outer source. Pipeline construction alone starts no projection or inner execution.', '01', () => true,
    () => ({ state: { phase: 'Active', index: 0, active: [], queue: [] }, actions: [acquireOuter] }));
  add('ADMIT', 'Active', 'outer.next', 'a concurrency slot is available and the index can advance', 'Calling', ['request one projection with the input and admission index'], 'one pending projection; index advanced once',
    'An accepted outer value invokes the projection once with that value and the next zero-based admission index. The returned inner source is subscribed only after projection succeeds.', '02',
    s => s.phase === 'Active' && s.active.length < capacity && s.index < Number.MAX_SAFE_INTEGER,
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'outer.next') throw new Error('invalid admission'); return call(s, 'Active', e.value); });
  if (p.operator === 'switchMap') add('REPLACE', 'Active', 'outer.next', 'an inner is active and the index can advance', 'Calling',
    ['unsubscribe the previous inner', 'request the new projection'], 'previous inner removed before the new projection',
    'When another outer value arrives, unsubscribe the current inner before invoking the new projection. Only the replacement inner may subsequently contribute values; cancellation does not undo previously delivered values.', '03',
    s => s.phase === 'Active' && s.active.length === 1 && s.index < Number.MAX_SAFE_INTEGER,
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'outer.next') throw new Error('invalid replacement');
      const result = call({ ...core(s), active: [] }, 'Active', e.value);
      return { state: result.state, actions: [...s.active.map(x => release(x.resource)), ...result.actions] }; });
  if (queues && capacity !== Infinity) add('QUEUE', 'Active', 'outer.next', 'all concurrency slots are occupied', 'Active', [], 'append the raw outer value to the FIFO queue without changing the projection index',
    'When all slots are occupied, retain the outer value in arrival order. Do not project it yet. A later inner completion admits the oldest queued value.', '03',
    s => s.phase === 'Active' && s.active.length === capacity,
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'outer.next') throw new Error('invalid queue'); return { state: { ...s, queue: [...s.queue, e.value] }, actions: [] }; });
  if (p.operator === 'exhaustMap') add('IGNORE', 'Active', 'outer.next', 'an inner is active', 'Active', [], 'retain the current inner and index; keep no queued copy',
    'While an inner is active, ignore new outer values completely. They neither invoke the projection nor consume an index, and they are not saved for later.', '03',
    s => s.phase === 'Active' && s.active.length === 1,
    s => ({ state: s, actions: [] }));

  for (const resume of (queues && capacity !== Infinity ? ['Active', 'Draining'] : ['Active']) as readonly ('Active' | 'Draining')[]) {
    add(`RETURN-${resume.toUpperCase()}`, 'Calling', 'callback.return', `matching invocation with resume=${resume}`, resume,
      ['subscribe the returned source under the pending invocation generation'], 'new inner admitted; no outer value emitted directly',
      resume === 'Active' ? 'A successful projection starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.' : 'Queued outer values still get projected after outer completion. Their inner subscriptions must also finish before the result can complete.', '04',
      (s, e) => matchesCall(s, e) && s.phase === 'Calling' && s.resume === resume,
      (s, e) => { if (s.phase !== 'Calling' || e.type !== 'callback.return') throw new Error('invalid return');
        const resource = { id: 'inner', generation: s.callId };
        return { state: { phase: resume, ...core(s), active: [...s.active, { resource, source: e.value }] }, actions: [{ type: 'subscribe', resource }] }; });
  }
  add('THROW', 'Calling', 'callback.throw', 'matching projection invocation', 'Closed', ['error downstream with the thrown value', 'release the open outer and every remaining inner; discard the queue'], 'closed by projection error',
    'If projection throws, forward that error and tear down all owned subscriptions. Queued values are discarded without projection, and no completion follows.', '05', matchesCall,
    (s, e) => { if (s.phase !== 'Calling' || e.type !== 'callback.throw') throw new Error('invalid throw'); return { state: close('project-error'), actions: [fail(e.error), ...cleanup(s)] }; });

  for (const phase of ['Active', 'Draining'] as const) {
    add(`NEXT-${phase.toUpperCase()}`, phase, 'inner.next', 'the notification belongs to an active inner generation', phase, ['forward the inner value unchanged'], 'retain the same active set and queue',
      phase === 'Active' ? 'Values from admitted active inners are forwarded unchanged in actual delivery order.' : 'After the outer completes, values from remaining inners continue to flow until those inners finish.', '06', matchesInner,
      (s, e) => { if (e.type !== 'inner.next') throw new Error('invalid inner next'); return { state: s, actions: [{ type: 'notify', target: 'downstream', notification: { kind: 'N', value: e.value } }] }; });
    add(`INNER-ERROR-${phase.toUpperCase()}`, phase, 'inner.error', 'the error belongs to an active inner generation', 'Closed',
      ['error downstream unchanged', 'release all owned subscriptions and discard queued values'], 'closed by inner error',
      phase === 'Active' ? 'An active inner error ends the whole result, including the outer subscription and other active inners.' : 'An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.', '07', matchesInner,
      (s, e) => { if (!connected(s) || e.type !== 'inner.error') throw new Error('invalid inner error'); return { state: close('inner-error'), actions: [fail(e.error), ...cleanup(s)] }; });
    add(`CANCEL-${phase.toUpperCase()}`, phase, 'cancel', 'between resolved reactions', 'Closed', ['release the open outer and active inners; discard the queue without notifying downstream'], 'closed by cancellation',
      phase === 'Active' ? 'Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.' : 'Cancellation while draining releases the remaining inners and discards queued work without completion.', '08', () => true,
      s => { if (!connected(s)) throw new Error('invalid cancel'); return { state: close('cancel'), actions: cleanup(s) }; });
    if (queues && capacity !== Infinity) add(`DRAIN-${phase.toUpperCase()}`, phase, 'inner.complete', 'matching inner; queue nonempty; projection index can advance', 'Calling',
      ['release the completed inner', 'dequeue the oldest value and request its projection'], 'one slot reserved for the dequeued input; other inners remain active',
      phase === 'Active' ? 'When an inner completes, release it and admit the oldest queued value into the free slot. Its projection runs now, not when it originally arrived.' : 'Outer completion does not discard the queue. Continue admitting queued values as inner subscriptions finish.', '09',
      (s, e) => matchesInner(s, e) && connected(s) && s.queue.length > 0 && s.index < Number.MAX_SAFE_INTEGER,
      (s, e) => { if (!connected(s) || e.type !== 'inner.complete') throw new Error('invalid drain');
        const result = call({ ...core(s), active: s.active.filter(x => !same(x.resource, e.resource)), queue: s.queue.slice(1) }, phase, s.queue[0]!);
        return { state: result.state, actions: [release(e.resource), ...result.actions] }; });
    if (phase === 'Active' || capacity > 1) add(`INNER-END-${phase.toUpperCase()}`, phase, 'inner.complete',
      phase === 'Active' ? 'matching inner and empty queue' : 'matching inner, empty queue, and another inner remains', phase,
      ['release the completed inner'], 'remove that inner and keep waiting',
      phase === 'Active' ? 'An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.' : 'When one of several remaining inners completes, keep waiting for the others.', '10',
      (s, e) => matchesInner(s, e) && connected(s) && s.queue.length === 0 && (phase === 'Active' || s.active.length > 1),
      (s, e) => { if (!connected(s) || e.type !== 'inner.complete') throw new Error('invalid inner end'); return { state: { ...s, active: s.active.filter(x => !same(x.resource, e.resource)) }, actions: [release(e.resource)] }; });
  }
  add('LAST-INNER', 'Draining', 'inner.complete', 'matching final inner and empty queue', 'Closed',
    queues ? ['release the final inner', 'complete downstream'] : ['complete downstream', 'release the final inner'], 'closed by successful completion',
    'The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.', '11',
    (s, e) => matchesInner(s, e) && s.phase === 'Draining' && s.active.length === 1 && s.queue.length === 0,
    (_s, e) => { if (e.type !== 'inner.complete') throw new Error('invalid last inner'); return { state: close('complete'), actions: queues ? [release(e.resource), complete] : [complete, release(e.resource)] }; });
  add('OUTER-WAIT', 'Active', 'outer.complete', 'at least one active inner', 'Draining', ['release the completed outer subscription'], 'outer done; preserve active inners and queued values',
    'Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.', '12',
    s => s.phase === 'Active' && s.active.length > 0,
    s => { if (s.phase !== 'Active') throw new Error('invalid outer completion'); return { state: { phase: 'Draining', ...core(s) }, actions: [releaseOuter] }; });
  add('OUTER-END', 'Active', 'outer.complete', 'no active inner and empty queue', 'Closed', ['complete downstream', 'release the outer subscription'], 'closed by successful completion',
    'If the outer completes with no inner work left, complete immediately and release the outer subscription.', '13',
    s => s.phase === 'Active' && s.active.length === 0 && s.queue.length === 0,
    () => ({ state: close('complete'), actions: [complete, releaseOuter] }));
  add('OUTER-ERROR', 'Active', 'outer.error', 'outer still open', 'Closed', ['error downstream unchanged', 'release the outer and active inners; discard the queue'], 'closed by outer error',
    'An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.', '14', () => true,
    (s, e) => { if (s.phase !== 'Active' || e.type !== 'outer.error') throw new Error('invalid outer error'); return { state: close('outer-error'), actions: [fail(e.error), ...cleanup(s)] }; });

  return {
    metadata: metadata(p), parameters: p, rules, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      if (s.phase === 'Unsubscribed') return [];
      if (s.phase === 'Closed') return ['complete', 'outer-error', 'inner-error', 'project-error', 'cancel'].includes(s.reason) ? [] : ['invalid close reason'];
      const errors: string[] = [];
      if (!natural(s.index)) errors.push('invalid projection index');
      const ids = s.active.map(x => x.resource.generation);
      if (new Set(ids).size !== ids.length || s.active.some(x => x.resource.id !== 'inner' || !natural(x.resource.generation) || x.resource.generation >= s.index || !Object.hasOwn(x, 'source'))) errors.push('invalid active inner identities');
      if (ids.some((x, i) => i > 0 && x <= ids[i - 1]!)) errors.push('active subscriptions must retain acquisition order');
      if (!queues && s.queue.length) errors.push('this policy cannot queue');
      if (s.active.length + (s.phase === 'Calling' ? 1 : 0) > capacity) errors.push('concurrency exceeded');
      if (s.phase !== 'Calling' && s.queue.length && s.active.length !== capacity) errors.push('queued work with an unreserved free slot');
      if (s.phase === 'Draining' && !s.active.length) errors.push('draining must have active work');
      if (s.phase === 'Calling' && (!natural(s.callId) || s.callId >= Number.MAX_SAFE_INTEGER || s.index !== s.callId + 1 || !Object.hasOwn(s, 'input') || !['Active', 'Draining'].includes(s.resume) || (s.resume === 'Draining' && (!queues || capacity === Infinity)))) errors.push('invalid pending projection');
      return errors;
    },
    validateReaction: (before, event, result) => {
      const errors = [...validateActionWord(result.actions)];
      const invokes = result.actions.filter(a => a.type === 'invoke-callback');
      const acquisitions = result.actions.filter(a => a.type === 'subscribe');
      for (const a of result.actions) {
        if (a.type === 'notify') { if (a.target !== 'downstream') errors.push('unknown notification target'); }
        else if (a.type === 'invoke-callback') { if (a.resource.id !== p.callbackId) errors.push('unknown projection binding'); }
        else if (!['subscribe', 'unsubscribe'].includes(a.type) || !['outer', 'inner'].includes(a.resource.id) || (a.resource.id === 'outer' && a.resource.generation !== 0)) errors.push('unknown subscription action');
      }
      if (result.state.phase === 'Calling') {
        if (!connected(before) || invokes.length !== 1 || invokes[0]!.index !== before.index || result.state.callId !== before.index) errors.push('Calling requires one correctly indexed request');
        const input = event.type === 'outer.next' ? event.value : connected(before) ? before.queue[0] : undefined;
        if (invokes[0] && !Object.is(invokes[0].value, input)) errors.push('projection input changed');
        if (p.operator === 'switchMap' && connected(before) && before.active.length && result.actions[0]?.type !== 'unsubscribe') errors.push('replacement must release before projection');
      } else if (invokes.length) errors.push('projection request without Calling');
      if (event.type === 'callback.return' && before.phase === 'Calling') {
        if (acquisitions.length !== 1 || acquisitions[0]?.type !== 'subscribe' || acquisitions[0].resource.id !== 'inner' || acquisitions[0].resource.generation !== before.callId) errors.push('invalid inner acquisition');
        if (!connected(result.state) || !Object.is(result.state.active.at(-1)?.source, event.value)) errors.push('returned source binding not retained');
      }
      if (result.state.phase !== 'Closed' && result.actions.some(a => a.type === 'notify' && a.notification.kind !== 'N')) errors.push('live after terminal notification');
      if (event.type === 'inner.next') {
        const a = result.actions[0];
        if (result.actions.length !== 1 || a?.type !== 'notify' || a.notification.kind !== 'N' || !Object.is(a.notification.value, event.value)) errors.push('inner value not forwarded exactly once');
      }
      return errors;
    },
  };
}

export const createSwitchMapModel = <Input, Output, Source = string>(callbackId = 'project'): FlattenModel<Input, Output, Source> =>
  createFlattenModel({ operator: 'switchMap', concurrent: 1, callbackId });
export const createMergeMapModel = <Input, Output, Source = string>(concurrent = Infinity, callbackId = 'project'): FlattenModel<Input, Output, Source> =>
  createFlattenModel({ operator: 'mergeMap', concurrent: concurrent === Infinity ? 'unbounded' : concurrent, callbackId });
export const createConcatMapModel = <Input, Output, Source = string>(callbackId = 'project'): FlattenModel<Input, Output, Source> =>
  createFlattenModel({ operator: 'concatMap', concurrent: 1, callbackId });
export const createExhaustMapModel = <Input, Output, Source = string>(callbackId = 'project'): FlattenModel<Input, Output, Source> =>
  createFlattenModel({ operator: 'exhaustMap', concurrent: 1, callbackId });

const inner = (generation: number): ResourceRef => ({ id: 'inner', generation });
const projection = (generation: number): ResourceRef => ({ id: 'project', generation });
const at = (time: number, event: FlattenEvent<string, string>): TimedEvent<FlattenEvent<string, string>> => ({ time, event });
export const switchMapExample = [
  at(0, { type: 'subscribe' }), at(1, { type: 'outer.next', value: 'a' }), at(1, { type: 'callback.return', resource: projection(0), value: 'A' }),
  at(2, { type: 'inner.next', resource: inner(0), value: 'a1' }), at(3, { type: 'outer.next', value: 'b' }), at(3, { type: 'callback.return', resource: projection(1), value: 'B' }),
  at(4, { type: 'outer.complete' }), at(5, { type: 'inner.next', resource: inner(1), value: 'b1' }), at(6, { type: 'inner.complete', resource: inner(1) }),
] as const;
export const mergeMapExample = [
  at(0, { type: 'subscribe' }), at(1, { type: 'outer.next', value: 'a' }), at(1, { type: 'callback.return', resource: projection(0), value: 'A' }),
  at(2, { type: 'outer.next', value: 'b' }), at(2, { type: 'callback.return', resource: projection(1), value: 'B' }), at(3, { type: 'outer.next', value: 'c' }),
  at(4, { type: 'outer.complete' }), at(5, { type: 'inner.next', resource: inner(1), value: 'b1' }), at(6, { type: 'inner.complete', resource: inner(0) }),
  at(6, { type: 'callback.return', resource: projection(2), value: 'C' }), at(7, { type: 'inner.next', resource: inner(2), value: 'c1' }),
  at(8, { type: 'inner.complete', resource: inner(1) }), at(9, { type: 'inner.complete', resource: inner(2) }),
] as const;
export const concatMapExample = [
  at(0, { type: 'subscribe' }), at(1, { type: 'outer.next', value: 'a' }), at(1, { type: 'callback.return', resource: projection(0), value: 'A' }),
  at(2, { type: 'outer.next', value: 'b' }), at(3, { type: 'outer.complete' }), at(4, { type: 'inner.next', resource: inner(0), value: 'a1' }),
  at(5, { type: 'inner.complete', resource: inner(0) }), at(5, { type: 'callback.return', resource: projection(1), value: 'B' }),
  at(6, { type: 'inner.next', resource: inner(1), value: 'b1' }), at(7, { type: 'inner.complete', resource: inner(1) }),
] as const;
export const exhaustMapExample = [
  at(0, { type: 'subscribe' }), at(1, { type: 'outer.next', value: 'a' }), at(1, { type: 'callback.return', resource: projection(0), value: 'A' }),
  at(2, { type: 'outer.next', value: 'ignored' }), at(3, { type: 'inner.next', resource: inner(0), value: 'a1' }), at(4, { type: 'inner.complete', resource: inner(0) }),
  at(5, { type: 'outer.next', value: 'b' }), at(5, { type: 'callback.return', resource: projection(1), value: 'B' }), at(6, { type: 'outer.complete' }),
  at(7, { type: 'inner.next', resource: inner(1), value: 'b1' }), at(8, { type: 'inner.complete', resource: inner(1) }),
] as const;
