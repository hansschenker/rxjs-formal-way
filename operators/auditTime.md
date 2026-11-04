# auditTime: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Start a fixed-duration silence window on the first value and emit its latest value when the scheduled duration ends.

**Scope:** Positive safe-integer duration and deferred scheduler, one scheduled task per active window. Atomic non-reentrant source, callback, observer and duration notifications after initialization. Equal timestamps are ordered by trace sequence.

**Dataflow shape:** `auditTime(d) : T* -> T*`. Emitted values are an ordered subsequence of source values; at most one per duration. Values arriving during an active duration replace the pending latest value and do not restart it. Source completion waits for the active timer; unlike debounceTime it does not flush early. Source error and downstream cancellation discard pending values and release resources.

<!-- AUDITTIME-INIT -->
Construction does not connect. Subscription acquires a source; first next starts a duration.

<!-- AUDITTIME-START -->
The first value starts a timer once; it is not emitted immediately.

<!-- AUDITTIME-REPLACE -->
Values arriving during an active duration replace the pending value; neither the selector nor timer restarts.

<!-- AUDITTIME-COMPLETE-IDLE -->
Without an active duration, completion passes downstream immediately.

<!-- AUDITTIME-COMPLETE-PENDING -->
A source completion with an active duration waits: it does not flush the pending value or cancel its duration.

<!-- AUDITTIME-DURATION-NEXT -->
A duration next ends the window and emits the latest retained source value.

<!-- AUDITTIME-WAITING-DURATION-NEXT -->
After source completion, duration next emits the latest value, then completes.

<!-- AUDITTIME-SOURCE-ERROR-IDLE -->
A source error terminates and discards any pending value.

<!-- AUDITTIME-CANCEL-IDLE -->
Cancellation does not emit completion or a pending value.

<!-- AUDITTIME-SOURCE-ERROR-PENDING -->
A source error terminates and discards any pending value.

<!-- AUDITTIME-CANCEL-PENDING -->
Cancellation does not emit completion or a pending value.

<!-- AUDITTIME-CANCEL-WAITING -->
Cancellation does not emit completion or a pending value.

**Time:** Externally supplied monotone safe-integer clock; duration signals or scheduler firings determine output time. No deadline alone emits a value.

**Sharing:** No sharing or replay introduced. Each result subscription owns its latest value and duration identity.

**Callbacks:** No user callback. Timer output is modeled as timer.fire.

**Excluded:** Inline/synchronous custom schedulers, negative/NaN/unsafe durations, non-deferred zero delay, scheduler drift guarantees. Nested source/duration emissions, cancellation inside callbacks/output delivery and throwing observers/finalizers. Universal behavioral equivalence, callback purity, and arbitrary external mutation of retained object references.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-07.md) is reported separately from this specification.
