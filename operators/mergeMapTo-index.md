# mergeMapTo: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Allow overlapping subscriptions to the same configured inner Observable; a source next admits one new occurrence.  
**Cω shape:** `mergeMapTo : T* × U* -> U*`  
**Profiles represented:** `mergeMapTo`

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
| 1 | Operator Overview | [mergeMapTo behavior](./mergeMapTo.md) | What does this operator do? |
| 2 | State Diagram | [mergeMapTo diagram](../generated/mergeMapTo.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [mergeMapTo STT](../generated/mergeMapTo.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [mergeMapTo BDD](../generated/mergeMapTo.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [mergeMapTo trace](../generated/mergeMapTo.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [mergeMapTo obligations](../generated/mergeMapTo.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [mergeMapTo manifest](../generated/mergeMapTo.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session14-flatten.ts](../src/models/session14-flatten.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [mergeMapTo.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeMapTo.ts)<br>[mergeMap.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeMap.ts)<br>[mergeInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeInternals.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session14-model.test.mjs](../tests/session14-model.test.mjs)<br>[tests/session14-rxjs.test.mjs](../tests/session14-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-14.md](../evidence/SESSION-14.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One valid constant Observable source and concurrency 2; no resultSelector.

**Callbacks:** No user projection; immediate callback.return is a pure constant-source binding microstep.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Reentrancy:** Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Sharing / ownership:** No sharing introduced. Repeated subscriptions may be to the same external Observable identity, which can itself be hot.

**Explicit exclusions:**

- Deprecated resultSelector overload, Promise/Iterable input, invalid constant source.
- Synchronous reentrant input/inner emission during acquisition, throwing observers or finalizers.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
