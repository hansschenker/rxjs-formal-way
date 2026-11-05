import {
 createBufferToggleModel,createBufferWhenModel,createCatchErrorModel,
 createCombineAllModel,createCombineLatestAllModel
} from '../../src/index.js';
import type {
 SelectorBufferParameters,SelectorBufferState,SelectorBufferEvent,SelectorBufferRecord,SelectorBufferOperator,
 CatchErrorParameters,CatchErrorState,CatchErrorEvent,
 LatestAllParameters,LatestAllState,LatestAllEvent,LatestAllOperator,LatestSlot
} from '../../src/index.js';
const toggle=createBufferToggleModel<number,string>();
const when=createBufferWhenModel<number>();
const recover=createCatchErrorModel<number,string>();
const oldJoin=createCombineAllModel<number>();
const join=createCombineLatestAllModel<number>();
const value:SelectorBufferEvent<number,string>={type:'openings.next',value:'open'};
const close:SelectorBufferEvent<number>={type:'closing.next',resource:{id:'closing',generation:0}};
const source:CatchErrorEvent<number,string>={type:'source.next',value:1};
const inner:LatestAllEvent<number>={type:'inner.next',resource:{id:'inner',generation:0},value:1};
const slot:LatestSlot<number>={source:'A',ready:false,live:true};
const record:SelectorBufferRecord<number>={id:0,values:[1],closingLive:true};
const p:SelectorBufferParameters={operator:'bufferToggle'};
const q:CatchErrorParameters={operator:'catchError',replacement:'one-Observable'};
const r:LatestAllParameters={operator:'combineAll',projector:'none'};
void [toggle,when,recover,oldJoin,join,value,close,source,inner,slot,record,p,q,r];

// @ts-expect-error fixed operator union
const badBuffer:SelectorBufferOperator='bufferTime';
// @ts-expect-error source type is number
const badSource:SelectorBufferEvent<number>={type:'source.next',value:'wrong'};
// @ts-expect-error opening type is string
const badOpen:SelectorBufferEvent<number,string>={type:'openings.next',value:2};
// @ts-expect-error missing selector resource
const badReturn:SelectorBufferEvent<number>={type:'callback.return'};
// @ts-expect-error missing closing resource
const badClosing:SelectorBufferEvent<number>={type:'closing.next'};
// @ts-expect-error impossible buffer phase
const badBufferState:SelectorBufferState<number>={phase:'Pending'};
// @ts-expect-error Active buffer requires counters and records
const missingBuffers:SelectorBufferState<number>={phase:'Active',sourceLive:true};
// @ts-expect-error record values are arrays
const badRecord:SelectorBufferRecord<number>={id:0,values:3,closingLive:true};
// @ts-expect-error fixed catch-error replacement mode
const badRecovery:CatchErrorParameters={operator:'catchError',replacement:'retry'};
// @ts-expect-error selector return requires replacement binding
const missingReplacement:CatchErrorEvent<number,string>={type:'callback.return',resource:{id:'selector',generation:0}};
// @ts-expect-error catch source value type number
const badCatchNext:CatchErrorEvent<number,string>={type:'source.next',value:'wrong'};
// @ts-expect-error recovery value type string
const badRecoveryNext:CatchErrorEvent<number,string>={type:'replacement.next',value:7};
// @ts-expect-error Calling requires original error key
const badCatchState:CatchErrorState={phase:'Calling'};
// @ts-expect-error fixed union join alias
const badJoinName:LatestAllOperator='zipAll';
// @ts-expect-error join project mode scoped to none
const badJoinConfig:LatestAllParameters={operator:'combineAll',projector:'function'};
// @ts-expect-error join inner payload must be number
const badJoinEvent:LatestAllEvent<number>={type:'inner.next',resource:{id:'inner',generation:0},value:'wrong'};
// @ts-expect-error Joining requires slots
const badJoinState:LatestAllState<number>={phase:'Joining'};
// @ts-expect-error latest value slot readiness is boolean
const badLatestSlot:LatestSlot<number>={source:'s',ready:0,live:true};
void [badBuffer,badSource,badOpen,badReturn,badClosing,badBufferState,missingBuffers,badRecord,
 badRecovery,missingReplacement,badCatchNext,badRecoveryNext,badCatchState,badJoinName,badJoinConfig,
 badJoinEvent,badJoinState,badLatestSlot];
