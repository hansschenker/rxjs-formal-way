# mergeWith: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Unbounded pipeable merge of the source and fixed other Observable inputs.

**Scope:** Exactly 2 other valid Observable inputs; unbounded concurrency, no scheduler argument.. Subscription setup is atomic. Inputs deliver only after all subscriptions and their teardowns have been registered. No observer or teardown reentry.

**Dataflow shape:** `mergeWith : T* × U1* × ... × Un* → (T | U1 | ... | Un)*`. Each live input next is forwarded once, as soon as delivered. The source is subscribed first, then every configured other Observable; there is no concurrency argument. Completion waits for all sources; first error terminates and cancels the rest.

<!-- S15-MERGEWITH-INIT -->
All configured inputs are subscribed in argument order. There is no concurrency limit or waiting-source admission policy in mergeWith.

<!-- S15-MERGEWITH-NEXT -->
A value from any live input flows downstream unchanged in delivery order; it does not change subscription ownership.

<!-- S15-MERGEWITH-COMPLETE-WAIT -->
One input completion removes only that input. The result waits while any other input remains live.

<!-- S15-MERGEWITH-COMPLETE-LAST -->
For completion delivered after subscription setup, the final input teardown precedes normal result completion. Subscription-time emissions and late teardown registration are outside this profile.

<!-- S15-MERGEWITH-ERROR -->
An input failure errors the result and tears down every live input, including the failing one. No value is manufactured.

<!-- S15-MERGEWITH-CANCEL -->
Consumer cancellation is silent downstream and releases all live input subscriptions. No completion notification is synthesized.

**Time:** No internal clock; all inputs supply their notification times. Source-first subscriptions are ordered.

**Sharing:** No sharing: every result subscription independently subscribes to all input Observables.

**Callbacks:** No callbacks. Input payloads are opaque and preserve identity.

**Excluded:** No Promise/Iterable source conversion or synchronous input emissions during subscription acquisition. No concurrency/scheduler argument; equal-time delivery order belongs to the supplied sources and scheduler. No cancellation inside observer delivery, throwing/reentrant observers or finalizers, or input inventories above 32 others.

[Concrete scenarios](../generated/mergeWith.scenarios.md) distinguish model predictions from separately executed runtime evidence.

The runtime is not generated from these paragraphs. [Evidence](../evidence/REFINEMENT-MERGEWITH.md) is reported separately from this specification.
