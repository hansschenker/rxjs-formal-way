# publishLast: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

AsyncSubject buffers the latest value without forwarding and emits it only after successful completion; empty completion emits none. An explicit connect() controls the source, not the number of observers.

**Scope:** Selector-less legacy ConnectableObservable; one fixed Subject instance and explicit connect.. Non-reentrant event delivery; source is not synchronous within connect() acquisition. Registered teardowns and one terminal connection only.

**Dataflow shape:** `publishLast : T* -> (T?) per observer at completion`. Manual connection and observer subscription are separate operations; observers never automatically start or stop the source. AsyncSubject buffers the latest value without forwarding and emits it only after successful completion; empty completion emits none. Unsubscribe of one observer is silent, and a source error forwards the exact error object.

<!-- S16-PUBLISHLAST-JOIN-READY -->
A new consumer joins the existing Subject; no new upstream source subscription is acquired.

<!-- S16-PUBLISHLAST-LEAVE-READY -->
Manual observer cancellation does not disconnect the source; there is no refCount.

<!-- S16-PUBLISHLAST-JOIN-CONNECTED -->
A new consumer joins the existing Subject; no new upstream source subscription is acquired.

<!-- S16-PUBLISHLAST-LEAVE-CONNECTED -->
Manual observer cancellation does not disconnect the source; there is no refCount.

<!-- S16-PUBLISHLAST-CONNECT -->
Manual connect starts the producer once for all current observers.

<!-- S16-PUBLISHLAST-CONNECT-IDEMPOTENT -->
A second connect call reuses the live upstream connection.

<!-- S16-PUBLISHLAST-DISCONNECT -->
Manual connection unsubscribe preserves fixed Subject state, subscribers and cached values.

<!-- S16-PUBLISHLAST-SOURCE-NEXT -->
Publish/Behavior/Replay forward now; AsyncSubject holds only the last value until successful completion.

<!-- S16-PUBLISHLAST-SOURCE-COMPLETE -->
One completed fixed Subject retains its connector-specific completion semantics for future subscribers.

<!-- S16-PUBLISHLAST-SOURCE-ERROR -->
An error is terminal. ReplaySubject retains its prior values for a late subscriber; other Subjects do not.

<!-- S16-PUBLISHLAST-LATE-SUBSCRIBE -->
Late subscribers receive connector-specific replay: ReplaySubject even before an error, AsyncSubject only after completion.

**Time:** No scheduler is added; source events occur at supplied times. Replay has infinite time window and count-only eviction. New subscriptions synchronously replay memory.

**Sharing:** One fixed publishLast Subject and one explicitly owned upstream connection serve all observers of the same connectable instance.

**Callbacks:** No user selector, projection or subscriber callback executes inside the pure model.

**Excluded:** Selector overloads of publish/publishReplay, timestamp-provider/windowTime expiration, arbitrary scheduler ties and getter side effects. Reconnect after a terminal source notification, synchronous emission during connect(), observer callbacks that unsubscribe reentrantly. RefCount auto-connection, arbitrary custom Subject subclass, throwing observer or teardown.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-16.md) is reported separately from this specification.
