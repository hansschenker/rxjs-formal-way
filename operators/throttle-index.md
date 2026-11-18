# throttle: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Select leading and/or latest trailing source values using one active duration Observable.  
**Cω shape:** `throttle : Cω(DurationSignal,Leading,Trailing) → T* → T*`  
**Profiles represented:** `throttle`, `throttle-leading-trailing`, `throttle-trailing`, `throttle-silent`

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
| 1 | Operator Overview | [throttle behavior](./throttle.md)<br>[throttle-leading-trailing behavior](./throttle-leading-trailing.md)<br>[throttle-trailing behavior](./throttle-trailing.md)<br>[throttle-silent behavior](./throttle-silent.md) | What does this operator do? |
| 2 | State Diagram | [throttle diagram](../generated/throttle.diagram.md)<br>[throttle-leading-trailing diagram](../generated/throttle-leading-trailing.diagram.md)<br>[throttle-trailing diagram](../generated/throttle-trailing.diagram.md)<br>[throttle-silent diagram](../generated/throttle-silent.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [throttle STT](../generated/throttle.stt.md)<br>[throttle-leading-trailing STT](../generated/throttle-leading-trailing.stt.md)<br>[throttle-trailing STT](../generated/throttle-trailing.stt.md)<br>[throttle-silent STT](../generated/throttle-silent.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [throttle Rule BDD](../generated/throttle.bdd.md)<br>[throttle-leading-trailing Rule BDD](../generated/throttle-leading-trailing.bdd.md)<br>[throttle-trailing Rule BDD](../generated/throttle-trailing.bdd.md)<br>[throttle-silent Rule BDD](../generated/throttle-silent.bdd.md)<br>[Scenario BDD](../docs/SESSION-20-SCENARIOS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [throttle trace](../generated/throttle.trace.md)<br>[throttle-leading-trailing trace](../generated/throttle-leading-trailing.trace.md)<br>[throttle-trailing trace](../generated/throttle-trailing.trace.md)<br>[throttle-silent trace](../generated/throttle-silent.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [throttle obligations](../generated/throttle.obligations.md)<br>[throttle-leading-trailing obligations](../generated/throttle-leading-trailing.obligations.md)<br>[throttle-trailing obligations](../generated/throttle-trailing.obligations.md)<br>[throttle-silent obligations](../generated/throttle-silent.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [throttle manifest](../generated/throttle.manifest.json)<br>[throttle-leading-trailing manifest](../generated/throttle-leading-trailing.manifest.json)<br>[throttle-trailing manifest](../generated/throttle-trailing.manifest.json)<br>[throttle-silent manifest](../generated/throttle-silent.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session20-throttle.ts](../src/models/session20-throttle.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [throttle.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throttle.ts)<br>[throttle-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/throttle-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session20-model.test.mjs](../tests/session20-model.test.mjs)<br>[tests/session20-rxjs.test.mjs](../tests/session20-rxjs.test.mjs)<br>[tests/session20-differential.test.mjs](../tests/session20-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-20-SCENARIOS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-20.md](../evidence/SESSION-20.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** leading=true, trailing=false. Valid Observable-returning duration selector; every returned token identifies its producer description.

**Callbacks:** Selector invocation and correlated return/throw are explicit. Its payload is the value that starts a duration, including a trailing output.

**Time:** All event times are supplied nonnegative safe integers. Equal-time order is input order. Source and duration Observables supply time; selector outcomes remain at invocation time. No internal clock is created.

**Reentrancy:** Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Sharing / ownership:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Explicit exclusions:**

- Promise/Iterable conversion and invalid duration inputs.
- Synchronous duration delivery during subscription acquisition; separately characterized natively.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
