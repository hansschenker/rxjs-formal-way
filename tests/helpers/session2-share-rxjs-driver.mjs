import { Observable, share } from 'rxjs';

/** No reference model is imported. Commands drive the actual RxJS operator. */
export function observeShareRx(options, commands) {
  let sink = null, generation = 0, id = 0, time = 0, connections = 0;
  const subscriptions = new Map(), observations = [];
  const source = new Observable(subscriber => {
    const current = generation++; sink = subscriber; connections++;
    observations.push({ time, kind: 'subscribe', id: 'source', generation: current });
    return () => { connections--; observations.push({ time, kind: 'unsubscribe', id: 'source', generation: current }); };
  });
  const shared = source.pipe(share(options));
  function join() {
    const target = `s${id++}`;
    const subscription = shared.subscribe({
      next: value => observations.push({ time, target, kind: 'N', value }),
      error: error => { observations.push({ time, target, kind: 'E', error }); subscriptions.delete(target); },
      complete: () => { observations.push({ time, target, kind: 'C' }); subscriptions.delete(target); },
    });
    if (!subscription.closed) subscriptions.set(target, subscription);
  }
  function leave() {
    const first = subscriptions.entries().next().value;
    if (first) { first[1].unsubscribe(); subscriptions.delete(first[0]); }
  }
  for (const command of commands) {
    time++;
    if (command === 'join') join();
    else if (command === 'leave') leave();
    else if (sink && !sink.closed) {
      if (command === 'next') sink.next(time);
      else if (command === 'error') sink.error('source-fault');
      else sink.complete();
    }
    if (connections > 1) throw new Error('unexpected overlapping source connections');
  }
  time++;
  while (subscriptions.size) leave();
  if (sink && !sink.closed) sink.complete();
  return { observations, connected: connections !== 0, liveSubscribers: subscriptions.size };
}
