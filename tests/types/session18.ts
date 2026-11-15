import {
  createRetryWhenModel, createRefCountModel, createSampleModel, createSampleTimeModel,
  createSequenceEqualModel,
  type RetryWhenParameters, type RetryWhenState, type RetryWhenEvent,
  type RefCountEvent, type RefCountState,
  type SamplingMode, type SamplingParameters, type SamplingState, type SamplingEvent,
  type SequenceEqualParameters, type SequenceEqualState, type SequenceEqualEvent
} from '../../src/index.js';

const retry=createRetryWhenModel<string>();
const ref=createRefCountModel<string>();
const sample=createSampleModel<string>();
const time=createSampleTimeModel<string>(3);
const compare=createSequenceEqualModel<string>();
void [retry,ref,sample,time,compare];

const retryConfig:RetryWhenParameters={notifier:'one-persistent-Observable',errorSignals:'exact-original-error'};
// @ts-expect-error notifier is one persistent Observable, not a timer
const badRetryConfig:RetryWhenParameters={notifier:'timer',errorSignals:'exact-original-error'};
const retryError:RetryWhenEvent<string>={type:'source.error',resource:{id:'source',generation:0},error:'fault'};
// @ts-expect-error error requires subscription generation
const badRetryError:RetryWhenEvent<string>={type:'source.error',error:'fault'};
// @ts-expect-error source.next value must match generic
const badRetryNext:RetryWhenEvent<string>={type:'source.next',resource:{id:'source',generation:0},value:42};
// @ts-expect-error notifier error always carries error payload
const badRetryNotifierError:RetryWhenEvent<string>={type:'notifier.error'};
const waiting:RetryWhenState={phase:'Waiting',generation:1,notifier:'open',reason:'none'};
// @ts-expect-error waiting requires open notifier
const badWaiting:RetryWhenState={phase:'Waiting',generation:1,notifier:'absent',reason:'none'};
// @ts-expect-error active state cannot claim terminal success
const badRetryState:RetryWhenState={phase:'Active',generation:0,notifier:'open',reason:'complete'};

const joining:RefCountEvent<string>={type:'subscriber.subscribe',subscriber:'A'};
// @ts-expect-error a subscriber occurrence needs a unique ID
const badJoining:RefCountEvent<string>={type:'subscriber.subscribe'};
// @ts-expect-error refCount source event needs generation
const badRefSource:RefCountEvent<string>={type:'source.next',value:'x'};
const refState:RefCountState={phase:'Disconnected',nextConnection:0,used:[]};
// @ts-expect-error Disconnected state lacks connection-generation counter
const badRefState:RefCountState={phase:'Disconnected',used:[]};

const mode:SamplingMode='sampleTime';
// @ts-expect-error only sample/sampleTime belong to sampling algebra
const badMode:SamplingMode='throttleTime';
const samplingParams:SamplingParameters={mode:'sampleTime',period:3};
// @ts-expect-error period is numeric or null, not a string duration
const badSamplingParams:SamplingParameters={mode:'sampleTime',period:'3ms'};
const remembered:SamplingState<string>={phase:'Listening',hasValue:true,lastValue:'x',notifier:'open',tick:0,due:3};
// @ts-expect-error listening requires a presence bit
const badRemembered:SamplingState<string>={phase:'Listening',lastValue:'x',notifier:'open',tick:0,due:3};
const sourceNext:SamplingEvent<string>={type:'source.next',value:'valid'};
// @ts-expect-error source.next generic payload type
const badSampleNext:SamplingEvent<string>={type:'source.next',value:100};
// @ts-expect-error timer.fire requires clock resource and time
const badSampleTick:SamplingEvent<string>={type:'timer.fire',now:3};
// @ts-expect-error notifier.error requires an error payload
const badSampleError:SamplingEvent<string>={type:'notifier.error'};

const equalParams:SequenceEqualParameters={comparator:'strict ===',maxPending:32};
// @ts-expect-error custom comparator is not a modeled profile
const badEqualParams:SequenceEqualParameters={comparator:'deep-equal',maxPending:32};
const seqLeft:SequenceEqualEvent<string>={type:'left.next',value:'a'};
// @ts-expect-error source-next payload is string
const badSeqValue:SequenceEqualEvent<string>={type:'right.next',value:3};
// @ts-expect-error unknown side is not a valid input
const badSeqSide:SequenceEqualEvent<string>={type:'third.next',value:'x'};
// @ts-expect-error sequence error requires error object
const badSeqError:SequenceEqualEvent<string>={type:'right.error'};
const seqState:SequenceEqualState<string>={phase:'Comparing',left:[],right:[],leftDone:false,rightDone:false};
// @ts-expect-error source completion bit is required
const badSeqState:SequenceEqualState<string>={phase:'Comparing',left:[],right:[],leftDone:false};
// @ts-expect-error Closed state must have a terminal reason
const badSeqTerminal:SequenceEqualState<string>={phase:'Closed'};

void [retryConfig,badRetryConfig,retryError,badRetryError,badRetryNext,badRetryNotifierError,
  waiting,badWaiting,badRetryState,joining,badJoining,badRefSource,refState,badRefState,
  mode,badMode,samplingParams,badSamplingParams,remembered,badRemembered,
  sourceNext,badSampleNext,badSampleTick,badSampleError,
  equalParams,badEqualParams,seqLeft,badSeqValue,badSeqSide,badSeqError,
  seqState,badSeqState,badSeqTerminal];
