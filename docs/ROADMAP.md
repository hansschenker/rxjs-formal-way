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
| M15-A | mergeWith and multicast: unbounded joins and factory-plus-selector shared connection | Accepted within scope; [Session 15 technical guide](SESSION-15-SHARING-SCHEDULING-AND-PARTITION.md) |
| M15-B | observeOn, onErrorResumeNext and partition: scheduled notifications, serial recovery and independent branches | Accepted within scope; [Session 15 evidence](../evidence/SESSION-15.md) |
| M16-A | pluck: nested projection, missing path semantics, exact source terminal/cancellation | Accepted within plain-data path scope; [Session 16 guide](SESSION-16-LEGACY-CONNECTABLES.md) |
| M16-B | publish/publishBehavior/publishLast/publishReplay: fixed-Subject manual connection, memory, completion, replay and per-observer ownership | Accepted within selector-less scopes; [Session 16 evidence](../evidence/SESSION-16.md) |
| M19-A | single, skipLast and subscribeOn: exact-one selection, bounded trailing FIFO, deferred source acquisition | Accepted within scope; [Session 19 guide](SESSION-19-SELECTION-TRAILING-AND-SWITCHING.md) |
| M19-B | switchMapTo and switchScan: configured inner switching, accumulator memory and cancellation ownership | Accepted within scope; [Session 19 evidence](../evidence/SESSION-19.md) |
| M20-A | takeLast, tap and throwIfEmpty: terminal suffix, notification/lifecycle hooks and empty-source error policy | Accepted within scope; [Session 20 guide](SESSION-20-TERMINAL-TAP-THROTTLE.md) |
| M20-B | throttle and throttleTime: four leading/trailing policies, duration generations, completion waiting and cleanup | Accepted within scope; [Session 20 evidence](../evidence/SESSION-20.md) |
| M21-A | timeInterval and timestamp: external provider readings, interval memory and synchronous read failures | Accepted within scope; [clock guide](SESSION-21-CLOCKS.md) |
| M21-B | timeout and timeoutWith: first/gap deadlines, timer generations, source cleanup and replacement lifetime | Accepted within scope; [timeout guide](SESSION-21-TIMEOUTS.md) |
| M21-C | window: live multicast windows, boundary rotation and independent consumer lifetimes | Accepted within scope; [window guide](SESSION-21-WINDOW.md) and [Session 21 evidence](../evidence/SESSION-21.md) |
| M22-A | windowCount and windowTime: count/stride or externally scheduled live windows, overlap, gaps and child lifetimes | Accepted within scope; [Session 22 guide](SESSION-22-WINDOW-POLICIES.md) |
| M22-B | windowToggle and windowWhen: opening/closing policies, synchronous selector/factory outcomes and distinct cancellation behavior | Accepted within scope; [toggle guide](SESSION-22-TOGGLE-WINDOWS.md) and [successive-window guide](SESSION-22-WHEN-WINDOWS.md) |
| M22-C | withLatestFrom: first-value readiness, source-triggered latest tuples and ordered connection teardown | Accepted within scope; [latest-value guide](SESSION-22-LATEST-GATE.md) and [Session 22 evidence](../evidence/SESSION-22.md) |
| M22+ | Remaining catalogue | 3 exports pending: zip, zipAll and zipWith; no universal interpreter or unmodeled overload equivalence |

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

## Session 15 closed: 12 November 2026

The existing started session was resumed and its five selected exports—**mergeWith, multicast, observeOn, onErrorResumeNext, partition**—are accepted within the documented scopes. `mergeWith` retains source-first unbounded overlap; `multicast` covers the fresh-Subject factory-plus-selector profile, not the selector-less ConnectableObservable overload. `observeOn` models deferred FIFO scheduling of next/error/complete without delaying source subscription. `onErrorResumeNext` advances serially on either error or completion. `partition` preserves two independent source subscriptions, predicate indices and cancellation lifetimes. See the [technical guide](SESSION-15-SHARING-SCHEDULING-AND-PARTITION.md).

[Main push CI 43174421942](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43174421942), job **131035100160**, tested implementation `d50ce4bfcef77117ca5d313da7ed5473d47633c3`, passed **1,053 named tests, zero failures**, and generated/drift-verified **707 projections**. The workflow committed **45 new artifacts** at `cb1416e1125a8150f22ef9901990fcf9e75d2937`, including the five required export-level inspection indexes. Session 15 adds **38 named tests: 17 model/view and 21 independent native RxJS tests**, plus **17 negative TypeScript assertions**. No additional bounded-enumeration count is claimed.

[Independent read-only PR #27 CI 43174656466](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43174656466), job **131035863742**, passed syntax, strict types, all **1,053 tests** and **707 committed projection checks**, with generation and publication skipped. Its exact synthetic checkout `63f07c609a987fc7f63a1ab69c96e374ca6b47c3` and PR head `59c9ef58f67960926fb9486594a89cc41e9f4b53` have the independently retrieved identical Git tree `6f2c1ad0c61ef211ea19a8025ef9358f29db8958`. The evidence PR merged as `f81331ac5a9801436b444d398f62a60140473b3e`. Closure changes documentation/planning only; these commits are not mislabeled as the CI-tested implementation. Exact provenance, initial failures and scope exclusions remain in the [evidence ledger](../evidence/SESSION-15.md).

**75 of 113 exports accepted within declared scopes; 38 pending; zero carryovers and no unresolved in-scope blockers.** No sixth name or second daily batch was started. **Session 16**, not before **13 November 2026 Europe/Zurich**, follows the queue: `pluck`, `publish`, `publishBehavior`, `publishLast`, `publishReplay`.


## Session 17 closed: 14 November 2026

Exactly five queued RxJS 7.8.2 export names—**race, raceWith, repeat, repeatWhen, retry**—were source-inspected and modeled using the existing guarded Mealy schema, runner, generator and independent native RxJS tests. The deprecated *pipeable* `race` is correctly distinguished from the root static `race` creation function. Both race exports select the first **next** and cancel losers, while early terminal events close; repeat counts **total** subscriptions, retry counts **additional** attempts with optional reset-on-success, and repeatWhen persists a lazy completion Subject/notifier. The scoped constraints, Cω descriptions, action policies and exclusions appear in [the technical guide](SESSION-17-RACE-RESTARTS.md).

Implementation [PR #32](https://github.com/hansschenker/rxjs-formal-way/pull/32) merged as `83c4ff3b02973f03c7f91db0e2a7a133c67b0188`. [Main push CI 43574059211](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43574059211), job `132384343859`, **succeeded**: syntax and strict TypeScript passed; **1,186 named tests** passed with zero failures; **797 ordinary projections plus three mergeWith scenario projections** were generated and drift-verified. The workflow committed **45 new Session 17 artifacts** at `78251f5565c38a1de9dc7ee8ad886ee49ac03003`, including five required public export inspection indexes. Session 17 added **29 pure-model tests, 28 independent actual RxJS tests and 21 negative TypeScript assertions**. No new exhaustive bounded-comparison count is claimed.

Independent read-only [PR #33 CI 43574318538](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43574318538), job `132385116372`, **succeeded** with **1,186 tests and 797+3 committed projection checks**, and with generation and publication explicitly skipped. Its actual synthetic checkout `380f17209f1c9a958d429901057b17d9fb4b19e6` and PR head `0b1ddf37f35d124976fd6f995c4c462a78d70745` share independently checked Git tree `3e37b412487f25d67ab0c16c9017f5492b4ff3d8`. The independent PR merged as `d3bdd4b1176627e8bb9b67eea89f8695d92a57d3`. Preliminary type errors and incorrect pipeable race import were corrected; the later implementation PR failed only expected pre-generation drift and is not represented as passing. See [Session 17 evidence](../evidence/SESSION-17.md).

**85/113 exports accepted within their declared scopes; 28 pending; zero carryovers.** No extra name or second session. Next five (not before 15 November 2026 Europe/Zurich): `retryWhen`, `refCount`, `sample`, `sampleTime`, `sequenceEqual`.


## Session 18 closed: 15 November 2026

One daily Europe/Zurich batch comprised exactly five pending RxJS 7.8.2 exported names: **`retryWhen`, `refCount`, `sample`, `sampleTime`, `sequenceEqual`**. The five were source-inspected at pinned revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. Canonical guarded Mealy rules, six-tuples, Cω-style shapes, scoped legality, source/notifier/scheduler time, cancellation/sharing, BDD, STT, diagrams, manifests, JSON/four-lane traces, operator pages and five export-level eleven-step indexes were generated with the unchanged infrastructure. The [technical guide](SESSION-18-RETRY-SAMPLING-SEQUENCE.md) records the precise profiles.

Implementation [PR #34](https://github.com/hansschenker/rxjs-formal-way/pull/34) merged as exact CI-tested commit `01188f29b9933bb5b9c046703fa686eca045487c`. [Main push CI 43689996403](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43689996403), job `132738442692`, succeeded: syntax/strict TypeScript passed, **1,246 named tests passed with zero failures**, and **842 ordinary + 3 specialized mergeWith deterministic projections** were generated and drift checked. The workflow committed **45 new artifacts** in `e32c5a29bc6b6f26e3a57875386c7297802b514c`. This batch added **60 named tests** and **21 negative TypeScript assertions**. There are no new exhaustive bounded-comparison claims.

Independent [read-only PR #35](https://github.com/hansschenker/rxjs-formal-way/pull/35), [CI 43690173511](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43690173511), job `132738988344`, **succeeded** with all **1,246 tests and 845 committed projections** verified; generation and publication were both skipped. The synthetic checkout `b6a556ef179046300001a2a5e6841420449af663` and PR head `82b7675c26f1914d08bf3c45b3345582ff8f3e8c` have independently retrieved identical Git tree `94ffbd5d9ef0b0a68c1a6d12c9908c31bb884d41`. The evidence PR merged as `a24d2c2cd1b92cf35c134cce9b69d718cec6a9a5`. Earlier checks failed strict null/event typing and then one *correctness-revealing* native `refCount` assertion; the model was fixed to retain the fixed `publish()` Subject terminal state, rather than weakening the check. An implementation PR run later passed the full named suite but failed only expected pre-generation drift. All outcomes are distinguished in [Session 18 evidence](../evidence/SESSION-18.md).

**90 of 113 exports accepted within declared scopes; 23 pending, zero carryovers, no second daily session.** Accepted profiles exclude unbounded or reentrant callback combinations, arbitrary custom scheduler/Subject types and custom sequence comparators. Next eligible batch (not before **16 November 2026 Europe/Zurich**): `single`, `skipLast`, `subscribeOn`, `switchMapTo`, `switchScan`.

## Session 19 closed: 16 November 2026

Exactly five distinct pending RxJS 7.8.2 exports were modeled in the preexisting Zurich session: **single, skipLast, subscribeOn, switchMapTo, switchScan**. The [Session 19 guide](SESSION-19-SELECTION-TRAILING-AND-SWITCHING.md) documents guarded state transitions, six-tuples, Cω shapes, event/time/cancellation/sharing constraints, and scope exclusions. The existing generator produced **45 new committed files** (eight generated views and one eleven-step inspection index per export).

The [main push CI 43826821532](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43826821532), job `133162520191`, succeeded on implementation `ef4e64e9dba045fa1c66cfe9622b82a3619b5776`: syntax, strict TypeScript, **1,308 passing named tests, zero failures**, and **887 ordinary + 3 specialized projections** generated and checked. New committed artifacts are at `7766b83be771ec644ad710659737743cae22e887`. The session added **62 named tests** and **19 negative TypeScript assertions**.

Independent [read-only verification PR #37](https://github.com/hansschenker/rxjs-formal-way/pull/37), [CI 43827248217](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43827248217), job `133163895316`, succeeded with all **1,308 tests and 887 + 3 committed projections** verified, while generation and publication remained skipped. A GitHub comparison of the CI synthetic checkout `8213563a5a4d12b1e36b8db0d489e3432e5159f0` against PR head `2a728b0b34c741fba0e956de20d0b6a38b49a0a4` returned zero changed files. Earlier pre-generation drift failures were not represented as passes. Details and unsupported profiles remain in [the evidence ledger](../evidence/SESSION-19.md).

**95/113 exports accepted within declared scopes; 18 pending, no carryovers, and no second 16 November session.** Next eligible batch on 17 November: `takeLast`, `tap`, `throttle`, `throttleTime`, `throwIfEmpty`.


## Session 20 closed: 18 November 2026 (continuation of 17 November)

The original five-name session—**takeLast, tap, throttle, throttleTime, throwIfEmpty**—was resumed and accepted within its documented scopes. Fourteen configured profiles provide guarded canonical models, all five six-tuples, Cω shapes, scenario-to-test mapping, and **117 new committed projections**, including the five required eleven-step inspection indexes. Source/scheduler time, synchronous callback boundaries, cancellation and subscription-local ownership remain explicit in the [technical guide](SESSION-20-TERMINAL-TAP-THROTTLE.md).

Implementation [PR #39](https://github.com/hansschenker/rxjs-formal-way/pull/39) merged as `a621f8b16f3d5294445524bbba9d0eba96bc8c93`. [Main CI 44244766057](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44244766057), job `134600945696`, succeeded with **1,416 named tests, zero failures**, strict types and syntax, **1,062 Session 20 comparison executions**, and **1,004 ordinary + 3 specialized projections** generated and drift-verified. The artifacts were already committed at `3aca059ce5218b77f435cb4d91b526fdd47674cd`; main regeneration produced no additional artifact commit. The batch adds **108 named tests** and **23 negative TypeScript assertions**.

Independent read-only [PR #41](https://github.com/hansschenker/rxjs-formal-way/pull/41), [CI 44244947929](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44244947929), job `134601533648`, passed the same complete checks with generation and publication skipped. Its head `ab99e17b164931ce6021f3f2a16b746ea2192263` and actual synthetic checkout `af240c43d931eab6a652a42b35739d946f18ac1f` have independently retrieved identical tree `262bd694a5ba9b5345f1fb08c778b9aaf57ccb8b`. Exact provenance, the earlier incomplete integration, the corrected missing-document check, and bounded-evidence limits remain in [Session 20 evidence](../evidence/SESSION-20.md).

**100/113 exports accepted; 13 pending; zero carryovers and no unresolved in-scope blockers.** Both dated records close the same Session 20; the 18 November continuation did not start an additional batch. Next eligible session is **19 November 2026 Europe/Zurich**, beginning with `timeInterval`, `timeout`, `timeoutWith`, `timestamp`, and `window`.

## Session 21 closed: 18 November 2026 (explicit date exception)

The user explicitly requested **“lets do Session 21 today 18.11.2026”** after Session 20 closed. The [separate numbered record](../planning/sessions/2026-11-18-session-21.json), reserved at `9889e30d2fef018e4ebf54d989170039466f6d98`, preserves that specific exception without changing the five-export limit or verification gates. Session 20's closure above remains a historical checkpoint; its next-date restriction was superseded for this requested session only.

Exactly five previously pending exports are accepted within documented scopes: **timeInterval, timeout, timeoutWith, timestamp and window**. The [session guide](SESSION-21-TIME-AND-WINDOWS.md) links all five six-tuples, Cω shapes, guarded pure TypeScript definitions and scenario-to-test evidence. Eleven configured examples produce **93 new committed projections**, including the five required eleven-step inspection indexes. The three window examples are histories of one semantic profile.

Implementation [PR #42](https://github.com/hansschenker/rxjs-formal-way/pull/42) committed implementation and artifacts at `ff2568b979f584ae54e0505cce0b9932fd323c69` and merged as `fa4579468c231b531585a0473c1a0c934fbb55d4`. [Main CI 44248935292](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44248935292), job `134614579068`, passed **1,544 named tests, zero failures**, strict types and syntax, **2,724 Session 21 comparison executions**, and **1,097 ordinary + 3 specialized projections** generated and drift-verified. Main regeneration produced no extra artifact commit. The batch adds **128 named tests** and **40 negative TypeScript assertions**.

Independent read-only [PR #43](https://github.com/hansschenker/rxjs-formal-way/pull/43), [CI 44249151096](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44249151096), job `134615286680`, passed the same complete checks with generation and publication skipped. Its head `9a172b6780d1135a0095156a96e589067f5417d1` and actual synthetic checkout `b933a428bed513c76f1ab16d92f30e28cf977a9f` have independently retrieved identical tree `3802d110c12b58987ef1156ff88d816bee99600f`. PR #43 merged as `e8b7c48235d490858cbafb1913b99d322e03b508`. Exact provenance, corrections and bounded-evidence limits remain in [Session 21 evidence](../evidence/SESSION-21.md).

**105/113 exports accepted; 8 pending; zero carryovers and no unresolved in-scope blockers.** The next five are **windowCount, windowTime, windowToggle, windowWhen and withLatestFrom**, ordinarily eligible on **19 November 2026 Europe/Zurich**. The final three pending exports are **zip, zipAll and zipWith**. No sixth export was included in Session 21.

## Session 22 closed: 20 November 2026 (continuation of 19 November)

The original five-name reservation—**windowCount, windowTime, windowToggle, windowWhen and withLatestFrom**—was completed and accepted within its documented scopes at the user's request to finish Session 22. Both [19 November](../planning/sessions/2026-11-19.json) and [20 November](../planning/sessions/2026-11-20.json) records close the same session. Earlier partial implementations and generated pages remain in history; no sixth export or additional batch was selected.

The [session guide](SESSION-22-WINDOW-POLICIES.md) and [scenario map](SESSION-22-SCENARIOS.md) connect all five explicit six-tuples, Cω shapes, guarded pure TypeScript models and independent actual RxJS evidence. Fifteen configured examples provide **125 Session 22 projections**, including the five required eleven-step inspection indexes. Forty-two projections existed before continuation; **83 new files** were added, and affected earlier views were regenerated. Session 22 contributes **184 named tests** over Session 21 (124 added during continuation) and **69 negative TypeScript assertions** (46 added during continuation).

Implementation [PR #46](https://github.com/hansschenker/rxjs-formal-way/pull/46) committed the complete implementation and projections at `788fcf534f9e92eaf4d8611b53cbaefbd8bc7d38` and merged as `771073aa296355422c5ce329cef51f3c08b39050`. [Main CI 44684834473](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44684834473), job `136116566832`, checked out that exact merge and passed **1,728 named tests, zero failures/skips**, strict types and syntax, **12,316 Session 22 model/native comparison executions**, and **1,222 ordinary + 3 specialized projections** generated and drift-verified. Main regeneration produced no additional artifact commit.

Independent read-only [PR #47](https://github.com/hansschenker/rxjs-formal-way/pull/47), [CI 44685325950](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44685325950), job `136118166086`, passed the same complete checks with generation and publication skipped. Its head `4d8bca667d58c3c5eba0bdf44368128bc9eb4686` and actual synthetic checkout `791dfd118f7f389cac601284eafbdb1b6f590b37` have independently retrieved identical tree `579229ca82d62a98acfeadc4cf1a808850aa9560`. PR #47 merged as `6316c8f9a268a44b9ead812234f7bc3e9ffdf9cc`. Exact provenance, the prior failed partial PR run, the corrected withLatestFrom teardown order and finite-evidence limits remain in [Session 22 evidence](../evidence/SESSION-22.md).

**110/113 exports accepted; three pending; zero carryovers and no unresolved in-scope blockers.** The remaining queue is **zip, zipAll and zipWith**, ordinarily eligible on **21 November 2026 Europe/Zurich**. Acceptance applies to the documented canonical scopes; native-only cases and source/spec inspection do not imply universal or infinite-trace equivalence.
