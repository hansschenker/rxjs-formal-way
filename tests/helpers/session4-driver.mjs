import { Observable, Subject, distinctUntilChanged, distinctUntilKeyChanged, distinct, pairwise, startWith } from 'rxjs';
import { stepModel } from '../../dist/index.js';

const recordAction = (out, time, action) => {
  if (action.type === 'notify') {
    const n = action.notification;
    out.push(n.kind === 'N' ? { time, kind: 'N', value: n.value } :
      n.kind === 'E' ? { time, kind: 'E', error: n.error } : { time, kind: 'C' });
  } else if (action.type === 'subscribe' || action.type === 'unsubscribe') {
    out.push({ time, kind: action.type, resource: action.resource.id });
  }
};
const sourceEvent = word =>
  word.kind === 'N' ? { type: 'source.next', value: word.value } :
  word.kind === 'C' ? { type: 'source.complete' } :
  word.kind === 'E' ? { type: 'source.error', error: word.error } :
  word.kind === 'cancel' ? { type: 'cancel' } :
  word.kind === 'F' ? { type: 'flush.next' } :
  word.kind === 'FC' ? { type: 'flush.complete' } :
  word.kind === 'FE' ? { type: 'flush.error', error: word.error } : (() => { throw new Error('unknown word kind'); })();
const identityKey = (model, value, options) => model.parameters.operator === 'distinctUntilKeyChanged'
  ? value[model.parameters.property] :
    model.parameters.keyMode === 'selected' ? options.keySelector(value) : value;
const distinctKey = (model, value, options) => model.parameters.selected ? options.keySelector(value) : value;
const compare = (model, previous, current, options) =>
  model.parameters.compareMode === 'custom' ? options.comparator(previous, current) : previous === current;

export function observeSession4Model(model, words, options = {}) {
  let state = model.initialState();
  const observations = [], calls = [], rules = [];
  let now = 0;
  const step = event => {
    const reaction = stepModel(model, state, event);
    state = reaction.state;
    rules.push(reaction.ruleId);
    for (const action of reaction.actions) recordAction(observations, now, action);
    return reaction;
  };
  step({ type: 'subscribe' });
  if (model.metadata.operator === 'startWith' && state.phase === 'Prefix') {
    const limit = options.cancelAfterPrefix ?? model.parameters.prefix.length;
    while (state.phase === 'Prefix' && state.index < Math.min(limit, model.parameters.prefix.length)) step({ type: 'prefix.next' });
    if (options.cancelAfterPrefix !== undefined) step({ type: 'cancel' });
    else step({ type: 'prefix.complete' });
  }
  for (const [index, word] of words.entries()) {
    if (state.phase === 'Closed') break;
    now = word.time ?? index + 1;
    const event = sourceEvent(word);
    if (model.metadata.operator !== 'distinct' && event.type.startsWith('flush.')) continue;
    step(event);
    const operator = model.metadata.operator;
    if (operator === 'distinctUntilChanged' || operator === 'distinctUntilKeyChanged') {
      if (state.phase !== 'Selecting') continue;
      let key;
      try {
        if (model.parameters.keyMode === 'selected') calls.push({ kind: 'key', input: word.value });
        key = identityKey(model, word.value, options);
      } catch (error) {
        step({ type: 'key.throw', resource: { id: 'key', generation: state.callId }, error });
        continue;
      }
      step({ type: 'key.return', resource: { id: 'key', generation: state.callId }, value: key });
      if (state.phase === 'Comparing') {
        let same;
        try {
          if (model.parameters.compareMode === 'custom') calls.push({ kind: 'compare', previous: state.previousKey, current: state.key });
          same = compare(model, state.previousKey, state.key, options);
        } catch (error) {
          step({ type: 'compare.throw', resource: { id: 'compare', generation: state.callId }, error });
          continue;
        }
        step({ type: 'compare.return', resource: { id: 'compare', generation: state.callId }, same });
      }
    } else if (operator === 'distinct' && state.phase === 'Selecting') {
      let key;
      try {
        calls.push({ kind: 'key', input: word.value });
        key = distinctKey(model, word.value, options);
      } catch (error) {
        step({ type: 'key.throw', resource: { id: 'select', generation: state.callId }, error });
        continue;
      }
      step({ type: 'key.return', resource: { id: 'select', generation: state.callId }, value: key });
    }
  }
  return { observations, calls, state, rules };
}

const createRecordedSource = (bus, out, clock, resource) => new Observable(subscriber => {
  out.push({ time: clock.now, kind: 'subscribe', resource });
  const connection = bus.subscribe(subscriber);
  return () => {
    connection.unsubscribe();
    out.push({ time: clock.now, kind: 'unsubscribe', resource });
  };
});

export function observeSession4Rx(model, words, options = {}) {
  const observations = [], calls = [], clock = { now: 0 }, bus = new Subject(), flushBus = new Subject();
  const source = createRecordedSource(bus, observations, clock, 'source');
  const flushes = createRecordedSource(flushBus, observations, clock, 'flush');
  let operator;
  switch (model.metadata.operator) {
    case 'distinctUntilChanged': {
      const comparator = model.parameters.compareMode === 'custom'
        ? (a, b) => { calls.push({ kind: 'compare', previous: a, current: b }); return options.comparator(a, b); }
        : undefined;
      const selector = model.parameters.keyMode === 'selected'
        ? value => { calls.push({ kind: 'key', input: value }); return options.keySelector(value); }
        : undefined;
      operator = selector ? distinctUntilChanged(comparator, selector) : comparator ? distinctUntilChanged(comparator) : distinctUntilChanged();
      break;
    }
    case 'distinctUntilKeyChanged': {
      const comparator = model.parameters.compareMode === 'custom'
        ? (a, b) => { calls.push({ kind: 'compare', previous: a, current: b }); return options.comparator(a, b); }
        : undefined;
      operator = distinctUntilKeyChanged(model.parameters.property, comparator);
      break;
    }
    case 'distinct': {
      const selector = model.parameters.selected
        ? value => { calls.push({ kind: 'key', input: value }); return options.keySelector(value); }
        : undefined;
      operator = distinct(selector, model.parameters.withFlushes ? flushes : undefined);
      break;
    }
    case 'pairwise': operator = pairwise(); break;
    case 'startWith': operator = startWith(...model.parameters.prefix); break;
    default: throw new Error('unknown S4 operator ' + model.metadata.operator);
  }
  const subscription = source.pipe(operator).subscribe({
    next: value => observations.push({ time: clock.now, kind: 'N', value }),
    error: error => observations.push({ time: clock.now, kind: 'E', error }),
    complete: () => observations.push({ time: clock.now, kind: 'C' }),
  });
  for (const [index, word] of words.entries()) {
    if (subscription.closed) break;
    clock.now = word.time ?? index + 1;
    switch (word.kind) {
      case 'N': bus.next(word.value); break;
      case 'C': bus.complete(); break;
      case 'E': bus.error(word.error); break;
      case 'F': flushBus.next('reset'); break;
      case 'FC': flushBus.complete(); break;
      case 'FE': flushBus.error(word.error); break;
      case 'cancel': subscription.unsubscribe(); break;
      default: throw new Error('unknown word kind');
    }
  }
  return { observations, calls, closed: subscription.closed };
}

/** All words up to depth, with the termination event as their last item. */
export function* legalWords(alphabet, depth) {
  yield [];
  let frontier = [[]];
  for (let n = 1; n <= depth; n++) {
    const next = [];
    for (const prefix of frontier) {
      for (const symbol of alphabet) {
        const word = [...prefix, symbol];
        yield word;
        if (!['C','E','cancel','FE'].includes(symbol.kind)) next.push(word);
      }
    }
    frontier = next;
  }
}
export const notifications = result => result.observations.filter(x => ['N','E','C'].includes(x.kind));
export const lifetimes = result => result.observations.filter(x => x.kind === 'subscribe' || x.kind === 'unsubscribe');
