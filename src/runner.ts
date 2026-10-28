import type { Action, Event, OperatorManifest, OperatorModel, Reaction, TimedEvent, Trace, TraceStep } from './schema.js';

const fail = (message: string): never => { throw new Error(message); };
const assertValid = (errors: readonly string[]): void => {
  if (errors.length) fail(errors.join('; '));
};

/** Structural checks only. Symbolic reachability and universal guard totality are not decided. */
export function validateModel<P, S, E extends Event, A>(model: OperatorModel<P, S, E, A>): readonly string[] {
  const { metadata: m, rules } = model;
  const errors: string[] = [];
  const unique = (values: readonly string[], label: string): void => {
    if (values.some(value => !value.trim())) errors.push(`${label}: empty identifier`);
    if (new Set(values).size !== values.length) errors.push(`${label}: duplicate identifier`);
  };
  unique(m.controls.map(x => x.id), 'controls');
  unique(m.inputs.map(x => x.type), 'inputs');
  unique(rules.map(x => x.description.id), 'rules');
  unique(m.ownership.resources.map(x => x.id), 'resources');
  const controls = new Set(m.controls.map(x => x.id));
  const inputs = new Set(m.inputs.map(x => x.type));
  if (!m.id || m.schemaVersion !== '1.0') errors.push('invalid identity/version');
  if (!controls.has(m.initialization.control)) errors.push('undeclared initial control');
  if (!inputs.has(m.initialization.event)) errors.push('undeclared initialization event');
  if (!m.sources.length || !m.evidence.record) errors.push('missing provenance/evidence record');
  if (!m.actionTypes.length || new Set(m.actionTypes).size !== m.actionTypes.length) errors.push('invalid action alphabet');
  if (!rules.length) errors.push('empty rule set');
  for (const { description: r } of rules) {
    if (!controls.has(r.from) || !controls.has(r.to)) errors.push(`${r.id}: undeclared control`);
    if (!inputs.has(r.event)) errors.push(`${r.id}: undeclared event`);
    if (!r.guard || !r.explanation || !r.nextState || !r.obligations.length || r.actions.some(x => !x.trim())) errors.push(`${r.id}: incomplete description`);
  }
  const initial = model.initialState();
  errors.push(...model.validateState(initial, model.parameters));
  if (model.control(initial) !== m.initialization.control) errors.push('initial control mismatch');
  return errors;
}

export function toManifest<P, S, E extends Event, A>(model: OperatorModel<P, S, E, A>): OperatorManifest<P> {
  assertValid(validateModel(model));
  return { metadata: model.metadata, parameters: model.parameters, rules: model.rules.map(r => r.description) };
}

/** One combined T/G evaluation, once. The returned actions are observations/commands, never executed. */
export function stepModel<P, S, E extends Event, A>(
  model: OperatorModel<P, S, E, A>, state: S, event: E,
): Reaction<S, A> & Readonly<{ ruleId: string }> {
  assertValid(model.validateState(state, model.parameters));
  const candidates = model.rules.filter(r =>
    r.description.from === model.control(state) && r.description.event === event.type &&
    r.enabled(state, event, model.parameters));
  if (candidates.length !== 1) fail(`${model.metadata.id}: ${candidates.length ? 'ambiguous' : 'illegal'} transition ${model.control(state)} / ${event.type}`);
  const rule = candidates[0]!;
  const result = rule.react(state, event, model.parameters);
  assertValid(model.validateState(result.state, model.parameters));
  if (model.control(result.state) !== rule.description.to) fail(`${rule.description.id}: next-control mismatch`);
  assertValid(model.validateReaction(state, event, result, model.parameters));
  return { ...result, ruleId: rule.description.id };
}

/** Time is supplied by the caller. Equal-time events retain array order; no clock or timer is created. */
export function runTrace<P, S, E extends Event, A>(
  model: OperatorModel<P, S, E, A>, inputs: readonly TimedEvent<E>[],
  options: Readonly<{ executionId: string; maxSteps?: number }>,
): Trace<S, E, A> {
  assertValid(validateModel(model));
  if (!options.executionId.trim()) fail('executionId is required');
  const budget = options.maxSteps ?? 10000;
  if (!Number.isSafeInteger(budget) || budget < 0) fail('maxSteps must be a nonnegative safe integer');
  let previous = -Infinity;
  for (const input of inputs) {
    if (!Number.isFinite(input.time) || input.time < 0 || input.time < previous) fail('times must be finite, nonnegative and nondecreasing');
    previous = input.time;
  }
  let state = model.initialState();
  const steps: TraceStep<S, E, A>[] = [];
  for (const [sequence, input] of inputs.entries()) {
    if (sequence >= budget) return { status: 'budget-exhausted', consumed: sequence, state, steps };
    const before = state;
    const result = stepModel(model, state, input.event);
    state = result.state;
    steps.push({ sequence, time: input.time, modelId: model.metadata.id, executionId: options.executionId,
      ruleId: result.ruleId, event: input.event, before, after: state, actions: result.actions });
  }
  return { status: 'finished-input', consumed: inputs.length, state, steps };
}

/** Per-word notification protocol, respecting subscriber addressing. Across-word checks belong to the model. */
export function validateActionWord<T>(actions: readonly Action<T>[]): readonly string[] {
  const terminal = new Set<string>();
  const errors: string[] = [];
  for (const action of actions) {
    if (action.type === 'notify') {
      if (!action.target) errors.push('empty notification target');
      if (terminal.has(action.target)) errors.push('notification after terminal');
      if (action.notification.kind !== 'N') terminal.add(action.target);
    } else {
      if (!action.resource.id || !Number.isSafeInteger(action.resource.generation) || action.resource.generation < 0) errors.push('invalid resource identity');
      if (action.type === 'schedule' && (!Number.isFinite(action.delay) || action.delay < 0)) errors.push('invalid timer delay');
    }
  }
  return errors;
}
