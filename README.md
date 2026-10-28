# RxJS Formal Way

A coherent method for describing, analyzing, documenting, visualizing, and testing **RxJS 7.8.2 operator behavior** from one explicit semantic model.

> **One semantic model, many projections; independent runtime evidence.**

The project grew from stateful transducers, through six-component Mealy analysis, to transition tables, diagrams, BDD and test obligations. Formal machinery supports the explanation; an RxJS user should not need automata theory to understand the final operator description.

## Current checkpoint: M02-A

M01 established the canonical TypeScript model, pure trace runner and take profile. M02-A adds **map and filter**, including callback indices, correlated return/throw outcomes, cancellation and subscription-local ownership. Read the [M02 guide](docs/M02-VALUE-SELECTION.md), [evidence](evidence/M02.md) and [roadmap](docs/ROADMAP.md). M02's remaining reference operators are not yet implemented.

| Operator | Readable behavior | BDD | Transition table | State diagram | Four lanes |
|---|---|---|---|---|---|
| take | [Page](operators/take.md) | [BDD](generated/take.bdd.md) | [STT](generated/take.stt.md) | [STD](generated/take.diagram.md) | [Trace](generated/take.trace.md) |
| map | [Page](operators/map.md) | [BDD](generated/map.bdd.md) | [STT](generated/map.stt.md) | [STD](generated/map.diagram.md) | [Trace](generated/map.trace.md) |
| filter | [Page](operators/filter.md) | [BDD](generated/filter.bdd.md) | [STT](generated/filter.stt.md) | [STD](generated/filter.diagram.md) | [Trace](generated/filter.trace.md) |

Each has eight generated projections: the five linked above, a JSON manifest, JSON trace and test-obligation document. All **24** are checked for drift. These are scoped reference models, not replacement RxJS operators.

## Start here

| Document | Role |
|---|---|
| [Operator profiles](operators/README.md) | Implemented profiles and canonical sources |
| [M01 schema and workflow](docs/M01-CANONICAL-MODEL.md) | First executable contract and take profile |
| [M02 value selection](docs/M02-VALUE-SELECTION.md) | Callback-separated map/filter profiles and schema 1.1 |
| [Roadmap](docs/ROADMAP.md) | Implemented and remaining checkpoints |
| [Formal method](docs/FORMAL-METHOD.md) | Six-tuple analysis, guarded transitions, lifecycle and evidence |
| [Composition and ownership](docs/COMPOSITION-AND-OWNERSHIP.md) | Connected machines, feedback, shared state and execution contracts |
| [Dependent types](docs/DEPENDENT-TYPES.md) | State-indexed legal behavior, not merely a type for state |
| [Imported-document review](docs/reviews/2026-10-28-gemini-mealy.md) | Adopted ideas, corrected claims, provenance and pinned sources |
| [Operator document template](docs/OPERATOR-DOCUMENT-TEMPLATE.md) | Formal analysis through to plain-language explanation |
| [Migration map](docs/MIGRATION-MAP.md) | Original consolidation plan and source repositories |
| [M01 evidence](evidence/M01.md) / [M02 evidence](evidence/M02.md) | Executed results, bounded comparisons and remaining limits |
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

A state-transition diagram and state-transition table are views of the same rules. Traces instantiate paths through them. Tests compare predictions with actual RxJS behavior; these artifacts need not form a strictly serial conversion chain.

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

Both functions use the same pre-event state. A combined reaction computes the pair once. Arbitrary payloads, counters, buffers and identities make this an extended, potentially symbolic Mealy-style transducer, not automatically a finite automaton.

Source/outer/inner notifications have explicit origins. Subscription and cancellation are control events, not notifications. Timer firings carry identities; sources and schedulers supply time. Initialization can complete without acquiring the source, as take(0) demonstrates.

## Callback boundary added in M02-A

```text
source.next(value)
       ↓
request one callback invocation(value, index)
       ↓
correlated callback.return(result) or callback.throw(error)
       ↓
map: forward result
filter: forward original input or emit nothing
throw: error and release source
```

The pure model never executes a business function in a guard or reaction. A named callback binding replaces executable code in the model declaration. Calling is a synchronous logical phase, not a timer, Promise conversion, or queued execution policy. The test-only adapter supplies concrete outcomes; a production effect interpreter remains future work.

Map and filter each remember a per-subscription index. A dropped filter value still consumes an index. The source may be hot while the operator's counter remains subscription-local. No sharing is introduced by these profiles.

## Six complementary methods

| Method | Role |
|---|---|
| Cω-style notation | Dataflow shape and qualified cardinality |
| Dependent types | Which whole transitions are legal in the model |
| Mealy analysis | State, events, next state and ordered actions |
| BDD | User-readable projection of behavioral rules |
| Four-lane diagram | Time, inputs, control state and outputs in one trace |
| Test cases | Independent conformance evidence against RxJS |

```text
Behavior :
  (state : S) →
  (event : E state) →
  Σ (nextState : S). Actions state event nextState
```

Dependent types constrain the whole legal behavior, not only state. Our TypeScript implementation uses discriminated unions and runtime legality checks; it is not a dependent proof assistant or a proof of RxJS's implementation.

```text
T!       exactly one value
T?       zero or one
T+       one or more
T*       zero or more
A × B    both
A + B    either
(T*)*    streams of streams
```

These Cω-inspired markers count values, not terminal/control actions. Seeded reduce's exactly-one final value requires successful completion and no earlier cancellation or reducer error. `T[0..n]` is a project extension for take's upper bound, not original Cω syntax.

## Readable behavior on top

```text
Given <current state and precondition>
When  <input event>
Then  <ordered action>
Then  <ordered action>
And   <next state>
```

In this restricted Convertible BDD profile, And denotes the next state, not general Gherkin conjunction. Mealy-DSL uses While instead of Given. English annotations live beside executable rules; generation retains their IDs and prevents file drift but does not prove prose equivalent to code. Literal assertions and independent runtime observations provide separate evidence.

The final operator page remains the teaching outcome. A reader need not inspect the formal tuple to understand what flows over time or what happens on a new value.

## Connected machines and execution contracts

```text
local transition models
         +
connection / ownership graph
         +
explicit execution contract
         ↓
pipeline and shared-machine behavior
```

The imported Gemini discussion motivates composition, feedback and addressed output. The [review](docs/reviews/2026-10-28-gemini-mealy.md) distinguishes those ideas from corrected implementation claims. Pure finite-word cascade composition is useful, but full RxJS behavior also needs reverse cancellation, initialization, resources, callback order, scheduling and sharing/reset policies. A FIFO interpreter is not a semantics-neutral fix for reentrancy.

Flattening policies remain practical: mergeMap allows overlap, switchMap keeps the latest, concatMap queues and exhaustMap ignores while busy. The composition guide includes corrected expand admission semantics and distinguishes subscription feedback from recursive value expansion.

## Tests, generated artifacts and evidence

> Every reachable, behaviorally distinct transition creates a minimum test obligation.

One obligation can require multiple tests. Reach the state through public inputs, provide the target event, assert notifications and resource consequences, then use a distinguishing suffix when necessary. Row coverage is not exhaustive behavior coverage.

M01's baseline has 65 named tests, including 465 bounded take comparisons. M02-A adds 31 model tests and 23 runtime cases, with 1302 additional bounded comparisons in one case. Eight new negative type assertions supplement M01's six. Refer to the milestone evidence records for actual execution results rather than treating these counts as proof.

```sh
npm ci --ignore-scripts
npm run check
npm run test:model
npm run generate          # intentionally refresh 24 projections
npm run check:generated   # read-only drift check
```

Node 22.16.0, RxJS 7.8.2 and TypeScript 5.8.3 are the declared validation baseline; the lockfile also pins tslib. The existing read-only GitHub Actions workflow installs dependencies and checks types, tests, syntax and generated files. It does not commit or publish artifacts.

## Invariants, migration and provenance

Keep terminal exclusivity, post-terminal silence, cancellation distinct from completion, payload identity, resource release, timer/call identity, state ownership and reset behavior explicit. Separate equal-time ordering from timestamps and scoped atomic reactions from arbitrary nested delivery. Fresh executions must not accidentally share mutable model state.

Earlier repositories remain provenance, not material to delete: rxjs-mealy-analysis, rxjs-operator-mealy-analysis, rxjs-operator-mealy-tuples, rxjs-mealy-to-testcase, bdd-to-mealy, rxjs-comega-type-notation-and-mealy-machine-tuples, and the Mealy-to-documentation experiments.

M02 continues next with scan, then time-sensitive, higher-order and shared profiles. Full catalogue migration, a general effect interpreter, dependent proofs and interactive visualization remain later work. The [roadmap](docs/ROADMAP.md) is the current implementation tracker; the migration map retains the original broader plan.

## Collaboration

Hans Schenker directs the research and teaching goals. The initial consolidation credits **GPT-5.6 Sol (OpenAI)** in project history. **GPT-6 Astra Pro** is the main contributor to the source review, composition/ownership guidance, regression harness and M01/M02-A implementations. The supplied Gemini discussion is credited as inspiration, not authoritative implementation evidence.

See [CONTRIBUTORS.md](CONTRIBUTORS.md). This is an independent project, not an official RxJS or OpenAI specification.
