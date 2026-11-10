# elementAt: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Select exactly the zero-based index, terminating as soon as it appears, or handle a missing index at source completion.  
**Cω shape:** `elementAt(i,D?) : T* -> (T|D)?`  
**Profiles represented:** `elementAt`

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
| 1 | Operator Overview | [elementAt behavior](./elementAt.md) | What does this operator do? |
| 2 | State Diagram | [elementAt diagram](../generated/elementAt.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [elementAt STT](../generated/elementAt.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [elementAt BDD](../generated/elementAt.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [elementAt trace](../generated/elementAt.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [elementAt obligations](../generated/elementAt.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [elementAt manifest](../generated/elementAt.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session11-scalar.ts](../src/models/session11-scalar.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [elementAt.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/elementAt.ts)<br>[filter.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/filter.ts)<br>[take.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/take.ts)<br>[throwIfEmpty.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throwIfEmpty.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session11-model.test.mjs](../tests/session11-model.test.mjs)<br>[tests/session11-rxjs.test.mjs](../tests/session11-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-11.md](../evidence/SESSION-11.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Nonnegative safe-integer index 2; explicit default is present. Negative/fractional indices excluded.

**Callbacks:** No user projection; skip indexed inputs by position without inspecting values.

**Time:** No timer. The selected item is forwarded at its source arrival; source completion decides only missing-index outcomes.

**Reentrancy:** Atomic non-reentrant source and callback outcome delivery; no observer/finalizer reentry inside the modeled reaction.

**Sharing / ownership:** None; independent operator state per subscription even if the upstream happens to be shared.

**Explicit exclusions:**

- Invalid, NaN, fractional and overflowing index values; construction-time negative-index error is not an execution transition.
- The missing-error model uses a structurally named ArgumentOutOfRangeError; native RxJS error constructor is separately checked.
- Observer reentry, throwing finalizers and callback-time cancellation.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
