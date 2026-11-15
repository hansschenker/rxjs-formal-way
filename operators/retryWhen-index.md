# retryWhen: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Use source errors as control signals for one persistent notifier that governs fresh source subscriptions.  
**Cω shape:** `retryWhen(errors$ → notifier$) : Cω(Signal) → T* → T*`  
**Profiles represented:** `retryWhen`

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
| 1 | Operator Overview | [retryWhen behavior](./retryWhen.md) | What does this operator do? |
| 2 | State Diagram | [retryWhen diagram](../generated/retryWhen.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [retryWhen STT](../generated/retryWhen.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [retryWhen BDD](../generated/retryWhen.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [retryWhen trace](../generated/retryWhen.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [retryWhen obligations](../generated/retryWhen.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [retryWhen manifest](../generated/retryWhen.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session18-retryWhen.ts](../src/models/session18-retryWhen.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [retryWhen.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/retryWhen.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session18-model.test.mjs](../tests/session18-model.test.mjs)<br>[tests/session18-rxjs.test.mjs](../tests/session18-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-18.md](../evidence/SESSION-18.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One persistent notifier Observable constructed once at the first source error; no delay selector.

**Callbacks:** Notifier selector is modeled by a successful externally supplied Observable; selector throws and invalid inputs excluded.

**Time:** Retry only when notifier next arrives; no clock belongs to this operator.

**Reentrancy:** Post-setup source notifications; notifier next admitted only while waiting after a source error.

**Sharing / ownership:** Internal errors Subject is shared with exactly one notifier subscription per result execution.

**Explicit exclusions:**

- Synchronous notifier next during original subscription or errorsSubject.next and the special syncResub recursion.
- Notifier next while a retried source is still active, which can cause overlapping subscriptions.
- Promises/async iterable notifier conversions, callback throws, teardown throws and reentrant observers.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
