import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

// Inspect the generated files a reader receives. Byte-for-byte regeneration and
// canonical trace replay remain the responsibility of npm run check:generated.
const repository = new URL('../', import.meta.url);
const revision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
const scenarioPath = '../docs/SESSION-20-SCENARIOS.md';
const evidencePath = '../evidence/SESSION-20.md';
const exports = [
  { operator: 'takeLast', profiles: ['takeLast', 'takeLast-zero'], model: 'session20-terminal.ts' },
  { operator: 'tap', profiles: ['tap', 'tap-next'], model: 'session20-tap.ts' },
  { operator: 'throwIfEmpty', profiles: ['throwIfEmpty', 'throwIfEmpty-custom'], model: 'session20-terminal.ts' },
  { operator: 'throttle', profiles: ['throttle', 'throttle-leading-trailing', 'throttle-trailing', 'throttle-silent'], model: 'session20-throttle.ts' },
  { operator: 'throttleTime', profiles: ['throttleTime', 'throttleTime-leading-trailing', 'throttleTime-trailing', 'throttleTime-silent'], model: 'session20-throttle.ts' },
];
const steps = [
  'Operator Overview', 'State Diagram', 'State Transition Table', 'BDD Scenarios',
  'Concrete Trace', 'Verification Obligations', 'Formal Manifest',
  'Canonical Mealy Model', 'RxJS 7.8.2 Source', 'Tests', 'Evidence Ledger',
];
const links = text => [...text.matchAll(/\[[^\]\n]+\]\(([^)\s]+)\)/g)].map(match => match[1]);
const readIndex = async operator => {
  const url = new URL(`operators/${operator}-index.md`, repository);
  const text = await readFile(url, 'utf8');
  const rows = text.split('\n').filter(line => /^\| \d+ \|/.test(line)).map(line => {
    const [number, label, artifacts] = line.split(' | ');
    return { number: Number(number.slice(2)), label, links: links(artifacts) };
  });
  return { url, text, rows };
};

test('S20 ARTIFACTS: five export indexes group exactly fourteen profiles in the eleven-step workflow', async () => {
  const represented = [];
  for (const { operator, profiles } of exports) {
    const { text, rows } = await readIndex(operator);
    assert.ok(text.startsWith(`# ${operator}: Operator Inspection Index\n`), `${operator}: public index identity`);
    const declarations = [...text.matchAll(/^\*\*Profiles represented:\*\* (.+)$/gm)];
    assert.equal(declarations.length, 1, `${operator}: one profile declaration`);
    const names = [...declarations[0][1].matchAll(/`([^`]+)`/g)].map(match => match[1]);
    assert.deepEqual([...names].sort(), [...profiles].sort(), `${operator}: exact profile membership`);
    represented.push(...names);
    assert.deepEqual(rows.map(row => row.number), steps.map((_, index) => index + 1), `${operator}: each inspection step appears once`);
    assert.deepEqual(rows.map(row => row.label), steps, `${operator}: standard navigation sequence`);
    for (const profile of profiles) {
      const manifest = JSON.parse(await readFile(new URL(`generated/${profile}.manifest.json`, repository), 'utf8'));
      assert.equal(manifest.metadata.operator, operator, `${profile}: manifest belongs to its public export`);
      assert.equal(manifest.metadata.rxjsVersion, '7.8.2', `${profile}: pinned runtime version`);
      assert.equal(manifest.metadata.evidence.record, 'evidence/SESSION-20.md', `${profile}: evidence association`);
      assert.equal(manifest.metadata.evidence.scenarios, 'docs/SESSION-20-SCENARIOS.md', `${profile}: scenario association`);
      if (operator === 'takeLast') {
        assert.ok(profile === 'takeLast-zero' ? manifest.parameters.count === 0 : manifest.parameters.count > 0, `${profile}: distinct zero/positive-count policy`);
      } else if (operator === 'tap') {
        const hooks = profile === 'tap-next' ? ['next'] : ['subscribe', 'next', 'error', 'complete', 'unsubscribe', 'finalize'];
        assert.deepEqual([...manifest.parameters.hooks].sort(), [...hooks].sort(), `${profile}: configured hook policy`);
      } else if (operator === 'throwIfEmpty') {
        assert.equal(manifest.parameters.factory, profile === 'throwIfEmpty-custom' ? 'custom' : 'default', `${profile}: factory binding`);
      } else {
        const flags = {
          [operator]: [true, false],
          [`${operator}-leading-trailing`]: [true, true],
          [`${operator}-trailing`]: [false, true],
          [`${operator}-silent`]: [false, false],
        };
        assert.equal(manifest.parameters.mode, operator, `${profile}: duration source`);
        assert.deepEqual([manifest.parameters.leading, manifest.parameters.trailing], flags[profile], `${profile}: leading/trailing policy`);
      }
    }
  }
  assert.equal(represented.length, 14);
  assert.equal(new Set(represented).size, 14, 'No profile is counted under multiple export indexes.');
});

test('S20 ARTIFACTS: public navigation reaches every profile artifact, model, scenario, test and evidence file', async () => {
  const inspected = new Set();
  for (const { operator, profiles, model } of exports) {
    const { url, text, rows } = await readIndex(operator);
    const required = [
      profiles.map(profile => `./${profile}.md`),
      profiles.map(profile => `../generated/${profile}.diagram.md`),
      profiles.map(profile => `../generated/${profile}.stt.md`),
      [...profiles.map(profile => `../generated/${profile}.bdd.md`), scenarioPath],
      profiles.map(profile => `../generated/${profile}.trace.md`),
      profiles.map(profile => `../generated/${profile}.obligations.md`),
      profiles.map(profile => `../generated/${profile}.manifest.json`),
      [`../src/models/${model}`],
      [
        `https://github.com/ReactiveX/rxjs/blob/${revision}/src/internal/operators/${operator}.ts`,
        `https://github.com/ReactiveX/rxjs/blob/${revision}/spec/operators/${operator}-spec.ts`,
      ],
      ['../tests/session20-model.test.mjs', '../tests/session20-rxjs.test.mjs', '../tests/session20-differential.test.mjs', scenarioPath],
      [evidencePath],
    ];
    assert.equal(rows.length, required.length, `${operator}: complete inspection navigation`);
    for (const [index, expected] of required.entries()) {
      for (const target of expected) assert.ok(rows[index].links.includes(target), `${operator} step ${index + 1}: missing ${target}`);
    }
    for (const target of rows[8].links) {
      assert.ok(target.startsWith(`https://github.com/ReactiveX/rxjs/blob/${revision}/`), `${operator}: source links must retain the pinned revision`);
    }
    const localLinks = links(text).filter(target => !/^[a-z][a-z\d+.-]*:/i.test(target));
    // Trace JSON is the eighth standard profile artifact. The eleven-row index
    // links its human-readable companion, so check the JSON file separately.
    localLinks.push(...profiles.map(profile => `../generated/${profile}.trace.json`));
    for (const target of localLinks) {
      const resolved = new URL(target, url);
      assert.ok(resolved.href.startsWith(repository.href), `${operator}: link leaves the repository: ${target}`);
      if (inspected.has(resolved.href)) continue;
      inspected.add(resolved.href);
      const info = await stat(resolved);
      assert.ok(info.isFile() && info.size > 0, `${operator}: navigation target must be a nonempty file: ${target}`);
    }
  }
});
