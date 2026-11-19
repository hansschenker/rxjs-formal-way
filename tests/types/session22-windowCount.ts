import { createWindowCountModel } from '../../src/models/session22-windowCount.js';
import type { CountWindowConsumer, CountWindowRecord, CountWindowToken, WindowCountEvent,
  WindowCountParameters, WindowCountState } from '../../src/models/session22-windowCount.js';

createWindowCountModel<number>(2, 3);
const source: WindowCountEvent<{ opaque: true }> = { type: 'source.next', value: { opaque: true } };
const attach: WindowCountEvent<number> = { type: 'window.subscribe', observerId: 'A', windowId: 0 };
const start: WindowCountState = { phase: 'Unsubscribed' };
const token: CountWindowToken = { windowId: 0 };
const parameters: WindowCountParameters = { windowSize: 2, startEvery: 3 };
const record: CountWindowRecord = { windowId: 0, openedAt: 0, status: 'open' };
const consumer: CountWindowConsumer = { observerId: 'A', windowId: 0 };
// @ts-expect-error Source payload T is preserved instead of coercing to a primitive.
const wrongPayload: WindowCountEvent<{ opaque: true }> = { type: 'source.next', value: 'A' };
// @ts-expect-error Source.next requires a value field, even if it can be undefined.
const noPayload: WindowCountEvent<undefined> = { type: 'source.next' };
// @ts-expect-error Source.error requires the original error identity.
const noError: WindowCountEvent<number> = { type: 'source.error' };
// @ts-expect-error A window attachment needs a stable token ID.
const noWindow: WindowCountEvent<number> = { type: 'window.subscribe', observerId: 'A' };
// @ts-expect-error Source events are distinct from scheduled timer fires.
const timer: WindowCountEvent<number> = { type: 'timer.fire', now: 4 };
// @ts-expect-error A child unsubscribe must name the consumer.
const noObserver: WindowCountEvent<number> = { type: 'window.unsubscribe' };
// @ts-expect-error Child ID is numeric, not a domain value.
const wrongToken: CountWindowToken = { windowId: 'A' };
// @ts-expect-error Window record status distinguishes open, completed and failed.
const wrongStatus: CountWindowRecord = { windowId: 0, openedAt: 0, status: 'invalidated' };
// @ts-expect-error Child consumer must identify the window it observes.
const wrongConsumer: CountWindowConsumer = { observerId: 'A' };
// @ts-expect-error Active memory contains its complete window registry.
const incompleteActive: WindowCountState = { phase: 'Active', seen: 1 };
// @ts-expect-error A stopped state must declare terminal cause.
const incompleteStopped: WindowCountState = { phase: 'Stopped', seen: 1, nextWindowId: 1, windows: [], consumers: [], usedObservers: [] };
// @ts-expect-error An effective stride must be numeric.
const wrongStride: WindowCountParameters = { windowSize: 2, startEvery: 'two' };
void [source, attach, start, token, parameters, record, consumer, wrongPayload, noPayload,
  noError, noWindow, timer, noObserver, wrongToken, wrongStatus, wrongConsumer,
  incompleteActive, incompleteStopped, wrongStride];
