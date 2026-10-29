import { Observable, switchMap, mergeMap, concatMap, exhaustMap } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

/** Independent native observation path: no model, runner or generated oracle is imported. */
export function observeFlattenRx(operator, concurrent, outerEvents, project) {
  const clock = new TestScheduler(() => {}), observations = [], live = new Set();
  const log = entry => observations.push({ time: clock.now(), ...entry });
  let outerSink;
  const outer = new Observable(subscriber => {
    outerSink = subscriber; live.add('outer#0'); log({ kind: 'subscribe', id: 'outer', generation: 0 });
    return () => { live.delete('outer#0'); log({ kind: 'unsubscribe', id: 'outer', generation: 0 }); };
  });
  const projection = (value, index) => {
    log({ kind: 'project', value, index });
    const plan = project(value, index);
    return new Observable(subscriber => {
      const id = `inner#${index}`; live.add(id); log({ kind: 'subscribe', id: 'inner', generation: index });
      const jobs = plan.events.map(input => clock.schedule(() => {
        if (subscriber.closed) return;
        if (input.kind === 'N') subscriber.next(input.value);
        else if (input.kind === 'E') subscriber.error(input.error);
        else subscriber.complete();
      }, input.delay));
      return () => {
        for (const job of jobs) job.unsubscribe();
        live.delete(id); log({ kind: 'unsubscribe', id: 'inner', generation: index });
      };
    });
  };
  const op = operator === 'switchMap' ? switchMap(projection) : operator === 'mergeMap' ? mergeMap(projection, concurrent)
    : operator === 'concatMap' ? concatMap(projection) : operator === 'exhaustMap' ? exhaustMap(projection) : null;
  if (!op) throw new Error(`unknown operator ${operator}`);
  const subscription = outer.pipe(op).subscribe({
    next: value => log({ kind: 'N', value }), error: error => log({ kind: 'E', error }), complete: () => log({ kind: 'C' }),
  });
  for (const input of outerEvents) clock.schedule(() => {
    if (input.kind === 'cancel') subscription.unsubscribe();
    else if (!outerSink.closed) {
      if (input.kind === 'N') outerSink.next(input.value);
      else if (input.kind === 'E') outerSink.error(input.error);
      else outerSink.complete();
    }
  }, input.time);
  clock.flush();
  return { observations, closed: subscription.closed, live: live.size };
}
