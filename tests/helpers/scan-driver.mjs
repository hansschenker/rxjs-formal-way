import { stepModel } from '../../dist/runner.js';

/** Test-only synchronous callback adapter; no source subscription or timer is executed here. */
export function observeScanModel(model, reducer, values, ending = 'complete', simultaneous = false) {
  const observations = [];
  const rules = new Set();
  let state = model.initialState();
  function dispatch(event, time) {
    const result = stepModel(model, state, event);
    rules.add(result.ruleId);
    state = result.state;
    for (const action of result.actions) {
      if (action.type === 'invoke-callback') {
        const { accumulator, value } = action.value;
        observations.push({ time, kind: 'call', accumulator, value, index: action.index });
        // Only the reducer is caught: model/validator/assertion failures must escape.
        let outcome;
        try { outcome = { type: 'callback.return', resource: action.resource, value: reducer(accumulator, value, action.index) }; }
        catch (error) { outcome = { type: 'callback.throw', resource: action.resource, error }; }
        dispatch(outcome, time);
      } else if (action.type === 'notify') observations.push({ time, ...action.notification });
      else if (action.type === 'subscribe' || action.type === 'unsubscribe') observations.push({ time, kind: action.type });
      else throw new Error(`Unsupported scan-driver action: ${action.type}`);
    }
  }
  dispatch({ type: 'subscribe' }, 0);
  for (const [index, value] of values.entries()) {
    if (state.phase === 'Closed') break;
    dispatch({ type: 'source.next', value }, simultaneous ? 1 : index + 1);
  }
  if (state.phase !== 'Closed') {
    const event = ending === 'cancel' ? { type: 'cancel' } : ending === 'error'
      ? { type: 'source.error', error: 'source-fault' } : { type: 'source.complete' };
    dispatch(event, simultaneous ? 1 : values.length + 1);
  }
  return { observations, rules, state };
}
