# bufferTime: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Accumulate source values in time-bounded windows, possibly overlapping, and emit each window on its timer or size threshold.  
**Cω shape:** `bufferTime(span,creation?,max?) : T* -> (T*)*`  
**Profiles represented:** `bufferTime`, `bufferTime-overlap`

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
| 1 | Operator Overview | [bufferTime behavior](./bufferTime.md)<br>[bufferTime-overlap behavior](./bufferTime-overlap.md) | What does this operator do? |
| 2 | State Diagram | [bufferTime diagram](../generated/bufferTime.diagram.md)<br>[bufferTime-overlap diagram](../generated/bufferTime-overlap.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [bufferTime STT](../generated/bufferTime.stt.md)<br>[bufferTime-overlap STT](../generated/bufferTime-overlap.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [bufferTime BDD](../generated/bufferTime.bdd.md)<br>[bufferTime-overlap BDD](../generated/bufferTime-overlap.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [bufferTime trace](../generated/bufferTime.trace.md)<br>[bufferTime-overlap trace](../generated/bufferTime-overlap.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [bufferTime obligations](../generated/bufferTime.obligations.md)<br>[bufferTime-overlap obligations](../generated/bufferTime-overlap.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [bufferTime manifest](../generated/bufferTime.manifest.json)<br>[bufferTime-overlap manifest](../generated/bufferTime-overlap.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/bufferTime.ts](../src/models/bufferTime.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [bufferTime.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/bufferTime.ts)<br>[executeSchedule.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/executeSchedule.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session07-buffer-model.test.mjs](../tests/session07-buffer-model.test.mjs)<br>[tests/session07-buffer-rxjs.test.mjs](../tests/session07-buffer-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-07.md](../evidence/SESSION-07.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Positive safe-integer span, optional positive safe-integer creation interval, optional positive safe-integer max size; bounded virtual clock/timer generations

**Callbacks:** No user callback. Emitted arrays contain retained source references in arrival order.

**Time:** External monotone safe-integer clock. Timer fires are explicit events, never inferred from a deadline; due firings are allowed late but not early. Equal-time order is explicit.

**Reentrancy:** Deferred, non-reentrant scheduler and nonthrowing observers. Source notifications and timer firings are atomic, ordered by event sequence.

**Sharing / ownership:** No sharing. Each result subscription owns independent scheduled windows and accumulation arrays.

**Explicit exclusions:**

- Negative/NaN/fractional/unsafe spans, zero span or zero creation interval, custom inline schedulers, arbitrary scheduler jitter guarantees.
- Reentrant observer/source events during a timer callback or buffer emission, throwing finalizers and cancellation inside delivery.
- Exact JS SchedulerAction identities, operator internals of Date.now and universal state-space equivalence.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
