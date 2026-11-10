# skip: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Drop the first count source values, then forward later values unchanged.  
**Cω shape:** `skip : Count! -> T* -> T*`  
**Profiles represented:** `skip`

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
| 1 | Operator Overview | [skip behavior](./skip.md) | What does this operator do? |
| 2 | State Diagram | [skip diagram](../generated/skip.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [skip STT](../generated/skip.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [skip BDD](../generated/skip.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [skip trace](../generated/skip.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [skip obligations](../generated/skip.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [skip manifest](../generated/skip.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/gating.ts](../src/models/gating.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [skip.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/skip.ts)<br>[filter.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/filter.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session05-model.test.mjs](../tests/session05-model.test.mjs)<br>[tests/session05-rxjs.test.mjs](../tests/session05-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-05.md](../evidence/SESSION-05.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Nonnegative safe-integer count and source indices

**Callbacks:** No user callback. The pinned internal filter comparison is modeled directly as count <= index.

**Time:** No clock, timer or scheduler is created. Sources supply time; equal timestamps retain explicit delivery order. A predicate call/outcome is one synchronous logical reaction.

**Reentrancy:** Non-reentrant reactions, with cancellation between resolved value reactions. Exact source teardown traces use post-setup delivery; synchronous native checks are separate.

**Sharing / ownership:** No sharing is introduced. Each subscription owns its count or predicate gate even when the producer is hot.

**Explicit exclusions:**

- Arbitrary source/observer/predicate reentry, cancellation during a predicate call, and throwing observers/finalizers.
- Index overflow beyond nonnegative safe integers; invalid public callback arguments and compile-time narrowing proofs.
- Negative, fractional, NaN and infinite counts are outside this numeric profile.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
