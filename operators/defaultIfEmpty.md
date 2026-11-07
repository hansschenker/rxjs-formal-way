# defaultIfEmpty: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Pass every value unchanged; on successful empty completion emit the specified fallback.

**Scope:** One explicitly supplied fallback value; may be undefined or an object.. Atomic notifications, no downstream cancellation reentry during next delivery.

**Dataflow shape:** `defaultIfEmpty(R) : T* -> (T | R)+ on successful completion`. One output per input next; append exactly one fallback iff zero source next events and normal completion. An error or cancellation never produces a fallback.

<!-- DEFAULTIFEMPTY-INIT -->
Subscription starts source execution, not construction of the dataflow.

<!-- DEFAULTIFEMPTY-NEXT -->
The remembered bit distinguishes no value from a literal undefined or null value.

<!-- DEFAULTIFEMPTY-EMPTY -->
The fallback is emitted only after an empty source successfully completes.

<!-- DEFAULTIFEMPTY-NONEMPTY -->
A nonempty source completes with no extra value.

<!-- DEFAULTIFEMPTY-ERROR -->
An error is not treated as an empty successful completion.

<!-- DEFAULTIFEMPTY-CANCEL -->
Cancellation neither emits fallback nor completes.

**Time:** No clock/scheduler: fallback is emitted synchronously during source completion.

**Sharing:** No sharing or replay; independent presence flag per subscriber.

**Callbacks:** None; fallback and source payload are not inspected or cloned.

**Excluded:** Throwing observers or finalizers, reentrant source emissions, coercive fallback policy.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-10.md) is reported separately from this specification.
