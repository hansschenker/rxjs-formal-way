# window: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Emit an initial live window and rotate it on boundary next; route source values into the current multicast window.  
**Cω shape:** `window : Cω(BoundarySignal) → T* → Observable<T>*`  
**Profiles represented:** `window`, `window-boundary-complete`, `window-cancel`

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
| 1 | Operator Overview | [window behavior](./window.md)<br>[window-boundary-complete behavior](./window-boundary-complete.md)<br>[window-cancel behavior](./window-cancel.md) | What does this operator do? |
| 2 | State Diagram | [window diagram](../generated/window.diagram.md)<br>[window-boundary-complete diagram](../generated/window-boundary-complete.diagram.md)<br>[window-cancel diagram](../generated/window-cancel.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [window STT](../generated/window.stt.md)<br>[window-boundary-complete STT](../generated/window-boundary-complete.stt.md)<br>[window-cancel STT](../generated/window-cancel.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [window Rule BDD](../generated/window.bdd.md)<br>[window-boundary-complete Rule BDD](../generated/window-boundary-complete.bdd.md)<br>[window-cancel Rule BDD](../generated/window-cancel.bdd.md)<br>[Scenario BDD](../docs/SESSION-21-SCENARIOS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [window trace](../generated/window.trace.md)<br>[window-boundary-complete trace](../generated/window-boundary-complete.trace.md)<br>[window-cancel trace](../generated/window-cancel.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [window obligations](../generated/window.obligations.md)<br>[window-boundary-complete obligations](../generated/window-boundary-complete.obligations.md)<br>[window-cancel obligations](../generated/window-cancel.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [window manifest](../generated/window.manifest.json)<br>[window-boundary-complete manifest](../generated/window-boundary-complete.manifest.json)<br>[window-cancel manifest](../generated/window-cancel.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session21-window.ts](../src/models/session21-window.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [window.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/window.ts)<br>[window-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/window-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[Observable.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Observable.ts)<br>[ObjectUnsubscribedError.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/ObjectUnsubscribedError.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session21-window-model.test.mjs](../tests/session21-window-model.test.mjs)<br>[tests/session21-window-rxjs.test.mjs](../tests/session21-window-rxjs.test.mjs)<br>[tests/session21-window-differential.test.mjs](../tests/session21-window-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-21-SCENARIOS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-21.md](../evidence/SESSION-21.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Valid Observable boundary input; observers use only the Observable-facing interface of emitted handles.

**Callbacks:** No user callback; payloads and boundary notification values are opaque.

**Time:** Source, boundary and consumer events supply trace time. Equal-time order is explicit input order; no clock, buffer or scheduler is introduced.

**Reentrancy:** Atomic non-reentrant reactions after source/boundary setup returns. Consumer attachment is an explicit event between reactions; synchronous setup and callback-driven reentry are characterized separately.

**Sharing / ownership:** Each result subscription owns its own source/boundary subscriptions and windows. Each emitted window is live multicast without replay; its consumers never retain the original source after outer cancellation.

**Explicit exclusions:**

- Promise/Iterable or invalid boundary conversion.
- Synchronous source/boundary notifications during setup and consumer attachment/cancellation inside an action word.
- Imperative next/error/complete access on the later Subject objects; the model specifies their Observable-facing behavior.
- Subscription to the invalidated final current handle is outside the modeled legal alphabet; native tests separately verify ObjectUnsubscribedError.
- Physical Subject/Observable prototype identity and observer-thrown errors.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
