import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createTakeModel, takeExample, createMapModel, mapExample, createFilterModel, filterExample,
  createSeededScanModel, createUnseededScanModel, seededScanExample, unseededScanExample,
  toManifest, runTrace, renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace } from '../dist/index.js';

// Canonical examples specify callback outcomes; generation never executes user callbacks.
const examples = [
  ['take', createTakeModel(2), takeExample, 'take-2-example'],
  ['map', createMapModel(), mapExample, 'map-example'],
  ['filter', createFilterModel(), filterExample, 'filter-example'],
  ['scan-seeded', createSeededScanModel(0), seededScanExample, 'scan-seeded-example'],
  ['scan-unseeded', createUnseededScanModel(), unseededScanExample, 'scan-unseeded-example'],
];
const json = value => JSON.stringify(value, null, 2) + '\n';
const files = new Map();
for (const [name, model, inputs, executionId] of examples) {
  const manifest = toManifest(model);
  const trace = runTrace(model, inputs, { executionId });
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
