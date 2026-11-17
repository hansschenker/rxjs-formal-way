import type { Action, Event, InputDescriptor, ModelMetadata, ResourceRef, Rule } from '../schema.js';
import { validateActionWord } from '../runner.js';

/** Descriptions and pure action constructors; no user function or RxJS producer runs here. */
export const session20Revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
export type CloseReason = 'complete' | 'error' | 'cancel';
export type SourceEvent<T> =
  | Readonly<{ type: 'subscribe' | 'cancel' | 'source.complete' }>
  | Readonly<{ type: 'source.next'; value: T }>
  | Readonly<{ type: 'source.error'; error: unknown }>;
export const natural = (n: number): boolean => Number.isSafeInteger(n) && n >= 0;
export const finiteTime = (n: number): boolean => Number.isFinite(n) && n >= 0;
export const sourceRef: ResourceRef = { id: 'source', generation: 0 };
export const acquire = (resource: ResourceRef): Action<unknown> => ({ type: 'subscribe', resource });
export const release = (resource: ResourceRef): Action<unknown> => ({ type: 'unsubscribe', resource });
export const emit = (value: unknown): Action<unknown> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
export const finish: Action<unknown> = { type: 'notify', target: 'downstream', notification: { kind: 'C' } };
export const failWith = (error: unknown): Action<unknown> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error } });
export const invoke = (id: string, index: number, value: unknown): Action<unknown> =>
  ({ type: 'invoke-callback', resource: { id, generation: index }, index, value });
export const sameResource = (a: ResourceRef, b: ResourceRef): boolean =>
  a.id === b.id && a.generation === b.generation;
export const sourceInputs: readonly InputDescriptor[] = [
  { type: 'subscribe', origin: 'downstream', category: 'lifecycle', description: 'First connection to this result execution.' },
  { type: 'source.next', origin: 'source', category: 'notification', description: 'A value from the currently owned source subscription.' },
  { type: 'source.complete', origin: 'source', category: 'notification', description: 'Successful source termination.' },
  { type: 'source.error', origin: 'source', category: 'notification', description: 'Source failure with an opaque error value.' },
  { type: 'cancel', origin: 'downstream', category: 'lifecycle', description: 'Consumer closes the result connection silently.' },
];
export const callbackInputs: readonly InputDescriptor[] = [
  { type: 'callback.return', origin: 'callback', category: 'callback', description: 'Return from the currently pending, correlated synchronous callback.' },
  { type: 'callback.throw', origin: 'callback', category: 'callback', description: 'Throw from the currently pending, correlated synchronous callback.' },
];
export type MetadataOptions = Readonly<{
  operator: string; id: string; purpose: string; signature: string;
  conditions: readonly string[]; parameters: string; callbacks: string; time?: string;
  exclusions: readonly string[]; controls: readonly string[];
  inputs?: readonly InputDescriptor[]; resources?: ModelMetadata['ownership']['resources'];
  actionTypes?: ModelMetadata['actionTypes']; additionalSources?: readonly string[];
}>;
export function sessionMetadata(o: MetadataOptions): ModelMetadata {
  const paths = [
    'src/internal/operators/' + o.operator + '.ts',
    'spec/operators/' + o.operator + '-spec.ts',
    'src/internal/operators/OperatorSubscriber.ts',
    ...(o.additionalSources ?? []),
  ];
  return {
    schemaVersion: '1.1', id: o.id, operator: o.operator, rxjsVersion: '7.8.2', purpose: o.purpose,
    cardinality: { signature: o.signature, conditions: o.conditions },
    scope: {
      parameters: o.parameters, callbacks: o.callbacks,
      time: o.time ?? 'No clock is introduced. Source events supply time; input order breaks equal-time ties.',
      reentrancy: 'Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.',
      exclusions: [...o.exclusions, 'Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.'],
    },
    initialization: { control: 'Unsubscribed', event: 'subscribe', sourceSubscription: 'No connection during construction. The first result subscription applies the profile-specific acquisition rule.' },
    ownership: {
      state: 'subscription-local', sharing: 'No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.',
      reset: 'Create fresh bookkeeping for each result connection. Payload objects are not cloned.',
      resources: [{ id: 'source', kind: 'subscription', owner: 'result execution' }, ...(o.resources ?? [])],
    },
    dispatch: {
      policy: 'atomic-non-reentrant',
      actionSemantics: 'Ordered action words are model predictions, not executed effects. Callback invocation IDs correlate outcomes; they are not subscription IDs.',
      cancellationCheckpoints: ['Between external reactions. Cancellation during synchronous multi-action delivery is characterized separately, not silently admitted into this profile.'],
    },
    inputs: [...sourceInputs, ...(o.inputs ?? [])],
    actionTypes: o.actionTypes ?? ['subscribe', 'unsubscribe', 'notify'],
    controls: o.controls.map(id => ({ id, terminal: id === 'Closed', description: id === 'Unsubscribed' ? 'Description only; no resources acquired.' : id === 'Closed' ? 'Terminated; no owned subscriptions or retained values.' : 'See the typed state and named transitions for ' + id + '.' })),
    sources: [...new Set(paths)].map(path => ({ url: 'https://github.com/ReactiveX/rxjs/blob/' + session20Revision + '/' + path, revision: session20Revision, purpose: path.startsWith('spec/') ? 'Upstream scenario basis; test bodies inspected, not claimed to have been executed as the upstream suite.' : 'Version-pinned implementation and cleanup semantics.' })),
    evidence: {
      status: 'source-inspected', modelTests: ['tests/session20-model.test.mjs'],
      runtimeTests: ['tests/session20-rxjs.test.mjs', 'tests/session20-differential.test.mjs'],
      record: 'evidence/SESSION-20.md', scenarios: 'docs/SESSION-20-SCENARIOS.md', coverage: 'docs/SESSION-20-SCENARIOS.md',
    },
  };
}
export function namedRule<P, S extends { readonly phase: string }, E extends Event>(
  operator: string, name: string, from: S['phase'], event: E['type'], to: S['phase'],
  guard: string, actions: readonly string[], nextState: string, explanation: string,
  enabled: (s: S, e: E) => boolean,
  react: (s: S, e: E) => Readonly<{ state: S; actions: readonly Action<unknown>[] }>,
): Rule<P, S, E, Action<unknown>> {
  const id = 'S20-' + operator.toUpperCase() + '-' + name;
  return { description: { id, from, event, to, guard, actions, nextState, explanation, obligations: [id] }, enabled, react };
}
export function checkActions(event: Event, phase: string, actions: readonly Action<unknown>[]): readonly string[] {
  return [
    ...validateActionWord(actions),
    ...(event.type === 'cancel' && actions.some(a => a.type === 'notify') ? ['Cancellation must not notify downstream.'] : []),
    ...(phase === 'Closed' && actions.some(a => a.type === 'subscribe' || a.type === 'schedule') ? ['Closed executions cannot acquire resources.'] : []),
  ];
}
