# sampleTime: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Sample a remembered source value at fixed virtual scheduler ticks.  
**Cω shape:** `sampleTime(period,scheduler) : Cω(Time) → T* → T*`  
**Profiles represented:** `sampleTime`

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
| 1 | Operator Overview | [sampleTime behavior](./sampleTime.md) | What does this operator do? |
| 2 | State Diagram | [sampleTime diagram](../generated/sampleTime.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [sampleTime STT](../generated/sampleTime.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [sampleTime BDD](../generated/sampleTime.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [sampleTime trace](../generated/sampleTime.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [sampleTime obligations](../generated/sampleTime.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [sampleTime manifest](../generated/sampleTime.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session18-sampling.ts](../src/models/session18-sampling.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [sampleTime.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/sampleTime.ts)<br>[interval.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/interval.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session18-model.test.mjs](../tests/session18-model.test.mjs)<br>[tests/session18-rxjs.test.mjs](../tests/session18-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-18.md](../evidence/SESSION-18.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Positive safe-integer period 1..1000 with a virtual FIFO scheduler and non-overlapping ticks.

**Callbacks:** No user predicate or projection; notifier payloads are ignored.

**Time:** Ticks at period, 2×period, ... beginning at the subscription instant, using a supplied virtual scheduler.

**Reentrancy:** Atomic post-setup notifications, no simultaneous/torn-down scheduler action execution.

**Sharing / ownership:** None; one independent memory and clock/notifier per result subscription.

**Explicit exclusions:**

- Synchronous notifier activity while initial source/notifier subscriptions are being constructed.
- Non-Observable notifier inputs, source/observer reentrancy, throwing teardown and scheduler errors.
- Negative, zero, fractional or unbounded periods and custom scheduler implementations.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
