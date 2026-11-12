# partition: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Construct two separately subscribed filter results, with inverse predicate admission and independent indexed callback state.

**Scope:** Predicate/value input, no deprecated thisArg; both result branches separately subscribed in the model witness.. Atomic indexed predicate request and resolution before the next event for that branch.

**Dataflow shape:** `partition : (T → Bool) × T* → (T*,T*)`. Each branch separately subscribes to the source; results are not necessarily a single shared execution. Pass accepts exactly values whose branch-specific predicate outcome is true; fail accepts values with false. Each subscription uses its own zero-based index; completion, error, cancellation and callback throw are branch-local. Predicate output is a routing decision, not a modification of the opaque payload.

<!-- S15-PARTITION-INIT -->
partition is two filter calls, not one multicast router. Each branch has its own source subscription and predicate index.

<!-- S15-PARTITION-PREDICATE-REQUEST -->
The same cold source may execute twice, and predicate indices are independent per branch.

<!-- S15-PARTITION-PREDICATE-RETURN -->
Pass branch accepts true and fail branch accepts false; neither branch clones payloads.

<!-- S15-PARTITION-PREDICATE-THROW-PASS-WAIT -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-PREDICATE-THROW-PASS-LAST -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-PREDICATE-THROW-FAIL-WAIT -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-PREDICATE-THROW-FAIL-LAST -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-SOURCE-COMPLETE-PASS-WAIT -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-SOURCE-COMPLETE-PASS-LAST -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-SOURCE-COMPLETE-FAIL-WAIT -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-SOURCE-COMPLETE-FAIL-LAST -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-SOURCE-ERROR-PASS-WAIT -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-SOURCE-ERROR-PASS-LAST -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-SOURCE-ERROR-FAIL-WAIT -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-SOURCE-ERROR-FAIL-LAST -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-BRANCH-CANCEL-PASS-WAIT -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-BRANCH-CANCEL-PASS-LAST -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-BRANCH-CANCEL-FAIL-WAIT -->
Each result Observable owns one independent source subscription and terminal state.

<!-- S15-PARTITION-BRANCH-CANCEL-FAIL-LAST -->
Each result Observable owns one independent source subscription and terminal state.

**Time:** Each independent upstream subscription supplies its own time; cold sources can execute twice, hot sources can share an external producer.

**Sharing:** No implicit sharing. Two branches independently subscribe to the source; one closing does not close the other.

**Callbacks:** An indexed predicate callback runs once per source next PER BRANCH. Callback outcomes are correlated to branch and index, not computed internally.

**Excluded:** A single shared-source router is explicitly not partition. Only one subscription per result branch is modeled; multiple subscribers to either result are out of scope. Synchronous reentrancy during predicate evaluation, deprecated thisArg and throwing observer/finalizers.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-15.md) is reported separately from this specification.
