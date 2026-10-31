# concatAll: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Queue inner source objects; subscribe to exactly one at a time.

**Scope:** Observable-valued outer source; no user projection. Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Dataflow shape:** `concatAll : (T*)* -> T*`. T* is each inner source; the outer delivers inner-source identities, not plain values. An accepted inner contributes zero or more values; ignored, replaced or queued inners have policy-specific lifetimes. This Cω-inspired shape excludes completion, error and cancellation, which are specified by guarded rules.

<!-- CONCATALL-INIT -->
Subscription connects to the outer source. Pipeline construction alone starts no identity conversion or inner execution.

<!-- CONCATALL-ADMIT -->
An accepted outer value invokes the identity conversion once with that value and the next zero-based admission index. The returned inner source is subscribed only after identity conversion succeeds.

<!-- CONCATALL-QUEUE -->
When all slots are occupied, retain the outer value in arrival order. Do not project it yet. A later inner completion admits the oldest queued value.

<!-- CONCATALL-RETURN-ACTIVE -->
A successful identity conversion starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- CONCATALL-RETURN-DRAINING -->
Queued outer values still get received after outer completion. Their inner subscriptions must also finish before the result can complete.

<!-- CONCATALL-NEXT-ACTIVE -->
Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- CONCATALL-INNER-ERROR-ACTIVE -->
An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- CONCATALL-CANCEL-ACTIVE -->
Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- CONCATALL-DRAIN-ACTIVE -->
When an inner completes, release it and admit the oldest queued value into the free slot. Its identity conversion runs now, not when it originally arrived.

<!-- CONCATALL-INNER-END-ACTIVE -->
An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- CONCATALL-NEXT-DRAINING -->
After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- CONCATALL-INNER-ERROR-DRAINING -->
An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- CONCATALL-CANCEL-DRAINING -->
Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- CONCATALL-DRAIN-DRAINING -->
Outer completion does not discard the queue. Continue admitting queued values as inner subscriptions finish.

<!-- CONCATALL-LAST-INNER -->
The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- CONCATALL-OUTER-WAIT -->
Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- CONCATALL-OUTER-END -->
If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- CONCATALL-OUTER-ERROR -->
An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Sharing:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Callbacks:** No user callback. A deterministic identity microstep maps an admitted outer source token to itself without time advancement or throwing.

**Excluded:** The identity microstep is a modeling refinement of the implementation, not an actual callback or a scheduling boundary. Arbitrary ObservableInput conversion, reentrant source/observer/finalizer behavior and synchronous nested teardown equivalence are outside the exact-trace profile. Invalid concurrency, throwing observers, and producer-abort guarantees are out of scope.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-03.md) is reported separately from this specification.
