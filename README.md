# RxJS Formal Way

A coherent method for describing, analyzing, documenting, visualizing, and testing **RxJS 7.8.2 operator behavior** from one explicit semantic model.

This repository consolidates the strongest reusable ideas developed across the Mealy-related RxJS repositories into one workflow.

> **Core principle:** define operator behavior once, then derive the readable documentation, transition tables, diagrams, traces, and test obligations from that same model.

## Why this repository exists

The project grew through a sequence of discoveries:

```text
Stateful Transducer
        ↓
Mealy-style state machine
        ↓
Six-component operator analysis
        ↓
Guarded State Transition Table
        ↓
BDD / Mealy-DSL readable projection
        ↓
Execution traces + four-lane timelines
        ↓
Test obligations
        ↓
Concrete RxJS TestScheduler / lifecycle tests
        ↓
Plain-language operator documentation
```

The important result is not the terminology. It is the **traceable chain from behavior to evidence**.

An RxJS user should not need to understand automata theory to read an operator description. The formal model is the semantic engine underneath; BDD and plain language are the user-facing views.

## Baseline

- RxJS: **7.8.2**
- JavaScript / TypeScript
- Observable protocol: ordered `next` notifications followed by at most one terminal `error` or `complete`
- Subscription, cancellation, teardown, timers, scheduling, and sharing are modeled explicitly when they affect behavior.

## The unified workflow

```text
Pinned RxJS source + operator configuration
                  │
                  ▼
        Behavioral contract
                  │
                  ▼
     Extended Mealy-style model
       M = (S, S₀, Z, A, T, G)
                  │
                  ▼
     Guarded State Transition Table
          ┌───────┼────────┐
          ▼       ▼        ▼
        BDD     Trace    State diagram
          │       │
          │       └──────► four-lane timeline
          │
          └──────────────► plain-language behavior
                  │
                  ▼
          Test obligations
                  │
          ┌───────┴────────┐
          ▼                ▼
      model tests      RxJS runtime tests
                           │
                           ▼
                    evidence / comparison
```

The arrows mean **derivation and traceability**, not that every artifact must be generated mechanically in the first implementation.

## The semantic core

We use an extended Mealy-style transducer:

```text
M = (S, S₀, Z, A, T, G)
```

| Component | Meaning | RxJS question |
|---|---|---|
| `S` | State space | What must the operator remember? |
| `S₀` | Initial state | What is true when execution begins? |
| `Z` | Input alphabet | Which events can make the operator react? |
| `A` | Output alphabet | Which notifications/control observations can it produce? |
| `T` | Transition function | What state follows this event? |
| `G` | Action / output function | What ordered output/effects result? |

For RxJS, one input may produce **zero, one, or several** observable outputs, so `G` is treated as sequence-valued when appropriate.

The model may be symbolic rather than finite. Payloads, counters, buffers, inner subscription identities, and deadlines can make a literal finite-state interpretation inappropriate.

## RxJS input alphabets

A single-source operator usually begins with:

```text
subscribe
source.next(value)
source.error(error)
source.complete
unsubscribe
```

Higher-order operators add outer/inner distinctions:

```text
outer.next(value)
outer.error(error)
outer.complete

inner.next(id, value)
inner.error(id, error)
inner.complete(id)
```

Time-sensitive operators add explicit scheduler/timer events:

```text
timer.fire(id)
```

Time is therefore not hidden inside the prose. It appears as an event source that can change the machine.

## BDD is the readable projection

Formal semantics should not force RxJS users to read tuple notation.

Canonical readable rule:

```text
Given <current state>
When  <input event>
Then  <Action Policy>
Then  <Action Policy>
And   <next state>
```

Equivalent machine-oriented form:

```text
While <current state>
When  <input event>
Then  <Action Policy>
And   <next state>
```

Example for `switchMap`:

```text
Given an inner subscription is active
When the outer source emits a new value
Then unsubscribe the current inner
Then project the new outer value
Then subscribe to the new inner
And an inner subscription is active
```

The BDD is not a second specification. It is a human-readable projection of the same transition rule.

## State Transition Table

Each reachable, behaviorally distinct rule becomes one guarded STT row.

Minimum columns:

| ID | Current state | Input | Guard | Action / outputs | Next state |
|---|---|---|---|---|---|

For conformance work we additionally track:

- state-reaching prefix
- lifecycle observations
- distinguishing suffix
- test IDs
- execution status
- evidence
- exclusions / scope

### Fundamental testing rule

> **Every reachable, behaviorally distinct transition is a minimum test obligation.**

This is stronger and more precise than “one row = one test.” One row may require several concrete tests for timing, payload partitions, reentrancy, scheduler ordering, resource ownership, or lifecycle boundaries.

## Test derivation

```text
Behavior
   ↓
Formal model
   ↓
Reachable guarded transition
   ↓
Test obligation
   ↓
State-reaching input sequence
   ↓
Expected notifications + lifecycle consequences
   ↓
RxJS test
```

Tests should reach a state through the public observable protocol whenever practical rather than mutating imagined internal fields.

Use separate assertions for:

- values and terminal notifications
- subscriptions/unsubscriptions
- timer/resource lifecycle
- ordering
- sharing/reset behavior
- cancellation

A generated model is an oracle candidate, not proof of the actual RxJS implementation. Runtime comparisons remain separate evidence.

## BDD → STT → tests

The readable and formal views stay traceable:

```text
Given state S
When event E
Then action A₁
Then action A₂
And state S′
```

corresponds to:

```text
STT:
S | E | guard | A₁, A₂ | S′
```

which creates the obligation:

```text
Reach S
→ provide E
→ observe A₁, A₂
→ verify future behavior corresponds to S′
```

## Static cardinality: Cω companion notation

Erik Meijer's Cω stream cardinality notation is useful as a compact **static** description:

```text
T!   exactly one
T?   zero or one
T+   one or more
T*   zero or more
(T*)* nested streams
```

It complements, but does not replace, the dynamic model.

Example:

```text
map    : (T → U) → T* → U*
filter : (T → boolean) → T* → T*
reduce : (A → T → A) → A → T* → A!
```

Cω says something about stream cardinality. The Mealy-style model explains **how the operator behaves over time to realize it**.

## Four-lane execution view

For teaching and debugging, a concrete trace can be rendered as:

```text
1. Time / scheduler frames
2. Input notifications
3. Operator control state
4. Output notifications
```

This is especially useful for time-based and concurrency-sensitive operators because it separates:

- when something happens,
- what arrives,
- what the operator remembers,
- what leaves the operator.

## Core invariants

The analysis must make the following explicit:

- terminal exclusivity: one subscription does not both error and complete
- post-terminal silence
- cancellation is not completion
- payload transformation/preservation
- subscription independence unless sharing is explicit
- teardown/resource ownership
- timer cancellation
- current vs stale inner subscriptions
- equal-time ordering assumptions
- reentrancy boundaries
- sharing/reset policy where applicable

## Operator document target

A complete operator page should eventually contain:

1. Operator name and short purpose
2. Cω-style stream type / cardinality signature
3. Plain-language behavior
4. Input events
5. State / remembered data
6. Six-component formal model
7. BDD scenarios
8. Guarded State Transition Table
9. State diagram
10. Representative execution trace
11. Four-lane timeline where useful
12. Concurrency / cancellation / time policy
13. Lifecycle behavior
14. Invariants and edge cases
15. Test obligations
16. Runtime conformance evidence
17. Final operator behavior in plain language

The final section is intentionally understandable without reading any formal notation.

## Repository structure

```text
rxjs-formal-way/
├─ README.md
├─ CONTRIBUTORS.md
├─ docs/
│  ├─ FORMAL-METHOD.md
│  ├─ MIGRATION-MAP.md
│  └─ OPERATOR-DOCUMENT-TEMPLATE.md
├─ model/                 # machine-readable semantic models
├─ operators/             # one canonical operator artifact per RxJS operator
├─ generated/             # derived STTs, diagrams, traces, prose
├─ tests/
│  ├─ model/              # reference-model tests
│  └─ rxjs/               # actual RxJS 7.8.2 tests
└─ evidence/              # execution results and coverage records
```

Empty directories will be introduced when implementation artifacts are migrated; Git itself does not retain empty directories.

## Source projects being consolidated

The repository is intended to absorb the reusable concepts from:

- `rxjs-mealy-analysis`
- `rxjs-operator-mealy-analysis`
- `rxjs-operator-mealy-tuples`
- `rxjs-mealy-to-testcase`
- `bdd-to-mealy`
- `rxjs-comega-type-notation-and-mealy-machine-tuples`
- the Mealy-to-documentation experiments

The source repositories remain valuable historical records. Consolidation should preserve provenance rather than erase it.

See [MIGRATION-MAP.md](docs/MIGRATION-MAP.md).

## Design rule

The repository should resist parallel competing truths.

```text
ONE semantic model
        ↓
many projections
```

not:

```text
formal document
BDD document
test plan
diagram
plain prose
        ↓
five independently maintained descriptions
```

The latter inevitably drifts.

## Status

This repository is the consolidation point. The first milestone establishes the unified method and migration map. The next milestone is to define the canonical machine-readable schema and migrate one reference operator end-to-end before importing the full operator catalogue.

## Collaboration

This consolidation grew from Hans Schenker's RxJS analysis work and repeated design sessions with OpenAI models, together with useful contributions preserved in the source repositories from other AI-assisted experiments.

**GPT-5.6 Sol (OpenAI)** designed this initial consolidation architecture for `rxjs-formal-way` with Hans Schenker.

See [CONTRIBUTORS.md](CONTRIBUTORS.md).
