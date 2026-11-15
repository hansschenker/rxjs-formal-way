# sample: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Sample a remembered latest source value on notifier next only.

**Scope:** One external Observable notifier, no scheduling or conversion of Promise inputs.. Atomic post-setup notifications, no simultaneous/torn-down scheduler action execution.

**Dataflow shape:** `sample(notifier$) : Cω(Signal) → T* → T*`. Each output corresponds to one distinct source value observed since the preceding sampling event. A sampling event without a pending value emits nothing. Intermediate overwritten values are dropped. Source completes/errors immediately; pending values do not flush on source termination.

<!-- S18-SAMPLE-START -->
Sampling does nothing until a consumer subscribes. Subscription to the source precedes clock/notifier setup.

<!-- S18-SAMPLE-REMEMBER -->
A new source value overwrites the previous value. No callbacks, timing or output occur on source.next.

<!-- S18-SAMPLE-NOTIFIER-EMIT -->
Each notifier next releases the most recent unsampled value exactly once.

<!-- S18-SAMPLE-NOTIFIER-EMPTY -->
A notifier next without a new value does not duplicate old output.

<!-- S18-SAMPLE-NOTIFIER-COMPLETE -->
The pinned sample operator supplies noop as its notifier completion handler.

<!-- S18-SAMPLE-NOTIFIER-ERROR -->
Notifier failure fails the result and prevents further source emissions.

<!-- S18-SAMPLE-COMPLETE -->
Source completion is not a sampling tick. Unobserved last values are discarded.

<!-- S18-SAMPLE-ERROR -->
Source errors terminate without flushing the pending value.

<!-- S18-SAMPLE-CANCEL -->
Cancellation ends source and sampling ownership silently.

**Time:** Time belongs to the source and notifier; the operator introduces no clock.

**Sharing:** None; one independent memory and clock/notifier per result subscription.

**Callbacks:** No user predicate or projection; notifier payloads are ignored.

**Excluded:** Synchronous notifier activity while initial source/notifier subscriptions are being constructed. Non-Observable notifier inputs, source/observer reentrancy, throwing teardown and scheduler errors.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-18.md) is reported separately from this specification.
