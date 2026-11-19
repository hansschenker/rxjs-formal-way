# windowCount: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Rotate count-limited live multicast windows with overlapping, contiguous and gapped source-index policies.  
**Cω shape:** `windowCount : (windowSize:Count,startEvery:Count) → T* → Observable<T>*`  
**Profiles represented:** `windowCount`, `windowCount-gap`, `windowCount-cancel`

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
| 1 | Operator Overview | [windowCount behavior](./windowCount.md)<br>[windowCount-gap behavior](./windowCount-gap.md)<br>[windowCount-cancel behavior](./windowCount-cancel.md) | What does this operator do? |
| 2 | State Diagram | [windowCount diagram](../generated/windowCount.diagram.md)<br>[windowCount-gap diagram](../generated/windowCount-gap.diagram.md)<br>[windowCount-cancel diagram](../generated/windowCount-cancel.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [windowCount STT](../generated/windowCount.stt.md)<br>[windowCount-gap STT](../generated/windowCount-gap.stt.md)<br>[windowCount-cancel STT](../generated/windowCount-cancel.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [windowCount Rule BDD](../generated/windowCount.bdd.md)<br>[windowCount-gap Rule BDD](../generated/windowCount-gap.bdd.md)<br>[windowCount-cancel Rule BDD](../generated/windowCount-cancel.bdd.md)<br>[Scenario BDD](../docs/SESSION-22-COUNT-WINDOWS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [windowCount trace](../generated/windowCount.trace.md)<br>[windowCount-gap trace](../generated/windowCount-gap.trace.md)<br>[windowCount-cancel trace](../generated/windowCount-cancel.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [windowCount obligations](../generated/windowCount.obligations.md)<br>[windowCount-gap obligations](../generated/windowCount-gap.obligations.md)<br>[windowCount-cancel obligations](../generated/windowCount-cancel.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [windowCount manifest](../generated/windowCount.manifest.json)<br>[windowCount-gap manifest](../generated/windowCount-gap.manifest.json)<br>[windowCount-cancel manifest](../generated/windowCount-cancel.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session22-windowCount.ts](../src/models/session22-windowCount.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [windowCount.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowCount.ts)<br>[windowCount-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/windowCount-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[Observable.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Observable.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session22-windowCount-model.test.mjs](../tests/session22-windowCount-model.test.mjs)<br>[tests/session22-windowCount-rxjs.test.mjs](../tests/session22-windowCount-rxjs.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-22-COUNT-WINDOWS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-22.md](../evidence/SESSION-22.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Positive safe integer windowSize, positive safe integer effective stride (zero argument normalized to windowSize); no count overflow.

**Callbacks:** No callback. Source values are opaque, retain identity, and are never buffered by this operator.

**Time:** Only source event order controls windows; no scheduler is introduced. Explicit event sequence resolves equal-time input order.

**Reentrancy:** Atomic post-setup source notifications, with child attachment between reactions. Synchronous producer/reentrant observer mutation excluded.

**Sharing / ownership:** Result subscriptions are cold and independent. Each inner window is live multicast, no replay; window consumers do not keep the source connected.

**Explicit exclusions:**

- Fractional, negative, non-finite or overflowing window size/stride/count; zero windowSize.
- Synchronous source notifications during initial subscription setup and reentrant window-consumer callbacks.
- Imperative access to Subject implementation, throwing observer teardowns and unmodeled foreign ObservableInput conversions.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
