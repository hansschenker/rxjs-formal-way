import { createClockModel, createTimeIntervalModel, createTimestampModel, runClockTrace } from '../../src/models/session21-clock.js';
import type { ClockEvent, ClockState, ClockOutput, ClockParameters } from '../../src/models/session21-clock.js';
import { stepModel } from '../../src/runner.js';

const interval = createTimeIntervalModel<number>();
const stamp = createTimestampModel<string>();
stepModel(interval, interval.initialState(), { type: 'subscribe' });
stepModel(stamp, stamp.initialState(), { type: 'source.next', value: 'typed' });
const reading: ClockEvent<number> = { type: 'clock.return', resource: { id: 'timeInterval.now', generation: 0 }, reading: -2.5 };
runClockTrace(interval, [{ time: 0, event: reading }], { executionId: 'types-only' });

// @ts-expect-error only the two clock-decoration exports are supported
createClockModel('debounceTime');
// @ts-expect-error a timeInterval source value retains its configured payload type
stepModel(interval, interval.initialState(), { type: 'source.next', value: 'wrong' });
// @ts-expect-error a timestamp source value retains its configured payload type
stepModel(stamp, stamp.initialState(), { type: 'source.next', value: 1 });
// @ts-expect-error provider returns require a numeric reading
const badReading: ClockEvent<number> = { type: 'clock.return', resource: { id: 'timestamp.now', generation: 0 }, reading: 'now' };
// @ts-expect-error invocation identity includes the generation
const missingGeneration: ClockEvent<number> = { type: 'clock.throw', resource: { id: 'timestamp.now' }, error: undefined };
// @ts-expect-error thrown values require a present error field, even when undefined
const missingError: ClockEvent<number> = { type: 'clock.throw', resource: { id: 'timestamp.now', generation: 0 } };
// @ts-expect-error clock decoration has no timer event
const timer: ClockEvent<number> = { type: 'timer.fire', resource: { id: 'timer', generation: 0 } };
// @ts-expect-error a pending read must retain its source payload
const missingValue: ClockState<number> = { phase: 'ReadingNext', previous: 1, read: 2 };
// @ts-expect-error a baseline read is exactly read zero
const badInitial: ClockState<number> = { phase: 'ReadingStart', read: 1 };
// @ts-expect-error live bookkeeping requires the next read counter
const missingCounter: ClockState<number> = { phase: 'Listening', previous: null };
// @ts-expect-error output wrappers retain the configured payload type
const wrongOutput: ClockOutput<number> = { value: 'wrong', timestamp: 1 };
// @ts-expect-error clock semantics use the explicit supplied-provider binding
const wrongBinding: ClockParameters = { operator: 'timestamp', clock: 'internal-scheduler' };
void [badReading, missingGeneration, missingError, timer, missingValue, badInitial, missingCounter, wrongOutput, wrongBinding];
