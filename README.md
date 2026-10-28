# RxJS Formal Way

A coherent method for describing, analyzing, documenting, visualizing, and testing **RxJS 7.8.2 operator behavior** from one explicit semantic model.

> **One semantic model, many projections; independent runtime evidence.**

The project grew from stateful transducers, through six-component Mealy analysis, to transition tables, diagrams, BDD and test obligations. Formal machinery supports the explanation; an RxJS user should not need automata theory to understand the final operator description.

## M01: the first executable vertical slice

The canonical TypeScript model, pure trace runner and first end-to-end operator profile are implemented. Read [M01 — Canonical model](docs/M01-CANONICAL-MODEL.md) and its [validation record](evidence/M01.md) for scope and executed results.

```text
src/models/take.ts   ONE rule set
         |
         +--> JSON manifest / BDD / STT / state diagram
         +--> test obligations / readable operator page
         +--> concrete trace / four-lane view
         |
model predictions <--> RxJS 7.8.2 runtime observations
```

Start with the generated [take operator page](operators/take.md), [BDD](generated/take.bdd.md), [transition table](generated/take.stt.md), [state diagram](generated/take.diagram.md) and [four-lane trace](generated/take.trace.md). These eight projections are checked for drift in CI. The model covers nonnegative safe-integer counts and atomic, non-reentrant execution; it is not a universal RxJS replacement.

## Start here

| Document | Role |
|---|---|
| [M01 schema and workflow](docs/M01-CANONICAL-MODEL.md) | Executable contract, first profile, generated artifacts and acceptance boundary |
| [Formal method](docs/FORMAL-METHOD.md) | Canonical six-tuple analysis, guarded transitions, lifecycle and evidence |
| [Composition and ownership](docs/COMPOSITION-AND-OWNERSHIP.md) | Connected machines, feedback, shared state, action ordering and execution contracts |
| [Dependent types](docs/DEPENDENT-TYPES.md) | State-indexed legal behavior, not merely a type for state |
| [Imported-document review](docs/reviews/2026-10-28-gemini-mealy.md) | Adopted ideas, corrected claims, provenance and pinned primary sources |
| [Operator document template](docs/OPERATOR-DOCUMENT-TEMPLATE.md) | Formal analysis through to a standalone plain-language explanation |
| [Migration map](docs/MIGRATION-MAP.md) | What to preserve from the earlier repositories |
| [M01 evidence](evidence/M01.md) | Schema/model/type checks, bounded runtime comparisons and remaining limits |
| [Earlier validation](evidence/2026-10-28-insights.md) | Retained 29-test baseline and its historical run |

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

Dependent types constrain the whole legal behavior, not only state. That is a specification discipline, not an implemented proof of the RxJS runtime. TypeScript can encode some related constraints but is not itself a dependent proof assistant. M01 uses discriminated unions and runtime legality checks, not a claim of full dependent typing.

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

These markers count values, not completion/error/control actions. For example, seeded `reduce` has exactly-one final-value behavior **conditional on successful completion, a successful reducer, and no early cancellation**. Errors, cancellation and noncompletion must not be hidden by an unqualified `T* → A!` claim. M01 uses `T[0..n]` as an explicit project extension for take's upper bound, not original Cω syntax.

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

Projection throws, synchronous completion and reentry need separate rules or explicit scope. The reader-facing prose must be traceable to rules rather than independently maintained. M01's annotations live beside executable rules; generation preserves rule IDs but does not prove that English matches code.

## From operators to connected machines

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

Flattening policies remain practical descriptions: `mergeMap` allows overlap; `switchMap` keeps the latest; `concatMap` queues; `exhaustMap` ignores while busy. The guide adds a corrected `expand` admission rule and distinguishes subscription feedback from recursive value expansion.

## Test obligations and evidence

> **Every reachable, behaviorally distinct transition creates a minimum test obligation.**

One obligation can need multiple concrete tests. A scenario should reach its state through public inputs, deliver the event, assert notifications and resource consequences, and use a distinguishing suffix when necessary. Row coverage is not exhaustive behavior coverage.

The retained suite contains **29 named runtime characterization tests**, including subscription marbles, synchronous cancellation, replay expiry, sharing resets, recursion order and callback-index-sensitive composition. M01 adds **25 model tests and 11 RxJS test cases**, including **465 bounded differential scenarios**. Consult the [M01 evidence](evidence/M01.md) for executed results rather than treating test-file counts as proof.

```sh
npm ci --ignore-scripts
npm run check
npm run generate          # intentionally refresh the eight generated views
npm run check:generated   # read-only drift check
```

Node 22.16.0 is used by CI. RxJS is pinned to 7.8.2 and TypeScript to 5.8.3; the lockfile also pins tslib. The read-only GitHub Actions workflow runs on pushes to main, pull requests, and manual dispatch. It does not commit or publish generated files.

## Core invariants

Keep terminal exclusivity, post-terminal silence, cancellation distinct from completion, payload correctness, resource release, timer identity, state ownership and reset behavior explicit. Separate equal-time execution order from timestamps, and ordinary atomic transitions from nested synchronous delivery.

For sharing, name the state owner and connection generation. For temporal behavior, distinguish a timestamp provider from scheduled callbacks. For a fresh subscription, do not accidentally reuse mutable reference-model state.

## Migration and status

The earlier projects remain provenance, not material to delete:

`rxjs-mealy-analysis`, `rxjs-operator-mealy-analysis`, `rxjs-operator-mealy-tuples`, `rxjs-mealy-to-testcase`, `bdd-to-mealy`, `rxjs-comega-type-notation-and-mealy-machine-tuples`, and the Mealy-to-documentation experiments.

M00 established the method and the composition/ownership review. **M01 now has an implemented canonical model and one end-to-end reference profile**, with acceptance and execution results recorded in [evidence/M01.md](evidence/M01.md). The [migration map](docs/MIGRATION-MAP.md) is the original plan; M01's detailed checkpoint and adjustments are documented in [the milestone guide](docs/M01-CANONICAL-MODEL.md).

Next is **M02: extend the reference set**, starting with map and filter, then scan, debounceTime, switchMap and share. Full generators across all families, catalogue migration, an effect interpreter and interactive visualization remain later work. The existing [operator template](docs/OPERATOR-DOCUMENT-TEMPLATE.md) remains the detailed page target; the first generated take page is the readable entry point, with its formal projections linked separately.

## Collaboration

Hans Schenker directs the research and teaching goals. The initial consolidation credits **GPT-5.6 Sol (OpenAI)** in the project history. **GPT-6 Astra Pro** is the main contributor to the source review, composition/ownership guidance, regression harness and M01 implementation. The imported Gemini discussion is credited as inspiration, not as authoritative implementation evidence.

See [CONTRIBUTORS.md](CONTRIBUTORS.md). This is an independent project, not an official RxJS or OpenAI specification.
