import {
 createTakeLastModel,createTapModel,createThrottleSignalModel,createThrottleTimeModel,
 createThrowIfEmptyModel,
 type TakeLastParameters,type TakeLastState,type TakeLastEvent,
 type TapParameters,type TapState,type TapEvent,
 type ThrottleParameters,type ThrottleState,type ThrottleEvent,
 type ThrowIfEmptyParameters,type ThrowIfEmptyState,type ThrowIfEmptyEvent
} from '../../src/index.js';

const take=createTakeLastModel<string>(2);
const tap=createTapModel<string>();
const signal=createThrottleSignalModel<string>({leading:true,trailing:true});
const timer=createThrottleTimeModel<string>(3,{leading:false,trailing:true});
const empty=createThrowIfEmptyModel<string>('custom');
void [take,tap,signal,timer,empty];

const takeParams:TakeLastParameters={count:2,policy:'completion FIFO flush'};
// @ts-expect-error count must be numeric
const badTakeCount:TakeLastParameters={count:'two',policy:'completion FIFO flush'};
// @ts-expect-error the buffering policy is not temporal
const badTakePolicy:TakeLastParameters={count:2,policy:'timer'};
const takeState:TakeLastState<string>={phase:'Active',pending:['x']};
// @ts-expect-error active FIFO memory is required
const badTakeState:TakeLastState<string>={phase:'Active'};
const takeEvent:TakeLastEvent<string>={type:'source.next',value:'x'};
// @ts-expect-error output source payload is string
const badTakeEvent:TakeLastEvent<string>={type:'source.next',value:99};

const tapParams:TapParameters={withNext:true,callbackId:'tap-next'};
// @ts-expect-error callback resource identity must be fixed
const badTapParams:TapParameters={withNext:true,callbackId:'other'};
const tapState:TapState<string>={phase:'Calling',index:0,value:'held'};
// @ts-expect-error calling state requires the held source value
const badTapState:TapState<string>={phase:'Calling',index:0};
const tapReturn:TapEvent<string>={type:'callback.return',resource:{id:'tap-next',generation:0}};
// @ts-expect-error callback occurrence must be correlated by resource
const badTapReturn:TapEvent<string>={type:'callback.return'};
const tapThrow:TapEvent<string>={type:'callback.throw',resource:{id:'tap-next',generation:0},error:'failure'};
// @ts-expect-error callback.throw carries an error
const badTapThrow:TapEvent<string>={type:'callback.throw',resource:{id:'tap-next',generation:0}};
// @ts-expect-error tap source payload is string
const badTapSource:TapEvent<string>={type:'source.next',value:100};

const throttleParams:ThrottleParameters={mode:'throttleTime',leading:true,trailing:false,duration:2};
// @ts-expect-error unsupported timing mode
const badThrottleMode:ThrottleParameters={mode:'timeout',leading:true,trailing:false,duration:2};
// @ts-expect-error leading is boolean, not numeric
const badThrottleLeading:ThrottleParameters={mode:'throttle',leading:1,trailing:false,duration:null};
const throttled:ThrottleState<string>={phase:'Active',pending:true,value:'x',window:0,nextWindow:1,due:4};
// @ts-expect-error active phase carries window generation and due memory
const badThrottleState:ThrottleState<string>={phase:'Active',pending:true,value:'x'};
const throttleSource:ThrottleEvent<string>={type:'source.next',value:'x',now:1};
// @ts-expect-error source notification requires virtual time
const badThrottleSource:ThrottleEvent<string>={type:'source.next',value:'x'};
// @ts-expect-error source payload is string
const badThrottlePayload:ThrottleEvent<string>={type:'source.next',value:55,now:1};
const timerFire:ThrottleEvent<string>={type:'timer.fire',resource:{id:'throttle-timer',generation:0},now:3};
// @ts-expect-error timer fire must carry resource identity
const badTimerResource:ThrottleEvent<string>={type:'timer.fire',now:3};
// @ts-expect-error timer fire must carry current virtual clock
const badTimerClock:ThrottleEvent<string>={type:'timer.fire',resource:{id:'throttle-timer',generation:0}};
const durationError:ThrottleEvent<string>={type:'duration.error',resource:{id:'duration',generation:0},error:Error()};
// @ts-expect-error duration error must carry error identity
const badDurationError:ThrottleEvent<string>={type:'duration.error',resource:{id:'duration',generation:0}};

const emptyConfig:ThrowIfEmptyParameters={factory:'custom'};
// @ts-expect-error only default/custom factory profiles supported
const badEmptyConfig:ThrowIfEmptyParameters={factory:'constant'};
const waitingFactory:ThrowIfEmptyState={phase:'CallingFactory'};
const customError:ThrowIfEmptyEvent<string>={type:'factory.return',resource:{id:'errorFactory',generation:0},value:Error()};
// @ts-expect-error custom factory return must contain error object/value
const badCustomError:ThrowIfEmptyEvent<string>={type:'factory.return',resource:{id:'errorFactory',generation:0}};
// @ts-expect-error custom factory requires resource identity
const badCustomRef:ThrowIfEmptyEvent<string>={type:'factory.return',value:Error()};
// @ts-expect-error source next value must be string
const badEmptySource:ThrowIfEmptyEvent<string>={type:'source.next',value:42};

void [takeParams,badTakeCount,badTakePolicy,takeState,badTakeState,takeEvent,badTakeEvent,
 tapParams,badTapParams,tapState,badTapState,tapReturn,badTapReturn,tapThrow,badTapThrow,
 badTapSource,throttleParams,badThrottleMode,badThrottleLeading,throttled,badThrottleState,
 throttleSource,badThrottleSource,badThrottlePayload,timerFire,badTimerResource,badTimerClock,
 durationError,badDurationError,emptyConfig,badEmptyConfig,waitingFactory,customError,
 badCustomError,badCustomRef,badEmptySource];
