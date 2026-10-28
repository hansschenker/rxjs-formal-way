import { createMapModel, createFilterModel, stepModel } from '../../src/index.js';
import type { MapEvent, MapState, FilterEvent, CallbackInvocation, Action } from '../../src/index.js';
const m = createMapModel<number, string>();
stepModel(m, m.initialState(), { type: 'subscribe' });
const success: MapEvent<number, string> = { type: 'callback.return', resource: { id: 'project', generation: 0 }, value: 'ok' };
const filterRuntimeTruthiness: FilterEvent<number> = { type: 'callback.return', resource: { id: 'predicate', generation: 0 }, value: {} };
const f = createFilterModel<number>();
void success; void filterRuntimeTruthiness; void f;
// @ts-expect-error map input payload must be numeric
const badInput: MapEvent<number, string> = { type: 'source.next', value: 'bad' };
// @ts-expect-error map outcome must match the declared output type
const badOutput: MapEvent<number, string> = { type: 'callback.return', resource: { id: 'project', generation: 0 }, value: 123 };
// @ts-expect-error callback identity must include its invocation generation
const missingIdentity: MapEvent<number, string> = { type: 'callback.throw', resource: { id: 'project' }, error: 'bad' };
// @ts-expect-error Calling retains its pending input
const missingInput: MapState<number> = { phase: 'Calling', index: 1, callId: 0 };
// @ts-expect-error invocation input type is independent of output type
const badRequest: CallbackInvocation<number> = { type: 'invoke-callback', resource: { id: 'project', generation: 0 }, value: 'bad', index: 0 };
// @ts-expect-error callback throw is an input event, not a downstream notification kind
const wrongChannel: Action<string> = { type: 'notify', target: 'downstream', notification: { kind: 'callback.throw', error: 'bad' } };
// @ts-expect-error parameters are readonly
m.parameters.callbackId = 'changed';
// @ts-expect-error unsupported timer event in this profile
const unsupported: MapEvent<number, string> = { type: 'timer.fire' };
