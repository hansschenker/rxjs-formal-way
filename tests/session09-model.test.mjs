import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCombineLatestModel, createCombineLatestWithModel, createConcatModel,
  createConcatWithModel, createConcatMapToModel,
  combineLatestExample, combineLatestWithExample, concatExample, concatWithExample, concatMapToExample,
  validateModel, toManifest, stepModel, runTrace,
  renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior, renderTrace
} from '../dist/index.js';

const resource = generation => ({ id: 'input', generation });
const inner = generation => ({ id: 'inner', generation });
const constant = generation => ({ id: 'constant', generation });
const notifications = actions => actions.filter(a => a.type === 'notify').map(a => a.notification);
const run = (model, events) => {
  let state = model.initialState(), actions = [], ruleIds = [];
  for (const event of events) {
    const result = stepModel(model, state, event);
    state = result.state;
    actions.push(...result.actions);
    ruleIds.push(result.ruleId);
  }
  return { state, actions, ruleIds, notifications: notifications(actions) };
};
const examples = [
  ['combineLatest', () => createCombineLatestModel(), combineLatestExample, [{kind:'N',value:[1,10]},{kind:'N',value:[2,10]},{kind:'N',value:[2,11]},{kind:'C'}]],
  ['combineLatestWith', () => createCombineLatestWithModel(), combineLatestWithExample, [{kind:'N',value:[1,10]},{kind:'N',value:[2,10]},{kind:'N',value:[2,11]},{kind:'C'}]],
  ['concat', () => createConcatModel(), concatExample, [{kind:'N',value:1},{kind:'N',value:2},{kind:'N',value:3},{kind:'C'}]],
  ['concatMapTo', () => createConcatMapToModel('shared'), concatMapToExample, [{kind:'N',value:'a'},{kind:'N',value:'b'},{kind:'C'}]],
  ['concatWith', () => createConcatWithModel(), concatWithExample, [{kind:'N',value:1},{kind:'N',value:2},{kind:'N',value:3},{kind:'C'}]],
];
for (const [name, factory, example, expected] of examples) {
  test('S9-MODEL ' + name + ': guarded rules and eight deterministic representations', () => {
    const model = factory(), manifest = toManifest(model);
    assert.deepEqual(validateModel(model), []);
    assert.equal(model.metadata.operator, name);
    assert.equal(model.metadata.rxjsVersion, '7.8.2');
    assert.ok(model.metadata.cardinality.signature.includes(':'));
    assert.ok(model.metadata.scope.time && model.metadata.scope.reentrancy);
    assert.ok(model.metadata.ownership.sharing && model.metadata.dispatch.actionSemantics);
    assert.ok(model.metadata.sources.some(x => x.revision === 'e5351d02e225e275ac0e497c7b66eaa5f0c88791'));
    assert.equal(new Set(model.rules.map(x => x.description.id)).size, model.rules.length);
    for (const render of [renderTable, renderBdd, renderDiagram, renderObligations, renderBehavior]) {
      const text = render(manifest);
      assert.equal(render(manifest), text);
      for (const rule of model.rules) assert.ok(text.includes(rule.description.id), 'missing ' + rule.description.id);
    }
    const trace = runTrace(model, example, { executionId: 'session9-' + name });
    assert.equal(trace.status, 'finished-input');
    assert.equal(trace.state.phase, 'Closed');
    assert.equal(trace.steps.length, example.length);
    assert.match(renderTrace(trace), /Four lanes/);
    assert.deepEqual(notifications(trace.steps.flatMap(x => x.actions)), expected);
  });
  test('S9-MODEL ' + name + ': terminal state rejects further events', () => {
    const model = factory();
    const result = run(model, example.map(x => x.event));
    assert.throws(() => stepModel(model, result.state, {type:'cancel'}), /illegal/);
    assert.throws(() => stepModel(model, result.state, {type:'subscribe'}), /illegal/);
  });
}
test('S9-LATEST: initial subscription order, first value barrier, cloned arrays', () => {
  const model = createCombineLatestModel(2);
  const start = run(model, [{type:'subscribe'}]);
  assert.deepEqual(start.actions.filter(x => x.type === 'subscribe').map(x => x.resource.generation), [0,1,2]);
  const first = [
    {type:'subscribe'},
    {type:'input.next',resource:resource(2),value:30},
    {type:'input.next',resource:resource(0),value:10},
    {type:'input.next',resource:resource(1),value:20},
    {type:'input.next',resource:resource(0),value:11},
  ];
  const outcome = run(model, first);
  assert.deepEqual(outcome.notifications, [{kind:'N',value:[10,20,30]},{kind:'N',value:[11,20,30]}]);
  assert.notStrictEqual(outcome.notifications[0].value, outcome.notifications[1].value);
  assert.ok(outcome.ruleIds.some(x => x.endsWith('-WAIT')));
  assert.ok(outcome.ruleIds.some(x => x.endsWith('-EMIT')));
});
test('S9-LATEST: empty input does not terminate until remaining inputs finish', () => {
  const model = createCombineLatestWithModel();
  const result = run(model, [{type:'subscribe'},
    {type:'input.complete',resource:resource(0)},
    {type:'input.next',resource:resource(1),value:8},
    {type:'input.complete',resource:resource(1)}]);
  assert.deepEqual(result.notifications, [{kind:'C'}]);
  assert.equal(result.state.phase, 'Closed');
});
test('S9-LATEST: zero additional sources still emits singleton latest tuples', () => {
  const result=run(createCombineLatestModel(0),[
    {type:'subscribe'},{type:'input.next',resource:resource(0),value:5},
    {type:'input.next',resource:resource(0),value:6},
    {type:'input.complete',resource:resource(0)}]);
  assert.deepEqual(result.notifications,[{kind:'N',value:[5]},{kind:'N',value:[6]},{kind:'C'}]);
});
test('S9-LATEST: error identity and cancellation release only live inputs',()=>{
 const failure={error:'input'};
 const model=createCombineLatestModel(2);
 const failed=run(model,[{type:'subscribe'},
  {type:'input.complete',resource:resource(1)},
  {type:'input.error',resource:resource(2),error:failure}]);
 assert.strictEqual(failed.notifications[0].error,failure);
 assert.deepEqual(failed.actions.filter(a=>a.type==='unsubscribe').map(a=>a.resource.generation),[1,0,2]);
 const cancel=run(model,[{type:'subscribe'},{type:'cancel'}]);
 assert.deepEqual(cancel.notifications,[]);
 assert.deepEqual(cancel.actions.filter(a=>a.type==='unsubscribe').map(a=>a.resource.generation),[0,1,2]);
});
test('S9-SERIAL: only one live source; later source event is illegal',()=>{
 const model=createConcatWithModel(2);
 const state=run(model,[{type:'subscribe'}]).state;
 assert.throws(()=>stepModel(model,state,{type:'input.next',resource:resource(1),value:9}),/illegal/);
 const first=run(model,[{type:'subscribe'},{type:'input.complete',resource:resource(0)}]);
 assert.deepEqual(first.actions.filter(a=>a.type==='subscribe').map(a=>a.resource.generation),[0,1]);
 assert.equal(first.state.current,1);
});
test('S9-SERIAL: empty middle source advances; input error prevents future subscription',()=>{
 const model=createConcatModel(2),failure={failure:true};
 const result=run(model,[{type:'subscribe'},
  {type:'input.next',resource:resource(0),value:1},
  {type:'input.complete',resource:resource(0)},
  {type:'input.complete',resource:resource(1)},
  {type:'input.error',resource:resource(2),error:failure}]);
 assert.deepEqual(result.notifications,[{kind:'N',value:1},{kind:'E',error:failure}]);
 assert.deepEqual(result.actions.filter(a=>a.type==='subscribe').map(a=>a.resource.generation),[0,1,2]);
 assert.strictEqual(result.notifications[1].error,failure);
});
test('S9-ALIASES: latest and serial pairs have exactly equal action words',()=>{
 for(const [a,b,events] of [
  [createCombineLatestModel(),createCombineLatestWithModel(),combineLatestExample],
  [createConcatModel(),createConcatWithModel(),concatExample]]) {
  assert.deepEqual(run(a,events.map(x=>x.event)).actions,run(b,events.map(x=>x.event)).actions);
 }
});
test('S9-MAPTO: queue requires sequential resubscription to exactly one source token',()=>{
 const model=createConcatMapToModel('shared');
 const partial=run(model,concatMapToExample.slice(0,7).map(x=>x.event));
 assert.equal(partial.state.phase,'Calling');
 assert.throws(()=>stepModel(model,partial.state,{type:'callback.return',resource:constant(1),value:'other'}),/illegal/);
 const done=run(model,concatMapToExample.map(x=>x.event));
 assert.deepEqual(done.notifications,[{kind:'N',value:'a'},{kind:'N',value:'b'},{kind:'C'}]);
 assert.deepEqual(done.actions.filter(x=>x.type==='subscribe'&&x.resource.id==='inner')
   .map(x=>x.resource.generation),[0,1]);
 assert.equal(done.state.phase,'Closed');
});
test('S9-MAPTO: cancel with queued occurrences releases current, never starts next',()=>{
 const model=createConcatMapToModel('shared');
 const result=run(model,[{type:'subscribe'},
  {type:'outer.next',value:'a'},{type:'callback.return',resource:constant(0),value:'shared'},
  {type:'outer.next',value:'b'},{type:'cancel'}]);
 assert.deepEqual(result.notifications,[]);
 assert.deepEqual(result.actions.filter(x=>x.type==='subscribe'&&x.resource.id==='inner')
   .map(x=>x.resource.generation),[0]);
 assert.equal(result.state.phase,'Closed');
});
test('S9-PARAMETERS: reject invalid counts, preserve exact join mode',()=>{
 for(const n of [-1,0.5,33,NaN,Infinity])assert.throws(()=>createConcatModel(n),RangeError);
 assert.equal(createCombineLatestModel().parameters.policy,'latest');
 assert.equal(createConcatWithModel().parameters.policy,'serial');
});
