# switchMapTo: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Restart subscription to the same constant inner Observable on each outer next; cancel the previous occurrence before replacement.

**Scope:** One fixed valid Observable token supplied at operator construction, no resultSelector.. Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Dataflow shape:** `switchMapTo(inner) : Cω(Observable) × T* → U*`. Each outer next cancels its predecessor occurrence and starts a fresh subscription to the configured object. Only values from the latest occurrence flow; outer completion waits for the current inner to complete. A shared/hot configured Observable can remain active independently of per-occurrence cancellation.

<!-- SWITCHMAPTO-INIT -->
An outer value starts a new occurrence of the same configured Observable. Subscription connects to the outer source. Pipeline construction alone starts no projection or inner execution.

<!-- SWITCHMAPTO-ADMIT -->
An outer value starts a new occurrence of the same configured Observable. An accepted outer value invokes the projection once with that value and the next zero-based admission index. The returned inner source is subscribed only after projection succeeds.

<!-- SWITCHMAPTO-REPLACE -->
An outer value starts a new occurrence of the same configured Observable. When another outer value arrives, unsubscribe the current inner before invoking the new projection. Only the replacement inner may subsequently contribute values; cancellation does not undo previously delivered values.

<!-- SWITCHMAPTO-RETURN-ACTIVE -->
An outer value starts a new occurrence of the same configured Observable. A successful projection starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- SWITCHMAPTO-NEXT-ACTIVE -->
An outer value starts a new occurrence of the same configured Observable. Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- SWITCHMAPTO-INNER-ERROR-ACTIVE -->
An outer value starts a new occurrence of the same configured Observable. An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- SWITCHMAPTO-CANCEL-ACTIVE -->
An outer value starts a new occurrence of the same configured Observable. Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- SWITCHMAPTO-INNER-END-ACTIVE -->
An outer value starts a new occurrence of the same configured Observable. An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- SWITCHMAPTO-NEXT-DRAINING -->
An outer value starts a new occurrence of the same configured Observable. After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- SWITCHMAPTO-INNER-ERROR-DRAINING -->
An outer value starts a new occurrence of the same configured Observable. An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- SWITCHMAPTO-CANCEL-DRAINING -->
An outer value starts a new occurrence of the same configured Observable. Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- SWITCHMAPTO-LAST-INNER -->
An outer value starts a new occurrence of the same configured Observable. The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- SWITCHMAPTO-OUTER-WAIT -->
An outer value starts a new occurrence of the same configured Observable. Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- SWITCHMAPTO-OUTER-END -->
An outer value starts a new occurrence of the same configured Observable. If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- SWITCHMAPTO-OUTER-ERROR -->
An outer value starts a new occurrence of the same configured Observable. An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Sharing:** Operator creates no sharing; each outer value subscribes anew to the SAME Observable object.

**Callbacks:** Internal constant-binding step correlates with the outer admission index; no user projection is invoked.

**Excluded:** Deprecated resultSelector overload and ObservableInput Promise/Iterable conversions. Synchronous inner acquisition-time emissions, observer reentrancy and throwing finalizers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-19.md) is reported separately from this specification.
