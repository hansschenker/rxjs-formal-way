import { createWindowWhenModel, runWindowWhenTrace } from '../../src/models/session22-windowWhen.js';
import type { WindowWhenParameters, WindowWhenToken, WindowWhenRecord, WindowWhenConsumer, WindowWhenState, WindowWhenEvent } from '../../src/models/session22-windowWhen.js';

const model = createWindowWhenModel<number>();
const value: WindowWhenEvent<number> = { type: 'source.next', value: 7 };
const factory: WindowWhenEvent<number> = { type: 'factory.return', generation: 0 };
const error: WindowWhenEvent<number> = { type: 'factory.throw', generation: 0, error: undefined };
const token: WindowWhenToken = { windowId: 0 };
const terminal: WindowWhenRecord = { windowId: 0, status: 'error', error: undefined };
const consumer: WindowWhenConsumer = { observerId: 'A', windowId: 0 };
const parameters: WindowWhenParameters = { closing: 'deferred-observable', factory: 'explicit-synchronous-outcomes' };
runWindowWhenTrace(model, [{ time: 0, event: { type: 'subscribe' } }, { time: 0, event: factory }], { executionId: 'typed' });
// @ts-expect-error Source values retain the caller's payload type.
const wrongValue: WindowWhenEvent<number> = { type: 'source.next', value: 'seven' };
// @ts-expect-error A source next must carry a value field, even when undefined is the chosen T.
const noValue: WindowWhenEvent<undefined> = { type: 'source.next' };
// @ts-expect-error Factory outcomes must identify their synchronous invocation.
const noGeneration: WindowWhenEvent<number> = { type: 'factory.return' };
// @ts-expect-error Factory failure preserves its error value.
const noError: WindowWhenEvent<number> = { type: 'factory.throw', generation: 0 };
// @ts-expect-error A closing notification identifies its current connection occurrence.
const noCloser: WindowWhenEvent<number> = { type: 'closing.complete' };
// @ts-expect-error Generation identities are numeric and cannot be opaque domain names.
const wrongGeneration: WindowWhenEvent<number> = { type: 'closing.next', generation: 'current' };
// @ts-expect-error This operator introduces no timer firing input.
const timer: WindowWhenEvent<number> = { type: 'timer.fire', generation: 0 };
// @ts-expect-error Window subscriptions must identify a retained window handle.
const noWindow: WindowWhenEvent<number> = { type: 'window.subscribe', observerId: 'A' };
// @ts-expect-error A child cancellation must identify its independently owned subscription.
const noObserver: WindowWhenEvent<number> = { type: 'window.unsubscribe' };
// @ts-expect-error Window tokens contain numeric occurrence identities.
const wrongToken: WindowWhenToken = { windowId: 'zero' };
// @ts-expect-error Failed windows must retain the failure value.
const missingFailure: WindowWhenRecord = { windowId: 0, status: 'error' };
// @ts-expect-error Subject disposal is not a windowWhen record status.
const disposed: WindowWhenRecord = { windowId: 0, status: 'disposed' };
// @ts-expect-error Selecting must explicitly say whether the source was already acquired.
const incompleteSelecting: WindowWhenState = { phase: 'Selecting', current: 0, windows: [], consumers: [], usedObservers: [] };
// @ts-expect-error A stopped execution requires its reason and retained window memory.
const incompleteStopped: WindowWhenState = { phase: 'Stopped' };
void [value, factory, error, token, terminal, consumer, parameters, wrongValue, noValue,
  noGeneration, noError, noCloser, wrongGeneration, timer, noWindow, noObserver,
  wrongToken, missingFailure, disposed, incompleteSelecting, incompleteStopped];
