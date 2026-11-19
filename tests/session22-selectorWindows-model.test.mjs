import test from 'node:test';
import assert from 'node:assert/strict';
import { stepModel, runTrace, toManifest, validateModel } from '../dist/runner.js';
import { createWindowToggleModel, createWindowWhenModel, windowToggleExample,
  windowToggleCompleteExample, windowWhenExample, windowWhenCompleteExample } from '../dist/models/session22-selectorWindows.js';

const source = v => ({ type: 'source.next', value: v });
const attach = (id, windowId) => ({ type: 'window.subscribe', observerId: id, windowId });
const detach = id => ({ type: 'window.unsubscribe', observerId: id });
const closer = (type, windowId) => ({ type, windowId });
const ref = id => ({ id, generation: 0 });
const sub = id => ({ type: 'subscribe', resource: ref(id) });
const unsub = id => ({ type: 'unsubscribe', resource: ref(id) });
const announce = id => ({ type: 'notify', target: 'downstream', notification: { kind: 'N', value: { windowId: id } } });
const child = (id, notification) => ({ type: 'notify', target: 'windowObserver:' + id, notification });
const invoke = (id, value) => ({ type: 'invoke-callback', resource: { id: 'selector', generation: id }, index: id, value });
const execute = (m, events) => {
  let state = m.initialState();
  const actions = [], rules = [];
  for (const e of events) { const r = stepModel(m, state, e); state = r.state; actions.push(...r.actions); rules.push(r.ruleId); }
  return { state, actions, rules };
};
const subscribe = { type: 'subscribe' }, returned = { type: 'callback.return' };
const open = value => ({ type: 'openings.next', value });

test('S22 SELECTOR MODELS: complete six-tuple, readable obligations and exact pinned scope', () => {
  for (const operator of ['windowToggle', 'windowWhen']) {
    const m = operator === 'windowToggle' ? createWindowToggleModel() : createWindowWhenModel();
    assert.deepEqual(validateModel(m), []);
    const manifest = toManifest(m);
    assert.equal(manifest.metadata.operator, operator);
    assert.equal(manifest.metadata.rxjsVersion, '7.8.2');
    assert.equal(manifest.metadata.evidence.record, 'evidence/SESSION-22.md');
    assert.match(manifest.metadata.cardinality.signature, /Observable<T>/);
    assert.ok(manifest.rules.every(r => r.guard && r.actions.length > 0 && r.obligations.length > 0));
  }
});

test('S22 WINDOWTOGGLE MODEL: opening stream subscribes before source, no initial handle', () => {
  const m = createWindowToggleModel();
  const r = execute(m, [subscribe]);
  assert.deepEqual(r.actions, [sub('openings'), sub('source')]);
  assert.deepEqual(r.state.windows, []); assert.equal(r.state.sourceLive, true);
});

test('S22 WINDOWTOGGLE MODEL: selector invoked before handle announced, then closing connects', () => {
  const m = createWindowToggleModel();
  const a = stepModel(m, execute(m, [subscribe]).state, open('O'));
  assert.deepEqual(a.actions, [invoke(0, 'O')]);
  assert.equal(a.state.phase, 'Selecting');
  const b = stepModel(m, a.state, returned);
  assert.deepEqual(b.actions, [announce(0), sub('closing') && {type:'subscribe',resource:{id:'closing',generation:0}}]);
  assert.equal(b.state.windows[0].closingLive, true);
});

test('S22 WINDOWTOGGLE MODEL: overlapping Subject handles deliver source payload to all attached consumers', () => {
  const m = createWindowToggleModel();
  const r = execute(m, [subscribe, open(1), returned, attach('A',0), source('one'),
    open(2), returned, attach('B',1), source('two')]);
  const payloads = r.actions.filter(a => a.type === 'notify' && a.target.startsWith('windowObserver:'));
  assert.deepEqual(payloads, [
    child('A', {kind:'N',value:'one'}), child('A', {kind:'N',value:'two'}),
    child('B', {kind:'N',value:'two'}),
  ]);
  assert.equal(r.state.windows.filter(w => w.status === 'open').length, 2);
});

test('S22 WINDOWTOGGLE MODEL: first closing next completes only corresponding child', () => {
  const m = createWindowToggleModel();
  const s = execute(m, [subscribe, open(1), returned, attach('A',0), open(2), returned, attach('B',1)]).state;
  const r = stepModel(m, s, closer('closing.next',0));
  assert.deepEqual(r.actions, [child('A',{kind:'C'}), unsub('windowObserver:A'),
    {type:'unsubscribe',resource:{id:'closing',generation:0}}]);
  assert.equal(r.state.windows[0].status, 'complete');
  assert.equal(r.state.windows[1].status, 'open');
  assert.deepEqual(r.state.consumers, [{observerId:'B',windowId:1}]);
});

test('S22 WINDOWTOGGLE MODEL: closing completion never closes its window; opening completion never ends source', () => {
  const m = createWindowToggleModel();
  const r = execute(m, [subscribe, open(1), returned, attach('A',0),
    closer('closing.complete',0), {type:'openings.complete'}, source('still-live'), {type:'source.complete'}]);
  assert.deepEqual(r.actions.filter(a => a.type === 'notify' && a.target === 'windowObserver:A'),
    [child('A',{kind:'N',value:'still-live'}),child('A',{kind:'C'})]);
  assert.equal(r.state.phase, 'Stopped'); assert.equal(r.state.reason, 'complete');
});

test('S22 WINDOWTOGGLE MODEL: selector throw keeps newly created handle unannounced and propagates original fault', () => {
  const m = createWindowToggleModel(), fault = {};
  const r = execute(m, [subscribe, open('bad'), {type:'callback.throw',error:fault}]);
  assert.deepEqual(r.actions.filter(a => a.type === 'notify'),
    [{type:'notify',target:'downstream',notification:{kind:'E',error:fault}}]);
  assert.equal(r.state.windows[0].status, 'error');
});

test('S22 WINDOWTOGGLE MODEL: source/openings/closing errors terminate shared windows first', () => {
  const m = createWindowToggleModel();
  for (const errorEvent of [{type:'source.error',error:'E'},{type:'openings.error',error:'E'},
    {type:'closing.error',windowId:0,error:'E'}]) {
    const r = execute(m, [subscribe,open('a'),returned,attach('A',0),errorEvent]);
    assert.deepEqual(r.actions.filter(a => a.type === 'notify'),
      [announce(0),child('A',{kind:'E',error:'E'}),{type:'notify',target:'downstream',notification:{kind:'E',error:'E'}}]);
  }
});

test('S22 WINDOWTOGGLE MODEL: cancellation releases inputs silently and invalidates open handles', () => {
  const m = createWindowToggleModel();
  const r = execute(m,[subscribe,open('a'),returned,attach('A',0),{type:'cancel'}]);
  assert.deepEqual(r.actions.slice(-3),[unsub('source'),unsub('openings'),
    {type:'unsubscribe',resource:{id:'closing',generation:0}}]);
  assert.equal(r.state.windows[0].status,'invalid');
  assert.deepEqual(r.state.consumers,[{observerId:'A',windowId:0}]);
  assert.throws(()=>stepModel(m,r.state,attach('late',0)));
  assert.deepEqual(stepModel(m,r.state,detach('A')).actions,[unsub('windowObserver:A')]);
});

test('S22 WINDOWWHEN MODEL: first handle precedes selector and source acquisition', () => {
  const m = createWindowWhenModel();
  const a=stepModel(m,m.initialState(),subscribe);
  assert.deepEqual(a.actions,[announce(0),invoke(0,undefined)]);
  const b=stepModel(m,a.state,returned);
  assert.deepEqual(b.actions,[{type:'subscribe',resource:{id:'closing',generation:0}},sub('source')]);
  assert.equal(b.state.phase,'Active');
});

test('S22 WINDOWWHEN MODEL: both closing next and closing complete rotate to a newly selected window', () => {
  const m = createWindowWhenModel();
  for (const kind of ['closing.next','closing.complete']) {
    const before=execute(m,[subscribe,attach('A',0),returned,source('one')]).state;
    const r=stepModel(m,before,closer(kind,0));
    assert.deepEqual(r.actions,[
      {type:'unsubscribe',resource:{id:'closing',generation:0}},
      child('A',{kind:'C'}),unsub('windowObserver:A'),
      announce(1),invoke(1,undefined),
    ]);
    assert.equal(r.state.phase,'Selecting');assert.equal(r.state.pending,1);
    const next=stepModel(m,r.state,returned);
    assert.deepEqual(next.actions,[{type:'subscribe',resource:{id:'closing',generation:1}}]);
    assert.equal(next.state.sourceLive,true);
  }
});

test('S22 WINDOWWHEN MODEL: source completion closes current child before outer, no extra window', () => {
  const m = createWindowWhenModel();
  const r=execute(m,[subscribe,returned,attach('A',0),source('x'),{type:'source.complete'}]);
  assert.deepEqual(r.actions.slice(-4),[child('A',{kind:'C'}),unsub('windowObserver:A'),
    {type:'notify',target:'downstream',notification:{kind:'C'}},unsub('source')].slice(0,4));
  assert.equal(r.state.phase,'Stopped'); assert.equal(r.state.windows.length,1);
});

test('S22 WINDOWWHEN MODEL: initial selector failure errors announced handle and outer result', () => {
  const m=createWindowWhenModel(),fault={};
  const r=execute(m,[subscribe,attach('A',0),{type:'callback.throw',error:fault}]);
  assert.deepEqual(r.actions.filter(a=>a.type==='notify'),[
    announce(0),child('A',{kind:'E',error:fault}),
    {type:'notify',target:'downstream',notification:{kind:'E',error:fault}},
  ]);
  assert.equal(r.state.reason,'error');
});

test('S22 WINDOWWHEN MODEL: outer cancel releases source+closing but leaves current Subject open and orphaned', () => {
  const m=createWindowWhenModel();
  const r=execute(m,[subscribe,returned,attach('A',0),{type:'cancel'},attach('late',0),
    detach('A'),detach('late')]);
  assert.equal(r.state.reason,'cancel');
  assert.equal(r.state.windows[0].status,'open');
  assert.deepEqual(r.state.consumers,[]);
  assert.deepEqual(r.actions.filter(a=>a.type==='notify' && a.target.startsWith('windowObserver:')),[]);
});

test('S22 SELECTOR MODELS: invalid stale closings and observer identities are rejected', () => {
  for (const m of [createWindowToggleModel(),createWindowWhenModel()]) {
    const ready=m.parameters.operator==='windowToggle' ?
      execute(m,[subscribe,open('v'),returned]).state : execute(m,[subscribe,returned]).state;
    for (const event of [closer('closing.next',3),closer('closing.complete',3),
      {type:'closing.error',windowId:3,error:'E'},attach('',0),detach('missing')])
      assert.throws(()=>stepModel(m,ready,event));
  }
});

test('S22 SELECTOR MODELS: immutable nested state and distinct per-window consumer registries', () => {
  const m=createWindowToggleModel();
  const raw=execute(m,[subscribe,open('v'),returned,attach('A',0)]).state;
  const state=Object.freeze({...raw,windows:Object.freeze(raw.windows.map(Object.freeze)),
    consumers:Object.freeze(raw.consumers.map(Object.freeze)),usedObservers:Object.freeze(raw.usedObservers)});
  const r=stepModel(m,state,source('v'));
  assert.deepEqual(state.windows[0],raw.windows[0]);
  assert.equal(r.state.phase,'Active');assert.deepEqual(r.actions,[child('A',{kind:'N',value:'v'})]);
});

test('S22 SELECTOR MODELS: four canonical histories replay to finished input', () => {
  for (const [m,events] of [
    [createWindowToggleModel(),windowToggleExample],
    [createWindowToggleModel(),windowToggleCompleteExample],
    [createWindowWhenModel(),windowWhenExample],
    [createWindowWhenModel(),windowWhenCompleteExample],
  ]) {
    const trace=runTrace(m,events,{executionId:'s22-selector'});
    assert.equal(trace.status,'finished-input');
    assert.equal(trace.state.phase,'Stopped');
  }
});

test('S22 SELECTOR MODELS: reachable rule obligations cover subscription, selector outcomes, closing policies and both terminals', () => {
  const toggle=createWindowToggleModel();
  const paths=[
    [subscribe,open('a'),returned,attach('A',0),source('v'),closer('closing.next',0),
      attach('late',0),{type:'source.complete'}],
    [subscribe,open('a'),returned,closer('closing.complete',0),{type:'openings.complete'},
      {type:'source.complete'}],
    [subscribe,open('a'),{type:'callback.throw',error:'E'}],
    [subscribe,open('a'),returned,{type:'closing.error',windowId:0,error:'E'}],
    [subscribe,{type:'openings.error',error:'E'}],
    [subscribe,open('a'),returned,{type:'source.error',error:'E'}],
    [subscribe,open('a'),returned,attach('A',0),{type:'cancel'},detach('A')],
    [subscribe,open('a'),{type:'cancel'}],
  ];
  const witnessed=new Set(paths.flatMap(events=>execute(toggle,events).rules));
  const required=['START','OPENINGS-NEXT','OPENINGS-COMPLETE','OPENINGS-ERROR','SELECTOR-RETURN','SELECTOR-THROW','SOURCE-NEXT','CLOSING-NEXT','CLOSING-COMPLETE','CLOSING-ERROR','CANCEL-ACTIVE','CANCEL-SELECTING','SOURCE-COMPLETE','SOURCE-ERROR'];
  for (const name of required)assert.ok(witnessed.has('S22-WINDOWTOGGLE-'+name),name);
  const when=createWindowWhenModel();
  const wpaths=[
    [subscribe,attach('A',0),returned,source('x'),closer('closing.next',0),returned,{type:'source.complete'}],
    [subscribe,returned,closer('closing.complete',0),returned,{type:'cancel'}],
    [subscribe,{type:'callback.throw',error:'E'}],
    [subscribe,returned,{type:'closing.error',windowId:0,error:'E'}],
    [subscribe,returned,{type:'source.error',error:'E'}],
    [subscribe,{type:'cancel'}],
  ];
  const ww=new Set(wpaths.flatMap(events=>execute(when,events).rules));
  for (const name of ['START','SELECTOR-RETURN','SELECTOR-THROW','SOURCE-NEXT','CLOSING-NEXT','CLOSING-COMPLETE',
    'CLOSING-ERROR','CANCEL-ACTIVE','CANCEL-SELECTING','SOURCE-COMPLETE','SOURCE-ERROR'])
    assert.ok(ww.has('S22-WINDOWWHEN-'+name),name);
});
