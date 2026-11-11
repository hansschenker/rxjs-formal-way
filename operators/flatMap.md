# flatMap: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Deprecated exact alias of mergeMap; allow overlapping inner subscriptions with configured concurrency.

**Scope:** Named projection binding; concurrency 2; nonnegative safe-integer invocation indices. Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Dataflow shape:** `flatMap : (T! × Index! -> U*) -> T* -> U*`. A projection describes an inner stream, not one guaranteed result; each accepted inner may emit zero, many or indefinitely many values. The signature omits termination, cancellation and scheduling; the named rules supply those policies. The index advances when projection starts, not while a value waits in a queue. Alias equality is checked against the pinned RxJS export at runtime.

<!-- FLATMAP-INIT -->
Pinned flatMap = mergeMap exact alias. Subscription connects to the outer source. Pipeline construction alone starts no projection or inner execution.

<!-- FLATMAP-ADMIT -->
Pinned flatMap = mergeMap exact alias. An accepted outer value invokes the projection once with that value and the next zero-based admission index. The returned inner source is subscribed only after projection succeeds.

<!-- FLATMAP-QUEUE -->
Pinned flatMap = mergeMap exact alias. When all slots are occupied, retain the outer value in arrival order. Do not project it yet. A later inner completion admits the oldest queued value.

<!-- FLATMAP-RETURN-ACTIVE -->
Pinned flatMap = mergeMap exact alias. A successful projection starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- FLATMAP-RETURN-DRAINING -->
Pinned flatMap = mergeMap exact alias. Queued outer values still get projected after outer completion. Their inner subscriptions must also finish before the result can complete.

<!-- FLATMAP-THROW -->
Pinned flatMap = mergeMap exact alias. If projection throws, forward that error and tear down all owned subscriptions. Queued values are discarded without projection, and no completion follows.

<!-- FLATMAP-NEXT-ACTIVE -->
Pinned flatMap = mergeMap exact alias. Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- FLATMAP-INNER-ERROR-ACTIVE -->
Pinned flatMap = mergeMap exact alias. An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- FLATMAP-CANCEL-ACTIVE -->
Pinned flatMap = mergeMap exact alias. Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- FLATMAP-DRAIN-ACTIVE -->
Pinned flatMap = mergeMap exact alias. When an inner completes, release it and admit the oldest queued value into the free slot. Its projection runs now, not when it originally arrived.

<!-- FLATMAP-INNER-END-ACTIVE -->
Pinned flatMap = mergeMap exact alias. An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- FLATMAP-NEXT-DRAINING -->
Pinned flatMap = mergeMap exact alias. After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- FLATMAP-INNER-ERROR-DRAINING -->
Pinned flatMap = mergeMap exact alias. An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- FLATMAP-CANCEL-DRAINING -->
Pinned flatMap = mergeMap exact alias. Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- FLATMAP-DRAIN-DRAINING -->
Pinned flatMap = mergeMap exact alias. Outer completion does not discard the queue. Continue admitting queued values as inner subscriptions finish.

<!-- FLATMAP-INNER-END-DRAINING -->
Pinned flatMap = mergeMap exact alias. When one of several remaining inners completes, keep waiting for the others.

<!-- FLATMAP-LAST-INNER -->
Pinned flatMap = mergeMap exact alias. The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- FLATMAP-OUTER-WAIT -->
Pinned flatMap = mergeMap exact alias. Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- FLATMAP-OUTER-END -->
Pinned flatMap = mergeMap exact alias. If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- FLATMAP-OUTER-ERROR -->
Pinned flatMap = mergeMap exact alias. An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Sharing:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Callbacks:** A pure rule requests projection once; a correlated return names an external valid Observable binding. A driver resolves inner subscription resources through the returned source-token registry.

**Excluded:** Deprecated resultSelector, arbitrary ObservableInput conversion, invalid project results and unsafe index overflow. Reentrant source/projection/observer/finalizer calls, cancellation inside notification delivery, throwing observers or finalizers. No producer-abort guarantee: unsubscribe stops this subscription; external work stops only if its teardown implements cancellation. Synchronous inner notification behavior is characterized separately; post-setup cleanup order is not asserted for every synchronous producer.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-14.md) is reported separately from this specification.
