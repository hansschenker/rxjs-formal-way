# distinctUntilKeyChanged: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Forward the first item and later items whose selected property differs from the previous FORWARDED item.  
**Cω shape:** `distinctUntilKeyChanged : T* -> T*`  
**Profiles represented:** `distinctUntilKeyChanged`

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
| 1 | Operator Overview | [distinctUntilKeyChanged behavior](./distinctUntilKeyChanged.md) | What does this operator do? |
| 2 | State Diagram | [distinctUntilKeyChanged diagram](../generated/distinctUntilKeyChanged.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [distinctUntilKeyChanged STT](../generated/distinctUntilKeyChanged.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [distinctUntilKeyChanged BDD](../generated/distinctUntilKeyChanged.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [distinctUntilKeyChanged trace](../generated/distinctUntilKeyChanged.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [distinctUntilKeyChanged obligations](../generated/distinctUntilKeyChanged.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [distinctUntilKeyChanged manifest](../generated/distinctUntilKeyChanged.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/adjacent.ts](../src/models/adjacent.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [distinctUntilKeyChanged.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/distinctUntilKeyChanged.ts)<br>[distinctUntilChanged.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/distinctUntilChanged.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session4-model.test.mjs](../tests/session4-model.test.mjs)<br>[tests/session4-rxjs.test.mjs](../tests/session4-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-04.md](../evidence/SESSION-04.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Key mode property, comparator mode strict, property code.

**Callbacks:** Key selection and comparator outcomes are external correlated microsteps, not functions executed inside model guards. Default identity/property selection and strict comparison are synthetic model steps, not physical user callback calls.

**Time:** No timers or scheduler introduced. Inputs supply timestamps and tie order; key and comparator microsteps resolve synchronously at the same time.

**Reentrancy:** Non-reentrant source and observer delivery; only plain stable property values are modeled for distinctUntilKeyChanged.

**Sharing / ownership:** Does not multicast. Each result subscription owns its own last-emitted key.

**Explicit exclusions:**

- Arbitrary reentrant observer/callback behavior and subscriber cancellation DURING an unresolved callback.
- Mutation/getter side effects between property comparisons, prototype proxies or throwing property access unless represented as explicit key errors.
- Unbounded invocation-counter overflow, a production callback effect interpreter, deprecated overloads not selected here.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
