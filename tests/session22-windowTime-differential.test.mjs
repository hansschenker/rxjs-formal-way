import test from 'node:test';
import assert from 'node:assert/strict';
import { Observable, Subscription, windowTime } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { createWindowTimeModel, runWindowTimeTrace } from '../dist/models/session22-windowTime.js';

const payload = Object.freeze({ opaque: 'source-value' }), fault = Object.freeze({ opaque: 'source-error' });
const resource = (id, generation = 0) => ({ id, generation });

// Execute RxJS first. Only native handles, native subscriptions and actual scheduler
// callbacks determine the recorded inputs. The canonical model is not consulted here.
function nativeRun(config, times, ending, childCount, enqueueOrder, measured) {
  const scheduler = new TestScheduler((a, b) => assert.deepEqual(a, b));
  const inputs = [], actual = [], handles = [], consumers = new Map();
  let sink, outer, serial = 0, scheduleCount = 0;
  const write = action => actual.push({ time: scheduler.frame, action });
  const add = event => inputs.push({ time: scheduler.frame, event: { ...event, now: scheduler.frame } });
  const notify = (target, notification) => write({ type: 'notify', target, notification });
  const attach = windowId => {
    const observerId = 'o' + serial++, target = 'windowObserver:' + observerId;
    add({ type: 'window.subscribe', windowId, observerId });
    write({ type: 'subscribe', resource: resource(target) });
    const sub = handles[windowId].subscribe({ next: value => notify(target, { kind: 'N', value }),
      error: error => notify(target, { kind: 'E', error }), complete: () => notify(target, { kind: 'C' }) });
    sub.add(() => write({ type: 'unsubscribe', resource: resource(target) }));
    consumers.set(observerId, sub);
  };
  const detach = id => { add({ type: 'window.unsubscribe', observerId: id }); consumers.get(id).unsubscribe(); };
  const observedScheduler = {
    now: () => scheduler.now(),
    schedule(work, delay = 0, state) {
      const recurring = config[1] !== null && scheduleCount++ === 0;
      const ref = recurring ? resource('windowCreation') : resource('windowClose', handles.length - 1);
      const wrapper = new Subscription(); let task, tick = 0;
      const enqueue = (value, wait) => {
        write({ type: 'schedule', resource: ref, delay: wait });
        task = scheduler.schedule(() => {
          add(recurring ? { type: 'timer.creation', resource: ref, tick: tick++ } : { type: 'timer.window', resource: ref });
          work.call(wrapper, value);
        }, wait);
        return wrapper;
      };
      wrapper.schedule = (value, wait = 0) => enqueue(value, wait);
      wrapper.add(() => { write({ type: 'cancel-timer', resource: ref }); task.unsubscribe(); });
      return enqueue(state, delay);
    },
  };
  const source = new Observable(s => {
    sink = s; write({ type: 'subscribe', resource: resource('source') });
    return () => write({ type: 'unsubscribe', resource: resource('source') });
  });
  const queueCommands = () => {
    times.forEach((time, i) => scheduler.schedule(() => {
      if (!sink.closed) { const value = [undefined, payload, null][i % 3]; add({ type: 'source.next', value }); sink.next(value); }
    }, time));
    scheduler.schedule(() => { if (!outer.closed) attach(handles.length - 1); }, 3);
    scheduler.schedule(() => { const first = [...consumers].find(([, sub]) => !sub.closed); if (first) detach(first[0]); }, 5);
    scheduler.schedule(() => {
      if (ending === 'X') { add({ type: 'cancel' }); outer.unsubscribe(); }
      else if (ending === 'E') { add({ type: 'source.error', error: fault }); sink.error(fault); }
      else { add({ type: 'source.complete' }); sink.complete(); }
    }, 8);
  };
  scheduler.schedule(() => {
    add({ type: 'subscribe' });
    outer = source.pipe(windowTime(config[0], config[1], config[2] ?? Infinity, measured ? observedScheduler : scheduler)).subscribe({
      next: handle => {
        const windowId = handles.length; handles.push(handle); notify('downstream', { kind: 'N', value: { windowId } });
        for (let i = 0; i < childCount; i++) scheduler.schedule(() => attach(windowId), 0);
      }, error: error => notify('downstream', { kind: 'E', error }), complete: () => notify('downstream', { kind: 'C' }),
    });
    if (enqueueOrder === 'after-connect') queueCommands();
  }, 0);
  if (enqueueOrder === 'prequeued') queueCommands();
  scheduler.schedule(() => { for (let id = 0; id < handles.length; id++) attach(id); }, 9);
  scheduler.schedule(() => { for (const [id, sub] of consumers) if (!sub.closed) detach(id); }, 10);
  scheduler.flush();
  assert.equal(outer.closed, true); assert.equal(sink.closed, true);
  assert.ok([...consumers.values()].every(sub => sub.closed));
  return { actual, inputs };
}

test('S22 DIFF windowTime: 432 native-first executions compare window delivery, timer requests and subscription lifetimes', () => {
  const configs = [[2, null, null], [5, null, 2], [5, 2, 2], [2, 4, null], [3, 3, null], [5, 2, null]];
  const words = [[], [1, 2, 3], [1, 4, 5], [2, 2, 4]];
  let comparisons = 0;
  for (const config of configs) for (const times of words) for (const ending of ['C', 'E', 'X'])
    for (const children of [0, 1, 2]) for (const order of ['prequeued', 'after-connect']) {
      const native = nativeRun(config, times, ending, children, order, true);
      const plain = nativeRun(config, times, ending, children, order, false);
      const visible = log => log.filter(x => !['schedule', 'cancel-timer'].includes(x.action.type));
      assert.deepEqual(visible(native.actual), visible(plain.actual), 'Observation wrapper must preserve plain TestScheduler notifications and connection lifetimes');
      const trace = runWindowTimeTrace(createWindowTimeModel(...config), native.inputs, { executionId: 'windowTime-diff-' + comparisons });
      const predicted = trace.steps.flatMap(step => step.actions.map(action => ({ time: step.time, action })));
      assert.deepEqual(predicted, native.actual, JSON.stringify({ config, times, ending, children, order }));
      assert.equal(trace.state.phase, 'Stopped'); assert.deepEqual(trace.state.consumers, []);
      comparisons++;
    }
  assert.equal(comparisons, 432);
  console.log('SESSION22_WINDOWTIME_COMPARISONS', comparisons);
});
