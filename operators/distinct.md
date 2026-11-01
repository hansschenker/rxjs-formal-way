# distinct: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Forward values whose selected key is not in the Set of ANY previously forwarded keys since the last flush.

**Scope:** selected=false, withFlushes=true. Full Set for finite trace prefixes.. Non-reentrant source, notifier and observers; post-setup notifier subscription after source subscription.

**Dataflow shape:** `distinct : T* x Flush*? -> T*`. At most one original value is forwarded per source value; no key is replayed or emitted. Set membership is SameValueZero, unlike the default strict comparator of distinctUntilChanged. Optional flush.next clears history. Source completion/error/cancellation ends output independently.

<!-- DISTINCT-INIT -->
Each result subscription begins with its own empty set. When a flush notifier is supplied, source subscription happens before notifier subscription in the scoped post-setup trace.

<!-- DISTINCT-SELECT -->
When a user keySelector is provided, invoke it for EVERY source value, even values ultimately discarded. This operation is synchronous; thrown selectors are terminal.

<!-- DISTINCT-DIRECT-PASS -->
Without a keySelector, distinct compares source values using Set membership. A previously unseen value is added before forwarding the ORIGINAL value; NaN equals NaN in a Set.

<!-- DISTINCT-DIRECT-DROP -->
Any repeated key is dropped, even if other values occurred in between. Only flush notifications can clear historical Set membership.

<!-- DISTINCT-KEY-PASS -->
A selector result absent from the Set is remembered, and the original source value (not the key) is forwarded unchanged.

<!-- DISTINCT-KEY-DROP -->
A selected key already in the Set suppresses the source value. It does not replace or delete any remembered key.

<!-- DISTINCT-KEY-ERROR -->
A throwing keySelector ends the stream immediately. The original input is not forwarded and both owned subscriptions are released.

<!-- DISTINCT-FLUSH -->
Each flush notifier next clears the entire remembered key set. It does not produce a downstream next or complete notification.

<!-- DISTINCT-FLUSH-COMPLETE -->
Flush notifier completion is ignored as a downstream lifecycle event. Existing keys remain; the notifier subscription closes.

<!-- DISTINCT-FLUSH-ERROR -->
A flush notifier error propagates downstream, immediately tearing down the source and notifier. It is not treated as a harmless reset.

<!-- DISTINCT-COMPLETE -->
When the source completes, distinct does not emit its Set. It completes and releases any still-active flush subscription.

<!-- DISTINCT-ERROR -->
Source errors terminate without clearing or emitting the remembered Set. The source and notifier are released.

<!-- DISTINCT-CANCEL -->
Downstream unsubscription releases both owned subscriptions. Cancellation is not a completion event.

**Time:** No scheduling or clock. Flush and source timestamps/order come from external deliveries; equal-time tie order is explicit.

**Sharing:** No sharing introduced; each subscription owns its own Set and notifier subscription.

**Callbacks:** An optional keySelector is modeled by an external correlated key.return/key.throw; no user callback runs in guards. Without it, key is the original value and membership is checked directly.

**Excluded:** Arbitrary nested deliveries, source completion during synchronous notifier wiring, and throwing observers/finalizers. Unbounded keys for infinite sources, safe-integer overflow, generalized ObservableInput flush conversions, and production effect interpretation.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-04.md) is reported separately from this specification.
