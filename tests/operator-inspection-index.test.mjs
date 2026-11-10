import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAuditModel, createSeededScanModel, createUnseededScanModel,
  toManifest, renderInspectionIndex
} from '../dist/index.js';

test('INSPECTION-INDEX audit: exposes the canonical eleven-step teaching workflow',()=>{
  const text=renderInspectionIndex('audit',[
    {name:'audit',manifest:toManifest(createAuditModel())}
  ],'src/models/audit.ts');

  for(const label of [
    '1 | Operator Overview',
    '2 | State Diagram',
    '3 | State Transition Table',
    '4 | BDD Scenarios',
    '5 | Concrete Trace',
    '6 | Verification Obligations',
    '7 | Formal Manifest',
    '8 | Canonical Mealy Model',
    '9 | RxJS 7.8.2 Source',
    '10 | Tests',
    '11 | Evidence Ledger',
  ]) assert.ok(text.includes(label),label);

  assert.match(text,/Pass 1 — Understand/);
  assert.match(text,/Pass 2 — Specify/);
  assert.match(text,/Pass 3 — Verify/);
  assert.match(text,/State → Step → Trace → Behavior → Specification → Implementation → Verification/);
  assert.match(text,/\[audit behavior\]\(\.\/audit\.md\)/);
  assert.match(text,/\[audit STT\]\(\.\.\/generated\/audit\.stt\.md\)/);
  assert.match(text,/\[src\/models\/audit\.ts\]\(\.\.\/src\/models\/audit\.ts\)/);
  assert.match(text,/\[SESSION-07\.md\]\(\.\.\/evidence\/SESSION-07\.md\)/);
});

test('INSPECTION-INDEX scan: groups multiple semantic profiles under one public export index',()=>{
  const text=renderInspectionIndex('scan',[
    {name:'scan-seeded',manifest:toManifest(createSeededScanModel(0))},
    {name:'scan-unseeded',manifest:toManifest(createUnseededScanModel())},
  ],'src/models/scan.ts');

  assert.ok(text.includes('Profiles represented: `scan-seeded`, `scan-unseeded`'));
  assert.match(text,/\[scan-seeded behavior\]\(\.\/scan-seeded\.md\)/);
  assert.match(text,/\[scan-unseeded behavior\]\(\.\/scan-unseeded\.md\)/);
  assert.match(text,/\[scan-seeded trace\]\(\.\.\/generated\/scan-seeded\.trace\.md\)/);
  assert.match(text,/\[scan-unseeded trace\]\(\.\.\/generated\/scan-unseeded\.trace\.md\)/);
  assert.equal((text.match(/\| 11 \| Evidence Ledger \|/g)||[]).length,1);
});

test('INSPECTION-INDEX: rendering is deterministic',()=>{
  const profiles=[{name:'audit',manifest:toManifest(createAuditModel())}];
  const a=renderInspectionIndex('audit',profiles,'src/models/audit.ts');
  const b=renderInspectionIndex('audit',profiles,'src/models/audit.ts');
  assert.equal(a,b);
});
