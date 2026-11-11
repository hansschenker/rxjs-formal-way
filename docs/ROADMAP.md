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
| M06-A | reduce (seeded/unseeded), count (plain/predicate), toArray terminal aggregation | Accepted within scope; [Session 6 guide](SESSION-06-AGGREGATION.md) |
| M06-B | min/max default numeric and custom comparer policies | Accepted within scope; [Session 6 evidence](../evidence/SESSION-06.md) |
| M07-A | audit/auditTime duration policies, latest value and deferred completion | Accepted within scope; [Session 7 guide](SESSION-07-TIME-AND-BUFFERS.md) |
| M07-B | buffer/bufferCount/bufferTime notification, count and scheduled-window policies | Accepted within scope; [Session 7 evidence](../evidence/SESSION-07.md) |
| M08-A | bufferToggle/bufferWhen opening, closing, overlapping and successive-buffer policies | Accepted within scope; [Session 8 guide](SESSION-08-SELECTOR-BUFFERS-RECOVERY-JOINS.md) |
| M08-B | catchError selector-based replacement and teardown ordering | Accepted within scope; [Session 8 evidence](../evidence/SESSION-08.md) |
| M08-C | combineLatestAll and deprecated exact alias combineAll, deferred latest join | Accepted within scope; [Session 8 evidence](../evidence/SESSION-08.md) |
| M09-A | pipeable combineLatest/combineLatestWith, source-first latest snapshots | Accepted within scope; [Session 9 guide](SESSION-09-JOINS-AND-CONSTANT-MAP.md) |
| M09-B | pipeable concat/concatWith, sequential source acquisition | Accepted within scope; [Session 9 evidence](../evidence/SESSION-09.md) |
| M09-C | concatMapTo, constant-inner FIFO subscription occurrences | Accepted within scope; [Session 9 evidence](../evidence/SESSION-09.md) |
| M10-A | connect, debounce, defaultIfEmpty: selected connection, duration replacement, empty-source fallback | Accepted within scope; [Session 10 guide](SESSION-10-CONNECTION-AND-DURATIONS.md) |
| M10-B | delay and delayWhen: independent time/duration release and completion barrier | Accepted within scope; [Session 10 evidence](../evidence/SESSION-10.md) |
| M11-A | dematerialize/elementAt/endWith: notification unwrapping, indexed selection and synchronous suffix | Accepted within scope; [Session 11 guide](SESSION-11-NOTIFICATIONS-SELECTION-QUANTIFIERS.md) |
| M11-B | every/exhaust: indexed universal quantification and exact deprecated exhaustAll alias | Accepted within scope; [Session 11 evidence](../evidence/SESSION-11.md) |
| M12-A | expand/finalize: recursive admission and teardown callback policy | Accepted within scope; [Session 12 guide](SESSION-12-RECURSION-FINALIZATION-SEARCH.md) |
| M12-B | find/findIndex/first: first-match selection, sentinels and default/error exhaustion | Accepted within scope; [Session 12 evidence](../evidence/SESSION-12.md) |
| M13-A | groupBy: keyed Subjects and retained upstream group lifetime | Accepted within scoped default Subject profile; [Session 13 guide](SESSION-13-GROUPS-AND-SCALAR-POLICIES.md) |
| M13-B | ignoreElements/isEmpty/last/mapTo: scalar and terminal selection policies | Accepted within scope; [Session 13 evidence](../evidence/SESSION-13.md) |
| M14-A | materialize and pipeable merge: notification encoding, unscheduled static-source concurrency/FIFO | Accepted within scope; [Session 14 evidence](../evidence/SESSION-14.md) |
| M14-B | flatMap exact alias, mergeMapTo constant-source occurrences, mergeScan latest inner accumulation | Accepted within scope; [Session 14 technical guide](SESSION-14-NOTIFICATIONS-AND-MERGE.md) |
| M14+ | Remaining catalogue | 43 exports pending; not a universal interpreter |

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

## Session 6 closed: 3 November 2026

Five pending exports—**reduce, count, toArray, min, max**—were modeled, independently compared with RxJS 7.8.2 and accepted within their declared scopes. Seeded/unseeded reduce and predicate/plain count are profiles, not extra operator names. Guarded Mealy models retain callback indices, seed presence, accumulation memory, terminal output-only policy, exception identity and silent cancellation.

[Push CI run 41597414740](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41597414740) tested implementation `70bc96e51f46c616e44fcb2a93ddb6172962d050`; generated artifacts were committed at `df53eb7816a4f68e7ac0ad6e0f95f9713aadf05e`. Independent [read-only PR run 41597635014](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41597635014) passed with generation/publication skipped, checking **264 committed views**. The full suite passed **670 named tests**, including **23 new pure-model/view and 13 new native RxJS tests**; **1,422 new bounded model/native comparisons** passed. The first attempt's test-harness adapter error was fixed without weakening validation. Seven configured examples add 56 views; exact provenance and scope are in [Session 6 evidence](../evidence/SESSION-06.md).

**30 of 113 exports accepted; 83 pending.** Zero carryovers and no second batch.

## Session 7 closed: 4 November 2026

Exactly five distinct pending exports—**audit, auditTime, buffer, bufferCount, bufferTime**—were modeled and accepted within explicitly scoped profiles in one Europe/Zurich session. The first two use duration-driven latest-value admission and completion-waiting policies; the latter three use notifier, count and scheduler-driven accumulation/flush policies. Six generated configurations represent those five export names. See the [technical guide](SESSION-07-TIME-AND-BUFFERS.md) for pinned-source analysis, Cω shapes, states, action policies and exclusions.

[Successful implementation push run 41792399467](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41792399467), job **126448562927**, tested commit `72a97eb86aedd703f394f79fa3fbf4967cbd12aa` and committed generated views at `b005bbafd15e1c47fa6dc8056d19ee4ed11fb662`. It ran syntax/strict TypeScript checks, **715 named tests with zero failures**, and generation-drift checking against **312 deterministic projections**, including **48 new views**. Of those, **45 named tests** and **17 negative type assertions** were introduced for this session. Tests contained **2,223 new bounded model/native word or virtual-time comparisons**.

[Independent read-only PR run 41792585389](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41792585389), job **126449171258**, also passed **715 tests and 312 view checks**, explicitly skipping generation and publication. Its tested synthetic checkout `3b96d3edab70f0510cf676dc06ba31484c7625e2` has the same Git tree `80879f99f29f00a73a8236e9746b508470263d8a` as PR head `f2eb6931fcf1ddd4eebf4af42ab39cbb20890804`. Full details and preliminary failures are recorded in [Session 7 evidence](../evidence/SESSION-07.md).

**35 of 113 exports accepted; 78 pending.** Zero carryovers; no second batch.

## Final project goal

The project now has an explicit final goal: **scale upward from precise local operator semantics into formal verification of composed RxJS pipelines**. M03-P is the bridge: local canonical Mealy models are lifted into product pipeline states, ordered actions are interpreted as connection semantics, synchronous propagation is collapsed to stable macro-steps, and a bounded explicit-state explorer checks invariants with counterexample paths. The next scaling witness is `debounceTime → switchMap → distinctUntilChanged`, followed by a generated TLA+/TLC projection rather than a separately maintained specification.

## Session 8 closed: 5 November 2026

The five pending exports **bufferToggle, bufferWhen, catchError, combineAll and combineLatestAll** were modeled from pinned RxJS 7.8.2 source and accepted within explicitly scoped, nonreentrant Observable profiles. No extra operator was generated for an overload; the deprecated `combineAll` export is an exact alias of `combineLatestAll`, with separate provenance and shared transition algebra.

The established schema, runner, views and validation pipeline were reused without weakening checks. Five configurations added **40 deterministic projections**, bringing the total to **352**. [Push CI 41986983309](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41986983309) passed **758 named tests** with zero failures, after generating and drift-verifying all 352 views. [Independent read-only PR CI 41987175479](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41987175479) also passed 758 tests and 352 drift checks, explicitly skipping generation and publication. The exact implementation, generated and read-only checkout commits, matching Git trees, 43 new tests, 18 new negative type assertions, 161 bounded comparisons and exclusions are recorded in [Session 8 evidence](../evidence/SESSION-08.md).

**40 of 113 exports accepted; 73 pending. No carryovers or second batch.** Following Session 8, the next five were `combineLatest`, `combineLatestWith`, `concat`, `concatMapTo`, and `concatWith`, eligible from 6 November 2026 Europe/Zurich.

## Session 9 closed: 6 November 2026

The already-reserved session was resumed rather than duplicated. Its five names **combineLatest, combineLatestWith, concat, concatMapTo and concatWith** are accepted within declared Observable, non-reentrant profiles. The legacy combineLatest and concat names are pipeable exports, not creation APIs. Source-first latest snapshots, sequential source acquisition and constant-inner FIFO subscription occurrences reuse the existing schema, runner, renderers and reviewed flattening machinery.

[Push CI 42181663215](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42181663215), job **127772452370**, tested actual main checkout `597ba676568af18dfae69ef7a49d9fbfb14cd44a`, passed **797 named tests** and drift-checked **392 projections** before creating generated commit `5c250ebae93971a67657e4189809aced26a1344e`. **39 new named tests** comprise 20 model/view and 19 actual RxJS tests; **14 new negative assertions** bring the cumulative total to **161**. Five examples add **40 views**. This session adds fixed targeted native cases, not a new bounded-enumeration count.

Independent [read-only PR #12 run 42259742601](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42259742601), job **128036228031**, passed the same **797 tests and 392 drift checks**, with generation/publication skipped. Its actual synthetic checkout `5a917c99e604e74bb5defe8f2cb89afec21dbb6a` and PR head `ee35ba02c5dc05ac4193d9ad1e20333f4b7fae3d` have identical Git tree `4097af0cecb60977f795c78b4ec2d8e6221ac6ff`. The evidence PR merged as `e56fcff8ec5d5c8a44d0183c15d45eb840022e06`. The final closure only changes documentation/planning, not tested runtime code. See [the guide](SESSION-09-JOINS-AND-CONSTANT-MAP.md) and [evidence](../evidence/SESSION-09.md).

**45 of 113 exports accepted; 68 pending. No carryovers, no sixth operator and no second batch.** Finite scoped evidence is not a universal proof.

## Next pending batch — Session 10

Not before **7 November 2026 Europe/Zurich**:
**connect, debounce, defaultIfEmpty, delay, delayWhen**.
Maintain the five-name maximum, carryovers-first selection,
independent actual RxJS comparisons and retrieved CI evidence.
The next batch has not been started.

## Session 10 closed: 7 November 2026

Exactly five queued exports—**connect, debounce, defaultIfEmpty, delay, delayWhen**—were modeled and accepted within explicitly documented profiles. The original Mealy schema, runner, generator and checks were retained. Five configurations added 40 generated projections, bringing the total to **432**. The native cases check synchronous multicast setup, duration replacement, empty/default selection, virtual-timer delayed completion, overlapping durations and cancellation.

[Push run 42352229850](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42352229850), job **128342625388**, tested implementation merge **fe5b2871545f2b9022f7427973d02533089ba06c**: **832 tests**, zero failures, and 432 generated-view checks passed. Generated files were committed at **951b4dacf71408c0de3aa5b4b58f0030f89a6a91**. [Independent read-only PR run 42352354713](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42352354713), job **128343006855**, also passed 832 tests and 432 drift checks, with generation and publication skipped. Synthetic checkout **f834a9487ca55ba1d75e3d8ca5f5796077aee495** shares Git tree **fe386e693087e460f601438c2e16e4b135ce7c3f** with the PR head. See [evidence](../evidence/SESSION-10.md) for exact provenance, scoped exclusions, 35 new named tests, 15 negative type assertions and preliminary corrections.

**50 of 113 distinct exports accepted; 63 pending; zero carryovers.** Next eligible session is **8 November 2026 Europe/Zurich**: dematerialize, elementAt, endWith, every, exhaust. No second batch was opened today.

## Session 11 closed: 8 November 2026

Exactly five pending exports—**dematerialize, elementAt, endWith, every and exhaust**—were implemented with pinned RxJS 7.8.2 source inspection, canonical guarded Mealy contracts, Cω shapes, typed states/actions, scope constraints and independent native RxJS evidence. The deprecated **exhaust** export is an exact alias of **exhaustAll** and reuses its reviewed Mealy semantics with distinct public-export provenance. The original schema, runner, generator, strict validation settings and 50 previously accepted exports remain unchanged.

[Implementation push CI 42458245679](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42458245679), job **128661758627**, tested actual main checkout `9a95129960efef0157ac826a66bf66104add73c0`. It generated and verified **472 deterministic views** (40 new) and passed **873 tests, zero failures** before committing artifacts at `f5578df41466eda0fde5b7c7ed638a8bf83ab082`. New cases: **20 model/view and 21 independent actual RxJS tests**; **14 negative type assertions**, 190 cumulative. No new bounded-enumeration count; existing comparisons remain covered by the full suite.

[Independent read-only CI 42458341622](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42458341622), job **128662049773**, succeeded with **873 tests and 472 committed-view checks** while explicitly skipping generation and publication. Actual synthetic checkout `ff4d9dde60cdf04569c4e437218ef0a6396822ca` and PR head `2daf6bf33964a6ae4812b432ea6d3aeeed8b863c` share verified Git tree `b85f3036698fa47c9b8da0a446c9dcf70198f8e0`. See [Session 11 evidence](../evidence/SESSION-11.md) for exclusions and initial validation corrections.

**55 of 113 distinct exports accepted, 58 pending; zero carryovers.** The next eligible session is **9 November 2026 Europe/Zurich**: `expand`, `finalize`, `find`, `findIndex`, `first`. No second daily batch.


## Session 12 closed: 9 November 2026

Exactly five pending exports—**expand, finalize, find, findIndex, first**—were modeled from pinned RxJS 7.8.2 source and accepted within explicitly documented profiles. `expand` makes recursive feedback and admission explicit, including default unbounded and concurrency-one FIFO profiles without the deprecated scheduler argument. `finalize` is modeled as pass-through dataflow plus one teardown callback action. `find` and `findIndex` share the same indexed first-match transition pattern but differ in output policy, while `first` adds direct/predicate selection plus explicit-default versus `EmptyError` exhaustion.

[Push CI 42573265945](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42573265945), job **129015255046**, tested implementation merge `9c6358b1f5db26e2e4059177186ae7d2b42bffe4`: **919 tests passed, zero failures** and **512 deterministic projections** were generated and drift-checked. The workflow then committed **40 new generated files** at `7fbd3b7f35940a6fec42d4a6da95089e3ec52b41`. Session 12 adds **46 named tests**—24 model/view plus 22 independent native RxJS cases—and **15 negative TypeScript assertions**, bringing the cumulative negative-assertion count to **205**.

Independent read-only [PR #18 run 42573479269](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42573479269), job **129015901191**, passed the same **919 tests and 512 committed-view checks** with generation and publication skipped. Its actual synthetic checkout `4e5d90495aca0a6b8365e37c9a5e76e8bf83e053` has the same Git tree `49ddd9112c09505696750872227d8b7af8d21adf` as PR head `3c35a22c6c134ce6813b9d6bc3b2a32fcc812fc7`. See [Session 12 evidence](../evidence/SESSION-12.md) for scope and provenance.

**60 of 113 distinct exports accepted; 53 pending; zero carryovers.** The next eligible session is **10 November 2026 Europe/Zurich**: `groupBy`, `ignoreElements`, `isEmpty`, `last`, `mapTo`. No second daily batch was opened.

## Session 13 closed: 10 November 2026

Five queued RxJS 7.8.2 distinct export names—**groupBy, ignoreElements, isEmpty, last, mapTo**—were modeled against the pinned source revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. GroupBy's accepted profile represents default keyed Subject creation and the exceptional shared-source lifetime in which subscribed group observers outlive cancellation of the outer observer. The four scalar exports preserve terminal delivery, bounded selection, predicate index/candidate behavior, and captured constant identity. The original canonical schema, runner, deterministic generator, strict TypeScript checks, and native RxJS test infrastructure remain unchanged.

[Implementation PR #19](https://github.com/hansschenker/rxjs-formal-way/pull/19) merged as `42c1f180e5c6eb60a8b4106cffd363e16d4a307b`. Its last [pre-generation CI 42777120383](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42777120383) ran syntax, strict types and **971 named tests, zero failures**; it failed only the drift check on 40 intentionally not-yet-committed projections. The existing main push generated and committed 40 artifacts at `a565000fa31378b0a1eccdd3ae756723110cf33b`.

Independent read-only [PR #20 CI 42777531650](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42777531650), job **129699440098**, independently passed the unchanged full check: **971 named tests, zero failures**, and **552 deterministic projections**. Generation and publication were skipped. The actual synthetic checkout `0f0bd9d31e2aeca7f6b57035a150b9aae27550d9` has zero changed files compared to the PR head `a47ba64b533f14ac94e4487a5b687a14348cf3a1`; exact provenance and excluded profiles are in [Session 13 evidence](../evidence/SESSION-13.md).

**65 of 113 exports accepted, 48 pending; zero carryovers.** The next eligible batch (not before 11 November 2026 Europe/Zurich) is `materialize`, `merge`, `flatMap`, `mergeMapTo`, `mergeScan`. No sixth operator or second session was started.


## Session 14 closed: 11 November 2026

The live queue selected exactly five pending names—**materialize, merge, flatMap, mergeMapTo, mergeScan**—in one Europe/Zurich session. The established canonical model, guarded rule runner, TypeScript checks and generator were reused, including the **new Session 14–23 requirement** to provide an export-level eleven-step inspection index for every worked operator.

[Main push CI 42980571840](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42980571840) tested implementation `6aada9aaab62e48f46ff36da0c7a9b101b82fe80`, passed **1,015 tests**, generated and verified **662 deterministic projections**, then committed **45 new artifacts** at `566ff6e00805cb671a020f73844905ff54e2a672`. [Read-only PR CI 42980757675](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42980757675) independently succeeded on already committed content with generation and publication skipped; GitHub's synthetic merge checkout and PR head have zero file differences. There were **20 new model/view tests, 21 new native RxJS tests, 15 negative TypeScript assertions**, and no new bounded-enumeration count. The earlier pre-generation PR CI failed exclusively on the 45 missing views; it is not reported as passing. All five `*-index.md` pages were committed and drift checked. See the [evidence ledger](../evidence/SESSION-14.md) and [technical guide](SESSION-14-NOTIFICATIONS-AND-MERGE.md).

**70 of 113 exports accepted within declared scopes; 43 pending, no carryovers.** No sixth operator or second daily session.
