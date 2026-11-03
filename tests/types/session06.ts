import {
  createSeededReduceModel,createUnseededReduceModel,createCountModel,
  createToArrayModel,createMinModel,createMaxModel
} from '../../src/index.js';
import type {
  AggregateState,AggregateEvent,AggregateParameters,AggregateMemory,AggregateArguments,AggregateOperator
} from '../../src/index.js';
const seeded=createSeededReduceModel<number,number>(0);
const unseeded=createUnseededReduceModel<string>();
const counted=createCountModel<{value:number}>(true);
const arrayed=createToArrayModel<string>();
const minimum=createMinModel<{rank:number}>(true);
const maximum=createMaxModel<number>();
const ready:AggregateState<string,number>={phase:'Collecting',index:0,memory:{present:true,value:0}};
const callback:AggregateEvent<number>={type:'callback.return',resource:{id:'aggregate-callback',generation:0},value:3};
const args:AggregateArguments<number,number>={previous:1,incoming:2};
void [seeded,unseeded,counted,arrayed,minimum,maximum,ready,callback,args];

// @ts-expect-error min comparator profile flag is boolean
createMinModel('custom');
// @ts-expect-error count predicate-profile flag is boolean
createCountModel('predicate');
// @ts-expect-error typed source payload must be numeric
const badEvent:AggregateEvent<number>={type:'source.next',value:'abc'};
// @ts-expect-error callback generation is a number
const badGeneration:AggregateEvent<number>={type:'callback.throw',resource:{id:'aggregate-callback',generation:'0'},error:0};
// @ts-expect-error callback outcome requires a resource
const noResource:AggregateEvent<number>={type:'callback.return',value:0};
// @ts-expect-error Calling state must retain its input
const badCalling:AggregateState<number,number>={phase:'Calling',index:1,callId:0,memory:{present:true,value:0}};
// @ts-expect-error close reason is a restricted union
const badClose:AggregateState<number,number>={phase:'Closed',reason:'timeout'};
// @ts-expect-error cannot provide a missing memory's value
const badMissing:AggregateMemory<number>={present:false,value:42};
// @ts-expect-error count mode is a fixed profile union
const badParameters:AggregateParameters<number>={operator:'count',mode:'unknown',callbackId:'callback',seed:{present:true,value:0}};
// @ts-expect-error current aggregate requires numeric source index
const badIndex:AggregateState<string,number>={phase:'Collecting',index:'one',memory:{present:false}};
// @ts-expect-error aggregate operator is a fixed export set
const badOperator:AggregateOperator='map';
// @ts-expect-error callback pair preserves incoming payload type
const badArgs:AggregateArguments<number,number>={previous:1,incoming:'2'};
void [badEvent,badGeneration,noResource,badCalling,badClose,badMissing,badParameters,badIndex,badOperator,badArgs];
