# timeInterval: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Pair each source value with the supplied-clock difference since connection or the preceding value.  
**Cω shape:** `timeInterval : Cω(SchedulerClock) → T* → {value:T,interval:number}*`  
**Profiles represented:** `timeInterval`

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
| 1 | Operator Overview | [timeInterval behavior](./timeInterval.md) | What does this operator do? |
| 2 | State Diagram | [timeInterval diagram](../generated/timeInterval.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [timeInterval STT](../generated/timeInterval.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [timeInterval Rule BDD](../generated/timeInterval.bdd.md)<br>[Scenario BDD](../docs/SESSION-21-SCENARIOS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [timeInterval trace](../generated/timeInterval.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [timeInterval obligations](../generated/timeInterval.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [timeInterval manifest](../generated/timeInterval.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session21-clock.ts](../src/models/session21-clock.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [timeInterval.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/timeInterval.ts)<br>[timeInterval-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/timeInterval-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[lift.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/lift.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session21-clock-model.test.mjs](../tests/session21-clock-model.test.mjs)<br>[tests/session21-clock-rxjs.test.mjs](../tests/session21-clock-rxjs.test.mjs)<br>[tests/session21-clock-differential.test.mjs](../tests/session21-clock-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-21-SCENARIOS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-21.md](../evidence/SESSION-21.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One valid, synchronous external now provider. Finite numeric readings; finite differences for timeInterval. Provider readings may be negative, fractional, repeated or decreasing.

**Callbacks:** Each provider.now request is an explicit invocation with no arguments. A correlated return or throw is supplied; the pure machine never calls a provider.

**Time:** Trace-envelope time is finite, nonnegative and nondecreasing. Provider readings are separate data and may move backwards. runClockTrace enforces same-envelope-time provider outcomes; no timer is introduced.

**Reentrancy:** Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Sharing / ownership:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Explicit exclusions:**

- Nonfinite provider readings and numeric-overflow differences.
- Clock-provider receiver/getter mutations, reentrant provider/observer actions, and consumer cancellation during a pending read.
- Source delivery during acquisition is characterized natively; action ordering here assumes setup has returned.
- TimeInterval class/prototype identity: the model exposes its value/interval structural projection; native tests separately inspect actual constructor identity.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
