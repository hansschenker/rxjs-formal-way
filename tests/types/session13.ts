import {
  createGroupByModel, createIgnoreElementsModel, createIsEmptyModel, createLastModel, createMapToModel,
} from '../../src/index.js';
import type {
  GroupByParameters, GroupByState, GroupByEvent, GroupToken, GroupRecord,
  IgnoreElementsEvent, IgnoreElementsState,
  IsEmptyEvent, IsEmptyState, LastParameters, LastState, LastEvent,
  MapToParameters, MapToState, MapToEvent,
} from '../../src/index.js';

const groupBy=createGroupByModel<number,string>();
const ignore=createIgnoreElementsModel<number>();
const empty=createIsEmptyModel<string>();
const last=createLastModel<number>();
const lastPredicate=createLastModel<number,string>(true,{value:'fallback'});
const mapTo=createMapToModel<number,string>('constant');

const gp:GroupByParameters={
  keySelectorId:'key',element:'identity',duration:'none',connector:'Subject',subscribersPerGroup:'at-most-one',
};
const gr:GroupRecord<string>={groupId:0,key:'a',subscribers:1};
const gt:GroupToken<string>={key:'a',groupId:0};
const gs:GroupByState<number,string>={phase:'Active',groups:[gr],nextGroupId:1,index:2};
const ge:GroupByEvent<number,string>={type:'callback.return',resource:{id:'key',generation:0},value:'a'};
const ie:IgnoreElementsEvent<number>={type:'source.next',value:1};
const is:IgnoreElementsState={phase:'Active'};
const ee:IsEmptyEvent<string>={type:'source.next',value:'x'};
const es:IsEmptyState={phase:'Active'};
const lp:LastParameters<string>={predicate:true,hasDefault:true,defaultValue:'x',predicateId:'predicate'};
const ls:LastState<number>={phase:'Calling',index:1,hasMatch:false,value:undefined,pending:1};
const le:LastEvent<number>={type:'callback.return',resource:{id:'predicate',generation:0},value:true};
const mp:MapToParameters<{x:1}>={value:{x:1}};
const ms:MapToState={phase:'Active'};
const me:MapToEvent<number>={type:'source.next',value:1};
void [groupBy,ignore,empty,last,lastPredicate,mapTo,gp,gr,gt,gs,ge,ie,is,ee,es,lp,ls,le,mp,ms,me];

// @ts-expect-error groupBy connector is scoped to default Subject
const badGroupParameters:GroupByParameters={keySelectorId:'key',element:'identity',duration:'none',connector:'ReplaySubject',subscribersPerGroup:'at-most-one'};
// @ts-expect-error groupBy rejects unsupported duration behavior in canonical model
const badGroupDuration:GroupByParameters={keySelectorId:'key',element:'identity',duration:'timer',connector:'Subject',subscribersPerGroup:'at-most-one'};
// @ts-expect-error per-group subscribers are bounded at one
const badGroupRecord:GroupRecord<string>={groupId:0,key:'x',subscribers:2};
// @ts-expect-error group token key type is string
const badGroupToken:GroupToken<string>={key:123,groupId:0};
// @ts-expect-error groupBy source payload must match number
const badGroupEvent:GroupByEvent<number,string>={type:'source.next',value:'x'};
// @ts-expect-error groupBy callback key return has declared string type
const badGroupCallback:GroupByEvent<number,string>={type:'callback.return',resource:{id:'key',generation:0},value:33};
// @ts-expect-error groupBy callback return requires the invocation resource
const missingGroupResource:GroupByEvent<number,string>={type:'callback.return',value:'a'};
// @ts-expect-error groupBy state group generation must be numeric
const badGroupState:GroupByState<number,string>={phase:'Active',groups:[],nextGroupId:'zero',index:0};
// @ts-expect-error ignoreElements source next requires a number
const badIgnoreEvent:IgnoreElementsEvent<number>={type:'source.next',value:'x'};
// @ts-expect-error ignoreElements does not have a Calling control
const badIgnoreState:IgnoreElementsState={phase:'Calling'};
// @ts-expect-error isEmpty source next requires a string
const badEmptyEvent:IsEmptyEvent<string>={type:'source.next',value:0};
// @ts-expect-error isEmpty controls are Unsubscribed, Active, Closed
const badEmptyState:IsEmptyState={phase:'Paused'};
// @ts-expect-error last's default type is string
const badLastParams:LastParameters<string>={predicate:true,hasDefault:true,defaultValue:5,predicateId:'predicate'};
// @ts-expect-error last pending source payload must be numeric
const badLastState:LastState<number>={phase:'Calling',index:1,hasMatch:false,value:undefined,pending:'x'};
// @ts-expect-error last callback invocation needs resource identity
const badLastEvent:LastEvent<number>={type:'callback.throw',error:'fail'};
// @ts-expect-error mapTo parameters retain constant type
const badMapParameters:MapToParameters<{x:1}>={value:'bad'};
// @ts-expect-error mapTo source payload stays numeric even though result is string
const badMapEvent:MapToEvent<number>={type:'source.next',value:'x'};
// @ts-expect-error mapTo state is not time scheduled
const badMapState:MapToState={phase:'Timer'};
void [badGroupParameters,badGroupDuration,badGroupRecord,badGroupToken,badGroupEvent,badGroupCallback,
  missingGroupResource,badGroupState,badIgnoreEvent,badIgnoreState,badEmptyEvent,badEmptyState,
  badLastParams,badLastState,badLastEvent,badMapParameters,badMapEvent,badMapState];
