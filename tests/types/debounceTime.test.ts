import type { DebounceTimeEvent, DebounceTimeState } from '../../src/models/debounceTime.js';
import { createDebounceTimeModel } from '../../src/models/debounceTime.js';
const model = createDebounceTimeModel<string>(3);
const good: DebounceTimeEvent<string> = { type: 'source.next', value: 'x', now: 1 };
void good;
// @ts-expect-error clock is mandatory
const missingClock: DebounceTimeEvent<string> = { type: 'source.next', value: 'x' };
// @ts-expect-error input payload is typed
const badValue: DebounceTimeEvent<string> = { type: 'source.next', value: 1, now: 1 };
// @ts-expect-error firing needs a generation-qualified resource
const missingTimer: DebounceTimeEvent<string> = { type: 'timer.fire', now: 4 };
// @ts-expect-error timer identity includes its generation
const missingGeneration: DebounceTimeEvent<string> = { type: 'timer.fire', now: 4, resource: { id: 'debounce-timer' } };
// @ts-expect-error cancellation is a control input, not a value delivery
const cancelValue: DebounceTimeEvent<string> = { type: 'cancel', now: 4, value: 'x' };
// @ts-expect-error pending state must remember all timing fields and a value
const missingMemory: DebounceTimeState<string> = { phase: 'Pending', now: 1, nextTimer: 1 };
// @ts-expect-error fixed parameters are readonly
model.parameters.dueTime = 4;
// @ts-expect-error debounce has no callback outcome input
const callback: DebounceTimeEvent<string> = { type: 'callback.return', now: 4, value: 'x' };
void [missingClock, badValue, missingTimer, missingGeneration, cancelValue, missingMemory, callback];
