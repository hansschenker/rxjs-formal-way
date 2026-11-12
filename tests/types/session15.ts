import {
 createMergeWithModel, createMulticastModel, createObserveOnModel,
 createOnErrorResumeNextModel, createPartitionModel,
 type MergeEvent, type ConnectEvent, type ObserveOnEvent, type ObserveOnState,
 type ScheduledNotification, type ResumeNextEvent, type ResumeNextState,
 type PartitionEvent, type PartitionState, type PartitionSlot, type PartitionBranch,
} from '../../src/index.js';

const merge=createMergeWithModel<number>(2);
const multicast=createMulticastModel<string>();
const scheduled=createObserveOnModel<string>(3);
const resume=createOnErrorResumeNextModel<number>(2);
const partition=createPartitionModel<string>();
const branch:PartitionBranch='pass';
void [merge,multicast,scheduled,resume,partition,branch];

const mergeEvent:MergeEvent<number>={type:'input.next',resource:{id:'input',generation:0},value:1};
// @ts-expect-error merge input.next requires matching numeric value type
const wrongMergeEvent:MergeEvent<number>={type:'input.next',resource:{id:'input',generation:0},value:'wrong'};
// @ts-expect-error input.next requires a subscription resource identity
const missingMergeResource:MergeEvent<number>={type:'input.next',value:1};
const selectorEvent:ConnectEvent<string>={type:'selector.return',resource:{id:'selector',generation:0}};
// @ts-expect-error selector.return requires a resource
const missingSelector:ConnectEvent<string>={type:'selector.return'};
// @ts-expect-error source.next in multicast requires a string
const wrongMulticastNext:ConnectEvent<string>={type:'source.next',value:44};

const scheduledNext:ObserveOnEvent<string>={type:'source.next',value:'a',now:1};
// @ts-expect-error source.next must have a clock input
const wrongScheduledTime:ObserveOnEvent<string>={type:'source.next',value:'a'};
// @ts-expect-error observeOn value must remain string
const wrongScheduledValue:ObserveOnEvent<string>={type:'source.next',value:0,now:2};
// @ts-expect-error timer.fire requires the scheduled timer resource
const wrongTimer:ObserveOnEvent<string>={type:'timer.fire',now:5};
const scheduledError:ScheduledNotification<string>={kind:'E',error:'same',id:0,due:5};
// @ts-expect-error error entry cannot have a value payload
const wrongScheduledError:ScheduledNotification<string>={kind:'E',value:'not a source value',id:0,due:5};
// @ts-expect-error active scheduled state must include FIFO pending queue
const wrongScheduledState:ObserveOnState<string>={phase:'Active',sourceLive:true,nextId:0,lastSourceTime:0};

const resumeNext:ResumeNextEvent<number>={type:'input.next',resource:{id:'input',generation:0},value:3};
// @ts-expect-error source positions require resource identity
const invalidResumeNext:ResumeNextEvent<number>={type:'input.next',value:3};
// @ts-expect-error input.next is numeric
const invalidResumeValue:ResumeNextEvent<number>={type:'input.next',resource:{id:'input',generation:0},value:'x'};
// @ts-expect-error active state requires total count
const invalidResumeState:ResumeNextState={phase:'Active',current:0};

const partitionNext:PartitionEvent<string>={type:'source.next',branch:'fail',value:'x'};
const partitionResult:PartitionEvent<string>={type:'predicate.return',resource:{id:'predicate-fail',generation:0},result:false};
// @ts-expect-error partition cannot route to an unknown branch
const invalidPartitionBranch:PartitionEvent<string>={type:'source.next',branch:'both',value:'x'};
// @ts-expect-error predicate.return must have boolean result
const wrongPartitionOutcome:PartitionEvent<string>={type:'predicate.return',resource:{id:'predicate-pass',generation:0},result:0};
// @ts-expect-error source.next requires a payload
const missingPartitionValue:PartitionEvent<string>={type:'source.next',branch:'pass'};
// @ts-expect-error branch must include independent callback counter
const wrongPartitionSlot:PartitionSlot<string>={status:'live',pending:null};
// @ts-expect-error active state requires two independent branch records
const wrongPartitionState:PartitionState<string>={phase:'Active',pass:{status:'live',index:0,pending:null}};

void [mergeEvent,wrongMergeEvent,missingMergeResource,selectorEvent,missingSelector,wrongMulticastNext,
 scheduledNext,wrongScheduledTime,wrongScheduledValue,wrongTimer,scheduledError,wrongScheduledError,wrongScheduledState,
 resumeNext,invalidResumeNext,invalidResumeValue,invalidResumeState,partitionNext,partitionResult,
 invalidPartitionBranch,wrongPartitionOutcome,missingPartitionValue,wrongPartitionSlot,wrongPartitionState];
