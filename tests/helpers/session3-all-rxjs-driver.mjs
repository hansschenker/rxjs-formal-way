import { Observable, switchAll, mergeAll, concatAll, exhaustAll } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

/**
 * Actual RxJS 7.8.2 path. Outer emits real Observable instances; no user
 * projection runs. This driver imports neither a model nor its rules.
 */
export function observeAllRx(name, concurrent, outerEvents) {
  const clock = new TestScheduler(() => {}), observations = [], live = new Set();
  let outerSink, admitted = 0;
  const log = value => observations.push({ time: clock.now(), ...value });
  const outer = new Observable(s => {
    outerSink = s; live.add('outer#0'); log({ kind: 'subscribe', id: 'outer', generation: 0 });
    return () => { live.delete('outer#0'); log({ kind: 'unsubscribe', id: 'outer', generation: 0 }); };
  });
  const makeInner = descriptor => new Observable(s => {
    const generation = admitted++, key = 'inner#' + generation;
    live.add(key); log({ kind: 'subscribe', id: 'inner', generation });
    const jobs = descriptor.events.map(event => clock.schedule(() => {
      if (s.closed) return;
      if (event.kind === 'N') s.next(event.value);
      else if (event.kind === 'E') s.error(event.error);
      else s.complete();
    }, event.delay));
    return () => {
      for (const job of jobs) job.unsubscribe();
      live.delete(key); log({ kind: 'unsubscribe', id: 'inner', generation });
    };
  });
  const op = name === 'switchAll' ? switchAll() : name === 'mergeAll' ? mergeAll(concurrent)
    : name === 'concatAll' ? concatAll() : name === 'exhaustAll' ? exhaustAll() : null;
  if (!op) throw new Error('unknown flatten-all name');
  const subscription = outer.pipe(op).subscribe({
    next: value => log({ kind: 'N', value }), error: error => log({ kind: 'E', error }),
    complete: () => log({ kind: 'C' }),
  });
  for (const input of outerEvents) clock.schedule(() => {
    if (input.kind === 'cancel') subscription.unsubscribe();
    else if (!outerSink.closed) {
      if (input.kind === 'N') outerSink.next(makeInner(input.value));
      else if (input.kind === 'E') outerSink.error(input.error);
      else outerSink.complete();
    }
  }, input.time);
  clock.flush();
  return { observations, closed: subscription.closed, live: live.size, admitted };
}
