import { createSwitchAllModel, createMergeAllModel, createConcatAllModel, createExhaustAllModel } from '../../src/models/all.js';
import type { AllEvent, AllState } from '../../src/models/all.js';
import { createShareReplayModel } from '../../src/models/shareReplay.js';
import type { ShareReplayEvent, ShareReplayState } from '../../src/models/shareReplay.js';
import { stepModel } from '../../src/runner.js';
const a=createSwitchAllModel<{ token: string },number>();
const c=createConcatAllModel<number,number>();
const x=createExhaustAllModel<number,string>();
const m=createMergeAllModel<number,string>(2);
const replay=createShareReplayModel<number>({bufferSize:2,windowTime:3,refCount:true});
const next:AllEvent<{ token:string },number>={type:'outer.next',value:{token:'A'}};
const replayNext:ShareReplayEvent<number>={type:'source.next',resource:{id:'source',generation:0},value:1,now:2};
void [next,replayNext,c,x,m];
// @ts-expect-error source token is not the emitted inner value
const badSource:AllEvent<{ token:string },number>={type:'outer.next',value:1};
// @ts-expect-error only inner output values are numbers
const badInner:AllEvent<{ token:string },number>={type:'inner.next',value:'string',resource:{id:'inner',generation:0}};
// @ts-expect-error identity returns the same source token type, not output value type
const badIdentity:AllEvent<{token:string},number>={type:'callback.return',resource:{id:'identity',generation:0},value:42};
// @ts-expect-error active flatten state must contain a queue and index
const badState:AllState<number>={phase:'Active',active:[]};
// @ts-expect-error source-only alias does not take a projection callback
createSwitchAllModel(()=>1);
// @ts-expect-error mergeAll concurrency must be a number
createMergeAllModel('2');
// @ts-expect-error no concurrency argument to concatAll model
createConcatAllModel(2);
// @ts-expect-error no concurrency argument to exhaustAll model
createExhaustAllModel(2);
// @ts-expect-error replay options do not allow a reset notifier
createShareReplayModel({resetOnError:true});
// @ts-expect-error replay options do not accept a custom connector
createShareReplayModel({connector:()=>({})});
// @ts-expect-error refCount is boolean, not a callback
createShareReplayModel({refCount:()=>true});
// @ts-expect-error timestamp is mandatory on replay events
const missingTime:ShareReplayEvent<number>={type:'subscriber.subscribe',subscriber:'a'};
// @ts-expect-error retained value must have the supplied T type
const wrongReplayValue:ShareReplayEvent<number>={type:'source.next',value:'not-a-number',resource:{id:'source',generation:0},now:1};
// @ts-expect-error source error must carry a generation-qualified source resource
const missingErrorResource:ShareReplayEvent<number>={type:'source.error',error:'bad',now:1};
// @ts-expect-error replay machine stores its external clock
const badReplayState:ShareReplayState<number>={core:{phase:'Disconnected',nextConnection:0,used:[]},buffer:[]};
// @ts-expect-error replay state is immutable
replay.parameters.refCount=false;
stepModel(a,a.initialState(),{type:'subscribe'});
void [badSource,badInner,badIdentity,badState,missingTime,wrongReplayValue,missingErrorResource,badReplayState];
