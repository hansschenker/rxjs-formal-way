import { createDistinctUntilChangedModel, createDistinctUntilKeyChangedModel } from '../../src/models/adjacent.js';
import type { AdjacentEvent, AdjacentState } from '../../src/models/adjacent.js';
import { createDistinctModel } from '../../src/models/distinct.js';
import type { DistinctEvent, DistinctState } from '../../src/models/distinct.js';
import { createPairwiseModel } from '../../src/models/pairwise.js';
import type { PairwiseEvent, PairwiseState } from '../../src/models/pairwise.js';
import { createStartWithModel } from '../../src/models/startWith.js';
import type { StartWithEvent, StartWithState } from '../../src/models/startWith.js';
import { stepModel } from '../../src/runner.js';

const adjacent = createDistinctUntilChangedModel<{ code: string }, string>({keyMode:'selected',compareMode:'custom'});
const keyed = createDistinctUntilKeyChangedModel<{ code: string }, string>('code');
const distinct = createDistinctModel<{code:string},string>({selected:true,withFlushes:true});
const pairs = createPairwiseModel<number>();
const starting = createStartWithModel<number,string>(['seed']);
stepModel(adjacent,adjacent.initialState(),{type:'subscribe'});
stepModel(keyed,keyed.initialState(),{type:'subscribe'});
stepModel(distinct,distinct.initialState(),{type:'subscribe'});
stepModel(pairs,pairs.initialState(),{type:'subscribe'});
stepModel(starting,starting.initialState(),{type:'subscribe'});

// @ts-expect-error an adjacent source value must be an object with code
const badAdjacentSource:AdjacentEvent<{code:string},string>={type:'source.next',value:1};
// @ts-expect-error key return must provide a string key for this profile
const badAdjacentKey:AdjacentEvent<{code:string},string>={type:'key.return',value:1,resource:{id:'key',generation:0}};
// @ts-expect-error comparator return requires a same member
const badAdjacentComparison:AdjacentEvent<{code:string},string>={type:'compare.return',resource:{id:'compare',generation:1}};
// @ts-expect-error callback throw requires error value
const badAdjacentThrow:AdjacentEvent<{code:string},string>={type:'compare.throw',resource:{id:'compare',generation:1}};
// @ts-expect-error no comparison state without both previous and current key
const badAdjacentState:AdjacentState<number,string>={phase:'Comparing',index:2,callId:1,input:2};
// @ts-expect-error unsupported arbitrary selector mode
createDistinctUntilChangedModel({keyMode:'arbitrary'});
// @ts-expect-error property key must be a string, not a number
createDistinctUntilKeyChangedModel(2);
// @ts-expect-error invalid custom comparator marker
createDistinctUntilKeyChangedModel('code','hash');
// @ts-expect-error distinct withFlushes is boolean, not callback
createDistinctModel({withFlushes:()=>true});
// @ts-expect-error distinct key return must preserve K type
const badDistinctKey:DistinctEvent<number,string>={type:'key.return',value:1,resource:{id:'select',generation:0}};
// @ts-expect-error active distinct state needs a Set key array and index
const badDistinctState:DistinctState<number,string>={phase:'Active',keys:[],flushOpen:false};
// @ts-expect-error pairwise model does not take a projection
createPairwiseModel((x:number)=>x);
// @ts-expect-error pairwise source values must be numbers
const badPairwise:PairwiseEvent<number>={type:'source.next',value:'one'};
// @ts-expect-error pairwise previous-memory flag is required
const badPairwiseState:PairwiseState<number>={phase:'Active',previous:1};
// @ts-expect-error startWith prefix must be a readonly array
createStartWithModel('a');
// @ts-expect-error source value must be numeric in this startWith profile
const badStartWith:StartWithEvent<number>={type:'source.next',value:'one'};
// @ts-expect-error prefix state requires a nonnegative index
const badStartState:StartWithState={phase:'Prefix'};
// @ts-expect-error configured prefix is readonly
starting.parameters.prefix.push('new');
void [badAdjacentSource,badAdjacentKey,badAdjacentComparison,badAdjacentThrow,badAdjacentState,badDistinctKey,badDistinctState,badPairwise,badPairwiseState,badStartWith,badStartState];
