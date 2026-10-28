import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createTakeModel, takeExample, toManifest, runTrace, renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace } from '../dist/index.js';

const model = createTakeModel(2);
const manifest = toManifest(model);
const trace = runTrace(model, takeExample, { executionId: 'take-2-example' });
const json = value => JSON.stringify(value, null, 2) + '\n';
const files = new Map([
  ['generated/take.manifest.json', json(manifest)],
  ['generated/take.stt.md', renderTable(manifest)],
  ['generated/take.bdd.md', renderBdd(manifest)],
  ['generated/take.diagram.md', renderDiagram(manifest)],
  ['generated/take.obligations.md', renderObligations(manifest)],
  ['generated/take.trace.json', json(trace)],
  ['generated/take.trace.md', renderTrace(trace)],
  ['operators/take.md', renderBehavior(manifest)],
]);
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
