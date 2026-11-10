# find: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Emit the first source value whose indexed predicate is truthy; emit undefined if the source completes without a match.  
**Cω shape:** `find : (T! x Index! -> Boolean!) -> T* -> T?`  
**Profiles represented:** `find`

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
| 1 | Operator Overview | [find behavior](./find.md) | What does this operator do? |
| 2 | State Diagram | [find diagram](../generated/find.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [find STT](../generated/find.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [find BDD](../generated/find.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [find trace](../generated/find.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [find obligations](../generated/find.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [find manifest](../generated/find.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session12.ts](../src/models/session12.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [find.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/find.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session12-model.test.mjs](../tests/session12-model.test.mjs)<br>[tests/session12-rxjs.test.mjs](../tests/session12-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-12.md](../evidence/SESSION-12.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Required predicate; deprecated thisArg and BooleanConstructor specialization excluded from the canonical profile.

**Callbacks:** One correlated predicate(value,index,source) outcome per tested value; source object identity is runtime-tested separately.

**Time:** No timer; source order determines predicate index and first-match selection.

**Reentrancy:** One pending predicate outcome at a time; source events during Calling are outside the non-reentrant profile.

**Sharing / ownership:** No sharing is introduced; each result subscription owns independent state and resources.

**Explicit exclusions:**

- Deprecated thisArg overload, arbitrary predicate reentry, observer/finalizer exceptions.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
