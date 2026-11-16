import {
  createSingleModel, createSkipLastModel, createSubscribeOnModel,
  createSwitchMapToModel, createSwitchScanModel,
  type SingleParameters, type SingleState, type SingleEvent,
  type SkipLastParameters, type SkipLastState, type SkipLastEvent,
  type SubscribeOnParameters, type SubscribeOnState, type SubscribeOnEvent,
  type SwitchMapToEvent, type SwitchScanParameters, type SwitchScanState,
  type SwitchScanEvent, type SwitchScanCallback
} from '../../src/index.js';

const single=createSingleModel<string>(true);
const skip=createSkipLastModel<string>(2);
const deferred=createSubscribeOnModel<string>(2);
const constant=createSwitchMapToModel<number,string,string>('same');
const scan=createSwitchScanModel<number,number,string>(0);
void [single,skip,deferred,constant,scan];

const singleConfig:SingleParameters={predicate:true,predicateId:'predicate'};
// @ts-expect-error predicate is required in canonical configuration
const badSingleConfig:SingleParameters={predicateId:'predicate'};
const singleCall:SingleEvent<string>={type:'callback.return',resource:{id:'predicate',generation:0},value:true};
// @ts-expect-error callback event must carry resource correlation
const badSingleCall:SingleEvent<string>={type:'callback.return',value:true};
// @ts-expect-error predicate return must be a boolean
const badSingleBoolean:SingleEvent<string>={type:'callback.return',resource:{id:'predicate',generation:0},value:1};
// @ts-expect-error source payload is string
const badSingleValue:SingleEvent<string>={type:'source.next',value:1};
const singleState:SingleState<string>={phase:'Active',seen:true,hasValue:true,value:'only',index:0};
// @ts-expect-error calling state must retain candidate
const badSingleState:SingleState<string>={phase:'Calling',seen:true,hasValue:false,value:undefined,index:0};
// @ts-expect-error terminal state requires a reason
const badSingleClose:SingleState<string>={phase:'Closed'};

const skipParams:SkipLastParameters={count:2,policy:'bounded FIFO'};
// @ts-expect-error unsupported skipLast policy
const badSkipParams:SkipLastParameters={count:2,policy:'timer'};
const skipEvent:SkipLastEvent<string>={type:'source.next',value:'v'};
// @ts-expect-error source.next payload must be string
const badSkipEvent:SkipLastEvent<string>={type:'source.next',value:42};
const skipState:SkipLastState<string>={phase:'Active',pending:['a'],seen:1};
// @ts-expect-error Active skipLast state requires pending FIFO
const badSkipState:SkipLastState<string>={phase:'Active',seen:1};

const subParams:SubscribeOnParameters={delay:2,scheduler:'virtual FIFO deferred'};
// @ts-expect-error scheduler profile is not synchronous queueScheduler
const badSubParams:SubscribeOnParameters={delay:2,scheduler:'queueScheduler'};
const wake:SubscribeOnEvent<string>={type:'timer.fire',resource:{id:'subscription-action',generation:0},now:2};
// @ts-expect-error scheduled callback must carry clock value
const badWake:SubscribeOnEvent<string>={type:'timer.fire',resource:{id:'subscription-action',generation:0}};
// @ts-expect-error scheduled event needs resource
const badWakeResource:SubscribeOnEvent<string>={type:'timer.fire',now:2};
const pending:SubscribeOnState={phase:'Pending',deadline:2};
// @ts-expect-error Pending subscription must have a deadline
const badPending:SubscribeOnState={phase:'Pending'};

const constantEvent:SwitchMapToEvent<number,string,string>={
  type:'callback.return',resource:{id:'constant',generation:0},value:'same'
};
// @ts-expect-error switchMapTo output from inner is a string
const badConstantOutput:SwitchMapToEvent<number,string,string>={
  type:'inner.next',resource:{id:'inner',generation:0},value:123
};
// @ts-expect-error outer input type is number
const badConstantOuter:SwitchMapToEvent<number,string,string>={type:'outer.next',value:'bad'};
const scanEvent:SwitchScanEvent<number,number,string>={
  type:'inner.next',resource:{id:'inner',generation:0},value:5
};
// @ts-expect-error accumulator inner result type is number
const badScanEvent:SwitchScanEvent<number,number,string>={
  type:'inner.next',resource:{id:'inner',generation:0},value:'wrong'
};
const accumulatorInput:SwitchScanCallback<number,number>={accumulator:0,value:5};
// @ts-expect-error callback must include accumulator snapshot
const badAccumulatorInput:SwitchScanCallback<number,number>={value:5};
const scanParams:SwitchScanParameters<number>={operator:'switchMap',concurrent:1,callbackId:'accumulator',seed:0};
// @ts-expect-error accumulator seed is numeric
const badScanParams:SwitchScanParameters<number>={operator:'switchMap',concurrent:1,callbackId:'accumulator',seed:'wrong'};
const scanState:SwitchScanState<number,string,number>={phase:'Unsubscribed',accumulator:0};
// @ts-expect-error every state carries initial or updated accumulator
const badScanState:SwitchScanState<number,string,number>={phase:'Unsubscribed'};

void [singleConfig,badSingleConfig,singleCall,badSingleCall,badSingleBoolean,badSingleValue,
  singleState,badSingleState,badSingleClose,skipParams,badSkipParams,skipEvent,badSkipEvent,
  skipState,badSkipState,subParams,badSubParams,wake,badWake,badWakeResource,pending,badPending,
  constantEvent,badConstantOutput,badConstantOuter,scanEvent,badScanEvent,accumulatorInput,
  badAccumulatorInput,scanParams,badScanParams,scanState,badScanState];
