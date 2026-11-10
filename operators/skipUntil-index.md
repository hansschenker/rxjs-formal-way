# skipUntil: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Drop source values until the first notifier value permanently opens the gate.  
**Cω shape:** `skipUntil : U* -> T* -> T*`  
**Profiles represented:** `skipUntil`

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
| 1 | Operator Overview | [skipUntil behavior](./skipUntil.md) | What does this operator do? |
| 2 | State Diagram | [skipUntil diagram](../generated/skipUntil.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [skipUntil STT](../generated/skipUntil.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [skipUntil BDD](../generated/skipUntil.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [skipUntil trace](../generated/skipUntil.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [skipUntil obligations](../generated/skipUntil.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [skipUntil manifest](../generated/skipUntil.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/until.ts](../src/models/until.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [skipUntil.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/skipUntil.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[Observable.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Observable.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session05-model.test.mjs](../tests/session05-model.test.mjs)<br>[tests/session05-rxjs.test.mjs](../tests/session05-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-05.md](../evidence/SESSION-05.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** A valid Observable notifier; one source and one notifier occurrence per result subscription

**Callbacks:** No user predicate. setup.ready is an environment continuation marking return from notifier subscription, not a user callback or scheduler turn.

**Time:** Source and notifier supply time and ordering. No timer is introduced. Setup and synchronous notifier delivery occur at the subscription timestamp; equal-time inputs retain sequence order.

**Reentrancy:** Non-reentrant post-setup notifications plus explicitly modeled synchronous notifier initialization. Arbitrary nested delivery and cancellation within setup remain excluded.

**Sharing / ownership:** No sharing introduced. Each result subscription owns its gate and source/notifier subscriptions; either producer may independently be hot or shared.

**Explicit exclusions:**

- Non-Observable ObservableInput conversion, throwing observers/finalizers, arbitrary reentry and producer-abort guarantees.
- Source synchronous delivery/finalizer-registration order is characterized separately from exact post-setup action traces.
- subscribe/unsubscribe actions describe subscription lifecycle; an already-closed source attempt is not a live source connection.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
