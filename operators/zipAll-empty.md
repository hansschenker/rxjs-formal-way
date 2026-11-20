# zipAll: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Collect inner descriptions until outer completion, then pair each inner's kth value with FIFO memory.

**Scope:** Tuple-output profile; 0..8 valid Observable occurrences; at most 8 unmatched queued values per input. Constructor bounds maxInners 0..16 and bufferLimit 1..16 are model scope, not RxJS capacities.. Post-setup non-reentrant notifications. Outer and inner subscription setup return without notifying or advancing time; cancellation occurs between reactions.

**Dataflow shape:** `zipAll : (T*)* → [T]*`. Outer next retains one description; no inner is connected before outer completes. After collection of n > 0 inputs, each tuple contains one oldest queued value from every occurrence in outer order. A completed input remains usable until its FIFO is empty; then the result completes without waiting for the other inputs. Empty outer completes without a tuple. An outer that never completes never activates its collected inner descriptions.

<!-- S23-ZIPALL-START -->
Descriptions do nothing until a result connection exists.

<!-- S23-ZIPALL-COLLECT -->
Repeated occurrences of the same producer remain distinct future subscriptions.

<!-- S23-ZIPALL-OUTER-EMPTY -->
Joining zero streams is EMPTY. No inner connection occurs.

<!-- S23-ZIPALL-OUTER-JOIN -->
toArray forwards its collected list during completion. The deferred inner connections are established before the outer producer teardown runs.

<!-- S23-ZIPALL-OUTER-ERROR -->
An outer error does not convert the accumulated descriptions into a join.

<!-- S23-ZIPALL-CANCEL-COLLECT -->
Cancellation is not completion and never activates the collected inners.

<!-- S23-ZIPALL-INNER-BUFFER -->
An unmatched value waits. It is neither overwritten by a newer value nor used as backpressure.

<!-- S23-ZIPALL-INNER-EMIT -->
The arrival supplying the final missing member triggers the tuple; at most one tuple is produced by this atomic arrival.

<!-- S23-ZIPALL-INNER-DRAIN -->
The joinAll mergeMap waits for zip finalization before delivering successful completion; producer releases precede downstream complete.

<!-- S23-ZIPALL-INNER-COMPLETE-BUFFERED -->
Completion does not discard values already available for future tuples.

<!-- S23-ZIPALL-INNER-COMPLETE-EMPTY -->
No further tuple is possible when a completed input has no value remaining, even if other inners never complete.

<!-- S23-ZIPALL-INNER-ERROR -->
Error is forwarded before teardown; it does not use the successful-completion finalization path.

<!-- S23-ZIPALL-CANCEL-JOIN -->
Cancellation does not flush a partial tuple or notify completion.

**Time:** No clock, scheduler or timer is introduced. Outer/inner sources supply notification times; equal-time inputs retain explicit arrival order.

**Sharing:** No implicit sharing or replay. Each result connection owns collection and FIFO state; repeated descriptions create separate input subscriptions even when they refer to one shared producer.

**Callbacks:** No projector in the canonical profile. Values and source tokens are opaque references; no user function runs in guards or transitions.

**Excluded:** Optional projector return/throw and synchronous outer or inner setup are separately native-characterized, outside this canonical alphabet. Non-Observable inputs and arbitrary ObservableInput conversions. Histories exceeding source/FIFO bounds, unsafe counters, arbitrary reentrancy, producer-token mutation and cancellation during a notification. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-23-ZIP-ALL.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-23.md) is reported separately from this specification.
