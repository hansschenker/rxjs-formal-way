# partition: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Construct two separately subscribed filter results, with inverse predicate admission and independent indexed callback state.  
**Cω shape:** `partition : (T → Bool) × T* → (T*,T*)`  
**Profiles represented:** `partition`

## Three teaching passes

**Pass 1 — Understand:** 1 Overview → 2 Diagram → 5 Trace  
**Pass 2 — Specify:** 3 STT → 4 BDD → 7 Manifest → 8 Canonical Mealy Model  
**Pass 3 — Verify:** 9 RxJS Source → 10 Tests → 6 Obligations → 11 Evidence

## Master chain

`State → Step → Trace → Behavior → Specification → Implementation → Verification`

The artifacts below are different projections of one canonical semantic model; native RxJS tests and the evidence ledger are independent verification evidence.

## Inspection workflow

| # | Inspection step | Artifact | Question it answers |
|---:|---|---|---|
| 1 | Operator Overview | [partition behavior](./partition.md) | What does this operator do? |
| 2 | State Diagram | [partition diagram](../generated/partition.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [partition STT](../generated/partition.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [partition BDD](../generated/partition.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [partition trace](../generated/partition.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [partition obligations](../generated/partition.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [partition manifest](../generated/partition.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session15-partition.ts](../src/models/session15-partition.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [partition.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/partition.ts)<br>[filter.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/filter.ts)<br>[not.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/not.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session15-model.test.mjs](../tests/session15-model.test.mjs)<br>[tests/session15-rxjs.test.mjs](../tests/session15-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-15.md](../evidence/SESSION-15.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Predicate/value input, no deprecated thisArg; both result branches separately subscribed in the model witness.

**Callbacks:** An indexed predicate callback runs once per source next PER BRANCH. Callback outcomes are correlated to branch and index, not computed internally.

**Time:** Each independent upstream subscription supplies its own time; cold sources can execute twice, hot sources can share an external producer.

**Reentrancy:** Atomic indexed predicate request and resolution before the next event for that branch.

**Sharing / ownership:** No implicit sharing. Two branches independently subscribe to the source; one closing does not close the other.

**Explicit exclusions:**

- A single shared-source router is explicitly not partition. Only one subscription per result branch is modeled; multiple subscribers to either result are out of scope.
- Synchronous reentrancy during predicate evaluation, deprecated thisArg and throwing observer/finalizers.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
