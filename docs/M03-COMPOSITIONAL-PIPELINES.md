# M03 — Compositional Pipeline Semantics

**Status:** first executable composition kernel implemented on a bounded, non-reentrant profile.

## Final project goal

The final goal of `rxjs-formal-way` is:

> **Scale upward from precise local operator semantics into formal verification of composed RxJS pipelines.**

M03 introduces the bridge between those levels without replacing the existing operator models.

```text
local OperatorModel / Mealy semantics
              ↓
        liftOperator(...)
              ↓
      product pipeline state
              ↓
  action interpretation + routing
              ↓
      synchronous closure
              ↓
       stable PipelineState
              ↓
 bounded explicit-state exploration
              ↓
 invariants / counterexample paths
              ↓
 future TLA+ / TLC projection
```

## 1. What is lifted

Each canonical operator remains authoritative:

```text
(state, event) → (nextState, ordered actions)
```

M03 does not duplicate those rules. `liftOperator` erases only the TypeScript generics required to place heterogeneous operators into one pipeline.

A pipeline state is the product of local states:

```text
S_pipeline = S₁ × S₂ × ... × Sₙ
```

Runtime actions supply the connection semantics.

## 2. Routing law

The composition kernel interprets only actions whose pipeline meaning is explicit:

| Local action | Pipeline meaning |
|---|---|
| `notify(next/error/complete)` | synchronously deliver the corresponding source/outer event to the next node |
| upstream `subscribe` | synchronously deliver `subscribe` to the previous node |
| upstream `unsubscribe` | synchronously deliver `cancel` to the previous node |
| timer schedule/cancel | remain explicit effects |
| callback invocation | remains an explicit effect |
| inner subscription/cancellation | remains an explicit effect |

The last three categories are deliberately *not* hidden. They define future environment/model-checking boundaries.

## 3. Macro-step semantics

M03 distinguishes local microsteps from one pipeline macro-step.

```text
external event
   ↓
operator transition
   ↓
ordered action
   ↓
synchronous downstream/upstream routing
   ↓
more local transitions
   ↓
quiescent stable pipeline snapshot
```

`stepPipeline` returns both:

- the stable product state;
- the ordered `microSteps` that produced it.

The synchronous-closure budget prevents accidental cycles from being silently accepted.

## 4. First executable witness

The first regression pipeline is intentionally minimal:

```text
source → take(2) → take(1) → observer
```

Subscription starts downstream and propagates upstream.

For the first source value:

```text
take(2): forward A
    ↓
take(1): forward A, complete, unsubscribe upstream
    ↓
take(2): receive cancellation and release source
```

One macro-step therefore proves both directions of pipeline behavior:

```text
notifications: source → operator → operator → observer
cancellation: source ← operator ← operator ← observer
```

The regression test asserts the exact microstep order and final product state.

## 5. Explicit-state model checking

`explorePipeline` performs bounded breadth-first exploration over stable `PipelineState` values.

The caller supplies a finite environment abstraction:

```text
events(state) → finite set of legal PipelineInput values
```

This is important. Real RxJS values, time and source histories may be unbounded. Model checking therefore needs an explicit finite abstraction rather than pretending the JavaScript state space is finite.

The checker records:

- number of distinct states;
- number of explored transitions;
- invariant violations;
- one concrete input path for every discovered violation.

An invariant is:

```text
PipelineState → boolean
```

The first accepted invariant is:

> once the downstream `take(1)` is closed, the upstream `take(2)` cannot remain active.

A deliberately false invariant is also tested to ensure a counterexample path is returned.

## 6. Relation to Lamport terminology

M03 aligns the repository terminology:

- **State** — one stable assignment of all local operator states.
- **Step** — one external event plus synchronous closure to the next stable state.
- **Behavior** — a sequence of such stable states.
- **Execution** — one concrete path selected from the allowed behavior space.
- **Specification** — the set of allowed behaviors generated from the initial state and transition rules.

So:

```text
Init + Next
    ↓
reachable states
    ↓
behaviors
```

The local Mealy rules generate `Next`; the model checker explores the resulting reachable state graph.

## 7. What M03 deliberately does not claim yet

This first kernel does **not** yet claim:

- exhaustive verification of arbitrary RxJS pipelines;
- automatic finite abstraction of payloads or time;
- automatic callback/timer/inner-source outcome generation;
- exact reentrant JavaScript call-stack semantics;
- a generated TLA+ module or TLC proof;
- equivalence between the bounded explorer and every RxJS scheduler/source combination.

Those are refinement targets.

## 8. Next scaling target

The next composition witness should be:

```text
debounceTime(T)
    → switchMap(project)
    → distinctUntilChanged()
```

That pipeline adds the dimensions M03 is designed to expose:

- time and timer identities;
- callback/project outcomes;
- inner subscription generations;
- switch cancellation/freshness;
- synchronous downstream filtering;
- completion and error propagation.

The finite model should abstract payloads to a small domain such as `{A, B}`, inner identities to `{I0, I1}`, and time to behaviorally relevant boundaries rather than every millisecond.

## 9. Path toward TLA+ / TLC

The composition kernel now provides the missing semantic input for a TLA+ projection:

```text
PipelineState     → VARIABLES
initial state     → Init
legal macrosteps  → Next
state invariants  → INVARIANT
temporal contract → LTL / TLA+ temporal formula
```

TLA+ generation should be a projection of this canonical pipeline semantics, not a second hand-maintained specification.

## 10. Acceptance criterion

M03 is accepted at its current first-kernel scope when:

1. heterogeneous local operator models can be lifted without duplicating their rules;
2. forward notifications compose synchronously;
3. reverse subscription cancellation composes synchronously;
4. a macro-step reaches a stable product state;
5. bounded state exploration detects invariant violations and returns a path;
6. existing operator tests and generated artifacts remain unchanged.

This establishes the architectural bridge required for the final project goal: **formal verification of composed RxJS pipelines**.
