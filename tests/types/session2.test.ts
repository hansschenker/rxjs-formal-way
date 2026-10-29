import { createSwitchMapModel, createMergeMapModel, createConcatMapModel, createExhaustMapModel } from '../../src/models/flatten.js';
import type { FlattenEvent, FlattenState } from '../../src/models/flatten.js';
import { createShareModel } from '../../src/models/share.js';
import type { ShareEvent, ShareState } from '../../src/models/share.js';
import { stepModel } from '../../src/runner.js';

const switched = createSwitchMapModel<number, string, { key: string }>();
const sourceEvent: FlattenEvent<number, string, { key: string }> = { type: 'callback.return', resource: { id: 'project', generation: 0 }, value: { key: 'source' } };
void sourceEvent;
// @ts-expect-error outer input must be number
const badOuter: FlattenEvent<number, string> = { type: 'outer.next', value: 'not-a-number' };
// @ts-expect-error inner output must be string
const badInner: FlattenEvent<number, string> = { type: 'inner.next', resource: { id: 'inner', generation: 0 }, value: 2 };
// @ts-expect-error source token type is distinct from both input and output
const badReturn: FlattenEvent<number, string, { key: string }> = { type: 'callback.return', resource: { id: 'project', generation: 0 }, value: 'wrong' };
// @ts-expect-error inner notifications require a generation-qualified resource
const missingResource: FlattenEvent<number, string> = { type: 'inner.complete' };
// @ts-expect-error active memory requires an explicit queue
const missingQueue: FlattenState<number> = { phase: 'Active', index: 0, active: [] };
// @ts-expect-error Calling must record a resume phase and invocation identity
const missingCall: FlattenState<number> = { phase: 'Calling', index: 1, active: [], queue: [], input: 1 };
// @ts-expect-error fixed parameters are readonly
switched.parameters.callbackId = 'changed';
// @ts-expect-error concurrency is numeric at the public factory
createMergeMapModel('two');
// @ts-expect-error concatMap takes a binding ID, not a concurrency option
createConcatMapModel(2);
// @ts-expect-error exhaustMap takes a binding ID
createExhaustMapModel({ concurrent: 2 });
const sharing = createShareModel<string>();
// @ts-expect-error boolean reset profile does not accept notifiers
createShareModel({ resetOnError: () => true });
// @ts-expect-error custom connector is outside this model profile
createShareModel({ connector: () => ({}) });
// @ts-expect-error addressed subscription event requires the subscriber ID
const missingSubscriber: ShareEvent<string> = { type: 'subscriber.subscribe' };
// @ts-expect-error source payload must remain string
const badBroadcast: ShareEvent<string> = { type: 'source.next', resource: { id: 'source', generation: 0 }, value: 4 };
// @ts-expect-error a retained error must contain its thrown value
const missingError: ShareState = { phase: 'Errored', nextConnection: 1, used: [] };
// @ts-expect-error reset parameters are readonly
sharing.parameters.resetOnError = false;
void [badOuter, badInner, badReturn, missingResource, missingQueue, missingCall, missingSubscriber, badBroadcast, missingError];
stepModel(sharing, sharing.initialState(), { type: 'subscriber.subscribe', subscriber: 'A' });
