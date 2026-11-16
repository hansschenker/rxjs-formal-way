# skipLast: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Retain a bounded trailing suffix while immediately forwarding any value forced out by newer arrivals.  
**Cω shape:** `skipLast(n) : Cω(Count) × T* → T*`  
**Profiles represented:** `skipLast`

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
| 1 | Operator Overview | [skipLast behavior](./skipLast.md) | What does this operator do? |
| 2 | State Diagram | [skipLast diagram](../generated/skipLast.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [skipLast STT](../generated/skipLast.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [skipLast BDD](../generated/skipLast.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [skipLast trace](../generated/skipLast.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [skipLast obligations](../generated/skipLast.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [skipLast manifest](../generated/skipLast.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session19.ts](../src/models/session19.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [skipLast.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/skipLast.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session19-model.test.mjs](../tests/session19-model.test.mjs)<br>[tests/session19-rxjs.test.mjs](../tests/session19-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-19.md](../evidence/SESSION-19.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Finite nonnegative safe integer count in 0..8; zero represents the identity fast path.

**Callbacks:** No selector or user callback; FIFO logic only.

**Time:** Emission occurs on the n-th later source next; no timer is created.

**Reentrancy:** State replacement precedes notification; nested source emissions are outside this bounded model.

**Sharing / ownership:** No Subject or sharing. Each result subscription owns its FIFO and source subscription.

**Explicit exclusions:**

- Negative, fractional, infinite and huge allocation counts; arbitrary reentrant sources or observers.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
