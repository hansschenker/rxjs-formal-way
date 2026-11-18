import { createWindowModel } from '../../src/models/session21-window.js';
import type { WindowConsumer, WindowEvent, WindowRecord, WindowState, WindowToken } from '../../src/models/session21-window.js';

createWindowModel<number>();
const sourceValue: WindowEvent<number> = { type: 'source.next', value: 1 };
const attach: WindowEvent<number> = { type: 'window.subscribe', windowId: 0, observerId: 'A' };
const initial: WindowState = { phase: 'Unsubscribed' };
// @ts-expect-error Source payload type is preserved.
const wrongValue: WindowEvent<number> = { type: 'source.next', value: 'x' };
// @ts-expect-error Source next requires a payload, even when undefined is its type.
const missingValue: WindowEvent<undefined> = { type: 'source.next' };
// @ts-expect-error Error input always declares its opaque payload.
const missingError: WindowEvent<number> = { type: 'boundary.error' };
// @ts-expect-error Consumer attachment identifies the emitted window.
const missingWindow: WindowEvent<number> = { type: 'window.subscribe', observerId: 'A' };
// @ts-expect-error Window identity is numeric.
const wrongWindow: WindowEvent<number> = { type: 'window.subscribe', windowId: '0', observerId: 'A' };
// @ts-expect-error Consumer cancellation identifies its own subscription.
const missingObserver: WindowEvent<number> = { type: 'window.unsubscribe' };
// @ts-expect-error Token IDs cannot carry arbitrary domain payloads.
const wrongToken: WindowToken = { windowId: 'business-value' };
// @ts-expect-error Status separates current, rotated-completed and invalidated windows.
const wrongStatus: WindowRecord = { windowId: 0, status: 'buffering' };
// @ts-expect-error An active consumer names both itself and its window.
const incompleteConsumer: WindowConsumer = { observerId: 'A' };
// @ts-expect-error Active state owns complete window/input/consumer memory.
const incompleteActive: WindowState = { phase: 'Active', current: 0 };
// @ts-expect-error Stopped state explains its termination and retains observation memory.
const incompleteStopped: WindowState = { phase: 'Stopped', current: 0, boundaryLive: false, windows: [], consumers: [], usedObservers: [] };
// @ts-expect-error Boundary lifecycle is not a timer-fire event.
const wrongEvent: WindowEvent<number> = { type: 'timer.fire', now: 2 };
void [sourceValue, attach, initial, wrongValue, missingValue, missingError, missingWindow, wrongWindow,
  missingObserver, wrongToken, wrongStatus, incompleteConsumer, incompleteActive, incompleteStopped, wrongEvent];
