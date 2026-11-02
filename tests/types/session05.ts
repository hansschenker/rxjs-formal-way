import { createSkipModel, createTakeWhileModel, createSkipWhileModel, createTakeUntilModel, createSkipUntilModel } from '../../src/index.js';
import type { SkipState, SkipParameters, SkipEvent, WhileState, WhileEvent, UntilState, UntilParameters, UntilEvent } from '../../src/index.js';

const skipModel = createSkipModel<number>(2);
const whileModel = createTakeWhileModel<number>(true);
const skipWhileModel = createSkipWhileModel<string>();
const takeUntilModel = createTakeUntilModel<number>();
const skipUntilModel = createSkipUntilModel<string>();
const positiveSkip: SkipState = { phase: 'Active', index: 0 };
const positiveWhile: WhileState<number> = { phase: 'Calling', index: 1, callId: 0, input: 0 };
const positiveUntil: UntilEvent<string> = { type: 'notifier.next', resource: { id: 'notifier', generation: 0 }, value: undefined };
void [skipModel, whileModel, skipWhileModel, takeUntilModel, skipUntilModel, positiveSkip, positiveWhile, positiveUntil];

// @ts-expect-error count is numeric
createSkipModel('2');
// @ts-expect-error index is numeric
const badSkipIndex: SkipState = { phase: 'Active', index: 'two' };
// @ts-expect-error source payload type must match
const badSkipPayload: SkipEvent<number> = { type: 'source.next', value: 'two' };
const parameters: SkipParameters = { count: 1 };
// @ts-expect-error parameters are immutable
parameters.count = 2;
// @ts-expect-error callback outcome requires invocation identity
const missingIdentity: WhileEvent<number> = { type: 'callback.return', value: true };
// @ts-expect-error callback resource requires a generation
const missingGeneration: WhileEvent<number> = { type: 'callback.throw', resource: { id: 'predicate' }, error: null };
// @ts-expect-error retained input type must match
const wrongRetainedInput: WhileState<number> = { phase: 'Calling', index: 1, callId: 0, input: 'x' };
// @ts-expect-error calling requires callId
const missingCallId: WhileState<number> = { phase: 'Calling', index: 1, input: 1 };
// @ts-expect-error inclusive is boolean
createTakeWhileModel('yes');
// @ts-expect-error notifier termination is not a predicate close reason
const wrongWhileReason: WhileState<number> = { phase: 'Closed', reason: 'notifier-next' };
// @ts-expect-error predicate source value must match T
const wrongWhileValue: WhileEvent<number> = { type: 'source.next', value: 'x' };
// @ts-expect-error notifier notifications require resource identity
const missingNotifier: UntilEvent<number> = { type: 'notifier.next', value: 1 };
// @ts-expect-error notifier generation is numeric
const badNotifierGeneration: UntilEvent<number> = { type: 'notifier.complete', resource: { id: 'notifier', generation: '0' } };
// @ts-expect-error source payload must match T, independently of notifier payload
const badUntilValue: UntilEvent<number> = { type: 'source.next', value: 'x' };
// @ts-expect-error gate state is boolean
const badGate: UntilState = { phase: 'Active', open: 'yes', notifierLive: true };
// @ts-expect-error stopped-before-source is the synchronous notifier-error case
const badSetupReason: UntilState = { phase: 'StoppedBeforeSource', reason: 'complete' };
// @ts-expect-error until parameters cannot select a predicate operator
const badUntilOperator: UntilParameters = { operator: 'takeWhile' };
// @ts-expect-error notifier gates do not consume predicate outcomes
const badUntilCallback: UntilEvent<number> = { type: 'callback.return', resource: { id: 'predicate', generation: 0 }, value: true };
void [badSkipIndex, badSkipPayload, missingIdentity, missingGeneration, wrongRetainedInput, missingCallId, wrongWhileReason,
  wrongWhileValue, missingNotifier, badNotifierGeneration, badUntilValue, badGate, badSetupReason, badUntilOperator, badUntilCallback];
