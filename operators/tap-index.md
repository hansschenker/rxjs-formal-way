# tap: Operator Inspection Index

> Generated from the canonical model by npm run generate. Do not edit this projection.

Use this page as the navigation spine for studying the operator. Start with the story, descend into the machine, then inspect the independent evidence.

**RxJS:** 7.8.2  
**Purpose:** Observe source notifications and connection lifecycle without replacing successful values.  
**Cω shape:** `tap : Cω(ObserverHooks) → T* → T*`  
**Profiles represented:** `tap`, `tap-next`

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
| 1 | Operator Overview | [tap behavior](./tap.md)<br>[tap-next behavior](./tap-next.md) | What does this operator do? |
| 2 | State Diagram | [tap diagram](../generated/tap.diagram.md)<br>[tap-next diagram](../generated/tap-next.diagram.md) | What states can the operator be in? |
| 3 | State Transition Table | [tap STT](../generated/tap.stt.md)<br>[tap-next STT](../generated/tap-next.stt.md) | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | [tap Rule BDD](../generated/tap.bdd.md)<br>[tap-next Rule BDD](../generated/tap-next.bdd.md)<br>[Scenario BDD](../docs/SESSION-20-SCENARIOS.md) | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | [tap trace](../generated/tap.trace.md)<br>[tap-next trace](../generated/tap-next.trace.md) | How does one concrete execution unfold over time? |
| 6 | Verification Obligations | [tap obligations](../generated/tap.obligations.md)<br>[tap-next obligations](../generated/tap-next.obligations.md) | What claims must be checked? |
| 7 | Formal Manifest | [tap manifest](../generated/tap.manifest.json)<br>[tap-next manifest](../generated/tap-next.manifest.json) | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | [src/models/session20-tap.ts](../src/models/session20-tap.ts) | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | [tap.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/tap.ts)<br>[tap-spec.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/tap-spec.ts)<br>[OperatorSubscriber.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) | What does the pinned RxJS implementation actually do? |
| 10 | Tests | [tests/session20-model.test.mjs](../tests/session20-model.test.mjs)<br>[tests/session20-rxjs.test.mjs](../tests/session20-rxjs.test.mjs)<br>[tests/session20-differential.test.mjs](../tests/session20-differential.test.mjs)<br>[Upstream coverage and rule witnesses](../docs/SESSION-20-SCENARIOS.md) | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | [evidence/SESSION-20.md](../evidence/SESSION-20.md) | What was actually executed, verified, accepted, and explicitly excluded? |

## Scope at a glance

**Parameters:** A subset of the six named observer hooks; next-function form is the next-only profile.

**Callbacks:** next/error/complete invocation outcomes are explicit correlated events. subscribe/unsubscribe/finalize are nonthrowing observation actions; their return values have no effect.

**Time:** No clock is introduced. Source events supply time; input order breaks equal-time ties. Callers must supply synchronous callback outcomes at the invocation time; generic runTrace does not enforce that envelope-time precondition.

**Reentrancy:** Atomic non-reentrant reactions; synchronous callback outcomes are explicit microsteps. Ordered source teardown assumes source setup has returned.

**Sharing / ownership:** No implicit sharing or replay. Each result subscription owns its memory and resource generations; supplied producers may themselves be shared.

**Explicit exclusions:**

- Throwing lifecycle hooks (subscribe/unsubscribe/finalize), deprecated positional overload parsing and JavaScript receiver binding.
- Payload mutation is not simulated: reference identity is preserved, not a deep snapshot.
- Source delivery during acquisition and observer-triggered cancellation during a pending callback.
- Throwing observer/producer teardown, arbitrary reentrancy and universal infinite-trace liveness are not modeled.

## Recommended reading rule

Do not treat the eleven artifacts as eleven independent specifications. Read them as eleven lenses over the same operator behavior, with the evidence ledger recording what was independently checked.
