# shareReplay: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Share one producer and synchronously replay recent values to later subscribers, retaining successful completion.  
**Cω shape:** `shareReplay : T* -> SharedReplay(T*)`  
**Profiles represented:** `shareReplay`

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
| 1 | Operator Overview | [shareReplay behavior](./shareReplay.md) | What does this operator do? |
| 2 | State Diagram | [shareReplay diagram](../generated/shareReplay.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [shareReplay STT](../generated/shareReplay.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [shareReplay BDD](../generated/shareReplay.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [shareReplay trace](../generated/shareReplay.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [shareReplay obligations](../generated/shareReplay.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [shareReplay manifest](../generated/shareReplay.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/shareReplay.ts](../src/models/shareReplay.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [shareReplay.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/shareReplay.ts)<br>[ReplaySubject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/ReplaySubject.ts)<br>[share.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/share.ts)<br>[Subject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subject.ts)<br>[dateTimestampProvider.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/scheduler/dateTimestampProvider.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session3-shareReplay-model.test.mjs](../tests/session3-shareReplay-model.test.mjs)<br>[tests/session3-shareReplay-rxjs.test.mjs](../tests/session3-shareReplay-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-03.md](../evidence/SESSION-03.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** ReplaySubject(bufferSize=2,windowTime=6), refCount=false; nonnegative safe-integer sizes and windows; zero clamped to one

**Callbacks:** No user callback, custom connector, observer side effects, or reset-notifier function is executed in the pure model.

**Time:** Source-clock values are supplied by event.now. Expiry happens when ReplaySubject trims on next/subscribe; expireAt <= now is excluded. No timer runs to evict values.

**Reentrancy:** Atomic, non-reentrant subscriber registration and source delivery after connection setup. Synchronous replay occurs before a retained terminal signal.

**Sharing / ownership:** One replay buffer and source connection per resulting shared Observable, not per subscriber.

**Explicit exclusions:**

- Arbitrary reentrant subscriptions/teardown and throwing observers or finalizers.
- Custom timestamp providers not modeled as explicitly supplied event time, fractional/negative/infinite-boundary arithmetic, and arbitrary ObservableInput conversion.
- No production effect interpreter or claim that finite tests establish full equivalence.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
