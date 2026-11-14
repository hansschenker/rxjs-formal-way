# retry: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Retry failed source subscriptions up to a bounded additional-attempt budget.  
**Cω shape:** `retry(count,resetOnSuccess) : Cω(count,reset) -> T* -> T*`  
**Profiles represented:** `retry`

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
| 1 | Operator Overview | [retry behavior](./retry.md) | What does this operator do? |
| 2 | State Diagram | [retry diagram](../generated/retry.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [retry STT](../generated/retry.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [retry BDD](../generated/retry.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [retry trace](../generated/retry.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [retry obligations](../generated/retry.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [retry manifest](../generated/retry.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session17-restart.ts](../src/models/session17-restart.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [retry.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/retry.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session17-model.test.mjs](../tests/session17-model.test.mjs)<br>[tests/session17-rxjs.test.mjs](../tests/session17-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-17.md](../evidence/SESSION-17.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Finite safe-integer bound in 0..8. Both resetOnSuccess=false/true are modeled.

**Callbacks:** No notifier callback or delay selector in this profile.

**Time:** Resubscription is immediate following source terminal delivery. Time of later notifications belongs to each new producer.

**Reentrancy:** Nonreentrant, post-setup notifications; only bounded finite runs.

**Sharing / ownership:** None: each result subscription independently executes and restarts source.

**Explicit exclusions:**

- Unbounded (Infinity), fractional/negative counts, numeric or notifier-function delays and scheduler-driven resubscription.
- Synchronous terminal notifications during subscription setup, reentrant observers and teardown exceptions.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
