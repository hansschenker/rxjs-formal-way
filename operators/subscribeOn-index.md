# subscribeOn: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Defer subscription to the producer using a scheduled action; preserve source notification ordering and cancellation.  
**Cω shape:** `subscribeOn(scheduler,delay) : Cω(Scheduler,Duration) × T* → T*`  
**Profiles represented:** `subscribeOn`

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
| 1 | Operator Overview | [subscribeOn behavior](./subscribeOn.md) | What does this operator do? |
| 2 | State Diagram | [subscribeOn diagram](../generated/subscribeOn.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [subscribeOn STT](../generated/subscribeOn.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [subscribeOn BDD](../generated/subscribeOn.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [subscribeOn trace](../generated/subscribeOn.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [subscribeOn obligations](../generated/subscribeOn.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [subscribeOn manifest](../generated/subscribeOn.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session19.ts](../src/models/session19.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [subscribeOn.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/subscribeOn.ts)<br>[lift.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/lift.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session19-model.test.mjs](../tests/session19-model.test.mjs)<br>[tests/session19-rxjs.test.mjs](../tests/session19-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-19.md](../evidence/SESSION-19.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One FIFO virtual scheduler with a safe integer 0..8 delay, including deferred delay=0.

**Callbacks:** The scheduler executes a source-subscription thunk; no user projection callback.

**Time:** Scheduler determines connection time. Source itself determines notification times after connection.

**Reentrancy:** Deferred scheduler action (TestScheduler-like) and non-reentrant subsequent source delivery.

**Sharing / ownership:** No sharing; each downstream subscription independently schedules its own source acquisition.

**Explicit exclusions:**

- queueScheduler synchronous zero-delay execution, arbitrary scheduler implementations/throws.
- Actual wall-clock drift, source delivery during the atomic scheduling reaction, reentrant observers.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
