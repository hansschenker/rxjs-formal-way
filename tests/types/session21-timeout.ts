import { createTimeoutModel, createTimeoutWithModel } from '../../src/models/session21-timeout.js';
import type { TimeoutOptions, TimeoutState, TimeoutEvent, TimeoutTimer } from '../../src/models/session21-timeout.js';

createTimeoutModel<number, string>({ first: { at: 20 }, each: 3, withMode: 'factory', meta: { request: 1 } });
createTimeoutWithModel<number, string>(3, 'fallback');
const valid: TimeoutEvent<number, string> = { type: 'fallback.next', now: 5, resource: { id: 'fallback', generation: 0 }, value: 'R' };
void valid;
// @ts-expect-error Relative duration must be numeric.
createTimeoutModel({ each: '3' });
// @ts-expect-error A Date is represented explicitly by an absolute numeric at field in the pure model.
createTimeoutModel({ first: new Date() });
// @ts-expect-error The constant binding belongs to timeoutWith, not a user timeout factory.
const badMode: TimeoutOptions = { each: 3, withMode: 'constant' };
// @ts-expect-error Absolute first time is numeric.
createTimeoutWithModel({ at: '20' });
// @ts-expect-error Fallback descriptions use opaque string tokens.
createTimeoutWithModel(3, {});
// @ts-expect-error Every event carries supplied scheduler time.
const noClock: TimeoutEvent<number> = { type: 'subscribe' };
// @ts-expect-error A source next retains its source payload type.
const badSource: TimeoutEvent<number, string> = { type: 'source.next', now: 0, value: 'not-number' };
// @ts-expect-error A fallback next retains its replacement payload type.
const badFallback: TimeoutEvent<number, string> = { type: 'fallback.next', now: 5, resource: { id: 'fallback', generation: 0 }, value: 1 };
// @ts-expect-error Timer generations are required.
const noGeneration: TimeoutEvent<number> = { type: 'timer.fire', now: 4, resource: { id: 'timeoutTimer' } };
// @ts-expect-error Factory return supplies an Observable token.
const noToken: TimeoutEvent<number> = { type: 'callback.return', now: 4, resource: { id: 'timeoutFactory', generation: 0 } };
// @ts-expect-error A throw explicitly carries its error, including if the value is undefined.
const noError: TimeoutEvent<number> = { type: 'callback.throw', now: 4, resource: { id: 'timeoutFactory', generation: 0 } };
// @ts-expect-error The source state requires counters, retained memory and timer ownership.
const emptySource: TimeoutState<number> = { phase: 'Source', clock: 0 };
// @ts-expect-error An active timer has both generation and absolute deadline.
const noDeadline: TimeoutTimer = { generation: 0 };
// @ts-expect-error Choosing still records the preserved seen count.
const noSeen: TimeoutState<number> = { phase: 'Choosing', clock: 3 };
// @ts-expect-error A live fallback carries its producer-description token.
const noFallbackToken: TimeoutState<number> = { phase: 'Fallback', clock: 4 };
// @ts-expect-error A closed reason is one of the three lifecycle terminal reasons.
const badReason: TimeoutState<number> = { phase: 'Closed', clock: 4, reason: 'timeout' };
void [badMode, noClock, badSource, badFallback, noGeneration, noToken, noError, emptySource, noDeadline, noSeen, noFallbackToken, badReason];
