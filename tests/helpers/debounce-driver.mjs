import { stepModel } from '../../dist/runner.js';

/** Independent finite priority-queue simulator for this profile, not an RxJS operator. */
export function observeDebounceModel(model, events, { insertion = 'eager', lateBy = () => 0 } = {}) {
  if (!['eager', 'chained'].includes(insertion)) throw new Error('unknown insertion policy');
  let state = model.initialState(), order = 0, activeTimer = null, now = 0, steps = 0;
  const queue = [], observations = [], rules = new Set();
  const enqueue = (time, kind, data) => queue.push({ time, order: order++, kind, data });
  function dispatch(event) {
    const result = stepModel(model, state, event);
    rules.add(result.ruleId); state = result.state;
    for (const action of result.actions) {
      if (action.type === 'schedule') {
        const generation = action.resource.generation;
        observations.push({ time: now, kind: 'timer.schedule', generation, delay: action.delay });
        activeTimer = generation;
        enqueue(now + action.delay + lateBy(generation), 'timer', action.resource);
      } else if (action.type === 'cancel-timer') {
        if (activeTimer !== action.resource.generation) throw new Error('release of inactive timer');
        observations.push({ time: now, kind: 'timer.cancel', generation: activeTimer });
        activeTimer = null;
      } else if (action.type === 'notify') observations.push({ time: now, ...action.notification });
      else if (action.type === 'subscribe' || action.type === 'unsubscribe') observations.push({ time: now, kind: action.type });
      else throw new Error(`Unsupported temporal test-driver action: ${action.type}`);
    }
  }
  dispatch({ type: 'subscribe', now: 0 });
  const enqueueExternal = i => { if (i < events.length) enqueue(events[i].time, 'external', i); };
  if (insertion === 'eager') events.forEach((_e, i) => enqueueExternal(i)); else enqueueExternal(0);
  while (queue.length) {
    if (++steps > 10000) throw new Error('test scenario exceeded its finite step budget');
    queue.sort((a, b) => a.time - b.time || a.order - b.order);
    const job = queue.shift(); now = job.time;
    if (job.kind === 'timer') {
      if (activeTimer !== job.data.generation) continue;
      observations.push({ time: now, kind: 'timer.fire', generation: activeTimer });
      dispatch({ type: 'timer.fire', now, resource: job.data });
    } else {
      if (state.phase === 'Closed') continue; // Undeliverable source attempt, not a legal model input.
      const { time: _time, ...event } = events[job.data];
      dispatch({ ...event, now });
      if (insertion === 'chained' && state.phase !== 'Closed') enqueueExternal(job.data + 1);
    }
  }
  return { observations, rules, state, activeTimer };
}

export function binaryWords(maxLength) {
  const all = [[]]; let layer = [[]];
  for (let n = 1; n <= maxLength; n++) { layer = layer.flatMap(w => [0, 1].map(v => [...w, v])); all.push(...layer); }
  return all;
}
