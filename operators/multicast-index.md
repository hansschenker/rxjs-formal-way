# multicast: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Deprecated multicast(() => new Subject(), selector) with two branches set up before connecting one original source.  
**Cω shape:** `multicast(SubjectFactory, merge(shared$,shared$)) : T* → (T + T)*`  
**Profiles represented:** `multicast`

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
| 1 | Operator Overview | [multicast behavior](./multicast.md) | What does this operator do? |
| 2 | State Diagram | [multicast diagram](../generated/multicast.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [multicast STT](../generated/multicast.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [multicast BDD](../generated/multicast.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [multicast trace](../generated/multicast.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [multicast obligations](../generated/multicast.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [multicast manifest](../generated/multicast.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session15-aliases.ts](../src/models/session15-aliases.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [multicast.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/multicast.ts)<br>[connect.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/connect.ts)<br>[ConnectableObservable.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/ConnectableObservable.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session15-model.test.mjs](../tests/session15-model.test.mjs)<br>[tests/session15-rxjs.test.mjs](../tests/session15-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-15.md](../evidence/SESSION-15.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Deprecated subjectFactory plus selector overload. Factory returns fresh plain Subject; selector merges shared$ twice.

**Callbacks:** Selector construction modeled as a synchronous correlated callback; no source side effect before selected subscription.

**Time:** No scheduler or timer. Source dictates the timing; one source next causes two same-moment selected outputs.

**Reentrancy:** Synchronous source notifications after completed selector setup are supported; arbitrary selector reentry and synchronous selected-result termination are excluded.

**Sharing / ownership:** Within one selected-result subscription, one Subject multicasts a single source connection to two selected branches. Separate result subscriptions get separate Subjects.

**Explicit exclusions:**

- Subject instance reuse, selector-less ConnectableObservable.connect/refCount, ReplaySubject/BehaviorSubject/AsyncSubject, custom connector and arbitrary selectors.
- Synchronous selected-result early termination, observer reentrancy and throwing finalizers.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
