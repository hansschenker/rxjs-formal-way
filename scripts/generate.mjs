import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createTakeModel, takeExample, createMapModel, mapExample, createFilterModel, filterExample,
  createSeededScanModel, createUnseededScanModel, seededScanExample, unseededScanExample,
  createDebounceTimeModel, debounceTimeExample, runDebounceTimeTrace,
  toManifest, runTrace, renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace } from '../dist/index.js';

import { createSwitchMapModel, createMergeMapModel, createConcatMapModel, createExhaustMapModel,
  switchMapExample, mergeMapExample, concatMapExample, exhaustMapExample, createShareModel, shareExample } from '../dist/index.js';

import { createSwitchAllModel, createMergeAllModel, createConcatAllModel, createExhaustAllModel,
  switchAllExample, mergeAllExample, concatAllExample, exhaustAllExample,
  createShareReplayModel, shareReplayExample, runShareReplayTrace } from '../dist/index.js';

import {
  createDistinctUntilChangedModel, createDistinctUntilKeyChangedModel,
  createDistinctModel, createPairwiseModel, createStartWithModel,
  distinctUntilChangedExample, distinctUntilKeyChangedExample, distinctExample,
  pairwiseExample, startWithExample,
} from '../dist/index.js';

import {
  createSkipModel, createTakeWhileModel, createSkipWhileModel, createTakeUntilModel, createSkipUntilModel,
  skipExample, takeWhileExample, skipWhileExample, takeUntilExample, skipUntilExample,
} from '../dist/index.js';

import {
  createSeededReduceModel,createUnseededReduceModel,createCountModel,createToArrayModel,createMinModel,createMaxModel,
  reduceSeededExample,reduceUnseededExample,countExample,countPredicateExample,toArrayExample,minExample,maxExample
} from '../dist/index.js';

import {
  createAuditModel, createAuditTimeModel, auditExample, auditTimeExample, runAuditTrace,
  createBufferModel, createBufferCountModel, bufferExample, bufferCountExample,
  createBufferTimeModel, bufferTimeExample, bufferTimeOverlapExample, runBufferTimeTrace
} from '../dist/index.js';

import {
  createBufferToggleModel,createBufferWhenModel,bufferToggleExample,bufferWhenExample,
  createCatchErrorModel,catchErrorExample,
  createCombineAllModel,createCombineLatestAllModel,combineAllExample,combineLatestAllExample
} from '../dist/index.js';


import {
  createCombineLatestModel, createCombineLatestWithModel, createConcatModel, createConcatWithModel,
  createConcatMapToModel,
  combineLatestExample, combineLatestWithExample, concatExample, concatWithExample, concatMapToExample
} from '../dist/index.js';

import {
  createConnectModel, connectExample, createDebounceModel, debounceExample,
  createDefaultIfEmptyModel, defaultIfEmptyExample, createDelayModel, delayExample,
  createDelayWhenModel, delayWhenExample
} from '../dist/index.js';

import {
  createDematerializeModel, dematerializeExample, createElementAtModel, elementAtExample,
  createEndWithModel, endWithExample, createEveryModel, everyExample,
  createExhaustModel, exhaustExample
} from '../dist/index.js';

// Examples supply callback outcomes and clock readings; generation executes no external effects.
const examples = [
  ['take', createTakeModel(2), takeExample, 'take-2-example'],
  ['map', createMapModel(), mapExample, 'map-example'],
  ['filter', createFilterModel(), filterExample, 'filter-example'],
  ['scan-seeded', createSeededScanModel(0), seededScanExample, 'scan-seeded-example'],
  ['scan-unseeded', createUnseededScanModel(), unseededScanExample, 'scan-unseeded-example'],
  ['debounceTime', createDebounceTimeModel(3), debounceTimeExample, 'debounceTime-3-example', runDebounceTimeTrace],
  ['switchMap', createSwitchMapModel(), switchMapExample, 'switchMap-session2-example'],
  ['mergeMap', createMergeMapModel(2), mergeMapExample, 'mergeMap-session2-example'],
  ['concatMap', createConcatMapModel(), concatMapExample, 'concatMap-session2-example'],
  ['exhaustMap', createExhaustMapModel(), exhaustMapExample, 'exhaustMap-session2-example'],
  ['share', createShareModel(), shareExample, 'share-session2-example'],
  ['switchAll', createSwitchAllModel(), switchAllExample, 'switchAll-session3-example'],
  ['mergeAll', createMergeAllModel(2), mergeAllExample, 'mergeAll-session3-example'],
  ['concatAll', createConcatAllModel(), concatAllExample, 'concatAll-session3-example'],
  ['exhaustAll', createExhaustAllModel(), exhaustAllExample, 'exhaustAll-session3-example'],
  ['shareReplay', createShareReplayModel({ bufferSize: 2, windowTime: 6, refCount: false }), shareReplayExample, 'shareReplay-session3-example', runShareReplayTrace],
  ['distinctUntilChanged', createDistinctUntilChangedModel(), distinctUntilChangedExample, 'distinctUntilChanged-session4-example'],
  ['distinctUntilKeyChanged', createDistinctUntilKeyChangedModel('code'), distinctUntilKeyChangedExample, 'distinctUntilKeyChanged-session4-example'],
  ['distinct', createDistinctModel({ withFlushes: true }), distinctExample, 'distinct-session4-example'],
  ['pairwise', createPairwiseModel(), pairwiseExample, 'pairwise-session4-example'],
  ['startWith', createStartWithModel(['before-a', 'before-b']), startWithExample, 'startWith-session4-example'],
  ['skip', createSkipModel(2), skipExample, 'skip-session5-example'],
  ['takeWhile', createTakeWhileModel(true), takeWhileExample, 'takeWhile-session5-example'],
  ['skipWhile', createSkipWhileModel(), skipWhileExample, 'skipWhile-session5-example'],
  ['takeUntil', createTakeUntilModel(), takeUntilExample, 'takeUntil-session5-example'],
  ['skipUntil', createSkipUntilModel(), skipUntilExample, 'skipUntil-session5-example'],
  ['reduce', createSeededReduceModel(0), reduceSeededExample, 'reduce-seeded-session6-example'],
  ['reduce-unseeded', createUnseededReduceModel(), reduceUnseededExample, 'reduce-unseeded-session6-example'],
  ['count', createCountModel(), countExample, 'count-session6-example'],
  ['count-predicate', createCountModel(true), countPredicateExample, 'count-predicate-session6-example'],
  ['toArray', createToArrayModel(), toArrayExample, 'toArray-session6-example'],
  ['min', createMinModel(), minExample, 'min-session6-example'],
  ['max', createMaxModel(), maxExample, 'max-session6-example'],
  ['audit', createAuditModel(), auditExample, 'audit-session7-example', runAuditTrace],
  ['auditTime', createAuditTimeModel(3), auditTimeExample, 'auditTime-session7-example', runAuditTrace],
  ['buffer', createBufferModel(), bufferExample, 'buffer-session7-example'],
  ['bufferCount', createBufferCountModel(3, 2), bufferCountExample, 'bufferCount-session7-example'],
  ['bufferTime', createBufferTimeModel(3), bufferTimeExample, 'bufferTime-session7-example', runBufferTimeTrace],
  ['bufferTime-overlap', createBufferTimeModel(4, 2), bufferTimeOverlapExample, 'bufferTime-overlap-session7-example', runBufferTimeTrace],
  ['bufferToggle', createBufferToggleModel(), bufferToggleExample, 'bufferToggle-session8-example'],
  ['bufferWhen', createBufferWhenModel(), bufferWhenExample, 'bufferWhen-session8-example'],
  ['catchError', createCatchErrorModel(), catchErrorExample, 'catchError-session8-example'],
  ['combineAll', createCombineAllModel(), combineAllExample, 'combineAll-session8-example'],
  ['combineLatestAll', createCombineLatestAllModel(), combineLatestAllExample, 'combineLatestAll-session8-example'],

  ['combineLatest', createCombineLatestModel(), combineLatestExample, 'combineLatest-session9-example'],
  ['combineLatestWith', createCombineLatestWithModel(), combineLatestWithExample, 'combineLatestWith-session9-example'],
  ['concat', createConcatModel(), concatExample, 'concat-session9-example'],
  ['concatMapTo', createConcatMapToModel('shared'), concatMapToExample, 'concatMapTo-session9-example'],
  ['concatWith', createConcatWithModel(), concatWithExample, 'concatWith-session9-example'],
  ['connect', createConnectModel(), connectExample, 'connect-session10-example'],
  ['debounce', createDebounceModel(), debounceExample, 'debounce-session10-example'],
  ['defaultIfEmpty', createDefaultIfEmptyModel('fallback'), defaultIfEmptyExample, 'defaultIfEmpty-session10-example'],
  ['delay', createDelayModel(3), delayExample, 'delay-session10-example'],
  ['delayWhen', createDelayWhenModel(), delayWhenExample, 'delayWhen-session10-example'],
  ['dematerialize', createDematerializeModel(), dematerializeExample, 'dematerialize-session11-example'],
  ['elementAt', createElementAtModel(2, 'fallback'), elementAtExample, 'elementAt-session11-example'],
  ['endWith', createEndWithModel(['suffix-one', 'suffix-two']), endWithExample, 'endWith-session11-example'],
  ['every', createEveryModel(), everyExample, 'every-session11-example'],
  ['exhaust', createExhaustModel(), exhaustExample, 'exhaust-session11-example'],
];
const json = value => JSON.stringify(value, null, 2) + '\n';
const files = new Map();
for (const [name, model, inputs, executionId, traceRunner = runTrace] of examples) {
  const manifest = toManifest(model);
  const trace = traceRunner(model, inputs, { executionId });
  for (const [path, content] of [
    [`generated/${name}.manifest.json`, json(manifest)],
    [`generated/${name}.stt.md`, renderTable(manifest)],
    [`generated/${name}.bdd.md`, renderBdd(manifest)],
    [`generated/${name}.diagram.md`, renderDiagram(manifest)],
    [`generated/${name}.obligations.md`, renderObligations(manifest)],
    [`generated/${name}.trace.json`, json(trace)],
    [`generated/${name}.trace.md`, renderTrace(trace)],
    [`operators/${name}.md`, renderBehavior(manifest)],
  ]) {
    if (files.has(path)) throw new Error(`Duplicate generation target: ${path}`);
    files.set(path, content);
  }
}
const check = process.argv.includes('--check');
let failures = 0;
for (const [path, content] of files) {
  if (check) {
    const actual = await readFile(path, 'utf8').catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (actual !== content) { console.error(`Stale or missing generated file: ${path}`); failures++; }
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
}
if (failures) process.exitCode = 1;
else console.log(`${check ? 'Verified' : 'Generated'} ${files.size} deterministic projections.`);
