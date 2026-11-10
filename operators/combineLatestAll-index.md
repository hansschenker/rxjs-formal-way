# combineLatestAll: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Collect inner sources until the outer completes; then subscribe and emit fresh arrays whenever an inner updates after all first values arrive.  
**Cω shape:** `combineLatestAll : (T*)* -> (T[])*`  
**Profiles represented:** `combineLatestAll`

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
| 1 | Operator Overview | [combineLatestAll behavior](./combineLatestAll.md) | What does this operator do? |
| 2 | State Diagram | [combineLatestAll diagram](../generated/combineLatestAll.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [combineLatestAll STT](../generated/combineLatestAll.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [combineLatestAll BDD](../generated/combineLatestAll.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [combineLatestAll trace](../generated/combineLatestAll.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [combineLatestAll obligations](../generated/combineLatestAll.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [combineLatestAll manifest](../generated/combineLatestAll.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/combineLatestAll.ts](../src/models/combineLatestAll.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [combineLatestAll.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/combineLatestAll.ts)<br>[joinAllInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/joinAllInternals.ts)<br>[combineLatest.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/combineLatest.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session08-model.test.mjs](../tests/session08-model.test.mjs)<br>[tests/session08-rxjs.test.mjs](../tests/session08-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-08.md](../evidence/SESSION-08.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Observable-valued outer source, nonempty or empty; no optional projector.

**Callbacks:** No user callback for this profile; projector overload must be specified/tested separately and is not claimed here.

**Time:** No internal timer. Collection barrier is outer completion; subsequent ordering is determined by inner notifications, including equal-time arrival order.

**Reentrancy:** Inner notifications delivered after all initial inner subscriptions have been installed; arbitrary synchronous emissions during that setup excluded.

**Sharing / ownership:** No sharing. One execution holds source collection and one subscription per collected inner.

**Explicit exclusions:**

- Optional project function, arbitrary ObservableInput/Promise conversion and synchronous/reentrant emission during inner subscription setup.
- Observer/finalizer throw, cancellation inside output delivery, outer observable reference mutation and universal symbolic equivalence.
- No early completion when an inner completes without a value: pinned RxJS combineLatestInit waits for every inner completion.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
