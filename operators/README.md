# Executable operator profiles

## Start with the Operator Inspection Index

For every modeled public export, open `<operator>-index.md` first—for example [audit-index.md](audit-index.md). The generated index gives the same eleven-step path through Overview, Diagram, STT, BDD, Trace, Obligations, Manifest, Canonical Model, pinned RxJS source, Tests, and Evidence.

The repository-wide method is documented in [RxJS Operator Inspection Workflow](../docs/OPERATOR-INSPECTION-WORKFLOW.md).

Each configured profile has one canonical TypeScript rule set and eight generated views. Read the plain-language page first; use the milestone guide for assumptions and verification.

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

**Fifty-nine configured examples produce 472 deterministic views across fifty-five accepted export names.** These are scoped profiles, not a complete operator catalogue. Acceptance and executed checks live in the evidence records; the [roadmap](../docs/ROADMAP.md) and daily JSON tracker govern further work.

## Session 11 — new operator pages

| Operator | Canonical model | Readable generated page | Evidence |
|---|---|---|---|
| dematerialize | [notification unwrapping](../src/models/session11-scalar.ts) | [Behavior](dematerialize.md) | [Session 11](../evidence/SESSION-11.md) |
| elementAt | [indexed selection](../src/models/session11-scalar.ts) | [Behavior](elementAt.md) | [Session 11](../evidence/SESSION-11.md) |
| endWith | [successful suffix](../src/models/session11-scalar.ts) | [Behavior](endWith.md) | [Session 11](../evidence/SESSION-11.md) |
| every | [indexed quantification](../src/models/session11-scalar.ts) | [Behavior](every.md) | [Session 11](../evidence/SESSION-11.md) |
| exhaust | [exact exhaustAll alias](../src/models/exhaust.ts) | [Behavior](exhaust.md) | [Session 11](../evidence/SESSION-11.md) |

The [technical guide](../docs/SESSION-11-NOTIFICATIONS-SELECTION-QUANTIFIERS.md) explains policy axes and source constraints. As with all earlier examples, the generated four-lane traces are pure model predictions and do not replace independent actual RxJS tests.
