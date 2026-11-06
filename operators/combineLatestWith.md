# combineLatestWith: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Combine source-first latest snapshots after every input has emitted a first value.

**Scope:** One piped source and 1 supplied Observable inputs; 0–32 others. No projector or scheduler overload.. All input subscriptions established atomically before external notifications. Synchronous producer emissions during setup are excluded.

**Dataflow shape:** `combineLatestWith : T0* × ... × Tn* → (T0 × ... × Tn)*`. Source index 0 comes first. All input subscriptions begin at connection, without a timer. Every source must emit at least one value before the first full latest snapshot. Each subsequent next from a live source emits a newly allocated source-ordered array. An input may complete before its first value; the output is then silent until the remaining inputs also complete.

<!-- COMBINELATESTWITH-INIT -->
Construction is lazy. Source index zero is the piped source.

<!-- COMBINELATESTWITH-WAIT -->
The first-value barrier applies to every source.

<!-- COMBINELATESTWITH-EMIT -->
One emission produces one fresh latest tuple.

<!-- COMBINELATESTWITH-COMPLETE-WAIT -->
No early completion even if this source never emitted.

<!-- COMBINELATESTWITH-COMPLETE-LAST -->
Completion waits for all inputs, independent of readiness.

<!-- COMBINELATESTWITH-ERROR -->
Failure aborts the join, without subscribing to more sources.

<!-- COMBINELATESTWITH-CANCEL -->
Cancellation is silent and does not create late subscriptions.

**Time:** Inputs supply all notification ordering; no clock, scheduler or delay is created by this profile.

**Sharing:** No multicasting, sharing or replay. Each result subscription owns independent latest slots or serial position.

**Callbacks:** No user callbacks; no result selector projection. Observable values preserve reference identity.

**Excluded:** Promise/iterable ObservableInput conversion, synchronous or reentrant notifications during subscription acquisition. Deprecated result selector for combineLatest and deprecated scheduler overload for concat. Callbacks throwing during observer delivery, synchronous finalizer reentrancy, cancellation during next handling. Finite scenarios are evidence, not universal equivalence. Input count beyond 32 is not modeled.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-09.md) is reported separately from this specification.
