# throttleTime: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Select leading and/or latest trailing source values using one active scheduled duration.

**Scope:** leading=false, trailing=true. Positive integer duration 1..1000 with a deferred FIFO virtual scheduler.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `throttleTime : Cω(Duration,Scheduler,Leading,Trailing) → T* → T*`. Source values only are forwarded; duration payloads are ignored. Busy values do not extend a duration. A trailing output starts another duration while the source is live. Source completion waits only when trailing output is enabled, a value is pending and a duration is active. With both flags false, no next notification is emitted.

<!-- S20-THROTTLETIME-START -->
The first value, not subscription itself, starts throttling.

<!-- S20-THROTTLETIME-OPEN-NEXT -->
A leading emission precedes duration selection/acquisition. With leading=false the same source value still starts a duration.

<!-- S20-THROTTLETIME-REMEMBER -->
Busy source values update latest memory. They do not call the selector or postpone the current timer.

<!-- S20-THROTTLETIME-END-EMIT-RESTART -->
A trailing output starts another throttle duration. It is not merely an audit-style return to idle.

<!-- S20-THROTTLETIME-END-OPEN -->
No trailing emission means no automatic new duration. A later source value starts the next duration.

<!-- S20-THROTTLETIME-COMPLETE-OPEN -->
There is no active duration to justify waiting, even if an empty duration previously left internal pending memory.

<!-- S20-THROTTLETIME-COMPLETE-WAIT -->
Source completion is not an immediate flush. The pending trailing value still waits for the duration signal.

<!-- S20-THROTTLETIME-WAIT-END -->
The trailing value precedes final completion, but source termination prevents restarting a duration.

<!-- S20-THROTTLETIME-COMPLETE-NOW -->
A lone leading value does not require waiting for its duration to expire.

<!-- S20-THROTTLETIME-SOURCE-ERROR-OPEN -->
Failure is never delayed until a duration ends.

<!-- S20-THROTTLETIME-SOURCE-ERROR-THROTTLED -->
Failure is never delayed until a duration ends.

<!-- S20-THROTTLETIME-CANCEL-OPEN -->
Cancellation during completion-waiting releases only the duration; the source has already ended.

<!-- S20-THROTTLETIME-CANCEL-THROTTLED -->
Cancellation during completion-waiting releases only the duration; the source has already ended.

<!-- S20-THROTTLETIME-CANCEL-WAITING -->
Cancellation during completion-waiting releases only the duration; the source has already ended.

**Time:** All event times are supplied nonnegative safe integers. Equal-time order is input order. timer.fire must name the current generation and occur at or after its deadline; lateness does not backdate output. No progress occurs merely because a deadline exists.

**Sharing:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Callbacks:** No user callback. A scheduled duration is a source of timer.fire inputs.

**Excluded:** Zero/negative/fractional durations, synchronous queueScheduler, custom scheduler exceptions and platform timing precision. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-20-SCENARIOS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-20.md) is reported separately from this specification.
