# groupBy: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Publish a grouped Observable once per new key; route each subsequent input to its keyed Subject; preserve upstream while an emitted child remains subscribed.  
**Cω shape:** `groupBy(key:T!→K!) : T* -> GroupedObservable<K,T>*; each group: T*`  
**Profiles represented:** `groupBy`

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
| 1 | Operator Overview | [groupBy behavior](./groupBy.md) | What does this operator do? |
| 2 | State Diagram | [groupBy diagram](../generated/groupBy.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [groupBy STT](../generated/groupBy.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [groupBy BDD](../generated/groupBy.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [groupBy trace](../generated/groupBy.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [groupBy obligations](../generated/groupBy.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [groupBy manifest](../generated/groupBy.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session13-groupBy.ts](../src/models/session13-groupBy.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [groupBy.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/groupBy.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session13-model.test.mjs](../tests/session13-model.test.mjs)<br>[tests/session13-rxjs.test.mjs](../tests/session13-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-13.md](../evidence/SESSION-13.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** key selector only; identity elements, default Subject connector, no group duration; keys use JS Map SameValueZero.

**Callbacks:** One synchronous key selector outcome per source value, supplied externally; pure model never executes application logic.

**Time:** No timer/scheduler. Keys are assigned in source arrival order. A new group is announced before its first Subject.next.

**Reentrancy:** Atomic non-reentrant key callback; grouped subscribers can attach between modeled source notifications. At most one active subscriber per group.

**Sharing / ownership:** The original source is shared between grouped Subject consumers by this operator instance; output groups themselves are live multicast Subjects.

**Explicit exclusions:**

- Optional element, duration and custom connector profiles, including duration-driven group closure and reuse.
- Multiple simultaneous subscribers per group; subscription inside the very same source-next action word is represented by ordered effects, not a nested model microstep.
- User callback/observer reentrancy, throwing group subscribers and group subscriptions after terminal teardown.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
