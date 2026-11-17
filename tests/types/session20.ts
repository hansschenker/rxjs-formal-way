import { createTakeLastModel, createThrowIfEmptyModel } from '../../src/models/session20-terminal.js';
import type { TakeLastState, TakeLastEvent, ThrowIfEmptyEvent } from '../../src/models/session20-terminal.js';
import { createTapModel } from '../../src/models/session20-tap.js';
import type { TapState, TapEvent } from '../../src/models/session20-tap.js';
import { createThrottleModel, createThrottleTimeModel } from '../../src/models/session20-throttle.js';
import type { ThrottleState, ThrottleEvent } from '../../src/models/session20-throttle.js';

createTakeLastModel<number>(2);
createThrowIfEmptyModel<number>('custom');
createTapModel<number>(['next','finalize']);
createThrottleModel<number>({leading:true,trailing:true});
createThrottleTimeModel<number>(4,{leading:false,trailing:true});

// @ts-expect-error Count is numeric, not string configuration.
createTakeLastModel('2');
// @ts-expect-error Collecting state requires FIFO memory.
const missingBuffer: TakeLastState<number> = {phase:'Collecting'};
// @ts-expect-error FIFO payload type is preserved.
const wrongBuffer: TakeLastState<number> = {phase:'Collecting',buffer:['x']};
// @ts-expect-error A completed state must declare its reason.
const missingReason: TakeLastState<number> = {phase:'Closed'};
// @ts-expect-error Source next requires its value.
const missingNext: TakeLastEvent<number> = {type:'source.next'};
// @ts-expect-error A value event cannot smuggle a string into number flow.
const wrongNext: TakeLastEvent<number> = {type:'source.next',value:'x'};
// @ts-expect-error Only the two declared factory bindings are legal.
createThrowIfEmptyModel('unknown');
// @ts-expect-error Factory return is correlated to a resource.
const uncorrelatedReturn: ThrowIfEmptyEvent<number> = {type:'callback.return',value:'fault'};
// @ts-expect-error Factory throw requires an error payload (which may itself be undefined).
const missingThrow: ThrowIfEmptyEvent<number> = {type:'callback.throw',resource:{id:'errorFactory',generation:0}};
// @ts-expect-error Hook names are closed, not arbitrary callback labels.
createTapModel(['finish']);
// @ts-expect-error Calling state retains the exact pending notification.
const incompleteCall: TapState<number> = {phase:'Calling',invocation:0,hook:'next'};
// @ts-expect-error Notification payload type is maintained in pending state.
const wrongPending: TapState<number> = {phase:'Calling',invocation:0,hook:'next',pending:{kind:'N',value:'x'}};
// @ts-expect-error Callback identity generation is numeric.
const wrongGeneration: TapEvent<number> = {type:'callback.return',resource:{id:'tap.next',generation:'0'}};
// @ts-expect-error Callback throw always has an error field.
const incompleteTapThrow: TapEvent<number> = {type:'callback.throw',resource:{id:'tap.next',generation:0}};
// @ts-expect-error Leading is boolean, not a truthy string.
createThrottleModel({leading:'yes'});
// @ts-expect-error Trailing is boolean, not a count.
createThrottleTimeModel(4,{trailing:1});
// @ts-expect-error Fixed duration is numeric.
createThrottleTimeModel('4');
// @ts-expect-error Every throttle event explicitly supplies time.
const noClock: ThrottleEvent<number> = {type:'source.next',value:1};
// @ts-expect-error Timer input names its current resource generation.
const noTimerIdentity: ThrottleEvent<number> = {type:'timer.fire',now:4};
// @ts-expect-error A selector return carries a source token.
const noDurationToken: ThrottleEvent<number> = {type:'callback.return',resource:{id:'durationSelector',generation:0},now:1};
// @ts-expect-error Pending numeric source values cannot be replaced by strings.
const wrongThrottleValue: ThrottleEvent<number> = {type:'source.next',value:'x',now:1};
// @ts-expect-error A live throttled state requires its generation and due/token representation.
const incompleteGate: ThrottleState<number> = {phase:'Throttled',clock:1,nextGeneration:1,hasValue:false,value:null};
// @ts-expect-error Only the declared lifecycle reasons are accepted.
const wrongClosed: ThrottleState<number> = {phase:'Closed',clock:2,reason:'timeout'};
void [missingBuffer,wrongBuffer,missingReason,missingNext,wrongNext,uncorrelatedReturn,missingThrow,incompleteCall,
  wrongPending,wrongGeneration,incompleteTapThrow,noClock,noTimerIdentity,noDurationToken,wrongThrottleValue,incompleteGate,wrongClosed];
