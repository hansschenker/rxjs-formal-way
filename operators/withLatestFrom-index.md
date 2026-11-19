# withLatestFrom: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Use latest auxiliary values only at source emission time, gated by all auxiliaries having produced a value.  
**Cω shape:** `withLatestFrom : (U₀*,…,Uₙ*) → T* → (T × U₀ × … × Uₙ)*`  
**Profiles represented:** `withLatestFrom`, `withLatestFrom-empty`

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
| 1 | Operator Overview | [withLatestFrom behavior](./withLatestFrom.md)<br>[withLatestFrom-empty behavior](./withLatestFrom-empty.md) | What does this operator do? |
| 2 | State Diagram | [withLatestFrom diagram](../generated/withLatestFrom.diagram.md)<br>[withLatestFrom-empty diagram](../generated/withLatestFrom-empty.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [withLatestFrom STT](../generated/withLatestFrom.stt.md)<br>[withLatestFrom-empty STT](../generated/withLatestFrom-empty.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [withLatestFrom Rule BDD](../generated/withLatestFrom.bdd.md)<br>[withLatestFrom-empty Rule BDD](../generated/withLatestFrom-empty.bdd.md)<br>[Scenario BDD](../docs/SESSION-22-LATEST-GATE.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [withLatestFrom trace](../generated/withLatestFrom.trace.md)<br>[withLatestFrom-empty trace](../generated/withLatestFrom-empty.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [withLatestFrom obligations](../generated/withLatestFrom.obligations.md)<br>[withLatestFrom-empty obligations](../generated/withLatestFrom-empty.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [withLatestFrom manifest](../generated/withLatestFrom.manifest.json)<br>[withLatestFrom-empty manifest](../generated/withLatestFrom-empty.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session22-withLatestFrom.ts](../src/models/session22-withLatestFrom.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [withLatestFrom.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/withLatestFrom.ts)<br>[withLatestFrom-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/withLatestFrom-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session22-withLatestFrom-model.test.mjs](../tests/session22-withLatestFrom-model.test.mjs)<br>[tests/session22-withLatestFrom-rxjs.test.mjs](../tests/session22-withLatestFrom-rxjs.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-22-LATEST-GATE.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-22.md](../evidence/SESSION-22.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One to sixteen valid Observable auxiliaries; tuple output without deprecated result-selector projection.

**Callbacks:** No user callback in this profile. Each output is a fresh array; each member is the unchanged opaque value/reference.

**Time:** No scheduler added; source and auxiliary notifications supply time. Same-time ordering is explicit input order.

**Reentrancy:** Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Sharing / ownership:** Independent result subscriptions own independent latest memory and auxiliary/source connections; no sharing or replay introduced.

**Explicit exclusions:**

- Zero auxiliary arguments, whose pinned implementation leaves ready false indefinitely.
- Deprecated resultSelector/projector overload, throwing projector and callback reentrancy.
- Synchronous setup-time notifications/errors and ObservableInput conversion from Promise/Iterable.
- Unbounded auxiliary counts and arbitrary arbitrary subscription-side effects.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
