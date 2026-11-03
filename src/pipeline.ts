import type { Action, Event, Notification, OperatorModel, Reaction } from './schema.js';
import { stepModel } from './runner.js';

export type PipelineEffect = Readonly<{
  nodeId: string;
  action: Action<unknown, unknown>;
}>;

export type PipelineMicroStep = Readonly<{
  nodeId: string;
  ruleId: string;
  event: Event;
  before: unknown;
  after: unknown;
  actions: readonly Action<unknown, unknown>[];
}>;

export type PipelineNode = Readonly<{
  id: string;
  initialState: () => unknown;
  control: (state: unknown) => string;
  isTerminal: (state: unknown) => boolean;
  step: (state: unknown, event: Event) => Reaction<unknown, Action<unknown, unknown>> & Readonly<{ ruleId: string }>;
  upstreamResourceIds: readonly string[];
  subscribeEvent: (time: number) => Event;
  cancelEvent: (time: number) => Event;
  fromUpstream: (notification: Notification<unknown>, time: number) => Event;
}>;

export type PipelineModel = Readonly<{
  id: string;
  nodes: readonly PipelineNode[];
}>;

export type PipelineState = Readonly<{
  nodes: readonly unknown[];
}>;

export type PipelineInput = Readonly<{
  nodeId: string;
  event: Event;
  time: number;
}>;

export type PipelineStep = Readonly<{
  state: PipelineState;
  outputs: readonly Notification<unknown>[];
  effects: readonly PipelineEffect[];
  microSteps: readonly PipelineMicroStep[];
}>;

export type PipelineInvariant = Readonly<{
  id: string;
  description: string;
  check: (state: PipelineState) => boolean;
}>;

export type PipelineCounterexample = Readonly<{
  invariantId: string;
  description: string;
  path: readonly PipelineInput[];
  state: PipelineState;
}>;

export type PipelineExploration = Readonly<{
  status: 'complete' | 'state-budget-exhausted';
  statesVisited: number;
  transitionsExplored: number;
  violations: readonly PipelineCounterexample[];
}>;

export type PipelineAdapter<E extends Event> = Readonly<{
  upstreamResourceIds: readonly string[];
  subscribeEvent: (time: number) => E;
  cancelEvent: (time: number) => E;
  fromUpstream: (notification: Notification<unknown>, time: number) => E;
}>;

/**
 * Erase one strongly typed operator model into a heterogeneous pipeline node.
 * The local model remains authoritative; the pipeline layer only routes its
 * already-declared events and actions.
 */
export function liftOperator<P, S, E extends Event>(
  id: string,
  model: OperatorModel<P, S, E, Action<unknown, unknown>>,
  adapter: PipelineAdapter<E>,
): PipelineNode {
  if (!id.trim()) throw new Error('pipeline node id is required');
  return {
    id,
    initialState: () => model.initialState(),
    control: state => model.control(state as S),
    isTerminal: state => {
      const control = model.control(state as S);
      return model.metadata.controls.some(candidate => candidate.id === control && candidate.terminal);
    },
    step: (state, event) => stepModel(model, state as S, event as E),
    upstreamResourceIds: [...adapter.upstreamResourceIds],
    subscribeEvent: adapter.subscribeEvent,
    cancelEvent: adapter.cancelEvent,
    fromUpstream: adapter.fromUpstream,
  };
}

export function createPipelineModel(id: string, nodes: readonly PipelineNode[]): PipelineModel {
  if (!id.trim()) throw new Error('pipeline id is required');
  if (!nodes.length) throw new Error('pipeline requires at least one node');
  const ids = nodes.map(node => node.id);
  if (ids.some(x => !x.trim()) || new Set(ids).size !== ids.length) throw new Error('pipeline node ids must be nonempty and unique');
  return { id, nodes: [...nodes] };
}

export function initialPipelineState(model: PipelineModel): PipelineState {
  return { nodes: model.nodes.map(node => node.initialState()) };
}

const findNode = (model: PipelineModel, nodeId: string): number => {
  const index = model.nodes.findIndex(node => node.id === nodeId);
  if (index < 0) throw new Error(`${model.id}: unknown pipeline node ${nodeId}`);
  return index;
};

/**
 * Execute one externally visible event to synchronous quiescence.
 *
 * Forward notifications are delivered immediately to the next node.
 * subscribe/unsubscribe actions for the declared upstream resource are
 * delivered immediately to the previous node. Timer, callback and inner
 * resource actions remain explicit effects and therefore become future
 * environment/model-checking boundaries.
 */
export function stepPipeline(
  model: PipelineModel,
  state: PipelineState,
  input: PipelineInput,
  options: Readonly<{ maxMicroSteps?: number }> = {},
): PipelineStep {
  if (state.nodes.length !== model.nodes.length) throw new Error('pipeline state/model arity mismatch');
  if (!Number.isFinite(input.time) || input.time < 0) throw new Error('pipeline input time must be finite and nonnegative');
  const budget = options.maxMicroSteps ?? 1000;
  if (!Number.isSafeInteger(budget) || budget <= 0) throw new Error('maxMicroSteps must be a positive safe integer');

  const nodeStates = [...state.nodes];
  const outputs: Notification<unknown>[] = [];
  const effects: PipelineEffect[] = [];
  const microSteps: PipelineMicroStep[] = [];
  let count = 0;

  const deliver = (index: number, event: Event): void => {
    if (++count > budget) throw new Error(`${model.id}: synchronous-closure budget exhausted`);
    const node = model.nodes[index]!;
    const before = nodeStates[index];
    const result = node.step(before, event);
    nodeStates[index] = result.state;
    const actions = result.actions as readonly Action<unknown, unknown>[];
    microSteps.push({ nodeId: node.id, ruleId: result.ruleId, event, before, after: result.state, actions });

    for (const action of actions) {
      if (action.type === 'notify') {
        const downstream = index + 1;
        if (downstream < model.nodes.length) {
          deliver(downstream, model.nodes[downstream]!.fromUpstream(action.notification, input.time));
        } else {
          outputs.push(action.notification);
        }
        continue;
      }

      if ((action.type === 'subscribe' || action.type === 'unsubscribe') &&
          node.upstreamResourceIds.includes(action.resource.id) && index > 0) {
        const upstream = model.nodes[index - 1]!;
        if (action.type === 'unsubscribe' && upstream.isTerminal(nodeStates[index - 1])) continue;
        deliver(index - 1, action.type === 'subscribe' ? upstream.subscribeEvent(input.time) : upstream.cancelEvent(input.time));
        continue;
      }

      effects.push({ nodeId: node.id, action });
    }
  };

  deliver(findNode(model, input.nodeId), input.event);
  return { state: { nodes: nodeStates }, outputs, effects, microSteps };
}

const defaultStateKey = (state: PipelineState): string => JSON.stringify(state);

/**
 * Bounded explicit-state exploration over stable pipeline snapshots.
 * The event generator defines the finite environment abstraction. This is a
 * small model-checking kernel, not a claim of exhaustive verification for
 * unbounded JavaScript/RxJS values, time or source behavior.
 */
export function explorePipeline(
  model: PipelineModel,
  start: PipelineState,
  options: Readonly<{
    events: (state: PipelineState) => readonly PipelineInput[];
    invariants?: readonly PipelineInvariant[];
    maxDepth?: number;
    maxStates?: number;
    stateKey?: (state: PipelineState) => string;
    maxMicroSteps?: number;
  }>,
): PipelineExploration {
  const invariants = options.invariants ?? [];
  const maxDepth = options.maxDepth ?? 20;
  const maxStates = options.maxStates ?? 10000;
  const key = options.stateKey ?? defaultStateKey;
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0) throw new Error('maxDepth must be a nonnegative safe integer');
  if (!Number.isSafeInteger(maxStates) || maxStates <= 0) throw new Error('maxStates must be a positive safe integer');

  type Item = Readonly<{ state: PipelineState; depth: number; path: readonly PipelineInput[] }>;
  const queue: Item[] = [{ state: start, depth: 0, path: [] }];
  const seen = new Set<string>([key(start)]);
  const violations: PipelineCounterexample[] = [];
  let transitionsExplored = 0;

  const check = (item: Item): void => {
    for (const invariant of invariants) {
      if (!invariant.check(item.state)) {
        violations.push({ invariantId: invariant.id, description: invariant.description, path: item.path, state: item.state });
      }
    }
  };
  check(queue[0]!);

  while (queue.length) {
    const item = queue.shift()!;
    if (item.depth >= maxDepth) continue;
    for (const input of options.events(item.state)) {
      const result = stepPipeline(model, item.state, input, options.maxMicroSteps === undefined ? {} : { maxMicroSteps: options.maxMicroSteps });
      transitionsExplored++;
      const next: Item = { state: result.state, depth: item.depth + 1, path: [...item.path, input] };
      check(next);
      const stateId = key(next.state);
      if (seen.has(stateId)) continue;
      if (seen.size >= maxStates) {
        return { status: 'state-budget-exhausted', statesVisited: seen.size, transitionsExplored, violations };
      }
      seen.add(stateId);
      queue.push(next);
    }
  }

  return { status: 'complete', statesVisited: seen.size, transitionsExplored, violations };
}
