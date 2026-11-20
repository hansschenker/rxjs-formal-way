# windowTime: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Route source values through live multicast windows closed by supplied scheduler events or per-window counts.

**Scope:** Positive safe-integer span, interval and finite maxSize in 1..1000. Null interval selects restart-on-close; null maxSize is unbounded. Finite safe-integer supplied scheduler time and counters without overflow.. Atomic non-reentrant reactions. Consumers attach between reactions; callbacks that subscribe, cancel or emit during a current reaction are characterized separately if tested.

**Dataflow shape:** `windowTime : (Span, Interval? , Count?) → T* → (T*)*`. One initial handle; sequential mode starts a new window whenever the previous window closes. Periodic mode opens independently on creation ticks; windows overlap, abut or leave gaps according to span and interval. Source next goes to each current window and can close it at maxSize; the closing value never enters its sequential successor. Source terminals reach windows before the outer observer; outer cancellation leaves open child Subjects silent and uncompleted.

<!-- S22-WINDOWTIME-START -->
Construction is inert. Periodic creation is scheduled before the initial window; window handle and close timer precede source acquisition.

<!-- S22-WINDOWTIME-NEXT -->
RxJS snapshots its active record list, then delivers and closes one record at a time. Overlapping windows can therefore see another window complete before receiving the same value.

<!-- S22-WINDOWTIME-WINDOW-TIMER -->
A deadline is data, not an automatic transition. Old generations and early timer delivery are rejected.

<!-- S22-WINDOWTIME-CREATION-TIMER -->
The recurring creation task is one logical resource. Its explicit tick distinguishes firings; window timer generations are window identities.

<!-- S22-WINDOWTIME-SOURCE-COMPLETE -->
Inner terminals precede the outer terminal. Cleanup follows registration: creation timer, initial-window timer if still live, source, then later-window timers.

<!-- S22-WINDOWTIME-SOURCE-ERROR -->
Inner terminals precede the outer terminal. Cleanup follows registration: creation timer, initial-window timer if still live, source, then later-window timers.

<!-- S22-WINDOWTIME-CANCEL -->
windowTime clears its record registry on disposal but does not complete or unsubscribe the Subjects. Child connections hold no upstream lease.

<!-- S22-WINDOWTIME-OBSERVE-OPEN-ACTIVE -->
Attaching a child never creates or retains a source/timer connection.

<!-- S22-WINDOWTIME-OBSERVE-COMPLETE-ACTIVE -->
A completed Subject remembers its terminal notification without replaying source values.

<!-- S22-WINDOWTIME-DETACH-ACTIVE -->
Orphaned child subscriptions can be disposed independently after the outer execution stops.

<!-- S22-WINDOWTIME-OBSERVE-OPEN-STOPPED -->
Attaching a child never creates or retains a source/timer connection.

<!-- S22-WINDOWTIME-OBSERVE-COMPLETE-STOPPED -->
A completed Subject remembers its terminal notification without replaying source values.

<!-- S22-WINDOWTIME-DETACH-STOPPED -->
Orphaned child subscriptions can be disposed independently after the outer execution stops.

<!-- S22-WINDOWTIME-OBSERVE-ERROR-STOPPED -->
Error retention differs from both historical completion and silent orphaning on cancellation.

**Time:** Deferred FIFO scheduler profile. Inputs carry supplied now; runWindowTimeTrace enforces now equals trace-envelope time. Explicit timer identities/ticks and input order decide same-time reactions. Delayed timer delivery is admissible at or after its due time.

**Sharing:** Each outer execution owns independent source/timer resources. Each inner window is live multicast without replay; consumers hold no upstream lease.

**Callbacks:** No user function is invoked. Opaque source values retain identity. Emitted tokens denote Observable handles, not collected arrays.

**Excluded:** Zero/negative/fractional/non-finite durations, invalid overload normalization and synchronous scheduler execution. Setup-time source delivery, arbitrary reentrancy, subject implementation mutation and clock/counter overflow. Scheduler-specific physical Action allocation; recurring creation is normalized to one logical timer with explicit firing ticks. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-22-TIMED-WINDOWS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-22.md) is reported separately from this specification.
