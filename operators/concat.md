# concat: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Forward the source and then each supplied Observable in strict subscription order.

**Scope:** One piped source and 2 supplied Observable inputs; 0–32 others. Deprecated operator export. No projector or scheduler overload.. All input subscriptions established atomically before external notifications. Synchronous producer emissions during setup are excluded.

**Dataflow shape:** `concat : T0* × ... × Tn* → (T0 | ... | Tn)*`. Exactly one input subscription is live at a time; source index 0 always starts first. The next supplied source is subscribed only after the previous source completes. Each incoming value is emitted unchanged; completion requires all inputs to complete.

<!-- CONCAT-INIT -->
Construction is lazy. Source index zero is the piped source.

<!-- CONCAT-NEXT -->
Concatenation preserves the identity and order of every value.

<!-- CONCAT-COMPLETE-ADVANCE -->
Only completion permits advancing the serial source.

<!-- CONCAT-COMPLETE-LAST -->
There is no next subscription after the last input.

<!-- CONCAT-ERROR -->
Failure aborts the join, without subscribing to more sources.

<!-- CONCAT-CANCEL -->
Cancellation is silent and does not create late subscriptions.

**Time:** Inputs supply all notification ordering; no clock, scheduler or delay is created by this profile.

**Sharing:** No multicasting, sharing or replay. Each result subscription owns independent latest slots or serial position.

**Callbacks:** No user callbacks; no result selector projection. Observable values preserve reference identity.

**Excluded:** Promise/iterable ObservableInput conversion, synchronous or reentrant notifications during subscription acquisition. Deprecated result selector for combineLatest and deprecated scheduler overload for concat. Callbacks throwing during observer delivery, synchronous finalizer reentrancy, cancellation during next handling. Finite scenarios are evidence, not universal equivalence. Input count beyond 32 is not modeled.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-09.md) is reported separately from this specification.
