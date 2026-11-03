# count: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Remember the number of source values (or matching predicate results) and emit it only on completion.

**Scope:** count in plain profile; safe-integer source indices. Non-reentrant source and callback/observer reactions; only correlated callback outcomes are legal while Calling.

**Dataflow shape:** `count : (T! x Index! -> Boolean!)? -> T* -> Number?`. Cω-inspired successful value-shape notation; terminal and subscription behavior are specified independently. Only a normally completing source causes an output: one value for seeded reduce, count and toArray; at most one for unseeded reduce, min and max. No value is emitted during accumulation. Errors and cancellation discard pending results. An empty source emits zero; a predicate is invoked with the original value and source index.

<!-- AGG-COUNT-PLAIN-INIT -->
Subscription allocates a fresh local aggregate; no seed or count value is emitted yet.

<!-- AGG-COUNT-PLAIN-FIRST -->
Without seed, the first source value becomes memory. It does not invoke a reducer or comparer.

<!-- AGG-COUNT-PLAIN-PLAIN-COUNT -->
Count every source next; retain only the new count and source index. No value is emitted until completion.

<!-- AGG-COUNT-PLAIN-APPEND -->
Keep a new immutable model snapshot of the values seen so far. Native toArray owns a mutable array, but emits only after completion.

<!-- AGG-COUNT-PLAIN-CALL -->
Request exactly one callback, with the remembered value, incoming input and zero-based source index. No callback is run by the pure model.

<!-- AGG-COUNT-PLAIN-RETURN -->
Store the reducer result, add the predicate truthiness to count, or select the extremum based on comparison sign; still emit nothing.

<!-- AGG-COUNT-PLAIN-THROW -->
Callback failure forwards the exact thrown value, cancels upstream and discards the pending aggregate.

<!-- AGG-COUNT-PLAIN-COMPLETE-SOME -->
Only source completion emits the final aggregate once followed by completion, then releases the source.

<!-- AGG-COUNT-PLAIN-COMPLETE-EMPTY -->
Empty unseeded reduce and empty min/max complete without emitting a value.

<!-- AGG-COUNT-PLAIN-ERROR -->
Source errors discard the aggregate and preserve the original error identity; no completion follows.

<!-- AGG-COUNT-PLAIN-CANCEL -->
Unsubscription releases the upstream resource silently, without flushing the aggregate.

**Time:** No clock, timer or scheduler allocated. Input times and equal-time order are supplied by the source/test environment.

**Sharing:** Each result subscription owns its own accumulation and index; no replay or sharing is introduced. Payload references are opaque.

**Callbacks:** No externally supplied callback. The count increment and toArray append are pure internal transitions.

**Excluded:** Reentrant synchronous source delivery or cancellation within reducer/predicate/comparer or destination.next. Throwing finalizers or downstream observers, arbitrary ObservableInput coercion, invalid count/index overflows. Array mutation by consumers before emission, object property getter side effects, custom comparator reentrancy. Finite bounded tests are not universal equivalence proofs or a production interpreter.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-06.md) is reported separately from this specification.
