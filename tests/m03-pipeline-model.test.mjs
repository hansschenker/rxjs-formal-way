import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPipelineModel,
  createTakeModel,
  explorePipeline,
  initialPipelineState,
  liftOperator,
  stepPipeline,
} from '../dist/index.js';

const takeAdapter = {
  upstreamResourceIds: ['source'],
  subscribeEvent: () => ({ type: 'subscribe' }),
  cancelEvent: () => ({ type: 'cancel' }),
  fromUpstream: notification => {
    if (notification.kind === 'N') return { type: 'source.next', value: notification.value };
    if (notification.kind === 'C') return { type: 'source.complete' };
    return { type: 'source.error', error: notification.error };
  },
};

const createModel = () => createPipelineModel('take2-take1', [
  liftOperator('upstream-take2', createTakeModel(2), takeAdapter),
  liftOperator('downstream-take1', createTakeModel(1), takeAdapter),
]);

test('M03 composes forward notifications and reverse cancellation to quiescence', () => {
  const model = createModel();
  const init = initialPipelineState(model);
  const subscribed = stepPipeline(model, init, {
    nodeId: 'downstream-take1',
    event: { type: 'subscribe' },
    time: 0,
  });

  assert.deepEqual(subscribed.state.nodes, [
    { phase: 'Active', seen: 0 },
    { phase: 'Active', seen: 0 },
  ]);
  assert.deepEqual(subscribed.effects, [{
    nodeId: 'upstream-take2',
    action: { type: 'subscribe', resource: { id: 'source', generation: 0 } },
  }]);

  const next = stepPipeline(model, subscribed.state, {
    nodeId: 'upstream-take2',
    event: { type: 'source.next', value: 'A' },
    time: 1,
  });

  assert.deepEqual(next.outputs, [
    { kind: 'N', value: 'A' },
    { kind: 'C' },
  ]);
  assert.deepEqual(next.state.nodes, [
    { phase: 'Closed', reason: 'cancel' },
    { phase: 'Closed', reason: 'quota' },
  ]);
  assert.deepEqual(next.effects, [{
    nodeId: 'upstream-take2',
    action: { type: 'unsubscribe', resource: { id: 'source', generation: 0 } },
  }]);
  assert.deepEqual(next.microSteps.map(x => [x.nodeId, x.ruleId]), [
    ['upstream-take2', 'TAKE-NEXT-PASS'],
    ['downstream-take1', 'TAKE-NEXT-LAST'],
    ['upstream-take2', 'TAKE-CANCEL'],
  ]);
});

test('M03 bounded explorer checks reachable stable pipeline states', () => {
  const model = createModel();
  const subscribed = stepPipeline(model, initialPipelineState(model), {
    nodeId: 'downstream-take1',
    event: { type: 'subscribe' },
    time: 0,
  }).state;

  const result = explorePipeline(model, subscribed, {
    maxDepth: 2,
    maxStates: 20,
    events: state => {
      const upstream = state.nodes[0];
      if (upstream?.phase !== 'Active') return [];
      return [
        { nodeId: 'upstream-take2', event: { type: 'source.next', value: 'A' }, time: 1 },
        { nodeId: 'upstream-take2', event: { type: 'source.complete' }, time: 1 },
      ];
    },
    invariants: [{
      id: 'M03-INV-01',
      description: 'once downstream is closed, upstream cannot remain active',
      check: state => state.nodes[1]?.phase !== 'Closed' || state.nodes[0]?.phase !== 'Active',
    }],
  });

  assert.equal(result.status, 'complete');
  assert.equal(result.violations.length, 0);
  assert.equal(result.statesVisited, 3);
  assert.equal(result.transitionsExplored, 2);
});

test('M03 explorer returns a counterexample path for a false invariant', () => {
  const model = createModel();
  const subscribed = stepPipeline(model, initialPipelineState(model), {
    nodeId: 'downstream-take1',
    event: { type: 'subscribe' },
    time: 0,
  }).state;

  const result = explorePipeline(model, subscribed, {
    maxDepth: 1,
    events: state => state.nodes[0]?.phase === 'Active'
      ? [{ nodeId: 'upstream-take2', event: { type: 'source.next', value: 'A' }, time: 1 }]
      : [],
    invariants: [{
      id: 'M03-FALSE',
      description: 'downstream never closes',
      check: state => state.nodes[1]?.phase !== 'Closed',
    }],
  });

  assert.equal(result.violations.length, 1);
  assert.equal(result.violations[0].invariantId, 'M03-FALSE');
  assert.deepEqual(result.violations[0].path, [
    { nodeId: 'upstream-take2', event: { type: 'source.next', value: 'A' }, time: 1 },
  ]);
});
