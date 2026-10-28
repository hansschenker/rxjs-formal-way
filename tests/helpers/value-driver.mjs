import { stepModel } from '../../dist/index.js';

/** Test-only adapter. Not an RxJS operator, scheduler, or universal effect interpreter. */
export function observeModel(model, callback, values, ending = 'complete', simultaneous = false) {
  const observations = [];
  const rules = new Set();
  let state = model.initialState();
  function dispatch(event, time) {
    const result = stepModel(model, state, event);
    rules.add(result.ruleId);
    state = result.state;
    for (const action of result.actions) {
      if (action.type === 'invoke-callback') {
        observations.push({ time, kind: 'call', value: action.value, index: action.index });
        // Catch only the supplied callback: model/validator/assertion failures must escape.
        let outcome;
        try { outcome = { type: 'callback.return', resource: action.resource, value: callback(action.value, action.index) }; }
        catch (error) { outcome = { type: 'callback.throw', resource: action.resource, error }; }
        dispatch(outcome, time);
      } else if (action.type === 'notify') {
        observations.push({ time, ...action.notification });
      } else if (action.type === 'subscribe' || action.type === 'unsubscribe') {
        observations.push({ time, kind: action.type });
      } else throw new Error(`Unsupported test-driver action: ${action.type}`);
    }
  }
  dispatch({ type: 'subscribe' }, 0);
  for (const [index, value] of values.entries()) {
    if (state.phase === 'Closed') break;
    dispatch({ type: 'source.next', value }, simultaneous ? 1 : index + 1);
  }
  if (state.phase !== 'Closed') {
    const time = simultaneous ? 1 : values.length + 1;
    dispatch(ending === 'cancel' ? { type: 'cancel' } : ending === 'error' ? { type: 'source.error', error: 'source-fault' } : { type: 'source.complete' }, time);
  }
  return { observations, rules, state };
}

export function words(alphabet, maxLength) {
  const all = [[]]; let layer = [[]];
  for (let length = 1; length <= maxLength; length++) {
    layer = layer.flatMap(prefix => alphabet.map(value => [...prefix, value]));
    all.push(...layer);
  }
  return all;
}
