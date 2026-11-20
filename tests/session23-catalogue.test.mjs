import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import * as nativeOperators from 'rxjs/operators';

const root = new URL('../', import.meta.url);

test('S23 CATALOGUE: the inventory and published indexes cover every pinned native operator export', async () => {
  const inventory = JSON.parse(await readFile(new URL('planning/operator-generation.json', root), 'utf8'));
  const runtimeNames = Object.keys(nativeOperators).filter(name => typeof nativeOperators[name] === 'function').sort();
  assert.equal(inventory.rxjsVersion, '7.8.2');
  assert.equal(runtimeNames.length, 113);
  assert.deepEqual(Object.keys(inventory.operators).sort(), runtimeNames);
  for (const operator of runtimeNames) {
    const index = await readFile(new URL(`operators/${operator}-index.md`, root), 'utf8');
    assert.ok(index.startsWith(`# ${operator}: Operator Inspection Index\n`), operator);
    const row = index.match(/^\*\*Profiles represented:\*\* (.+)$/m);
    assert.ok(row, `${operator}: examples are declared`);
    const examples = [...row[1].matchAll(/`([^`]+)`/g)].map(match => match[1]);
    assert.ok(examples.length > 0, `${operator}: at least one configured example`);
    for (const example of examples) {
      const manifest = JSON.parse(await readFile(new URL(`generated/${example}.manifest.json`, root), 'utf8'));
      assert.equal(manifest.metadata.operator, operator);
      assert.equal(manifest.metadata.rxjsVersion, '7.8.2');
      assert.ok(manifest.rules.length > 0, `${operator}: guarded rules`);
      const evidence = manifest.metadata.evidence;
      assert.ok(evidence.modelTests.length > 0 && evidence.runtimeTests.length > 0, `${operator}: model and actual runtime evidence`);
      for (const target of [...evidence.modelTests, ...evidence.runtimeTests, evidence.record]) {
        const info = await stat(new URL(target, root));
        assert.ok(info.isFile() && info.size > 0, `${operator}: ${target}`);
      }
    }
  }
});
