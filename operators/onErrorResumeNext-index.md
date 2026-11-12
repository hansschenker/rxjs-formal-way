# onErrorResumeNext: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Sequentially forward the original and later Observable sources, moving to the next on either completion or error.  
**Cω shape:** `onErrorResumeNext : T0* × ... × Tn* → (T0 | ... | Tn)*`  
**Profiles represented:** `onErrorResumeNext`

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
| 1 | Operator Overview | [onErrorResumeNext behavior](./onErrorResumeNext.md) | What does this operator do? |
| 2 | State Diagram | [onErrorResumeNext diagram](../generated/onErrorResumeNext.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [onErrorResumeNext STT](../generated/onErrorResumeNext.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [onErrorResumeNext BDD](../generated/onErrorResumeNext.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [onErrorResumeNext trace](../generated/onErrorResumeNext.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [onErrorResumeNext obligations](../generated/onErrorResumeNext.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [onErrorResumeNext manifest](../generated/onErrorResumeNext.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session15-onErrorResumeNext.ts](../src/models/session15-onErrorResumeNext.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [index.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/operators/index.ts)<br>[onErrorResumeNextWith.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/onErrorResumeNextWith.ts)<br>[onErrorResumeNext.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/onErrorResumeNext.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session15-model.test.mjs](../tests/session15-model.test.mjs)<br>[tests/session15-rxjs.test.mjs](../tests/session15-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-15.md](../evidence/SESSION-15.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Pipeable deprecated onErrorResumeNext alias of onErrorResumeNextWith; 2 other valid Observable sources, no promises or iterables.

**Callbacks:** No callbacks or inspection of error values. Error details are intentionally discarded.

**Time:** Only active source notifications determine time; no timer. Sequential resource acquisition is synchronous in each terminal reaction.

**Reentrancy:** Atomic nonreentrant source terminal steps and subscription acquisition.

**Sharing / ownership:** No sharing; one input active per result subscription.

**Explicit exclusions:**

- Synchronous reentrant emission during subscription acquisition; arbitrary ObservableInput conversions and conversion throws.
- Unbounded argument counts over 32; any user observer callback reentry or throwing teardown.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
