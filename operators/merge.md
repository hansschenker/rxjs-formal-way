# merge: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Merge one piped source and configured other Observables; bounded concurrency starts later sources FIFO.

**Scope:** Pipeable deprecated merge export with 2 other valid Observable inputs; concurrency 2; no scheduler.. Atomic nonreentrant subscriptions; synchronous input delivery during acquisition is excluded.

**Dataflow shape:** `merge : T0* × ... × Tn* → (T0 | ... | Tn)*`. Every connected input next forwards exactly once in actual arrival order. Output completion requires every input completion; any input error terminates immediately. A bounded concurrency limit delays subscriptions to later supplied sources, not their values.

<!-- S14-MERGE-INIT -->
All inputs are fixed at operator construction; the source at input 0 is subscribed first.

<!-- S14-MERGE-NEXT -->
Any admitted input contributes values in actual event order without changing subscription ownership.

<!-- S14-MERGE-REFILL -->
At a bounded concurrency limit, completion frees a slot for the next supplied source.

<!-- S14-MERGE-COMPLETE-WAIT -->
Completion waits for every connected input and queued source to finish.

<!-- S14-MERGE-COMPLETE-LAST -->
Only the final input completion ends the result normally.

<!-- S14-MERGE-ERROR -->
A single source failure immediately tears down all live sources and discards pending subscriptions.

<!-- S14-MERGE-CANCEL -->
Downstream cancellation is silent; queued inputs are never subscribed.

**Time:** No internal clock; all inputs supply their notification times. Source-first subscriptions are ordered.

**Sharing:** Merge does not create sharing; each result subscription independently acquires input subscriptions.

**Callbacks:** No callbacks. Input payloads are opaque and preserve identity.

**Excluded:** Deprecated scheduler overload and Promise/Iterable conversions, synchronous sources during subscription setup. Reentrant observers and source callbacks, teardown throws and unbounded scenario counts over 32 others.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-14.md) is reported separately from this specification.
