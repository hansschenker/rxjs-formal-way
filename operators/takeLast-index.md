# takeLast: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Retain a bounded suffix and emit it only after successful source completion.  
**Cω shape:** `takeLast : Cω(Count) → T* → T≤max(0,Count)`  
**Profiles represented:** `takeLast`, `takeLast-zero`

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
| 1 | Operator Overview | [takeLast behavior](./takeLast.md)<br>[takeLast-zero behavior](./takeLast-zero.md) | What does this operator do? |
| 2 | State Diagram | [takeLast diagram](../generated/takeLast.diagram.md)<br>[takeLast-zero diagram](../generated/takeLast-zero.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [takeLast STT](../generated/takeLast.stt.md)<br>[takeLast-zero STT](../generated/takeLast-zero.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [takeLast Rule BDD](../generated/takeLast.bdd.md)<br>[takeLast-zero Rule BDD](../generated/takeLast-zero.bdd.md)<br>[Scenario BDD](../docs/SESSION-20-SCENARIOS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [takeLast trace](../generated/takeLast.trace.md)<br>[takeLast-zero trace](../generated/takeLast-zero.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [takeLast obligations](../generated/takeLast.obligations.md)<br>[takeLast-zero obligations](../generated/takeLast-zero.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [takeLast manifest](../generated/takeLast.manifest.json)<br>[takeLast-zero manifest](../generated/takeLast-zero.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session20-terminal.ts](../src/models/session20-terminal.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [takeLast.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/takeLast.ts)<br>[takeLast-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/takeLast-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session20-model.test.mjs](../tests/session20-model.test.mjs)<br>[tests/session20-rxjs.test.mjs](../tests/session20-rxjs.test.mjs)<br>[tests/session20-differential.test.mjs](../tests/session20-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-20-SCENARIOS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-20.md](../evidence/SESSION-20.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Safe integer count in -8..8; positive counts bound retained FIFO memory.

**Callbacks:** No user callback.

**Time:** No clock is introduced. Source events supply time; input order breaks equal-time ties. Callers must supply synchronous callback outcomes at the invocation time; generic runTrace does not enforce that envelope-time precondition.

**Reentrancy:** Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Sharing / ownership:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Explicit exclusions:**

- Counts outside -8..8, fractional counts, Infinity and NaN.
- Consumer cancellation or reentry during the synchronous completion-flush word.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
