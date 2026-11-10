# distinct: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Forward values whose selected key is not in the Set of ANY previously forwarded keys since the last flush.  
**Cω shape:** `distinct : T* x Flush*? -> T*`  
**Profiles represented:** `distinct`

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
| 1 | Operator Overview | [distinct behavior](./distinct.md) | What does this operator do? |
| 2 | State Diagram | [distinct diagram](../generated/distinct.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [distinct STT](../generated/distinct.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [distinct BDD](../generated/distinct.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [distinct trace](../generated/distinct.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [distinct obligations](../generated/distinct.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [distinct manifest](../generated/distinct.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/distinct.ts](../src/models/distinct.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [distinct.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/distinct.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[innerFrom.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/innerFrom.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session4-model.test.mjs](../tests/session4-model.test.mjs)<br>[tests/session4-rxjs.test.mjs](../tests/session4-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-04.md](../evidence/SESSION-04.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** selected=false, withFlushes=true. Full Set for finite trace prefixes.

**Callbacks:** An optional keySelector is modeled by an external correlated key.return/key.throw; no user callback runs in guards. Without it, key is the original value and membership is checked directly.

**Time:** No scheduling or clock. Flush and source timestamps/order come from external deliveries; equal-time tie order is explicit.

**Reentrancy:** Non-reentrant source, notifier and observers; post-setup notifier subscription after source subscription.

**Sharing / ownership:** No sharing introduced; each subscription owns its own Set and notifier subscription.

**Explicit exclusions:**

- Arbitrary nested deliveries, source completion during synchronous notifier wiring, and throwing observers/finalizers.
- Unbounded keys for infinite sources, safe-integer overflow, generalized ObservableInput flush conversions, and production effect interpretation.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
