# timeoutWith: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Watch the original source for missing timely values, then release it and fail or connect to a replacement.  
**Cω shape:** `timeoutWith : Cω(Due,Replacement,Scheduler) → T* → (T ∪ R)*`  
**Profiles represented:** `timeoutWith`, `timeoutWith-date`

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
| 1 | Operator Overview | [timeoutWith behavior](./timeoutWith.md)<br>[timeoutWith-date behavior](./timeoutWith-date.md) | What does this operator do? |
| 2 | State Diagram | [timeoutWith diagram](../generated/timeoutWith.diagram.md)<br>[timeoutWith-date diagram](../generated/timeoutWith-date.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [timeoutWith STT](../generated/timeoutWith.stt.md)<br>[timeoutWith-date STT](../generated/timeoutWith-date.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [timeoutWith Rule BDD](../generated/timeoutWith.bdd.md)<br>[timeoutWith-date Rule BDD](../generated/timeoutWith-date.bdd.md)<br>[Scenario BDD](../docs/SESSION-21-SCENARIOS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [timeoutWith trace](../generated/timeoutWith.trace.md)<br>[timeoutWith-date trace](../generated/timeoutWith-date.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [timeoutWith obligations](../generated/timeoutWith.obligations.md)<br>[timeoutWith-date obligations](../generated/timeoutWith-date.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [timeoutWith manifest](../generated/timeoutWith.manifest.json)<br>[timeoutWith-date manifest](../generated/timeoutWith-date.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session21-timeout.ts](../src/models/session21-timeout.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [timeoutWith.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/timeoutWith.ts)<br>[timeoutWith-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/timeoutWith-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[timeout.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/timeout.ts)<br>[executeSchedule.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/executeSchedule.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session21-timeout-model.test.mjs](../tests/session21-timeout-model.test.mjs)<br>[tests/session21-timeout-rxjs.test.mjs](../tests/session21-timeout-rxjs.test.mjs)<br>[tests/session21-timeout-differential.test.mjs](../tests/session21-timeout-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-21-SCENARIOS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-21.md](../evidence/SESSION-21.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** first=none, each=4, binding=constant. Relative durations are integers 1..1000; absolute first time must be a future safe integer at subscription.

**Callbacks:** No user callback: the deprecated alias captures one constant Observable description.

**Time:** Supplied nonnegative safe integer now; deferred FIFO scheduler; current generation fires at or after due. Event/envelope times agree. Equal-time input order controls races; source arrival after a deadline can still win if timer delivery is late.

**Reentrancy:** Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Sharing / ownership:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Explicit exclusions:**

- Synchronous source or fallback notification during subscription acquisition; source setup advancing the clock.
- Nonpositive/fractional/nonfinite relative durations, expired absolute dates, synchronous queueScheduler, scheduler exceptions and platform timing precision.
- Promise/Iterable conversions, invalid fallback inputs, factory reentrancy and throwing producer teardown.
- Default TimeoutError prototype construction is assumed for the supplied factory outcome and checked independently natively.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
