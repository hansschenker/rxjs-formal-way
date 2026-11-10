# every: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Quantify that all source values satisfy an indexed predicate, short-circuiting on the first falsy result.  
**Cω shape:** `every(p) : T* -> Boolean!`  
**Profiles represented:** `every`

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
| 1 | Operator Overview | [every behavior](./every.md) | What does this operator do? |
| 2 | State Diagram | [every diagram](../generated/every.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [every STT](../generated/every.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [every BDD](../generated/every.bdd.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [every trace](../generated/every.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [every obligations](../generated/every.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [every manifest](../generated/every.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session11-scalar.ts](../src/models/session11-scalar.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [every.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/every.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session11-model.test.mjs](../tests/session11-model.test.mjs)<br>[tests/session11-rxjs.test.mjs](../tests/session11-rxjs.test.mjs) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-11.md](../evidence/SESSION-11.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Required synchronous indexed predicate; without thisArg overload.

**Callbacks:** Synchronous predicate (value,index,source), represented as a correlated invocation/outcome pair; user code is not executed by model.

**Time:** No clock; predicate return is a synchronous logical microstep. Completion or first falsy result determines output time.

**Reentrancy:** Atomic non-reentrant source and callback outcome delivery; no observer/finalizer reentry inside the modeled reaction.

**Sharing / ownership:** None; independent operator state per subscription even if the upstream happens to be shared.

**Explicit exclusions:**

- thisArg overload and user callback reentrancy.
- Callback cancellation and Index > MAX_SAFE_INTEGER.
- Thrown downstream observer/finalizer exceptions.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
