# sampleTime: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Sample a remembered source value at fixed virtual scheduler ticks.

**Scope:** Positive safe-integer period 1..1000 with a virtual FIFO scheduler and non-overlapping ticks.. Atomic post-setup notifications, no simultaneous/torn-down scheduler action execution.

**Dataflow shape:** `sampleTime(period,scheduler) : Cω(Time) → T* → T*`. Each output corresponds to one distinct source value observed since the preceding sampling event. A sampling event without a pending value emits nothing. Intermediate overwritten values are dropped. Source completes/errors immediately; pending values do not flush on source termination.

<!-- S18-SAMPLETIME-START -->
Sampling does nothing until a consumer subscribes. Subscription to the source precedes clock/notifier setup.

<!-- S18-SAMPLETIME-REMEMBER -->
A new source value overwrites the previous value. No callbacks, timing or output occur on source.next.

<!-- S18-SAMPLETIME-TICK-EMIT -->
sampleTime delegates to sample(interval(period,scheduler)); each tick samples at most one latest payload.

<!-- S18-SAMPLETIME-TICK-EMPTY -->
sampleTime delegates to sample(interval(period,scheduler)); each tick samples at most one latest payload.

<!-- S18-SAMPLETIME-COMPLETE -->
Source completion is not a sampling tick. Unobserved last values are discarded.

<!-- S18-SAMPLETIME-ERROR -->
Source errors terminate without flushing the pending value.

<!-- S18-SAMPLETIME-CANCEL -->
Cancellation ends source and sampling ownership silently.

**Time:** Ticks at period, 2×period, ... beginning at the subscription instant, using a supplied virtual scheduler.

**Sharing:** None; one independent memory and clock/notifier per result subscription.

**Callbacks:** No user predicate or projection; notifier payloads are ignored.

**Excluded:** Synchronous notifier activity while initial source/notifier subscriptions are being constructed. Non-Observable notifier inputs, source/observer reentrancy, throwing teardown and scheduler errors. Negative, zero, fractional or unbounded periods and custom scheduler implementations.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-18.md) is reported separately from this specification.
