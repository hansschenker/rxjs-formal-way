import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

// Verify published inspection navigation; normal generation checking owns replay.
const root = new URL('../', import.meta.url);
const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const catalog = [
  { operator: 'zip', examples: ['zip', 'zip-drain', 'zip-cancel'], guide: 'ZIP', coverage: 'SCENARIOS', model: 'session23-zip-common.ts' },
  { operator: 'zipAll', examples: ['zipAll', 'zipAll-empty', 'zipAll-cancel'], guide: 'ZIP-ALL', coverage: 'ZIP-ALL', model: 'session23-zipAll.ts' },
  { operator: 'zipWith', examples: ['zipWith', 'zipWith-drain', 'zipWith-cancel'], guide: 'ZIP-WITH', coverage: 'SCENARIOS', model: 'session23-zip-common.ts' },
];
const stepNames = ['Operator Overview', 'State Diagram', 'State Transition Table', 'BDD Scenarios',
  'Concrete Trace', 'Verification Obligations', 'Formal Manifest', 'Canonical Mealy Model',
  'RxJS 7.8.2 Source', 'Tests', 'Evidence Ledger'];
const links = text => [...text.matchAll(/\[[^\]\n]+\]\(([^)\s]+)\)/g)].map(match => match[1]);
const indexFor = async operator => {
  const url = new URL(`operators/${operator}-index.md`, root), text = await readFile(url, 'utf8');
  const rows = text.split('\n').filter(line => /^\| \d+ \|/.test(line)).map(line => {
    const [number, name, artifacts] = line.split(' | ');
    return { number: Number(number.slice(2)), name, links: links(artifacts) };
  });
  return { url, text, rows };
};

test('S23 ARTIFACTS: three export indexes group exactly nine examples with all eleven inspection steps', async () => {
  const seen = [];
  for (const { operator, examples, guide, coverage, model } of catalog) {
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
      assert.equal(manifest.metadata.evidence.record, 'evidence/SESSION-23.md');
      assert.equal(manifest.metadata.evidence.scenarios, `docs/SESSION-23-${guide}.md`);
      assert.equal(manifest.metadata.evidence.coverage, `docs/SESSION-23-${coverage}.md`);
      assert.ok(manifest.rules.length > 0);
    }
  }
  assert.equal(seen.length, 9); assert.equal(new Set(seen).size, 9);
});

test('S23 ARTIFACTS: all committed indexes resolve models, native comparisons, traces, scenarios and evidence', async () => {
  const visited = new Set();
  for (const { operator, examples, guide, coverage, model } of catalog) {
    const { url, text, rows } = await indexFor(operator);
    const scenario = `../docs/SESSION-23-${guide}.md`;
    const coverageDocument = `../docs/SESSION-23-${coverage}.md`;
    const required = [
      examples.map(name => `./${name}.md`),
      examples.map(name => `../generated/${name}.diagram.md`),
      examples.map(name => `../generated/${name}.stt.md`),
      [...examples.map(name => `../generated/${name}.bdd.md`), scenario],
      examples.map(name => `../generated/${name}.trace.md`),
      examples.map(name => `../generated/${name}.obligations.md`),
      examples.map(name => `../generated/${name}.manifest.json`),
      [`../src/models/${model}`],
      [`https://github.com/ReactiveX/rxjs/blob/${revision}/src/internal/operators/${operator}.ts`,
        `https://github.com/ReactiveX/rxjs/blob/${revision}/spec/operators/${operator}-spec.ts`],
      [`../tests/session23-${operator}-model.test.mjs`, `../tests/session23-${operator}-rxjs.test.mjs`,
        `../tests/session23-${operator}-differential.test.mjs`, coverageDocument],
      ['../evidence/SESSION-23.md'],
    ];
    assert.equal(rows.length, required.length);
    for (const [index, targets] of required.entries())
      for (const target of targets) assert.ok(rows[index].links.includes(target), `${operator} step ${index + 1}: ${target}`);
    for (const target of rows[8].links)
      assert.ok(target.startsWith(`https://github.com/ReactiveX/rxjs/blob/${revision}/`));
    const local = links(text).filter(target => !/^[a-z][a-z\d+.-]*:/i.test(target));
    local.push(...examples.map(name => `../generated/${name}.trace.json`));
    for (const target of local) {
      const resolved = new URL(target, url); assert.ok(resolved.href.startsWith(root.href));
      if (visited.has(resolved.href)) continue;
      visited.add(resolved.href);
      const info = await stat(resolved);
      assert.ok(info.isFile() && info.size > 0, `${operator}: nonempty navigation target ${target}`);
    }
  }
});
