# finalize: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Mirror the source exactly and invoke a zero-argument teardown callback once on complete, error, or explicit unsubscribe.  
**Cω shape:** `finalize : (() -> Unit) -> T* -> T*`  
**Profiles represented:** `finalize`

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
| 1 | Operator Overview | [finalize behavior](./finalize.md) | What does this operator do? |
| 2 | State Diagram | [finalize diagram](../generated/finalize.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [finalize STT](../generated/finalize.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [finalize BDD](../generated/finalize.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [finalize trace](../generated/finalize.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [finalize obligations](../generated/finalize.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [finalize manifest](../generated/finalize.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session12.ts](../src/models/session12.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [finalize.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/finalize.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session12-model.test.mjs](../tests/session12-model.test.mjs)<br>[tests/session12-rxjs.test.mjs](../tests/session12-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-12.md](../evidence/SESSION-12.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One zero-argument callback; no other options.

**Callbacks:** The finalizer is represented as an invoke-callback action with no meaningful input value; callback return is not a stream event.

**Time:** No scheduler or timer. Finalization is part of subscription teardown ordering.

**Reentrancy:** The pure model treats finalizer invocation as an atomic teardown action and excludes callback reentry/throws.

**Sharing / ownership:** No sharing is introduced; each result subscription owns independent state and resources.

**Explicit exclusions:**

- Throwing finalizer behavior, nested unsubscription from observer handlers, deprecated synchronous error handling details.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
