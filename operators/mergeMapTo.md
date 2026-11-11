# mergeMapTo: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Allow overlapping subscriptions to the same configured inner Observable; a source next admits one new occurrence.

**Scope:** One valid constant Observable source and concurrency 2; no resultSelector.. Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Dataflow shape:** `mergeMapTo : T* × U* -> U*`. Each accepted source next starts a NEW subscription occurrence to the same Observable object. Concurrent occurrences can overlap and interleave; bounded concurrency queues outer values FIFO. Outer completion waits for admitted and queued occurrences, while errors or cancellation release owned inners.

<!-- MERGEMAPTO-INIT -->
Subscription connects to the outer source. Pipeline construction alone starts no constant-source binding or inner execution.

<!-- MERGEMAPTO-ADMIT -->
An accepted outer value invokes the constant-source binding once with that value and the next zero-based admission index. The returned inner source is subscribed only after constant-source binding succeeds.

<!-- MERGEMAPTO-QUEUE -->
When all slots are occupied, retain the outer value in arrival order. Do not project it yet. A later inner completion admits the oldest queued value.

<!-- MERGEMAPTO-RETURN-ACTIVE -->
A successful constant-source binding starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- MERGEMAPTO-RETURN-DRAINING -->
Queued outer values still get projected after outer completion. Their inner subscriptions must also finish before the result can complete.

<!-- MERGEMAPTO-NEXT-ACTIVE -->
Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- MERGEMAPTO-INNER-ERROR-ACTIVE -->
An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- MERGEMAPTO-CANCEL-ACTIVE -->
Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- MERGEMAPTO-DRAIN-ACTIVE -->
When an inner completes, release it and admit the oldest queued value into the free slot. Its constant-source binding runs now, not when it originally arrived.

<!-- MERGEMAPTO-INNER-END-ACTIVE -->
An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- MERGEMAPTO-NEXT-DRAINING -->
After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- MERGEMAPTO-INNER-ERROR-DRAINING -->
An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- MERGEMAPTO-CANCEL-DRAINING -->
Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- MERGEMAPTO-DRAIN-DRAINING -->
Outer completion does not discard the queue. Continue admitting queued values as inner subscriptions finish.

<!-- MERGEMAPTO-INNER-END-DRAINING -->
When one of several remaining inners completes, keep waiting for the others.

<!-- MERGEMAPTO-LAST-INNER -->
The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- MERGEMAPTO-OUTER-WAIT -->
Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- MERGEMAPTO-OUTER-END -->
If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- MERGEMAPTO-OUTER-ERROR -->
An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Sharing:** No sharing introduced. Repeated subscriptions may be to the same external Observable identity, which can itself be hot.

**Callbacks:** No user projection; immediate callback.return is a pure constant-source binding microstep.

**Excluded:** Deprecated resultSelector overload, Promise/Iterable input, invalid constant source. Synchronous reentrant input/inner emission during acquisition, throwing observers or finalizers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-14.md) is reported separately from this specification.
