# windowTime: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Route source values through live multicast windows closed by supplied scheduler events or per-window counts.  
**Cω shape:** `windowTime : (Span, Interval? , Count?) → T* → (T*)*`  
**Profiles represented:** `windowTime`, `windowTime-overlap`, `windowTime-gap`, `windowTime-cancel`

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
| 1 | Operator Overview | [windowTime behavior](./windowTime.md)<br>[windowTime-overlap behavior](./windowTime-overlap.md)<br>[windowTime-gap behavior](./windowTime-gap.md)<br>[windowTime-cancel behavior](./windowTime-cancel.md) | What does this operator do? |
| 2 | State Diagram | [windowTime diagram](../generated/windowTime.diagram.md)<br>[windowTime-overlap diagram](../generated/windowTime-overlap.diagram.md)<br>[windowTime-gap diagram](../generated/windowTime-gap.diagram.md)<br>[windowTime-cancel diagram](../generated/windowTime-cancel.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [windowTime STT](../generated/windowTime.stt.md)<br>[windowTime-overlap STT](../generated/windowTime-overlap.stt.md)<br>[windowTime-gap STT](../generated/windowTime-gap.stt.md)<br>[windowTime-cancel STT](../generated/windowTime-cancel.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [windowTime Rule BDD](../generated/windowTime.bdd.md)<br>[windowTime-overlap Rule BDD](../generated/windowTime-overlap.bdd.md)<br>[windowTime-gap Rule BDD](../generated/windowTime-gap.bdd.md)<br>[windowTime-cancel Rule BDD](../generated/windowTime-cancel.bdd.md)<br>[Scenario BDD](../docs/SESSION-22-TIMED-WINDOWS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [windowTime trace](../generated/windowTime.trace.md)<br>[windowTime-overlap trace](../generated/windowTime-overlap.trace.md)<br>[windowTime-gap trace](../generated/windowTime-gap.trace.md)<br>[windowTime-cancel trace](../generated/windowTime-cancel.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [windowTime obligations](../generated/windowTime.obligations.md)<br>[windowTime-overlap obligations](../generated/windowTime-overlap.obligations.md)<br>[windowTime-gap obligations](../generated/windowTime-gap.obligations.md)<br>[windowTime-cancel obligations](../generated/windowTime-cancel.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [windowTime manifest](../generated/windowTime.manifest.json)<br>[windowTime-overlap manifest](../generated/windowTime-overlap.manifest.json)<br>[windowTime-gap manifest](../generated/windowTime-gap.manifest.json)<br>[windowTime-cancel manifest](../generated/windowTime-cancel.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session22-windowTime.ts](../src/models/session22-windowTime.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [windowTime.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowTime.ts)<br>[windowTime-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/windowTime-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[executeSchedule.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/executeSchedule.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session22-windowTime-model.test.mjs](../tests/session22-windowTime-model.test.mjs)<br>[tests/session22-windowTime-rxjs.test.mjs](../tests/session22-windowTime-rxjs.test.mjs)<br>[tests/session22-windowTime-differential.test.mjs](../tests/session22-windowTime-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-22-TIMED-WINDOWS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-22.md](../evidence/SESSION-22.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Positive safe-integer span, interval and finite maxSize in 1..1000. Null interval selects restart-on-close; null maxSize is unbounded. Finite safe-integer supplied scheduler time and counters without overflow.

**Callbacks:** No user function is invoked. Opaque source values retain identity. Emitted tokens denote Observable handles, not collected arrays.

**Time:** Deferred FIFO scheduler profile. Inputs carry supplied now; runWindowTimeTrace enforces now equals trace-envelope time. Explicit timer identities/ticks and input order decide same-time reactions. Delayed timer delivery is admissible at or after its due time.

**Reentrancy:** Atomic non-reentrant reactions. Consumers attach between reactions; callbacks that subscribe, cancel or emit during a current reaction are characterized separately if tested.

**Sharing / ownership:** Each outer execution owns independent source/timer resources. Each inner window is live multicast without replay; consumers hold no upstream lease.

**Explicit exclusions:**

- Zero/negative/fractional/non-finite durations, invalid overload normalization and synchronous scheduler execution.
- Setup-time source delivery, arbitrary reentrancy, subject implementation mutation and clock/counter overflow.
- Scheduler-specific physical Action allocation; recurring creation is normalized to one logical timer with explicit firing ticks.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
