# flatMap: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Deprecated exact alias of mergeMap; allow overlapping inner subscriptions with configured concurrency.  
**Cω shape:** `flatMap : (T! × Index! -> U*) -> T* -> U*`  
**Profiles represented:** `flatMap`

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
| 1 | Operator Overview | [flatMap behavior](./flatMap.md) | What does this operator do? |
| 2 | State Diagram | [flatMap diagram](../generated/flatMap.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [flatMap STT](../generated/flatMap.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [flatMap BDD](../generated/flatMap.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [flatMap trace](../generated/flatMap.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [flatMap obligations](../generated/flatMap.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [flatMap manifest](../generated/flatMap.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session14-flatten.ts](../src/models/session14-flatten.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [flatMap.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/flatMap.ts)<br>[mergeMap.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeMap.ts)<br>[mergeInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeInternals.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session14-model.test.mjs](../tests/session14-model.test.mjs)<br>[tests/session14-rxjs.test.mjs](../tests/session14-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-14.md](../evidence/SESSION-14.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Named projection binding; concurrency 2; nonnegative safe-integer invocation indices

**Callbacks:** A pure rule requests projection once; a correlated return names an external valid Observable binding. A driver resolves inner subscription resources through the returned source-token registry.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Reentrancy:** Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Sharing / ownership:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Explicit exclusions:**

- Deprecated resultSelector, arbitrary ObservableInput conversion, invalid project results and unsafe index overflow.
- Reentrant source/projection/observer/finalizer calls, cancellation inside notification delivery, throwing observers or finalizers.
- No producer-abort guarantee: unsubscribe stops this subscription; external work stops only if its teardown implements cancellation.
- Synchronous inner notification behavior is characterized separately; post-setup cleanup order is not asserted for every synchronous producer.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
