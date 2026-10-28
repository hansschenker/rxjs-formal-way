import { Observable, Subscription, debounceTime } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import assert from 'node:assert/strict';

/** Test-only instrumented SchedulerLike; separate native-clock comparisons check transparency. */
function trackedScheduler(clock, observations, lateBy) {
  let nextGeneration = 0;
  const live = new Set();
  return {
    now: () => clock.now(),
    live,
    schedule(work, delay = 0, initial) {
      const action = new Subscription();
      let pending, generation;
      live.add(action);
      action.add(() => {
        observations.push({ time: clock.now(), kind: 'timer.cancel', generation });
        live.delete(action);
      });
      action.schedule = (state, wait = 0) => {
        if (action.closed) throw new Error('cannot schedule closed test action');
        pending?.unsubscribe();
        generation = nextGeneration++;
        const current = generation;
        observations.push({ time: clock.now(), kind: 'timer.schedule', generation: current, delay: wait });
        pending = clock.schedule(() => {
          if (action.closed) return;
          observations.push({ time: clock.now(), kind: 'timer.fire', generation: current });
          work.call(action, state);
        }, wait + lateBy(current));
        action.add(pending);
        return action;
      };
      return action.schedule(initial, delay);
    },
  };
}

export function observeDebounceRx(dueTime, events, { insertion = 'eager', lateBy = () => 0, trackTimers = true } = {}) {
  const clock = new TestScheduler((a, b) => assert.deepEqual(a, b));
  const observations = [];
  const scheduler = trackTimers ? trackedScheduler(clock, observations, lateBy) : clock;
  let sink;
  const source = new Observable(subscriber => {
    sink = subscriber; observations.push({ time: clock.now(), kind: 'subscribe' });
    return () => observations.push({ time: clock.now(), kind: 'unsubscribe' });
  });
  const subscription = source.pipe(debounceTime(dueTime, scheduler)).subscribe({
    next: value => observations.push({ time: clock.now(), kind: 'N', value }),
    error: error => observations.push({ time: clock.now(), kind: 'E', error }),
    complete: () => observations.push({ time: clock.now(), kind: 'C' }),
  });
  function scheduleInput(index) {
    if (index >= events.length) return;
    const event = events[index];
    clock.schedule(() => {
      if (subscription.closed) return;
      switch (event.type) {
        case 'source.next': sink.next(event.value); break;
        case 'source.complete': sink.complete(); break;
        case 'source.error': sink.error(event.error); break;
        case 'cancel': subscription.unsubscribe(); break;
        default: throw new Error(`unknown input: ${event.type}`);
      }
      if (insertion === 'chained' && !subscription.closed) scheduleInput(index + 1);
    }, event.time - clock.now());
  }
  if (insertion === 'eager') events.forEach((_event, i) => scheduleInput(i)); else scheduleInput(0);
  clock.flush();
  return { observations, closed: subscription.closed, liveTimers: trackTimers ? scheduler.live.size : undefined };
}
