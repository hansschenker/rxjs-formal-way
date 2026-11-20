# Executable operator profiles

## Start with the Operator Inspection Index

For every modeled public export, open `<operator>-index.md` first—for example [audit-index.md](audit-index.md). The generated index gives the same eleven-step path through Overview, Diagram, STT, BDD, Trace, Obligations, Manifest, Canonical Model, pinned RxJS source, Tests, and Evidence.

The repository-wide method is documented in [RxJS Operator Inspection Workflow](../docs/OPERATOR-INSPECTION-WORKFLOW.md).

Each configured profile has one canonical TypeScript rule set and eight generated views. Read the plain-language page first; use the milestone guide for assumptions and verification.

## Session 23 inspection pages

| Export | Behavior to inspect | Inspection index |
|---|---|---|
| zip | Deprecated pipeable entry; source-first acquisition and FIFO pairing by position | [zip](zip-index.md) |
| zipAll | Collect inner descriptions until outer completes, then connect and pair their queued values | [zipAll](zipAll-index.md) |
| zipWith | Pipeable FIFO tuple policy with independent evidence for the nondeprecated export | [zipWith](zipWith-index.md) |

The [Session 23 guide](../docs/SESSION-23-ZIP-FAMILY.md), [scenario map](../docs/SESSION-23-SCENARIOS.md) and [evidence ledger](../evidence/SESSION-23.md) link the three scoped definitions and actual checks. Nine configured histories provide 75 projections. The direct exports share a canonical FIFO kernel, while zipAll adds its collection barrier and distinct teardown order.

## Session 22 inspection pages

| Export | Behavior to inspect | Inspection index |
|---|---|---|
| windowCount | Count and stride select live overlapping, contiguous or gapped windows | [windowCount](windowCount-index.md) |
| windowTime | Scheduler-owned deadlines, periodic creation, maximum size and timer generations | [windowTime](windowTime-index.md) |
| windowToggle | Opening signals and independently owned per-window closing signals | [windowToggle](windowToggle-index.md) |
| windowWhen | Successive closing-signal setup, rotation on next or completion and retained handles | [windowWhen](windowWhen-index.md) |
| withLatestFrom | Auxiliary readiness and memory, source-only output, ordered connection cleanup | [withLatestFrom](withLatestFrom-index.md) |

The [Session 22 guide](../docs/SESSION-22-WINDOW-POLICIES.md), [scenario map](../docs/SESSION-22-SCENARIOS.md) and [evidence ledger](../evidence/SESSION-22.md) link the five scoped models and actual verification. Fifteen configured examples belong to these five exports; multiple histories of one profile are not additional exports.

## Session 21 inspection pages

| Export | Behavior to inspect | Inspection index |
|---|---|---|
| timeInterval | Connection baseline and differences between supplied clock readings | [timeInterval](timeInterval-index.md) |
| timeout | First/gap deadlines, default error and factory-selected replacement | [timeout](timeout-index.md) |
| timeoutWith | Numeric/date compatibility profiles with a configured replacement | [timeoutWith](timeoutWith-index.md) |
| timestamp | Supplied clock reading attached to each source value | [timestamp](timestamp-index.md) |
| window | Live multicast windows, boundary rotation and independent consumer lifetimes | [window](window-index.md) |

The [Session 21 guide](../docs/SESSION-21-TIME-AND-WINDOWS.md), [scenario map](../docs/SESSION-21-SCENARIOS.md) and [evidence ledger](../evidence/SESSION-21.md) record the declared profiles and actual verification status. Eleven configured examples represent these five exports; the three window examples are different histories of one semantic profile.

## Session 20 inspection pages

| Export | Profiles | Inspection index |
|---|---|---|
| takeLast | Positive count and zero/no-source | [takeLast](takeLast-index.md) |
| tap | All lifecycle/notification hooks and next-only | [tap](tap-index.md) |
| throttle | All four leading/trailing combinations | [throttle](throttle-index.md) |
| throttleTime | All four combinations with positive deferred duration | [throttleTime](throttleTime-index.md) |
| throwIfEmpty | Default and custom factory bindings | [throwIfEmpty](throwIfEmpty-index.md) |

The [Session 20 guide](../docs/SESSION-20-TERMINAL-TAP-THROTTLE.md), [scenario map](../docs/SESSION-20-SCENARIOS.md) and [evidence ledger](../evidence/SESSION-20.md) distinguish the predicted traces from independent RxJS observations and record the acceptance status. These fourteen profiles count as five public exports.

## Earlier reference profiles

| Operator | Canonical model | Readable page | Evidence |
|---|---|---|---|
| take | [take.ts](../src/models/take.ts) | [Behavior](take.md) | [M01](../evidence/M01.md) |
| map | [map.ts](../src/models/map.ts) | [Behavior](map.md) | [M02-A](../evidence/M02.md) |
| filter | [filter.ts](../src/models/filter.ts) | [Behavior](filter.md) | [M02-A](../evidence/M02.md) |
| scan, seeded and unseeded | [scan.ts](../src/models/scan.ts) | [Profile guide](scan.md) | [M02-B](../evidence/M02-B.md) |
| debounceTime | [debounceTime.ts](../src/models/debounceTime.ts) | [Behavior](debounceTime.md) | [M02-C](../evidence/M02-C.md) |
| switchMap | [flatten.ts](../src/models/flatten.ts) | [Behavior](switchMap.md) | [Session 2](../evidence/SESSION-02.md) |
| mergeMap (generated concurrency 2) | [flatten.ts](../src/models/flatten.ts) | [Behavior](mergeMap.md) | [Session 2](../evidence/SESSION-02.md) |
| concatMap | [flatten.ts](../src/models/flatten.ts) | [Behavior](concatMap.md) | [Session 2](../evidence/SESSION-02.md) |
| exhaustMap | [flatten.ts](../src/models/flatten.ts) | [Behavior](exhaustMap.md) | [Session 2](../evidence/SESSION-02.md) |
| share (generated default boolean resets) | [share.ts](../src/models/share.ts) | [Behavior](share.md) | [Session 2](../evidence/SESSION-02.md) |
| switchAll | [all.ts](../src/models/all.ts) | [Behavior](switchAll.md) | [Session 3](../evidence/SESSION-03.md) |
| mergeAll | [all.ts](../src/models/all.ts) | [Behavior](mergeAll.md) | [Session 3](../evidence/SESSION-03.md) |
| concatAll | [all.ts](../src/models/all.ts) | [Behavior](concatAll.md) | [Session 3](../evidence/SESSION-03.md) |
| exhaustAll | [all.ts](../src/models/all.ts) | [Behavior](exhaustAll.md) | [Session 3](../evidence/SESSION-03.md) |
| shareReplay | [shareReplay.ts](../src/models/shareReplay.ts) | [Behavior](shareReplay.md) | [Session 3](../evidence/SESSION-03.md) |
| distinctUntilChanged | [adjacent.ts](../src/models/adjacent.ts) | [Behavior](distinctUntilChanged.md) | [Session 4](../evidence/SESSION-04.md) |
| distinctUntilKeyChanged | [adjacent.ts](../src/models/adjacent.ts) | [Behavior](distinctUntilKeyChanged.md) | [Session 4](../evidence/SESSION-04.md) |
| distinct | [distinct.ts](../src/models/distinct.ts) | [Behavior](distinct.md) | [Session 4](../evidence/SESSION-04.md) |
| pairwise | [pairwise.ts](../src/models/pairwise.ts) | [Behavior](pairwise.md) | [Session 4](../evidence/SESSION-04.md) |
| startWith | [startWith.ts](../src/models/startWith.ts) | [Behavior](startWith.md) | [Session 4](../evidence/SESSION-04.md) |
| skip (generated count 2) | [gating.ts](../src/models/gating.ts) | [Behavior](skip.md) | [Session 5](../evidence/SESSION-05.md) |
| takeWhile (generated inclusive profile) | [gating.ts](../src/models/gating.ts) | [Behavior](takeWhile.md) | [Session 5](../evidence/SESSION-05.md) |
| skipWhile | [gating.ts](../src/models/gating.ts) | [Behavior](skipWhile.md) | [Session 5](../evidence/SESSION-05.md) |
| takeUntil | [until.ts](../src/models/until.ts) | [Behavior](takeUntil.md) | [Session 5](../evidence/SESSION-05.md) |
| skipUntil | [until.ts](../src/models/until.ts) | [Behavior](skipUntil.md) | [Session 5](../evidence/SESSION-05.md) |
| reduce (seeded) | [aggregate.ts](../src/models/aggregate.ts) | [Behavior](reduce.md) | [Session 6](../evidence/SESSION-06.md) |
| reduce (unseeded) | [aggregate.ts](../src/models/aggregate.ts) | [Behavior](reduce-unseeded.md) | [Session 6](../evidence/SESSION-06.md) |
| count | [aggregate.ts](../src/models/aggregate.ts) | [Behavior](count.md) | [Session 6](../evidence/SESSION-06.md) |
| count (predicate) | [aggregate.ts](../src/models/aggregate.ts) | [Behavior](count-predicate.md) | [Session 6](../evidence/SESSION-06.md) |
| toArray | [aggregate.ts](../src/models/aggregate.ts) | [Behavior](toArray.md) | [Session 6](../evidence/SESSION-06.md) |
| min | [aggregate.ts](../src/models/aggregate.ts) | [Behavior](min.md) | [Session 6](../evidence/SESSION-06.md) |
| max | [aggregate.ts](../src/models/aggregate.ts) | [Behavior](max.md) | [Session 6](../evidence/SESSION-06.md) |

Map/filter share their lifecycle specification in [value.ts](../src/models/value.ts), not their business functions. Callback functions are external to the pure models. [M02-A](../docs/M02-VALUE-SELECTION.md) explains the invocation/outcome boundary. [M02-B](../docs/M02-B-SCAN.md) reuses it with a typed accumulator/value product and two initialization policies. [M02-C](../docs/M02-C-DEBOUNCE-TIME.md) adds explicit clock readings, timer invocations and deadline checks without introducing a clock inside the model.

[Session 2](../docs/SESSION-02-HIGHER-ORDER.md) adds separate outer/inner identities, projection outcomes and four admission policies. [M02-E](../docs/M02-E-SHARE.md) changes ownership to one shared coordinator with addressed outputs and connection resets.

[Session 3](../docs/SESSION-03-FLATTEN-AND-REPLAY.md) adds four identity-source flattening models and one clock-aware replay profile. [Session 4](../docs/SESSION-04-MEMORY-AND-ADJACENCY.md) adds adjacent-key selection, Set-backed history/flush, overlapping pairs, and prefix-before-source subscription.

[Session 5](../docs/SESSION-05-GATING.md) adds count, predicate and notifier gates. Inclusive/exclusive takeWhile are tested profiles of one export. Notifier-first setup, next versus complete, one-way opening, source acquisition and cancellation are explicit.

[Session 6](../docs/SESSION-06-AGGREGATION.md) adds completion-only aggregation and extrema, with per-subscription memory and separate callback outcomes.

**At Session 11, fifty-nine configured examples produced 472 deterministic views across fifty-five accepted export names.** These are scoped profiles, not a complete operator catalogue. Current acceptance and executed checks live in the evidence records; the [roadmap](../docs/ROADMAP.md) and daily JSON tracker govern further work.

## Session 11 — new operator pages

| Operator | Canonical model | Readable generated page | Evidence |
|---|---|---|---|
| dematerialize | [notification unwrapping](../src/models/session11-scalar.ts) | [Behavior](dematerialize.md) | [Session 11](../evidence/SESSION-11.md) |
| elementAt | [indexed selection](../src/models/session11-scalar.ts) | [Behavior](elementAt.md) | [Session 11](../evidence/SESSION-11.md) |
| endWith | [successful suffix](../src/models/session11-scalar.ts) | [Behavior](endWith.md) | [Session 11](../evidence/SESSION-11.md) |
| every | [indexed quantification](../src/models/session11-scalar.ts) | [Behavior](every.md) | [Session 11](../evidence/SESSION-11.md) |
| exhaust | [exact exhaustAll alias](../src/models/exhaust.ts) | [Behavior](exhaust.md) | [Session 11](../evidence/SESSION-11.md) |

The [technical guide](../docs/SESSION-11-NOTIFICATIONS-SELECTION-QUANTIFIERS.md) explains policy axes and source constraints. As with all earlier examples, the generated four-lane traces are pure model predictions and do not replace independent actual RxJS tests.
