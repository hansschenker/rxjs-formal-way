import { stepModel } from '../../dist/runner.js';

/** Finite test environment, not an RxJS operator or a general effect interpreter. */
export function observeFlattenModel(model, outerEvents, project) {
  const observations = [], ruleIds = new Set(), jobs = [], live = new Map();
  let state = model.initialState(), time = 0, sequence = 0;
  const key = r => `${r.id}#${r.generation}`;
  const enqueue = (at, work) => jobs.push({ time: at, sequence: sequence++, work });
  const log = entry => observations.push({ time, ...entry });
  function dispatch(event) {
    const result = stepModel(model, state, event);
    ruleIds.add(result.ruleId); state = result.state;
    for (const action of result.actions) {
      if (action.type === 'invoke-callback') {
        log({ kind: 'project', value: action.value, index: action.index });
        // Only business execution is caught. Model failures and fixture errors must escape.
        let outcome;
        try { outcome = { type: 'callback.return', resource: action.resource, value: project(action.value, action.index) }; }
        catch (error) { outcome = { type: 'callback.throw', resource: action.resource, error }; }
        dispatch(outcome);
      } else if (action.type === 'notify') log(action.notification);
      else if (action.type === 'unsubscribe') {
        if (!live.delete(key(action.resource))) throw new Error(`double/unknown release ${key(action.resource)}`);
        log({ kind: 'unsubscribe', ...action.resource });
      } else if (action.type === 'subscribe') {
        if (live.has(key(action.resource))) throw new Error('duplicate acquisition');
        live.set(key(action.resource), true); log({ kind: 'subscribe', ...action.resource });
        if (action.resource.id === 'inner') {
          const binding = state.active.find(x => key(x.resource) === key(action.resource));
          if (!binding || !Array.isArray(binding.source.events)) throw new Error('invalid test source binding');
          for (const input of binding.source.events) enqueue(time + input.delay, () => {
            if (!live.has(key(action.resource)) || state.phase === 'Closed') return;
            dispatch(input.kind === 'N' ? { type: 'inner.next', resource: action.resource, value: input.value }
              : input.kind === 'E' ? { type: 'inner.error', resource: action.resource, error: input.error }
              : { type: 'inner.complete', resource: action.resource });
          });
        }
      } else throw new Error(`unsupported test action ${action.type}`);
    }
  }
  dispatch({ type: 'subscribe' });
  for (const input of outerEvents) enqueue(input.time, () => {
    if (state.phase === 'Closed') return;
    if (input.kind === 'cancel') dispatch({ type: 'cancel' });
    else if (live.has('outer#0')) dispatch(input.kind === 'N' ? { type: 'outer.next', value: input.value }
      : input.kind === 'E' ? { type: 'outer.error', error: input.error } : { type: 'outer.complete' });
  });
  let steps = 0;
  while (jobs.length) {
    if (++steps > 10000) throw new Error('test environment step budget exhausted');
    jobs.sort((a, b) => a.time - b.time || a.sequence - b.sequence);
    const job = jobs.shift(); time = job.time; job.work();
  }
  return { observations, ruleIds, state, closed: state.phase === 'Closed', live: live.size };
}

export function words(alphabet, maxLength) {
  const result = [[]]; let layer = [[]];
  for (let n = 1; n <= maxLength; n++) {
    layer = layer.flatMap(xs => alphabet.map(x => [...xs, x])); result.push(...layer);
  }
  return result;
}
