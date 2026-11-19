import { createWithLatestFromModel } from '../../src/models/session22-withLatestFrom.js';
import type { LatestParameters, LatestEvent, LatestState, LatestMemory } from '../../src/models/session22-withLatestFrom.js';
const model = createWithLatestFromModel<number>(2);
const initial: LatestState = model.initialState();
const source: LatestEvent<number> = { type: 'source.next', value: 1 };
const auxiliary: LatestEvent<number> = { type: 'aux.next', index: 0, value: undefined };
const ready: LatestMemory = { latest: [1], hasValue: [true], live: [true], ready: true };
const parameters: LatestParameters = { inputCount: 2, projector: 'none' };
// @ts-expect-error Source payload must retain its value type.
const wrongValue: LatestEvent<number> = { type: 'source.next', value: 'x' };
// @ts-expect-error Source.next must carry its value even when undefined is valid.
const noValue: LatestEvent<undefined> = { type: 'source.next' };
// @ts-expect-error aux.next needs a numeric auxiliary index.
const noIndex: LatestEvent<number> = { type: 'aux.next', value: 'x' };
// @ts-expect-error Auxiliary complete needs the target index.
const noCompletionIndex: LatestEvent<number> = { type: 'aux.complete' };
// @ts-expect-error Auxiliary error must preserve its error field.
const noError: LatestEvent<number> = { type: 'aux.error', index: 0 };
// @ts-expect-error Auxiliary index must be numeric.
const wrongIndex: LatestEvent<number> = { type: 'aux.next', index: '0', value: 1 };
// @ts-expect-error A scheduler fire is not a legal withLatestFrom notification.
const timerEvent: LatestEvent<number> = { type: 'timer.fire' };
// @ts-expect-error Active state needs latest values, first-value bits and liveness.
const incompleteActive: LatestState = { phase: 'Active', ready: false };
// @ts-expect-error Closed state must specify why this execution terminated.
const incompleteClosed: LatestState = { phase: 'Closed' };
// @ts-expect-error The literal projector scope excludes custom projection.
const wrongProjector: LatestParameters = { inputCount: 2, projector: 'custom' };
// @ts-expect-error Readiness is an explicit boolean, not an optional field.
const incompleteMemory: LatestMemory = { latest: [], hasValue: [], live: [] };
void [initial, source, auxiliary, ready, parameters, wrongValue, noValue, noIndex, noCompletionIndex, noError,
  wrongIndex, timerEvent, incompleteActive, incompleteClosed, wrongProjector, incompleteMemory];
