# RxJS Formal Way

A coherent method for describing, analyzing, documenting, visualizing, and testing **RxJS 7.8.2 operator behavior** from one explicit semantic model.

> **One semantic model, many projections; independent runtime evidence.**

The project grew from stateful transducers, through six-component Mealy analysis, to transition tables, diagrams, BDD and test obligations. Formal machinery supports the explanation; an RxJS user should not need automata theory to understand the final operator description.

## Start here

| Document | Role |
|---|---|
| [Formal method](docs/FORMAL-METHOD.md) | Canonical six-tuple analysis, guarded transitions, lifecycle and evidence |
| [Composition and ownership](docs/COMPOSITION-AND-OWNERSHIP.md) | New: connected machines, feedback, shared state, action ordering and execution contracts |
| [Dependent types](docs/DEPENDENT-TYPES.md) | State-indexed legal behavior, not merely a type for state |
| [Imported-document review](docs/reviews/2026-10-28-gemini-mealy.md) | Adopted ideas, corrected claims, provenance and pinned primary sources |
| [Operator document template](docs/OPERATOR-DOCUMENT-TEMPLATE.md) | Formal analysis through to a standalone plain-language explanation |
| [Migration map](docs/MIGRATION-MAP.md) | What to preserve from the earlier repositories |
| [Validation record](evidence/2026-10-28-insights.md) | Executed checks, runtime-test status and remaining limits |

## One behavioral model

```text
Pinned RxJS source + exact configuration + execution scope
                           ↓
                 M = (S, S₀, Z, A, T, G)
                           ↓
                Guarded transition rules
           ┌───────────────┼─────────────────┐
           ↓               ↓                 ↓
       BDD / prose      STT / diagram       Test obligations
                           ↓                 ↓
                    Concrete traces     RxJS runtime checks
                           ↓                 ↓
                    Four-lane view       Evidence
```

A state-transition diagram (STD) and state-transition table (STT) are views of the same rules. Traces instantiate paths through those rules. Tests compare model predictions with actual RxJS behavior. They are not required to form a strictly serial conversion chain.

| Component | Meaning | Question |
|---|---|---|
| S | State space | What can this execution remember? |
| S₀ | Initial state | What is established at initialization? |
| Z | Input alphabet | Which events can make it react? |
| A | Action/output alphabet | Which notification or resource actions can it produce? |
| T | Transition function | What state follows the event? |
| G | Action function | What ordered action word follows the event? |

```text
T : S × Z → S
G : S × Z → A*
```

Both functions use the same pre-event state. A combined step can compute the pair once; the notation does not require evaluating a supplied callback twice. Arbitrary payloads, counters, buffers and inner identities make this an **extended, potentially symbolic Mealy-style transducer**, not automatically a finite automaton.

Source/outer/inner next, error and completion have explicit origins. Subscription and cancellation are control events, not notifications. Timer firings carry identities; sources and schedulers supply time. Initialization can complete without subscribing upstream.

## Six complementary methods

| Method | Role |
|---|---|
| Cω-style notation | Dataflow shape and qualified cardinality |
| Dependent types | Which whole transitions are legal in the model |
| Mealy analysis | State, events, next state and ordered actions |
| BDD | User-readable projection of behavioral rules |
| Four-lane diagram | Time, inputs, control state and outputs in one concrete trace |
| Test cases | Independent conformance evidence against RxJS |

```text
Behavior :
  (state : S) →
  (event : E state) →
  Σ (nextState : S). Actions state event nextState
```

Dependent types constrain the whole legal behavior, not only state. That is a specification discipline, not an implemented proof of the RxJS runtime. TypeScript can encode some related constraints but is not itself a dependent proof assistant.

Cω-inspired teaching shorthand:

```text
T!       exactly one value
T?       zero or one
T+       one or more
T*       zero or more
A × B    both
A + B    either
(T*)*    streams of streams
```

These markers count values, not completion/error/control actions. For example, seeded `reduce` has exactly-one final-value behavior **conditional on successful completion, a successful reducer, and no early cancellation**. Errors, cancellation and noncompletion must not be hidden by an unqualified `T* → A!` claim.

## Readable behavior on top

```text
Given <current state and precondition>
When  <input event>
Then  <ordered action>
Then  <ordered action>
And   <next state>
```

In this project's restricted Convertible BDD profile, `And` denotes the next state; this is not a claim about general Gherkin syntax. The corresponding Mealy-DSL uses `While` instead of `Given`.

For a scoped, successful `switchMap` replacement:

```text
Given an inner subscription is active
When the outer source emits a new value
Then unsubscribe the current inner
Then project the new value
Then subscribe to the new inner
And the new inner is active
```

Projection throws, synchronous completion and reentry need separate rules or explicit scope. The reader-facing prose must be traceable to rules rather than independently maintained.

## New: from operators to connected machines

The imported Gemini discussion contributes useful ideas for composition, feedback and subscriber-addressed output. The [review](docs/reviews/2026-10-28-gemini-mealy.md) separates those ideas from claims that need correction.

The adopted extension is:

```text
local transition models
         +
connection / ownership graph
         +
explicit execution contract
         ↓
pipeline and shared-machine behavior
```

Pure finite-word cascade composition is a useful starting point. Full RxJS behavior also needs reverse cancellation, initialization, resource lifetimes, callback ordering, scheduling and sharing/reset policies. A FIFO interpreter is an explicit policy, not a semantics-neutral fix for reentrancy.

Flattening policies remain practical descriptions: `mergeMap` allows overlap; `switchMap` keeps the latest; `concatMap` queues; `exhaustMap` ignores while busy. The new guide adds a corrected `expand` admission rule and distinguishes subscription feedback from recursive value expansion.

## Test obligations and evidence

> **Every reachable, behaviorally distinct transition creates a minimum test obligation.**

One obligation can need multiple concrete tests. A scenario should reach its state through public inputs, deliver the event, assert notifications and resource consequences, and use a distinguishing suffix when necessary. Row coverage is not exhaustive behavior coverage.

The new suite contains **29 named runtime characterization tests**, including subscription marbles, synchronous cancellation, replay expiry, sharing resets, recursion order and callback-index-sensitive composition. Their execution status is recorded separately in [evidence](evidence/2026-10-28-insights.md).

```sh
npm ci --ignore-scripts
npm run check
```

Node 22.16.0 is used by CI. RxJS is pinned to 7.8.2; the lockfile also pins tslib. The read-only GitHub Actions workflow runs on pushes to main, pull requests, and manual dispatch. No universal interpreter, completed canonical schema, generated operator catalogue, or interactive simulator is claimed by this update.

## Core invariants

Keep terminal exclusivity, post-terminal silence, cancellation distinct from completion, payload correctness, resource release, timer identity, state ownership and reset behavior explicit. Separate equal-time execution order from timestamps, and ordinary atomic transitions from nested synchronous delivery.

For sharing, name the state owner and connection generation. For temporal behavior, distinguish a timestamp provider from scheduled callbacks. For a fresh subscription, do not accidentally reuse mutable reference-model state.

## Migration and status

The earlier projects remain provenance, not material to delete:

`rxjs-mealy-analysis`, `rxjs-operator-mealy-analysis`, `rxjs-operator-mealy-tuples`, `rxjs-mealy-to-testcase`, `bdd-to-mealy`, `rxjs-comega-type-notation-and-mealy-machine-tuples`, and the Mealy-to-documentation experiments.

M00 establishes the method. This update adds the composition/ownership review and a scoped regression harness. **M01 remains open:** define the canonical schema with initialization, ownership, dispatch and ordered actions, then migrate one operator end to end before expanding to `map`, `filter`, `take`, `scan`, `debounceTime`, `switchMap` and `share`.

The [operator template](docs/OPERATOR-DOCUMENT-TEMPLATE.md) remains the detailed page format. Apply the schema and acceptance requirements in the new composition guide alongside it; its final plain-language explanation remains the teaching outcome.

## Collaboration

Hans Schenker directs the research and teaching goals. The initial consolidation credits **GPT-5.6 Sol (OpenAI)** in the project history. **GPT-6 Astra Pro** is the main contributor to this source review, composition/ownership guidance and regression-harness update. The imported Gemini discussion is credited as inspiration, not as authoritative implementation evidence.

See [CONTRIBUTORS.md](CONTRIBUTORS.md). This is an independent project, not an official RxJS or OpenAI specification.
