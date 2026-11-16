# single: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Assert exactly one matching source value, retaining candidate until successful completion; distinguish empty, no match, and duplicates.  
**Cω shape:** `single(P?) : Cω(Predicate?) × T* → T?`  
**Profiles represented:** `single`

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
| 1 | Operator Overview | [single behavior](./single.md) | What does this operator do? |
| 2 | State Diagram | [single diagram](../generated/single.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [single STT](../generated/single.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [single BDD](../generated/single.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [single trace](../generated/single.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [single obligations](../generated/single.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [single manifest](../generated/single.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session19.ts](../src/models/session19.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [single.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/single.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session19-model.test.mjs](../tests/session19-model.test.mjs)<br>[tests/session19-rxjs.test.mjs](../tests/session19-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-19.md](../evidence/SESSION-19.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Indexed boolean predicate; omitted BooleanConstructor and thisArg specialization.

**Callbacks:** Exactly one correlated request/outcome for every inspected source value (value,index,source).

**Time:** Only source delivery order controls candidate storage; no new clock or scheduler.

**Reentrancy:** A callback return/throw must resolve before another source notification.

**Sharing / ownership:** None introduced; each downstream subscription independently evaluates uniqueness.

**Explicit exclusions:**

- BooleanConstructor type-guard specialization, reentrant predicate/observer delivery and source initialization-time callbacks.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
