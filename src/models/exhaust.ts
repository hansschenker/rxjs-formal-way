import type { TimedEvent } from '../schema.js';
import { createExhaustAllModel, exhaustAllExample } from './all.js';
import type { AllModel, AllEvent } from './all.js';
import { pinnedRevision } from './session10-common.js';

/** RxJS 7.8.2: exhaust is the EXACT exported function alias of exhaustAll.
 * Reuse its full flattening machine; only the public export provenance and rule identifiers differ.
 * This is not another concurrency policy, runtime adapter or implementation of RxJS.
 */
export type ExhaustModel<Outer,Inner> = AllModel<Outer,Inner>;
export type ExhaustEvent<Outer,Inner> = AllEvent<Outer,Inner>;
export function createExhaustModel<Outer,Inner>():ExhaustModel<Outer,Inner>{
  const base=createExhaustAllModel<Outer,Inner>();
  return {
    ...base,
    rules:base.rules.map(r=>({...r,description:{
      ...r.description,
      id:r.description.id.replace('EXHAUSTALL-','EXHAUST-'),
      obligations:r.description.obligations.map(x=>x.replace('S3-EXHAUSTALL-','S11-EXHAUST-')),
      explanation:'Exact exhaust = exhaustAll alias. '+r.description.explanation,
    }})),
    metadata:{
      ...base.metadata,
      id:'exhaust-deprecated-exact-alias',operator:'exhaust',
      purpose:'Deprecated exact alias of exhaustAll: flatten only the currently admitted inner Observable; ignore outer arrivals while busy.',
      cardinality:{signature:'exhaust : (T*)* -> T*',conditions:[
        'Only an admitted inner contributes values; arrivals during active inner are discarded without subscription.',
        'Outer completion waits for the current admitted inner; error/cancellation release current and outer subscriptions.',
        'Alias equality is verified against the pinned RxJS 7.8.2 exports and actual runtime tests.',
      ]},
      sources:[{url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/src/internal/operators/exhaust.ts',
        revision:pinnedRevision,purpose:'Pinned export explicitly assigns exhaust = exhaustAll'},...base.metadata.sources],
      evidence:{modelTests:['tests/session11-model.test.mjs'],runtimeTests:['tests/session11-rxjs.test.mjs'],
        status:'source-inspected' as const,record:'evidence/SESSION-11.md'},
    },
  };
}
export const exhaustExample:readonly TimedEvent<ExhaustEvent<string,string>>[]=exhaustAllExample;
