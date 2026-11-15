# refCount: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Automate one shared legacy ConnectableObservable connection while the subscriber count is nonzero.

**Scope:** Legacy pipeable refCount() following publish() / ConnectableObservable with one fixed Subject, immediate disconnect when count reaches zero; terminal Subject is retained.. Atomic post-setup subscriber registration; each subscription occurrence has a unique ID.

**Dataflow shape:** `refCount() : Cω(Connection) → Connectable(T*) → Shared(T*)`. At most one connection is live while the registry contains subscribers. The last unsubscribe disconnects the producer; an overlapping join does not reconnect or replay. An upstream terminal notification is broadcast to current subscribers; the fixed publish Subject retains completion/error for late subscribers.

<!-- S18-REFCOUNT-CONNECT -->
Constructing the shared Observable starts nothing. Its first subscriber creates a Subject-backed connection to the source; that connection is shared by overlapping subscribers.

<!-- S18-REFCOUNT-JOIN -->
A subscriber joining a live connection receives future values, not past values. It does not create another source subscription. Sharing is not replay.

<!-- S18-REFCOUNT-NEXT -->
A source value is forwarded unchanged to each currently subscribed observer. With no observers, a retained connection can still receive values, but share stores none of them.

<!-- S18-REFCOUNT-LEAVE -->
When one subscriber leaves while others remain, remove only that subscriber. The shared source continues and no completion is sent to the departing observer.

<!-- S18-REFCOUNT-LAST-RESET -->
When the last subscriber leaves a nonterminated connection, resetOnRefCountZero=true disconnects and resets it. A future subscriber starts a new source execution. No completion notification is synthesized.

<!-- S18-REFCOUNT-COMPLETE-RETAIN -->
On source complete, notify current subscribers and release that source connection. The retained Subject remains terminated; future subscribers receive only that terminal notification and do not reconnect.

<!-- S18-REFCOUNT-LATE-COMPLETE -->
A subscriber arriving after retained complete immediately receives that complete, with no replayed value and no new source connection.

<!-- S18-REFCOUNT-ERROR-RETAIN -->
On source error, notify current subscribers and release that source connection. The retained Subject remains terminated; future subscribers receive only that terminal notification and do not reconnect.

<!-- S18-REFCOUNT-LATE-ERROR -->
A subscriber arriving after retained error immediately receives that error, with no replayed value and no new source connection.

**Time:** No clock: connection lifetime is determined by ordered subscribe/unsubscribe and producer notifications.

**Sharing:** All refCount subscribers of this published ConnectableObservable share one source connection.

**Callbacks:** No custom Subject factory, selection callback or user callback evaluation.

**Excluded:** Calling refCount on an ordinary non-Connectable Observable or custom ConnectableObservable implementations. Synchronous source completion/next during connect() and the local connection-identity teardown race. Custom Subject variants, manual external connect/disconnect during refCount, reentrant observers and throwing teardown.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-18.md) is reported separately from this specification.
