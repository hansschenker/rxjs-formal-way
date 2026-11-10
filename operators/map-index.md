# map: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Transform each incoming value through a supplied projection without changing its delivery policy.  
**Cω shape:** `map : (T! x Index! -> R!) -> T* -> R*`  
**Profiles represented:** `map`

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
| 1 | Operator Overview | [map behavior](./map.md) | What does this operator do? |
| 2 | State Diagram | [map diagram](../generated/map.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [map STT](../generated/map.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [map BDD](../generated/map.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [map trace](../generated/map.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [map obligations](../generated/map.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [map manifest](../generated/map.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/map.ts](../src/models/map.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [map.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/map.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[Subscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/m02-model.test.mjs](../tests/m02-model.test.mjs)<br>[tests/m02-rxjs.test.mjs](../tests/m02-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/M02.md](../evidence/M02.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** A named callback binding; nonnegative safe-integer callback indices below overflow

**Callbacks:** Callback invocation is an action; return/throw is a correlated input. No callback function runs inside a guard, reaction, validator, or generator.

**Time:** No timer or clock is introduced. Calling is a synchronous logical phase, not a scheduled delay; example sequence numbers order same-frame events.

**Reentrancy:** Non-reentrant source, callback and observer behavior; cancellation only between fully resolved value reactions.

**Sharing / ownership:** No sharing introduced. Each result subscription has its own index, even with a shared or hot producer.

**Explicit exclusions:**

- Deprecated thisArg overload and invalid non-function callback arguments.
- Nested notifications or cancellation inside callbacks or observer delivery; throwing observers or finalizers.
- Counter precision loss beyond the safe-integer domain; proof of TypeScript predicate narrowing.
- A production callback/effect interpreter, runtime snapshot codec, or callback purity guarantee.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
