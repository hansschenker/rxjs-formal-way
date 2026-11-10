# reduce: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Accumulate every source value, but emit the final accumulation only on successful source completion.  
**Cω shape:** `reduce : ((A + S)! x T! x Index! -> A!) x S? -> T* -> A?`  
**Profiles represented:** `reduce`, `reduce-unseeded`

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
| 1 | Operator Overview | [reduce behavior](./reduce.md)<br>[reduce-unseeded behavior](./reduce-unseeded.md) | What does this operator do? |
| 2 | State Diagram | [reduce diagram](../generated/reduce.diagram.md)<br>[reduce-unseeded diagram](../generated/reduce-unseeded.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [reduce STT](../generated/reduce.stt.md)<br>[reduce-unseeded STT](../generated/reduce-unseeded.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [reduce BDD](../generated/reduce.bdd.md)<br>[reduce-unseeded BDD](../generated/reduce-unseeded.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [reduce trace](../generated/reduce.trace.md)<br>[reduce-unseeded trace](../generated/reduce-unseeded.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [reduce obligations](../generated/reduce.obligations.md)<br>[reduce-unseeded obligations](../generated/reduce-unseeded.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [reduce manifest](../generated/reduce.manifest.json)<br>[reduce-unseeded manifest](../generated/reduce-unseeded.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/aggregate.ts](../src/models/aggregate.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [reduce.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/reduce.ts)<br>[scanInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/scanInternals.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session06-model.test.mjs](../tests/session06-model.test.mjs)<br>[tests/session06-rxjs.test.mjs](../tests/session06-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-06.md](../evidence/SESSION-06.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** reduce in seeded profile; safe-integer source indices

**Callbacks:** The model requests a correlated callback with {previous, incoming} and source index. An external adapter invokes the reducer, predicate or comparison once; return/throw arrives as an explicit input.

**Time:** No clock, timer or scheduler allocated. Input times and equal-time order are supplied by the source/test environment.

**Reentrancy:** Non-reentrant source and callback/observer reactions; only correlated callback outcomes are legal while Calling.

**Sharing / ownership:** Each result subscription owns its own accumulation and index; no replay or sharing is introduced. Payload references are opaque.

**Explicit exclusions:**

- Reentrant synchronous source delivery or cancellation within reducer/predicate/comparer or destination.next.
- Throwing finalizers or downstream observers, arbitrary ObservableInput coercion, invalid count/index overflows.
- Array mutation by consumers before emission, object property getter side effects, custom comparator reentrancy.
- Finite bounded tests are not universal equivalence proofs or a production interpreter.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
