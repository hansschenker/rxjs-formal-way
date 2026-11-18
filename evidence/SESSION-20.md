# Session 20 — Terminal buffering, tap lifecycle and throttle policies

**Session reserved:** 17 November 2026, 07:59:28 Europe/Zurich. **Continuation:** 18 November 2026, for the same five names. No additional batch or sixth export was selected. The accepted starting inventory was 95/113, with 18 pending.

**Acceptance status at integration:** pending final committed-artifact verification and closure. Earlier model/native CI passed, but the original generator omitted these operators. This ledger distinguishes that earlier result from the complete integration checks below.

## Scope and artifacts

The five exports are `takeLast`, `tap`, `throttle`, `throttleTime`, and `throwIfEmpty`. The [technical guide](../docs/SESSION-20-TERMINAL-TAP-THROTTLE.md) defines their six-tuples, Cω shapes, guarded transitions, resource ownership, time and cancellation. The [scenario map](../docs/SESSION-20-SCENARIOS.md) connects rule obligations, independent native expectations, bounded witnesses and inspected upstream scenarios.

| Export | Generated profiles | Public inspection index |
|---|---|---|
| `takeLast` | count 2 and zero/no-source | [takeLast](../operators/takeLast-index.md) |
| `tap` | all six hooks and next-only | [tap](../operators/tap-index.md) |
| `throttle` | all four leading/trailing combinations | [throttle](../operators/throttle-index.md) |
| `throttleTime` | all four combinations, positive duration 4 | [throttleTime](../operators/throttleTime-index.md) |
| `throwIfEmpty` | default and custom factory bindings | [throwIfEmpty](../operators/throwIfEmpty-index.md) |

Fourteen profiles produce 112 ordinary views plus five export indexes: **117 new committed projections**. The full expected registry is **1,004 ordinary projections + 3 specialized mergeWith projections**. Profile variants do not count as additional exports. The existing schema, runner, renderers, validation workflow and dependency pins are retained.

## Source and independent runtime evidence

RxJS is pinned to **7.8.2**, with source links at revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). All five implementations and upstream operator spec bodies were inspected, together with relevant `OperatorSubscriber`, timer and error-construction behavior. The upstream RxJS test suite itself was **not** run.

- [Pure-model tests](../tests/session20-model.test.mjs): 56 named tests, including bounded reachable witnesses for retained rules in 14 profiles.
- [Native RxJS tests](../tests/session20-rxjs.test.mjs): 47 named tests with independent expectations for notifications, callback errors, subscription lifetimes, timer policies and teardown.
- [Differential tests](../tests/session20-differential.test.mjs): three named tests performing **198 scalar/tap + 720 signal-throttle + 144 timer comparison executions = 1,062**. Native observations drive the adapters; model outputs do not decide the actual RxJS execution.
- [Artifact integration tests](../tests/session20-artifacts.test.mjs): two named checks of all five eleven-step indexes, exact profile grouping, associations and resolvable local links.
- [Strict type assertions](../tests/types/session20.ts): 23 negative assertions checked by the existing strict TypeScript configuration.

This integration adds 108 named tests to the 1,308-test baseline, for an expected **1,416**. Expected counts are not a substitute for an executed result.

## Earlier CI: partial integration, accurately retained

The original [PR #39](https://github.com/hansschenker/rxjs-formal-way/pull/39) head `0b5fc0229c9ecd84d858686ffb1870a0cf007f29` passed [run 44038936671](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44038936671), job `133888520844`. Retrieved logs show checkout `650ffbb7fd0d9a2c2020a7fc046c922e622f5220`, **1,414 tests passed, zero failures**, the 198/720/144 comparison counts, and syntax/strict types success. That checkout is the synthetic merge of the PR head with base `99e234962b625b43221b4ef9598c56111f804912`.

However, the drift check covered only **887 ordinary + 3 specialized projections** from preceding sessions. The Session 20 generator integration and indexes were absent, so this successful run did **not** complete Session 20 acceptance. The duplicate [PR #40](https://github.com/hansschenker/rxjs-formal-way/pull/40) was closed without merging; this continuation uses only the original PR #39.

## Limits of the evidence

These are scoped, nonreentrant models with explicit callback and subscription identities. Native tests characterize some additional synchronous setup cases without expanding the model scope. Same-time synchronous callback outcomes are a caller precondition for `tap` and `throwIfEmpty`; the generic `runTrace` does not validate that envelope-time condition. The throttle wrapper also validates event/envelope clock agreement.

`takeLast` counts are safe integers from -8 through 8. Timer-model durations are positive safe integers from 1 through 1000 and require deferred scheduling. Throwing lifecycle hooks, arbitrary producer/observer teardown failures, reentrancy during action words, unsupported input conversions and unrestricted infinite-trace liveness are excluded as detailed in the guide. A default-factory model outcome is assumed to be produced by the pinned EmptyError constructor; the serialized default example uses a nonempty source, while native tests check actual EmptyError construction.

The 1,062 cases are comparison executions, not necessarily distinct native histories: commands attempted after closure may be ignored. Bounded rule witnesses establish exercised paths, not complete state-space coverage or universal guard totality. No finite suite proves unrestricted observational equivalence. Unsubscribing a resource does not independently prove physical producer cancellation.

## Final integration verification

On 18 November, the completed local integration passed `npm run generate` and `npm run check`: syntax, strict TypeScript, **1,416 tests passed / zero failed**, all **1,062** Session 20 comparison executions, and exact drift verification of **1,004 ordinary + 3 specialized projections**. The two navigation tests verify every Session 20 profile, all five eleven-step indexes, their source/model/test/evidence associations and nonempty local targets. No validation configuration or workflow was weakened.

An earlier local check ran before the scenario guide was written and failed its new navigation test on that missing document: **1,415 passed / one failed**. It is not counted as a successful check. Writing the complete guide resolved that integration failure; the full unchanged check then passed.

Committed CI validation and final closure are still pending at this revision. Acceptance, inventory and dated logs remain open until complete committed-artifact verification has passed.

**Next untouched queue after acceptance:** `timeInterval`, `timeout`, `timeoutWith`, `timestamp`, `window`.
