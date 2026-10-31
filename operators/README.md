# Executable operator profiles

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

Map/filter share their lifecycle specification in [value.ts](../src/models/value.ts), not their business functions. Callback functions are external to the pure models. [M02-A](../docs/M02-VALUE-SELECTION.md) explains the invocation/outcome boundary. [M02-B](../docs/M02-B-SCAN.md) reuses it with a typed accumulator/value product and two initialization policies. [M02-C](../docs/M02-C-DEBOUNCE-TIME.md) adds explicit clock readings, timer invocations and deadline checks without introducing a clock inside the model.

[Session 2](../docs/SESSION-02-HIGHER-ORDER.md) adds separate outer/inner identities, projection outcomes and four admission policies. [M02-E](../docs/M02-E-SHARE.md) changes ownership to one shared coordinator with addressed outputs and connection resets.

[Session 3](../docs/SESSION-03-FLATTEN-AND-REPLAY.md) adds four
identity-source flattening models and one clock-aware replay profile.

Sixteen configured examples produce 128 views across fifteen distinct export names. These are scoped profiles, not a complete operator catalogue. Acceptance and executed checks live in the evidence records; the [roadmap](../docs/ROADMAP.md) and daily JSON tracker govern further work.
