# isEmpty: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Emit false and complete upon first next; emit true and complete only on empty successful completion.  
**Cω shape:** `isEmpty : T* -> Boolean?`  
**Profiles represented:** `isEmpty`

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
| 1 | Operator Overview | [isEmpty behavior](./isEmpty.md) | What does this operator do? |
| 2 | State Diagram | [isEmpty diagram](../generated/isEmpty.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [isEmpty STT](../generated/isEmpty.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [isEmpty BDD](../generated/isEmpty.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [isEmpty trace](../generated/isEmpty.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [isEmpty obligations](../generated/isEmpty.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [isEmpty manifest](../generated/isEmpty.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session13-scalars.ts](../src/models/session13-scalars.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [isEmpty.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/isEmpty.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session13-model.test.mjs](../tests/session13-model.test.mjs)<br>[tests/session13-rxjs.test.mjs](../tests/session13-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-13.md](../evidence/SESSION-13.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** No arguments.

**Callbacks:** No callback or source value inspection.

**Time:** No timer; decision is synchronous on first next or empty completion.

**Reentrancy:** Atomic non-reentrant source and callback-outcome steps. User observers may not synchronously re-enter the modeled execution.

**Sharing / ownership:** No sharing, replay, or global storage; every output subscription has an independent machine.

**Explicit exclusions:**

- Synchronous reentry within observer callbacks.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
