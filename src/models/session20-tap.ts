import type { Action, Notification, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { acquire, release, sourceRef, emit, finish, failWith, invoke, natural, sameResource,
  sessionMetadata, namedRule, callbackInputs, checkActions } from './session20-common.js';
import type { CloseReason, SourceEvent } from './session20-common.js';

export type TapHook = 'subscribe' | 'next' | 'error' | 'complete' | 'unsubscribe' | 'finalize';
export type TapNotificationHook = 'next' | 'error' | 'complete';
export type TapParameters = Readonly<{ hooks: readonly TapHook[] }>;
export type TapState<T> =
  | Readonly<{ phase: 'Unsubscribed' }>
  | Readonly<{ phase: 'Listening'; invocation: number }>
  | Readonly<{ phase: 'Calling'; invocation: number; hook: TapNotificationHook; pending: Notification<T> }>
  | Readonly<{ phase: 'Closed'; reason: CloseReason }>;
export type TapEvent<T> = SourceEvent<T>
  | Readonly<{ type: 'callback.return'; resource: ResourceRef }>
  | Readonly<{ type: 'callback.throw'; resource: ResourceRef; error: unknown }>;
export type TapModel<T> = OperatorModel<TapParameters, TapState<T>, TapEvent<T>, Action<unknown>>;
export const allTapHooks: readonly TapHook[] = ['subscribe', 'next', 'error', 'complete', 'unsubscribe', 'finalize'];
const hookRef = (hook: TapHook, index: number): ResourceRef => ({ id: 'tap.' + hook, generation: index });

/** Notification callbacks may return or throw. Lifecycle hooks are explicitly nonthrowing in this profile. */
export function createTapModel<T>(hooks: readonly TapHook[] = allTapHooks): TapModel<T> {
  if (new Set(hooks).size !== hooks.length || hooks.some(h => !allTapHooks.includes(h))) throw new TypeError('invalid or duplicate tap hook');
  const selected = allTapHooks.filter(h => hooks.includes(h));
  const has = (h: TapHook): boolean => selected.includes(h);
  type S = TapState<T>; type E = TapEvent<T>; type A = Action<unknown>;
  const rule = namedRule<TapParameters, S, E>;
  const listening = (s: S): s is Extract<S, { phase: 'Listening' }> => s.phase === 'Listening';
  const calling = (s: S): s is Extract<S, { phase: 'Calling' }> => s.phase === 'Calling';
  const lifecycle = (h: 'subscribe' | 'unsubscribe' | 'finalize'): A[] => has(h) ? [invoke('tap.' + h, 0, undefined)] : [];
  const cleanup = (unsub: boolean): A[] => [release(sourceRef), ...(unsub ? lifecycle('unsubscribe') : []), ...lifecycle('finalize')];
  const outcome = (hook: TapNotificationHook) => (s: S, e: E): boolean => calling(s) && s.hook === hook
    && (e.type === 'callback.return' || e.type === 'callback.throw') && sameResource(e.resource, hookRef(hook, s.invocation));
  const rules: Rule<TapParameters, S, E, A>[] = [
    rule('tap', 'START', 'Unsubscribed', 'subscribe', 'Listening', 'first consumer connection',
      [...(has('subscribe') ? ['invoke nonthrowing subscribe hook'] : []), 'subscribe source'],
      'Listening with next notification invocation index zero.',
      'The lifecycle hook runs before source acquisition. Neither runs during operator construction.', () => true,
      () => ({ state: { phase: 'Listening', invocation: 0 }, actions: [...lifecycle('subscribe'), acquire(sourceRef)] })),
  ];
  const kinds: readonly TapNotificationHook[] = ['next', 'error', 'complete'];
  for (const hook of kinds) {
    const eventType = ('source.' + hook) as 'source.next' | 'source.error' | 'source.complete';
    if (has(hook)) {
      rules.push(rule('tap', hook.toUpperCase() + '-CALL', 'Listening', eventType, 'Calling', 'source is live; matching hook is configured',
        ['invoke the matching hook with the source notification payload'],
        'Calling ' + hook + ' with the original notification retained; only its correlated outcome is legal.',
        'The source notification is not forwarded until its handler returns successfully.',
        s => listening(s) && s.invocation < Number.MAX_SAFE_INTEGER,
        (s, e) => {
          if (!listening(s)) throw Error('expected listening');
          const pending: Notification<T> = e.type === 'source.next' ? { kind: 'N', value: e.value }
            : e.type === 'source.error' ? { kind: 'E', error: e.error } : { kind: 'C' };
          const value = pending.kind === 'N' ? pending.value : pending.kind === 'E' ? pending.error : undefined;
          return { state: { phase: 'Calling', hook, pending, invocation: s.invocation }, actions: [invoke('tap.' + hook, s.invocation, value)] };
        }));
      rules.push(rule('tap', hook.toUpperCase() + '-RETURN', 'Calling', 'callback.return', hook === 'next' ? 'Listening' : 'Closed',
        'return matches the pending ' + hook + ' invocation',
        hook === 'next' ? ['forward the exact original value'] : ['forward original terminal notification', 'release source', ...(has('finalize') ? ['invoke nonthrowing finalize hook'] : [])],
        hook === 'next' ? 'Listening; advance invocation index and clear pending notification.' : 'Closed ' + hook + '; no unsubscribe hook on source termination.',
        'Handler return values are ignored: tap is not map. Terminal callbacks clear the internal unsubscription flag before being called.',
        outcome(hook), s => {
          if (!calling(s)) throw Error('expected callback');
          const notification: A = { type: 'notify', target: 'downstream', notification: s.pending };
          return hook === 'next'
            ? { state: { phase: 'Listening', invocation: s.invocation + 1 }, actions: [notification] }
            : { state: { phase: 'Closed', reason: hook === 'complete' ? 'complete' : 'error' }, actions: [notification, ...cleanup(false)] };
        }));
      rules.push(rule('tap', hook.toUpperCase() + '-THROW', 'Calling', 'callback.throw', 'Closed',
        'throw matches the pending ' + hook + ' invocation',
        ['error with the exact thrown value instead of the pending notification', 'release source',
          ...(hook === 'next' && has('unsubscribe') ? ['invoke nonthrowing unsubscribe hook'] : []),
          ...(has('finalize') ? ['invoke nonthrowing finalize hook'] : [])],
        'Closed error; discard pending notification.',
        hook === 'next' ? 'A next-handler throw terminates by unsubscription, so unsubscribe precedes finalize.'
          : 'A terminal-handler throw replaces the terminal notification but does not invoke unsubscribe: the terminal flag was already cleared.',
        outcome(hook), (_s, e) => { if (e.type !== 'callback.throw') throw Error('expected throw');
          return { state: { phase: 'Closed', reason: 'error' }, actions: [failWith(e.error), ...cleanup(hook === 'next')] }; }));
    } else {
      rules.push(rule('tap', hook.toUpperCase() + '-PASS', 'Listening', eventType, hook === 'next' ? 'Listening' : 'Closed',
        'source is live; matching hook is absent', ['forward the unchanged notification', ...(hook === 'next' ? [] : ['release source and invoke configured finalize hook'])],
        hook === 'next' ? 'Listening with unchanged invocation counter.' : 'Closed after source termination.',
        'Missing hooks are bypassed; no implicit callback or timing policy is introduced.', listening,
        (s, e) => {
          if (!listening(s)) throw Error('expected listening');
          if (e.type === 'source.next') return { state: s, actions: [emit(e.value)] };
          if (e.type === 'source.error') return { state: { phase: 'Closed', reason: 'error' }, actions: [failWith(e.error), ...cleanup(false)] };
          return { state: { phase: 'Closed', reason: 'complete' }, actions: [finish, ...cleanup(false)] };
        }));
    }
  }
  rules.push(rule('tap', 'CANCEL', 'Listening', 'cancel', 'Closed', 'consumer cancels between source notifications',
    ['release source', ...(has('unsubscribe') ? ['invoke nonthrowing unsubscribe hook'] : []), ...(has('finalize') ? ['invoke nonthrowing finalize hook'] : [])],
    'Closed cancel; no downstream terminal notification.', 'Cancellation and normal source termination have different lifecycle hook policies.', listening,
    () => ({ state: { phase: 'Closed', reason: 'cancel' }, actions: cleanup(true) })));
  return {
    metadata: sessionMetadata({ operator: 'tap', id: 'tap-' + (selected.join('-') || 'no-hooks'),
      purpose: 'Observe source notifications and connection lifecycle without replacing successful values.',
      signature: 'tap : Cω(ObserverHooks) → T* → T*',
      conditions: ['Successful notification hooks preserve original payload identity and notification order.', 'A thrown notification-hook value replaces that notification with an error.', 'unsubscribe hooks run on cancellation or next-handler failure, not normal source error/complete; finalize runs on all acquired-source termination paths.'],
      parameters: 'A subset of the six named observer hooks; next-function form is the next-only profile.',
      callbacks: 'next/error/complete invocation outcomes are explicit correlated events. subscribe/unsubscribe/finalize are nonthrowing observation actions; their return values have no effect.',
      exclusions: ['Throwing lifecycle hooks (subscribe/unsubscribe/finalize), deprecated positional overload parsing and JavaScript receiver binding.', 'Payload mutation is not simulated: reference identity is preserved, not a deep snapshot.', 'Source delivery during acquisition and observer-triggered cancellation during a pending callback.'],
      controls: selected.some(h => kinds.includes(h as TapNotificationHook)) ? ['Unsubscribed', 'Listening', 'Calling', 'Closed'] : ['Unsubscribed', 'Listening', 'Closed'],
      inputs: callbackInputs, resources: selected.map(h => ({ id: 'tap.' + h, kind: 'callback' as const, owner: 'result execution' })),
      actionTypes: ['subscribe', 'unsubscribe', 'notify', 'invoke-callback'],
    }), parameters: { hooks: selected }, rules, initialState: () => ({ phase: 'Unsubscribed' }), control: s => s.phase,
    validateState: s => {
      const errors: string[] = [];
      if ((listening(s) || calling(s)) && !natural(s.invocation)) errors.push('Invalid callback counter.');
      if (calling(s)) {
        if (!has(s.hook)) errors.push('Pending hook is not configured.');
        const expected = s.hook === 'next' ? 'N' : s.hook === 'error' ? 'E' : 'C';
        if (s.pending.kind !== expected) errors.push('Pending notification does not match the hook.');
      }
      return errors;
    },
    validateReaction: (_s, e, r) => checkActions(e, r.state.phase, r.actions),
  };
}
export const tapExample: readonly TimedEvent<TapEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 'A' } },
  { time: 1, event: { type: 'callback.return', resource: hookRef('next', 0) } },
  { time: 3, event: { type: 'source.complete' } },
  { time: 3, event: { type: 'callback.return', resource: hookRef('complete', 1) } },
];
export const tapNextExample: readonly TimedEvent<TapEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'source.next', value: 'A' } },
  { time: 1, event: { type: 'callback.return', resource: hookRef('next', 0) } },
  { time: 3, event: { type: 'cancel' } },
];
