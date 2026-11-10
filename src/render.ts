import type { Action, Event, OperatorManifest, Trace } from './schema.js';

const cell = (value: unknown): string => String(value).replaceAll('|', '&#124;').replaceAll('\n', ' ');
const header = (title: string): string => `# ${title}\n\n> Generated from the canonical model by npm run generate. Do not edit this projection.\n\n`;

export function renderTable<P>(manifest: OperatorManifest<P>): string {
  return header(`${manifest.metadata.id}: state transition table`) +
    'Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.\n\n' +
    '| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |\n|---|---|---|---|---|---|---|\n' +
    manifest.rules.map(r => `| ${[r.id, r.from, r.event, r.guard, r.actions.join('; ') || 'no actions', r.nextState, r.obligations.join(', ')].map(cell).join(' | ')} |`).join('\n') + '\n';
}

export function renderBdd<P>(manifest: OperatorManifest<P>): string {
  const inputs = new Map(manifest.metadata.inputs.map(i => [i.type, i.description]));
  return header(`${manifest.metadata.id}: Convertible BDD`) +
    'Restricted project profile: And denotes next state, not general Gherkin conjunction.\n\n' +
    manifest.rules.map(r => `## ${r.id}\n\n\`\`\`text\nGiven ${r.from} and ${r.guard}\nWhen ${inputs.get(r.event)}\n${(r.actions.length ? r.actions : ['emit no action']).map(a => `Then ${a}`).join('\n')}\nAnd ${r.nextState}\n\`\`\`\n`).join('\n');
}

export function renderDiagram<P>(manifest: OperatorManifest<P>): string {
  const names = new Map(manifest.metadata.controls.map((s, index) => [s.id, `s${index}`]));
  const label = (text: string): string => text.replaceAll('"', "'").replaceAll('\n', ' ');
  return header(`${manifest.metadata.id}: state diagram`) +
    'Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.\n\n```mermaid\nstateDiagram-v2\n' +
    manifest.metadata.controls.map(s => `    state "${label(s.id)}" as ${names.get(s.id)}`).join('\n') +
    `\n    [*] --> ${names.get(manifest.metadata.initialization.control)}\n` +
    manifest.rules.map(r => `    ${names.get(r.from)} --> ${names.get(r.to)} : ${r.id} ${r.event} [${label(r.guard)}]`).join('\n') +
    '\n```\n';
}

export function renderObligations<P>(manifest: OperatorManifest<P>): string {
  return header(`${manifest.metadata.id}: test obligations`) +
    `A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in ${manifest.metadata.evidence.runtimeTests.join(', ')}.\n\n` +
    manifest.rules.map(r => `## ${r.id}\n\nReach **${r.from}** with **${r.guard}**, then provide **${r.event}**.\n\nExpect, in order: ${r.actions.join('; ') || 'no actions'}.\n\nResulting state: ${r.nextState}. Verify future silence after termination and source lifetime independently of value assertions.\n\nRuntime witnesses: ${r.obligations.join(', ')}.\n`).join('\n');
}

export function renderBehavior<P>(manifest: OperatorManifest<P>): string {
  const { metadata: m } = manifest;
  return header(`${m.operator}: operator behavior`) + m.purpose + '\n\n' +
    `**Scope:** ${m.scope.parameters}. ${m.scope.reentrancy}\n\n` +
    `**Dataflow shape:** \`${m.cardinality.signature}\`. ${m.cardinality.conditions.join(' ')}\n\n` +
    manifest.rules.map(r => `<!-- ${r.id} -->\n${r.explanation}\n`).join('\n') +
    `\n**Time:** ${m.scope.time}\n\n**Sharing:** ${m.ownership.sharing}\n\n` +
    `**Callbacks:** ${m.scope.callbacks}\n\n**Excluded:** ${m.scope.exclusions.join(' ')}\n\n` +
    `The runtime is not generated from these paragraphs. [Evidence](../${m.evidence.record}) is reported separately from this specification.\n`;
}

const json = (value: unknown): string => JSON.stringify(value);
const actionText = <T>(action: Action<T>): string => action.type === 'notify'
  ? `${action.target}.${action.notification.kind}(${action.notification.kind === 'N' ? json(action.notification.value) : action.notification.kind === 'E' ? json(action.notification.error) : ''})`
  : action.type === 'invoke-callback'
    ? `invoke(${action.resource.id}#${action.resource.generation}, value=${json(action.value)}, index=${action.index})`
    : `${action.type}(${action.resource.id}#${action.resource.generation}${action.type === 'schedule' ? `, delay=${action.delay}` : ''})`;

export function renderTrace<S, E extends Event, T>(trace: Trace<S, E, Action<T>>): string {
  return header(`${trace.steps[0]?.modelId ?? 'empty'}: concrete trace and four-lane view`) +
    '**Model-predicted**, not a recording of RxJS execution. Input times come from the scenario; sequence breaks ties. Payloads in this exported example are JSON-safe symbols.\n\n' +
    '| Sequence | Time | Rule | Input | Before | Ordered actions | After |\n|---:|---:|---|---|---|---|---|\n' +
    trace.steps.map(s => `| ${[s.sequence, s.time, s.ruleId, json(s.event), json(s.before), s.actions.map(actionText).join('; '), json(s.after)].map(cell).join(' | ')} |`).join('\n') +
    '\n\n## Four lanes\n\n| Lane | ' + trace.steps.map(s => `step ${s.sequence}`).join(' | ') + ' |\n' +
    '|---|' + trace.steps.map(() => '---|').join('') + '\n' +
    [
      ['Time', ...trace.steps.map(s => `${s.time}`)],
      ['Input', ...trace.steps.map(s => json(s.event))],
      ['Control / state', ...trace.steps.map(s => json(s.after))],
      ['Output notifications', ...trace.steps.map(s => s.actions.filter(a => a.type === 'notify').map(actionText).join('; ') || 'none')],
    ].map(row => `| ${row.map(cell).join(' | ')} |`).join('\n') +
    '\n\nThe ordered-action column retains lifecycle observations omitted from the output-notification lane.\n';
}

export type InspectionProfile = Readonly<{
  name: string;
  manifest: OperatorManifest<unknown>;
}>;

const mdLink = (label: string, href: string): string => \`[\${label}](\${href})\`;
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

export function renderInspectionIndex(
  operator: string,
  profiles: readonly InspectionProfile[],
  canonicalModelPath: string,
): string {
  if (!profiles.length) throw new Error('inspection index requires at least one profile');
  const primary = profiles.find(profile => profile.name === operator) ?? profiles[0]!;
  const metadata = primary.manifest.metadata;
  const profileLinks = (
    suffix: string,
    label: string,
    base = '../generated/',
  ): string => profiles.map(profile =>
    mdLink(\`\${profile.name} \${label}\`, \`\${base}\${profile.name}\${suffix}\`)
  ).join('<br>');

  const sourceLinks = unique(profiles.flatMap(profile => profile.manifest.metadata.sources.map(source => source.url)))
    .map(url => mdLink(url.split('/').at(-1) ?? url, url)).join('<br>');
  const modelTests = unique(profiles.flatMap(profile => profile.manifest.metadata.evidence.modelTests))
    .map(path => mdLink(path, \`../\${path}\`));
  const runtimeTests = unique(profiles.flatMap(profile => profile.manifest.metadata.evidence.runtimeTests))
    .map(path => mdLink(path, \`../\${path}\`));
  const evidenceRecords = unique(profiles.map(profile => profile.manifest.metadata.evidence.record))
    .map(path => mdLink(path, \`../\${path}\`)).join('<br>');

  const rows = [
    ['1', 'Operator Overview', profileLinks('.md', 'behavior', './'), 'What does this operator do?'],
    ['2', 'State Diagram', profileLinks('.diagram.md', 'diagram'), 'What states can the operator be in?'],
    ['3', 'State Transition Table', profileLinks('.stt.md', 'STT'), 'What happens for every legal state/event combination?'],
    ['4', 'BDD Scenarios', profileLinks('.bdd.md', 'BDD'), 'How can the rules be read as Given–When–Then behavior?'],
    ['5', 'Concrete Trace', profileLinks('.trace.md', 'trace'), 'How does one concrete execution unfold over time?'],
    ['6', 'Verification Obligations', profileLinks('.obligations.md', 'obligations'), 'What claims must be checked?'],
    ['7', 'Formal Manifest', profileLinks('.manifest.json', 'manifest'), 'What is the complete machine-readable specification?'],
    ['8', 'Canonical Mealy Model', mdLink(canonicalModelPath, \`../\${canonicalModelPath}\`), 'How is the semantics encoded as executable guarded rules?'],
    ['9', 'RxJS 7.8.2 Source', sourceLinks, 'What does the pinned RxJS implementation actually do?'],
    ['10', 'Tests', [...modelTests, ...runtimeTests].join('<br>'), 'Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior?'],
    ['11', 'Evidence Ledger', evidenceRecords, 'What was actually executed, verified, accepted, and explicitly excluded?'],
  ];

  return header(\`\${operator}: Operator Inspection Index\`) +
    'Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.\\n\\n' +
    \`**RxJS:** \${metadata.rxjsVersion}  \\n\` +
    \`**Purpose:** \${metadata.purpose}  \\n\` +
    \`**Cω shape:** \\\`\${metadata.cardinality.signature}\\\`  \\n\` +
    \`**Profiles represented:** \${profiles.map(profile => \\\`\${profile.name}\\\`).join(', ')}\\n\\n\` +
    '## Three teaching passes\\n\\n' +
    '**Pass 1 — Understand:** 1 Overview → 2 Diagram → 5 Trace  \\n' +
    '**Pass 2 — Specify:** 3 STT → 4 BDD → 7 Manifest → 8 Canonical Mealy Model  \\n' +
    '**Pass 3 — Verify:** 9 RxJS Source → 10 Tests → 6 Obligations → 11 Evidence\\n\\n' +
    '## Master chain\\n\\n' +
    '\`State → Step → Trace → Behavior → Specification → Implementation → Verification\`\\n\\n' +
    'The artifacts below are different projections of one canonical semantic model; native RxJS tests and the evidence ledger are independent verification evidence.\\n\\n' +
    '## Inspection workflow\\n\\n' +
    '| # | Inspection step | Artifact | Question it answers |\\n|---:|---|---|---|\\n' +
    rows.map(row => \`| \${row.map(cell).join(' | ')} |\`).join('\\n') + '\\n\\n' +
    '## Scope at a glance\\n\\n' +
    \`**Parameters:** \${metadata.scope.parameters}\\n\\n\` +
    \`**Callbacks:** \${metadata.scope.callbacks}\\n\\n\` +
    \`**Time:** \${metadata.scope.time}\\n\\n\` +
    \`**Reentrancy:** \${metadata.scope.reentrancy}\\n\\n\` +
    \`**Sharing / ownership:** \${metadata.ownership.sharing}\\n\\n\` +
    '**Explicit exclusions:**\\n\\n' +
    metadata.scope.exclusions.map(item => \`- \${item}\`).join('\\n') + '\\n\\n' +
    '## Recommended reading rule\\n\\n' +
    'Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.\\n';
}

