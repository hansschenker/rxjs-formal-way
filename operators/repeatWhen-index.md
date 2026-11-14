# repeatWhen: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Repeat on source completion, controlled by a single persistent notifier and completion Subject.  
**Cω shape:** `repeatWhen(completions$ -> notifier$) : Cω(Signal) -> T* -> T*`  
**Profiles represented:** `repeatWhen`

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
| 1 | Operator Overview | [repeatWhen behavior](./repeatWhen.md) | What does this operator do? |
| 2 | State Diagram | [repeatWhen diagram](../generated/repeatWhen.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [repeatWhen STT](../generated/repeatWhen.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [repeatWhen BDD](../generated/repeatWhen.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [repeatWhen trace](../generated/repeatWhen.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [repeatWhen obligations](../generated/repeatWhen.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [repeatWhen manifest](../generated/repeatWhen.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session17-repeatWhen.ts](../src/models/session17-repeatWhen.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [repeatWhen.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/repeatWhen.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session17-model.test.mjs](../tests/session17-model.test.mjs)<br>[tests/session17-rxjs.test.mjs](../tests/session17-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-17.md](../evidence/SESSION-17.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One notifier function returning a non-synchronously-emitting Observable; selector called exactly once after first source completion.

**Callbacks:** Notifier selector is represented by its successful Observable result; callback throws/invalid inputs are excluded.

**Time:** Source notifications and notifier next/complete/error carry their own times; no new clock is introduced.

**Reentrancy:** Atomic post-subscription notifications; notifier next is only admitted while waiting after a source completion.

**Sharing / ownership:** The completion Subject is internal to one result subscription; it is not multicast among downstream subscribers.

**Explicit exclusions:**

- Synchronous notifier next or complete during its original subscription, source subscription setup recursion and syncResub flag mechanics.
- Notifier next while a source is already active (can start overlapping source executions), Promise inputs and arbitrary reentrancy.
- Notifier selector throws, teardown throws and notifier emissions following terminal notification.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
