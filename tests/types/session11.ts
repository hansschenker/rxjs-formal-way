import {
  createDematerializeModel, createElementAtModel, createEndWithModel,
  createEveryModel, createExhaustModel
} from '../../src/index.js';
import type {
  DematerializeEvent, DematerializeState,
  ElementAtEvent, ElementAtState, ElementAtParameters,
  EndWithEvent, EndWithState, EndWithParameters,
  EveryEvent, EveryState, EveryParameters, ExhaustEvent
} from '../../src/index.js';

const demat=createDematerializeModel<number>();
const element=createElementAtModel<number,string>(2,'fallback');
const end=createEndWithModel<number,string>(['tail']);
const every=createEveryModel<number>();
const exhaust=createExhaustModel<object,number>();
const d:DematerializeEvent<number>={type:'source.next',notification:{kind:'N',value:1}};
const ds:DematerializeState={phase:'Active'};
const el:ElementAtEvent<number>={type:'source.next',value:2};
const els:ElementAtState={phase:'Active',index:1};
const elp:ElementAtParameters<string>={index:1,hasDefault:true,defaultValue:'fallback'};
const e:EndWithEvent<number>={type:'suffix.next'};
const es:EndWithState={phase:'Suffix',index:0};
const ep:EndWithParameters<string>={suffix:['x'],scheduler:'none'};
const p:EveryParameters={predicateId:'predicate'};
const ev:EveryEvent<number>={type:'callback.return',resource:{id:'predicate',generation:0},value:true};
const evs:EveryState<number>={phase:'Calling',index:0,value:1};
const ex:ExhaustEvent<object,number>={type:'outer.next',value:{}};
void [demat,element,end,every,exhaust,d,ds,el,els,elp,e,es,ep,p,ev,evs,ex];

// @ts-expect-error materialized next requires notification
const badD:DematerializeEvent<number>={type:'source.next',value:4};
// @ts-expect-error notification payload is numeric
const badD2:DematerializeEvent<number>={type:'source.next',notification:{kind:'N',value:'string'}};
// @ts-expect-error invalid phase
const badDS:DematerializeState={phase:'Waiting'};
// @ts-expect-error elementAt source next needs payload
const badEl:ElementAtEvent<string>={type:'source.next'};
// @ts-expect-error index is numeric
const badElS:ElementAtState={phase:'Active',index:'one'};
// @ts-expect-error default value is string
const badElP:ElementAtParameters<string>={index:2,hasDefault:true,defaultValue:4};
// @ts-expect-error endWith suffix state requires index
const badES:EndWithState={phase:'Suffix'};
// @ts-expect-error unscheduled profile
const badEP:EndWithParameters<number>={suffix:[1],scheduler:'async'};
// @ts-expect-error required predicate ID
const badP:EveryParameters={predicateId:'not-predicate'};
// @ts-expect-error wrong predicate value
const badEV:EveryState<number>={phase:'Calling',index:0,value:'x'};
// @ts-expect-error callback result requires resource identity
const badE:EveryEvent<number>={type:'callback.return',value:false};
// @ts-expect-error exhaust requires outer-source object, not string
const badEx:ExhaustEvent<object,number>={type:'outer.next',value:'x'};
// @ts-expect-error elementAt index type must be number
createElementAtModel('index');
// @ts-expect-error endWith expects array of suffix values
createEndWithModel(7);
void [badD,badD2,badDS,badEl,badElS,badElP,badES,badEP,badP,badEV,badE,badEx];
