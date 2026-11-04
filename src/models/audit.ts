import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent, Trace } from '../schema.js';
import { runTrace, validateActionWord } from '../runner.js';

export type AuditOperator = 'audit' | 'auditTime';
export type AuditParameters = Readonly<{ operator: AuditOperator; duration: number }>;
export type AuditState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Idle'; now: number; nextId: number }>
  | Readonly<{ phase: 'Calling'; now: number; nextId: number; value: T; callback: ResourceRef }>
  | Readonly<{ phase: 'Pending' | 'Waiting'; now: number; nextId: number; value: T;
      duration: ResourceRef; scheduledFor: number }>
  | Readonly<{ phase: 'Closed'; now: number; reason: 'complete' | 'source-error' | 'duration-error' | 'callback-error' | 'cancel' }>;
export type AuditEvent<T> =
  | Readonly<{ type: 'subscribe' | 'source.complete' | 'cancel'; now: number }>
  | Readonly<{ type: 'source.next'; now: number; value: T }>
  | Readonly<{ type: 'source.error' | 'duration.error' | 'callback.throw'; now: number; error: unknown; resource?: ResourceRef }>
  | Readonly<{ type: 'duration.next' | 'duration.complete' | 'timer.fire' | 'callback.return'; now: number; resource: ResourceRef }>;
export type AuditModel<T> = OperatorModel<AuditParameters, AuditState<T>, AuditEvent<T>, Action<T>>;
const rev = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const source = { id: 'source', generation: 0 } as const;
const acquire = { type: 'subscribe', resource: source } as const;
const release = { type: 'unsubscribe', resource: source } as const;
const complete = { type: 'notify', target: 'downstream', notification: { kind: 'C' } } as const;
const next = <T>(value: T): Action<T> => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
const error = <T>(value: unknown): Action<T> => ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: value } });
const ref = (id: string, generation: number): ResourceRef => ({ id, generation });
const same = (a: ResourceRef, b: ResourceRef): boolean => a.id === b.id && a.generation === b.generation;
const natural = (x: number): boolean => Number.isSafeInteger(x) && x >= 0;

function metadata(p: AuditParameters): ModelMetadata {
  const timed = p.operator === 'auditTime';
  return {
    schemaVersion: '1.1', id: timed ? 'auditTime-' + p.duration : 'audit-Observable-duration',
    operator: p.operator, rxjsVersion: '7.8.2',
    purpose: timed ? 'Start a fixed-duration silence window on the first value and emit its latest value when the scheduled duration ends.' :
      'Start a duration Observable from the first value, retain latest values while it is active, and emit only on its next signal.',
    cardinality: { signature: timed ? 'auditTime(d) : T* -> T*' : 'audit : (T! -> U*) -> T* -> T*',
      conditions: [
        'Emitted values are an ordered subsequence of source values; at most one per duration.',
        'Values arriving during an active duration replace the pending latest value and do not restart it.',
        timed ? 'Source completion waits for the active timer; unlike debounceTime it does not flush early.' :
          'Duration next flushes; duration completion without next discards the pending value. Source completion waits for the active duration.',
        'Source error and downstream cancellation discard pending values and release resources.',
      ] },
    scope: { parameters: timed ? 'Positive safe-integer duration and deferred scheduler, one scheduled task per active window' :
      'Named duration selector returning a valid Observable; exactly one live duration Observable per result subscription',
      callbacks: timed ? 'No user callback. Timer output is modeled as timer.fire.' :
        'Selector invocation is an action; a correlated return represents a valid Observable, without running the selector in guards or in the model runner.',
      time: 'Externally supplied monotone safe-integer clock; duration signals or scheduler firings determine output time. No deadline alone emits a value.',
      reentrancy: 'Atomic non-reentrant source, callback, observer and duration notifications after initialization. Equal timestamps are ordered by trace sequence.',
      exclusions: [timed ? 'Inline/synchronous custom schedulers, negative/NaN/unsafe durations, non-deferred zero delay, scheduler drift guarantees.' :
        'Promise/iterable ObservableInput conversion and synchronous inner notification during subscription setup.',
        'Nested source/duration emissions, cancellation inside callbacks/output delivery and throwing observers/finalizers.',
        'Universal behavioral equivalence, callback purity, and arbitrary external mutation of retained object references.',
      ] },
    initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: 'Connect to source only; first value starts a duration.' },
    ownership: { state: 'subscription-local', sharing: 'No sharing or replay introduced. Each result subscription owns its latest value and duration identity.',
      reset: 'Fresh counter and no pending value per execution; Closed rejects later signals.',
      resources: [{ id: 'source', kind: 'subscription', owner: 'current result execution' },
        timed ? { id: 'audit-timer', kind: 'timer', owner: 'current execution; generation labels window' } :
          { id: 'duration', kind: 'subscription', owner: 'current execution; at most one live' },
        ...(!timed ? [{ id: 'duration-selector', kind: 'callback' as const, owner: 'external binding; generation identifies invocation' }] : [])] },
    dispatch: { policy: timed ? 'scheduled' : 'atomic-non-reentrant',
      actionSemantics: timed ? 'Schedule once when idle; subsequent values replace memory without rescheduling. timer.fire models a due scheduled emission.' :
        'Only the selector callback outcome may resolve Calling. Inner next releases duration and flushes latest; inner completion only releases duration.',
      cancellationCheckpoints: ['Between resolved notifications; no pending-value flush on cancellation.',
        'Source completion may leave a duration active; it does not force emission or cancel that duration.'] },
    inputs: [
      { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'acquire a source subscription' },
      { type: 'source.next', origin: 'source', category: 'notification', description: 'start or update a latest-value window' },
      { type: 'source.complete', origin: 'source', category: 'notification', description: 'complete when no duration remains, else wait' },
      { type: 'source.error', origin: 'source', category: 'notification', description: 'error without flushing' },
      { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'stop silently and release resources' },
      ...(timed ? [
        { type: 'timer.fire', origin: 'timer' as const, category: 'time' as const, description: 'the active scheduled window expires' },
      ] : [
        { type: 'callback.return', origin: 'callback' as const, category: 'callback' as const, description: 'duration selector returned a valid Observable' },
        { type: 'callback.throw', origin: 'callback' as const, category: 'callback' as const, description: 'duration selector threw' },
        { type: 'duration.next', origin: 'inner' as const, category: 'notification' as const, description: 'active duration emits a next signal' },
        { type: 'duration.complete', origin: 'inner' as const, category: 'notification' as const, description: 'active duration completes without next' },
        { type: 'duration.error', origin: 'inner' as const, category: 'notification' as const, description: 'active duration errors' },
      ]),
    ],
    actionTypes: timed ? ['subscribe', 'schedule', 'cancel-timer', 'notify', 'unsubscribe'] :
      ['subscribe', 'invoke-callback', 'notify', 'unsubscribe'],
    controls: [
      { id: 'Unsubscribed', description: 'no subscription', terminal: false },
      { id: 'Idle', description: 'source connected; no duration running', terminal: false },
      ...(!timed ? [{ id: 'Calling', description: 'duration-selector return pending', terminal: false }] : []),
      { id: 'Pending', description: 'latest source value and active duration remembered', terminal: false },
      { id: 'Waiting', description: 'source completed; awaiting the active duration outcome', terminal: false },
      { id: 'Closed', description: 'terminal or cancelled', terminal: true },
    ],
    sources: ['src/internal/operators/audit.ts', ...(timed ? ['src/internal/operators/auditTime.ts',
      'src/internal/observable/timer.ts', 'src/internal/util/executeSchedule.ts'] :
      ['src/internal/observable/innerFrom.ts']), 'src/internal/operators/OperatorSubscriber.ts',
      'src/internal/Subscriber.ts'].map(path => ({
      url: 'https://github.com/ReactiveX/rxjs/blob/' + rev + '/' + path, revision: rev,
      purpose: 'Pinned duration creation, terminal waiting, completion/drop and teardown semantics',
    })),
    evidence: { modelTests: ['tests/session07-audit-model.test.mjs'], runtimeTests: ['tests/session07-audit-rxjs.test.mjs'],
      status: 'source-inspected', record: 'evidence/SESSION-07.md' },
  };
}

function createModel<T>(p: AuditParameters): AuditModel<T> {
  const timed = p.operator === 'auditTime';
  const name = timed ? 'AUDITTIME' : 'AUDIT';
  type S = AuditState<T>; type E = AuditEvent<T>;
  type R = Rule<AuditParameters, S, E, Action<T>>;
  const description = (id: string, from: string, event: string, guard: string, to: string, acts: readonly string[],
    nextState: string, explanation: string): R['description'] => ({
      id: name + '-' + id, from, event, guard, to, actions: acts, nextState, explanation,
      obligations: ['S7-' + name + '-' + id],
  });
  const clock = (s: S, e: E) => natural(e.now) && (s.phase === 'Unsubscribed' || e.now >= s.now);
  const durationId = timed ? 'audit-timer' : 'duration';
  const matching = (s: S, e: E) => (s.phase === 'Pending' || s.phase === 'Waiting') &&
    'resource' in e && e.resource !== undefined && same(e.resource, s.duration) && clock(s, e);
  const cancelDuration = (s: S): Action<T>[] => s.phase === 'Pending' || s.phase === 'Waiting' ?
    [timed ? { type: 'cancel-timer', resource: s.duration } : { type: 'unsubscribe', resource: s.duration }] : [];
  const endState = (now: number, reason: 'complete' | 'source-error' | 'duration-error' | 'callback-error' | 'cancel'): S =>
    ({ phase: 'Closed', now, reason });
  const rules: R[] = [
    {
      description: description('INIT', 'Unsubscribed', 'subscribe', 'fresh valid clock', 'Idle',
        ['subscribe to the source'], 'idle without a duration', 'Construction does not connect. Subscription acquires a source; first next starts a duration.'),
      enabled: clock,
      react: (_s,e) => ({ state: { phase: 'Idle', now: e.now, nextId: 0 }, actions: [acquire] }),
    },
    {
      description: description('START', 'Idle', 'source.next', 'valid clock, fresh generation and duration deadline', timed ? 'Pending' : 'Calling',
        timed ? ['schedule one timer; retain the input'] : ['invoke durationSelector exactly once with this value'],
        timed ? 'pending with one scheduled duration and latest value' : 'await the correlated duration-selector outcome',
        timed ? 'The first value starts a timer once; it is not emitted immediately.' :
          'With no active duration, the first source value is remembered and requests one selector call.'),
      enabled: (s,e) => clock(s,e) && s.phase === 'Idle' && s.nextId < Number.MAX_SAFE_INTEGER &&
        (!timed || natural(e.now + p.duration)),
      react: (s,e) => {
        if (s.phase !== 'Idle' || e.type !== 'source.next') throw new Error('invalid audit start');
        const id = s.nextId;
        const pending = { now: e.now, nextId: id + 1, value: e.value };
        return timed ? {
          state: { phase: 'Pending', ...pending, duration: ref(durationId, id), scheduledFor: e.now + p.duration },
          actions: [{ type: 'schedule', resource: ref(durationId, id), delay: p.duration }],
        } : {
          state: { phase: 'Calling', ...pending, callback: ref('duration-selector', id) },
          actions: [{ type: 'invoke-callback', resource: ref('duration-selector', id), value: e.value, index: id }],
        };
      },
    },
    {
      description: description('REPLACE', 'Pending', 'source.next', 'duration remains active', 'Pending', [],
        'same duration with latest input replaced',
        'Values arriving during an active duration replace the pending value; neither the selector nor timer restarts.'),
      enabled: clock,
      react: (s,e) => {
        if (s.phase !== 'Pending' || e.type !== 'source.next') throw new Error('invalid audit replacement');
        return { state: { ...s, now: e.now, value: e.value }, actions: [] };
      },
    },
    {
      description: description('COMPLETE-IDLE', 'Idle', 'source.complete', 'no active duration', 'Closed',
        ['complete downstream', 'release source'], 'closed by completion',
        'Without an active duration, completion passes downstream immediately.'),
      enabled: clock,
      react: (_s,e) => ({ state: endState(e.now,'complete'), actions: [complete,release] }),
    },
    {
      description: description('COMPLETE-PENDING', 'Pending', 'source.complete', 'duration active', 'Waiting',
        ['release completed source; retain duration'],
        'waiting for duration outcome, no new source values',
        'A source completion with an active duration waits: it does not flush the pending value or cancel its duration.'),
      enabled: clock,
      react: (s,e) => {
        if (s.phase !== 'Pending') throw new Error('invalid audit source completion');
        return { state: { ...s, phase: 'Waiting', now: e.now }, actions: [release] };
      },
    },
  ];
  if (!timed) rules.push(
    {
      description: description('CALL-RETURN', 'Calling', 'callback.return', 'matching selector invocation', 'Pending',
        ['subscribe to returned duration Observable'], 'pending with a duration subscription',
        'The selector returns a valid duration Observable; the model subscribes, but does not execute the callback itself.'),
      enabled: (s,e) => clock(s,e) && s.phase === 'Calling' && e.type === 'callback.return' && same(s.callback,e.resource),
      react: (s,e) => {
        if (s.phase !== 'Calling') throw new Error('invalid duration return');
        const d = ref('duration',s.callback.generation);
        return { state: { phase: 'Pending', now: e.now, nextId:s.nextId, value:s.value, duration:d, scheduledFor:e.now },
          actions: [{ type: 'subscribe', resource:d }] };
      },
    },
    {
      description: description('CALL-THROW', 'Calling', 'callback.throw', 'matching selector invocation', 'Closed',
        ['forward thrown value', 'release source'], 'closed by selector error',
        'Throwing durationSelector terminates immediately; no pending value is emitted.'),
      enabled: (s,e) => clock(s,e) && s.phase === 'Calling' && e.type === 'callback.throw' &&
        e.resource !== undefined && same(s.callback,e.resource),
      react: (_s,e) => {
        if (e.type !== 'callback.throw') throw new Error('invalid selector throw');
        return { state: endState(e.now,'callback-error'), actions: [error<T>(e.error),release] };
      },
    },
  );
  for (const phase of ['Pending','Waiting'] as const) {
    const waiting = phase === 'Waiting';
    const event = timed ? 'timer.fire' : 'duration.next';
    rules.push({
      description: description((waiting?'WAITING-':'')+'DURATION-NEXT', phase, event,
        timed ? 'matching timer identity at or after deadline' : 'matching live duration next', waiting ? 'Closed':'Idle',
        ['release active duration','emit latest pending source value',...(waiting?['complete downstream']:[])],
        waiting ? 'closed by delayed completion' : 'idle and ready for the next source value',
        waiting ? 'After source completion, duration next emits the latest value, then completes.' :
          'A duration next ends the window and emits the latest retained source value.'),
      enabled: (s,e) => matching(s,e) && s.phase === phase && (!timed ||
        (s.phase === 'Pending' || s.phase === 'Waiting') && e.now >= s.scheduledFor),
      react: (s,e) => {
        if (s.phase !== phase) throw new Error('invalid duration next');
        return {
          state: waiting ? endState(e.now,'complete') : { phase:'Idle',now:e.now,nextId:s.nextId },
          actions: [...cancelDuration(s),next(s.value),...(waiting?[complete]:[])],
        };
      },
    });
    if (!timed) rules.push(
      {
        description: description((waiting?'WAITING-':'')+'DURATION-COMPLETE',phase,'duration.complete',
          'matching duration completion without next', waiting?'Closed':'Idle',
          ['release ended duration without emitting a pending value',...(waiting?['complete downstream']:[])],
          waiting ? 'closed without a flush' : 'idle; next source value can start a new duration',
          'A duration that only completes is not a next signal. audit does not flush the pending value.'),
        enabled: (s,e) => matching(s,e) && s.phase === phase,
        react: (s,e) => {
          if (s.phase !== phase) throw new Error('invalid duration completion');
          return { state: waiting ? endState(e.now,'complete') : { phase:'Idle',now:e.now,nextId:s.nextId },
            actions: [...cancelDuration(s),...(waiting?[complete]:[])] };
        },
      },
      {
        description: description((waiting?'WAITING-':'')+'DURATION-ERROR',phase,'duration.error','matching live duration error','Closed',
          ['forward duration error','release owned resources'],
          'closed by duration error', 'An active duration error terminates downstream and discards the pending value.'),
        enabled: (s,e) => matching(s,e) && s.phase === phase,
        react: (s,e) => {
          if (e.type !== 'duration.error') throw new Error('invalid duration error');
          return { state:endState(e.now,'duration-error'),actions:[error<T>(e.error),...cancelDuration(s),...(waiting?[]:[release])] };
        },
      },
    );
  }
  for (const phase of (timed?['Idle','Pending','Waiting']:['Idle','Calling','Pending','Waiting']) as readonly S['phase'][]) {
    if (phase === 'Unsubscribed' || phase === 'Closed') continue;
    for (const kind of ['source.error','cancel'] as const) {
      if (phase === 'Waiting' && kind === 'source.error') continue;
      rules.push({
        description: description((kind === 'cancel'?'CANCEL-':'SOURCE-ERROR-')+phase.toUpperCase(), phase, kind,
          'valid clock and live execution','Closed',
          [...(kind==='source.error'?['forward error unchanged']:[]),'release owned subscriptions/timer without flush'],
          'closed with pending value discarded', kind==='cancel' ?
            'Cancellation does not emit completion or a pending value.' : 'A source error terminates and discards any pending value.'),
        enabled: clock,
        react: (s,e) => {
          if (e.type !== kind) throw new Error('invalid audit terminal');
          return { state:endState(e.now,kind==='cancel'?'cancel':'source-error'),
            actions:[ ...(kind==='source.error'?[error<T>('error' in e ? e.error : (()=>{throw new Error('invalid source error event');})())]:[]),
              ...(phase==='Waiting'?[]:[release]), ...cancelDuration(s)] };
        },
      });
    }
  }
  return {
    metadata: metadata(p), parameters: p, rules,
    initialState: () => ({ phase:'Unsubscribed' }), control:s=>s.phase,
    validateState: s => {
      if (s.phase==='Unsubscribed') return [];
      if (!natural(s.now)) return ['invalid clock'];
      if (s.phase==='Closed') return ['complete','source-error','duration-error','callback-error','cancel'].includes(s.reason)?[]:['invalid close reason'];
      if (!natural(s.nextId)) return ['invalid generation'];
      if (s.phase==='Idle') return [];
      if (!Object.hasOwn(s,'value')) return ['missing retained value'];
      if (s.phase==='Calling') return !timed && s.callback.id==='duration-selector' &&
        s.callback.generation===s.nextId-1 ? [] : ['invalid selector identity'];
      return (s.phase==='Pending'||s.phase==='Waiting') && s.duration.id===durationId &&
        s.duration.generation===s.nextId-1 && natural(s.scheduledFor) &&
        (!timed||s.scheduledFor<=s.now+p.duration) ? [] : ['invalid duration identity/time'];
    },
    validateReaction: (before,e,r) => {
      const errors=[...validateActionWord(r.actions)];
      if (r.state.phase==='Unsubscribed'||r.state.now!==e.now) errors.push('invalid reaction clock');
      if (r.actions.some(a=>a.type==='notify'&&a.target!=='downstream')) errors.push('wrong notification target');
      if (e.type==='source.next' && before.phase==='Pending' &&
          (r.state.phase!=='Pending'||!same(r.state.duration,before.duration)||
            r.state.scheduledFor!==before.scheduledFor)) errors.push('replacement restarted duration');
      const values=r.actions.filter(a=>a.type==='notify'&&a.notification.kind==='N');
      if (values.length && (!(before.phase==='Pending'||before.phase==='Waiting')||
        values.length!==1||values[0]!.type!=='notify'||values[0]!.notification.kind!=='N'||
        !Object.is(values[0]!.notification.value,before.value))) errors.push('wrong latest output');
      if (['source.error','duration.error','cancel','callback.throw','duration.complete'].includes(e.type)&&values.length)
        errors.push('error/cancel/empty duration flushed a value');
      return errors;
    },
  };
}
export function createAuditModel<T>(): AuditModel<T> {
  return createModel<T>({operator:'audit',duration:0});
}
export function createAuditTimeModel<T>(duration: number): AuditModel<T> {
  if (!Number.isSafeInteger(duration)||duration<=0)
    throw new RangeError('auditTime scoped model requires positive safe-integer duration');
  return createModel<T>({operator:'auditTime',duration});
}
export function runAuditTrace<T>(model:AuditModel<T>,inputs:readonly TimedEvent<AuditEvent<T>>[],
  options:Readonly<{executionId:string;maxSteps?:number}>):Trace<AuditState<T>,AuditEvent<T>,Action<T>>{
  if(inputs.some(x=>x.time!==x.event.now))throw new Error('trace envelope time differs from event clock');
  return runTrace(model,inputs,options);
}
export const auditExample:readonly TimedEvent<AuditEvent<string>>[]=[
  {time:0,event:{type:'subscribe',now:0}},
  {time:1,event:{type:'source.next',now:1,value:'a'}},
  {time:1,event:{type:'callback.return',now:1,resource:ref('duration-selector',0)}},
  {time:2,event:{type:'source.next',now:2,value:'b'}},
  {time:3,event:{type:'duration.next',now:3,resource:ref('duration',0)}},
  {time:4,event:{type:'source.next',now:4,value:'c'}},
  {time:4,event:{type:'callback.return',now:4,resource:ref('duration-selector',1)}},
  {time:5,event:{type:'source.complete',now:5}},
  {time:7,event:{type:'duration.next',now:7,resource:ref('duration',1)}},
];
export const auditTimeExample:readonly TimedEvent<AuditEvent<string>>[]=[
  {time:0,event:{type:'subscribe',now:0}},
  {time:1,event:{type:'source.next',now:1,value:'a'}},
  {time:2,event:{type:'source.next',now:2,value:'b'}},
  {time:4,event:{type:'timer.fire',now:4,resource:ref('audit-timer',0)}},
  {time:5,event:{type:'source.next',now:5,value:'c'}},
  {time:6,event:{type:'source.complete',now:6}},
  {time:8,event:{type:'timer.fire',now:8,resource:ref('audit-timer',1)}},
];
