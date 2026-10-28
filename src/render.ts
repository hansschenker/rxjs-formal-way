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
