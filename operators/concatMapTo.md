# concatMapTo: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Queue each outer value; repeatedly connect the SAME configured inner Observable one at a time.

**Scope:** One bound valid Observable, reused as the constant inner source; no resultSelector overload.. Non-reentrant post-setup notifications, callback binding resolved synchronously before the next external event.

**Dataflow shape:** `concatMapTo : T* × U* → U*`. Each outer next adds one occurrence of the constant inner Observable identity. Only one occurrence is subscribed at a time; excess occurrences queue in arrival order. A new subscription to the SAME Observable is opened after the previous inner completes. Outer completion waits for the currently active occurrence and queued occurrences; an infinite inner prevents further progress.

<!-- CONCATMAPTO-INIT -->
Subscription connects to the outer source. Pipeline construction alone starts no constant source binding or inner execution.

<!-- CONCATMAPTO-ADMIT -->
An accepted outer value invokes the constant source binding once with that value and the next zero-based admission index. The returned inner source is subscribed only after constant source binding succeeds.

<!-- CONCATMAPTO-QUEUE -->
When all slots are occupied, retain the outer value in arrival order. Do not project it yet. A later inner completion admits the oldest queued value.

<!-- CONCATMAPTO-RETURN-ACTIVE -->
A successful constant source binding starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- CONCATMAPTO-RETURN-DRAINING -->
Queued outer values still get repeated after outer completion. Their inner subscriptions must also finish before the result can complete.

<!-- CONCATMAPTO-NEXT-ACTIVE -->
Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- CONCATMAPTO-INNER-ERROR-ACTIVE -->
An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- CONCATMAPTO-CANCEL-ACTIVE -->
Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- CONCATMAPTO-DRAIN-ACTIVE -->
When an inner completes, release it and admit the oldest queued value into the free slot. Its constant source binding runs now, not when it originally arrived.

<!-- CONCATMAPTO-INNER-END-ACTIVE -->
An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- CONCATMAPTO-NEXT-DRAINING -->
After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- CONCATMAPTO-INNER-ERROR-DRAINING -->
An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- CONCATMAPTO-CANCEL-DRAINING -->
Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- CONCATMAPTO-DRAIN-DRAINING -->
Outer completion does not discard the queue. Continue admitting queued values as inner subscriptions finish.

<!-- CONCATMAPTO-LAST-INNER -->
The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- CONCATMAPTO-OUTER-WAIT -->
Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- CONCATMAPTO-OUTER-END -->
If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- CONCATMAPTO-OUTER-ERROR -->
An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** All input and inner notifications are externally ordered; no timers or schedulers are introduced.

**Sharing:** No sharing is created. Multiple subscriptions may connect to one and the same externally supplied Observable object; the producer may independently be hot.

**Callbacks:** No user projection. callback.return is a pure, immediate constant-source binding microstep required by the existing guarded flattening runner; only the exact constant token is admissible.

**Excluded:** Deprecated resultSelector overload, Promise/Iterable conversion, invalid inner source, synchronous reentrant inner delivery during subscription. Observer/finalizer throws and cancellation inside a notification or resource acquisition. No guarantee that unsubscribing cancels external work lacking actual Observable teardown.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-09.md) is reported separately from this specification.
