# timeout: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Watch the original source for missing timely values, then release it and fail or connect to a replacement.

**Scope:** first=relative-4, each=none, binding=default. Relative durations are integers 1..1000; absolute first time must be a future safe integer at subscription.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `timeout : Cω(First,Each,Scheduler,With,Meta) → T* → (T ∪ R)*`. Source values are forwarded unchanged before timeout. First controls only the first value; positive each restarts after every source value. The source is released before factory/fallback handoff; replacement values are not subject to another watchdog.

<!-- S21-TIMEOUT-START -->
The source is acquired before initial scheduling. This profile requires nonemitting, non-time-advancing source setup.

<!-- S21-TIMEOUT-NEXT-CANCEL-TIMER -->
A first-only deadline is removed by the first next. Relative each deadlines restart after each accepted value; source values do not inherit an absolute first deadline.

<!-- S21-TIMEOUT-NEXT-UNARMED -->
A first-only deadline is removed by the first next. Relative each deadlines restart after each accepted value; source values do not inherit an absolute first deadline.

<!-- S21-TIMEOUT-SOURCE-COMPLETE -->
Successful empty completion is not a timeout. A deadline alone is not a delivered event.

<!-- S21-TIMEOUT-SOURCE-ERROR -->
Source errors preserve their payload and are not replaced by TimeoutError.

<!-- S21-TIMEOUT-CANCEL-SOURCE -->
Cancellation owns teardown, not a terminal notification.

<!-- S21-TIMEOUT-EXPIRE -->
RxJS 7.8.2 finalizes the source before building factory info: lastValue is null even after source values, while seen and meta survive.

<!-- S21-TIMEOUT-FACTORY-THROW -->
The external default binding supplies a fresh pinned TimeoutError; the pure model does not construct its prototype.

**Time:** Supplied nonnegative safe integer now; deferred FIFO scheduler; current generation fires at or after due. Event/envelope times agree. Equal-time input order controls races; source arrival after a deadline can still win if timer delivery is late.

**Sharing:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Callbacks:** One explicit same-time timeout factory outcome. Default binding must supply a genuine pinned TimeoutError; custom binding returns a valid Observable token or throws.

**Excluded:** Synchronous source or fallback notification during subscription acquisition; source setup advancing the clock. Nonpositive/fractional/nonfinite relative durations, expired absolute dates, synchronous queueScheduler, scheduler exceptions and platform timing precision. Promise/Iterable conversions, invalid fallback inputs, factory reentrancy and throwing producer teardown. Default TimeoutError prototype construction is assumed for the supplied factory outcome and checked independently natively. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-21-SCENARIOS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-21.md) is reported separately from this specification.
