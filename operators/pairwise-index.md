# pairwise: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Emit overlapping adjacent pairs of ORIGINAL source values, starting at the second next notification.  
**Cω shape:** `pairwise : T* -> (T x T)*`  
**Profiles represented:** `pairwise`

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
| 1 | Operator Overview | [pairwise behavior](./pairwise.md) | What does this operator do? |
| 2 | State Diagram | [pairwise diagram](../generated/pairwise.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [pairwise STT](../generated/pairwise.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [pairwise BDD](../generated/pairwise.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [pairwise trace](../generated/pairwise.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [pairwise obligations](../generated/pairwise.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [pairwise manifest](../generated/pairwise.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/pairwise.ts](../src/models/pairwise.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [pairwise.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/pairwise.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session4-model.test.mjs](../tests/session4-model.test.mjs)<br>[tests/session4-rxjs.test.mjs](../tests/session4-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-04.md](../evidence/SESSION-04.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** No user parameters.

**Callbacks:** No user function or projection is invoked.

**Time:** No timer or scheduling; the pair appears in the same logical source-delivery time point as its right member.

**Reentrancy:** Atomic non-reentrant delivery. Model updates previous before emitting.

**Sharing / ownership:** Does not create sharing. Each subscriber owns an independent previous-value slot.

**Explicit exclusions:**

- Nested observer delivery, throwing subscriber/finalizer, physical source abort guarantees.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
