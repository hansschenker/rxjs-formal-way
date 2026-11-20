import { createWindowToggleModel, runWindowToggleTrace } from '../../src/models/session22-windowToggle.js';
import type { ToggleWindowToken, ToggleWindowRecord, ToggleWindowConsumer, WindowToggleParameters,
  WindowToggleState, WindowToggleEvent } from '../../src/models/session22-windowToggle.js';

const model = createWindowToggleModel<{ value: number }, string>();
const next: WindowToggleEvent<{ value: number }, string> = { type: 'source.next', value: { value: 1 } };
const opening: WindowToggleEvent<number, string> = { type: 'opening.next', value: 'open' };
const result: WindowToggleEvent<number> = { type: 'selector.return', resource: { id: 'closingSelector', generation: 0 } };
const token: ToggleWindowToken = { windowId: 0 };
const record: ToggleWindowRecord = { windowId: 0, status: 'open', announced: true, closingLive: true };
const consumer: ToggleWindowConsumer = { observerId: 'A', windowId: 0 };
const parameters: WindowToggleParameters = { closing: 'valid-Observable-result', setup: 'post-setup-notifications' };
runWindowToggleTrace(model, [{ time: 0, event: { type: 'subscribe' } }], { executionId: 'typed' });
// @ts-expect-error Source payload retains T.
const wrongValue: WindowToggleEvent<number, string> = { type: 'source.next', value: 'not-number' };
// @ts-expect-error Opening payload has its own type O.
const wrongOpening: WindowToggleEvent<number, string> = { type: 'opening.next', value: 1 };
// @ts-expect-error An undefined source payload must still be explicitly present.
const absentValue: WindowToggleEvent<undefined> = { type: 'source.next' };
// @ts-expect-error Selector returns identify their invocation.
const absentResource: WindowToggleEvent<number> = { type: 'selector.return' };
// @ts-expect-error Selector throws preserve the original error payload.
const absentError: WindowToggleEvent<number> = { type: 'selector.throw', resource: { id: 'closingSelector', generation: 0 } };
// @ts-expect-error Closing notifications identify an independent subscription generation.
const absentClosing: WindowToggleEvent<number> = { type: 'closing.next' };
// @ts-expect-error Window consumer needs a concrete announced handle identity.
const absentHandle: WindowToggleEvent<number> = { type: 'window.subscribe', observerId: 'A' };
// @ts-expect-error Child cancellation requires the observer identity.
const absentObserver: WindowToggleEvent<number> = { type: 'window.unsubscribe' };
// @ts-expect-error Timer firing is not part of this signal-controlled operator.
const timer: WindowToggleEvent<number> = { type: 'timer.fire', now: 1 };
// @ts-expect-error Window identities are numeric, not source payloads.
const wrongToken: ToggleWindowToken = { windowId: 'zero' };
// @ts-expect-error Window status distinguishes completion, error and disposal.
const wrongStatus: ToggleWindowRecord = { windowId: 0, status: 'cancelled', announced: true, closingLive: false };
// @ts-expect-error Closing liveness is explicit.
const missingLive: ToggleWindowRecord = { windowId: 0, status: 'open', announced: true };
// @ts-expect-error Selecting requires memory and a correlated pending identity.
const incompleteSelecting: WindowToggleState = { phase: 'Selecting', pending: 0 };
// @ts-expect-error Active state retains the complete ownership registry.
const incompleteActive: WindowToggleState = { phase: 'Active', nextWindowId: 0 };
// @ts-expect-error Setup scope does not admit synchronous acquisition in the canonical model.
const invalidSetup: WindowToggleParameters = { closing: 'valid-Observable-result', setup: 'synchronous' };
// @ts-expect-error Observer identity remains required independently of its window ID.
const invalidConsumer: ToggleWindowConsumer = { windowId: 0 };
void [next, opening, result, token, record, consumer, parameters, wrongValue, wrongOpening, absentValue,
  absentResource, absentError, absentClosing, absentHandle, absentObserver, timer, wrongToken,
  wrongStatus, missingLive, incompleteSelecting, incompleteActive, invalidSetup, invalidConsumer];
