# expand: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Emit each admitted value, project it to an inner Observable, and recursively feed inner values back through the same expansion policy.

**Scope:** default unbounded concurrency; scheduler omitted. Atomic non-reentrant projection outcomes and inner notifications; synchronous setup-time inner emissions are characterized only by native tests, not forced into the pure event model.

**Dataflow shape:** `expand : (T! x Index! -> T*) -> T* -> T*`. Every admitted outer or recursive inner value is emitted before its projection is subscribed. Unbounded profile admits every value immediately; no expansion queue is formed. Outer completion waits for all admitted recursive inners and buffered values. Cω counts next values; terminal notifications, cancellation and resource release are separate obligations.

<!-- EXPAND-INIT -->
Expansion is lazy; projection has not run yet.

<!-- EXPAND-OUTER-ADMIT -->
expand differs from mergeMap: every admitted input is itself emitted before its projection is subscribed.

<!-- EXPAND-INNER-ADMIT-ACTIVE -->
An inner value becomes a new expansion input; it is not merely forwarded.

<!-- EXPAND-INNER-ADMIT-DRAINING -->
An inner value becomes a new expansion input; it is not merely forwarded.

<!-- EXPAND-PROJECT-RETURN -->
Each successful projection creates one independently identified inner subscription occurrence.

<!-- EXPAND-PROJECT-RETURN-DRAINING -->
Recursive work remains legal after the original outer has completed.

<!-- EXPAND-PROJECT-THROW -->
Projection exceptions terminate expansion immediately.

<!-- EXPAND-INNER-COMPLETE-ACTIVE -->
Completion removes only that inner occurrence while the outer remains open.

<!-- EXPAND-INNER-COMPLETE-DRAINING-MORE -->
Draining continues until every admitted recursive inner has completed.

<!-- EXPAND-INNER-COMPLETE-DRAINING-LAST -->
Outer is already complete, so the last recursive inner completion terminates expand.

<!-- EXPAND-INNER-ERROR-ACTIVE -->
Any admitted recursive inner error is terminal.

<!-- EXPAND-INNER-ERROR-DRAINING -->
Any admitted recursive inner error is terminal.

<!-- EXPAND-OUTER-COMPLETE -->
Outer completion is not completion of expansion while recursive work remains.

<!-- EXPAND-OUTER-COMPLETE-IDLE -->
The result completes when outer is done and no recursive work is live or buffered.

<!-- EXPAND-OUTER-ERROR -->
Outer error cancels recursive work.

<!-- EXPAND-CANCEL-ACTIVE -->
Cancellation drops buffered recursive values and never synthesizes completion.

<!-- EXPAND-CANCEL-DRAINING -->
Cancellation drops buffered recursive values and never synthesizes completion.

<!-- EXPAND-CANCEL-CALLING -->
The pending callback outcome is ignored after cancellation in this scoped model.

**Time:** No scheduler in the accepted profiles. Source/inner delivery order supplies time.

**Sharing:** No sharing is introduced; each result subscription owns independent state and resources.

**Callbacks:** Projection is external: one correlated project(value,index) invocation per admitted value; modeled returns name Observable source tokens.

**Excluded:** Deprecated scheduler argument, arbitrary ObservableInput conversion, concurrency values other than 1 or unbounded. Projection/observer/finalizer reentrancy and cancellation inside notification delivery.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-12.md) is reported separately from this specification.
