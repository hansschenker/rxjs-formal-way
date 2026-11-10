# delayWhen: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Hold each source value until its own selected duration emits a next; allow overlapping waits.  
**Cω shape:** `delayWhen : T* -> T* (time-shifted subset for delayWhen)`  
**Profiles represented:** `delayWhen`

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
| 1 | Operator Overview | [delayWhen behavior](./delayWhen.md) | What does this operator do? |
| 2 | State Diagram | [delayWhen diagram](../generated/delayWhen.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [delayWhen STT](../generated/delayWhen.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [delayWhen BDD](../generated/delayWhen.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [delayWhen trace](../generated/delayWhen.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [delayWhen obligations](../generated/delayWhen.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [delayWhen manifest](../generated/delayWhen.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/delayPolicy.ts](../src/models/delayPolicy.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [delayWhen.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/delayWhen.ts)<br>[mergeMap.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeMap.ts)<br>[mergeInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeInternals.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session10-model.test.mjs](../tests/session10-model.test.mjs)<br>[tests/session10-rxjs.test.mjs](../tests/session10-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-10.md](../evidence/SESSION-10.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Observable-valued duration selector; no deprecated subscriptionDelay overload.

**Callbacks:** Indexed selector invoked once per source next; modeled as correlated return/throw outcomes.

**Time:** Schedulers and duration sources own time; the model only uses supplied now and ordered events.

**Reentrancy:** Atomic non-reentrant notifications and selector resolution; no callback-driven source reentry.

**Sharing / ownership:** No implicit sharing or replay; multiple independent live timers/durations.

**Explicit exclusions:**

- Promise/iterable input conversion, Date absolute delay, custom schedulers, deprecated subscriptionDelay.
- Reentrant producer/observer/finalizer, cancellation during callback delivery, universal metric-time guarantee.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
