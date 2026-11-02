# skipWhile: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Drop source values while the predicate is truthy, then permanently open on its first falsy result.

**Scope:** Named predicate; safe-integer indices until the gate opens. Non-reentrant reactions, with cancellation between resolved value reactions. Exact source teardown traces use post-setup delivery; synchronous native checks are separate.

**Dataflow shape:** `skipWhile : (T! x Index! -> Boolean!) -> T* -> T*`. The first predicate-failing value and all later source values are forwarded. There is no buffer of skipped values. Cω-style markers count values only; errors, cancellation and source lifetime remain separate parts of the contract.

<!-- SKIPWHILE-INIT -->
A result subscription connects to the source and starts its own predicate index at zero. No predicate runs until a source value arrives.

<!-- SKIPWHILE-CALL -->
While testing, each source value requests one predicate call with the original value and its zero-based index. The predicate belongs to the user; the operator controls when it is called.

<!-- SKIPWHILE-TRUE -->
A truthy predicate result drops the value and keeps the gate closed.

<!-- SKIPWHILE-FALSE -->
The first falsy predicate result opens the gate and forwards that same value. Later values no longer invoke the predicate.

<!-- SKIPWHILE-OPEN-PASS -->
Once open, skipWhile forwards all subsequent values unchanged. The predicate is not called again, even for a later value that would have satisfied it.

<!-- SKIPWHILE-THROW -->
A predicate throw errors downstream and releases the source. The failing input is never emitted, including with inclusive takeWhile.

<!-- SKIPWHILE-TESTING-COMPLETE -->
Source completion from Testing completes downstream and releases the source without another predicate call or value.

<!-- SKIPWHILE-TESTING-ERROR -->
A source error from Testing is forwarded without calling the predicate, then releases the source.

<!-- SKIPWHILE-TESTING-CANCEL -->
Cancellation from Testing releases the source and does not complete downstream.

<!-- SKIPWHILE-OPEN-COMPLETE -->
Source completion from Open completes downstream and releases the source without another predicate call or value.

<!-- SKIPWHILE-OPEN-ERROR -->
A source error from Open is forwarded without calling the predicate, then releases the source.

<!-- SKIPWHILE-OPEN-CANCEL -->
Cancellation from Open releases the source and does not complete downstream.

**Time:** No clock, timer or scheduler is created. Sources supply time; equal timestamps retain explicit delivery order. A predicate call/outcome is one synchronous logical reaction.

**Sharing:** No sharing is introduced. Each subscription owns its count or predicate gate even when the producer is hot.

**Callbacks:** One named synchronous predicate invocation per tested input; correlated return/throw is an input. No user function executes in a guard, reaction or generator.

**Excluded:** Arbitrary source/observer/predicate reentry, cancellation during a predicate call, and throwing observers/finalizers. Index overflow beyond nonnegative safe integers; invalid public callback arguments and compile-time narrowing proofs. A production predicate interpreter and guarantees that user functions are pure.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-05.md) is reported separately from this specification.
