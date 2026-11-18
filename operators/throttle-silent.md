# throttle: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Select leading and/or latest trailing source values using one active duration Observable.

**Scope:** leading=false, trailing=false. Valid Observable-returning duration selector; every returned token identifies its producer description.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `throttle : Cω(DurationSignal,Leading,Trailing) → T* → T*`. Source values only are forwarded; duration payloads are ignored. Busy values do not extend a duration. A trailing output starts another duration while the source is live. Source completion waits only when trailing output is enabled, a value is pending and a duration is active. With both flags false, no next notification is emitted.

<!-- S20-THROTTLE-START -->
The first value, not subscription itself, starts throttling.

<!-- S20-THROTTLE-OPEN-NEXT -->
A leading emission precedes duration selection/acquisition. With leading=false the same source value still starts a duration.

<!-- S20-THROTTLE-SELECTOR-RETURN -->
The returned Observable describes the duration. Each accepted invocation creates a separate duration subscription, even when the token is reused.

<!-- S20-THROTTLE-SELECTOR-THROW -->
A leading value may already have been observed before the selector fails.

<!-- S20-THROTTLE-REMEMBER -->
Busy source values update latest memory. They do not call the selector or postpone the current timer.

<!-- S20-THROTTLE-END-OPEN -->
No trailing emission means no automatic new duration. A later source value starts the next duration.

<!-- S20-THROTTLE-DURATION-EMPTY -->
Duration complete uses cleanupThrottling, not endThrottling: next and complete are distinct control signals.

<!-- S20-THROTTLE-COMPLETE-OPEN -->
There is no active duration to justify waiting, even if an empty duration previously left internal pending memory.

<!-- S20-THROTTLE-COMPLETE-NOW -->
A lone leading value does not require waiting for its duration to expire.

<!-- S20-THROTTLE-SOURCE-ERROR-OPEN -->
Failure is never delayed until a duration ends.

<!-- S20-THROTTLE-SOURCE-ERROR-THROTTLED -->
Failure is never delayed until a duration ends.

<!-- S20-THROTTLE-CANCEL-OPEN -->
Cancellation during completion-waiting releases only the duration; the source has already ended.

<!-- S20-THROTTLE-CANCEL-THROTTLED -->
Cancellation during completion-waiting releases only the duration; the source has already ended.

<!-- S20-THROTTLE-DURATION-ERROR-THROTTLED -->
Duration errors use the error channel, including after the source has already completed.

**Time:** All event times are supplied nonnegative safe integers. Equal-time order is input order. Source and duration Observables supply time; selector outcomes remain at invocation time. No internal clock is created.

**Sharing:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Callbacks:** Selector invocation and correlated return/throw are explicit. Its payload is the value that starts a duration, including a trailing output.

**Excluded:** Promise/Iterable conversion and invalid duration inputs. Synchronous duration delivery during subscription acquisition; separately characterized natively. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-20-SCENARIOS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-20.md) is reported separately from this specification.
