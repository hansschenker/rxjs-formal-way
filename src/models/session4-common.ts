import type { Action, ModelMetadata, ResourceRef } from '../schema.js';
import { validateActionWord } from '../runner.js';

export const sourceRef: ResourceRef = { id: 'source', generation: 0 };
export const flushRef: ResourceRef = { id: 'flush', generation: 0 };
export const subscribeSource = { type: 'subscribe', resource: sourceRef } as const;
export const unsubscribeSource = { type: 'unsubscribe', resource: sourceRef } as const;
export const subscribeFlush = { type: 'subscribe', resource: flushRef } as const;
export const unsubscribeFlush = { type: 'unsubscribe', resource: flushRef } as const;
export const notifyNext = <T>(value: T): Action<T> => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value } });
export const notifyComplete: Action<never> = { type: 'notify', target: 'downstream', notification: { kind: 'C' } };
export const notifyError = (error: unknown): Action<never> => ({ type: 'notify', target: 'downstream', notification: { kind: 'E', error } });
export const validIndex = (n: number): boolean => Number.isSafeInteger(n) && n >= 0;
export const sameValueZero = (a: unknown, b: unknown): boolean => a === b || (a !== a && b !== b);
export const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
export const pinned = (path: string): string => `https://github.com/ReactiveX/rxjs/blob/${revision}/${path}`;
type MetadataOptions = Omit<ModelMetadata, 'schemaVersion' | 'rxjsVersion' | 'sources' | 'evidence'> & Readonly<{
  schemaVersion?: '1.0' | '1.1'; sourcePaths: readonly string[];
}>;
export function session4Metadata(options: MetadataOptions): ModelMetadata {
  const { schemaVersion = '1.0', sourcePaths, ...rest } = options;
  return {
    ...rest, schemaVersion, rxjsVersion: '7.8.2',
    sources: sourcePaths.map(path => ({ url: pinned(path), revision, purpose: 'Pinned RxJS 7.8.2 behavior and lifecycle' })),
    evidence: {
      status: 'source-inspected', record: 'evidence/SESSION-04.md',
      modelTests: ['tests/session4-model.test.mjs'], runtimeTests: ['tests/session4-rxjs.test.mjs'],
    },
  };
}
/** Check the action alphabet and source/flush/callback generation references, not just emitted values. */
export const checkedActions = <T>(actions: readonly Action<T>[], ids: readonly string[]): string[] => {
  const errors = [...validateActionWord(actions)];
  for (const action of actions) {
    if (action.type === 'notify') {
      if (action.target !== 'downstream') errors.push('unknown notification address');
    } else if (!ids.includes(action.resource.id)) {
      errors.push('unknown resource ' + action.resource.id);
    }
  }
  return errors;
};
