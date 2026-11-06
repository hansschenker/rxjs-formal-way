import {
  createCombineLatestModel,createCombineLatestWithModel,createConcatModel,
  createConcatWithModel,createConcatMapToModel
} from '../../src/index.js';
import type {
  JoinOperator,JoinPolicy,JoinParameters,JoinSlot,JoinEvent,JoinState,
  ConcatMapToEvent,ConcatMapToState
} from '../../src/index.js';

const latest=createCombineLatestModel<number>(2);
const latestAlias=createCombineLatestWithModel<string>(1);
const serial=createConcatModel<string>(2);
const serialAlias=createConcatWithModel<number>(0);
const mapTo=createConcatMapToModel<string,number,{readonly source:string}>({source:'same'});
const params:JoinParameters={operator:'concatWith',otherSources:1,policy:'serial',projector:'none',scheduler:'none'};
const slot:JoinSlot<number>={ready:false,live:true};
const e1:JoinEvent<number>={type:'input.next',resource:{id:'input',generation:0},value:5};
const e2:ConcatMapToEvent<string,number,string>={type:'outer.next',value:'outer'};
const s1:JoinState<number>={phase:'Active',current:0,slots:[slot]};
const s2:ConcatMapToState<string,string>={phase:'Unsubscribed'};
const op:JoinOperator='concatWith',policy:JoinPolicy='latest';
void [latest,latestAlias,serial,serialAlias,mapTo,params,slot,e1,e2,s1,s2,op,policy];

// @ts-expect-error only four exports in JoinOperator
const badOperator:JoinOperator='combineLatestAll';
// @ts-expect-error no merge policy
const badPolicy:JoinPolicy='merge';
// @ts-expect-error only no-projector scope
const badProjector:JoinParameters={operator:'combineLatest',otherSources:1,policy:'latest',projector:'function',scheduler:'none'};
// @ts-expect-error only unscheduled profile
const badScheduler:JoinParameters={operator:'concat',otherSources:1,policy:'serial',projector:'none',scheduler:'async'};
// @ts-expect-error source value type must remain numeric
const badJoinEvent:JoinEvent<number>={type:'input.next',resource:{id:'input',generation:0},value:'wrong'};
// @ts-expect-error input.next requires resource
const missingResource:JoinEvent<number>={type:'input.next',value:1};
// @ts-expect-error input.error requires original error
const missingError:JoinEvent<number>={type:'input.error',resource:{id:'input',generation:0}};
// @ts-expect-error Active phase requires current and slots
const invalidActive:JoinState<number>={phase:'Active',slots:[]};
// @ts-expect-error slot readiness is boolean
const invalidSlot:JoinSlot<number>={ready:0,live:false};
// @ts-expect-error no invented "Joining" phase
const invalidPhase:JoinState<number>={phase:'Joining'};
// @ts-expect-error MapTo outer value is string
const invalidOuter:ConcatMapToEvent<string,number,string>={type:'outer.next',value:42};
// @ts-expect-error MapTo inner value is number
const invalidInner:ConcatMapToEvent<string,number,string>={type:'inner.next',resource:{id:'inner',generation:0},value:'wrong'};
// @ts-expect-error MapTo callback.return requires constant source token
const invalidCallback:ConcatMapToEvent<string,number,string>={type:'callback.return',resource:{id:'constant',generation:0}};
// @ts-expect-error MapTo Calling state requires indexed pending outer input
const invalidCalling:ConcatMapToState<string,string>={phase:'Calling'};
void [badOperator,badPolicy,badProjector,badScheduler,badJoinEvent,missingResource,missingError,
 invalidActive,invalidSlot,invalidPhase,invalidOuter,invalidInner,invalidCallback,invalidCalling];
