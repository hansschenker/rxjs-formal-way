import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subject, Subscription, of, defer } from 'rxjs';
import { mergeWith, map, take } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { createMergeWithModel, stepModel, validateModel, toManifest, renderBdd, renderInspectionIndex } from '../dist/index.js';
import { mergeWithScenarios, upstreamDispositions, predictMergeWithScenario } from '../dist/scenarios/mergeWith.js';
import { mergeWithScenarioProjections } from '../scripts/generate-mergeWith-scenarios.mjs';

const resource = generation => ({ id:'input', generation });
const fixture = id => {
  const result = mergeWithScenarios.find(s => s.id === id);
  assert.ok(result, 'missing scenario '+id);
  return result;
};
const predictions = scenario => predictMergeWithScenario(scenario).steps.flatMap(step =>
  step.actions.map(action => ({ time:step.time, ...action })));

/** Executes RxJS directly. No canonical rule is used to implement the runtime.
 * Only immutable input fixtures are shared. Expected outputs are separately authored.
 * Captures registered teardown side effects, not merely subscriber.closed or marble frames.
 */
function observeNative(scenario) {
  const scheduler = new TestScheduler((a,b) => assert.deepEqual(a,b));
  const origin = 10;
  scheduler.maxFrames = origin + scenario.horizon;
  const log = [], live = new Set();
  const record = action => log.push({ time:scheduler.now()-origin, ...action });
  const send = (subscriber, notification) => {
    if (notification.kind === 'N') subscriber.next(notification.value);
    else if (notification.kind === 'E') subscriber.error(notification.error);
    else subscriber.complete();
  };
  const hotSubjects = scenario.sources.map(input => input.mode === 'hot' ? new Subject() : null);
  // Live producers exist before the result is connected.
  scenario.sources.forEach((input,index) => {
    if (input.mode === 'hot') for (const delivery of input.events) {
      scheduler.schedule(() => send(hotSubjects[index], delivery.notification), origin + delivery.time);
    }
  });
  const sources = scenario.sources.map((input,index) => new Observable(subscriber => {
    live.add(index);
    record({ type:'subscribe', resource:resource(index) });
    const owned = new Subscription();
    if (input.mode === 'hot') {
      owned.add(hotSubjects[index].subscribe({
        next:value => subscriber.next(value),
        error:error => subscriber.error(error),
        complete:() => subscriber.complete(),
      }));
    } else {
      for (const delivery of input.events) owned.add(scheduler.schedule(
        () => send(subscriber, delivery.notification), delivery.time));
    }
    return () => {
      record({ type:'unsubscribe', resource:resource(index) });
      live.delete(index);
      owned.unsubscribe();
    };
  }));
  let subscription;
  scheduler.schedule(() => {
    subscription = sources[0].pipe(mergeWith(...sources.slice(1))).subscribe({
      next:value => record({ type:'notify', target:'downstream', notification:{kind:'N',value} }),
      error:error => record({ type:'notify', target:'downstream', notification:{kind:'E',error} }),
      complete:() => record({ type:'notify', target:'downstream', notification:{kind:'C'} }),
    });
  }, origin);
  if (scenario.cancelAt !== undefined) scheduler.schedule(() => subscription.unsubscribe(), origin + scenario.cancelAt);
  scheduler.flush();
  const snapshot = { log:[...log], live:[...live], closed:subscription.closed };
  // Release deliberately nonterminating fixtures only after the observed window.
  subscription.unsubscribe();
  for (const subject of hotSubjects) subject?.unsubscribe();
  return snapshot;
}

function compareScenario(scenario) {
  const trace = predictMergeWithScenario(scenario);
  const predicted = predictions(scenario);
  const actual = observeNative(scenario);
  const notifications = rows => rows.filter(a => a.type === 'notify')
    .map(({time,notification}) => ({time,notification}));
  assert.deepEqual(notifications(predicted), scenario.expected, scenario.id+' model vs independent golden');
  assert.deepEqual(notifications(actual.log), scenario.expected, scenario.id+' RxJS vs independent golden');
  assert.deepEqual(actual.log, predicted, scenario.id+' ordered values/time/subscription/teardown comparison');
  assert.deepEqual(actual.live, trace.state.phase === 'Active' ? trace.state.live : []);
  assert.equal(actual.closed, trace.state.phase === 'Closed');
  return {trace, actual};
}

for (const scenario of mergeWithScenarios) {
  test(scenario.id+': golden outputs and ordered model/native lifecycle agree', () => compareScenario(scenario));
}

// Named rule obligations resolve to concrete native comparison witnesses, not just model self-checks.
for (const rule of createMergeWithModel(2).rules) {
  test(rule.description.id, () => {
    const witness = mergeWithScenarios.find(s => s.sources.length === 3 &&
      predictMergeWithScenario(s).steps.some(step => step.ruleId === rule.description.id));
    // ERROR has a two-input upstream witness; the rule is source-count independent.
    const scenario = witness ?? mergeWithScenarios.find(s =>
      predictMergeWithScenario(s).steps.some(step => step.ruleId === rule.description.id));
    assert.ok(scenario, 'no concrete witness for '+rule.description.id);
    compareScenario(scenario);
  });
}

test('MW-MODEL: unbounded specialization has no refill and rejects fabricated pending state', () => {
  const model = createMergeWithModel(2);
  assert.deepEqual(validateModel(model), []);
  assert.equal(model.rules.length, 6);
  assert.ok(model.rules.every(r => !r.description.id.includes('REFILL')));
  const active = stepModel(model, model.initialState(), {type:'subscribe'}).state;
  assert.deepEqual(active.live,[0,1,2]);
  assert.deepEqual(active.pending,[]);
  const impossible = {...active,live:[0,1],pending:[2]};
  assert.ok(model.validateState(impossible,model.parameters).some(e => e.includes('pending')));
  assert.throws(() => stepModel(model,impossible,{type:'cancel'}), error => {
    // stepModel reports validateState errors in Error.message; it does not attach .details.
    // Assert the exact invariant rather than a nonexistent runner exception shape.
    assert.match(error.message, /mergeWith cannot have pending input subscriptions/);
    return true;
  });
  assert.equal(createMergeWithModel(0).rules.length,5);
  assert.ok(createMergeWithModel(0).rules.every(r => !r.description.id.endsWith('COMPLETE-WAIT')));
});

for (const otherSources of [0,1,2,3]) {
  test('MW-REACHABILITY-'+otherSources+': bounded states preserve empty pending and reach every retained rule', () => {
    const model = createMergeWithModel(otherSources);
    const queue = [model.initialState()], seen = new Set(), rules = new Set();
    while (queue.length) {
      const state = queue.shift(), key = JSON.stringify(state);
      if (seen.has(key)) continue;
      seen.add(key);
      assert.deepEqual(model.validateState(state,model.parameters), []);
      if (state.phase === 'Active') assert.deepEqual(state.pending, []);
      const events = state.phase === 'Unsubscribed' ? [{type:'subscribe'}]
        : state.phase === 'Active' ? [
          ...state.live.flatMap(i => [
            {type:'input.next',resource:resource(i),value:'opaque'},
            {type:'input.complete',resource:resource(i)},
            {type:'input.error',resource:resource(i),error:'fault'},
          ]), {type:'cancel'},
        ] : [];
      for (const event of events) {
        const reaction = stepModel(model,state,event);
        rules.add(reaction.ruleId);
        queue.push(reaction.state);
      }
    }
    assert.deepEqual([...rules].sort(),model.rules.map(r => r.description.id).sort());
    assert.equal(seen.size,2 ** (otherSources+1) + 3);
    console.log('MERGEWITH_REACHABILITY '+JSON.stringify({otherSources,states:seen.size,rules:[...rules].sort()}));
  });
}

test('MW-DESCRIPTIONS: precise updates, two BDD levels and exactly eleven inspection entries', () => {
  const model = createMergeWithModel(2), manifest = toManifest(model);
  const bdd = renderBdd(manifest);
  assert.match(bdd, /Rule BDD/);
  assert.match(bdd, /concrete Scenario BDD/);
  assert.doesNotMatch(bdd, /REFILL|respect FIFO admission/);
  assert.match(bdd, /live-input set is unchanged/);
  assert.match(bdd, /remove the completed input/);
  const index = renderInspectionIndex('mergeWith',[{name:'mergeWith',manifest}],'src/models/session15-aliases.ts');
  assert.equal((index.match(/^\| \d+ \|/gm)||[]).length,11);
  assert.match(index,/mergeWith.scenarios.md/);
  assert.match(index,/mergeWith.coverage.md/);
  assert.match(index,/REFINEMENT-MERGEWITH.md/);
});

test('MW-UPSTREAM: every pinned test body has a unique and honest disposition', () => {
  assert.equal(upstreamDispositions.length,22);
  assert.deepEqual(upstreamDispositions.map(x=>x.ordinal),Array.from({length:22},(_,i)=>i+1));
  assert.equal(new Set(upstreamDispositions.map(x=>x.title)).size,22);
  const nativeOnly = ['MW-NATIVE-SYNC','MW-NATIVE-ARRAY','MW-NATIVE-CHAIN','MW-NATIVE-SYNC-CANCEL'];
  for (const entry of upstreamDispositions) {
    if (entry.disposition === 'modeled-adapted-witness') fixture(entry.witness);
    else if (entry.disposition === 'runtime-only') assert.ok(nativeOnly.includes(entry.witness));
    else assert.equal(entry.witness,'not-counted');
  }
  assert.equal(upstreamDispositions.filter(x=>x.disposition==='modeled-adapted-witness').length,16);
  assert.equal(upstreamDispositions.filter(x=>x.disposition==='runtime-only').length,4);
  assert.equal(upstreamDispositions.filter(x=>x.disposition==='different-operator').length,2);
});

test('MW-GENERATION: scenario projections deterministic; predictions never labeled native recordings', () => {
  const a = mergeWithScenarioProjections(), b = mergeWithScenarioProjections();
  assert.deepEqual([...a],[...b]);
  assert.equal(a.size,3);
  assert.match(a.get('generated/mergeWith.scenarios.md'), /Model predictions/);
  assert.match(a.get('generated/mergeWith.coverage.md'), /not proof/);
  assert.match(a.get('generated/mergeWith.coverage.md'), /different-operator/);
  const traces = JSON.parse(a.get('generated/mergeWith.scenarios.trace.json'));
  assert.equal(traces.kind,'model-predictions');
  assert.equal(traces.scenarios.length,18);
});

test('MW-LIFECYCLE-COMPLETE: both registered teardowns precede the final completion notification', () => {
  const {actual} = compareScenario(fixture('MW-EMPTY2'));
  assert.deepEqual(actual.log.map(a=>a.type==='notify' ? a.notification.kind : a.type+':'+a.resource.generation),
    ['subscribe:0','subscribe:1','unsubscribe:0','unsubscribe:1','C']);
  console.log('MERGEWITH_COMPLETION_ORDER '+JSON.stringify(actual.log));
});

test('MW-LIFECYCLE-ERROR: error is observed before cleanup of all live inputs', () => {
  const {actual} = compareScenario(fixture('MW-NEVER-ERROR'));
  assert.deepEqual(actual.log.map(a=>a.type==='notify' ? a.notification.kind : a.type+':'+a.resource.generation),
    ['subscribe:0','subscribe:1','E','unsubscribe:0','unsubscribe:1']);
  console.log('MERGEWITH_ERROR_ORDER '+JSON.stringify(actual.log));
});

test('MW-LIFECYCLE-CANCEL: cleanup is silent and reaches every live input', () => {
  const {actual} = compareScenario(fixture('MW-CANCEL'));
  assert.deepEqual(actual.log.filter(a=>a.type==='unsubscribe').map(a=>[a.time,a.resource.generation]),[[3,0],[3,1],[3,2]]);
  assert.ok(actual.log.filter(a=>a.type==='notify').every(a=>a.notification.kind==='N'));
});

test('MW-NATIVE-SYNC: synchronous source-first acquisition, runtime characterization only', () => {
  const order=[],values=[];
  const source=defer(()=>{order.push('source');return of(1,2,3);});
  const other=defer(()=>{order.push('other');return of(4,5,6,7,8);});
  source.pipe(mergeWith(other)).subscribe({next:v=>values.push(v),complete:()=>order.push('complete')});
  assert.deepEqual(values,[1,2,3,4,5,6,7,8]);
  assert.deepEqual(order,['source','other','complete']);
});

test('MW-NATIVE-ARRAY: 7.8.2 plain-array regression, conversion outside canonical profile', () => {
  const values=[];
  let completed=false;
  of(1,2,3).pipe(mergeWith([4,5,6,7,8])).subscribe({next:v=>values.push(v),complete:()=>completed=true});
  assert.deepEqual(values,[1,2,3,4,5,6,7,8]);
  assert.equal(completed,true);
});

test('MW-NATIVE-CHAIN: cancellation through map/mergeWith/map, composition characterization only', () => {
  new TestScheduler((a,b)=>assert.deepEqual(a,b)).run(({hot,expectObservable,expectSubscriptions})=>{
    const a=hot('--a-----b-----c----|');
    const b=hot('-----d-----e-----f---|');
    const result=a.pipe(map(x=>x),mergeWith(b),map(x=>x));
    expectObservable(result,'----------!').toBe('--a--d--b--');
    expectSubscriptions(a.subscriptions).toBe('^---------!');
    expectSubscriptions(b.subscriptions).toBe('^---------!');
  });
});

test('MW-NATIVE-SYNC-CANCEL: take stops cooperative producer work during acquisition', () => {
  const effects=[],values=[];
  let otherConnections=0;
  const source=new Observable(sub=>{
    for(let i=0;!sub.closed && i<10;i++){effects.push(i);sub.next(i);}
  });
  source.pipe(mergeWith(defer(()=>{otherConnections++;return of(99);})),take(3)).subscribe(v=>values.push(v));
  assert.deepEqual(effects,[0,1,2]);
  assert.deepEqual(values,[0,1,2]);
  assert.equal(otherConnections,0);
});

test('MW-NATIVE-SHARING: two result subscribers own two independent sets of input subscriptions', () => {
  const connections=[0,0],teardowns=[0,0];
  const inputs=connections.map((_unused,i)=>new Observable(()=>{connections[i]++;return()=>teardowns[i]++;}));
  const merged=inputs[0].pipe(mergeWith(inputs[1]));
  const a=merged.subscribe(),b=merged.subscribe();
  assert.deepEqual(connections,[2,2]);
  a.unsubscribe();assert.deepEqual(teardowns,[1,1]);assert.equal(b.closed,false);
  b.unsubscribe();assert.deepEqual(teardowns,[2,2]);
});
