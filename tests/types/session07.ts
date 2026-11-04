import {
  createAuditModel,createAuditTimeModel,createBufferModel,createBufferCountModel,createBufferTimeModel
} from '../../src/index.js';
import type {
  AuditOperator,AuditEvent,AuditState,AuditParameters,
  BufferOperator,BufferEvent,BufferState,BufferParameters,BufferRecord,
  BufferTimeEvent,BufferTimeState,BufferTimeParameters,TimedBuffer
} from '../../src/index.js';

const auditModel=createAuditModel<number>();
const auditTimeModel=createAuditTimeModel<string>(3);
const bufferModel=createBufferModel<string>();
const counted=createBufferCountModel<number>(3,1);
const timed=createBufferTimeModel<string>(5,2,3);
const selected:AuditOperator='audit';
const countedOperator:BufferOperator='bufferCount';
const callback:AuditEvent<number>={type:'callback.return',now:0,resource:{id:'duration-selector',generation:0}};
const bufferValue:BufferEvent<string>={type:'source.next',value:'hello'};
const timer:BufferTimeEvent<string>={type:'window.fire',now:3,resource:{id:'buffer-window',generation:0}};
const settings:BufferTimeParameters={span:3,creationInterval:null,maxBufferSize:2};
const record:BufferRecord<number>={start:0,values:[1,2]};
const window:TimedBuffer<string>={id:0,startedAt:0,closesAt:3,values:['a']};
void [auditModel,auditTimeModel,bufferModel,counted,timed,selected,countedOperator,callback,bufferValue,timer,settings,record,window];

// @ts-expect-error duration must be number
createAuditTimeModel('3');
// @ts-expect-error buffer size must be number
createBufferCountModel('2');
// @ts-expect-error interval must be number or null
createBufferTimeModel(5,'2');
// @ts-expect-error maximum buffer size must be number or null
createBufferTimeModel(5,2,false);
// @ts-expect-error audit operator is a fixed union
const badAuditOperator:AuditOperator='debounce';
// @ts-expect-error buffer operator is a fixed union
const badBufferOperator:BufferOperator='bufferTime';
// @ts-expect-error audit source.next must carry T=number
const badAuditValue:AuditEvent<number>={type:'source.next',now:1,value:'text'};
// @ts-expect-error buffer source.next must carry T=number
const badBufferValue:BufferEvent<number>={type:'source.next',value:'text'};
// @ts-expect-error timer resource generation must be numeric
const badTimer:BufferTimeEvent<number>={type:'window.fire',now:3,resource:{id:'buffer-window',generation:'0'}};
// @ts-expect-error every audit event carries logical time
const badClock:AuditEvent<number>={type:'subscribe'};
// @ts-expect-error Pending audit state requires a duration identity and deadline
const missingDuration:AuditState<number>={phase:'Pending',now:1,nextId:1,value:2};
// @ts-expect-error active buffer state requires an array of records
const missingRecords:BufferState<number>={phase:'Active',seen:1,notifierLive:false};
// @ts-expect-error bufferTime Active state requires next timer identity counters
const missingTimers:BufferTimeState<number>={phase:'Active',now:0,windows:[],creationAt:null,creation:null};
// @ts-expect-error close reason is restricted
const invalidClose:BufferState<number>={phase:'Closed',reason:'timeout'};
// @ts-expect-error bufferCount parameter stride is numeric
const badParameters:BufferParameters={operator:'bufferCount',bufferSize:2,startBufferEvery:'one'};
// @ts-expect-error creation interval cannot be boolean
const badInterval:BufferTimeParameters={span:3,creationInterval:true,maxBufferSize:null};
// @ts-expect-error auditTime duration parameter cannot be null
const badAuditParameters:AuditParameters={operator:'auditTime',duration:null};
void [badAuditOperator,badBufferOperator,badAuditValue,badBufferValue,badTimer,badClock,missingDuration,
  missingRecords,missingTimers,invalidClose,badParameters,badInterval,badAuditParameters];
