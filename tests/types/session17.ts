import {
  createRaceLegacyModel, createRaceWithModel, createRepeatModel, createRetryModel, createRepeatWhenModel,
  type RaceOperator, type RaceParameters, type RaceState, type RaceEvent,
  type RestartOperator, type RestartParameters, type RestartState, type RestartEvent,
  type RepeatWhenParameters, type RepeatWhenState, type RepeatWhenEvent
} from '../../src/index.js';

const race=createRaceLegacyModel<number>(2);
const raceWith=createRaceWithModel<string>(2);
const repeat=createRepeatModel<number>(2);
const retry=createRetryModel<number>(2,true);
const repeatWhen=createRepeatWhenModel<string>();
void [race,raceWith,repeat,retry,repeatWhen];

const rname:RaceOperator='raceWith';
// @ts-expect-error race exports are race/raceWith only
const badRname:RaceOperator='raceAll';
const raceParams:RaceParameters={operator:'race',others:2};
// @ts-expect-error others is a count, not a string
const badRaceParams:RaceParameters={operator:'raceWith',others:'two'};
const raceValue:RaceEvent<number>={type:'input.next',resource:{id:'input',generation:0},value:3};
// @ts-expect-error type of source value must match generic
const badRaceValue:RaceEvent<number>={type:'input.next',resource:{id:'input',generation:0},value:'wrong'};
// @ts-expect-error race input.next must identify the source resource
const badRaceResource:RaceEvent<number>={type:'input.next',value:1};
// @ts-expect-error source.error always carries the thrown object
const badRaceError:RaceEvent<number>={type:'input.error',resource:{id:'input',generation:0}};
// @ts-expect-error race does not accept an arbitrary win event
const badRaceWinnerEvent:RaceEvent<number>={type:'winner.selected',index:1};
const raceState:RaceState={phase:'Winner',live:[1],winner:1,reason:'none'};
// @ts-expect-error Winner state requires a chosen index
const badRaceState:RaceState={phase:'Winner',live:[1],winner:null,reason:'none'};
// @ts-expect-error closed state must explain terminal reason
const badRaceClosed:RaceState={phase:'Closed',live:[],winner:1,reason:'none'};

const restartName:RestartOperator='retry';
// @ts-expect-error only repeat/retry use this restart algebra
const badRestartName:RestartOperator='repeatWhen';
const restartParams:RestartParameters={operator:'retry',count:2,resetOnSuccess:true,delays:'none'};
// @ts-expect-error bounded scope disallows an arbitrary delay annotation
const badRestartParams:RestartParameters={operator:'repeat',count:2,resetOnSuccess:false,delays:'timer'};
const restartValue:RestartEvent<number>={type:'source.next',resource:{id:'source',generation:0},value:42};
// @ts-expect-error restart value must match declared generic payload
const badRestartValue:RestartEvent<number>={type:'source.next',resource:{id:'source',generation:0},value:'x'};
// @ts-expect-error source.error requires an error payload
const badRestartError:RestartEvent<number>={type:'source.error',resource:{id:'source',generation:0}};
// @ts-expect-error repeat/retry profile has no timer.fire input
const badRestartTimer:RestartEvent<number>={type:'timer.fire',now:1};
const restartState:RestartState={phase:'Active',generation:1,attempts:2,failures:1,reason:'none'};
// @ts-expect-error attempts cannot be omitted from live restart state
const badRestartState:RestartState={phase:'Active',generation:1,failures:1,reason:'none'};
// @ts-expect-error Active cannot have completed reason
const badRestartClosed:RestartState={phase:'Active',generation:1,attempts:2,failures:1,reason:'complete'};

const repeatWhenParams:RepeatWhenParameters={notifier:'one-persistent-Observable',completionSignals:'void'};
// @ts-expect-error repeatWhen uses a persistent notifier (not per completion)
const badNotifierParams:RepeatWhenParameters={notifier:'new-on-every-completion',completionSignals:'void'};
const completion:RepeatWhenEvent<string>={type:'notifier.complete'};
const sourceNext:RepeatWhenEvent<string>={type:'source.next',resource:{id:'source',generation:0},value:'hello'};
// @ts-expect-error notifier error needs an error
const badNotifierError:RepeatWhenEvent<string>={type:'notifier.error'};
// @ts-expect-error source.next requires a concrete source generation
const badRepeatWhenSource:RepeatWhenEvent<string>={type:'source.next',value:'hello'};
// @ts-expect-error repeatWhen does not accept direct duration control
const badRepeatWhenTimer:RepeatWhenEvent<string>={type:'timer.fire',delay:20};
const waiting:RepeatWhenState={phase:'Waiting',generation:1,notifier:'open',reason:'none'};
// @ts-expect-error waiting must retain notifier field
const badWaiting:RepeatWhenState={phase:'Waiting',generation:1,reason:'none'};
// @ts-expect-error closed repeatWhen must record terminal reason
const badTerminal:RepeatWhenState={phase:'Closed',generation:1,notifier:'open',reason:'none'};

void [rname,badRname,raceParams,badRaceParams,raceValue,badRaceValue,badRaceResource,
  badRaceError,badRaceWinnerEvent,raceState,badRaceState,badRaceClosed,restartName,badRestartName,
  restartParams,badRestartParams,restartValue,badRestartValue,badRestartError,badRestartTimer,
  restartState,badRestartState,badRestartClosed,repeatWhenParams,badNotifierParams,
  completion,sourceNext,badNotifierError,badRepeatWhenSource,badRepeatWhenTimer,waiting,badWaiting,badTerminal];
