# Implementation checkpoints

This is the current implementation tracker. The migration map preserves the original broader consolidation plan. Daily selection follows [DAILY-GENERATION-PLAN.md](DAILY-GENERATION-PLAN.md) and `planning/operator-generation.json`.

| Checkpoint | Scope | Status |
|---|---|---|
| M00 | Formal method and reviewed composition/ownership guidance | Retained |
| M01 | Canonical contract, pure runner and take end-to-end profile | Accepted within scope; [65-test evidence](../evidence/M01.md) |
| M02-A | Indexed map/filter, explicit callback outcomes, 16 additional projections | Accepted within scope; [119-test evidence](../evidence/M02.md) |
| M02-B | Seeded and unseeded scan, accumulator/index, seed aliasing and throw behavior | Accepted within scope; [171-test evidence](../evidence/M02-B.md) |
| M02-C | debounceTime, clock/deadline/wake-up distinction, timer identities and terminal policies | Accepted within scope; [223-test evidence](../evidence/M02-C.md) |
| M02-D | switchMap, inner generations, replacement and completion | Implemented in Session 2; acceptance requires [Session 2 evidence](../evidence/SESSION-02.md) |
| M02-D companions | mergeMap, concatMap and exhaustMap admission/queue/ignore policies | Implemented in the same five-name session; [guide](SESSION-02-HIGHER-ORDER.md) |
| M02-E | share, connection ownership, addressed subscribers and boolean reset profiles | Implemented in Session 2; [guide](M02-E-SHARE.md) and [evidence](../evidence/SESSION-02.md) |
| M03+ | Broader generation, catalogue migration, family comparisons and visualization | Pending inventory work; not a completed universal interpreter |

## Retained checkpoints

[M02-B](M02-B-SCAN.md) reuses schema 1.1. Supplied seeds are not automatically emitted; absent and explicit undefined seeds differ. Unseeded scan first invokes the reducer at source index 1. Fresh bookkeeping does not imply cloned seed objects.

[M02-C](M02-C-DEBOUNCE-TIME.md) distinguishes the latest silence deadline from a scheduled wake-up. Replacement updates memory; an early wake-up rearms. Completion flushes; error/cancellation discard. Timer generations identify invocations, not physical Action objects. Equal-time order and deferred zero-delay assumptions are explicit.

## Session 2: the reserved 29 October batch

The already-started Europe/Zurich session is resumed, not duplicated. Its only names are switchMap, mergeMap, concatMap, exhaustMap and share. Earlier names and the established workflow are retained. The five new configured examples add 40 projections for 88 overall, subject to exact CI drift verification.

The four flattening models share explicitly parameterized machinery while preserving policy-specific rules, projection timing and cleanup ordering. Share uses a separate shared-instance registry and connection generation. The old schema, runner, renderer, source models, tests and dependencies are not replaced.

The evidence record decides acceptance; implementation or test-file counts alone do not. A second read-only workflow_dispatch check is required on the generated-artifact commit because the existing push workflow regenerates views before checking them.

## Next pending batch

After Session 2 is accepted, proceed on the next eligible local date with switchAll, mergeAll, concatAll, exhaustAll and shareReplay, subject to the live JSON queue. Any unfinished Session 2 names take precedence. Do not start a second batch on 29 October or count profiles as distinct operator names.

Keep notification and lifecycle assertions, legal-input constraints, time/cancellation/sharing declarations, generated-view consistency and retrieved CI evidence. Finite coverage remains evidence, not a universal proof.
