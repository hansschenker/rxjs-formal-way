# M01 — Canonical model and first end-to-end operator

**Baseline:** RxJS 7.8.2 at commit `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.
**Schema:** 1.0; TypeScript 5.8.3; Node 22.16.0.
**Status:** implemented first scoped vertical slice; see [execution evidence](../evidence/M01.md).

## What flows through this milestone

An operator description now has one executable TypeScript declaration, not separately maintained implementations of its table, diagram and scenarios. The first declaration is `createTakeModel<T>(count)` in [src/models/take.ts](../src/models/take.ts).

```text
Canonical OperatorModel
  + executable guarded rules
  + human-readable annotations on those same rules
           |
           +--> JSON manifest
           +--> BDD
           +--> STT
           +--> state-transition diagram
           +--> test obligations
           +--> readable operator page
           |
concrete inputs --> pure model runner --> trace JSON + four-lane Markdown
           |
model predictions <--> independently observed RxJS notifications/lifetimes
```

Annotations are authored and reviewed alongside the executable rule. Generation guarantees shared identity and reproducibility, not that English prose has been mathematically proved equivalent to the function body. Literal tests and runtime comparisons supply separate checks.

## Canonical schema

[src/schema.ts](../src/schema.ts) defines `OperatorModel<P,S,E,A>`:

| Field | Role |
|---|---|
| `metadata` | Identity, version, scope, initialization, ownership, dispatch, alphabets, control-state projection, sources and evidence references |
| `parameters` | Fixed configuration; not a seventh Mealy component |
| `initialState()` | Fresh per-execution state factory |
| `control(state)` | Projection from stored state to a diagram node |
| `validateState` | Operator-specific state invariants |
| `validateReaction` | Operator-specific constraints on the whole reaction |
| `rules` | Guarded, named transitions with human descriptions and executable reactions |

A rule has an ID, source control state, event type, guard description, target control state, ordered action descriptions, next-state description, test-obligation IDs, and a plain-language explanation. `enabled` selects it; `react` computes `{ state, actions }` **once**. This combined calculation implements T and G over the same pre-event state.

The action vocabulary currently supports addressed notification, subscription acquisition/release, timer scheduling and timer cancellation. Timer actions are schema capabilities only: M01 implements no timer driver. Higher-order projection commands and shared reset interpreters will require later extensions, not silent overloading of these tags.

All notifications and lifecycle commands occupy **one ordered array**. Subscriber targets, resource IDs and generations remain explicit. A resource generation is local to the trace's `executionId`; IDs from different executions are not globally interchangeable.

## Execution boundary

The runner in [src/runner.ts](../src/runner.ts) is a specification runner, not an `OperatorFunction` implementation. It does not subscribe to RxJS, deliver observer callbacks, run user business functions, or operate a clock. It returns actions as data.

It rejects a missing rule and rejects multiple enabled rules. It does not silently pick the first guard. Structural validation checks IDs, references, annotations and the initial state. It is not a solver for universal symbolic guard coverage or reachability.

`runTrace` accepts time-stamped inputs. Times must be finite, nonnegative and nondecreasing. Inputs with the same timestamp retain their array order and receive distinct sequence numbers. Every trace step records model ID, execution ID, rule ID, input, before/after state and the ordered action word.

A step budget yields `budget-exhausted`, not a divergence theorem. `finished-input` means that the supplied finite input list was consumed; the resulting stream may still be active. The state and remaining inputs are the caller's responsibility. Traces retain payload references; they are not deep-cloned time-travel snapshots.

## First reference: take(n)

The scope is deliberately precise: n is a **nonnegative safe integer**; externally supplied events are non-reentrant; cancellation is between complete reactions; observers and teardowns do not throw. Unsupported numeric arguments are excluded by the model, not asserted to be rejected by RxJS.

```text
Unsubscribed
  subscribe, n = 0 --> Closed / complete
  subscribe, n > 0 --> Active(seen = 0) / subscribe source

Active(seen)
  source.next, seen + 1 < n --> Active(seen + 1) / next(value)
  source.next, seen + 1 = n --> Closed / next(value), complete, release source
  source.complete          --> Closed / complete, release source
  source.error             --> Closed / error, release source
  cancel                   --> Closed / release source
```

Seven symbolic rules cover this parameterized profile. A particular instance need not reach all seven: n=0 cannot reach Active; n=1 cannot use the ordinary below-quota next rule. The model tests report rule coverage across several configurations, not seven reachable rows for every n.

Closed has no admissible inputs. A late source attempt is a separate runtime robustness observation, not a legal model event. The runner rejects it rather than claiming RxJS throws for such an attempt.

The source-release action is a lifecycle observation at quiescence. It does not claim every internal finalizer runs at the same microstep. Completion/error and release ordering is characterized with non-reentrant observers. Cancellation inside a `next` handler and nested callbacks need refined delivery states; they are not implemented by wrapping this atomic model in a FIFO queue.

The count belongs to each take subscription even when the input producer is hot. No sharing is introduced. Time comes from the input trace or the actual source and test scheduler, not from take or the runner.

## Artifacts and commands

| Artifact | Role |
|---|---|
| [Operator page](../operators/take.md) | Standalone behavior, cardinality conditions, time and sharing |
| [JSON manifest](../generated/take.manifest.json) | Descriptive schema projection; no executable function bodies |
| [BDD](../generated/take.bdd.md) | Convertible BDD rules, using the project's restricted And convention |
| [STT](../generated/take.stt.md) | Guarded transitions and obligation IDs |
| [STD](../generated/take.diagram.md) | Mermaid control-state graph |
| [Obligations](../generated/take.obligations.md) | Rule-to-runtime-test links |
| [Trace JSON](../generated/take.trace.json) | Concrete predicted execution with stable sequence numbers |
| [Four lanes](../generated/take.trace.md) | Time, inputs, state and output, plus full ordered-action table |

```sh
npm ci --ignore-scripts
npm run check             # syntax, positive/negative types, all tests, generated-file drift
npm run test:model        # scoped pure reference-model checks
npm run generate          # intentionally regenerate eight projections
npm run check:generated   # read-only exact-byte comparison
```

The JSON manifest is **not** a JSON Schema standard document and cannot be loaded as executable behavior. The canonical contract is TypeScript. A JSON loader and broader schema evolution are deferred. Exported traces use JSON-safe example payloads; arbitrary JavaScript objects, cyclic data, undefined and Error objects need an explicit serialization codec before lossless export can be claimed.

## Verification and traceability

The suite contains 25 model/generator tests and 11 new RxJS test cases; one of the latter performs 465 bounded differential comparisons. The 29 existing insight tests are retained unchanged. See the evidence record for what was actually executed.

The bounded experiment enumerates n=0..4, all words of length 0..4 over {a,b}, and three endings: source completion, source error and downstream cancellation. Thus 5 * 31 * 3 = 465 comparisons. Each compares time-stamped downstream notifications **and** source subscription/release observations. These bounds are not exhaustive coverage of all JavaScript values, all integers or all interleavings.

Six `@ts-expect-error` cases check forbidden payloads, unsupported event kinds, missing state data, cancellation-as-notification, incomplete resource identities and mutation of readonly parameters. TypeScript does not implement the dependent `E(state)` relation from our formal document: an otherwise well-typed event can still be illegal in the current runtime state. The runtime validator handles that boundary explicitly.

## Acceptance and remaining milestones

M01's first vertical slice includes the schema, strict rule selection, trace runner, deterministic projections, one scoped operator, literal expectations, runtime conformance tests and evidence. The existing 29-test baseline is not replaced.

This does not complete all seven reference operators, the catalogue migration, an interactive visualizer, a universal RxJS interpreter, dependent proofs, exhaustive model checking, or arbitrary reentrancy. The next milestone is **M02: migrate additional reference operators using this schema**, first map and filter with index/callback-throw behavior, then scan, debounceTime, switchMap and share. Their new capabilities must extend the contract explicitly and preserve the regression baseline.

## Sources and provenance

- [Pinned take implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/take.ts)
- [Pinned Subscriber lifecycle](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)
- [Composition and ownership requirements](COMPOSITION-AND-OWNERSHIP.md)
- [Imported-document review and corrections](reviews/2026-10-28-gemini-mealy.md)
- [Dependent behavior discipline and its intended role](DEPENDENT-TYPES.md)
- [TypeScript discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

The imported discussion motivated the pure state/event/action separation. M01 follows the project's corrected source-scoped interpretation, not its unverified universal wrappers.
