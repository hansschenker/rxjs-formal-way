# pluck: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Deprecated nested-property projection implemented as a map; preserves value order and timing.  
**Cω shape:** `pluck(path) : T* -> U* (one output next per source next)`  
**Profiles represented:** `pluck`

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
| 1 | Operator Overview | [pluck behavior](./pluck.md) | What does this operator do? |
| 2 | State Diagram | [pluck diagram](../generated/pluck.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [pluck STT](../generated/pluck.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [pluck BDD](../generated/pluck.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [pluck trace](../generated/pluck.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [pluck obligations](../generated/pluck.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [pluck manifest](../generated/pluck.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session16.ts](../src/models/session16.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [pluck.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/pluck.ts)<br>[map.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/map.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session16-model.test.mjs](../tests/session16-model.test.mjs)<br>[tests/session16-rxjs.test.mjs](../tests/session16-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-16.md](../evidence/SESSION-16.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One to three non-empty own/plain-data string property keys; no empty paths.

**Callbacks:** No user callback; read nested plain data directly as in the pinned map-based implementation.

**Time:** No clock or scheduler is introduced; every projected output occurs in its source notification step.

**Reentrancy:** Atomic non-reentrant source notifications and primitive/plain-object property access.

**Sharing / ownership:** None; each subscription independently projects one source.

**Explicit exclusions:**

- Getters and proxies with side effects or throws, symbol keys, dynamically mutated paths.
- Constructor-time error for zero path elements is represented by factory rejection, not a stream notification.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
