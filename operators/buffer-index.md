# buffer: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Collect source values, emitting and resetting the array on each closing-notifier value and flushing once on source completion.  
**Cω shape:** `buffer : U* -> T* -> (T*)*`  
**Profiles represented:** `buffer`

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
| 1 | Operator Overview | [buffer behavior](./buffer.md) | What does this operator do? |
| 2 | State Diagram | [buffer diagram](../generated/buffer.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [buffer STT](../generated/buffer.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [buffer BDD](../generated/buffer.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [buffer trace](../generated/buffer.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [buffer obligations](../generated/buffer.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [buffer manifest](../generated/buffer.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/buffering.ts](../src/models/buffering.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [buffer.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/buffer.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session07-buffer-model.test.mjs](../tests/session07-buffer-model.test.mjs)<br>[tests/session07-buffer-rxjs.test.mjs](../tests/session07-buffer-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-07.md](../evidence/SESSION-07.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** One valid Observable closing notifier; source and notifier remain non-reentrant

**Callbacks:** No user callback. Source values retain reference identity inside emitted arrays; emitted arrays are fresh snapshots.

**Time:** No timer or scheduler introduced. Source/notifier order is supplied by input sequence, including equal timestamps.

**Reentrancy:** Post-setup, atomic non-reentrant notifications; setup-time synchronous delivery, observer throw and cancellation during delivery are excluded.

**Sharing / ownership:** No sharing or replay introduced. Every result subscription has its own buffers and counters.

**Explicit exclusions:**

- Invalid/zero/negative/fractional bufferCount arguments, count overflow and arbitrary producer reentrancy.
- Synchronous notifier/source delivery during subscription setup, throwing observers/finalizers and cancellation during output delivery.
- ObservableInput conversion outside Observable notifiers, universal symbolic equivalence and arbitrary mutation of output arrays by observers.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
