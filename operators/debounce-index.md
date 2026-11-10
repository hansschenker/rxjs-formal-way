# debounce: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Keep only the latest source value and release it on the current duration next, or flush on source completion.  
**Cω shape:** `debounce : T* × (T -> Duration*) -> T*`  
**Profiles represented:** `debounce`

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
| 1 | Operator Overview | [debounce behavior](./debounce.md) | What does this operator do? |
| 2 | State Diagram | [debounce diagram](../generated/debounce.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [debounce STT](../generated/debounce.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [debounce BDD](../generated/debounce.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [debounce trace](../generated/debounce.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [debounce obligations](../generated/debounce.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [debounce manifest](../generated/debounce.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/debounce.ts](../src/models/debounce.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [debounce.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/debounce.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session10-model.test.mjs](../tests/session10-model.test.mjs)<br>[tests/session10-rxjs.test.mjs](../tests/session10-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-10.md](../evidence/SESSION-10.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Duration selectors returning an Observable; no Promise or other ObservableInput conversion.

**Callbacks:** One synchronous selector invocation per source next; callback outcome modeled as a separate correlated event.

**Time:** Duration Observable controls delivery; no clock or timer is created by debounce itself.

**Reentrancy:** Atomic non-reentrant selector outcomes; reentrant source and observer delivery excluded.

**Sharing / ownership:** No sharing or replay; own latest value and one live duration per output subscriber.

**Explicit exclusions:**

- Promise/iterable duration, selector reentry, throwing observers/finalizers, cancellation during nested callback execution.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
