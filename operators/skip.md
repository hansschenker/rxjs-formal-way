# skip: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Drop the first count source values, then forward later values unchanged.

**Scope:** Nonnegative safe-integer count and source indices. Non-reentrant reactions, with cancellation between resolved value reactions. Exact source teardown traces use post-setup delivery; synchronous native checks are separate.

**Dataflow shape:** `skip : Count! -> T* -> T*`. For m values and normal completion, exactly max(0,m-count) values are forwarded. Cω-style markers count values only; errors, cancellation and source lifetime remain separate parts of the contract.

<!-- SKIP-INIT -->
Subscription acquires the source and starts an index at zero. A zero count forwards all source values; it does not avoid subscribing.

<!-- SKIP-DROP -->
The first count values are dropped without buffering, while their indices still advance.

<!-- SKIP-PASS -->
Once count values have been skipped, every later source value is forwarded unchanged.

<!-- SKIP-COMPLETE -->
Source completion is forwarded even when fewer than count values arrived; no extra value or error is invented.

<!-- SKIP-ERROR -->
Source errors are forwarded even before count values have arrived. The source is released.

<!-- SKIP-CANCEL -->
Cancellation releases the source without a completion notification.

**Time:** No clock, timer or scheduler is created. Sources supply time; equal timestamps retain explicit delivery order. A predicate call/outcome is one synchronous logical reaction.

**Sharing:** No sharing is introduced. Each subscription owns its count or predicate gate even when the producer is hot.

**Callbacks:** No user callback. The pinned internal filter comparison is modeled directly as count <= index.

**Excluded:** Arbitrary source/observer/predicate reentry, cancellation during a predicate call, and throwing observers/finalizers. Index overflow beyond nonnegative safe integers; invalid public callback arguments and compile-time narrowing proofs. Negative, fractional, NaN and infinite counts are outside this numeric profile.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-05.md) is reported separately from this specification.
