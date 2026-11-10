# combineLatest: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Combine source-first latest snapshots after every input has emitted a first value.  
**Cω shape:** `combineLatest : T0* × ... × Tn* → (T0 × ... × Tn)*`  
**Profiles represented:** `combineLatest`

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
| 1 | Operator Overview | [combineLatest behavior](./combineLatest.md) | What does this operator do? |
| 2 | State Diagram | [combineLatest diagram](../generated/combineLatest.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [combineLatest STT](../generated/combineLatest.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [combineLatest BDD](../generated/combineLatest.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [combineLatest trace](../generated/combineLatest.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [combineLatest obligations](../generated/combineLatest.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [combineLatest manifest](../generated/combineLatest.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session09-joins.ts](../src/models/session09-joins.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [combineLatest.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/combineLatest.ts)<br>[combineLatest.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/combineLatest.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session09-model.test.mjs](../tests/session09-model.test.mjs)<br>[tests/session09-rxjs.test.mjs](../tests/session09-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-09.md](../evidence/SESSION-09.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One piped source and 1 supplied Observable inputs; 0–32 others. Deprecated operator export. No projector or scheduler overload.

**Callbacks:** No user callbacks; no result selector projection. Observable values preserve reference identity.

**Time:** Inputs supply all notification ordering; no clock, scheduler or delay is created by this profile.

**Reentrancy:** All input subscriptions established atomically before external notifications. Synchronous producer emissions during setup are excluded.

**Sharing / ownership:** No multicasting, sharing or replay. Each result subscription owns independent latest slots or serial position.

**Explicit exclusions:**

- Promise/iterable ObservableInput conversion, synchronous or reentrant notifications during subscription acquisition.
- Deprecated result selector for combineLatest and deprecated scheduler overload for concat.
- Callbacks throwing during observer delivery, synchronous finalizer reentrancy, cancellation during next handling.
- Finite scenarios are evidence, not universal equivalence. Input count beyond 32 is not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
