# debounceTime: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Keep the latest pending value and emit it after silence, or flush it on source completion.  
**Cω shape:** `debounceTime(d) : T* -> T*`  
**Profiles represented:** `debounceTime`

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
| 1 | Operator Overview | [debounceTime behavior](./debounceTime.md) | What does this operator do? |
| 2 | State Diagram | [debounceTime diagram](../generated/debounceTime.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [debounceTime STT](../generated/debounceTime.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [debounceTime BDD](../generated/debounceTime.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [debounceTime trace](../generated/debounceTime.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [debounceTime obligations](../generated/debounceTime.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [debounceTime manifest](../generated/debounceTime.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/debounceTime.ts](../src/models/debounceTime.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [debounceTime.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/debounceTime.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts)<br>[VirtualTimeScheduler.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/scheduler/VirtualTimeScheduler.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/m02c-model.test.mjs](../tests/m02c-model.test.mjs)<br>[tests/m02c-rxjs.test.mjs](../tests/m02c-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/M02-C.md](../evidence/M02-C.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Nonnegative safe-integer dueTime; all clock readings, deadlines and generations remain in the safe-integer domain

**Callbacks:** No user callback. Source and observer delivery and teardown are non-reentrant and nonthrowing.

**Time:** One externally supplied monotone clock. Scheduling is deferred, even for delay zero. A deadline is not a delivery guarantee; explicit timer.fire events cause work.

**Reentrancy:** Atomic external reactions after source subscription setup; equal-time order is supplied explicitly, not inferred from timestamps.

**Sharing / ownership:** No sharing introduced. Pending values, deadlines and timer identities belong to each result subscription.

**Explicit exclusions:**

- Inline zero-delay schedulers such as queueScheduler, clock rollback, fractional/negative/nonfinite durations and unsafe arithmetic.
- Reentrant source/observer/finalizer activity and cancellation inside downstream delivery.
- Exact host timer IDs, wall-clock latency bounds, arbitrary SchedulerLike behavior and synchronous setup finalizer ordering.
- A production timer interpreter or universal equivalence proof.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
