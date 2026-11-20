import type { TimedEvent } from '../schema.js';
import { createZipFamilyModel } from './session23-zip-common.js';
import type { ZipEvent, ZipModel } from './session23-zip-common.js';
export type { ZipOperator, ZipParameters, ZipMemory, ZipState, ZipEvent, ZipModel } from './session23-zip-common.js';
export { zipInputRef } from './session23-zip-common.js';

/** The deprecated PIPEABLE zip export from rxjs/operators, with rest Observable arguments. */
export const createZipModel = <T>(inputCount = 3, bufferLimit = 8): ZipModel<T> =>
  createZipFamilyModel<T>('zip', inputCount, bufferLimit);

export const zipExample: readonly TimedEvent<ZipEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'input.next', index: 0, value: 'A1' } },
  { time: 2, event: { type: 'input.next', index: 0, value: 'A2' } },
  { time: 3, event: { type: 'input.next', index: 2, value: 'C1' } },
  { time: 4, event: { type: 'input.next', index: 1, value: 'B1' } },
  { time: 5, event: { type: 'input.next', index: 1, value: 'B2' } },
  { time: 6, event: { type: 'input.next', index: 2, value: 'C2' } },
  { time: 7, event: { type: 'input.complete', index: 0 } },
];
export const zipDrainExample: readonly TimedEvent<ZipEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'input.next', index: 0, value: 'A1' } },
  { time: 2, event: { type: 'input.next', index: 0, value: 'A2' } },
  { time: 3, event: { type: 'input.complete', index: 0 } },
  { time: 4, event: { type: 'input.next', index: 1, value: 'B1' } },
  { time: 5, event: { type: 'input.next', index: 2, value: 'C1' } },
  { time: 6, event: { type: 'input.next', index: 2, value: 'C2' } },
  { time: 7, event: { type: 'input.next', index: 1, value: 'B2' } },
];
export const zipCancelExample: readonly TimedEvent<ZipEvent<string>>[] = [
  { time: 0, event: { type: 'subscribe' } },
  { time: 1, event: { type: 'input.next', index: 2, value: 'queued' } },
  { time: 2, event: { type: 'input.complete', index: 2 } },
  { time: 3, event: { type: 'input.next', index: 0, value: 'waiting' } },
  { time: 4, event: { type: 'cancel' } },
];
