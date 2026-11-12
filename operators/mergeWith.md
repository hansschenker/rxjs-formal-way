# mergeWith: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Unbounded pipeable merge of the source and fixed other Observable inputs.

**Scope:** Exactly 2 other valid Observable inputs; unbounded concurrency, no scheduler argument.. Atomic nonreentrant subscriptions; synchronous input delivery during acquisition is excluded.

**Dataflow shape:** `mergeWith : T* × U1* × ... × Un* → (T | U1 | ... | Un)*`. Each live input next is forwarded once, as soon as delivered. The source is subscribed first, then every configured other Observable; there is no concurrency argument. Completion waits for all sources; first error terminates and cancels the rest.

<!-- S15-MERGEWITH-INIT -->
All inputs are fixed at operator construction; the source at input 0 is subscribed first.

<!-- S15-MERGEWITH-NEXT -->
Any admitted input contributes values in actual event order without changing subscription ownership.

<!-- S15-MERGEWITH-REFILL -->
At a bounded concurrency limit, completion frees a slot for the next supplied source.

<!-- S15-MERGEWITH-COMPLETE-WAIT -->
Completion waits for every connected input and queued source to finish.

<!-- S15-MERGEWITH-COMPLETE-LAST -->
Only the final input completion ends the result normally.

<!-- S15-MERGEWITH-ERROR -->
A single source failure immediately tears down all live sources and discards pending subscriptions.

<!-- S15-MERGEWITH-CANCEL -->
Downstream cancellation is silent; queued inputs are never subscribed.

**Time:** No internal clock; all inputs supply their notification times. Source-first subscriptions are ordered.

**Sharing:** No sharing: every result subscription independently subscribes to all input Observables.

**Callbacks:** No callbacks. Input payloads are opaque and preserve identity.

**Excluded:** No Promise/Iterable source conversion or reentrant synchronous emissions during acquisition. No deprecated concurrency/scheduler overload (these belong to merge, not mergeWith).

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-15.md) is reported separately from this specification.
