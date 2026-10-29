import { stepModel } from '../../dist/runner.js';

/** Test commands use logical step time. They are not a production subscription interpreter. */
export function observeShareModel(model, commands) {
  let state = model.initialState(), connection = null, id = 0, time = 0;
  const observations = [], ruleIds = new Set();
  function dispatch(event) {
    const result = stepModel(model, state, event); ruleIds.add(result.ruleId); state = result.state;
    for (const action of result.actions) {
      if (action.type === 'notify') observations.push({ time, target: action.target, ...action.notification });
      else if (action.type === 'subscribe') {
        if (connection) throw new Error('two source connections');
        connection = action.resource; observations.push({ time, kind: 'subscribe', ...connection });
      } else if (action.type === 'unsubscribe') {
        if (!connection || connection.generation !== action.resource.generation) throw new Error('unknown source release');
        observations.push({ time, kind: 'unsubscribe', ...connection }); connection = null;
      } else throw new Error(`unexpected share action ${action.type}`);
    }
  }
  const leave = () => {
    if (state.phase === 'Connected' && state.subscribers.length) dispatch({ type: 'subscriber.unsubscribe', subscriber: state.subscribers[0] });
  };
  for (const command of commands) {
    time++;
    if (command === 'join') dispatch({ type: 'subscriber.subscribe', subscriber: `s${id++}` });
    else if (command === 'leave') leave();
    else if (connection) dispatch(command === 'next' ? { type: 'source.next', resource: connection, value: time }
      : command === 'error' ? { type: 'source.error', resource: connection, error: 'source-fault' } : { type: 'source.complete', resource: connection });
  }
  // Explicit end-of-test external cleanup, not an invented automatic share lifecycle.
  time++;
  while (state.phase === 'Connected' && state.subscribers.length) leave();
  if (connection) dispatch({ type: 'source.complete', resource: connection });
  return { observations, ruleIds, state, connected: connection !== null };
}
