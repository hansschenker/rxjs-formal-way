# materialize: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Turn next, error and completion protocol signals into typed next values, then complete on original terminal signals.  
**Cω shape:** `materialize : T* -> Notification<T>*`  
**Profiles represented:** `materialize`

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
| 1 | Operator Overview | [materialize behavior](./materialize.md) | What does this operator do? |
| 2 | State Diagram | [materialize diagram](../generated/materialize.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [materialize STT](../generated/materialize.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [materialize BDD](../generated/materialize.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [materialize trace](../generated/materialize.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [materialize obligations](../generated/materialize.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [materialize manifest](../generated/materialize.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session14-materialize.ts](../src/models/session14-materialize.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [materialize.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/materialize.ts)<br>[Notification.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Notification.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session14-model.test.mjs](../tests/session14-model.test.mjs)<br>[tests/session14-rxjs.test.mjs](../tests/session14-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-14.md](../evidence/SESSION-14.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** No arguments.

**Callbacks:** No user callbacks or value inspection.

**Time:** Source timing and ordering are preserved; no timer or scheduler is introduced.

**Reentrancy:** Non-reentrant source delivery after subscription setup.

**Sharing / ownership:** No sharing. Every output subscription has its own source connection.

**Explicit exclusions:**

- No equivalence claim for Notification class prototype, cached C instance, or property descriptors; semantic kind/value/error/hasValue are modeled.
- Synchronous reentrancy, observer throws and teardown throws are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
