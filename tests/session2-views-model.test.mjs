import test from 'node:test';
import assert from 'node:assert/strict';
import { toManifest, runTrace } from '../dist/runner.js';
import { renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace } from '../dist/render.js';
import { createSwitchMapModel, createMergeMapModel, createConcatMapModel, createExhaustMapModel,
  switchMapExample, mergeMapExample, concatMapExample, exhaustMapExample } from '../dist/models/flatten.js';
import { createShareModel, shareExample } from '../dist/models/share.js';
for (const [factory, inputs] of [[createSwitchMapModel, switchMapExample], [() => createMergeMapModel(2), mergeMapExample],
  [createConcatMapModel, concatMapExample], [createExhaustMapModel, exhaustMapExample], [createShareModel, shareExample]]) {
  const model = factory();
  test(`S2-VIEWS ${model.metadata.operator}: every projection retains canonical identity and trace origins`, () => {
    const manifest = toManifest(model);
    for (const renderer of [renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior]) {
      const text = renderer(manifest); assert.equal(renderer(manifest), text);
      for (const rule of manifest.rules) assert.ok(text.includes(rule.id), `${rule.id} missing`);
    }
    const trace = runTrace(model, inputs, { executionId: `session2-${model.metadata.operator}` });
    assert.deepEqual(JSON.parse(JSON.stringify(trace)), trace);
    const text = renderTrace(trace); assert.match(text, /Model-predicted/); assert.match(text, /Four lanes/);
    assert.deepEqual(trace.steps.map(s => s.sequence), trace.steps.map((_, i) => i));
    for (const step of trace.steps) assert.ok(model.rules.some(r => r.description.id === step.ruleId));
  });
}
