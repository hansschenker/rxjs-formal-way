# mergeScan: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Merge projected inner Observables while the most recent inner next updates the accumulator used at later admission.  
**Cω shape:** `mergeScan : (R × T × Index -> R*) × R × T* -> R*`  
**Profiles represented:** `mergeScan`

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
| 1 | Operator Overview | [mergeScan behavior](./mergeScan.md) | What does this operator do? |
| 2 | State Diagram | [mergeScan diagram](../generated/mergeScan.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [mergeScan STT](../generated/mergeScan.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [mergeScan BDD](../generated/mergeScan.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [mergeScan trace](../generated/mergeScan.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [mergeScan obligations](../generated/mergeScan.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [mergeScan manifest](../generated/mergeScan.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session14-flatten.ts](../src/models/session14-flatten.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [mergeScan.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeScan.ts)<br>[mergeInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeInternals.ts)<br>[mergeMap.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeMap.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session14-model.test.mjs](../tests/session14-model.test.mjs)<br>[tests/session14-rxjs.test.mjs](../tests/session14-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-14.md](../evidence/SESSION-14.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Seed is a provided opaque R reference; concurrency 2; valid Observable-returning accumulator.

**Callbacks:** One synchronous callback request carries {accumulator,value}, plus exact zero-based admission index; only correlated return/throw accepted.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Reentrancy:** Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Sharing / ownership:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Explicit exclusions:**

- Promise/Iterable return conversions, reentrant projections, observer or finalizer throws.
- No promise of serial accumulation under concurrency greater than 1; this model intentionally admits stale snapshots across overlaps.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
