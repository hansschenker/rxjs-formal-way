# take: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Forward up to count values, then complete and release the source subscription.  
**Cω shape:** `take(n) : T* -> T[0..n]`  
**Profiles represented:** `take`

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
| 1 | Operator Overview | [take behavior](./take.md) | What does this operator do? |
| 2 | State Diagram | [take diagram](../generated/take.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [take STT](../generated/take.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [take BDD](../generated/take.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [take trace](../generated/take.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [take obligations](../generated/take.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [take manifest](../generated/take.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/take.ts](../src/models/take.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [take.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/take.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[empty.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/empty.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/m01-model.test.mjs](../tests/m01-model.test.mjs)<br>[tests/m01-rxjs.test.mjs](../tests/m01-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/M01.md](../evidence/M01.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** count is a nonnegative safe integer

**Callbacks:** No supplied callback; observers must not reenter, cancel during delivery, or throw.

**Time:** No internal clock; caller supplies nonnegative trace times and same-time order.

**Reentrancy:** Atomic non-reentrant steps, observed at quiescence. No nested delivery model.

**Sharing / ownership:** No sharing introduced; source hot/cold character is preserved.

**Explicit exclusions:**

- Negative/fractional counts, NaN, Infinity and unsafe integers.
- Nested synchronous input and cancellation inside notification handlers.
- Teardown exceptions, unrelated external resources, and arbitrary source side effects.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
