# RxJS Formal Way

A coherent method for describing, analyzing, documenting, visualizing, and testing **RxJS 7.8.2 operator behavior** from one explicit semantic model.

> **One semantic model, many projections; independent runtime evidence.**

The project grew from stateful transducers, through six-component Mealy analysis, to transition tables, diagrams, BDD and test obligations. Formal machinery supports the explanation; an RxJS user should not need automata theory to understand the final operator description.

## Current checkpoint: Session 3 — inner-source flattening and replay

The **31 October 2026 Europe/Zurich** session carried and completed five
unfinished exports: **switchAll, mergeAll, concatAll, exhaustAll and
shareReplay**. All five are accepted within their declared scopes.
Both the full push CI and independent read-only PR CI passed **511
named tests** and validated **128 deterministic projections**.
[Session 3 evidence](evidence/SESSION-03.md) records exact tested
commits and limits; [the guide](docs/SESSION-03-FLATTEN-AND-REPLAY.md)
explains source, lifecycle and replay behavior.

Earlier accepted exports are retained. The
[daily plan](docs/DAILY-GENERATION-PLAN.md),
[live queue](planning/operator-generation.json),
[31 October session log](planning/sessions/2026-10-31.json),
and [roadmap](docs/ROADMAP.md) govern continuation.
**98 of 113 exports remain pending.**

| Operator/profile | Readable behavior | BDD | Transition table | State diagram | Four lanes |
|---|---|---|---|---|---|
| take | [Page](operators/take.md) | [BDD](generated/take.bdd.md) | [STT](generated/take.stt.md) | [STD](generated/take.diagram.md) | [Trace](generated/take.trace.md) |
| map | [Page](operators/map.md) | [BDD](generated/map.bdd.md) | [STT](generated/map.stt.md) | [STD](generated/map.diagram.md) | [Trace](generated/map.trace.md) |
| filter | [Page](operators/filter.md) | [BDD](generated/filter.bdd.md) | [STT](generated/filter.stt.md) | [STD](generated/filter.diagram.md) | [Trace](generated/filter.trace.md) |
| scan, seeded | [Page](operators/scan-seeded.md) | [BDD](generated/scan-seeded.bdd.md) | [STT](generated/scan-seeded.stt.md) | [STD](generated/scan-seeded.diagram.md) | [Trace](generated/scan-seeded.trace.md) |
| scan, unseeded | [Page](operators/scan-unseeded.md) | [BDD](generated/scan-unseeded.bdd.md) | [STT](generated/scan-unseeded.stt.md) | [STD](generated/scan-unseeded.diagram.md) | [Trace](generated/scan-unseeded.trace.md) |
| debounceTime | [Page](operators/debounceTime.md) | [BDD](generated/debounceTime.bdd.md) | [STT](generated/debounceTime.stt.md) | [STD](generated/debounceTime.diagram.md) | [Trace](generated/debounceTime.trace.md) |
| switchMap | [Page](operators/switchMap.md) | [BDD](generated/switchMap.bdd.md) | [STT](generated/switchMap.stt.md) | [STD](generated/switchMap.diagram.md) | [Trace](generated/switchMap.trace.md) |
| mergeMap, concurrency 2 | [Page](operators/mergeMap.md) | [BDD](generated/mergeMap.bdd.md) | [STT](generated/mergeMap.stt.md) | [STD](generated/mergeMap.diagram.md) | [Trace](generated/mergeMap.trace.md) |
| concatMap | [Page](operators/concatMap.md) | [BDD](generated/concatMap.bdd.md) | [STT](generated/concatMap.stt.md) | [STD](generated/concatMap.diagram.md) | [Trace](generated/concatMap.trace.md) |
| exhaustMap | [Page](operators/exhaustMap.md) | [BDD](generated/exhaustMap.bdd.md) | [STT](generated/exhaustMap.stt.md) | [STD](generated/exhaustMap.diagram.md) | [Trace](generated/exhaustMap.trace.md) |
| share, default resets | [Page](operators/share.md) | [BDD](generated/share.bdd.md) | [STT](generated/share.stt.md) | [STD](generated/share.diagram.md) | [Trace](generated/share.trace.md) |
| switchAll | [Page](operators/switchAll.md) | [BDD](generated/switchAll.bdd.md) | [STT](generated/switchAll.stt.md) | [STD](generated/switchAll.diagram.md) | [Trace](generated/switchAll.trace.md) |
| mergeAll | [Page](operators/mergeAll.md) | [BDD](generated/mergeAll.bdd.md) | [STT](generated/mergeAll.stt.md) | [STD](generated/mergeAll.diagram.md) | [Trace](generated/mergeAll.trace.md) |
| concatAll | [Page](operators/concatAll.md) | [BDD](generated/concatAll.bdd.md) | [STT](generated/concatAll.stt.md) | [STD](generated/concatAll.diagram.md) | [Trace](generated/concatAll.trace.md) |
| exhaustAll | [Page](operators/exhaustAll.md) | [BDD](generated/exhaustAll.bdd.md) | [STT](generated/exhaustAll.stt.md) | [STD](generated/exhaustAll.diagram.md) | [Trace](generated/exhaustAll.trace.md) |
| shareReplay | [Page](operators/shareReplay.md) | [BDD](generated/shareReplay.bdd.md) | [STT](generated/shareReplay.stt.md) | [STD](generated/shareReplay.diagram.md) | [Trace](generated/shareReplay.trace.md) |

Each configured example has eight generated projections: the five linked above, a JSON manifest, JSON trace and test-obligation document. The registry produces **128** views across sixteen examples and fifteen distinct operator names. Test configurations additionally cover mergeMap concurrency 1/unbounded and all eight boolean share reset combinations. These are scoped reference models, not replacement RxJS operators.

## Start here

| Document | Role |
|---|---|
| [Operator profiles](operators/README.md) | Implemented profiles and canonical sources |
| [M01 schema and workflow](docs/M01-CANONICAL-MODEL.md) | First executable contract and take profile |
| [M02 value selection](docs/M02-VALUE-SELECTION.md) | Callback-separated map/filter profiles and schema 1.1 |
| [M02-B accumulation](docs/M02-B-SCAN.md) | Seeded/unseeded scan, typed reducer inputs and reference ownership |
| [M02-C temporal behavior](docs/M02-C-DEBOUNCE-TIME.md) | Deadline versus wake-up, timer identities, zero delay and same-time order |
| [Session 3 — All family and replay](docs/SESSION-03-FLATTEN-AND-REPLAY.md) | Inner-source policies, shared replay memory, external time and verification |
| [Session 2 higher-order behavior](docs/SESSION-02-HIGHER-ORDER.md) | Four admission policies, per-operator six-tuples, legal behavior and inner generations |
| [M02-E shared execution](docs/M02-E-SHARE.md) | Addressed subscribers, connection ownership and boolean reset policies |
| [Roadmap](docs/ROADMAP.md) | Implemented and remaining checkpoints |
| [Daily plan](docs/DAILY-GENERATION-PLAN.md) | One local-date session, at most five distinct pending names |
| [Formal method](docs/FORMAL-METHOD.md) | Six-tuple analysis, guarded transitions, lifecycle and evidence |
| [Composition and ownership](docs/COMPOSITION-AND-OWNERSHIP.md) | Connected machines, feedback, shared state and execution contracts |
| [Dependent types](docs/DEPENDENT-TYPES.md) | State-indexed legal behavior, not merely a type for state |
| [Imported-document review](docs/reviews/2026-10-28-gemini-mealy.md) | Adopted ideas, corrected claims, provenance and pinned sources |
| [Operator document template](docs/OPERATOR-DOCUMENT-TEMPLATE.md) | Formal analysis through to plain-language explanation |
| [Migration map](docs/MIGRATION-MAP.md) | Original consolidation plan and source repositories |
| [M01](evidence/M01.md) / [M02-A](evidence/M02.md) / [M02-B](evidence/M02-B.md) / [M02-C](evidence/M02-C.md) / [Session 2](evidence/SESSION-02.md) evidence | Executed results, bounded comparisons and remaining limits |
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

M02-B reuses this boundary with `{ accumulator, value }` as the typed callback payload plus the source index. A successful result becomes both the next accumulation and the emitted value. An absent seed has a separate first-value rule; an explicit undefined seed is still present. See the [scan profile guide](operators/scan.md).

Session 2 reuses the same protocol for a projection returning an opaque inner-source token. Subscription identity is distinct from the source token. Queuing delays projection; exhaustMap's ignored arrivals do not consume its projection index. The model never executes or inspects an inner producer.

## Scheduler boundary added in M02-C

A silence deadline and a scheduled wake-up are different state fields. RxJS 7.8.2 replaces the pending value/time on new input without immediately rescheduling an existing task. When that task fires early relative to the latest deadline, it rearms for the remaining duration. A due firing releases its task and emits; completion flushes; error and cancellation discard.

Clock readings and timer firings come from the environment. The clock-aware trace wrapper verifies envelope/event agreement. Equal timestamps retain an explicit execution order. The scoped deferred scheduler is not a universal policy for inline zero-delay schedulers. [M02-C](docs/M02-C-DEBOUNCE-TIME.md) documents these boundaries and the independent scheduler tests.

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

These Cω-inspired markers count values, not terminal/control actions. Seeded reduce's exactly-one final value requires successful completion and no earlier cancellation or reducer error. `T[0..n]` is a project extension for take's upper bound, not original Cω syntax. The share guide labels its `Shared(...)` ownership annotation as another project extension.

## Readable behavior on top

```text
Given <current state and precondition>
When  <input event>
Then  <ordered action>
Then  <ordered action>
And   <next state>
```

In this restricted Convertible BDD profile, And denotes the next state, not general Gherkin conjunction. Mealy-DSL uses While instead of Given. English annotations live beside executable rules; generation retains their IDs and prevents file drift but does not prove prose equivalent to code. Literal assertions and independent runtime observations provide separate evidence.

The final operator page remains the teaching outcome. A reader need not inspect the formal tuple to understand what flows over time or what happens on a new value. Standalone generated files remain first-class outputs, with the milestone guides connecting the full analysis.

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

Share changes ownership: one coordinator for a shared Observable instance tracks downstream subscription occurrences and connection generations. A retained terminal state still accepts later subscribers. This does not silently add replay or a reset-notifier implementation.

## Tests, generated artifacts and evidence

> Every reachable, behaviorally distinct transition creates a minimum test obligation.

One obligation can require multiple tests. Reach the state through public inputs, provide the target event, assert notifications and resource consequences, then use a distinguishing suffix when necessary. Row coverage is not exhaustive behavior coverage.

The pre-Session-2 baseline contains 223 named tests, 32 negative type assertions and 8649 bounded model/RxJS scenarios. Session 2 adds 107 pure-model tests, 85 native-RxJS cases, 16 negative type assertions and 14348 bounded comparisons. The first full CI run passed all 415 named tests, compiled 48 negative type assertions, checked 88 projections and exercised 22997 model/RxJS scenarios. The retained 5022 scheduler-transparency comparisons are a separate observation check. Consult the evidence records for exact revisions, committed-file verification and scope; counts are not a universal proof.

```sh
npm ci --ignore-scripts
npm run check
npm run test:model
npm run generate          # intentionally refresh 128 projections
npm run check:generated   # read-only drift check
```

Node 22.16.0, RxJS 7.8.2 and TypeScript 5.8.3 are the validation baseline; the lockfile also pins tslib. The live workflow generates on main pushes, runs all checks, and commits changed generated artifacts only after success. Pull requests and manual dispatch run checks without regeneration or publication. The connector currently exposes no manual-dispatch action, so Session 2 uses a separate pull-request run to check the committed generated tree. This distinguishes regeneration success from a genuine committed-file drift check without changing the existing workflow.

## Invariants, migration and provenance

Keep terminal exclusivity, post-terminal silence, cancellation distinct from completion, payload identity, resource release, timer/call identity, state ownership and reset behavior explicit. Separate equal-time ordering from timestamps and scoped atomic reactions from arbitrary nested delivery. Fresh executions need separate bookkeeping; supplied seed objects are not automatically cloned, as scan's ownership tests make explicit.

Earlier repositories remain provenance, not material to delete: rxjs-mealy-analysis, rxjs-operator-mealy-analysis, rxjs-operator-mealy-tuples, rxjs-mealy-to-testcase, bdd-to-mealy, rxjs-comega-type-notation-and-mealy-machine-tuples, and the Mealy-to-documentation experiments.

Continue only according to the live queue and dated session log. Unfinished names carry first; at most five distinct names are worked on per local-date session. The next pending batch is distinctUntilChanged, distinctUntilKeyChanged, distinct, pairwise and startWith. Full catalogue migration, a general effect interpreter, dependent proofs and interactive visualization remain later work. The migration map preserves the original broader plan.

## Collaboration

**GPT-6 (OpenAI)** is the main AI contributor to Session 3's
identity-source flattening, shared replay models and independent runtime
tests. Historical contributor credits remain intact.

Hans Schenker directs the research and teaching goals. The initial consolidation credits **GPT-5.6 Sol (OpenAI)** in project history. **GPT-6 Astra Pro** is the main contributor to the source review, composition/ownership guidance, regression harness and M01/M02/Session-2 implementations. The supplied Gemini discussion is credited as inspiration, not authoritative implementation evidence.

See [CONTRIBUTORS.md](CONTRIBUTORS.md). This is an independent project, not an official RxJS or OpenAI specification.
