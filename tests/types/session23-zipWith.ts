import { of, zipWith } from 'rxjs';
import type { Observable } from 'rxjs';
import { createZipWithModel } from '../../src/models/session23-zipWith.js';
import type { ZipParameters, ZipMemory, ZipState, ZipEvent } from '../../src/models/session23-zipWith.js';
const model = createZipWithModel<number>(3, 8);
const initial: ZipState = model.initialState();
const input: ZipEvent<number> = { type: 'input.next', index: 0, value: 1 };
const memory: ZipMemory = { queues: [[1], []], live: [true, true], received: [1, 0], emitted: 0 };
const parameters: ZipParameters = { operator: 'zipWith', inputCount: 2, bufferLimit: 8, projector: 'none' };
const heterogeneous: Observable<[number, string, boolean]> = of(1).pipe(zipWith(of('A'), of(true)));
const singleton: Observable<[number]> = of(1).pipe(zipWith());
// @ts-expect-error Input values retain the declared model payload type.
const wrongValue: ZipEvent<number> = { type: 'input.next', index: 0, value: 'x' };
// @ts-expect-error A next notification must carry its value even when undefined is valid.
const missingValue: ZipEvent<undefined> = { type: 'input.next', index: 0 };
// @ts-expect-error Each input notification identifies a connection.
const missingIndex: ZipEvent<number> = { type: 'input.complete' };
// @ts-expect-error Input indices are numbers.
const wrongIndex: ZipEvent<number> = { type: 'input.next', index: '0', value: 1 };
// @ts-expect-error An error notification retains the error payload.
const missingError: ZipEvent<number> = { type: 'input.error', index: 0 };
// @ts-expect-error zipWith introduces no scheduler event.
const timer: ZipEvent<number> = { type: 'timer.fire' };
// @ts-expect-error Active state requires all FIFO memory fields.
const incompleteActive: ZipState = { phase: 'Active', queues: [] };
// @ts-expect-error Closed state records a termination reason.
const incompleteClosed: ZipState = { phase: 'Closed' };
// @ts-expect-error Source completion alone is not a legal terminal-reason label.
const wrongReason: ZipState = { phase: 'Closed', reason: 'source-complete' };
// @ts-expect-error The canonical profile has tuple output without projection.
const projector: ZipParameters = { operator: 'zipWith', inputCount: 2, bufferLimit: 8, projector: 'custom' };
// @ts-expect-error The input count is numeric.
const wrongCount: ZipParameters = { operator: 'zipWith', inputCount: '2', bufferLimit: 8, projector: 'none' };
// @ts-expect-error FIFO memory cannot be mutated through its public readonly type.
memory.queues[0]!.push(2);
// @ts-expect-error Liveness is readonly state data.
memory.live[0] = false;
// @ts-expect-error zipWith does not expose the legacy result-selector signature.
const selector = of(1).pipe(zipWith(of(2), (a: number, b: number) => a + b));
// @ts-expect-error Heterogeneous output order follows source and argument order.
const wrongTuple: Observable<[string, number, boolean]> = heterogeneous;
void [initial, input, memory, parameters, singleton, wrongValue, missingValue, missingIndex, wrongIndex,
  missingError, timer, incompleteActive, incompleteClosed, wrongReason, projector, wrongCount, selector, wrongTuple];
