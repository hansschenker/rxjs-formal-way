# merge: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Merge one piped source and configured other Observables; bounded concurrency starts later sources FIFO.  
**Cω shape:** `merge : T0* × ... × Tn* → (T0 | ... | Tn)*`  
**Profiles represented:** `merge`

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
| 1 | Operator Overview | [merge behavior](./merge.md) | What does this operator do? |
| 2 | State Diagram | [merge diagram](../generated/merge.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [merge STT](../generated/merge.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [merge BDD](../generated/merge.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [merge trace](../generated/merge.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [merge obligations](../generated/merge.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [merge manifest](../generated/merge.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session14-merge.ts](../src/models/session14-merge.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [merge.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/merge.ts)<br>[mergeAll.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeAll.ts)<br>[mergeInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeInternals.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session14-model.test.mjs](../tests/session14-model.test.mjs)<br>[tests/session14-rxjs.test.mjs](../tests/session14-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-14.md](../evidence/SESSION-14.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Pipeable deprecated merge export with 2 other valid Observable inputs; concurrency 2; no scheduler.

**Callbacks:** No callbacks. Input payloads are opaque and preserve identity.

**Time:** No internal clock; all inputs supply their notification times. Source-first subscriptions are ordered.

**Reentrancy:** Atomic nonreentrant subscriptions; synchronous input delivery during acquisition is excluded.

**Sharing / ownership:** Merge does not create sharing; each result subscription independently acquires input subscriptions.

**Explicit exclusions:**

- Deprecated scheduler overload and Promise/Iterable conversions, synchronous sources during subscription setup.
- Reentrant observers and source callbacks, teardown throws and unbounded scenario counts over 32 others.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
