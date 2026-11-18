# throwIfEmpty: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Mirror source values, but turn successful empty completion into a lazily created error.  
**Cω shape:** `throwIfEmpty : Cω(() → unknown) → T* → T*`  
**Profiles represented:** `throwIfEmpty`, `throwIfEmpty-custom`

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
| 1 | Operator Overview | [throwIfEmpty behavior](./throwIfEmpty.md)<br>[throwIfEmpty-custom behavior](./throwIfEmpty-custom.md) | What does this operator do? |
| 2 | State Diagram | [throwIfEmpty diagram](../generated/throwIfEmpty.diagram.md)<br>[throwIfEmpty-custom diagram](../generated/throwIfEmpty-custom.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [throwIfEmpty STT](../generated/throwIfEmpty.stt.md)<br>[throwIfEmpty-custom STT](../generated/throwIfEmpty-custom.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [throwIfEmpty Rule BDD](../generated/throwIfEmpty.bdd.md)<br>[throwIfEmpty-custom Rule BDD](../generated/throwIfEmpty-custom.bdd.md)<br>[Scenario BDD](../docs/SESSION-20-SCENARIOS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [throwIfEmpty trace](../generated/throwIfEmpty.trace.md)<br>[throwIfEmpty-custom trace](../generated/throwIfEmpty-custom.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [throwIfEmpty obligations](../generated/throwIfEmpty.obligations.md)<br>[throwIfEmpty-custom obligations](../generated/throwIfEmpty-custom.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [throwIfEmpty manifest](../generated/throwIfEmpty.manifest.json)<br>[throwIfEmpty-custom manifest](../generated/throwIfEmpty-custom.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session20-terminal.ts](../src/models/session20-terminal.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [throwIfEmpty.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throwIfEmpty.ts)<br>[throwIfEmpty-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/throwIfEmpty-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts)<br>[EmptyError.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/EmptyError.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session20-model.test.mjs](../tests/session20-model.test.mjs)<br>[tests/session20-rxjs.test.mjs](../tests/session20-rxjs.test.mjs)<br>[tests/session20-differential.test.mjs](../tests/session20-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-20-SCENARIOS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-20.md](../evidence/SESSION-20.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** Default EmptyError factory binding or a custom synchronous error factory.

**Callbacks:** One explicit invocation at empty completion. Its return/throw is supplied as a correlated outcome; the canonical model never calls it.

**Time:** No clock is introduced. Source events supply time; input order breaks equal-time ties. Callers must supply synchronous callback outcomes at the invocation time; generic runTrace does not enforce that envelope-time precondition.

**Reentrancy:** Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Sharing / ownership:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Explicit exclusions:**

- Concrete EmptyError prototype construction is checked natively; the model treats the valid default-factory outcome as an opaque object.
- An outcome attributed to the default binding is assumed to come from that pinned constructor, not an arbitrary substituted factory.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
