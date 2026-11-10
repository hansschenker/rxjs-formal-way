# scan: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Remember each reducer result and emit it as values arrive, starting from a supplied but un-emitted seed.  
**Cω shape:** `scan : ((A + S)! x T! x Index! -> A!) x S! -> T* -> A*`  
**Profiles represented:** `scan-seeded`, `scan-unseeded`

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
| 1 | Operator Overview | [scan-seeded behavior](./scan-seeded.md)<br>[scan-unseeded behavior](./scan-unseeded.md) | What does this operator do? |
| 2 | State Diagram | [scan-seeded diagram](../generated/scan-seeded.diagram.md)<br>[scan-unseeded diagram](../generated/scan-unseeded.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [scan-seeded STT](../generated/scan-seeded.stt.md)<br>[scan-unseeded STT](../generated/scan-unseeded.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [scan-seeded BDD](../generated/scan-seeded.bdd.md)<br>[scan-unseeded BDD](../generated/scan-unseeded.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [scan-seeded trace](../generated/scan-seeded.trace.md)<br>[scan-unseeded trace](../generated/scan-unseeded.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [scan-seeded obligations](../generated/scan-seeded.obligations.md)<br>[scan-unseeded obligations](../generated/scan-unseeded.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [scan-seeded manifest](../generated/scan-seeded.manifest.json)<br>[scan-unseeded manifest](../generated/scan-unseeded.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/scan.ts](../src/models/scan.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [scan.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/scan.ts)<br>[scanInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/scanInternals.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/m02b-model.test.mjs](../tests/m02b-model.test.mjs)<br>[tests/m02b-rxjs.test.mjs](../tests/m02b-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/M02-B.md](../evidence/M02-B.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** seeded scan; a named reducer binding and safe-integer source indices

**Callbacks:** The pure model requests a call with { accumulator, value } and index; an external adapter invokes reducer(accumulator, value, index) exactly once and returns a correlated outcome.

**Time:** No clock or timer. Source and callback-outcome events use supplied timestamps and explicit sequence order.

**Reentrancy:** Non-reentrant source, reducer and observer; cancellation only between resolved value reactions.

**Sharing / ownership:** Each subscription owns its index and accumulation binding; no sharing or replay is introduced. Seed/result object references are not cloned and may be externally shared.

**Explicit exclusions:**

- Nested input or cancellation during reducer/observer delivery; throwing finalizers or observers.
- Index precision loss, invalid reducer arguments, and universal symbolic equivalence.
- Deep cloning or freezing of seed/results, lossless arbitrary-value JSON encoding, and a production interpreter.
- Arbitrary mutation of referenced objects is not represented as a separate state event; immutable reducers are the differential-test domain.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
