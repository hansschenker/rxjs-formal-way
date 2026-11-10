# catchError: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Forward source values; on the first source error, invoke a selector and subscribe to its replacement stream.  
**Cω shape:** `catchError : T* × (E -> R*) -> (T|R)*`  
**Profiles represented:** `catchError`

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
| 1 | Operator Overview | [catchError behavior](./catchError.md) | What does this operator do? |
| 2 | State Diagram | [catchError diagram](../generated/catchError.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [catchError STT](../generated/catchError.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [catchError BDD](../generated/catchError.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [catchError trace](../generated/catchError.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [catchError obligations](../generated/catchError.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [catchError manifest](../generated/catchError.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/catchError.ts](../src/models/catchError.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [catchError.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/catchError.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session08-model.test.mjs](../tests/session08-model.test.mjs)<br>[tests/session08-rxjs.test.mjs](../tests/session08-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-08.md](../evidence/SESSION-08.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One source and one Observable replacement, without recursive caught resubscription.

**Callbacks:** The selector receives the exact error and a caught Observable. The model requests a correlated callback invocation and receives a resolved return/throw event; it does not execute user code.

**Time:** No new timing policy. The replacement Observable determines emission times; synchronous source errors require original-source teardown before replacement connection.

**Reentrancy:** Model resolution of synchronous selector call is atomic; no arbitrary recursion/reentrant downstream/finalizer behavior.

**Sharing / ownership:** No sharing; each output subscription owns its original and possible replacement source subscriptions.

**Explicit exclusions:**

- Selectors returning Promise or arbitrary ObservableInput conversion; returning caught recursively; synchronous reentrant producer or observer behavior.
- Selector cancellation in the middle of execution and observer/finalizer throws.
- A universal retry/resubscription model, which must be specified separately.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
