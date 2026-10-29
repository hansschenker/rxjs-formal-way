# Implementation checkpoints

This is the current implementation tracker. The migration map preserves the original broader consolidation plan. Daily selection follows [DAILY-GENERATION-PLAN.md](DAILY-GENERATION-PLAN.md) and `planning/operator-generation.json`.

| Checkpoint | Scope | Status |
|---|---|---|
| M00 | Formal method and reviewed composition/ownership guidance | Retained |
| M01 | Canonical contract, pure runner and take end-to-end profile | Accepted within scope; [65-test evidence](../evidence/M01.md) |
| M02-A | Indexed map/filter, explicit callback outcomes, 16 additional projections | Accepted within scope; [119-test evidence](../evidence/M02.md) |
| M02-B | Seeded and unseeded scan, accumulator/index, seed aliasing and throw behavior | Accepted within scope; [171-test evidence](../evidence/M02-B.md) |
| M02-C | debounceTime, clock/deadline/wake-up distinction, timer identities and terminal policies | Accepted within scope; [223-test evidence](../evidence/M02-C.md) |
| M02-D | switchMap, inner generations, replacement and completion | Accepted within scope; [Session 2 evidence](../evidence/SESSION-02.md) |
| M02-D companions | mergeMap, concatMap and exhaustMap admission/queue/ignore policies | Accepted within scope in the same five-name session; [guide](SESSION-02-HIGHER-ORDER.md) |
| M02-E | share, connection ownership, addressed subscribers and boolean reset profiles | Accepted within scope; [guide](M02-E-SHARE.md) and [evidence](../evidence/SESSION-02.md) |
| M03+ | Broader generation, catalogue migration, family comparisons and visualization | Pending inventory work; not a completed universal interpreter |

The M02 reference set is now accepted within its explicitly documented profiles. This does not mean all parameter forms, reentrant executions or the full RxJS catalogue have been proved equivalent.

## Retained checkpoints

[M02-B](M02-B-SCAN.md) reuses schema 1.1. Supplied seeds are not automatically emitted; absent and explicit undefined seeds differ. Unseeded scan first invokes the reducer at source index 1. Fresh bookkeeping does not imply cloned seed objects.

[M02-C](M02-C-DEBOUNCE-TIME.md) distinguishes the latest silence deadline from a scheduled wake-up. Replacement updates memory; an early wake-up rearms. Completion flushes; error/cancellation discard. Timer generations identify invocations, not physical Action objects. Equal-time order and deferred zero-delay assumptions are explicit.

## Session 2 closed: 29 October 2026

The already-started Europe/Zurich session was resumed, not duplicated. Its only names were switchMap, mergeMap, concatMap, exhaustMap and share. All five are accepted with no carryovers. The earlier five names were retained, not counted again. Forty new projections bring the total to 88 across eleven examples and ten distinct operator names.

The four flattening models share explicitly parameterized machinery while preserving policy-specific rules, projection timing and cleanup ordering. Share uses a separate shared-instance registry and connection generation. The old schema, runner, renderer, source models, tests, workflow and dependencies were not replaced.

Both the full push run and a separate read-only pull-request run passed **415 tests**. The PR job skipped generation and publication and verified all **88 committed projections**. Its exact checkout revision and tree, plus retrieved run/job evidence, are recorded in the evidence document. The connector lacked manual dispatch, so the existing PR path was used without weakening checks.

## Next pending batch

The next eligible session is **30 October 2026** in Europe/Zurich. Follow the live JSON queue: switchAll, mergeAll, concatAll, exhaustAll and shareReplay. Do not open a second batch on 29 October or count profiles as distinct operator names. There are 103 pending names after this session.

Keep notification and lifecycle assertions, legal-input constraints, time/cancellation/sharing declarations, generated-view consistency and retrieved CI evidence. Finite coverage remains evidence, not a universal proof.
