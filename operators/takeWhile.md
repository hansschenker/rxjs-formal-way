# takeWhile: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Forward source values while the predicate is truthy, then complete at its first falsy result, optionally including that value.

**Scope:** inclusive=true; named predicate; safe-integer indices. Non-reentrant reactions, with cancellation between resolved value reactions. Exact source teardown traces use post-setup delivery; synchronous native checks are separate.

**Dataflow shape:** `takeWhile : (T! x Index! -> Boolean!) x Inclusive! -> T* -> T*`. The successful prefix is forwarded; inclusive adds at most the first predicate-failing value, never a value whose predicate throws. Cω-style markers count values only; errors, cancellation and source lifetime remain separate parts of the contract.

<!-- TAKEWHILE-INIT -->
A result subscription connects to the source and starts its own predicate index at zero. No predicate runs until a source value arrives.

<!-- TAKEWHILE-CALL -->
While testing, each source value requests one predicate call with the original value and its zero-based index. The predicate belongs to the user; the operator controls when it is called.

<!-- TAKEWHILE-TRUE -->
A truthy predicate result forwards the original value and continues testing.

<!-- TAKEWHILE-FALSE -->
The first falsy predicate result forwards that value, completes downstream and releases the source, in that order.

<!-- TAKEWHILE-THROW -->
A predicate throw errors downstream and releases the source. The failing input is never emitted, including with inclusive takeWhile.

<!-- TAKEWHILE-TESTING-COMPLETE -->
Source completion from Testing completes downstream and releases the source without another predicate call or value.

<!-- TAKEWHILE-TESTING-ERROR -->
A source error from Testing is forwarded without calling the predicate, then releases the source.

<!-- TAKEWHILE-TESTING-CANCEL -->
Cancellation from Testing releases the source and does not complete downstream.

**Time:** No clock, timer or scheduler is created. Sources supply time; equal timestamps retain explicit delivery order. A predicate call/outcome is one synchronous logical reaction.

**Sharing:** No sharing is introduced. Each subscription owns its count or predicate gate even when the producer is hot.

**Callbacks:** One named synchronous predicate invocation per tested input; correlated return/throw is an input. No user function executes in a guard, reaction or generator.

**Excluded:** Arbitrary source/observer/predicate reentry, cancellation during a predicate call, and throwing observers/finalizers. Index overflow beyond nonnegative safe integers; invalid public callback arguments and compile-time narrowing proofs. A production predicate interpreter and guarantees that user functions are pure.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-05.md) is reported separately from this specification.
