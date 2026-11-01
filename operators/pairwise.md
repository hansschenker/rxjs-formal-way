# pairwise: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Emit overlapping adjacent pairs of ORIGINAL source values, starting at the second next notification.

**Scope:** No user parameters.. Atomic non-reentrant delivery. Model updates previous before emitting.

**Dataflow shape:** `pairwise : T* -> (T x T)*`. For n successfully delivered source values, exactly max(n-1,0) pairs are emitted before an error or cancellation. Pair arrays are freshly allocated; their two item references retain identity.

<!-- PAIRWISE-INIT -->
Pairwise subscribes lazily and starts with no previous value. It does not emit an initial pair.

<!-- PAIRWISE-FIRST -->
The first source value is remembered, not emitted; it becomes the left member of the first pair.

<!-- PAIRWISE-NEXT -->
Every subsequent value emits a fresh two-element array [previous, current], preserving the original value references; current becomes the next previous value before output.

<!-- PAIRWISE-COMPLETE -->
An empty or singleton source produces no pair. Source completion forwards completion without inventing a final pair.

<!-- PAIRWISE-ERROR -->
An error forwards immediately; the stored previous value is not emitted or flushed.

<!-- PAIRWISE-CANCEL -->
Cancellation drops the retained previous value and releases the source without sending completion.

**Time:** No timer or scheduling; the pair appears in the same logical source-delivery time point as its right member.

**Sharing:** Does not create sharing. Each subscriber owns an independent previous-value slot.

**Callbacks:** No user function or projection is invoked.

**Excluded:** Nested observer delivery, throwing subscriber/finalizer, physical source abort guarantees.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-04.md) is reported separately from this specification.
