import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

// Inspect published navigation. The normal drift check owns canonical replay.
const root = new URL('../', import.meta.url);
const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const catalog = [
  { operator: 'timeInterval', examples: ['timeInterval'], family: 'clock' },
  { operator: 'timestamp', examples: ['timestamp'], family: 'clock' },
  { operator: 'timeout', examples: ['timeout', 'timeout-first', 'timeout-first-each', 'timeout-absolute-fallback'], family: 'timeout' },
  { operator: 'timeoutWith', examples: ['timeoutWith', 'timeoutWith-date'], family: 'timeout' },
  { operator: 'window', examples: ['window', 'window-boundary-complete', 'window-cancel'], family: 'window' },
];
const stepNames = ['Operator Overview', 'State Diagram', 'State Transition Table', 'BDD Scenarios',
  'Concrete Trace', 'Verification Obligations', 'Formal Manifest', 'Canonical Mealy Model',
  'RxJS 7.8.2 Source', 'Tests', 'Evidence Ledger'];
const links = text => [...text.matchAll(/\[[^\]\n]+\]\(([^)\s]+)\)/g)].map(match => match[1]);
const indexFor = async operator => {
  const url = new URL(`operators/${operator}-index.md`, root);
  const text = await readFile(url, 'utf8');
  const rows = text.split('\n').filter(line => /^\| \d+ \|/.test(line)).map(line => {
    const [number, name, artifacts] = line.split(' | ');
    return { number: Number(number.slice(2)), name, links: links(artifacts) };
  });
  return { url, text, rows };
};

test('S21 ARTIFACTS: five indexes group exactly eleven examples with complete inspection navigation', async () => {
  const seen = [];
  for (const { operator, examples } of catalog) {
    const { text, rows } = await indexFor(operator);
    assert.ok(text.startsWith(`# ${operator}: Operator Inspection Index\n`));
    const declared = [...text.matchAll(/^\*\*Profiles represented:\*\* (.+)$/gm)];
    assert.equal(declared.length, 1);
    const names = [...declared[0][1].matchAll(/`([^`]+)`/g)].map(match => match[1]);
    assert.deepEqual([...names].sort(), [...examples].sort(), `${operator}: exact example membership`);
    seen.push(...names);
    assert.deepEqual(rows.map(row => row.number), stepNames.map((_, i) => i + 1));
    assert.deepEqual(rows.map(row => row.name), stepNames);
    for (const name of names) {
      const manifest = JSON.parse(await readFile(new URL(`generated/${name}.manifest.json`, root), 'utf8'));
      assert.equal(manifest.metadata.operator, operator);
      assert.equal(manifest.metadata.rxjsVersion, '7.8.2');
      assert.equal(manifest.metadata.evidence.record, 'evidence/SESSION-21.md');
      assert.equal(manifest.metadata.evidence.scenarios, 'docs/SESSION-21-SCENARIOS.md');
      assert.ok(manifest.rules.length > 0);
    }
  }
  assert.equal(seen.length, 11);
  assert.equal(new Set(seen).size, 11);
});

test('S21 ARTIFACTS: committed indexes resolve every example, model, test, scenario and evidence target', async () => {
  const visited = new Set();
  for (const { operator, examples, family } of catalog) {
    const { url, text, rows } = await indexFor(operator);
    const required = [
      examples.map(name => `./${name}.md`),
      examples.map(name => `../generated/${name}.diagram.md`),
      examples.map(name => `../generated/${name}.stt.md`),
      [...examples.map(name => `../generated/${name}.bdd.md`), '../docs/SESSION-21-SCENARIOS.md'],
      examples.map(name => `../generated/${name}.trace.md`),
      examples.map(name => `../generated/${name}.obligations.md`),
      examples.map(name => `../generated/${name}.manifest.json`),
      [`../src/models/session21-${family}.ts`],
      [`https://github.com/ReactiveX/rxjs/blob/${revision}/src/internal/operators/${operator}.ts`,
        `https://github.com/ReactiveX/rxjs/blob/${revision}/spec/operators/${operator}-spec.ts`],
      [`../tests/session21-${family}-model.test.mjs`, `../tests/session21-${family}-rxjs.test.mjs`,
        `../tests/session21-${family}-differential.test.mjs`, '../docs/SESSION-21-SCENARIOS.md'],
      ['../evidence/SESSION-21.md'],
    ];
    assert.equal(rows.length, required.length);
    for (const [index, targets] of required.entries()) {
      for (const target of targets) assert.ok(rows[index].links.includes(target), `${operator} step ${index + 1}: ${target}`);
    }
    for (const target of rows[8].links) assert.ok(target.startsWith(`https://github.com/ReactiveX/rxjs/blob/${revision}/`));
    const local = links(text).filter(target => !/^[a-z][a-z\d+.-]*:/i.test(target));
    local.push(...examples.map(name => `../generated/${name}.trace.json`));
    for (const target of local) {
      const resolved = new URL(target, url);
      assert.ok(resolved.href.startsWith(root.href));
      if (visited.has(resolved.href)) continue;
      visited.add(resolved.href);
      const info = await stat(resolved);
      assert.ok(info.isFile() && info.size > 0, `${operator}: nonempty navigation target ${target}`);
    }
  }
});
