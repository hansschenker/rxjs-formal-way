import {
  createPluckModel, createPublishPlainModel, createPublishBehaviorModel,
  createPublishLastModel, createPublishReplayModel,
  type PluckEvent, type PluckState, type PluckParameters,
  type PublishEvent, type PublishState, type PublishOperator, type PublishParameters,
} from '../../src/index.js';

const pluck=createPluckModel<{p:{n:string}}>(['p','n']);
const plain=createPublishPlainModel<number>();
const behavior=createPublishBehaviorModel(0);
const last=createPublishLastModel<number>();
const replay=createPublishReplayModel<number>(2);
void [pluck,plain,behavior,last,replay];

const projected:PluckEvent<{p:{n:string}}>={type:'source.next',value:{p:{n:'ok'}}};
// @ts-expect-error pluck source must have the declared data type
const wrongProjected:PluckEvent<{p:{n:string}}>={type:'source.next',value:{p:{n:5}}};
// @ts-expect-error source.error requires an error payload
const missingSourceError:PluckEvent<number>={type:'source.error'};
// @ts-expect-error pluck cannot fire an output notification as an input
const invalidPluckEvent:PluckEvent<number>={type:'downstream.next',value:2};
const validPluckState:PluckState={phase:'Active',count:1,reason:'none'};
// @ts-expect-error pluck state must retain source count
const invalidPluckState:PluckState={phase:'Active',reason:'none'};
const pluckParams:PluckParameters={path:['a','b']};
// @ts-expect-error path must be a list, not a scalar
const badPluckParams:PluckParameters={path:'a'};

const connected:PublishEvent<number>={type:'connect'};
const join:PublishEvent<number>={type:'observer.subscribe',observer:2};
const value:PublishEvent<number>={type:'source.next',resource:{id:'source',generation:0},value:3};
// @ts-expect-error publish source.next payload must match generic type
const badValue:PublishEvent<number>={type:'source.next',resource:{id:'source',generation:0},value:'string'};
// @ts-expect-error publishing source values requires connection generation
const missingResource:PublishEvent<number>={type:'source.next',value:3};
// @ts-expect-error join events require observer id
const missingObserver:PublishEvent<number>={type:'observer.subscribe'};
// @ts-expect-error cancel events require observer id
const invalidCancel:PublishEvent<number>={type:'observer.cancel'};
// @ts-expect-error a connection event cannot carry an observer id
const bogusConnect:PublishEvent<number>={type:'connect',observer:1};
// @ts-expect-error source error must provide exact error object
const invalidError:PublishEvent<number>={type:'source.error',resource:{id:'source',generation:0}};
// @ts-expect-error no scheduler in the count-only publishing scope
const invalidTimer:PublishEvent<number>={type:'timer.fire',now:3};

const name:PublishOperator='publishLast';
// @ts-expect-error unpublished connector name
const invalidName:PublishOperator='publishNew';
const parameters:PublishParameters<number>={operator:'publish',seed:undefined,bufferSize:2,windowTime:'unbounded'};
// @ts-expect-error supported window time is explicitly unbounded
const invalidWindow:PublishParameters<number>={operator:'publish',seed:0,bufferSize:2,windowTime:5};
const state:PublishState<number>={
  phase:'Ready',subscribers:[],generation:0,retained:[],last:undefined,hasLast:false,terminal:null,error:undefined,
};
// @ts-expect-error state must record source generation
const missingGeneration:PublishState<number>={
  phase:'Connected',subscribers:[],retained:[],last:undefined,hasLast:false,terminal:null,error:undefined,
};
void [projected,wrongProjected,missingSourceError,invalidPluckEvent,validPluckState,invalidPluckState,
  pluckParams,badPluckParams,connected,join,value,badValue,missingResource,missingObserver,invalidCancel,
  bogusConnect,invalidError,invalidTimer,name,invalidName,parameters,invalidWindow,state,missingGeneration];
