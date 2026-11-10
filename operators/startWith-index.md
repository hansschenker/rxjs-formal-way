# startWith: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Before subscribing to source, synchronously emit all supplied prefix values in order, then forward source notifications.  
**Cω shape:** `startWith(P*) : T* -> (P + T)*`  
**Profiles represented:** `startWith`

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
| 1 | Operator Overview | [startWith behavior](./startWith.md) | What does this operator do? |
| 2 | State Diagram | [startWith diagram](../generated/startWith.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [startWith STT](../generated/startWith.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [startWith BDD](../generated/startWith.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [startWith trace](../generated/startWith.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [startWith obligations](../generated/startWith.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [startWith manifest](../generated/startWith.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/startWith.ts](../src/models/startWith.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [startWith.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/startWith.ts)<br>[concat.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/concat.ts)<br>[args.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/args.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session4-model.test.mjs](../tests/session4-model.test.mjs)<br>[tests/session4-rxjs.test.mjs](../tests/session4-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-04.md](../evidence/SESSION-04.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** A finite frozen snapshot of supplied prefix values; no SchedulerLike argument.

**Callbacks:** No user projection. Prefix values are opaque and forwarded without inspection.

**Time:** Unscheduled prefix values are synchronous on subscription; source time begins only when subscribed. No internal clock or timer.

**Reentrancy:** Atomic non-reentrant prefix microsteps and source delivery; supports downstream cancellation between prefix emissions.

**Sharing / ownership:** No multicasting. Each result subscription repeats prefix and owns its own source subscription.

**Explicit exclusions:**

- Deprecated SchedulerLike overload, which uses scheduling and changes when the source is subscribed.
- Throwing observer/finalizer, nested synchronous reentry or guaranteed physical producer abort.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
