import type { Notification, TimedEvent } from '../schema.js';
import type { MergeEvent } from '../models/session14-merge.js';
import { createMergeWithModel } from '../models/session15-aliases.js';
import { runTrace, stepModel } from '../runner.js';

export type Delivery = Readonly<{ time: number; notification: Notification<string> }>;
export type InputFixture = Readonly<{ mode: 'hot' | 'cold'; events: readonly Delivery[] }>;
export type MergeWithScenario = Readonly<{
  id: string; title: string; sources: readonly InputFixture[];
  expected: readonly Delivery[]; horizon: number; cancelAt?: number;
}>;
const n = (time: number, value: string): Delivery => ({ time, notification: { kind: 'N', value } });
const c = (time: number): Delivery => ({ time, notification: { kind: 'C' } });
const e = (time: number): Delivery => ({ time, notification: { kind: 'E', error: 'fault' } });
const hot = (...events: Delivery[]): InputFixture => ({ mode: 'hot', events });
const cold = (...events: Delivery[]): InputFixture => ({ mode: 'cold', events });

/** Golden inputs/outputs are independent of the canonical transition functions.
 * Negative hot times precede the result subscription. Cold times are subscription-relative.
 * Same-frame events use fixture scheduler insertion order; no universal source-priority claim.
 */
export const mergeWithScenarios: readonly MergeWithScenario[] = [
  { id: 'MW-HOT', title: 'Two live inputs interleave values and finish at different times',
    sources: [hot(n(2,'a'),n(8,'b'),n(14,'c'),c(19)), hot(n(5,'d'),n(11,'e'),n(17,'f'),c(21))],
    expected: [n(2,'a'),n(5,'d'),n(8,'b'),n(11,'e'),n(14,'c'),n(17,'f'),c(21)], horizon: 24 },
  { id: 'MW-COLD', title: 'Two on-demand inputs use subscription-relative timelines',
    sources: [cold(n(3,'a'),n(9,'b'),n(15,'c'),c(20)), cold(n(6,'x'),n(12,'y'),n(18,'z'),c(23))],
    expected: [n(3,'a'),n(6,'x'),n(9,'b'),n(12,'y'),n(15,'c'),n(18,'z'),c(23)], horizon: 25 },
  { id: 'MW-HOT-HISTORY', title: 'Values emitted by live inputs before connection are not replayed',
    sources: [hot(n(-4,'lost-a'),n(2,'b'),n(8,'c'),c(13)), hot(n(-2,'lost-x'),n(5,'y'),n(11,'z'),c(16))],
    expected: [n(2,'b'),n(5,'y'),n(8,'c'),n(11,'z'),c(16)], horizon: 18 },
  { id: 'MW-MIXED', title: 'A live input and an on-demand input retain their own timing',
    sources: [hot(n(-4,'lost'),n(4,'b'),n(10,'c'),c(15)), cold(n(2,'x'),n(8,'y'),n(14,'z'),c(19))],
    expected: [n(2,'x'),n(4,'b'),n(8,'y'),n(10,'c'),n(14,'z'),c(19)], horizon: 21 },
  { id: 'MW-PARALLEL', title: 'Same-frame values follow this fixture scheduler delivery order',
    sources: [hot(n(3,'a'),n(8,'b'),n(13,'c'),c(18)), hot(n(3,'x'),n(8,'y'),n(13,'z'),c(18))],
    expected: [n(3,'a'),n(3,'x'),n(8,'b'),n(8,'y'),n(13,'c'),n(13,'z'),c(18)], horizon: 20 },
  { id: 'MW-CANCEL', title: 'Consumer cancellation releases all three inputs without completing',
    sources: [hot(n(1,'a'),n(5,'late-a'),c(9)), hot(n(2,'b'),c(8)), hot(n(6,'late-c'),c(9))],
    expected: [n(1,'a'),n(2,'b')], cancelAt: 3, horizon: 11 },
  { id: 'MW-EMPTY2', title: 'Two empty inputs complete after both registered teardowns',
    sources: [cold(c(0)),cold(c(0))], expected: [c(0)], horizon: 2 },
  { id: 'MW-EMPTY3', title: 'Three empty inputs complete without emitting a value',
    sources: [cold(c(0)),cold(c(0)),cold(c(0))], expected: [c(0)], horizon: 2 },
  { id: 'MW-NEVER-EMPTY', title: 'One empty input cannot complete a remaining silent input',
    sources: [cold(),cold(c(0))], expected: [], horizon: 8 },
  { id: 'MW-NEVER-NEVER', title: 'Two silent inputs produce no spontaneous output',
    sources: [cold(),cold()], expected: [], horizon: 8 },
  { id: 'MW-EMPTY-ERROR', title: 'An initial-frame input error wins over normal completion',
    sources: [cold(c(0)),cold(e(0))], expected: [e(0)], horizon: 2 },
  { id: 'MW-HOT-ERROR', title: 'An initial-frame error cancels a live value-producing input',
    sources: [hot(n(2,'a'),n(5,'b'),c(11)),cold(e(0))], expected: [e(0)], horizon: 12 },
  { id: 'MW-NEVER-ERROR', title: 'An initial-frame error cancels a silent input',
    sources: [cold(),cold(e(0))], expected: [e(0)], horizon: 2 },
  { id: 'MW-EMPTY-LATE-ERROR', title: 'An error after another input completed still errors the result',
    sources: [cold(c(0)),hot(e(7))], expected: [e(7)], horizon: 9 },
  { id: 'MW-HOT-LATE-ERROR', title: 'Previously delivered values are followed by the original error',
    sources: [hot(n(2,'a'),n(5,'b'),n(8,'late'),c(11)),hot(e(7))],
    expected: [n(2,'a'),n(5,'b'),e(7)], horizon: 12 },
  { id: 'MW-NEVER-LATE-ERROR', title: 'An eventual error cancels a silent input',
    sources: [cold(),hot(e(7))], expected: [e(7)], horizon: 9 },
  { id: 'MW-THREE', title: 'The default three-input profile waits for its final input',
    sources: [cold(n(1,'a'),c(3)),cold(n(2,'b'),c(4)),cold(c(5))],
    expected: [n(1,'a'),n(2,'b'),c(5)], horizon: 7 },
  { id: 'MW-SINGLE', title: 'No additional inputs means one source subscription and no wait rule',
    sources: [cold(n(1,'a'),c(2))], expected: [n(1,'a'),c(2)], horizon: 4 },
];

export const upstreamRevision = 'e5351d02e225e275ac0e497c7b66eaa5f0c88791';
export const upstreamSpec = 'https://github.com/ReactiveX/rxjs/blob/' + upstreamRevision + '/spec/operators/mergeWith-spec.ts';
export type UpstreamDisposition = Readonly<{
  ordinal: number; title: string;
  disposition: 'modeled-adapted-witness' | 'runtime-only' | 'different-operator';
  witness: string; boundary: string;
}>;
/** Titles identify upstream bodies; an adapted witness does NOT mean the upstream suite was executed. */
export const upstreamDispositions: readonly UpstreamDisposition[] = [
  { ordinal:1,title:'should handle merging two hot observables',disposition:'modeled-adapted-witness',witness:'MW-HOT',boundary:'Values, frames, completion and subscription ownership.' },
  { ordinal:2,title:'should merge a source with a second',disposition:'runtime-only',witness:'MW-NATIVE-SYNC',boundary:'of emits during acquisition; excluded from atomic model setup.' },
  { ordinal:3,title:'should merge a source with a second, when the second is just a plain array',disposition:'runtime-only',witness:'MW-NATIVE-ARRAY',boundary:'ObservableInput conversion; the 7.8.2 array regression is not modeled.' },
  { ordinal:4,title:'should merge cold and cold',disposition:'modeled-adapted-witness',witness:'MW-COLD',boundary:'Subscription-relative schedules.' },
  { ordinal:5,title:'should merge hot and hot',disposition:'modeled-adapted-witness',witness:'MW-HOT-HISTORY',boundary:'Pre-subscription hot values do not enter the model input trace.' },
  { ordinal:6,title:'should merge hot and cold',disposition:'modeled-adapted-witness',witness:'MW-MIXED',boundary:'One live and one on-demand schedule.' },
  { ordinal:7,title:'should merge parallel emissions',disposition:'modeled-adapted-witness',witness:'MW-PARALLEL',boundary:'This fixture tie order only; no universal equal-frame ordering assertion.' },
  { ordinal:8,title:'should allow unsubscribing explicitly and early',disposition:'modeled-adapted-witness',witness:'MW-CANCEL',boundary:'Adapted to three inputs; cancellation between notifications.' },
  { ordinal:9,title:'should not break unsubscription chains when result is unsubscribed explicitly',disposition:'runtime-only',witness:'MW-NATIVE-CHAIN',boundary:'Surrounding map composition is checked natively, not modeled by the isolated machine.' },
  { ordinal:10,title:'should merge empty and empty',disposition:'modeled-adapted-witness',witness:'MW-EMPTY2',boundary:'Cold time-zero scheduled completion occurs after registration, not synchronously inside acquisition.' },
  { ordinal:11,title:'should merge three empties',disposition:'modeled-adapted-witness',witness:'MW-EMPTY3',boundary:'Cold time-zero scheduled completion after setup.' },
  { ordinal:12,title:'should merge never and empty',disposition:'modeled-adapted-witness',witness:'MW-NEVER-EMPTY',boundary:'Finite observation window; not a proof of infinite silence.' },
  { ordinal:13,title:'should merge never and never',disposition:'modeled-adapted-witness',witness:'MW-NEVER-NEVER',boundary:'Finite observation window; no liveness claim without assumptions.' },
  { ordinal:14,title:'should merge empty and throw',disposition:'modeled-adapted-witness',witness:'MW-EMPTY-ERROR',boundary:'Cold time-zero scheduled error after setup.' },
  { ordinal:15,title:'should merge hot and throw',disposition:'modeled-adapted-witness',witness:'MW-HOT-ERROR',boundary:'Cold time-zero scheduled error cancels other live input.' },
  { ordinal:16,title:'should merge never and throw',disposition:'modeled-adapted-witness',witness:'MW-NEVER-ERROR',boundary:'Cold time-zero scheduled error, not acquisition-time throw.' },
  { ordinal:17,title:'should merge empty and eventual error',disposition:'modeled-adapted-witness',witness:'MW-EMPTY-LATE-ERROR',boundary:'Completed input is no longer owned.' },
  { ordinal:18,title:'should merge hot and error',disposition:'modeled-adapted-witness',witness:'MW-HOT-LATE-ERROR',boundary:'Preserve earlier values; release live input subscriptions.' },
  { ordinal:19,title:'should merge never and error',disposition:'modeled-adapted-witness',witness:'MW-NEVER-LATE-ERROR',boundary:'Silent source is released on error.' },
  { ordinal:20,title:'should merge two observables',disposition:'different-operator',witness:'not-counted',boundary:'Body invokes mergeAll, not mergeWith.' },
  { ordinal:21,title:'should merge two immediately-scheduled observables',disposition:'different-operator',witness:'not-counted',boundary:'Body invokes mergeAll with queueScheduler; not mergeWith coverage.' },
  { ordinal:22,title:'should stop listening to a synchronous observable when unsubscribed',disposition:'runtime-only',witness:'MW-NATIVE-SYNC-CANCEL',boundary:'Body invokes mergeWith plus take(3), despite its mergeAll describe block; acquisition-time cancellation is excluded from the model.' },
];

/** Environment inputs only; never derive the golden expected output from the model. */
export function scenarioEvents(scenario: MergeWithScenario): readonly TimedEvent<MergeEvent<string>>[] {
  const events = scenario.sources.flatMap((input, index) => input.events
    .filter(delivery => delivery.time <= scenario.horizon && (input.mode === 'cold' || delivery.time > 0))
    .map(delivery => {
      const resource = { id: 'input', generation: index };
      const notification = delivery.notification;
      const event: MergeEvent<string> = notification.kind === 'N'
        ? { type: 'input.next', resource, value: notification.value }
        : notification.kind === 'E' ? { type: 'input.error', resource, error: notification.error }
        : { type: 'input.complete', resource };
      return { time: delivery.time, event, mode: input.mode, index };
    }));
  events.sort((a,b) => a.time - b.time || (a.mode === b.mode ? 0 : a.mode === 'hot' ? -1 : 1) || a.index - b.index);
  const timed: TimedEvent<MergeEvent<string>>[] = [{ time: 0, event: { type: 'subscribe' } }, ...events.map(({time,event}) => ({time,event}))];
  if (scenario.cancelAt !== undefined) timed.push({ time: scenario.cancelAt, event: { type: 'cancel' } });
  // Stable sort retains subscribe before time-zero cold deliveries. Fixtures avoid cancellation ties.
  return timed.sort((a,b) => a.time - b.time);
}

export function predictMergeWithScenario(scenario: MergeWithScenario) {
  const model = createMergeWithModel<string>(scenario.sources.length - 1);
  let state = model.initialState();
  const delivered: TimedEvent<MergeEvent<string>>[] = [];
  for (const input of scenarioEvents(scenario)) {
    if (state.phase === 'Closed') break; // disconnected producer events are no longer delivered
    state = stepModel(model, state, input.event).state;
    delivered.push(input);
  }
  return runTrace(model, delivered, { executionId: scenario.id });
}
