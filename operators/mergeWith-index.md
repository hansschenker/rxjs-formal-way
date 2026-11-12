# mergeWith: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Unbounded pipeable merge of the source and fixed other Observable inputs.  
**Cω shape:** `mergeWith : T* × U1* × ... × Un* → (T | U1 | ... | Un)*`  
**Profiles represented:** `mergeWith`

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
| 1 | Operator Overview | [mergeWith behavior](./mergeWith.md) | What does this operator do? |
| 2 | State Diagram | [mergeWith diagram](../generated/mergeWith.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [mergeWith STT](../generated/mergeWith.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [mergeWith BDD](../generated/mergeWith.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [mergeWith trace](../generated/mergeWith.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [mergeWith obligations](../generated/mergeWith.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [mergeWith manifest](../generated/mergeWith.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session15-aliases.ts](../src/models/session15-aliases.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [mergeWith.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeWith.ts)<br>[merge.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/merge.ts)<br>[mergeInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeInternals.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session15-model.test.mjs](../tests/session15-model.test.mjs)<br>[tests/session15-rxjs.test.mjs](../tests/session15-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-15.md](../evidence/SESSION-15.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Exactly 2 other valid Observable inputs; unbounded concurrency, no scheduler argument.

**Callbacks:** No callbacks. Input payloads are opaque and preserve identity.

**Time:** No internal clock; all inputs supply their notification times. Source-first subscriptions are ordered.

**Reentrancy:** Atomic nonreentrant subscriptions; synchronous input delivery during acquisition is excluded.

**Sharing / ownership:** No sharing: every result subscription independently subscribes to all input Observables.

**Explicit exclusions:**

- No Promise/Iterable source conversion or reentrant synchronous emissions during acquisition.
- No deprecated concurrency/scheduler overload (these belong to merge, not mergeWith).

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
