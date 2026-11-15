# sequenceEqual: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Compare two Observable value sequences in arrival-independent FIFO order with strict default equality.  
**Cω shape:** `sequenceEqual(compareTo, ===) : Cω(Comparison) → T* → Bool?`  
**Profiles represented:** `sequenceEqual`

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
| 1 | Operator Overview | [sequenceEqual behavior](./sequenceEqual.md) | What does this operator do? |
| 2 | State Diagram | [sequenceEqual diagram](../generated/sequenceEqual.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [sequenceEqual STT](../generated/sequenceEqual.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [sequenceEqual BDD](../generated/sequenceEqual.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [sequenceEqual trace](../generated/sequenceEqual.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [sequenceEqual obligations](../generated/sequenceEqual.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [sequenceEqual manifest](../generated/sequenceEqual.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session18-sequenceEqual.ts](../src/models/session18-sequenceEqual.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [sequenceEqual.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/sequenceEqual.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[innerFrom.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/innerFrom.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session18-model.test.mjs](../tests/session18-model.test.mjs)<br>[tests/session18-rxjs.test.mjs](../tests/session18-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-18.md](../evidence/SESSION-18.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Two nonreentrant Observable sources and default strict === comparator, unmatched FIFO length up to 32.

**Callbacks:** Default comparator === computed purely. Custom user comparators and their throws require a separate callback-invocation model.

**Time:** No new time source: arrival order determines FIFO alignment, equal-time notifications use caller order.

**Reentrancy:** Source-first atomic setup and post-subscription external notifications only.

**Sharing / ownership:** None; every downstream subscription performs its own independent comparison.

**Explicit exclusions:**

- Custom comparator callbacks, errors thrown by comparators, and arbitrary ObservableInput conversion.
- Buffer overflow beyond the declared maximum, synchronous subscription-time source notifications and reentrant observers.
- Infinite traces do not establish liveness; nonterminating or silent sources may leave comparison unresolved.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
