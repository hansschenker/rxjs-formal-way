import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createTakeModel, takeExample, createMapModel, mapExample, createFilterModel, filterExample,
  createSeededScanModel, createUnseededScanModel, seededScanExample, unseededScanExample,
  createDebounceTimeModel, debounceTimeExample, runDebounceTimeTrace,
  toManifest, runTrace, renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace, renderInspectionIndex } from '../dist/index.js';

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

import {
  createExpandModel, expandExample, createFinalizeModel, finalizeExample,
  createFindModel, findExample, createFindIndexModel, findIndexExample,
  createFirstModel, firstExample
} from '../dist/index.js';

import { createGroupByModel, groupByExample, createIgnoreElementsModel, ignoreElementsExample,
  createIsEmptyModel, isEmptyExample, createLastModel, lastExample,
  createMapToModel, mapToExample } from '../dist/index.js';
import { createMaterializeModel, materializeExample, createMergeModel, mergeExample,
  createFlatMapModel, flatMapExample, createMergeMapToModel, mergeMapToExample,
  createMergeScanModel, mergeScanExample } from '../dist/index.js';

import { createMergeWithModel, mergeWithExample, createMulticastModel, multicastExample,
 createObserveOnModel, observeOnExample, createOnErrorResumeNextModel, onErrorResumeNextExample,
 createPartitionModel, partitionExample } from '../dist/index.js';

import { createPluckModel, pluckExample, createPublishPlainModel, publishExample,
  createPublishBehaviorModel, publishBehaviorExample, createPublishLastModel, publishLastExample,
  createPublishReplayModel, publishReplayExample } from '../dist/index.js';

import {
  createRaceLegacyModel, createRaceWithModel, raceExample, raceWithExample,
  createRepeatModel, repeatExample, createRepeatWhenModel, repeatWhenExample,
  createRetryModel, retryExample
} from '../dist/index.js';

const canonicalModelPaths = {
  take:'src/models/take.ts', map:'src/models/map.ts', filter:'src/models/filter.ts', scan:'src/models/scan.ts',
  debounceTime:'src/models/debounceTime.ts', switchMap:'src/models/flatten.ts', mergeMap:'src/models/flatten.ts',
  concatMap:'src/models/flatten.ts', exhaustMap:'src/models/flatten.ts', share:'src/models/share.ts',
  switchAll:'src/models/all.ts', mergeAll:'src/models/all.ts', concatAll:'src/models/all.ts', exhaustAll:'src/models/all.ts',
  shareReplay:'src/models/shareReplay.ts', distinctUntilChanged:'src/models/adjacent.ts',
  distinctUntilKeyChanged:'src/models/adjacent.ts', distinct:'src/models/distinct.ts', pairwise:'src/models/pairwise.ts',
  startWith:'src/models/startWith.ts', skip:'src/models/gating.ts', takeWhile:'src/models/gating.ts',
  skipWhile:'src/models/gating.ts', takeUntil:'src/models/until.ts', skipUntil:'src/models/until.ts',
  reduce:'src/models/aggregate.ts', count:'src/models/aggregate.ts', toArray:'src/models/aggregate.ts',
  min:'src/models/aggregate.ts', max:'src/models/aggregate.ts', audit:'src/models/audit.ts', auditTime:'src/models/audit.ts',
  buffer:'src/models/buffering.ts', bufferCount:'src/models/buffering.ts', bufferTime:'src/models/bufferTime.ts',
  bufferToggle:'src/models/bufferSelectors.ts', bufferWhen:'src/models/bufferSelectors.ts',
  catchError:'src/models/catchError.ts', combineAll:'src/models/combineLatestAll.ts',
  combineLatestAll:'src/models/combineLatestAll.ts', combineLatest:'src/models/session09-joins.ts',
  combineLatestWith:'src/models/session09-joins.ts', concat:'src/models/session09-joins.ts',
  concatWith:'src/models/session09-joins.ts', concatMapTo:'src/models/concatMapTo.ts',
  connect:'src/models/connect.ts', debounce:'src/models/debounce.ts', defaultIfEmpty:'src/models/defaultIfEmpty.ts',
  delay:'src/models/delayPolicy.ts', delayWhen:'src/models/delayPolicy.ts',
  dematerialize:'src/models/session11-scalar.ts', elementAt:'src/models/session11-scalar.ts',
  endWith:'src/models/session11-scalar.ts', every:'src/models/session11-scalar.ts', exhaust:'src/models/exhaust.ts',
  expand:'src/models/session12.ts', finalize:'src/models/session12.ts', find:'src/models/session12.ts',
  findIndex:'src/models/session12.ts', first:'src/models/session12.ts',
  groupBy:'src/models/session13-groupBy.ts', ignoreElements:'src/models/session13-scalars.ts',
  isEmpty:'src/models/session13-scalars.ts', last:'src/models/session13-scalars.ts', mapTo:'src/models/session13-scalars.ts',
  materialize:'src/models/session14-materialize.ts', merge:'src/models/session14-merge.ts',
  flatMap:'src/models/session14-flatten.ts', mergeMapTo:'src/models/session14-flatten.ts',
  mergeScan:'src/models/session14-flatten.ts',
  mergeWith:'src/models/session15-aliases.ts', multicast:'src/models/session15-aliases.ts',
  observeOn:'src/models/session15-observeOn.ts', onErrorResumeNext:'src/models/session15-onErrorResumeNext.ts',
  partition:'src/models/session15-partition.ts',
  pluck:'src/models/session16.ts', publish:'src/models/session16.ts',
  publishBehavior:'src/models/session16.ts', publishLast:'src/models/session16.ts',
  publishReplay:'src/models/session16.ts',
  race:'src/models/session17-race.ts', raceWith:'src/models/session17-race.ts',
  repeat:'src/models/session17-restart.ts', retry:'src/models/session17-restart.ts',
  repeatWhen:'src/models/session17-repeatWhen.ts',
};

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
  ['expand', createExpandModel(), expandExample, 'expand-session12-example'],
  ['finalize', createFinalizeModel(), finalizeExample, 'finalize-session12-example'],
  ['find', createFindModel(), findExample, 'find-session12-example'],
  ['findIndex', createFindIndexModel(), findIndexExample, 'findIndex-session12-example'],
  ['first', createFirstModel(true), firstExample, 'first-session12-example'],
  ['groupBy', createGroupByModel(), groupByExample, 'groupBy-session13-example'],
  ['ignoreElements', createIgnoreElementsModel(), ignoreElementsExample, 'ignoreElements-session13-example'],
  ['isEmpty', createIsEmptyModel(), isEmptyExample, 'isEmpty-session13-example'],
  ['last', createLastModel(true), lastExample, 'last-session13-example'],
  ['mapTo', createMapToModel('constant'), mapToExample, 'mapTo-session13-example'],
  ['materialize', createMaterializeModel(), materializeExample, 'materialize-session14-example'],
  ['merge', createMergeModel(2,2), mergeExample, 'merge-session14-example'],
  ['flatMap', createFlatMapModel(2), flatMapExample, 'flatMap-session14-example'],
  ['mergeMapTo', createMergeMapToModel('shared',2), mergeMapToExample, 'mergeMapTo-session14-example'],
  ['mergeScan', createMergeScanModel(0,2), mergeScanExample, 'mergeScan-session14-example'],
  ['mergeWith', createMergeWithModel(2), mergeWithExample, 'mergeWith-session15-example'],
  ['multicast', createMulticastModel(), multicastExample, 'multicast-session15-example'],
  ['observeOn', createObserveOnModel(2), observeOnExample, 'observeOn-session15-example'],
  ['onErrorResumeNext', createOnErrorResumeNextModel(2), onErrorResumeNextExample, 'onErrorResumeNext-session15-example'],
  ['partition', createPartitionModel(), partitionExample, 'partition-session15-example'],
  ['pluck', createPluckModel(['person','name']), pluckExample, 'pluck-session16-example'],
  ['publish', createPublishPlainModel(), publishExample, 'publish-session16-example'],
  ['publishBehavior', createPublishBehaviorModel(0), publishBehaviorExample, 'publishBehavior-session16-example'],
  ['publishLast', createPublishLastModel(), publishLastExample, 'publishLast-session16-example'],
  ['publishReplay', createPublishReplayModel(2), publishReplayExample, 'publishReplay-session16-example'],
  ['race', createRaceLegacyModel(2), raceExample, 'race-session17-example'],
  ['raceWith', createRaceWithModel(2), raceWithExample, 'raceWith-session17-example'],
  ['repeat', createRepeatModel(2), repeatExample, 'repeat-session17-example'],
  ['repeatWhen', createRepeatWhenModel(), repeatWhenExample, 'repeatWhen-session17-example'],
  ['retry', createRetryModel(2), retryExample, 'retry-session17-example'],
];
const json = value => JSON.stringify(value, null, 2) + '\n';
const files = new Map();
const inspectionProfiles = new Map();
for (const [name, model, inputs, executionId, traceRunner = runTrace] of examples) {
  const manifest = toManifest(model);
  const trace = traceRunner(model, inputs, { executionId });
  const operator = manifest.metadata.operator;
  const profiles = inspectionProfiles.get(operator) ?? [];
  profiles.push({ name, manifest });
  inspectionProfiles.set(operator, profiles);
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
for (const [operator, profiles] of inspectionProfiles) {
  const canonicalModelPath = canonicalModelPaths[operator];
  if (!canonicalModelPath) throw new Error(`Missing canonical model path for inspection index: ${operator}`);
  const path = `operators/${operator}-index.md`;
  if (files.has(path)) throw new Error(`Duplicate generation target: ${path}`);
  files.set(path, renderInspectionIndex(operator, profiles, canonicalModelPath));
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
