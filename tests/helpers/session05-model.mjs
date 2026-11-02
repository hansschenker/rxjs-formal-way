import { stepModel } from '../../dist/index.js';

export const notifierRef = Object.freeze({ id: 'notifier', generation: 0 });
export const fault = Object.freeze({ problem: 'session05-test-error' });
export const at = (time, type, fields = {}) => ({ time, event: { type, ...(type.startsWith('notifier.') ? { resource: notifierRef } : {}), ...fields } });
export function actionLog(action, time) {
  if (action.type === 'notify') {
    const n = action.notification;
    return n.kind === 'N' ? [time, 'N', n.value] : n.kind === 'E' ? [time, 'E', n.error] : [time, 'C'];
  }
  if (action.type === 'invoke-callback') return [time, 'call', action.resource.id, action.index, action.value];
  return [time, action.type, action.resource.id, action.resource.generation];
}

/** Predictions use pure rules. User-function outcomes are supplied only at the test-driver boundary. */
export function driveUnary(model, inputs, predicate = () => true) {
  let state = model.initialState();
  const log = [], rules = new Set();
  const dispatch = (event, time) => {
    const result = stepModel(model, state, event);
    state = result.state;
    rules.add(result.ruleId);
    for (const action of result.actions) {
      log.push(actionLog(action, time));
      if (action.type === 'invoke-callback') {
        let outcome;
        try { outcome = { type: 'callback.return', resource: action.resource, value: predicate(action.value, action.index) }; }
        catch (error) { outcome = { type: 'callback.throw', resource: action.resource, error }; }
        // Do not catch model errors and misreport them as predicate exceptions.
        dispatch(outcome, time);
      }
    }
  };
  dispatch({ type: 'subscribe' }, 0);
  for (const { time, event } of inputs) {
    // Closed Subscriber producer attempts do not become legal model input notifications.
    if (state.phase !== 'Closed') dispatch(event, time);
  }
  return { state, log, rules };
}

export function driveUntil(model, inputs, initialNotifier = null) {
  let state = model.initialState();
  const log = [], rules = new Set();
  const dispatch = (event, time) => {
    const result = stepModel(model, state, event);
    state = result.state;
    rules.add(result.ruleId);
    log.push(...result.actions.map(a => actionLog(a, time)));
  };
  dispatch({ type: 'subscribe' }, 0);
  if (initialNotifier) dispatch(initialNotifier, 0);
  if (state.phase === 'Starting' || state.phase === 'StoppedBeforeSource') dispatch({ type: 'setup.ready' }, 0);
  for (const { time, event } of inputs) {
    if (state.phase === 'Closed') continue;
    if (event.type.startsWith('notifier.') && !state.notifierLive) continue;
    dispatch(event, time);
  }
  return { state, log, rules };
}

/** External schedules, enumerated without consulting any model or its expected output. */
export function unaryWords(depth = 4) {
  const words = [];
  const visit = word => {
    words.push(word);
    if (word.length === depth || ['C', 'E', 'X'].includes(word.at(-1))) return;
    for (const token of [0, 1, 2, 'C', 'E', 'X']) visit([...word, token]);
  };
  visit([]);
  return words;
}
export function untilWords(operator, depth = 4) {
  const words = [];
  const visit = (word, notifierLive = true, stopped = false) => {
    words.push(word);
    if (word.length === depth || stopped) return;
    for (const token of [0, 1, 'C', 'E', 'X', ...(notifierLive ? ['n', 'c', 'e'] : [])]) {
      visit([...word, token], notifierLive && !['n', 'c', 'e'].includes(token),
        ['C', 'E', 'X', 'e'].includes(token) || (operator === 'takeUntil' && token === 'n'));
    }
  };
  visit([]);
  return words;
}
export function scheduleWord(word, ties = false) {
  return word.map((token, index) => {
    const time = ties ? 1 + Math.floor(index / 2) : index + 1;
    if (typeof token === 'number') return at(time, 'source.next', { value: token });
    if (token === 'C') return at(time, 'source.complete');
    if (token === 'E') return at(time, 'source.error', { error: fault });
    if (token === 'X') return at(time, 'cancel');
    if (token === 'n') return at(time, 'notifier.next', { value: false });
    if (token === 'c') return at(time, 'notifier.complete');
    if (token === 'e') return at(time, 'notifier.error', { error: fault });
    throw new Error(`Unknown word token ${token}`);
  });
}
