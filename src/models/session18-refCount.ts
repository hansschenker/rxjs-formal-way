import type { TimedEvent } from '../schema.js';
import { createShareModel } from './share.js';
import type { ShareModel, ShareState, ShareEvent } from './share.js';
import { pinnedRevision } from './session10-common.js';

/** The legacy refCount() export, restricted to publish() / ConnectableObservable
 * with the default Subject factory. The ref-counted connection policy is
 * isomorphic to share's immediate-reset Subject policy for post-setup events,
 * so reuse its reviewed guarded transition algebra, not a second prose model.
 * Unlike the general share operator this model requires a ConnectableObservable.
 */
export type RefCountState = ShareState;
export type RefCountEvent<T> = ShareEvent<T>;
export type RefCountModel<T> = ShareModel<T>;

export function createRefCountModel<T>(): RefCountModel<T> {
  const shared = createShareModel<T>({
    resetOnError:false,resetOnComplete:false,resetOnRefCountZero:true
  });
  const rules = shared.rules.map(rule=>({
    ...rule,
    description:{
      ...rule.description,
      id:rule.description.id.replace('SHARE-','S18-REFCOUNT-'),
      obligations:rule.description.obligations.map(x=>x.replace('S2-SHARE-','S18-REFCOUNT-'))
    }
  }));
  return {...shared,rules,metadata:{
    ...shared.metadata,
    id:'refCount-publish-Subject-legacy',
    operator:'refCount',
    purpose:'Automate one shared legacy ConnectableObservable connection while the subscriber count is nonzero.',
    cardinality:{
      signature:'refCount() : Cω(Connection) → Connectable(T*) → Shared(T*)',
      conditions:[
        'At most one connection is live while the registry contains subscribers.',
        'The last unsubscribe disconnects the producer; an overlapping join does not reconnect or replay.',
        'An upstream terminal notification is broadcast to current subscribers; the fixed publish Subject retains completion/error for late subscribers.'
      ]
    },
    scope:{
      parameters:'Legacy pipeable refCount() following publish() / ConnectableObservable with one fixed Subject, immediate disconnect when count reaches zero; terminal Subject is retained.',
      callbacks:'No custom Subject factory, selection callback or user callback evaluation.',
      time:'No clock: connection lifetime is determined by ordered subscribe/unsubscribe and producer notifications.',
      reentrancy:'Atomic post-setup subscriber registration; each subscription occurrence has a unique ID.',
      exclusions:[
        'Calling refCount on an ordinary non-Connectable Observable or custom ConnectableObservable implementations.',
        'Synchronous source completion/next during connect() and the local connection-identity teardown race.',
        'Custom Subject variants, manual external connect/disconnect during refCount, reentrant observers and throwing teardown.'
      ]
    },
    initialization:{
      control:'Disconnected',event:'subscriber.subscribe',
      sourceSubscription:'Subscribe observer to ConnectableObservable Subject before connecting the producer on first use.'
    },
    ownership:{
      state:'external-instance',
      sharing:'All refCount subscribers of this published ConnectableObservable share one source connection.',
      reset:'Last departing observer closes the connection. Terminal completion/error is retained on the fixed Subject, preventing reconnection after terminal.',
      resources:[{id:'source',kind:'subscription',owner:'legacy ConnectableObservable connection per generation'}]
    },
    dispatch:{
      policy:'atomic-non-reentrant',
      actionSemantics:'The wrapper decrements the source refcount on finalization. The same guarded transitions as share with refcount-zero reset but retained terminal states apply within this profile.',
      cancellationCheckpoints:['A non-last observer leave does not close the producer.','Last leave disconnects silently; late joins start a new connection.']
    },
    sources:[
      'src/internal/operators/refCount.ts',
      'src/internal/observable/ConnectableObservable.ts',
      'src/internal/operators/multicast.ts',
      'src/internal/operators/share.ts'
    ].map(path=>({
      url:'https://github.com/ReactiveX/rxjs/blob/'+pinnedRevision+'/'+path,
      revision:pinnedRevision,
      purpose:'Pinned refcount, connection-reference and subject reset semantics'
    })),
    evidence:{
      modelTests:['tests/session18-model.test.mjs'],
      runtimeTests:['tests/session18-rxjs.test.mjs'],
      status:'source-inspected',
      record:'evidence/SESSION-18.md'
    }
  }};
}
const source = (generation:number)=>({id:'source',generation});
export const refCountExample: readonly TimedEvent<RefCountEvent<string>>[] = [
  {time:0,event:{type:'subscriber.subscribe',subscriber:'A'}},
  {time:1,event:{type:'subscriber.subscribe',subscriber:'B'}},
  {time:2,event:{type:'source.next',resource:source(0),value:'shared'}},
  {time:3,event:{type:'subscriber.unsubscribe',subscriber:'A'}},
  {time:4,event:{type:'source.next',resource:source(0),value:'B-only'}},
  {time:5,event:{type:'subscriber.unsubscribe',subscriber:'B'}},
  {time:6,event:{type:'subscriber.subscribe',subscriber:'C'}},
  {time:7,event:{type:'source.next',resource:source(1),value:'new connection'}},
  {time:8,event:{type:'source.complete',resource:source(1)}}
];
