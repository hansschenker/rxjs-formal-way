# throttleTime: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Select leading and/or latest trailing source values using one active scheduled duration.  
**Cω shape:** `throttleTime : Cω(Duration,Scheduler,Leading,Trailing) → T* → T*`  
**Profiles represented:** `throttleTime`, `throttleTime-leading-trailing`, `throttleTime-trailing`, `throttleTime-silent`

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
| 1 | Operator Overview | [throttleTime behavior](./throttleTime.md)<br>[throttleTime-leading-trailing behavior](./throttleTime-leading-trailing.md)<br>[throttleTime-trailing behavior](./throttleTime-trailing.md)<br>[throttleTime-silent behavior](./throttleTime-silent.md) | What does this operator do? |
| 2 | State Diagram | [throttleTime diagram](../generated/throttleTime.diagram.md)<br>[throttleTime-leading-trailing diagram](../generated/throttleTime-leading-trailing.diagram.md)<br>[throttleTime-trailing diagram](../generated/throttleTime-trailing.diagram.md)<br>[throttleTime-silent diagram](../generated/throttleTime-silent.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [throttleTime STT](../generated/throttleTime.stt.md)<br>[throttleTime-leading-trailing STT](../generated/throttleTime-leading-trailing.stt.md)<br>[throttleTime-trailing STT](../generated/throttleTime-trailing.stt.md)<br>[throttleTime-silent STT](../generated/throttleTime-silent.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [throttleTime Rule BDD](../generated/throttleTime.bdd.md)<br>[throttleTime-leading-trailing Rule BDD](../generated/throttleTime-leading-trailing.bdd.md)<br>[throttleTime-trailing Rule BDD](../generated/throttleTime-trailing.bdd.md)<br>[throttleTime-silent Rule BDD](../generated/throttleTime-silent.bdd.md)<br>[Scenario BDD](../docs/SESSION-20-SCENARIOS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [throttleTime trace](../generated/throttleTime.trace.md)<br>[throttleTime-leading-trailing trace](../generated/throttleTime-leading-trailing.trace.md)<br>[throttleTime-trailing trace](../generated/throttleTime-trailing.trace.md)<br>[throttleTime-silent trace](../generated/throttleTime-silent.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [throttleTime obligations](../generated/throttleTime.obligations.md)<br>[throttleTime-leading-trailing obligations](../generated/throttleTime-leading-trailing.obligations.md)<br>[throttleTime-trailing obligations](../generated/throttleTime-trailing.obligations.md)<br>[throttleTime-silent obligations](../generated/throttleTime-silent.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [throttleTime manifest](../generated/throttleTime.manifest.json)<br>[throttleTime-leading-trailing manifest](../generated/throttleTime-leading-trailing.manifest.json)<br>[throttleTime-trailing manifest](../generated/throttleTime-trailing.manifest.json)<br>[throttleTime-silent manifest](../generated/throttleTime-silent.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session20-throttle.ts](../src/models/session20-throttle.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [throttleTime.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throttleTime.ts)<br>[throttleTime-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/throttleTime-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[throttle.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throttle.ts)<br>[timer.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/timer.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session20-model.test.mjs](../tests/session20-model.test.mjs)<br>[tests/session20-rxjs.test.mjs](../tests/session20-rxjs.test.mjs)<br>[tests/session20-differential.test.mjs](../tests/session20-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-20-SCENARIOS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-20.md](../evidence/SESSION-20.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** leading=true, trailing=false. Positive integer duration 1..1000 with a deferred FIFO virtual scheduler.

**Callbacks:** No user callback. A scheduled duration is a source of timer.fire inputs.

**Time:** All event times are supplied nonnegative safe integers. Equal-time order is input order. timer.fire must name the current generation and occur at or after its deadline; lateness does not backdate output. No progress occurs merely because a deadline exists.

**Reentrancy:** Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Sharing / ownership:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Explicit exclusions:**

- Zero/negative/fractional durations, synchronous queueScheduler, custom scheduler exceptions and platform timing precision.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
