# audit: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Start a duration Observable from the first value, retain latest values while it is active, and emit only on its next signal.

**Scope:** Named duration selector returning a valid Observable; exactly one live duration Observable per result subscription. Atomic non-reentrant source, callback, observer and duration notifications after initialization. Equal timestamps are ordered by trace sequence.

**Dataflow shape:** `audit : (T! -> U*) -> T* -> T*`. Emitted values are an ordered subsequence of source values; at most one per duration. Values arriving during an active duration replace the pending latest value and do not restart it. Duration next flushes; duration completion without next discards the pending value. Source completion waits for the active duration. Source error and downstream cancellation discard pending values and release resources.

<!-- AUDIT-INIT -->
Construction does not connect. Subscription acquires a source; first next starts a duration.

<!-- AUDIT-START -->
With no active duration, the first source value is remembered and requests one selector call.

<!-- AUDIT-REPLACE -->
Values arriving during an active duration replace the pending value; neither the selector nor timer restarts.

<!-- AUDIT-COMPLETE-IDLE -->
Without an active duration, completion passes downstream immediately.

<!-- AUDIT-COMPLETE-PENDING -->
A source completion with an active duration waits: it does not flush the pending value or cancel its duration.

<!-- AUDIT-CALL-RETURN -->
The selector returns a valid duration Observable; the model subscribes, but does not execute the callback itself.

<!-- AUDIT-CALL-THROW -->
Throwing durationSelector terminates immediately; no pending value is emitted.

<!-- AUDIT-DURATION-NEXT -->
A duration next ends the window and emits the latest retained source value.

<!-- AUDIT-DURATION-COMPLETE -->
A duration that only completes is not a next signal. audit does not flush the pending value.

<!-- AUDIT-DURATION-ERROR -->
An active duration error terminates downstream and discards the pending value.

<!-- AUDIT-WAITING-DURATION-NEXT -->
After source completion, duration next emits the latest value, then completes.

<!-- AUDIT-WAITING-DURATION-COMPLETE -->
A duration that only completes is not a next signal. audit does not flush the pending value.

<!-- AUDIT-WAITING-DURATION-ERROR -->
An active duration error terminates downstream and discards the pending value.

<!-- AUDIT-SOURCE-ERROR-IDLE -->
A source error terminates and discards any pending value.

<!-- AUDIT-CANCEL-IDLE -->
Cancellation does not emit completion or a pending value.

<!-- AUDIT-SOURCE-ERROR-CALLING -->
A source error terminates and discards any pending value.

<!-- AUDIT-CANCEL-CALLING -->
Cancellation does not emit completion or a pending value.

<!-- AUDIT-SOURCE-ERROR-PENDING -->
A source error terminates and discards any pending value.

<!-- AUDIT-CANCEL-PENDING -->
Cancellation does not emit completion or a pending value.

<!-- AUDIT-CANCEL-WAITING -->
Cancellation does not emit completion or a pending value.

**Time:** Externally supplied monotone safe-integer clock; duration signals or scheduler firings determine output time. No deadline alone emits a value.

**Sharing:** No sharing or replay introduced. Each result subscription owns its latest value and duration identity.

**Callbacks:** Selector invocation is an action; a correlated return represents a valid Observable, without running the selector in guards or in the model runner.

**Excluded:** Promise/iterable ObservableInput conversion and synchronous inner notification during subscription setup. Nested source/duration emissions, cancellation inside callbacks/output delivery and throwing observers/finalizers. Universal behavioral equivalence, callback purity, and arbitrary external mutation of retained object references.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-07.md) is reported separately from this specification.
