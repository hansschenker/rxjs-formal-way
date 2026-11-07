import {
  createConnectModel, createDebounceModel, createDefaultIfEmptyModel,
  createDelayModel, createDelayWhenModel
} from '../../src/index.js';
import type {
  ConnectParameters, ConnectState, ConnectEvent,
  DebounceParameters, DebounceState, DebounceEvent,
  DefaultIfEmptyParameters, DefaultIfEmptyState, DefaultIfEmptyEvent,
  DelayParameters, DelayState, DelayEvent
} from '../../src/index.js';

const connect=createConnectModel<number>();
const debounce=createDebounceModel<string>();
const fallback=createDefaultIfEmptyModel<number,string>('fallback');
const delayed=createDelayModel<object>(4);
const when=createDelayWhenModel<number>();
const connectP:ConnectParameters=connect.parameters;
const debounceP:DebounceParameters=debounce.parameters;
const defaultP:DefaultIfEmptyParameters<string>=fallback.parameters;
const delayP:DelayParameters=delayed.parameters;
const cs:ConnectState={phase:'Preparing'};
const ds:DebounceState<string>={phase:'Active',nextId:1,pending:{id:0,value:'a',live:true}};
const fs:DefaultIfEmptyState={phase:'Active',hasValue:false};
const ws:DelayState<number>={phase:'Active',sourceLive:true,nextId:0,items:[]};
const ce:ConnectEvent<number>={type:'source.next',value:2};
const de:DebounceEvent<string>={type:'source.next',value:'x'};
const fe:DefaultIfEmptyEvent<number>={type:'source.next',value:42};
const we:DelayEvent<number>={type:'source.next',value:4,now:1};
void [connectP,debounceP,defaultP,delayP,cs,ds,fs,ws,ce,de,fe,we,connect,debounce,fallback,delayed,when];

// @ts-expect-error connector must be the scoped Subject
const badConnect:ConnectParameters={connector:'ReplaySubject',selector:'merge-two-shared-branches'};
// @ts-expect-error missing phase discriminator
const badCS:ConnectState={};
// @ts-expect-error source.next must carry a value
const badCE:ConnectEvent<string>={type:'source.next'};
// @ts-expect-error debounce selector may not be an arbitrary policy
const badDP:DebounceParameters={durationSelector:'timer'};
// @ts-expect-error debounce pending generation is numeric
const badDS:DebounceState<string>={phase:'Calling',nextId:1,pending:{id:'x',value:'a',live:false}};
// @ts-expect-error duration next requires resource identity
const badDE:DebounceEvent<number>={type:'duration.next'};
// @ts-expect-error default fallback must be string
const badFP:DefaultIfEmptyParameters<string>={fallback:4};
// @ts-expect-error hasValue presence must be boolean
const badFS:DefaultIfEmptyState={phase:'Active',hasValue:null};
// @ts-expect-error default input.next must have typed payload
const badFE:DefaultIfEmptyEvent<number>={type:'source.next',value:'x'};
// @ts-expect-error selector and timer strategies form explicit options
const badWP:DelayParameters={operator:'delay',mode:'unknown',due:4};
// @ts-expect-error duration records require value
const badWS:DelayState<number>={phase:'Active',sourceLive:true,nextId:1,items:[{id:0,stage:'pending'}]};
// @ts-expect-error timer.fire requires a now timestamp
const badWE:DelayEvent<number>={type:'timer.fire',resource:{id:'timer',generation:0}};
// @ts-expect-error source.next requires source-supplied now
const badWE2:DelayEvent<string>={type:'source.next',value:'x'};
// @ts-expect-error due parameter must be numeric
createDelayModel<string>('not-time');
// @ts-expect-error a typed fallback differs from source type
const badDefault:DefaultIfEmptyParameters<boolean>={fallback:'false'};
void [badConnect,badCS,badCE,badDP,badDS,badDE,badFP,badFS,badFE,badWP,badWS,badWE,badWE2,badDefault];
