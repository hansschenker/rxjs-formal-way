# elementAt: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Select exactly the zero-based index, terminating as soon as it appears, or handle a missing index at source completion.

**Scope:** Nonnegative safe-integer index 2; explicit default is present. Negative/fractional indices excluded.. Atomic non-reentrant source and callback outcome delivery; no observer/finalizer reentry inside the modeled reaction.

**Dataflow shape:** `elementAt(i,D?) : T* -> (T|D)?`. At most one next value, followed by completion on hit; normal empty source with default emits exactly one default. Missing index without default errors with ArgumentOutOfRangeError, with no emitted value. Cω counts next values; terminal notifications, resource release and cancellation are separate obligations.

<!-- ELEMENTAT-INIT -->
A fresh source index starts at zero.

<!-- ELEMENTAT-SKIP -->
Discard values at other positions, retaining no payload.

<!-- ELEMENTAT-HIT -->
The indexed value emits and terminates immediately without waiting for source completion.

<!-- ELEMENTAT-MISSING-DEFAULT -->
A literal undefined default is still supplied when argument two exists.

<!-- ELEMENTAT-MISSING-ERROR -->
An unfulfilled position is not an empty successful result.

<!-- ELEMENTAT-SOURCE-ERROR -->
An upstream error retains its identity and suppresses default.

<!-- ELEMENTAT-CANCEL -->
No value, default or synthesized completion on cancellation.

**Time:** No timer. The selected item is forwarded at its source arrival; source completion decides only missing-index outcomes.

**Sharing:** None; independent operator state per subscription even if the upstream happens to be shared.

**Callbacks:** No user projection; skip indexed inputs by position without inspecting values.

**Excluded:** Invalid, NaN, fractional and overflowing index values; construction-time negative-index error is not an execution transition. The missing-error model uses a structurally named ArgumentOutOfRangeError; native RxJS error constructor is separately checked. Observer reentry, throwing finalizers and callback-time cancellation.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-11.md) is reported separately from this specification.
