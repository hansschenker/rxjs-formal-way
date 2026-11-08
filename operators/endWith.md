# endWith: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

After successful source completion, synchronously append a finite word of supplied values.

**Scope:** Finite fixed suffix of 2 values, no deprecated SchedulerLike overload.. Atomic non-reentrant source and callback outcome delivery; no observer/finalizer reentry inside the modeled reaction.

**Dataflow shape:** `endWith(P*) : T* -> (T|P)*`. On success, emitted word is the source word concatenated with the finite suffix word. An error or explicit cancellation does not append the suffix. No suffix value is emitted before source completion. Cω counts next values; terminal notifications, resource release and cancellation are separate obligations.

<!-- ENDWITH-INIT -->
Suffix values do not emit before source ends.

<!-- ENDWITH-PASS -->
All source values flow unchanged.

<!-- ENDWITH-SUFFIX-BEGIN -->
Only successful source completion initiates the suffix.

<!-- ENDWITH-SUFFIX-NEXT -->
Each supplied suffix value is synchronously delivered in argument order.

<!-- ENDWITH-SUFFIX-COMPLETE -->
The internal finite of(...values) finishes; it is not a new external source.

<!-- ENDWITH-ERROR -->
An error never acts as normal source completion.

<!-- ENDWITH-CANCEL-ACTIVE -->
No suffix on cancellation.

<!-- ENDWITH-CANCEL-SUFFIX -->
The source is already released; remaining suffix values are suppressed.

**Time:** Source timing preserved; suffix is delivered synchronously at normal completion, without scheduling.

**Sharing:** None; independent operator state per subscription even if the upstream happens to be shared.

**Callbacks:** None. Values are opaque, including undefined and object identity.

**Excluded:** Deprecated scheduler overload and implicit scheduled suffix semantics. Observer reentry or throwing finalizers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-11.md) is reported separately from this specification.
