import { createWindowTimeModel, runWindowTimeTrace } from '../../src/models/session22-windowTime.js';
import type { WindowTimeEvent, WindowTimeState, WindowTimeParameters } from '../../src/models/session22-windowTime.js';
import { stepModel } from '../../src/runner.js';

const model = createWindowTimeModel<string>(5, 2, 3);
const legal: WindowTimeEvent<string> = { type: 'timer.window', now: 5, resource: { id: 'windowClose', generation: 0 } };
stepModel(model, model.initialState(), { type: 'subscribe', now: 0 });
runWindowTimeTrace(model, [{ time: 0, event: { type: 'subscribe', now: 0 } }], { executionId: 'typed' });
void legal;

// @ts-expect-error source next requires an opaque value
const missingValue: WindowTimeEvent<string> = { type: 'source.next', now: 0 };
// @ts-expect-error source payload type is retained
const wrongValue: WindowTimeEvent<string> = { type: 'source.next', now: 0, value: 1 };
// @ts-expect-error every admitted event carries explicit scheduler time
const missingTime: WindowTimeEvent<string> = { type: 'cancel' };
// @ts-expect-error timer close requires a generation-bearing resource
const missingTimer: WindowTimeEvent<string> = { type: 'timer.window', now: 3 };
// @ts-expect-error window close cannot use the recurring creator identity
const wrongTimer: WindowTimeEvent<string> = { type: 'timer.window', now: 3, resource: { id: 'windowCreation', generation: 0 } };
// @ts-expect-error recurring creation identity has fixed generation zero
const wrongCreator: WindowTimeEvent<string> = { type: 'timer.creation', now: 3, tick: 0, resource: { id: 'windowCreation', generation: 1 } };
// @ts-expect-error creation firing requires its occurrence tick
const missingTick: WindowTimeEvent<string> = { type: 'timer.creation', now: 3, resource: { id: 'windowCreation', generation: 0 } };
// @ts-expect-error child observation requires a window identity
const missingWindow: WindowTimeEvent<string> = { type: 'window.subscribe', now: 0, observerId: 'A' };
// @ts-expect-error child disposal requires an observer identity
const missingObserver: WindowTimeEvent<string> = { type: 'window.unsubscribe', now: 0 };
// @ts-expect-error source failure requires the actual error payload
const missingError: WindowTimeEvent<string> = { type: 'source.error', now: 0 };
// @ts-expect-error windowTime has no boundary-notifier event
const foreignEvent: WindowTimeEvent<string> = { type: 'boundary.next', now: 0 };
// @ts-expect-error model parameters are readonly
model.parameters.span = 6;
// @ts-expect-error active state requires its window and timer memory
const incompleteState: WindowTimeState = { phase: 'Active', now: 0 };
// @ts-expect-error clock values are numbers
const wrongTime: WindowTimeEvent<string> = { type: 'subscribe', now: '0' };
// @ts-expect-error configuration null is explicit; strings are not durations
const wrongParameters: WindowTimeParameters = { span: 5, creationInterval: 'periodic', maxSize: null };
// @ts-expect-error constructor does not accept foreign configuration records
createWindowTimeModel({ span: 5 });

void [missingValue, wrongValue, missingTime, missingTimer, wrongTimer, wrongCreator, missingTick,
  missingWindow, missingObserver, missingError, foreignEvent, incompleteState, wrongTime, wrongParameters];
