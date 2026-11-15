# refCount: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Automate one shared legacy ConnectableObservable connection while the subscriber count is nonzero.  
**Cω shape:** `refCount() : Cω(Connection) → Connectable(T*) → Shared(T*)`  
**Profiles represented:** `refCount`

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
| 1 | Operator Overview | [refCount behavior](./refCount.md) | What does this operator do? |
| 2 | State Diagram | [refCount diagram](../generated/refCount.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [refCount STT](../generated/refCount.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [refCount BDD](../generated/refCount.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [refCount trace](../generated/refCount.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [refCount obligations](../generated/refCount.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [refCount manifest](../generated/refCount.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session18-refCount.ts](../src/models/session18-refCount.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [refCount.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/refCount.ts)<br>[ConnectableObservable.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/ConnectableObservable.ts)<br>[multicast.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/multicast.ts)<br>[share.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/share.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session18-model.test.mjs](../tests/session18-model.test.mjs)<br>[tests/session18-rxjs.test.mjs](../tests/session18-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-18.md](../evidence/SESSION-18.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Legacy pipeable refCount() following publish() / ConnectableObservable with one fixed Subject, immediate disconnect when count reaches zero; terminal Subject is retained.

**Callbacks:** No custom Subject factory, selection callback or user callback evaluation.

**Time:** No clock: connection lifetime is determined by ordered subscribe/unsubscribe and producer notifications.

**Reentrancy:** Atomic post-setup subscriber registration; each subscription occurrence has a unique ID.

**Sharing / ownership:** All refCount subscribers of this published ConnectableObservable share one source connection.

**Explicit exclusions:**

- Calling refCount on an ordinary non-Connectable Observable or custom ConnectableObservable implementations.
- Synchronous source completion/next during connect() and the local connection-identity teardown race.
- Custom Subject variants, manual external connect/disconnect during refCount, reentrant observers and throwing teardown.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
