import type { Action, ModelMetadata, ResourceRef, RuleDescription } from '../schema.js';
import { validateActionWord } from '../runner.js';

export const pinnedRevision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
export const source: ResourceRef = { id: 'source', generation: 0 };
export const resource = (id: string, generation: number): ResourceRef => ({ id, generation });
export const subscribe = (ref: ResourceRef): Action<never> => ({ type: 'subscribe', resource: ref });
export const unsubscribe = (ref: ResourceRef): Action<never> => ({ type: 'unsubscribe', resource: ref });
export const next = <T>(value: T): Action<T> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
export const complete: Action<never> =
  { type: 'notify', target: 'downstream', notification: { kind: 'C' } };
export const error = (value: unknown): Action<never> =>
  ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error: value } });
export const natural = (n: number): boolean => Number.isSafeInteger(n) && n >= 0;
export const actionErrors = <T>(actions: readonly Action<T>[]): string[] =>
  [...validateActionWord(actions),
    ...actions.filter(a => a.type === 'notify' && a.target !== 'downstream').map(() => 'invalid target')];
export const describe = (
  operator: string, id: string, from: string, event: string, to: string,
  guard: string, actions: readonly string[], explanation: string,
): RuleDescription => ({
  id: operator.toUpperCase() + '-' + id, from, event, to, guard, actions,
  nextState: to === 'Closed' ? 'terminated; no late events legal' : 'state with documented resource ownership',
  obligations: ['S10-' + operator.toUpperCase() + '-' + id], explanation,
});
type MetadataInput = Omit<ModelMetadata, 'schemaVersion' | 'rxjsVersion' | 'sources' | 'evidence'> &
  Readonly<{ sourcePaths: readonly string[] }>;
export const metadata = (input: MetadataInput): ModelMetadata => {
  const { sourcePaths, ...rest } = input;
  return {
    ...rest, schemaVersion: '1.1', rxjsVersion: '7.8.2',
    sources: sourcePaths.map(path => ({
      url: 'https://github.com/ReactiveX/rxjs/blob/' + pinnedRevision + '/' + path,
      revision: pinnedRevision,
      purpose: 'Pinned RxJS 7.8.2 control, notification and teardown semantics',
    })),
    evidence: {
      modelTests: ['tests/session10-model.test.mjs'],
      runtimeTests: ['tests/session10-rxjs.test.mjs'],
      status: 'source-inspected', record: 'evidence/SESSION-10.md',
    },
  };
};
