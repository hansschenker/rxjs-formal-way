# connect: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Establish two downstream branches before connecting one shared, possibly synchronous source.  
**Cω shape:** `connect(merge(shared,shared)) : T* -> (T + T)*`  
**Profiles represented:** `connect`

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
| 1 | Operator Overview | [connect behavior](./connect.md) | What does this operator do? |
| 2 | State Diagram | [connect diagram](../generated/connect.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [connect STT](../generated/connect.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [connect BDD](../generated/connect.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [connect trace](../generated/connect.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [connect obligations](../generated/connect.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [connect manifest](../generated/connect.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/connect.ts](../src/models/connect.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [connect.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/connect.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[fromSubscribable.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/fromSubscribable.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session10-model.test.mjs](../tests/session10-model.test.mjs)<br>[tests/session10-rxjs.test.mjs](../tests/session10-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-10.md](../evidence/SESSION-10.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Default Subject connector; selector specifically merge(shared$, shared$). No custom SubjectLike or arbitrary selected graph.

**Callbacks:** Selector construction modeled as a synchronous correlated callback; no source side effect before selected subscription.

**Time:** No scheduler or timer. Source dictates the timing; one source next causes two same-moment selected outputs.

**Reentrancy:** Synchronous source notifications after completed selector setup are supported; arbitrary selector reentry and synchronous selected-result termination are excluded.

**Sharing / ownership:** Subject multicasts inside one result subscription; two selected branches observe one source. Separate outer subscriptions do not share.

**Explicit exclusions:**

- Custom connector, selector returning Promise/iterable, arbitrary selector topology or early selected-result termination.
- Observer exceptions/reentrancy, finalizer throws and cancellation during synchronous observer notification.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
