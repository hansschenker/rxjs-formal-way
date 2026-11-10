# bufferWhen: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Open one buffer immediately; each selected closing notifier next flushes it and starts a fresh buffer.  
**Cω shape:** `bufferWhen : T* -> (T*)*`  
**Profiles represented:** `bufferWhen`

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
| 1 | Operator Overview | [bufferWhen behavior](./bufferWhen.md) | What does this operator do? |
| 2 | State Diagram | [bufferWhen diagram](../generated/bufferWhen.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [bufferWhen STT](../generated/bufferWhen.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [bufferWhen BDD](../generated/bufferWhen.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [bufferWhen trace](../generated/bufferWhen.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [bufferWhen obligations](../generated/bufferWhen.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [bufferWhen manifest](../generated/bufferWhen.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/bufferSelectors.ts](../src/models/bufferSelectors.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [bufferWhen.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/bufferWhen.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session08-model.test.mjs](../tests/session08-model.test.mjs)<br>[tests/session08-rxjs.test.mjs](../tests/session08-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-08.md](../evidence/SESSION-08.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Observable closing streams; selector called once per buffer

**Callbacks:** Selector invocation and return/throw modeled as correlated synchronous microsteps. The pure transition model never executes callbacks.

**Time:** Time and equal-time order come from externally ordered source/openings/closing notifications. No clock or scheduler is introduced.

**Reentrancy:** Atomic post-setup notifications; no reentrant notifications or cancellation inside selector, observers or teardown.

**Sharing / ownership:** No sharing or replay; each result subscription owns all buffers and closing subscriptions.

**Explicit exclusions:**

- Non-Observable ObservableInput conversion (Promises, etc.), arbitrary synchronous/reentrant closing notification during subscription, throwing downstream observers/finalizers.
- Cancellation inside selector or between output notification and resource release, callback side effects and arbitrary mutation of previously emitted array references.
- Universal symbolic equivalence beyond the finite scoped protocol.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
