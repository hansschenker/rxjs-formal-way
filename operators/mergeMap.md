# mergeMap: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Allow overlap up to the concurrency limit; queue excess outer values before projection.

**Scope:** Named projection binding; concurrency 2; nonnegative safe-integer invocation indices. Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Dataflow shape:** `mergeMap : (T! x Index! -> R*) -> T* -> R*`. A projection describes an inner stream, not one guaranteed result; each accepted inner may emit zero, many or indefinitely many values. The signature omits termination, cancellation and scheduling; the named rules supply those policies. The index advances when projection starts, not while a value waits in a queue.

<!-- MERGEMAP-INIT -->
Subscription connects to the outer source. Pipeline construction alone starts no projection or inner execution.

<!-- MERGEMAP-ADMIT -->
An accepted outer value invokes the projection once with that value and the next zero-based admission index. The returned inner source is subscribed only after projection succeeds.

<!-- MERGEMAP-QUEUE -->
When all slots are occupied, retain the outer value in arrival order. Do not project it yet. A later inner completion admits the oldest queued value.

<!-- MERGEMAP-RETURN-ACTIVE -->
A successful projection starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- MERGEMAP-RETURN-DRAINING -->
Queued outer values still get projected after outer completion. Their inner subscriptions must also finish before the result can complete.

<!-- MERGEMAP-THROW -->
If projection throws, forward that error and tear down all owned subscriptions. Queued values are discarded without projection, and no completion follows.

<!-- MERGEMAP-NEXT-ACTIVE -->
Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- MERGEMAP-INNER-ERROR-ACTIVE -->
An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- MERGEMAP-CANCEL-ACTIVE -->
Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- MERGEMAP-DRAIN-ACTIVE -->
When an inner completes, release it and admit the oldest queued value into the free slot. Its projection runs now, not when it originally arrived.

<!-- MERGEMAP-INNER-END-ACTIVE -->
An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- MERGEMAP-NEXT-DRAINING -->
After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- MERGEMAP-INNER-ERROR-DRAINING -->
An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- MERGEMAP-CANCEL-DRAINING -->
Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- MERGEMAP-DRAIN-DRAINING -->
Outer completion does not discard the queue. Continue admitting queued values as inner subscriptions finish.

<!-- MERGEMAP-INNER-END-DRAINING -->
When one of several remaining inners completes, keep waiting for the others.

<!-- MERGEMAP-LAST-INNER -->
The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- MERGEMAP-OUTER-WAIT -->
Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- MERGEMAP-OUTER-END -->
If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- MERGEMAP-OUTER-ERROR -->
An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Sharing:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Callbacks:** A pure rule requests projection once; a correlated return names an external valid Observable binding. A driver resolves inner subscription resources through the returned source-token registry.

**Excluded:** Deprecated resultSelector, arbitrary ObservableInput conversion, invalid project results and unsafe index overflow. Reentrant source/projection/observer/finalizer calls, cancellation inside notification delivery, throwing observers or finalizers. No producer-abort guarantee: unsubscribe stops this subscription; external work stops only if its teardown implements cancellation. Synchronous inner notification behavior is characterized separately; post-setup cleanup order is not asserted for every synchronous producer.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-02.md) is reported separately from this specification.
