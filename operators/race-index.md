# race: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Race source and other Observables, cancel losing sources on the first next; early error/complete terminates.  
**Cω shape:** `race : (T0*, T1*, ..., Tn*) -> (T0 | ... | Tn)*`  
**Profiles represented:** `race`

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
| 1 | Operator Overview | [race behavior](./race.md) | What does this operator do? |
| 2 | State Diagram | [race diagram](../generated/race.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [race STT](../generated/race.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [race BDD](../generated/race.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [race trace](../generated/race.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [race obligations](../generated/race.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [race manifest](../generated/race.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session17-race.ts](../src/models/session17-race.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [race.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/race.ts)<br>[raceWith.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/raceWith.ts)<br>[race.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/race.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session17-model.test.mjs](../tests/session17-model.test.mjs)<br>[tests/session17-rxjs.test.mjs](../tests/session17-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-17.md](../evidence/SESSION-17.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** 0..32 additional ordinary Observable inputs; race legacy array/variadic overloads normalized to same candidate order.

**Callbacks:** No user callbacks or result selectors; opaque input values preserve identity.

**Time:** Notifications are ordered by source/scheduler arrival. Race itself creates no timers or scheduler.

**Reentrancy:** Atomic non-reentrant post-setup notifications; every input subscribed in source-first argument order before delivery.

**Sharing / ownership:** No sharing; each downstream subscription creates a new race across inputs.

**Explicit exclusions:**

- Synchronous emission/completion/error during subscription acquisition, which may prevent later candidate subscriptions.
- Promises/iterables, errors during input conversion, observer reentrancy, throwing teardown and scheduler-specific interleavings.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
