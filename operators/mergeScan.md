# mergeScan: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Merge projected inner Observables while the most recent inner next updates the accumulator used at later admission.

**Scope:** Seed is a provided opaque R reference; concurrency 2; valid Observable-returning accumulator.. Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Dataflow shape:** `mergeScan : (R × T × Index -> R*) × R × T* -> R*`. Each projected inner may emit zero, one, many or indefinite accumulator values. Each inner next updates the state before forwarding the same value downstream. Concurrent projections receive the accumulator snapshot at their own admission. Overlap permits nondeterministic interleaving. Bounded concurrency delays projection of queued values until a slot becomes free; completion waits for all accepted inner work.

<!-- MERGESCAN-INIT -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). Subscription connects to the outer source. Pipeline construction alone starts no projection or inner execution.

<!-- MERGESCAN-ADMIT -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). An accepted outer value invokes the projection once with that value and the next zero-based admission index. The returned inner source is subscribed only after projection succeeds.

<!-- MERGESCAN-QUEUE -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). When all slots are occupied, retain the outer value in arrival order. Do not project it yet. A later inner completion admits the oldest queued value.

<!-- MERGESCAN-RETURN-ACTIVE -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). A successful projection starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- MERGESCAN-RETURN-DRAINING -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). Queued outer values still get projected after outer completion. Their inner subscriptions must also finish before the result can complete.

<!-- MERGESCAN-THROW -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). If projection throws, forward that error and tear down all owned subscriptions. Queued values are discarded without projection, and no completion follows.

<!-- MERGESCAN-NEXT-ACTIVE -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- MERGESCAN-INNER-ERROR-ACTIVE -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- MERGESCAN-CANCEL-ACTIVE -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- MERGESCAN-DRAIN-ACTIVE -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). When an inner completes, release it and admit the oldest queued value into the free slot. Its projection runs now, not when it originally arrived.

<!-- MERGESCAN-INNER-END-ACTIVE -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- MERGESCAN-NEXT-DRAINING -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- MERGESCAN-INNER-ERROR-DRAINING -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- MERGESCAN-CANCEL-DRAINING -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- MERGESCAN-DRAIN-DRAINING -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). Outer completion does not discard the queue. Continue admitting queued values as inner subscriptions finish.

<!-- MERGESCAN-INNER-END-DRAINING -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). When one of several remaining inners completes, keep waiting for the others.

<!-- MERGESCAN-LAST-INNER -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- MERGESCAN-OUTER-WAIT -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- MERGESCAN-OUTER-END -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- MERGESCAN-OUTER-ERROR -->
Accumulator snapshot for a new invocation is the latest inner next (or original seed). An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Sharing:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Callbacks:** One synchronous callback request carries {accumulator,value}, plus exact zero-based admission index; only correlated return/throw accepted.

**Excluded:** Promise/Iterable return conversions, reentrant projections, observer or finalizer throws. No promise of serial accumulation under concurrency greater than 1; this model intentionally admits stale snapshots across overlaps.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-14.md) is reported separately from this specification.
