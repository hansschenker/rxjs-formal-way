# materialize: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Turn next, error and completion protocol signals into typed next values, then complete on original terminal signals.

**Scope:** No arguments.. Non-reentrant source delivery after subscription setup.

**Dataflow shape:** `materialize : T* -> Notification<T>*`. Every source next maps to one N value at the same notification moment. Successful completion adds a C value followed by result completion. Source failure adds an E value retaining error identity, then result completion. Nonterminating or cancelled sources have no synthetic terminal Notification value.

<!-- S14-MATERIALIZE-INIT -->
The declared dataflow is lazy.

<!-- S14-MATERIALIZE-NEXT -->
Wrap each source value without looking inside it.

<!-- S14-MATERIALIZE-END -->
The source completion is encoded as a value, then the result completes.

<!-- S14-MATERIALIZE-FAIL -->
The original error is retained by identity as the E payload; the RESULT completes, not errors.

<!-- S14-MATERIALIZE-CANCEL -->
Cancellation is silent and does not fabricate a terminal Notification value.

**Time:** Source timing and ordering are preserved; no timer or scheduler is introduced.

**Sharing:** No sharing. Every output subscription has its own source connection.

**Callbacks:** No user callbacks or value inspection.

**Excluded:** No equivalence claim for Notification class prototype, cached C instance, or property descriptors; semantic kind/value/error/hasValue are modeled. Synchronous reentrancy, observer throws and teardown throws are not modeled.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-14.md) is reported separately from this specification.
