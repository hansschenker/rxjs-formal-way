# last: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Retain the final selected source value; reveal exactly one result only after source completes successfully.  
**Cω shape:** `last(P?,D?) : T* -> (T|D)?`  
**Profiles represented:** `last`

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
| 1 | Operator Overview | [last behavior](./last.md) | What does this operator do? |
| 2 | State Diagram | [last diagram](../generated/last.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [last STT](../generated/last.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [last BDD](../generated/last.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [last trace](../generated/last.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [last obligations](../generated/last.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [last manifest](../generated/last.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session13-scalars.ts](../src/models/session13-scalars.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [last.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/last.ts)<br>[filter.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/filter.ts)<br>[takeLast.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/takeLast.ts)<br>[throwIfEmpty.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throwIfEmpty.ts)<br>[defaultIfEmpty.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/defaultIfEmpty.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session13-model.test.mjs](../tests/session13-model.test.mjs)<br>[tests/session13-rxjs.test.mjs](../tests/session13-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-13.md](../evidence/SESSION-13.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Predicate enabled true; explicit default supplied false; default can be undefined.

**Callbacks:** When selected, indexed predicate receives source value/index/original source; pure model requests callback and receives a correlated truthy/falsy or throw event.

**Time:** No timer. Output occurs at successful source completion time; cancellation or error produces no retained candidate.

**Reentrancy:** Atomic non-reentrant source and callback-outcome steps. User observers may not synchronously re-enter the modeled execution.

**Sharing / ownership:** No sharing, replay, or global storage; every output subscription has an independent machine.

**Explicit exclusions:**

- Deprecated thisArg/BooleanConstructor type-narrowing signatures as distinct run-time policies; reentrant callback/source; observer throwing.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
