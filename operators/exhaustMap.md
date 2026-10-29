# exhaustMap: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Ignore new outer values while an inner is active; resume admission when it completes.

**Scope:** Named projection binding; concurrency 1; nonnegative safe-integer invocation indices. Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Dataflow shape:** `exhaustMap : (T! x Index! -> R*) -> T* -> R*`. A projection describes an inner stream, not one guaranteed result; each accepted inner may emit zero, many or indefinitely many values. The signature omits termination, cancellation and scheduling; the named rules supply those policies. Ignored arrivals do not invoke the projection and do not advance its index.

<!-- EXHAUSTMAP-INIT -->
Subscription connects to the outer source. Pipeline construction alone starts no projection or inner execution.

<!-- EXHAUSTMAP-ADMIT -->
An accepted outer value invokes the projection once with that value and the next zero-based admission index. The returned inner source is subscribed only after projection succeeds.

<!-- EXHAUSTMAP-IGNORE -->
While an inner is active, ignore new outer values completely. They neither invoke the projection nor consume an index, and they are not saved for later.

<!-- EXHAUSTMAP-RETURN-ACTIVE -->
A successful projection starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- EXHAUSTMAP-THROW -->
If projection throws, forward that error and tear down all owned subscriptions. Queued values are discarded without projection, and no completion follows.

<!-- EXHAUSTMAP-NEXT-ACTIVE -->
Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- EXHAUSTMAP-INNER-ERROR-ACTIVE -->
An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- EXHAUSTMAP-CANCEL-ACTIVE -->
Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- EXHAUSTMAP-INNER-END-ACTIVE -->
An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- EXHAUSTMAP-NEXT-DRAINING -->
After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- EXHAUSTMAP-INNER-ERROR-DRAINING -->
An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- EXHAUSTMAP-CANCEL-DRAINING -->
Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- EXHAUSTMAP-LAST-INNER -->
The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- EXHAUSTMAP-OUTER-WAIT -->
Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- EXHAUSTMAP-OUTER-END -->
If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- EXHAUSTMAP-OUTER-ERROR -->
An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Sharing:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Callbacks:** A pure rule requests projection once; a correlated return names an external valid Observable binding. A driver resolves inner subscription resources through the returned source-token registry.

**Excluded:** Deprecated resultSelector, arbitrary ObservableInput conversion, invalid project results and unsafe index overflow. Reentrant source/projection/observer/finalizer calls, cancellation inside notification delivery, throwing observers or finalizers. No producer-abort guarantee: unsubscribe stops this subscription; external work stops only if its teardown implements cancellation. Synchronous inner notification behavior is characterized separately; post-setup cleanup order is not asserted for every synchronous producer.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-02.md) is reported separately from this specification.
