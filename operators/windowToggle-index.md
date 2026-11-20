# windowToggle: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Open live multicast windows from an opening signal and close each from its own selector-created signal.  
**Cω shape:** `Cω: windowToggle : (O* × (O! → C*)) → T* → (T*)*`  
**Profiles represented:** `windowToggle`, `windowToggle-empty-close`, `windowToggle-cancel`

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
| 1 | Operator Overview | [windowToggle behavior](./windowToggle.md)<br>[windowToggle-empty-close behavior](./windowToggle-empty-close.md)<br>[windowToggle-cancel behavior](./windowToggle-cancel.md) | What does this operator do? |
| 2 | State Diagram | [windowToggle diagram](../generated/windowToggle.diagram.md)<br>[windowToggle-empty-close diagram](../generated/windowToggle-empty-close.diagram.md)<br>[windowToggle-cancel diagram](../generated/windowToggle-cancel.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [windowToggle STT](../generated/windowToggle.stt.md)<br>[windowToggle-empty-close STT](../generated/windowToggle-empty-close.stt.md)<br>[windowToggle-cancel STT](../generated/windowToggle-cancel.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [windowToggle Rule BDD](../generated/windowToggle.bdd.md)<br>[windowToggle-empty-close Rule BDD](../generated/windowToggle-empty-close.bdd.md)<br>[windowToggle-cancel Rule BDD](../generated/windowToggle-cancel.bdd.md)<br>[Scenario BDD](../docs/SESSION-22-TOGGLE-WINDOWS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [windowToggle trace](../generated/windowToggle.trace.md)<br>[windowToggle-empty-close trace](../generated/windowToggle-empty-close.trace.md)<br>[windowToggle-cancel trace](../generated/windowToggle-cancel.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [windowToggle obligations](../generated/windowToggle.obligations.md)<br>[windowToggle-empty-close obligations](../generated/windowToggle-empty-close.obligations.md)<br>[windowToggle-cancel obligations](../generated/windowToggle-cancel.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [windowToggle manifest](../generated/windowToggle.manifest.json)<br>[windowToggle-empty-close manifest](../generated/windowToggle-empty-close.manifest.json)<br>[windowToggle-cancel manifest](../generated/windowToggle-cancel.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session22-windowToggle.ts](../src/models/session22-windowToggle.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [windowToggle.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowToggle.ts)<br>[windowToggle-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/windowToggle-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session22-windowToggle-model.test.mjs](../tests/session22-windowToggle-model.test.mjs)<br>[tests/session22-windowToggle-rxjs.test.mjs](../tests/session22-windowToggle-rxjs.test.mjs)<br>[tests/session22-windowToggle-differential.test.mjs](../tests/session22-windowToggle-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-22-TOGGLE-WINDOWS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-22.md](../evidence/SESSION-22.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Valid Observable opening signal; synchronous closingSelector returns a valid Observable. Fresh safe-integer window generations.

**Callbacks:** Selector invocation carries the exact opening payload. Correlated return/throw is supplied synchronously; the model never executes user code.

**Time:** No clock or timer. Sources supply time; input order resolves equal-time events. runWindowToggleTrace enforces selector outcome at invocation envelope time.

**Reentrancy:** Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Sharing / ownership:** Each outer connection owns its opening/source/closing subscriptions. Each window multicasts live values without replay; children hold no upstream lease.

**Explicit exclusions:**

- Setup-time synchronous opening/source/closing emissions and arbitrary callback/observer reentrancy.
- Foreign ObservableInput conversions, invalid closing-selector returns, direct Subject mutation and non-safe generation overflow.
- Late subscription to disposed handles throws synchronously and is characterized natively outside the legal model event alphabet.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
