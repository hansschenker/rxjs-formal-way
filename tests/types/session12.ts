import {
  createExpandModel, createFinalizeModel, createFindModel, createFindIndexModel, createFirstModel
} from '../../src/index.js';
import type {
  ExpandParameters, ExpandState, ExpandEvent,
  FinalizeParameters, FinalizeState, FinalizeEvent,
  FindParameters, FindState, FindEvent,
  FindIndexParameters, FindIndexState, FindIndexEvent,
  FirstParameters, FirstState, FirstEvent
} from '../../src/index.js';

const expand=createExpandModel<number>();
const expandOne=createExpandModel<number>(1);
const finalize=createFinalizeModel<number>();
const find=createFindModel<number>();
const findIndex=createFindIndexModel<number>();
const first=createFirstModel<number>();
const firstPred=createFirstModel<number,string>(true,'fallback');

const ep:ExpandParameters={concurrent:'unbounded',projectId:'project',scheduler:'none'};
const es:ExpandState<number>={phase:'Active',index:0,active:[],queue:[]};
const ee:ExpandEvent<number>={type:'outer.next',value:1};
const fp:FinalizeParameters={callbackId:'finalize'};
const fs:FinalizeState={phase:'Active'};
const fe:FinalizeEvent<number>={type:'source.next',value:1};
const findp:FindParameters={predicateId:'predicate',notFound:'undefined'};
const finds:FindState<number>={phase:'Calling',index:0,value:1};
const finde:FindEvent<number>={type:'callback.return',resource:{id:'predicate',generation:0},value:true};
const fip:FindIndexParameters={predicateId:'predicate',notFound:-1};
const fis:FindIndexState<number>={phase:'Active',index:0};
const fie:FindIndexEvent<number>={type:'source.next',value:2};
const firstp:FirstParameters<string>={predicate:true,hasDefault:true,defaultValue:'x',predicateId:'predicate'};
const firsts:FirstState<number>={phase:'Active',index:0};
const firste:FirstEvent<number>={type:'source.complete'};
void [expand,expandOne,finalize,find,findIndex,first,firstPred,ep,es,ee,fp,fs,fe,findp,finds,finde,fip,fis,fie,firstp,firsts,firste];

// @ts-expect-error expand supports only concurrency 1 or unbounded in this canonical profile
createExpandModel<number>(2);
// @ts-expect-error scheduler is fixed to none
const badEP:ExpandParameters={concurrent:1,projectId:'project',scheduler:'async'};
// @ts-expect-error active expansion index is numeric
const badES:ExpandState<number>={phase:'Active',index:'0',active:[],queue:[]};
// @ts-expect-error recursive outer value must match T
const badEE:ExpandEvent<number>={type:'outer.next',value:'x'};
// @ts-expect-error finalize callback id is fixed
const badFP:FinalizeParameters={callbackId:'other'};
// @ts-expect-error finalize next requires a value
const badFE:FinalizeEvent<number>={type:'source.next'};
// @ts-expect-error find sentinel metadata is literal
const badFindP:FindParameters={predicateId:'predicate',notFound:'none'};
// @ts-expect-error find calling value must match T
const badFindS:FindState<number>={phase:'Calling',index:0,value:'x'};
// @ts-expect-error predicate outcome requires resource identity
const badFindE:FindEvent<number>={type:'callback.return',value:true};
// @ts-expect-error findIndex notFound is literal -1
const badFIP:FindIndexParameters={predicateId:'predicate',notFound:0};
// @ts-expect-error findIndex source payload is numeric
const badFIE:FindIndexEvent<number>={type:'source.next',value:'x'};
// @ts-expect-error first default type is string
const badFirstP:FirstParameters<string>={predicate:true,hasDefault:true,defaultValue:1,predicateId:'predicate'};
// @ts-expect-error first active index is numeric
const badFirstS:FirstState<number>={phase:'Active',index:'zero'};
// @ts-expect-error first source payload must match number
const badFirstE:FirstEvent<number>={type:'source.next',value:'x'};
// @ts-expect-error finalize phase is closed over known controls
const badFS:FinalizeState={phase:'Waiting'};
void [badEP,badES,badEE,badFP,badFE,badFindP,badFindS,badFindE,badFIP,badFIE,badFirstP,badFirstS,badFirstE,badFS];
