# debounceTime: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Keep the latest pending value and emit it after silence, or flush it on source completion.

**Scope:** Nonnegative safe-integer dueTime; all clock readings, deadlines and generations remain in the safe-integer domain. Atomic external reactions after source subscription setup; equal-time order is supplied explicitly, not inferred from timestamps.

**Dataflow shape:** `debounceTime(d) : T* -> T*`. Outputs are an ordered subsequence of source values; replacement drops pending values. Completion may flush before the deadline. Error and cancellation do not flush. No universal minimum output gap is claimed: completion flush is an exception.

<!-- DEBOUNCE-INIT -->
Subscribing connects to the source without scheduling a timer or emitting a value. Constructing the pipeline alone does not connect it.

<!-- DEBOUNCE-START -->
When a value arrives with no timer active, remember that value and its arrival time and schedule a wake-up after dueTime. The value is not emitted yet, including at dueTime zero under this deferred-scheduler profile.

<!-- DEBOUNCE-REPLACE -->
While a timer is active, another value replaces the pending value and moves the silence deadline to its arrival time plus dueTime. RxJS 7.8.2 does not immediately cancel or reschedule the active task on this path.

<!-- DEBOUNCE-REARM -->
When the scheduled task wakes before the latest silence deadline, it schedules another wake-up for the remaining duration. The pending value is retained and nothing is emitted.

<!-- DEBOUNCE-EMIT -->
When the current task wakes at or after the latest deadline, release the task and emit the pending value unchanged. Return to idle without completing the result. A late wake-up emits when it runs, not retroactively at the deadline.

<!-- DEBOUNCE-COMPLETE-IDLE -->
If the source completes while idle, forward completion and release upstream without emitting another value.

<!-- DEBOUNCE-ERROR-IDLE -->
A source error is forwarded unchanged and upstream is released. No completion follows the error.

<!-- DEBOUNCE-CANCEL-IDLE -->
Downstream cancellation releases upstream without sending completion.

<!-- DEBOUNCE-COMPLETE-PENDING -->
If the source completes with a value pending, release its timer and emit that value immediately, then complete and release upstream. Completion can flush before the silence deadline.

<!-- DEBOUNCE-ERROR-PENDING -->
A source error is forwarded unchanged and upstream is released. Any pending value is discarded and its timer is released. No completion follows the error.

<!-- DEBOUNCE-CANCEL-PENDING -->
Downstream cancellation releases upstream without sending completion. It also releases the timer and discards the pending value without emitting it.

**Time:** One externally supplied monotone clock. Scheduling is deferred, even for delay zero. A deadline is not a delivery guarantee; explicit timer.fire events cause work.

**Sharing:** No sharing introduced. Pending values, deadlines and timer identities belong to each result subscription.

**Callbacks:** No user callback. Source and observer delivery and teardown are non-reentrant and nonthrowing.

**Excluded:** Inline zero-delay schedulers such as queueScheduler, clock rollback, fractional/negative/nonfinite durations and unsafe arithmetic. Reentrant source/observer/finalizer activity and cancellation inside downstream delivery. Exact host timer IDs, wall-clock latency bounds, arbitrary SchedulerLike behavior and synchronous setup finalizer ordering. A production timer interpreter or universal equivalence proof.

The runtime is not generated from these paragraphs. [Evidence](../evidence/M02-C.md) is reported separately from this specification.
