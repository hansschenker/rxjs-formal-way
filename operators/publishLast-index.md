# publishLast: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** AsyncSubject buffers the latest value without forwarding and emits it only after successful completion; empty completion emits none. An explicit connect() controls the source, not the number of observers.  
**Cω shape:** `publishLast : T* -> (T?) per observer at completion`  
**Profiles represented:** `publishLast`

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
| 1 | Operator Overview | [publishLast behavior](./publishLast.md) | What does this operator do? |
| 2 | State Diagram | [publishLast diagram](../generated/publishLast.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [publishLast STT](../generated/publishLast.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [publishLast BDD](../generated/publishLast.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [publishLast trace](../generated/publishLast.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [publishLast obligations](../generated/publishLast.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [publishLast manifest](../generated/publishLast.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session16.ts](../src/models/session16.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [publishLast.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/publishLast.ts)<br>[multicast.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/multicast.ts)<br>[ConnectableObservable.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/ConnectableObservable.ts)<br>[AsyncSubject.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/AsyncSubject.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session16-model.test.mjs](../tests/session16-model.test.mjs)<br>[tests/session16-rxjs.test.mjs](../tests/session16-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-16.md](../evidence/SESSION-16.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Selector-less legacy ConnectableObservable; one fixed Subject instance and explicit connect.

**Callbacks:** No user selector, projection or subscriber callback executes inside the pure model.

**Time:** No scheduler is added; source events occur at supplied times. Replay has infinite time window and count-only eviction. New subscriptions synchronously replay memory.

**Reentrancy:** Non-reentrant event delivery; source is not synchronous within connect() acquisition. Registered teardowns and one terminal connection only.

**Sharing / ownership:** One fixed publishLast Subject and one explicitly owned upstream connection serve all observers of the same connectable instance.

**Explicit exclusions:**

- Selector overloads of publish/publishReplay, timestamp-provider/windowTime expiration, arbitrary scheduler ties and getter side effects.
- Reconnect after a terminal source notification, synchronous emission during connect(), observer callbacks that unsubscribe reentrantly.
- RefCount auto-connection, arbitrary custom Subject subclass, throwing observer or teardown.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
