# auditTime: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Start a fixed-duration silence window on the first value and emit its latest value when the scheduled duration ends.  
**Cω shape:** `auditTime(d) : T* -> T*`  
**Profiles represented:** `auditTime`

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
| 1 | Operator Overview | [auditTime behavior](./auditTime.md) | What does this operator do? |
| 2 | State Diagram | [auditTime diagram](../generated/auditTime.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [auditTime STT](../generated/auditTime.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [auditTime BDD](../generated/auditTime.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [auditTime trace](../generated/auditTime.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [auditTime obligations](../generated/auditTime.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [auditTime manifest](../generated/auditTime.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/audit.ts](../src/models/audit.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [audit.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/audit.ts)<br>[auditTime.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/auditTime.ts)<br>[timer.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/timer.ts)<br>[executeSchedule.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/executeSchedule.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session07-audit-model.test.mjs](../tests/session07-audit-model.test.mjs)<br>[tests/session07-audit-rxjs.test.mjs](../tests/session07-audit-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-07.md](../evidence/SESSION-07.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Positive safe-integer duration and deferred scheduler, one scheduled task per active window

**Callbacks:** No user callback. Timer output is modeled as timer.fire.

**Time:** Externally supplied monotone safe-integer clock; duration signals or scheduler firings determine output time. No deadline alone emits a value.

**Reentrancy:** Atomic non-reentrant source, callback, observer and duration notifications after initialization. Equal timestamps are ordered by trace sequence.

**Sharing / ownership:** No sharing or replay introduced. Each result subscription owns its latest value and duration identity.

**Explicit exclusions:**

- Inline/synchronous custom schedulers, negative/NaN/unsafe durations, non-deferred zero delay, scheduler drift guarantees.
- Nested source/duration emissions, cancellation inside callbacks/output delivery and throwing observers/finalizers.
- Universal behavioral equivalence, callback purity, and arbitrary external mutation of retained object references.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
