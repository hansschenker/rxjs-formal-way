# timeoutWith: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Watch the original source for missing timely values, then release it and fail or connect to a replacement.

**Scope:** first=none, each=4, binding=constant. Relative durations are integers 1..1000; absolute first time must be a future safe integer at subscription.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `timeoutWith : Cω(Due,Replacement,Scheduler) → T* → (T ∪ R)*`. Source values are forwarded unchanged before timeout. First controls only the first value; positive each restarts after every source value. The source is released before factory/fallback handoff; replacement values are not subject to another watchdog.

<!-- S21-TIMEOUTWITH-START -->
The source is acquired before initial scheduling. This profile requires nonemitting, non-time-advancing source setup.

<!-- S21-TIMEOUTWITH-NEXT-CANCEL-TIMER -->
A first-only deadline is removed by the first next. Relative each deadlines restart after each accepted value; source values do not inherit an absolute first deadline.

<!-- S21-TIMEOUTWITH-SOURCE-COMPLETE -->
Successful empty completion is not a timeout. A deadline alone is not a delivered event.

<!-- S21-TIMEOUTWITH-SOURCE-ERROR -->
Source errors preserve their payload and are not replaced by TimeoutError.

<!-- S21-TIMEOUTWITH-CANCEL-SOURCE -->
Cancellation owns teardown, not a terminal notification.

<!-- S21-TIMEOUTWITH-EXPIRE -->
RxJS 7.8.2 finalizes the source before building factory info: lastValue is null even after source values, while seen and meta survive.

<!-- S21-TIMEOUTWITH-FALLBACK-NEXT -->
Replacement values can differ in type from original source values and are not inspected.

<!-- S21-TIMEOUTWITH-FALLBACK-COMPLETE -->
The replacement determines the final result lifetime after timeout.

<!-- S21-TIMEOUTWITH-FALLBACK-ERROR -->
The replacement determines the final result lifetime after timeout.

<!-- S21-TIMEOUTWITH-CANCEL-FALLBACK -->
The currently owned connection alone is cancelled.

**Time:** Supplied nonnegative safe integer now; deferred FIFO scheduler; current generation fires at or after due. Event/envelope times agree. Equal-time input order controls races; source arrival after a deadline can still win if timer delivery is late.

**Sharing:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Callbacks:** No user callback: the deprecated alias captures one constant Observable description.

**Excluded:** Synchronous source or fallback notification during subscription acquisition; source setup advancing the clock. Nonpositive/fractional/nonfinite relative durations, expired absolute dates, synchronous queueScheduler, scheduler exceptions and platform timing precision. Promise/Iterable conversions, invalid fallback inputs, factory reentrancy and throwing producer teardown. Default TimeoutError prototype construction is assumed for the supplied factory outcome and checked independently natively. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-21-SCENARIOS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-21.md) is reported separately from this specification.
