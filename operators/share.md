# share: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Share one live source connection among subscribers using a Subject and explicit boolean reset policies.

**Scope:** Subject connector with boolean resetOnError=true, resetOnComplete=true, resetOnRefCountZero=true. Atomic post-setup reactions. Each subscriber ID denotes one subscription occurrence and must not be reused.

**Dataflow shape:** `share : T* -> Shared(T*)`. Shared is project teaching notation for a connection/ownership policy, not original Cω syntax. A subscriber observes a subsequence determined by its connection interval, not a replay of all source values. Broadcasts are addressed to subscriptions. Total addressed deliveries may exceed the number of source values.

<!-- SHARE-CONNECT -->
Constructing the shared Observable starts nothing. Its first subscriber creates a Subject-backed connection to the source; that connection is shared by overlapping subscribers.

<!-- SHARE-JOIN -->
A subscriber joining a live connection receives future values, not past values. It does not create another source subscription. Sharing is not replay.

<!-- SHARE-NEXT -->
A source value is forwarded unchanged to each currently subscribed observer. With no observers, a retained connection can still receive values, but share stores none of them.

<!-- SHARE-LEAVE -->
When one subscriber leaves while others remain, remove only that subscriber. The shared source continues and no completion is sent to the departing observer.

<!-- SHARE-LAST-RESET -->
When the last subscriber leaves a nonterminated connection, resetOnRefCountZero=true disconnects and resets it. A future subscriber starts a new source execution. No completion notification is synthesized.

<!-- SHARE-COMPLETE-RESET -->
On source complete, notify current subscribers and release that source connection. The configured reset permits a future subscriber to start fresh; it does not retry the terminated subscriptions.

<!-- SHARE-ERROR-RESET -->
On source error, notify current subscribers and release that source connection. The configured reset permits a future subscriber to start fresh; it does not retry the terminated subscriptions.

**Time:** No timer or clock is introduced. Ordered source and subscriber events determine membership at each delivery.

**Sharing:** One machine per shared Observable instance, not per subscriber. Each reset creates a fresh connection generation.

**Callbacks:** No custom connector or reset-notifier functions. Observer/source/finalizer activity is non-reentrant and nonthrowing.

**Excluded:** Custom SubjectLike connectors, replay and notifier-driven delayed resets. Reentrant joins/leaves during notification, source setup or teardown; throwing observers/finalizers. Physical producer abortion, lossless snapshots and a production shared-effect interpreter.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-02.md) is reported separately from this specification.
