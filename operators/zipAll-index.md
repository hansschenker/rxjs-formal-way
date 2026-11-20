# zipAll: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Collect inner descriptions until outer completion, then pair each inner's kth value with FIFO memory.  
**Cω shape:** `zipAll : (T*)* → [T]*`  
**Profiles represented:** `zipAll`, `zipAll-empty`, `zipAll-cancel`

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
| 1 | Operator Overview | [zipAll behavior](./zipAll.md)<br>[zipAll-empty behavior](./zipAll-empty.md)<br>[zipAll-cancel behavior](./zipAll-cancel.md) | What does this operator do? |
| 2 | State Diagram | [zipAll diagram](../generated/zipAll.diagram.md)<br>[zipAll-empty diagram](../generated/zipAll-empty.diagram.md)<br>[zipAll-cancel diagram](../generated/zipAll-cancel.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [zipAll STT](../generated/zipAll.stt.md)<br>[zipAll-empty STT](../generated/zipAll-empty.stt.md)<br>[zipAll-cancel STT](../generated/zipAll-cancel.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [zipAll Rule BDD](../generated/zipAll.bdd.md)<br>[zipAll-empty Rule BDD](../generated/zipAll-empty.bdd.md)<br>[zipAll-cancel Rule BDD](../generated/zipAll-cancel.bdd.md)<br>[Scenario BDD](../docs/SESSION-23-ZIP-ALL.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [zipAll trace](../generated/zipAll.trace.md)<br>[zipAll-empty trace](../generated/zipAll-empty.trace.md)<br>[zipAll-cancel trace](../generated/zipAll-cancel.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [zipAll obligations](../generated/zipAll.obligations.md)<br>[zipAll-empty obligations](../generated/zipAll-empty.obligations.md)<br>[zipAll-cancel obligations](../generated/zipAll-cancel.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [zipAll manifest](../generated/zipAll.manifest.json)<br>[zipAll-empty manifest](../generated/zipAll-empty.manifest.json)<br>[zipAll-cancel manifest](../generated/zipAll-cancel.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session23-zipAll.ts](../src/models/session23-zipAll.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [zipAll.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/zipAll.ts)<br>[zipAll-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/zipAll-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[joinAllInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/joinAllInternals.ts)<br>[zip.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/zip.ts)<br>[toArray.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/toArray.ts)<br>[mergeInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeInternals.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session23-zipAll-model.test.mjs](../tests/session23-zipAll-model.test.mjs)<br>[tests/session23-zipAll-rxjs.test.mjs](../tests/session23-zipAll-rxjs.test.mjs)<br>[tests/session23-zipAll-differential.test.mjs](../tests/session23-zipAll-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-23-ZIP-ALL.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-23.md](../evidence/SESSION-23.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Tuple-output profile; 0..8 valid Observable occurrences; at most 8 unmatched queued values per input. Constructor bounds maxInners 0..16 and bufferLimit 1..16 are model scope, not RxJS capacities.

**Callbacks:** No projector in the canonical profile. Values and source tokens are opaque references; no user function runs in guards or transitions.

**Time:** No clock, scheduler or timer is introduced. Outer/inner sources supply notification times; equal-time inputs retain explicit arrival order.

**Reentrancy:** Post-setup non-reentrant notifications. Outer and inner subscription setup return without notifying or advancing time; cancellation occurs between reactions.

**Sharing / ownership:** No implicit sharing or replay. Each result connection owns collection and FIFO state; repeated descriptions create separate input subscriptions even when they refer to one shared producer.

**Explicit exclusions:**

- Optional projector return/throw and synchronous outer or inner setup are separately native-characterized, outside this canonical alphabet.
- Non-Observable inputs and arbitrary ObservableInput conversions.
- Histories exceeding source/FIFO bounds, unsafe counters, arbitrary reentrancy, producer-token mutation and cancellation during a notification.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
