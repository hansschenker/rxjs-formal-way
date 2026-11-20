import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, windowToggle } from 'rxjs';
import { createWindowToggleModel, runWindowToggleTrace } from '../dist/models/session22-windowToggle.js';

/** Native execution supplies inputs and observations first; model state never chooses native delivery. */
const observeNative = (observersPerOpening, commands, ending, payload, fault) => {
  const inputs = [], actual = [], handles = [], closings = [], children = new Map(), endedHandles = new Set();
  let source, opening, outer, now = 0, invocation = 0, observerSerial = 0, values = 0;
  const ref = (id, generation = 0) => ({ id, generation });
  const record = action => actual.push({ time: now, action });
  const subscribe = resource => record({ type: 'subscribe', resource });
  const unsubscribe = resource => record({ type: 'unsubscribe', resource });
  const notify = (target, notification) => record({ type: 'notify', target, notification });
  const accept = (event, operation) => { inputs.push({ time: now, event }); operation(); };
  const port = (resource, capture) => new Observable(s => { capture(s); subscribe(resource); return () => unsubscribe(resource); });
  const source$ = port(ref('source'), s => { source = s; });
  const opening$ = port(ref('opening'), s => { opening = s; });
  accept({ type: 'subscribe' }, () => {
    outer = source$.pipe(windowToggle(opening$, value => {
      const index = invocation++, resource = ref('closingSelector', index);
      record({ type: 'invoke-callback', resource, index, value });
      if (value === fault) {
        inputs.push({ time: now, event: { type: 'selector.throw', resource, error: fault } });
        throw fault;
      }
      inputs.push({ time: now, event: { type: 'selector.return', resource } });
      return port(ref('closing', index), s => { closings[index] = s; });
    })).subscribe({
      next: h => { const windowId = handles.length; handles.push(h); notify('downstream', { kind: 'N', value: { windowId } }); },
      error: error => notify('downstream', { kind: 'E', error }), complete: () => notify('downstream', { kind: 'C' }),
    });
  });
  const attach = windowId => {
    const observerId = 'o' + observerSerial++, resource = ref('windowObserver:' + observerId);
    accept({ type: 'window.subscribe', windowId, observerId }, () => {
      subscribe(resource);
      const child = handles[windowId].subscribe({
        next: value => notify(resource.id, { kind: 'N', value }),
        error: error => { endedHandles.add(windowId); notify(resource.id, { kind: 'E', error }); },
        complete: () => { endedHandles.add(windowId); notify(resource.id, { kind: 'C' }); },
      });
      child.add(() => unsubscribe(resource)); children.set(observerId, child);
    });
  };
  const open = value => {
    if (opening.closed) return;
    const count = handles.length;
    accept({ type: 'opening.next', value }, () => opening.next(value));
    if (handles.length > count && !outer.closed) for (let i = 0; i < observersPerOpening; i++) attach(handles.length - 1);
  };
  const closing = kind => {
    const id = closings.findIndex(s => !s.closed); if (id < 0) return;
    const event = { type: 'closing.' + kind, resource: ref('closing', id), ...(kind === 'error' ? { error: fault } : {}) };
    accept(event, () => kind === 'next' ? closings[id].next('ignored') : kind === 'complete' ? closings[id].complete() : closings[id].error(fault));
  };
  const dispatch = command => {
    if (command === 'open') open(payload);
    else if (command === 'next' && !source.closed) {
      const value = [payload, undefined, null][values++ % 3];
      accept({ type: 'source.next', value }, () => source.next(value));
    } else if (command === 'close.next') closing('next');
    else if (command === 'close.complete') closing('complete');
    else if (command === 'close.error') closing('error');
    else if (command === 'attach' && !outer.closed && handles.length) attach(handles.length - 1);
    else if (command === 'opening.complete' && !opening.closed) accept({ type: 'opening.complete' }, () => opening.complete());
    else if (command === 'opening.error' && !opening.closed) accept({ type: 'opening.error', error: fault }, () => opening.error(fault));
    else if (command === 'selector.throw') open(fault);
    else if (command === 'source.complete' && !source.closed) accept({ type: 'source.complete' }, () => source.complete());
    else if (command === 'source.error' && !source.closed) accept({ type: 'source.error', error: fault }, () => source.error(fault));
    else if (command === 'cancel' && !outer.closed) accept({ type: 'cancel' }, () => outer.unsubscribe());
  };
  open(payload);
  for (const [i, command] of commands.entries()) { now = i + 1; dispatch(command); }
  now = 4; dispatch(ending);
  now = 5; dispatch('cancel');
  now = 6; for (const [observerId, child] of children) if (!child.closed)
    accept({ type: 'window.unsubscribe', observerId }, () => child.unsubscribe());
  // A terminal notification was actually observed on these handles, so late attach is safe.
  now = 7; if (endedHandles.size) attach(endedHandles.values().next().value);
  assert.equal(outer.closed, true); assert.equal(source.closed, true); assert.equal(opening.closed, true);
  assert.ok(closings.every(s => s.closed)); assert.ok([...children.values()].every(s => s.closed));
  return { inputs, actual };
};

test('S22 DIFF windowToggle: 2592 native-first executions compare control, values, selector outcomes and resource lifetimes', () => {
  const alphabet = ['open', 'next', 'close.next', 'close.complete', 'attach', 'opening.complete'];
  const endings = ['source.complete', 'source.error', 'opening.error', 'close.error', 'selector.throw', 'cancel'];
  const payload = Object.freeze({ opaque: 'payload' }), fault = Object.freeze({ opaque: 'fault' });
  let comparisons = 0;
  for (const observers of [0, 1]) for (const a of alphabet) for (const b of alphabet) for (const c of alphabet) for (const ending of endings) {
    const { inputs, actual } = observeNative(observers, [a,b,c], ending, payload, fault);
    const trace = runWindowToggleTrace(createWindowToggleModel(), inputs, { executionId: 'toggle-diff-' + comparisons });
    const predicted = trace.steps.flatMap(step => step.actions.map(action => ({ time: step.time, action })));
    assert.deepEqual(predicted, actual, JSON.stringify({ observers, commands: [a,b,c], ending }));
    assert.equal(trace.state.phase, 'Stopped'); assert.deepEqual(trace.state.consumers, []);
    for (const { action } of actual) {
      if (action.type === 'notify' && action.notification.kind === 'E') assert.equal(action.notification.error, fault);
      if (action.type === 'notify' && action.notification.kind === 'N' && action.target !== 'downstream' && action.notification.value != null) assert.equal(action.notification.value, payload);
    }
    comparisons++;
  }
  assert.equal(comparisons, 2592); console.log('SESSION22_WINDOWTOGGLE_COMPARISONS', comparisons);
});
