# windowWhen: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Route values through successive live windows; each fresh closing signal ends the current window on next or complete.  
**Cω shape:** `windowWhen : (() → U*) → T* → (T*)*`  
**Profiles represented:** `windowWhen`, `windowWhen-complete`, `windowWhen-cancel`

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
| 1 | Operator Overview | [windowWhen behavior](./windowWhen.md)<br>[windowWhen-complete behavior](./windowWhen-complete.md)<br>[windowWhen-cancel behavior](./windowWhen-cancel.md) | What does this operator do? |
| 2 | State Diagram | [windowWhen diagram](../generated/windowWhen.diagram.md)<br>[windowWhen-complete diagram](../generated/windowWhen-complete.diagram.md)<br>[windowWhen-cancel diagram](../generated/windowWhen-cancel.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [windowWhen STT](../generated/windowWhen.stt.md)<br>[windowWhen-complete STT](../generated/windowWhen-complete.stt.md)<br>[windowWhen-cancel STT](../generated/windowWhen-cancel.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [windowWhen Rule BDD](../generated/windowWhen.bdd.md)<br>[windowWhen-complete Rule BDD](../generated/windowWhen-complete.bdd.md)<br>[windowWhen-cancel Rule BDD](../generated/windowWhen-cancel.bdd.md)<br>[Scenario BDD](../docs/SESSION-22-WHEN-WINDOWS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [windowWhen trace](../generated/windowWhen.trace.md)<br>[windowWhen-complete trace](../generated/windowWhen-complete.trace.md)<br>[windowWhen-cancel trace](../generated/windowWhen-cancel.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [windowWhen obligations](../generated/windowWhen.obligations.md)<br>[windowWhen-complete obligations](../generated/windowWhen-complete.obligations.md)<br>[windowWhen-cancel obligations](../generated/windowWhen-cancel.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [windowWhen manifest](../generated/windowWhen.manifest.json)<br>[windowWhen-complete manifest](../generated/windowWhen-complete.manifest.json)<br>[windowWhen-cancel manifest](../generated/windowWhen-cancel.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session22-windowWhen.ts](../src/models/session22-windowWhen.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [windowWhen.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowWhen.ts)<br>[windowWhen-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/windowWhen-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[Subscription.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session22-windowWhen-model.test.mjs](../tests/session22-windowWhen-model.test.mjs)<br>[tests/session22-windowWhen-rxjs.test.mjs](../tests/session22-windowWhen-rxjs.test.mjs)<br>[tests/session22-windowWhen-differential.test.mjs](../tests/session22-windowWhen-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-22-WHEN-WINDOWS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-22.md](../evidence/SESSION-22.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** No numeric parameters. A synchronous closing factory returns a valid Observable whose acquisition is non-notifying, or throws an opaque error.

**Callbacks:** Factory requests have generation equal to the new window identity. Explicit return/throw must match the current invocation at the same envelope time.

**Time:** No timer is introduced. Source and closing streams provide notification times. Equal-time ordering is explicit; runWindowWhenTrace enforces same-time factory outcomes.

**Reentrancy:** Atomic non-reentrant reactions; child attachment occurs between completed reactions. Source and closing acquisition do not synchronously notify.

**Sharing / ownership:** Independent outer subscriptions have separate windows and closing occurrences. Inner windows are live multicast without replay; inner consumers hold no upstream lease.

**Explicit exclusions:**

- Synchronous closing notifications during subscription, recursively empty closing streams, and reentrant factory/observer/source setup.
- Child attachment during the synchronous handle-announcement/factory reaction; native tests characterize this separately.
- ObservableInput conversion beyond valid Observable values, imperative Subject mutation and source setup that emits despite a closed subscriber.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
