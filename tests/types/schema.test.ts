import { createTakeModel, stepModel } from '../../src/index.js';
import type { TakeEvent, TakeState, Action } from '../../src/index.js';
const model = createTakeModel<number>(2);
stepModel(model, model.initialState(), { type: 'source.next', value: 1 }); // runtime rejects this lifecycle combination
// @ts-expect-error Payloads retain the selected type.
const wrongValue: TakeEvent<number> = { type: 'source.next', value: 'bad' };
// @ts-expect-error take has no inner event alphabet.
const wrongEvent: TakeEvent<number> = { type: 'inner.next', value: 1 };
// @ts-expect-error Active counters are required.
const incomplete: TakeState = { phase: 'Active' };
// @ts-expect-error Cancellation is not a downstream notification kind.
const cancel: Action<number> = { type: 'notify', target: 'downstream', notification: { kind: 'cancel' } };
// @ts-expect-error A resource command needs a generation.
const resource: Action<number> = { type: 'subscribe', resource: { id: 'source' } };
// @ts-expect-error State is immutable to consumers.
model.parameters.count = 3;
void [wrongValue, wrongEvent, incomplete, cancel, resource];
