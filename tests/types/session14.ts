import {
 createMaterializeModel, createMergeModel, createFlatMapModel,
 createMergeMapToModel, createMergeScanModel,
 type MaterializeEvent, type MaterializeState, type MaterializedValue,
 type MergeEvent, type MergeState, type MergeScanEvent, type MergeScanState,
 type MergeMapToEvent, type FlatMapEvent, type AccumulatorInput,
} from '../../src/index.js';

const materialize=createMaterializeModel<number>();
const merge=createMergeModel<string>(2,2);
const flatMap=createFlatMapModel<number,string,string>(2);
const mapTo=createMergeMapToModel<number,string,string>('same',2);
const scan=createMergeScanModel<number,number,string>(0,2);

const notification:MaterializedValue<string>={kind:'N',value:'hello',hasValue:true};
void [materialize,merge,flatMap,mapTo,scan,notification];
// @ts-expect-error N notifications must carry hasValue=true
const invalidNotification:MaterializedValue<string>={kind:'N',value:'x',hasValue:false};
// @ts-expect-error E notifications require an error field
const invalidErrorValue:MaterializedValue<string>={kind:'E',hasValue:false};
// @ts-expect-error C notification does not contain a source value
const invalidCompleteValue:MaterializedValue<string>={kind:'C',value:'x',hasValue:false};
const sourceEvent:MaterializeEvent<number>={type:'source.next',value:5};
// @ts-expect-error source.next must contain a number
const wrongMaterializeEvent:MaterializeEvent<number>={type:'source.next',value:'wrong'};
// @ts-expect-error terminal phase must declare reason
const wrongMaterializeState:MaterializeState={phase:'Closed'};
const mergeEvent:MergeEvent<string>={type:'input.next',resource:{id:'input',generation:0},value:'a'};
// @ts-expect-error merge input.next requires a resource
const missingMergeResource:MergeEvent<string>={type:'input.next',value:'a'};
// @ts-expect-error merge input.next value must have declared payload type
const wrongMergePayload:MergeEvent<string>={type:'input.next',resource:{id:'input',generation:0},value:7};
// @ts-expect-error merge active state must track live and pending resource ids
const invalidMergeState:MergeState={phase:'Active',live:[]};
const flattenEvent:FlatMapEvent<number,string,string>={type:'outer.next',value:1};
// @ts-expect-error flatMap outer value type is number
const wrongFlatMap:FlatMapEvent<number,string,string>={type:'outer.next',value:'1'};
const mapToEvent:MergeMapToEvent<number,string,string>={type:'callback.return',resource:{id:'constant',generation:0},value:'source'};
// @ts-expect-error mergeMapTo constant source binding must be a string token
const wrongConstant:MergeMapToEvent<number,string,string>={type:'callback.return',resource:{id:'constant',generation:0},value:2};
const accum:AccumulatorInput<number,string>={accumulator:'seed',value:3};
// @ts-expect-error accumulator must be a string
const wrongAccumulator:AccumulatorInput<number,string>={accumulator:0,value:3};
// @ts-expect-error outer source input must be number
const wrongAccumulatedValue:AccumulatorInput<number,string>={accumulator:'seed',value:'bad'};
const scanEvent:MergeScanEvent<number,string,string>={type:'inner.next',resource:{id:'inner',generation:0},value:'output'};
// @ts-expect-error inner output must have accumulator result type string
const wrongScanOutput:MergeScanEvent<number,string,string>={type:'inner.next',resource:{id:'inner',generation:0},value:5};
// @ts-expect-error scan active state requires flattening memory plus an accumulator
const missingScanAccumulator:MergeScanState<number,string,number>={phase:'Active',index:0,active:[],queue:[]};
// @ts-expect-error scan accumulator must be a number
const wrongScanAccumulator:MergeScanState<number,string,number>={phase:'Unsubscribed',accumulator:'wrong'};
void [invalidNotification,invalidErrorValue,invalidCompleteValue,sourceEvent,wrongMaterializeEvent,
 wrongMaterializeState,mergeEvent,missingMergeResource,wrongMergePayload,invalidMergeState,flattenEvent,wrongFlatMap,
 mapToEvent,wrongConstant,accum,wrongAccumulator,wrongAccumulatedValue,scanEvent,wrongScanOutput,
 missingScanAccumulator,wrongScanAccumulator];
