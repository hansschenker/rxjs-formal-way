# switchAll: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Only latest: replace the previous inner source subscription with the newest.  
**Cω shape:** `switchAll : (T*)* -> T*`  
**Profiles represented:** `switchAll`

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
| 1 | Operator Overview | [switchAll behavior](./switchAll.md) | What does this operator do? |
| 2 | State Diagram | [switchAll diagram](../generated/switchAll.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [switchAll STT](../generated/switchAll.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [switchAll BDD](../generated/switchAll.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [switchAll trace](../generated/switchAll.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [switchAll obligations](../generated/switchAll.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [switchAll manifest](../generated/switchAll.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/all.ts](../src/models/all.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [switchAll.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/switchAll.ts)<br>[switchMap.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/switchMap.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session3-all-model.test.mjs](../tests/session3-all-model.test.mjs)<br>[tests/session3-all-rxjs.test.mjs](../tests/session3-all-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-03.md](../evidence/SESSION-03.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Observable-valued outer source; no user projection

**Callbacks:** No user callback. A deterministic identity microstep maps an admitted outer source token to itself without time advancement or throwing.

**Time:** No clock or scheduler is created. Outer and inner sources supply time; same-time delivery order is explicit in the input sequence.

**Reentrancy:** Non-reentrant reactions with synchronous projection outcomes. Exact teardown traces assume source initialization has returned before terminal events.

**Sharing / ownership:** No sharing or replay introduced. Each result subscription owns its counter, active-inner bindings and queue; an inner producer may itself be shared.

**Explicit exclusions:**

- The identity microstep is a modeling refinement of the implementation, not an actual callback or a scheduling boundary.
- Arbitrary ObservableInput conversion, reentrant source/observer/finalizer behavior and synchronous nested teardown equivalence are outside the exact-trace profile.
- Invalid concurrency, throwing observers, and producer-abort guarantees are out of scope.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
