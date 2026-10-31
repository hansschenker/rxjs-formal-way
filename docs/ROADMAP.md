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
| M03-A | switchAll, mergeAll, concatAll, exhaustAll identity-source flattening | Accepted within scope; [evidence](../evidence/SESSION-03.md) |
| M03-B | shareReplay, buffer/time/refCount behavior | Accepted within scope; [guide](SESSION-03-FLATTEN-AND-REPLAY.md) |
| M03+ | Remaining catalogue and comparison work | 98 exports pending; not a universal interpreter |

The M02 reference set is now accepted within its explicitly documented profiles. This does not mean all parameter forms, reentrant executions or the full RxJS catalogue have been proved equivalent.

## Retained checkpoints

[M02-B](M02-B-SCAN.md) reuses schema 1.1. Supplied seeds are not automatically emitted; absent and explicit undefined seeds differ. Unseeded scan first invokes the reducer at source index 1. Fresh bookkeeping does not imply cloned seed objects.

[M02-C](M02-C-DEBOUNCE-TIME.md) distinguishes the latest silence deadline from a scheduled wake-up. Replacement updates memory; an early wake-up rearms. Completion flushes; error/cancellation discard. Timer generations identify invocations, not physical Action objects. Equal-time order and deferred zero-delay assumptions are explicit.

## Session 2 closed: 29 October 2026

The already-started Europe/Zurich session was resumed, not duplicated. Its only names were switchMap, mergeMap, concatMap, exhaustMap and share. All five are accepted with no carryovers. The earlier five names were retained, not counted again. Forty new projections bring the total to 88 across eleven examples and ten distinct operator names.

The four flattening models share explicitly parameterized machinery while preserving policy-specific rules, projection timing and cleanup ordering. Share uses a separate shared-instance registry and connection generation. The old schema, runner, renderer, source models, tests, workflow and dependencies were not replaced.

Both the full push run and a separate read-only pull-request run passed **415 tests**. The PR job skipped generation and publication and verified all **88 committed projections**. Its exact checkout revision and tree, plus retrieved run/job evidence, are recorded in the evidence document. The connector lacked manual dispatch, so the existing PR path was used without weakening checks.

## Session 3 closed: 31 October 2026

The unworked 30 October batch (switchAll, mergeAll, concatAll,
exhaustAll and shareReplay) was carried into one 31 October
Europe/Zurich session and **all five are accepted within scope**.
No sixth operator or second batch was opened. Source-identity
flattening reuses the reviewed rules; shareReplay adds a clock-aware
ReplaySubject buffer and shared connection lifecycle.

[Push run 41182538761](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41182538761)
and [read-only PR run 41182614115](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41182614115)
both passed **511 named tests**. Read-only CI skipped generation and
publication and confirmed **128 committed projections**. Exact SHAs,
test counts, corrections and scope limits are recorded in the
[evidence](../evidence/SESSION-03.md).

**15 of 113 exports accepted; 98 pending.**

## Next pending batch

Not before **1 November 2026 Europe/Zurich**:
**distinctUntilChanged, distinctUntilKeyChanged, distinct,
pairwise, startWith**. Maintain the five-name maximum,
carryovers-first selection, actual RxJS comparisons, time,
cancellation, sharing, and retrieved CI evidence. Finite
coverage is not universal proof.
