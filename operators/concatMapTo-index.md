# concatMapTo: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Queue each outer value; repeatedly connect the SAME configured inner Observable one at a time.  
**Cω shape:** `concatMapTo : T* × U* → U*`  
**Profiles represented:** `concatMapTo`

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
| 1 | Operator Overview | [concatMapTo behavior](./concatMapTo.md) | What does this operator do? |
| 2 | State Diagram | [concatMapTo diagram](../generated/concatMapTo.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [concatMapTo STT](../generated/concatMapTo.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [concatMapTo BDD](../generated/concatMapTo.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [concatMapTo trace](../generated/concatMapTo.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [concatMapTo obligations](../generated/concatMapTo.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [concatMapTo manifest](../generated/concatMapTo.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/concatMapTo.ts](../src/models/concatMapTo.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [concatMapTo.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/concatMapTo.ts)<br>[concatMap.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/concatMap.ts)<br>[mergeInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeInternals.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session09-model.test.mjs](../tests/session09-model.test.mjs)<br>[tests/session09-rxjs.test.mjs](../tests/session09-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-09.md](../evidence/SESSION-09.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One bound valid Observable, reused as the constant inner source; no resultSelector overload.

**Callbacks:** No user projection. callback.return is a pure, immediate constant-source binding microstep required by the existing guarded flattening runner; only the exact constant token is admissible.

**Time:** All input and inner notifications are externally ordered; no timers or schedulers are introduced.

**Reentrancy:** Non-reentrant post-setup notifications, callback binding resolved synchronously before the next external event.

**Sharing / ownership:** No sharing is created. Multiple subscriptions may connect to one and the same externally supplied Observable object; the producer may independently be hot.

**Explicit exclusions:**

- Deprecated resultSelector overload, Promise/Iterable conversion, invalid inner source, synchronous reentrant inner delivery during subscription.
- Observer/finalizer throws and cancellation inside a notification or resource acquisition.
- No guarantee that unsubscribing cancels external work lacking actual Observable teardown.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
