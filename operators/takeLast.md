# takeLast: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Retain a bounded suffix and emit it only after successful source completion.

**Scope:** Safe integer count in -8..8; positive counts bound retained FIFO memory.. Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Dataflow shape:** `takeLast : Cω(Count) → T* → T≤max(0,Count)`. For positive count, every output occurs at successful source completion. Error and cancellation discard the retained suffix; nonpositive count never subscribes.

<!-- S20-TAKELAST-START -->
The buffer belongs to this connection and is created lazily.

<!-- S20-TAKELAST-APPEND -->
Only subsequent values establish which values are last; no item is emitted before successful completion.

<!-- S20-TAKELAST-REPLACE-OLDEST -->
Only subsequent values establish which values are last; no item is emitted before successful completion.

<!-- S20-TAKELAST-COMPLETE-FLUSH -->
A short source emits all retained values; an empty source only completes. No new clock is introduced.

<!-- S20-TAKELAST-ERROR -->
Failure does not certify a successful final suffix.

<!-- S20-TAKELAST-CANCEL -->
Cancellation is not source completion and cannot flush a suffix.

**Time:** No clock is introduced. Source events supply time; input order breaks equal-time ties. Callers must supply synchronous callback outcomes at the invocation time; generic runTrace does not enforce that envelope-time precondition.

**Sharing:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Callbacks:** No user callback.

**Excluded:** Counts outside -8..8, fractional counts, Infinity and NaN. Consumer cancellation or reentry during the synchronous completion-flush word. Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

[Concrete scenarios](../docs/SESSION-20-SCENARIOS.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-20.md) is reported separately from this specification.
