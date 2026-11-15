import type { Action, ModelMetadata, OperatorModel, ResourceRef, Rule, TimedEvent } from '../schema.js';
import { validateActionWord } from '../runner.js';
import { pinnedRevision, natural } from './session10-common.js';

/** sequenceEqual: two FIFO queues, explicit completion bits, strict === comparator.
 * One unmatched source value can wait in its own queue; a newly arrived value
 * must consume the oldest value from the opposite queue before another match.
 * Custom user comparators require a callback-request/response profile and are
 * intentionally NOT accepted by this default-equality model.
 */
export type SequenceEqualParameters = Readonly<{ comparator: 'strict ==='; maxPending: number }>;
export type SequenceEqualState<T> =
  | Readonly<{phase:'Unsubscribed'}>
  | Readonly<{phase:'Comparing';left:readonly T[];right:readonly T[];
      leftDone:boolean;rightDone:boolean}>
  | Readonly<{phase:'Closed';reason:'equal'|'unequal'|'error'|'cancel'}>;
export type SequenceEqualEvent<T> =
  | Readonly<{type:'subscribe'|'cancel'|'left.complete'|'right.complete'}>
  | Readonly<{type:'left.next'|'right.next';value:T}>
  | Readonly<{type:'left.error'|'right.error';error:unknown}>;
export type SequenceEqualModel<T> =
  OperatorModel<SequenceEqualParameters,SequenceEqualState<T>,SequenceEqualEvent<T>,Action<unknown>>;
type Side='left'|'right';
const source=(side:Side):ResourceRef=>({id:side,generation:0});
const acquire=(side:Side):Action<unknown>=>({type:'subscribe',resource:source(side)});
const release=(side:Side):Action<unknown>=>({type:'unsubscribe',resource:source(side)});
const notify=(v:boolean):Action<unknown>=>({type:'notify',target:'downstream',
  notification:{kind:'N',value:v}});
const done:Action<unknown>={type:'notify',target:'downstream',notification:{kind:'C'}};
const fail=(err:unknown):Action<unknown>=>({type:'notify',target:'downstream',
  notification:{kind:'E',error:err}});
const reference=(path:string)=>({
  url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,
  revision:pinnedRevision,purpose:'Pinned FIFO comparison, completion and source subscription behavior'
});
const input=(type:string,origin:'downstream'|'source'|'inner',category:'lifecycle'|'notification',
  description:string)=>({type,origin,category,description});

export function createSequenceEqualModel<T>(maxPending=32):SequenceEqualModel<T>{
  if(!natural(maxPending)||maxPending<1||maxPending>4096)
    throw RangeError('sequenceEqual maxPending must be an integer in 1..4096');
  const p:SequenceEqualParameters={comparator:'strict ===',maxPending};
  type S=SequenceEqualState<T>;type E=SequenceEqualEvent<T>;type A=Action<unknown>;
  type R=Rule<SequenceEqualParameters,S,E,A>;
  const live=(s:S):s is Extract<S,{phase:'Comparing'}>=>s.phase==='Comparing';
  const opposite=(side:Side):Side=>side==='left'?'right':'left';
  const buffer=(s:Extract<S,{phase:'Comparing'}>,side:Side):readonly T[]=>
    side==='left'?s.left:s.right;
  const completed=(s:Extract<S,{phase:'Comparing'}>,side:Side):boolean=>
    side==='left'?s.leftDone:s.rightDone;
  const sourceLive=(s:Extract<S,{phase:'Comparing'}>,side:Side):boolean=>
    !completed(s,side);
  const cleanup=(s:Extract<S,{phase:'Comparing'}>):A[]=>
    (['left','right'] as const).filter(side=>sourceLive(s,side)).map(release);
  const terminate=(v:boolean,s:Extract<S,{phase:'Comparing'}>):{state:S;actions:readonly A[]}=>
    ({state:{phase:'Closed',reason:v?'equal':'unequal'},
      actions:[notify(v),done,...cleanup(s)]});
  const rules:R[]=[];
  const add=(suffix:string,from:S['phase'],event:E['type'],to:S['phase'],
    guard:string,actions:readonly string[],explanation:string,nextState:string,
    enabled:(s:S,e:E)=>boolean,react:(s:S,e:E)=>{state:S;actions:readonly A[]}):void=>{
    rules.push({description:{
      id:'S18-SEQUENCEEQUAL-'+suffix,from,event,to,guard,actions,explanation,nextState,
      obligations:['S18-SEQUENCEEQUAL-'+suffix]
    },enabled,react});
  };
  add('START','Unsubscribed','subscribe','Comparing','first downstream subscription',
    ['subscribe source first','subscribe compareTo second'],
    'Both streams are subscribed for one independent comparison; each has a FIFO queue and completion bit.',
    'Comparing with empty queues and two live source subscriptions.',
    ()=>true,()=>({state:{phase:'Comparing',left:[],right:[],leftDone:false,rightDone:false},
      actions:[acquire('left'),acquire('right')]}));
  for(const side of ['left','right'] as const){
    const other=opposite(side);
    const mayReceive=(s:S):boolean=>live(s)&&sourceLive(s,side);
    const mayQueue=(s:S):boolean=>live(s)&&mayReceive(s)&&buffer(s,other).length===0
      &&!completed(s,other)&&buffer(s,side).length<maxPending;
    add(side.toUpperCase()+'-QUEUE','Comparing',side+'.next','Comparing',
      'current side live, opposite FIFO empty and incomplete; buffer below cap',
      ['append exact payload to unmatched FIFO'],
      'No output until an opposite value arrives, or comparison becomes decided. Values remain opaque.',
      'Append one unmatched payload to current side FIFO.',
      mayQueue,(s,e)=>{if(!live(s)||!('value'in e))throw Error('expected value');
        return {state:{...s,[side]:[...buffer(s,side),e.value]},actions:[]};});
    add(side.toUpperCase()+'-EXTRA','Comparing',side+'.next','Closed',
      'opposite stream already completed and has no unmatched value',
      ['emit false, complete and release remaining subscriptions'],
      'A new value after an exhausted, completed opposite stream proves unequal lengths.',
      'Closed unequal immediately.',
      s=>live(s)&&mayReceive(s)&&completed(s,other)&&buffer(s,other).length===0,
      s=>{if(!live(s))throw Error('expected comparing');
        return terminate(false,s);});
    add(side.toUpperCase()+'-MATCH','Comparing',side+'.next','Comparing',
      'opposite FIFO nonempty and strict equality holds against its oldest value',
      ['discard one oldest opposite FIFO entry; no output'],
      'Default comparator is strict JavaScript ===, including NaN mismatch and object identity.',
      'Opposite FIFO shrinks by one while both completion flags remain unchanged.',
      (s,e)=>live(s)&&mayReceive(s)&&'value'in e&&buffer(s,other).length>0
        &&e.value===buffer(s,other)[0],
      s=>{if(!live(s))throw Error('expected comparison');
        return {state:{...s,[other]:buffer(s,other).slice(1)},actions:[]};});
    add(side.toUpperCase()+'-DIFFER','Comparing',side+'.next','Closed',
      'opposite FIFO nonempty and strict equality fails',
      ['emit false then complete; release all live sources'],
      'One unequal aligned pair is sufficient: no need to wait for either source to finish.',
      'Closed unequal immediately.',
      (s,e)=>live(s)&&mayReceive(s)&&'value'in e&&buffer(s,other).length>0
        &&!(e.value===buffer(s,other)[0]),
      s=>{if(!live(s))throw Error('expected comparison');
        return terminate(false,s);});
    add(side.toUpperCase()+'-FIRST-COMPLETE','Comparing',side+'.complete','Comparing',
      'current side is live and the other side is not yet completed',
      ['release completed source subscription; retain unmatched FIFO'],
      'Completion alone is insufficient while the opposite source might still produce matching values.',
      'Mark side completed and await the other stream.',
      s=>live(s)&&mayReceive(s)&&!completed(s,other),
      s=>{if(!live(s))throw Error('expected completion');
        return {state:{...s,[side+'Done']:true},actions:[release(side)]};});
    for(const result of [true,false]){
      add(side.toUpperCase()+'-FINAL-'+(result?'EQUAL':'UNEVEN'),'Comparing',side+'.complete','Closed',
        'opposite stream already completed; unmatched buffers '+(result?'both empty':'not empty'),
        [result?'emit true and complete':'emit false and complete','release final subscription'],
        'Only both completed streams with no unmatched FIFO values are equal.',
        'Closed '+(result?'equal':'unequal')+'.',
        s=>live(s)&&mayReceive(s)&&completed(s,other)&&
          ((s.left.length===0&&s.right.length===0)===result),
        s=>{if(!live(s))throw Error('expected final comparison');
          return terminate(result,s);});
    }
    add(side.toUpperCase()+'-ERROR','Comparing',side+'.error','Closed',
      'current side is live',
      ['forward exact error identity','release all live subscriptions'],
      'An error is a terminal failure, never converted to a false equality result.',
      'Closed error.',
      s=>live(s)&&mayReceive(s),
      (s,e)=>{if(!live(s)||!('error'in e))throw Error('expected error');
        return {state:{phase:'Closed',reason:'error'},actions:[fail(e.error),...cleanup(s)]};});
  }
  add('CANCEL','Comparing','cancel','Closed','consumer cancels',
    ['release each still-live source without a boolean or completion'],
    'Cancellation is not inequality. Pending buffers are discarded without output.',
    'Closed cancel.',
    s=>live(s),
    s=>{if(!live(s))throw Error('expected cancellation');
      return {state:{phase:'Closed',reason:'cancel'},actions:cleanup(s)};});

  const metadata:ModelMetadata={
    schemaVersion:'1.1',rxjsVersion:'7.8.2',
    id:'sequenceEqual-strict-FIFO-'+maxPending,operator:'sequenceEqual',
    purpose:'Compare two Observable value sequences in arrival-independent FIFO order with strict default equality.',
    cardinality:{
      signature:'sequenceEqual(compareTo, ===) : Cω(Comparison) → T* → Bool?',
      conditions:[
        'Exactly one boolean next followed by complete when unequal pair or unequal length is proven, or both complete equally.',
        'Both completed and both unmatched FIFO buffers empty implies true, including two empty sources.',
        'A nonterminating source can prevent any output. Errors forward without a boolean.'
      ]
    },
    scope:{
      parameters:'Two nonreentrant Observable sources and default strict === comparator, unmatched FIFO length up to '+maxPending+'.',
      callbacks:'Default comparator === computed purely. Custom user comparators and their throws require a separate callback-invocation model.',
      time:'No new time source: arrival order determines FIFO alignment, equal-time notifications use caller order.',
      reentrancy:'Source-first atomic setup and post-subscription external notifications only.',
      exclusions:[
        'Custom comparator callbacks, errors thrown by comparators, and arbitrary ObservableInput conversion.',
        'Buffer overflow beyond the declared maximum, synchronous subscription-time source notifications and reentrant observers.',
        'Infinite traces do not establish liveness; nonterminating or silent sources may leave comparison unresolved.'
      ]
    },
    initialization:{control:'Unsubscribed',event:'subscribe',
      sourceSubscription:'Subscribe to source, then compareTo, with independent FIFO buffers.'},
    ownership:{state:'subscription-local',sharing:'None; every downstream subscription performs its own independent comparison.',
      reset:'New comparison begins with empty queues and false completion flags.',
      resources:[
        {id:'left',kind:'subscription',owner:'source Observable'},
        {id:'right',kind:'subscription',owner:'compareTo Observable'}
      ]},
    dispatch:{policy:'atomic-non-reentrant',
      actionSemantics:'On every next, compare against oldest opposite buffered value or enqueue locally; notification and teardown are ordered.',
      cancellationCheckpoints:['After each pair comparison and on either source terminal event.']},
    inputs:[
      input('subscribe','downstream','lifecycle','start comparison'),
      input('left.next','source','notification','source value'),
      input('right.next','inner','notification','compareTo value'),
      input('left.complete','source','notification','source completed'),
      input('right.complete','inner','notification','compareTo completed'),
      input('left.error','source','notification','source error'),
      input('right.error','inner','notification','compareTo error'),
      input('cancel','downstream','lifecycle','consumer cancels')
    ],
    actionTypes:['subscribe','unsubscribe','notify'],
    controls:[
      {id:'Unsubscribed',description:'no subscriptions',terminal:false},
      {id:'Comparing',description:'two FIFO buffers, independent completion bits',terminal:false},
      {id:'Closed',description:'one equality result, error or cancellation',terminal:true}
    ],
    sources:[
      reference('src/internal/operators/sequenceEqual.ts'),
      reference('src/internal/operators/OperatorSubscriber.ts'),
      reference('src/internal/observable/innerFrom.ts')
    ],
    evidence:{modelTests:['tests/session18-model.test.mjs'],runtimeTests:['tests/session18-rxjs.test.mjs'],
      status:'source-inspected',record:'evidence/SESSION-18.md'}
  };
  return {metadata,parameters:p,rules,initialState:()=>({phase:'Unsubscribed'}),
    control:s=>s.phase,
    validateState:s=>{
      const errors:string[]=[];
      if(live(s)){
        if(s.leftDone&&s.rightDone)errors.push('both completed must emit result and close');
        if(s.left.length&&s.right.length)errors.push('both FIFO buffers cannot contain unmatched values simultaneously');
        if(s.left.length>maxPending||s.right.length>maxPending)
          errors.push('unmatched FIFO exceeds bounded model scope');
      }
      return errors;
    },
    validateReaction:(before,e,result)=>[
      ...validateActionWord(result.actions),
      ...(e.type==='cancel'&&result.actions.some(a=>a.type==='notify')?
        ['cancellation must not emit a boolean or terminal notification']:[]),
      ...((e.type==='left.next'||e.type==='right.next')&&result.state.phase==='Comparing'&&
          result.actions.some(a=>a.type==='notify')?
        ['pending comparison may not emit a premature result']:[]),
      ...(result.state.phase==='Closed'&&
        (result.state.reason==='equal'||result.state.reason==='unequal') &&
        !(result.actions.filter(a=>a.type==='notify').length===2 &&
          result.actions[0]?.type==='notify'&&result.actions[0].notification.kind==='N'&&
          result.actions[0].notification.value===(result.state.reason==='equal') &&
          result.actions[1]?.type==='notify'&&result.actions[1].notification.kind==='C')?
        ['decided equality must emit exactly boolean next then complete']:[])
    ]};
}
export const sequenceEqualExample:readonly TimedEvent<SequenceEqualEvent<string>>[]=[
  {time:0,event:{type:'subscribe'}},
  {time:1,event:{type:'left.next',value:'a'}},
  {time:2,event:{type:'left.next',value:'b'}},
  {time:3,event:{type:'right.next',value:'a'}},
  {time:4,event:{type:'right.next',value:'b'}},
  {time:5,event:{type:'left.complete'}},
  {time:6,event:{type:'right.complete'}}
];
