import assert from 'node:assert/strict';
import { Observable, skip, takeWhile, skipWhile, takeUntil, skipUntil } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

/** Independent native path: these are the installed RxJS 7.8.2 exports, not model interpreters. */
export function runUnaryNative(operator, inputs, options = {}) {
  const clock = new TestScheduler((actual, expected) => assert.deepEqual(actual, expected));
  const log = [];
  let sink;
  const source = new Observable(subscriber => {
    log.push([clock.frame, 'subscribe', 'source', 0]);
    sink = subscriber;
    return () => log.push([clock.frame, 'unsubscribe', 'source', 0]);
  });
  const predicate = (value, index) => {
    log.push([clock.frame, 'call', 'predicate', index, value]);
    return (options.predicate ?? (() => true))(value, index);
  };
  const selected = operator === 'skip' ? skip(options.count ?? 0) : operator === 'takeWhile' ? takeWhile(predicate, options.inclusive ?? false) : skipWhile(predicate);
  const subscription = source.pipe(selected).subscribe({
    next: value => log.push([clock.frame, 'N', value]),
    complete: () => log.push([clock.frame, 'C']),
    error: error => log.push([clock.frame, 'E', error]),
  });
  for (const { time, event } of inputs) clock.schedule(() => {
    if (event.type === 'source.next') sink.next(event.value);
    else if (event.type === 'source.complete') sink.complete();
    else if (event.type === 'source.error') sink.error(event.error);
    else if (event.type === 'cancel') subscription.unsubscribe();
    else throw new Error(`Unsupported native unary input ${event.type}`);
  }, time);
  clock.flush();
  return { log, closed: subscription.closed };
}

export function runUntilNative(operator, inputs, initialNotifier = null) {
  const clock = new TestScheduler((actual, expected) => assert.deepEqual(actual, expected));
  const log = [], sourceWasClosed = [];
  let sourceSink, notifierSink;
  const deliver = (sink, event) => {
    if (!sink) return; // A source not subscribed is not a notification producer for this execution.
    if (event.type.endsWith('.next')) sink.next(event.value);
    else if (event.type.endsWith('.complete')) sink.complete();
    else if (event.type.endsWith('.error')) sink.error(event.error);
    else throw new Error(`Unsupported native input ${event.type}`);
  };
  const source = new Observable(subscriber => {
    log.push([clock.frame, 'subscribe', 'source', 0]);
    sourceWasClosed.push(subscriber.closed);
    sourceSink = subscriber;
    return () => log.push([clock.frame, 'unsubscribe', 'source', 0]);
  });
  const notifier = new Observable(subscriber => {
    log.push([clock.frame, 'subscribe', 'notifier', 0]);
    notifierSink = subscriber;
    if (initialNotifier) deliver(subscriber, initialNotifier);
    return () => log.push([clock.frame, 'unsubscribe', 'notifier', 0]);
  });
  const subscription = source.pipe(operator === 'takeUntil' ? takeUntil(notifier) : skipUntil(notifier)).subscribe({
    next: value => log.push([clock.frame, 'N', value]),
    complete: () => log.push([clock.frame, 'C']),
    error: error => log.push([clock.frame, 'E', error]),
  });
  for (const { time, event } of inputs) clock.schedule(() => {
    if (event.type === 'cancel') subscription.unsubscribe();
    else deliver(event.type.startsWith('source.') ? sourceSink : notifierSink, event);
  }, time);
  clock.flush();
  return { log, sourceWasClosed, closed: subscription.closed };
}
