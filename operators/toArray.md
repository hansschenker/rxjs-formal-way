# toArray: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Collect source values into a fresh per-subscription array and emit that array only on completion.

**Scope:** toArray in plain profile; safe-integer source indices. Non-reentrant source and callback/observer reactions; only correlated callback outcomes are legal while Calling.

**Dataflow shape:** `toArray : T* -> (T[])?`. Cω-inspired successful value-shape notation; terminal and subscription behavior are specified independently. Only a normally completing source causes an output: one value for seeded reduce, count and toArray; at most one for unseeded reduce, min and max. No value is emitted during accumulation. Errors and cancellation discard pending results. An empty source emits an empty array allocated separately for each result subscription.

<!-- AGG-TOARRAY-PLAIN-INIT -->
Subscription allocates a fresh local aggregate; no seed or count value is emitted yet.

<!-- AGG-TOARRAY-PLAIN-FIRST -->
Without seed, the first source value becomes memory. It does not invoke a reducer or comparer.

<!-- AGG-TOARRAY-PLAIN-PLAIN-COUNT -->
Count every source next; retain only the new count and source index. No value is emitted until completion.

<!-- AGG-TOARRAY-PLAIN-APPEND -->
Keep a new immutable model snapshot of the values seen so far. Native toArray owns a mutable array, but emits only after completion.

<!-- AGG-TOARRAY-PLAIN-CALL -->
Request exactly one callback, with the remembered value, incoming input and zero-based source index. No callback is run by the pure model.

<!-- AGG-TOARRAY-PLAIN-RETURN -->
Store the reducer result, add the predicate truthiness to count, or select the extremum based on comparison sign; still emit nothing.

<!-- AGG-TOARRAY-PLAIN-THROW -->
Callback failure forwards the exact thrown value, cancels upstream and discards the pending aggregate.

<!-- AGG-TOARRAY-PLAIN-COMPLETE-SOME -->
Only source completion emits the final aggregate once followed by completion, then releases the source.

<!-- AGG-TOARRAY-PLAIN-COMPLETE-EMPTY -->
Empty unseeded reduce and empty min/max complete without emitting a value.

<!-- AGG-TOARRAY-PLAIN-ERROR -->
Source errors discard the aggregate and preserve the original error identity; no completion follows.

<!-- AGG-TOARRAY-PLAIN-CANCEL -->
Unsubscription releases the upstream resource silently, without flushing the aggregate.

**Time:** No clock, timer or scheduler allocated. Input times and equal-time order are supplied by the source/test environment.

**Sharing:** Each result subscription owns its own accumulation and index; no replay or sharing is introduced. Payload references are opaque.

**Callbacks:** No externally supplied callback. The count increment and toArray append are pure internal transitions.

**Excluded:** Reentrant synchronous source delivery or cancellation within reducer/predicate/comparer or destination.next. Throwing finalizers or downstream observers, arbitrary ObservableInput coercion, invalid count/index overflows. Array mutation by consumers before emission, object property getter side effects, custom comparator reentrancy. Finite bounded tests are not universal equivalence proofs or a production interpreter.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-06.md) is reported separately from this specification.
