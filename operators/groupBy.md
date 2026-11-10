# groupBy: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Publish a grouped Observable once per new key; route each subsequent input to its keyed Subject; preserve upstream while an emitted child remains subscribed.

**Scope:** key selector only; identity elements, default Subject connector, no group duration; keys use JS Map SameValueZero.. Atomic non-reentrant key callback; grouped subscribers can attach between modeled source notifications. At most one active subscriber per group.

**Dataflow shape:** `groupBy(key:T!→K!) : T* -> GroupedObservable<K,T>*; each group: T*`. Outer next cardinality equals distinct keys seen by the key selector under Map SameValueZero identity while outer is subscribed. Every source next causes one key selector invocation and one Subject.next for that key, including the first value after group creation. Group and outer completion/error are separate notifications with group-first ordering; cancellation is not completion.

<!-- S13-GROUPBY-INIT -->
Nothing runs until subscribed.

<!-- S13-GROUPBY-SELECT-Active -->
Key is computed before any grouped-value delivery.

<!-- S13-GROUPBY-DONE-Active -->
The source completion is shared across all live groups, even if outer has already unsubscribed.

<!-- S13-GROUPBY-ERROR-Active -->
Original error object reaches all subscribed groups and (unless canceled) outer.

<!-- S13-GROUPBY-ATTACH-Active -->
Group subscriptions share upstream and increase its lifetime lease.

<!-- S13-GROUPBY-DETACH-ACTIVE -->
Outer remains subscribed and keeps upstream regardless of child count.

<!-- S13-GROUPBY-SELECT-Orphaned -->
Key is computed before any grouped-value delivery.

<!-- S13-GROUPBY-DONE-Orphaned -->
The source completion is shared across all live groups, even if outer has already unsubscribed.

<!-- S13-GROUPBY-ERROR-Orphaned -->
Original error object reaches all subscribed groups and (unless canceled) outer.

<!-- S13-GROUPBY-ATTACH-Orphaned -->
Group subscriptions share upstream and increase its lifetime lease.

<!-- S13-GROUPBY-DETACH-RETAIN -->
Orphaned outer has no ownership, but another child still does.

<!-- S13-GROUPBY-DETACH-LAST -->
This is the deferred groupBy teardown observed when group subscriptions outlive the outer consumer.

<!-- S13-GROUPBY-KEY-EXISTING-Active -->
No second outer GroupedObservable is emitted for the same key.

<!-- S13-GROUPBY-KEY-NEW-Active -->
Group announcements precede first keyed value, allowing a synchronous outer observer to subscribe.

<!-- S13-GROUPBY-KEY-THROW-Active -->
The key selector error is delivered to all groups before the outer, with exact identity.

<!-- S13-GROUPBY-KEY-EXISTING-Orphaned -->
No second outer GroupedObservable is emitted for the same key.

<!-- S13-GROUPBY-KEY-NEW-Orphaned -->
Group announcements precede first keyed value, allowing a synchronous outer observer to subscribe.

<!-- S13-GROUPBY-KEY-THROW-Orphaned -->
The key selector error is delivered to all groups before the outer, with exact identity.

<!-- S13-GROUPBY-CANCEL-NO-CHILD -->
No live consumer keeps the source connected.

<!-- S13-GROUPBY-CANCEL-WITH-CHILD -->
groupBy intentionally keeps source alive for subscribed child groups.

**Time:** No timer/scheduler. Keys are assigned in source arrival order. A new group is announced before its first Subject.next.

**Sharing:** The original source is shared between grouped Subject consumers by this operator instance; output groups themselves are live multicast Subjects.

**Callbacks:** One synchronous key selector outcome per source value, supplied externally; pure model never executes application logic.

**Excluded:** Optional element, duration and custom connector profiles, including duration-driven group closure and reuse. Multiple simultaneous subscribers per group; subscription inside the very same source-next action word is represented by ordered effects, not a nested model microstep. User callback/observer reentrancy, throwing group subscribers and group subscriptions after terminal teardown.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-13.md) is reported separately from this specification.
