# exhaust: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Deprecated exact alias of exhaustAll: flatten only the currently admitted inner Observable; ignore outer arrivals while busy.

**Scope:** Observable-valued outer source; no user projection. Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Dataflow shape:** `exhaust : (T*)* -> T*`. Only an admitted inner contributes values; arrivals during active inner are discarded without subscription. Outer completion waits for the current admitted inner; error/cancellation release current and outer subscriptions. Alias equality is verified against the pinned RxJS 7.8.2 exports and actual runtime tests.

<!-- EXHAUST-INIT -->
Exact exhaust = exhaustAll alias. Subscription connects to the outer source. Pipeline construction alone starts no identity conversion or inner execution.

<!-- EXHAUST-ADMIT -->
Exact exhaust = exhaustAll alias. An accepted outer value invokes the identity conversion once with that value and the next zero-based admission index. The returned inner source is subscribed only after identity conversion succeeds.

<!-- EXHAUST-IGNORE -->
Exact exhaust = exhaustAll alias. While an inner is active, ignore new outer values completely. They neither invoke the identity conversion nor consume an index, and they are not saved for later.

<!-- EXHAUST-RETURN-ACTIVE -->
Exact exhaust = exhaustAll alias. A successful identity conversion starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- EXHAUST-NEXT-ACTIVE -->
Exact exhaust = exhaustAll alias. Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- EXHAUST-INNER-ERROR-ACTIVE -->
Exact exhaust = exhaustAll alias. An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- EXHAUST-CANCEL-ACTIVE -->
Exact exhaust = exhaustAll alias. Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- EXHAUST-INNER-END-ACTIVE -->
Exact exhaust = exhaustAll alias. An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- EXHAUST-NEXT-DRAINING -->
Exact exhaust = exhaustAll alias. After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- EXHAUST-INNER-ERROR-DRAINING -->
Exact exhaust = exhaustAll alias. An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- EXHAUST-CANCEL-DRAINING -->
Exact exhaust = exhaustAll alias. Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- EXHAUST-LAST-INNER -->
Exact exhaust = exhaustAll alias. The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- EXHAUST-OUTER-WAIT -->
Exact exhaust = exhaustAll alias. Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- EXHAUST-OUTER-END -->
Exact exhaust = exhaustAll alias. If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- EXHAUST-OUTER-ERROR -->
Exact exhaust = exhaustAll alias. An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Sharing:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Callbacks:** No user callback. A deterministic identity microstep maps an admitted outer source token to itself without time advancement or throwing.

**Excluded:** The identity microstep is a modeling refinement of the implementation, not an actual callback or a scheduling boundary. Arbitrary ObservableInput conversion, reentrant source/observer/finalizer behavior and synchronous nested teardown equivalence are outside the exact-trace profile. Invalid concurrency, throwing observers, and producer-abort guarantees are out of scope.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-11.md) is reported separately from this specification.
