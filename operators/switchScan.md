# switchScan: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Switch to the latest accumulator-produced Observable, updating the accumulator from each delivered inner value.

**Scope:** Opaque explicit seed, valid Observable-returning indexed accumulator and one active inner.. Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Dataflow shape:** `switchScan : Cω((R,T,Index)→R*,Seed) × T* → R*`. Each source value cancels the preceding inner before selecting its replacement. The callback sees the latest inner output as its accumulator, not the previous callback result. Stale cancelled inner notifications are illegal; successful outer completion waits for current inner completion.

<!-- SWITCHSCAN-INIT -->
State supplied at admission is the last delivered inner value, initially the seed. Subscription connects to the outer source. Pipeline construction alone starts no projection or inner execution.

<!-- SWITCHSCAN-ADMIT -->
State supplied at admission is the last delivered inner value, initially the seed. An accepted outer value invokes the projection once with that value and the next zero-based admission index. The returned inner source is subscribed only after projection succeeds.

<!-- SWITCHSCAN-REPLACE -->
State supplied at admission is the last delivered inner value, initially the seed. When another outer value arrives, unsubscribe the current inner before invoking the new projection. Only the replacement inner may subsequently contribute values; cancellation does not undo previously delivered values.

<!-- SWITCHSCAN-RETURN-ACTIVE -->
State supplied at admission is the last delivered inner value, initially the seed. A successful projection starts its inner subscription. The outer input itself is not forwarded; values come from the admitted inner.

<!-- SWITCHSCAN-THROW -->
State supplied at admission is the last delivered inner value, initially the seed. If projection throws, forward that error and tear down all owned subscriptions. Queued values are discarded without projection, and no completion follows.

<!-- SWITCHSCAN-NEXT-ACTIVE -->
State supplied at admission is the last delivered inner value, initially the seed. Values from admitted active inners are forwarded unchanged in actual delivery order.

<!-- SWITCHSCAN-INNER-ERROR-ACTIVE -->
State supplied at admission is the last delivered inner value, initially the seed. An active inner error ends the whole result, including the outer subscription and other active inners.

<!-- SWITCHSCAN-CANCEL-ACTIVE -->
State supplied at admission is the last delivered inner value, initially the seed. Downstream cancellation unsubscribes from the outer and every active inner. It neither completes the result nor projects queued values.

<!-- SWITCHSCAN-INNER-END-ACTIVE -->
State supplied at admission is the last delivered inner value, initially the seed. An inner completing does not complete the result while the outer is still open. Wait for more outer values or other active inners.

<!-- SWITCHSCAN-NEXT-DRAINING -->
State supplied at admission is the last delivered inner value, initially the seed. After the outer completes, values from remaining inners continue to flow until those inners finish.

<!-- SWITCHSCAN-INNER-ERROR-DRAINING -->
State supplied at admission is the last delivered inner value, initially the seed. An inner error while draining still ends the result immediately; other inner work and any queued values are discarded.

<!-- SWITCHSCAN-CANCEL-DRAINING -->
State supplied at admission is the last delivered inner value, initially the seed. Cancellation while draining releases the remaining inners and discards queued work without completion.

<!-- SWITCHSCAN-LAST-INNER -->
State supplied at admission is the last delivered inner value, initially the seed. The result completes only when the outer has completed and all admitted inner work, including any queue, is finished. The final cleanup order follows this operator family under the post-setup profile.

<!-- SWITCHSCAN-OUTER-WAIT -->
State supplied at admission is the last delivered inner value, initially the seed. Outer completion stops new arrivals but does not cancel the current inner work. Keep forwarding inner values and, where applicable, draining the queue.

<!-- SWITCHSCAN-OUTER-END -->
State supplied at admission is the last delivered inner value, initially the seed. If the outer completes with no inner work left, complete immediately and release the outer subscription.

<!-- SWITCHSCAN-OUTER-ERROR -->
State supplied at admission is the last delivered inner value, initially the seed. An outer error is forwarded immediately. Unlike completion, it cancels active inners and discards queued values.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Sharing:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Callbacks:** One correlated indexed invocation carries {accumulator,value}; latest delivered inner.next overwrites accumulator.

**Excluded:** Promise/Iterable conversion, undefined/invalid inner and synchronous reentrant projection. Deprecated inner result-selector mechanics outside the inspected switchScan implementation.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-19.md) is reported separately from this specification.
