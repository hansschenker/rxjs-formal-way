import type { TimedEvent } from '../schema.js';
import { createZipFamilyModel } from './session23-zip-common.js';
import type { ZipEvent, ZipModel } from './session23-zip-common.js';

export type { ZipParameters, ZipMemory, ZipState, ZipEvent, ZipModel } from './session23-zip-common.js';

/** The pinned zipWith export uses the same FIFO policy as pipeable zip. */
export const createZipWithModel = <T = unknown>(inputCount = 3, bufferLimit = 8): ZipModel<T> =>
  createZipFamilyModel<T>('zipWith', inputCount, bufferLimit);

/** Three differently paced inputs retain arrival order within each input. */
export const zipWithExample: readonly TimedEvent<ZipEvent<unknown>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'input.next', index: 0, value: 'A1' } },
  { time: 2, event: { type: 'input.next', index: 0, value: 'A2' } },
  { time: 3, event: { type: 'input.next', index: 1, value: 'B1' } },
  { time: 4, event: { type: 'input.next', index: 2, value: 'C1' } },
  { time: 5, event: { type: 'input.next', index: 2, value: 'C2' } },
  { time: 6, event: { type: 'input.next', index: 1, value: 'B2' } },
  { time: 7, event: { type: 'input.complete', index: 0 } },
];

/** A completed producer's buffered values remain available until their last tuple. */
export const zipWithDrainExample: readonly TimedEvent<ZipEvent<unknown>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'input.next', index: 0, value: 'A1' } },
  { time: 2, event: { type: 'input.next', index: 0, value: 'A2' } },
  { time: 3, event: { type: 'input.complete', index: 0 } },
  { time: 4, event: { type: 'input.next', index: 1, value: 'B1' } },
  { time: 5, event: { type: 'input.next', index: 2, value: 'C1' } },
  { time: 6, event: { type: 'input.next', index: 1, value: 'B2' } },
  { time: 7, event: { type: 'input.complete', index: 1 } },
  { time: 8, event: { type: 'input.next', index: 2, value: 'C2' } },
];

/** Result cancellation discards unmatched buffers and releases every live input. */
export const zipWithCancelExample: readonly TimedEvent<ZipEvent<unknown>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'input.next', index: 0, value: { pending: 'A' } } },
  { time: 2, event: { type: 'input.next', index: 1, value: undefined } },
  { time: 3, event: { type: 'cancel' } },
];
