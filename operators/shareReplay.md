# shareReplay: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Share one producer and synchronously replay recent values to later subscribers, retaining successful completion.

**Scope:** ReplaySubject(bufferSize=2,windowTime=6), refCount=false; nonnegative safe-integer sizes and windows; zero clamped to one. Atomic, non-reentrant subscriber registration and source delivery after connection setup. Synchronous replay occurs before a retained terminal signal.

**Dataflow shape:** `shareReplay : T* -> SharedReplay(T*)`. SharedReplay is project notation for shared connection plus buffered late delivery, not a Cω primitive. Live subscribers receive current values; late subscribers also receive up to bufferSize eligible previous values. Each subscriber has its own output T*; replay fan-out changes total notification multiplicity, not source cardinality.

<!-- SHAREREPLAY-CONNECT -->
A joining subscriber receives the current replay buffer, oldest first, synchronously. A completed shared source replays its retained buffer and then completes without reconnecting. Constructing the shared Observable starts nothing. Its first subscriber creates a Subject-backed connection to the source; that connection is shared by overlapping subscribers.

<!-- SHAREREPLAY-JOIN -->
A joining subscriber receives the current replay buffer, oldest first, synchronously. A completed shared source replays its retained buffer and then completes without reconnecting. A subscriber joining a live connection receives future values, not past values. It does not create another source subscription. Sharing is not replay.

<!-- SHAREREPLAY-NEXT -->
Store the unchanged value and its source-clock expiry (if finite); trim by count and time, then broadcast to currently subscribed observers. A retained connection continues buffering with zero observers.

<!-- SHAREREPLAY-LEAVE -->
Unsubscribe this subscriber without sending completion. Last departure disconnects and clears replay memory only with refCount=true; otherwise keep connection and replay memory.

<!-- SHAREREPLAY-LAST-RETAIN -->
Unsubscribe this subscriber without sending completion. Last departure disconnects and clears replay memory only with refCount=true; otherwise keep connection and replay memory.

<!-- SHAREREPLAY-COMPLETE-RETAIN -->
Completion terminates present subscribers and releases the source, but retains the ReplaySubject buffer for late subscribers; time-window expiry continues to apply.

<!-- SHAREREPLAY-LATE-COMPLETE -->
A joining subscriber receives the current replay buffer, oldest first, synchronously. A completed shared source replays its retained buffer and then completes without reconnecting. A subscriber arriving after retained complete immediately receives that complete, with no replayed value and no new source connection.

<!-- SHAREREPLAY-ERROR-RESET -->
A source error ends present subscribers, tears down the connection and resets the replay buffer, so a later subscriber starts a new execution.

**Time:** Source-clock values are supplied by event.now. Expiry happens when ReplaySubject trims on next/subscribe; expireAt <= now is excluded. No timer runs to evict values.

**Sharing:** One replay buffer and source connection per resulting shared Observable, not per subscriber.

**Callbacks:** No user callback, custom connector, observer side effects, or reset-notifier function is executed in the pure model.

**Excluded:** Arbitrary reentrant subscriptions/teardown and throwing observers or finalizers. Custom timestamp providers not modeled as explicitly supplied event time, fractional/negative/infinite-boundary arithmetic, and arbitrary ObservableInput conversion. No production effect interpreter or claim that finite tests establish full equivalence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-03.md) is reported separately from this specification.
