# share: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Share one live source connection among subscribers using a Subject and explicit boolean reset policies.  
**Cω shape:** `share : T* -> Shared(T*)`  
**Profiles represented:** `share`

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
| 1 | Operator Overview | [share behavior](./share.md) | What does this operator do? |
| 2 | State Diagram | [share diagram](../generated/share.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [share STT](../generated/share.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [share BDD](../generated/share.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [share trace](../generated/share.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [share obligations](../generated/share.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [share manifest](../generated/share.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/share.ts](../src/models/share.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [share.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/share.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session2-share-model.test.mjs](../tests/session2-share-model.test.mjs)<br>[tests/session2-share-rxjs.test.mjs](../tests/session2-share-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-02.md](../evidence/SESSION-02.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Subject connector with boolean resetOnError=true, resetOnComplete=true, resetOnRefCountZero=true

**Callbacks:** No custom connector or reset-notifier functions. Observer/source/finalizer activity is non-reentrant and nonthrowing.

**Time:** No timer or clock is introduced. Ordered source and subscriber events determine membership at each delivery.

**Reentrancy:** Atomic post-setup reactions. Each subscriber ID denotes one subscription occurrence and must not be reused.

**Sharing / ownership:** One machine per shared Observable instance, not per subscriber. Each reset creates a fresh connection generation.

**Explicit exclusions:**

- Custom SubjectLike connectors, replay and notifier-driven delayed resets.
- Reentrant joins/leaves during notification, source setup or teardown; throwing observers/finalizers.
- Physical producer abortion, lossless snapshots and a production shared-effect interpreter.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
