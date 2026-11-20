# zip: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Pair values by arrival index using one FIFO per input; retain completed input queues until exhausted.  
**Cω shape:** `zip : (U₁*, …, Uₙ*) → T* → (T × U₁ × … × Uₙ)*`  
**Profiles represented:** `zip`, `zip-drain`, `zip-cancel`

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
| 1 | Operator Overview | [zip behavior](./zip.md)<br>[zip-drain behavior](./zip-drain.md)<br>[zip-cancel behavior](./zip-cancel.md) | What does this operator do? |
| 2 | State Diagram | [zip diagram](../generated/zip.diagram.md)<br>[zip-drain diagram](../generated/zip-drain.diagram.md)<br>[zip-cancel diagram](../generated/zip-cancel.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [zip STT](../generated/zip.stt.md)<br>[zip-drain STT](../generated/zip-drain.stt.md)<br>[zip-cancel STT](../generated/zip-cancel.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [zip Rule BDD](../generated/zip.bdd.md)<br>[zip-drain Rule BDD](../generated/zip-drain.bdd.md)<br>[zip-cancel Rule BDD](../generated/zip-cancel.bdd.md)<br>[Scenario BDD](../docs/SESSION-23-ZIP.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [zip trace](../generated/zip.trace.md)<br>[zip-drain trace](../generated/zip-drain.trace.md)<br>[zip-cancel trace](../generated/zip-cancel.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [zip obligations](../generated/zip.obligations.md)<br>[zip-drain obligations](../generated/zip-drain.obligations.md)<br>[zip-cancel obligations](../generated/zip-cancel.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [zip manifest](../generated/zip.manifest.json)<br>[zip-drain manifest](../generated/zip-drain.manifest.json)<br>[zip-cancel manifest](../generated/zip-cancel.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session23-zip-common.ts](../src/models/session23-zip-common.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [zip.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/zip.ts)<br>[zip-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/zip-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[zip.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/zip.ts)<br>[zip-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/observables/zip-spec.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session23-zip-model.test.mjs](../tests/session23-zip-model.test.mjs)<br>[tests/session23-zip-rxjs.test.mjs](../tests/session23-zip-rxjs.test.mjs)<br>[tests/session23-zip-differential.test.mjs](../tests/session23-zip-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-23-SCENARIOS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-23.md](../evidence/SESSION-23.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One to sixteen total Observable inputs including source, tuple output, FIFO analysis bound 1..32 per input. The bound limits modeled histories; RxJS itself does not enforce it.

**Callbacks:** No user projector in the canonical profile. Payloads remain opaque and retain identity inside fresh output tuples.

**Time:** Source and auxiliary notifications supply time; the operator introduces no clock or scheduler. Equal-time arrivals retain explicit event order.

**Reentrancy:** Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Sharing / ownership:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Explicit exclusions:**

- Synchronous acquisition-time notifications, arbitrary ObservableInput conversions and unbounded FIFO histories.
- Optional legacy zip projector and array-argument overload behavior; these are separately characterized natively.
- Unsafe count overflow and more than sixteen inputs.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
