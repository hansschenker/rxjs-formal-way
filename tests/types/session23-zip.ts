import { createZipModel } from '../../src/models/session23-zip.js';
import type { ZipParameters, ZipMemory, ZipState, ZipEvent } from '../../src/models/session23-zip.js';
const model=createZipModel<number>(3,8);
const initial:ZipState=model.initialState();
const value:ZipEvent<number>={type:'input.next',index:0,value:1};
const memory:ZipMemory={queues:[[]],live:[true],received:[0],emitted:0};
const params:ZipParameters={operator:'zip',inputCount:1,bufferLimit:8,projector:'none'};
// @ts-expect-error Input payload retains its specified value type.
const wrongValue:ZipEvent<number>={type:'input.next',index:0,value:'x'};
// @ts-expect-error Next must explicitly carry the value even when undefined is valid.
const missingValue:ZipEvent<undefined>={type:'input.next',index:0};
// @ts-expect-error Each input event must identify an input.
const missingIndex:ZipEvent<number>={type:'input.next',value:1};
// @ts-expect-error Input indexes are numeric.
const wrongIndex:ZipEvent<number>={type:'input.complete',index:'0'};
// @ts-expect-error Error payload must be explicit.
const missingError:ZipEvent<number>={type:'input.error',index:0};
// @ts-expect-error Completion must identify its input.
const missingCompletionIndex:ZipEvent<number>={type:'input.complete'};
// @ts-expect-error Zip has no timer event.
const timer:ZipEvent<number>={type:'timer.fire',generation:0};
// @ts-expect-error Canonical tuple zip has no projector-outcome event.
const callback:ZipEvent<number>={type:'callback.return',value:1};
// @ts-expect-error Active state requires all FIFO and count bookkeeping.
const missingMemory:ZipState={phase:'Active',queues:[]};
// @ts-expect-error Closed state records its terminal reason.
const missingReason:ZipState={phase:'Closed'};
// @ts-expect-error Unknown close reasons are excluded.
const wrongReason:ZipState={phase:'Closed',reason:'timeout'};
// @ts-expect-error The profile admits no custom projector.
const wrongProjector:ZipParameters={operator:'zip',inputCount:2,bufferLimit:8,projector:'custom'};
// @ts-expect-error Buffer bound is explicit in the canonical parameters.
const missingBound:ZipParameters={operator:'zip',inputCount:2,projector:'none'};
// @ts-expect-error Memory is immutable.
memory.emitted=1;
// @ts-expect-error FIFO values cannot be appended through a readonly state alias.
memory.queues[0]!.push(1);
// @ts-expect-error Input liveness is Boolean.
const wrongLive:ZipMemory={queues:[[]],live:[1],received:[0],emitted:0};
void [initial,value,memory,params,wrongValue,missingValue,missingIndex,wrongIndex,missingError,missingCompletionIndex,timer,callback,missingMemory,missingReason,wrongReason,wrongProjector,missingBound,wrongLive];
