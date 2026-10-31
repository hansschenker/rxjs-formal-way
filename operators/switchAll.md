# switchAll: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Only latest: replace the previous inner source subscription with the newest.

**Scope:** Observable-valued outer source; no user projection. Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Dataflow shape:** `switchAll : (T*)* -> T*`. T* is each inner source; the outer delivers inner-source identities, not plain values. An accepted inner contributes zero or more values; ignored, replaced or queued inners have policy-specific lifetimes. This Cω-inspired shape excludes completion, error and cancellation, which are specified by guarded rules.

<!-- SWITCHALL-INIT -->
Subscription connects to the outer source. Pipeline construction alone starts no identity conversion or inner execution.

<!-- SWITCHALL-ADMIT -->
An accepted outer value invokes the identity conversion once with that value and the next zero-based admission index. The returned inner source is subscribed only after identity conversion succeeds.

<!-- SWITCHALL-REPLACE -->
When another outer value arrives, unsubscribe the current inner before invoking the new identity conversion. Only the replacement inner may subsequently contribute values; cancellation does not undo previously delivered values.

<!-- SWITCHALL-RETURN-ACTIVE -->
A successful identity conversion starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- SWITCHALL-NEXT-ACTIVE -->
Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- SWITCHALL-INNER-ERROR-ACTIVE -->
An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- SWITCHALL-CANCEL-ACTIVE -->
Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- SWITCHALL-INNER-END-ACTIVE -->
An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- SWITCHALL-NEXT-DRAINING -->
After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- SWITCHALL-INNER-ERROR-DRAINING -->
An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- SWITCHALL-CANCEL-DRAINING -->
Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- SWITCHALL-LAST-INNER -->
The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- SWITCHALL-OUTER-WAIT -->
Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- SWITCHALL-OUTER-END -->
If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- SWITCHALL-OUTER-ERROR -->
An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Sharing:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Callbacks:** No user callback. A deterministic identity microstep maps an admitted outer source token to itself without time advancement or throwing.

**Excluded:** The identity microstep is a modeling refinement of the implementation, not an actual callback or a scheduling boundary. Arbitrary ObservableInput conversion, reentrant source/observer/finalizer behavior and synchronous nested teardown equivalence are outside the exact-trace profile. Invalid concurrency, throwing observers, and producer-abort guarantees are out of scope.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-03.md) is reported separately from this specification.
