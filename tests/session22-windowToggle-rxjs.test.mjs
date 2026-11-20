import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY, NEVER, Observable, ObjectUnsubscribedError, Subject, of, windowToggle } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

/** Native-only recorder with literal expectations; no model code is imported. */
const native = (options = {}) => {
  const log = [], handles = [], closing = [], children = new Map();
  let source, opening, calls = 0;
  const input = (name, capture, mode) => new Observable(s => {
    log.push(['subscribe', name]); capture(s);
    if (mode === 'empty') s.complete();
    if (mode === 'next') s.next('control');
    return () => log.push(['unsubscribe', name]);
  });
  const source$ = input('source', s => { source = s; });
  const opening$ = input('opening', s => { opening = s; });
  const result = source$.pipe(windowToggle(opening$, value => {
    const id = calls++; log.push(['selector', id, value]);
    if (options.throwAt === id) throw options.error;
    if (options.invalidAt === id) return null;
    return input('closing:' + id, s => { closing[id] = s; }, options.closingMode);
  }));
  const outer = result.subscribe({ next: h => { handles.push(h); log.push(['window', handles.length - 1]); },
    complete: () => log.push(['complete', 'outer']), error: e => log.push(['error', 'outer', e]) });
  const attach = (id, name = 'A') => {
    log.push(['subscribe', name]);
    const child = handles[id].subscribe({ next: v => log.push(['next', name, v]),
      complete: () => log.push(['complete', name]), error: e => log.push(['error', name, e]) });
    child.add(() => log.push(['unsubscribe', name])); children.set(name, child); return child;
  };
  return { source, opening, closing, handles, children, outer, log, attach };
};

test('S22 TOGGLE RX: construction is inert; opening acquisition precedes source with no initial handle', () => {
  let acquisitions = 0;
  const input = new Observable(() => { acquisitions++; });
  const description = input.pipe(windowToggle(input, () => NEVER));
  assert.equal(acquisitions, 0);
  const sub = description.subscribe(); assert.equal(acquisitions, 2); sub.unsubscribe();
  const h = native(); assert.deepEqual(h.log, [['subscribe','opening'],['subscribe','source']]);
  h.outer.unsubscribe();
});

test('S22 TOGGLE RX: selector sees exact opening value before handle and closing acquisition', () => {
  const value = Object.freeze({ opaque: 'opening' }); const h = native();
  h.opening.next(value);
  assert.deepEqual(h.log.slice(2), [['selector',0,value],['window',0],['subscribe','closing:0']]);
  assert.equal(h.log[2][2], value); assert.equal(h.handles[0] instanceof Subject, false);
  h.outer.unsubscribe();
});

test('S22 TOGGLE RX: source drops values with no windows, then multicasts identical references without replay', () => {
  const value = {}; const h = native(); h.source.next('before'); h.opening.next('A'); h.source.next('missed');
  h.attach(0, 'A'); h.attach(0, 'B'); h.opening.next('B'); h.attach(1, 'C'); h.source.next(value);
  assert.deepEqual(h.log.filter(x => x[0] === 'next'), [['next','A',value],['next','B',value],['next','C',value]]);
  for (const x of h.log.filter(x => x[0] === 'next')) assert.equal(x[2], value);
  h.outer.unsubscribe(); for (const s of h.children.values()) s.unsubscribe();
});

test('S22 TOGGLE RX: closing next completes only its window before closing teardown', () => {
  const h = native(); h.opening.next(0); h.attach(0,'A'); h.opening.next(1); h.attach(1,'B');
  const i = h.log.length; h.closing[0].next('not-a-value'); h.source.next('live');
  assert.deepEqual(h.log.slice(i), [['complete','A'],['unsubscribe','A'],['unsubscribe','closing:0'],['next','B','live']]);
  assert.equal(h.outer.closed, false); h.outer.unsubscribe(); h.children.get('B').unsubscribe();
});

test('S22 TOGGLE RX: empty closing completion leaves its window open', () => {
  const h = native(); h.opening.next(0); h.attach(0); const i = h.log.length;
  h.closing[0].complete(); h.source.next(undefined);
  assert.deepEqual(h.log.slice(i), [['unsubscribe','closing:0'],['next','A',undefined]]);
  assert.equal(h.children.get('A').closed, false); h.source.complete();
});

test('S22 TOGGLE RX: opening completion releases only opening and existing closings keep working', () => {
  const h = native(); h.opening.next(0); h.attach(0); const i = h.log.length;
  h.opening.complete(); h.source.next(null); h.closing[0].next('close');
  assert.deepEqual(h.log.slice(i), [['unsubscribe','opening'],['next','A',null],['complete','A'],['unsubscribe','A'],['unsubscribe','closing:0']]);
  assert.equal(h.source.closed, false); assert.equal(h.outer.closed, false); h.source.complete();
});

test('S22 TOGGLE RX: source completes children before outer and ownership teardown', () => {
  const h = native(); h.opening.next(0); h.attach(0,'A'); h.opening.next(1); h.attach(1,'B'); const i = h.log.length;
  h.source.complete();
  assert.deepEqual(h.log.slice(i), [['complete','A'],['unsubscribe','A'],['complete','B'],['unsubscribe','B'],
    ['complete','outer'],['unsubscribe','opening'],['unsubscribe','source'],['unsubscribe','closing:0'],['unsubscribe','closing:1']]);
  h.attach(0,'late'); assert.deepEqual(h.log.slice(-3), [['subscribe','late'],['complete','late'],['unsubscribe','late']]);
});

for (const faultSource of ['source', 'closing']) test(`S22 TOGGLE RX: ${faultSource} error reaches children before outer and remains available to late observers`, () => {
  const error = {}; const h = native(); h.opening.next(0); h.attach(0); const i = h.log.length;
  (faultSource === 'source' ? h.source : h.closing[0]).error(error);
  assert.deepEqual(h.log.slice(i), [['error','A',error],['unsubscribe','A'],['error','outer',error],
    ['unsubscribe','opening'],['unsubscribe','source'],['unsubscribe','closing:0']]);
  h.attach(0,'late'); assert.deepEqual(h.log.slice(-3), [['subscribe','late'],['error','late',error],['unsubscribe','late']]);
  assert.equal(h.log.at(-2)[2], error);
});

test('S22 TOGGLE RX: selector throw errors existing windows without announcing the failed window', () => {
  const error = {}; const h = native({ throwAt: 1, error }); h.opening.next('first'); h.attach(0);
  const i = h.log.length; h.opening.next('bad');
  assert.deepEqual(h.log.slice(i), [['selector',1,'bad'],['error','A',error],['unsubscribe','A'],['error','outer',error],
    ['unsubscribe','opening'],['unsubscribe','source'],['unsubscribe','closing:0']]);
  assert.equal(h.handles.length, 1); assert.equal(h.closing.length, 1);
});

test('S22 TOGGLE RX: opening error errors only outer and disposes active handles without terminating children', () => {
  const error = {}; const h = native(); h.opening.next(0); const child = h.attach(0); const i = h.log.length;
  h.opening.error(error);
  assert.deepEqual(h.log.slice(i), [['error','outer',error],['unsubscribe','opening'],['unsubscribe','source'],['unsubscribe','closing:0']]);
  assert.equal(child.closed, false);
  assert.throws(() => h.handles[0].subscribe({ error: () => assert.fail('not delivered through error') }), ObjectUnsubscribedError);
  child.unsubscribe(); assert.deepEqual(h.log.at(-1), ['unsubscribe','A']);
});

test('S22 TOGGLE RX: outer cancellation disposes active handles while old completed handles survive', () => {
  const h = native(); h.opening.next(0); h.attach(0,'A'); h.closing[0].next(null);
  h.opening.next(1); const child = h.attach(1,'B'); const i = h.log.length; h.outer.unsubscribe();
  assert.deepEqual(h.log.slice(i), [['unsubscribe','opening'],['unsubscribe','source'],['unsubscribe','closing:1']]);
  assert.equal(child.closed, false); assert.throws(() => h.handles[1].subscribe(), ObjectUnsubscribedError);
  h.attach(0,'late'); assert.deepEqual(h.log.slice(-3), [['subscribe','late'],['complete','late'],['unsubscribe','late']]);
  child.unsubscribe();
});

test('S22 TOGGLE RX: child cancellation releases no source, opening, sibling or closing subscription', () => {
  const h = native(); h.opening.next(0); const a = h.attach(0,'A'); h.attach(0,'B'); const i = h.log.length;
  a.unsubscribe(); h.source.next('x');
  assert.deepEqual(h.log.slice(i), [['unsubscribe','A'],['next','B','x']]);
  h.source.complete();
});

test('S22 TOGGLE RX: repeated selector results can share one signal with independent closing subscriptions', () => {
  const source = new Subject(), opening = new Subject(), signal = new Subject(), log = [], children = [];
  const outer = source.pipe(windowToggle(opening, () => signal)).subscribe(w => children.push(w.subscribe({ next: v => log.push(v), complete: () => log.push('closed') })));
  opening.next(0); opening.next(1); source.next('x'); signal.next('control'); source.next('lost');
  assert.deepEqual(log, ['x','x','closed','closed']); assert.ok(children.every(x => x.closed)); outer.unsubscribe();
});

test('S22 TOGGLE RX: synchronous EMPTY closing leaves window live while synchronous next closes it', () => {
  const a = native({ closingMode: 'empty' }); a.opening.next(0); a.attach(0); a.source.next('x');
  assert.deepEqual(a.log.slice(-2), [['subscribe','A'],['next','A','x']]); a.source.complete();
  const b = native({ closingMode: 'next' }); b.opening.next(0); b.attach(0);
  assert.deepEqual(b.log.slice(-3), [['subscribe','A'],['complete','A'],['unsubscribe','A']]); b.outer.unsubscribe();
});

test('S22 TOGGLE RX: invalid selector return is caught before handle announcement', () => {
  const h = native({ invalidAt: 0 }); h.opening.next(0);
  assert.equal(h.handles.length, 0); assert.equal(h.outer.closed, true);
  assert.ok(h.log.find(x => x[0] === 'error')[2] instanceof TypeError);
});

test('S22 TOGGLE RX: synchronous opening error still attempts source setup with a closed subscriber', () => {
  const error = {}, log = [];
  const source = new Observable(s => { log.push(['source', s.closed]); return () => log.push('source-release'); });
  const opening = new Observable(s => { log.push('opening'); s.error(error); return () => log.push('opening-release'); });
  source.pipe(windowToggle(opening, () => EMPTY)).subscribe({ error: e => log.push(['error', e]) });
  assert.deepEqual(log, ['opening',['error',error],'opening-release',['source',true],'source-release']);
});

test('S22 TOGGLE RX: synchronous source completion closes a setup-time opening window', () => {
  const log = [];
  of('x').pipe(windowToggle(of('open'), () => NEVER)).subscribe({ next: w => w.subscribe({ next: v => log.push(v), complete: () => log.push('child-complete') }), complete: () => log.push('outer-complete') });
  assert.deepEqual(log, ['x','child-complete','outer-complete']);
});

test('S22 TOGGLE RX: supplied scheduler fixes same-frame source-before-closing order and exact lifetimes', () => {
  const ts = new TestScheduler((a, b) => assert.deepEqual(a, b));
  ts.run(({ cold, expectSubscriptions }) => {
    const source = cold('--a-b-c-d-|'), opening = cold('-o---o---|'), closing = cold('---x|'), log = [];
    let id = 0;
    source.pipe(windowToggle(opening, () => closing)).subscribe({
      next: w => { const n = id++; log.push([ts.now(),'window',n]); w.subscribe({ next: v => log.push([ts.now(),n,v]), complete: () => log.push([ts.now(),n,'C']) }); },
      complete: () => log.push([ts.now(),'outer','C']),
    });
    expectSubscriptions(source.subscriptions).toBe('^---------!');
    expectSubscriptions(opening.subscriptions).toBe('^--------!');
    expectSubscriptions(closing.subscriptions).toBe(['-^--!','-----^--!']);
    ts.flush();
    assert.deepEqual(log, [[1,'window',0],[2,0,'a'],[4,0,'b'],[4,0,'C'],[5,'window',1],[6,1,'c'],[8,1,'d'],[8,1,'C'],[10,'outer','C']]);
  });
});
