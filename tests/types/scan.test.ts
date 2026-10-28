import type { Action } from '../../src/schema.js';
import { createSeededScanModel, createUnseededScanModel } from '../../src/models/scan.js';
import type { ScanEvent, ScanArguments, ScanState } from '../../src/models/scan.js';

const seeded = createSeededScanModel<number, string, boolean>(false);
const unseeded = createUnseededScanModel<number, string>();
const state = seeded.initialState();
const valid: ScanEvent<number, string> = { type: 'callback.return', resource: { id: 'accumulator', generation: 0 }, value: 'sum' };
seeded.rules[0]?.react(state, valid, seeded.parameters);
const first: Action<number | string, ScanArguments<number, number | string>> = { type: 'notify', target: 'downstream', notification: { kind: 'N', value: 3 } };
void [unseeded, first];
// @ts-expect-error source payload is numeric
const wrongInput: ScanEvent<number, string> = { type: 'source.next', value: 'bad' };
// @ts-expect-error reducer result must be string
const wrongReturn: ScanEvent<number, string> = { type: 'callback.return', resource: { id: 'accumulator', generation: 0 }, value: 4 };
// @ts-expect-error seed generic is boolean, not numeric
createSeededScanModel<number, string, boolean>(0);
// @ts-expect-error seeded factory requires a seed argument
createSeededScanModel<number, number>();
// @ts-expect-error invocation payload must contain previous accumulation
const missingAccumulation: ScanArguments<number, string> = { value: 2 };
// @ts-expect-error input component remains numeric
const wrongProduct: ScanArguments<number, string> = { accumulator: 'a', value: false };
// @ts-expect-error active state needs a stored accumulation even when undefined is allowed
const incompleteState: ScanState<number, undefined> = { phase: 'Active', index: 0 };
// @ts-expect-error calling state needs a correlated invocation identity
const incompleteCall: ScanState<number, number> = { phase: 'Calling', index: 1, accumulator: 0, input: 2 };
// @ts-expect-error seeded result output does not include the numeric input or boolean seed
const badOutput: Parameters<typeof seeded.validateReaction>[2]['actions'][number] = { type: 'notify', target: 'downstream', notification: { kind: 'N', value: 3 } };
// @ts-expect-error readonly parameter cannot be reassigned
seeded.parameters.callbackId = 'changed';
void [wrongInput, wrongReturn, missingAccumulation, wrongProduct, incompleteState, incompleteCall, badOutput];
