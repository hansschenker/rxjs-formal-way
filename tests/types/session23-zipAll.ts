import { createZipAllModel } from '../../src/models/session23-zipAll.js';
import type { ZipAllEvent, ZipAllState, ZipAllSlot, ZipAllParameters } from '../../src/models/session23-zipAll.js';

const model = createZipAllModel<number>();
const initial: ZipAllState<number> = model.initialState();
const descriptor: ZipAllEvent<number> = { type: 'outer.next', value: { opaque: 'description' } };
const next: ZipAllEvent<number> = { type: 'inner.next', index: 0, value: 1 };
const collecting: ZipAllState<number> = { phase: 'Collecting', sources: ['inner'] };
const slot: ZipAllSlot<number> = { source: 'inner', queue: [1], live: false, received: 1 };
const parameters: ZipAllParameters = { maxInners: 8, bufferLimit: 8, projector: 'none' };

// @ts-expect-error Inner payloads preserve their declared value type.
const wrongPayload: ZipAllEvent<number> = { type: 'inner.next', index: 0, value: 'one' };
// @ts-expect-error A real undefined value must still be explicitly present.
const missingPayload: ZipAllEvent<undefined> = { type: 'inner.next', index: 0 };
// @ts-expect-error Inner notifications need an addressed occurrence index.
const missingIndex: ZipAllEvent<number> = { type: 'inner.next', value: 1 };
// @ts-expect-error The occurrence index is numeric.
const wrongIndex: ZipAllEvent<number> = { type: 'inner.complete', index: '0' };
// @ts-expect-error An inner error requires its exact error field.
const missingInnerError: ZipAllEvent<number> = { type: 'inner.error', index: 0 };
// @ts-expect-error An outer error requires its exact error field.
const missingOuterError: ZipAllEvent<number> = { type: 'outer.error' };
// @ts-expect-error Outer description presence is required even when its token is undefined.
const missingDescriptor: ZipAllEvent<number> = { type: 'outer.next' };
// @ts-expect-error zipAll has no timer input.
const clock: ZipAllEvent<number> = { type: 'timer.fire', index: 0 };
// @ts-expect-error Canonical tuple output does not admit projector result events.
const projector: ZipAllEvent<number> = { type: 'callback.return', value: 1 };
// @ts-expect-error Collecting needs ordered source occurrences.
const missingSources: ZipAllState<number> = { phase: 'Collecting' };
// @ts-expect-error Joining needs slots and emitted count.
const incompleteJoin: ZipAllState<number> = { phase: 'Joining', slots: [] };
// @ts-expect-error Closed executions carry a declared terminal reason.
const incompleteClosed: ZipAllState<number> = { phase: 'Closed' };
// @ts-expect-error Slot liveness is Boolean.
const invalidSlot: ZipAllSlot<number> = { source: 'x', queue: [], live: 'yes', received: 0 };
// @ts-expect-error Queue elements preserve T.
const wrongQueue: ZipAllSlot<number> = { source: 'x', queue: ['one'], live: true, received: 1 };
// @ts-expect-error Parameters explicitly exclude optional projection.
const wrongProjector: ZipAllParameters = { maxInners: 8, bufferLimit: 8, projector: 'custom' };
// @ts-expect-error Queues are immutable snapshots.
slot.queue.push(2);
void [initial, descriptor, next, collecting, slot, parameters, wrongPayload, missingPayload, missingIndex, wrongIndex,
  missingInnerError, missingOuterError, missingDescriptor, clock, projector, missingSources, incompleteJoin,
  incompleteClosed, invalidSlot, wrongQueue, wrongProjector];
