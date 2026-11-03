# Implementation checkpoints

This is the current implementation tracker. The migration map preserves the original broader consolidation plan. Daily selection follows [DAILY-GENERATION-PLAN.md](DAILY-GENERATION-PLAN.md) and `planning/operator-generation.json`.

| Checkpoint | Scope | Status |
|---|---|---|
| M00 | Formal method and reviewed composition/ownership guidance | Retained |
| M00-LTL | LTL temporal-contract layer: safety/liveness, assumptions/guarantees, terminal stutter semantics | Adopted as documentation/specification layer; generated projection deferred |
| M01 | Canonical contract, pure runner and take end-to-end profile | Accepted within scope; [65-test evidence](../evidence/M01.md) |
| M02-A | Indexed map/filter, explicit callback outcomes, 16 additional projections | Accepted within scope; [119-test evidence](../evidence/M02.md) |
| M02-B | Seeded and unseeded scan, accumulator/index, seed aliasing and throw behavior | Accepted within scope; [171-test evidence](../evidence/M02-B.md) |
| M02-C | debounceTime, clock/deadline/wake-up distinction, timer identities and terminal policies | Accepted within scope; [223-test evidence](../evidence/M02-C.md) |
| M02-D | switchMap, inner generations, replacement and completion | Accepted within scope; [Session 2 evidence](../evidence/SESSION-02.md) |
| M02-D companions | mergeMap, concatMap and exhaustMap admission/queue/ignore policies | Accepted within scope in the same five-name session; [guide](SESSION-02-HIGHER-ORDER.md) |
| M02-E | share, connection ownership, addressed subscribers and boolean reset profiles | Accepted within scope; [guide](M02-E-SHARE.md) and [evidence](../evidence/SESSION-02.md) |
| M03-A | switchAll, mergeAll, concatAll, exhaustAll identity-source flattening | Accepted within scope; [evidence](../evidence/SESSION-03.md) |
| M03-B | shareReplay, buffer/time/refCount behavior | Accepted within scope; [guide](SESSION-03-FLATTEN-AND-REPLAY.md) |
| M04-A | distinctUntilChanged, distinctUntilKeyChanged and distinct, equality and Set/flush memory | Accepted within scope; [Session 4 evidence](../evidence/SESSION-04.md) |
| M04-B | pairwise consecutive pairs and unscheduled startWith prefix | Accepted within scope; [Session 4 guide](SESSION-04-MEMORY-AND-ADJACENCY.md) |
| M05-A | skip count and takeWhile/skipWhile predicate gates | Accepted within scope; [Session 5 guide](SESSION-05-GATING.md) |
| M05-B | takeUntil/skipUntil notifier lifecycle and synchronous initialization | Accepted within scope; [Session 5 evidence](../evidence/SESSION-05.md) |
| M03-P | **Compositional Pipeline Semantics**: product state, action routing, synchronous closure, bounded model checking | Implemented first executable kernel; [guide](M03-COMPOSITIONAL-PIPELINES.md) |
| M05+ | Remaining catalogue | 88 exports pending; not a universal interpreter |

The M02 reference set is now accepted within its explicitly documented profiles. This does not mean all parameter forms, reentrant executions or the full RxJS catalogue have been proved equivalent.

## LTL integration checkpoint

The reusable material from `hansschenker/rxjs-ltl` is now part of the formal method through [LTL Temporal Contracts](LTL-TEMPORAL-CONTRACTS.md).

The adopted pieces are:

- global temporal contracts on top of local Mealy transitions;
- explicit safety versus liveness;
- assumption/guarantee separation for progress claims;
- terminal-state stutter extension for finite RxJS executions;
- cautious use of `X` because of stuttering sensitivity;
- temporal-property-to-test-obligation traceability;
- explicit boundary between ordinary LTL ordering and scheduler-owned metric time;
- a future mapping path into TLA+ invariants, temporal formulas and justified fairness assumptions.

No generated `.ltl.md` artifact has been added yet. That extension remains deferred until temporal propositions and assumptions are represented canonically in the model and can participate in drift checking.

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

**15 of 113 exports were accepted at the end of Session 3.**

## Session 4 closed: 1 November 2026

Exactly five pending exports—**distinctUntilChanged, distinctUntilKeyChanged, distinct, pairwise, startWith**—were modeled, independently tested and accepted in one Europe/Zurich session. The existing infrastructure produced 40 new projections, taking the inventory to **168 deterministic views across 20 accepted exports**. Strict types and syntax, 561 named tests, and read-only GitHub Actions drift verification passed. Full tested checkouts, 2,004 new bounded model/native comparisons and corrected preliminary test-harness failures are recorded in [evidence](../evidence/SESSION-04.md). No carryovers and no extra work beyond five names.

**20 of 113 exports were accepted at the end of Session 4.**

## Session 5 closed: 2 November 2026

Exactly five pending exports—**skip, takeWhile, skipWhile, takeUntil, skipUntil**—were accepted within their documented scopes. Count and predicate gates reuse the synchronous invocation/outcome boundary; notifier gates explicitly represent notifier-first setup and distinguish next, complete and error. A native test captures skipUntil's already-closed source subscription attempt after a synchronous notifier error.

The unchanged validation pipeline passed **631 named tests**: 561 retained, 35 new model/view tests and 35 new actual RxJS cases. The new bounded test performed **6,778** comparisons, including callback indices, equal-time order and resource lifetimes. Eighteen additional negative TypeScript assertions bring that count to 100. Forty new views bring the total to **208 across 26 examples and 25 distinct operator names**.

[Push run 41396195583](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41396195583) tested implementation `e0dd8aa2f04c766827fb1dabbb22d9ed1dcefaac`. [Read-only PR run 41396580432](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41396580432) passed on committed files with generation/publication skipped. Exact implementation, generated and PR-head revisions, retrieved run/job results, scope limits and the explicit synthetic-checkout provenance limitation are retained in [the evidence ledger](../evidence/SESSION-05.md). No carryovers or sixth export.

**25 of 113 exports accepted; 88 pending.**

## Next pending batch

Not before **3 November 2026 Europe/Zurich**:
**reduce, count, toArray, min, max**. Maintain the five-name maximum,
carryovers-first selection, actual RxJS comparisons, time,
cancellation, sharing, and retrieved CI evidence. Finite
coverage is not universal proof.

## Final project goal

The project now has an explicit final goal: **scale upward from precise local operator semantics into formal verification of composed RxJS pipelines**. M03-P is the bridge: local canonical Mealy models are lifted into product pipeline states, ordered actions are interpreted as connection semantics, synchronous propagation is collapsed to stable macro-steps, and a bounded explicit-state explorer checks invariants with counterexample paths. The next scaling witness is `debounceTime → switchMap → distinctUntilChanged`, followed by a generated TLA+/TLC projection rather than a separately maintained specification.
