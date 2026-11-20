# Session 22 — Window policies and source-triggered latest values

**Dates:** reserved on 19 November 2026; continued on 20 November 2026, Europe/Zurich. **Status:** complete local integration passed; committed full-batch CI and final acceptance pending. The five selected exports are **windowCount, windowTime, windowToggle, windowWhen and withLatestFrom**.

The [original reservation](../planning/sessions/2026-11-19.json) and [20 November continuation](../planning/sessions/2026-11-20.json) describe the same session. The user requested **“lets finish session 22”**. No sixth export or new batch is selected. Starting accepted inventory remains **105/113**, with eight pending, until the complete acceptance gates pass.

## Existing implementation and continuation provenance

- `windowCount` [PR #44](https://github.com/hansschenker/rxjs-formal-way/pull/44) merged as `e083bf36bb3c96d71b864dfac2110d4dab38179d`. [Main CI 44482299334](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44482299334), job `135417194742`, passed 1,576 tests and verified 1,122 ordinary + 3 specialized projections. Its 25 generated files were committed at `6be9350e85243a61592f99bfc9c003c67ce34c5c`.
- `withLatestFrom` [PR #45](https://github.com/hansschenker/rxjs-formal-way/pull/45) merged as `9386bdaf4a20787442e90d2f0850497c4c3966a4`. [Main CI 44483312048](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44483312048), job `135420556935`, checked out that exact SHA, passed 1,604 tests, zero failures/skips, and verified 1,139 ordinary + 3 specialized projections. Its 17 generated files were committed at `800946330271bbaaf745ccb978d535a3fe62d7c7`.
- The earlier [PR #45 run 44483210355](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44483210355), job `135420216473`, **failed**. Retrieved logs show all 1,604 tests passed but the drift check reported 17 missing/stale `withLatestFrom` projection files. The later main run generated them. That failed read-only run is not an acceptance pass.
- The resumed live main was `800946330271bbaaf745ccb978d535a3fe62d7c7`. The continuation was recorded without force at [`d891e2a1769d80ba771cb993b3078443ca0318c0`](https://github.com/hansschenker/rxjs-formal-way/commit/d891e2a1769d80ba771cb993b3078443ca0318c0), preserving both earlier implementations and the original reservation.

The prior ledger had not caught up with the merged latest-value implementation. This continuation reconciles that record while completing the three outstanding window models and verifying the entire selected batch.

## Canonical scope and required artifacts

The [session guide](../docs/SESSION-22-WINDOW-POLICIES.md) follows Intuition → Specification → Verification. All five explicit six-tuples, Cω shapes, state-dependent guards, ordered actions, time, cancellation, sharing and exclusions are in the detailed guides. The [scenario map](../docs/SESSION-22-SCENARIOS.md) connects those obligations to independent tests.

| Export | Canonical source | Detailed guide | Public inspection index |
|---|---|---|---|
| `windowCount` | [Model](../src/models/session22-windowCount.ts) | [Count windows](../docs/SESSION-22-COUNT-WINDOWS.md) | [Inspect](../operators/windowCount-index.md) |
| `windowTime` | [Model](../src/models/session22-windowTime.ts) | [Timed windows](../docs/SESSION-22-TIMED-WINDOWS.md) | [Inspect](../operators/windowTime-index.md) |
| `windowToggle` | [Model](../src/models/session22-windowToggle.ts) | [Toggle windows](../docs/SESSION-22-TOGGLE-WINDOWS.md) | [Inspect](../operators/windowToggle-index.md) |
| `windowWhen` | [Model](../src/models/session22-windowWhen.ts) | [Successive windows](../docs/SESSION-22-WHEN-WINDOWS.md) | [Inspect](../operators/windowWhen-index.md) |
| `withLatestFrom` | [Model](../src/models/session22-withLatestFrom.ts) | [Latest-value gate](../docs/SESSION-22-LATEST-GATE.md) | [Inspect](../operators/withLatestFrom-index.md) |

Fifteen configured examples generate **125 Session 22 projections**: eight views per example plus five export indexes. Forty-two existed from the partial work; this continuation adds **83 new files** and regenerates affected earlier views. The complete local registry is **1,222 ordinary + 3 specialized mergeWith projections**. Multiple histories of one semantic profile do not count as additional exports or independent semantic profiles.

RxJS remains pinned to **7.8.2**, source revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). All five implementation and upstream spec bodies were inspected; the newly fetched windowTime/windowToggle/windowWhen sources byte-match the installed package. The upstream RxJS suite was not executed. Existing schema, runner, renderers, validation workflow, strict compiler settings and dependency pins remain unchanged.

## Tests and direct comparisons

| Export | Model tests | Native RxJS tests | Differential tests | Negative TypeScript assertions | Comparison executions |
|---|---:|---:|---:|---:|---:|
| `windowCount` | 16 | 16 | 1 | 12 | 2,916 |
| `windowTime` | 20 | 18 | 1 | 16 | 432 |
| `windowToggle` | 22 | 19 | 1 | 16 | 2,592 |
| `windowWhen` | 18 | 18 | 1 | 14 | 1,876 |
| `withLatestFrom` | 14 | 16 | 1 | 11 | 4,500 |
| **Family totals** | **90** | **87** | **5** | **69** | **12,316** |

Two additional [artifact tests](../tests/session22-artifacts.test.mjs) verify exact grouping of fifteen examples and all eleven navigation steps in the five indexes. Thus Session 22 contributes **184 named tests** over Session 21's 1,544-test baseline, bringing the full suite to **1,728**. Of these, 60 tests existed in the partial implementation and **124 were added during the continuation**. The 69 compiler assertions are separate from runtime counts; 46 were added in the continuation.

Each family guide links its model, native, differential and type files. Native literal-expectation tests import actual RxJS independently of the models. Differential adapters execute native RxJS first; actual subscribers, handles, factory calls and scheduler callbacks determine admitted history. Only afterward is that history replayed through the model. Ordered actions, notifications, time, supported function outcomes and resource lifetimes are compared.

The `windowTime` adapter also runs each schedule with an ordinary TestScheduler and compares visible notifications/lifetimes to detect instrumentation changes. Those extra transparency runs are **not** counted again as model/native comparisons. Comparison counts are finite executions, not necessarily distinct histories. Legal rule witnesses exercise retained rule IDs without proving universal guard totality.

## Executed local checks and corrections

The complete integration passed `npm run generate`, followed by the unchanged `npm run check`, on **Node v24.22.3**. Syntax and strict TypeScript passed; **1,728 named tests passed, zero failed, zero skipped**; all **12,316** Session 22 comparisons passed; **1,222 ordinary + 3 specialized projections** matched regeneration. All local links in the eight Session 22 guide/evidence documents resolved.

The continuation corrected a real discrepancy in the partial `withLatestFrom` model: native RxJS released live auxiliaries in argument order before releasing the source, while the old model predicted source-first cleanup. The model and assertions now agree with native observations and 4,500 direct comparisons. Documentation also stopped incorrectly calling its optional projector overload deprecated; that label does not appear in the pinned source. Zero-auxiliary and optional-projector return/throw cases are characterized by native-only tests without enlarging the canonical tuple profile.

Count-window state guards now require the exact reached stride history and preserve cancellation/error status at the final source count. New invalid-state cases reject forged registries. An early parallel build exposed a windowWhen discriminated-union narrowing error, corrected before the complete passing run. A windowToggle marble expectation used completion frame 9 where its source string completes at 10; the literal expectation was corrected and all focused/full tests passed. No validation gate was relaxed.

Read-only semantic peer reviews found no remaining concrete mismatch in toggle/when factory ordering, closing-completion behavior, opening-error disposal, generation-sensitive teardown or native-driven comparison histories. The time model was reviewed against scheduler registration order and its plain-scheduler transparency check. These are scoped reviews, not unrestricted proofs.

## Evidence limits

- `windowCount` supports positive safe-integer count/stride with zero stride normalized to size, post-setup atomic notifications and explicit consumer lifetimes.
- `windowTime` supports positive bounded span/interval/max-size parameters, safe supplied time and deferred scheduling. The external driver supplies FIFO order; guards check current identity, deadlines, ticks and time without reconstructing the entire scheduler queue. Physical Action allocation is normalized to logical timer resources.
- `windowToggle` models explicit synchronous selector outcomes and deferred valid closing Observables. Closing completion preserves an open window. Opening failure disposes current Subjects without child terminal notifications, unlike source/closing/selector failures.
- `windowWhen` models correlated synchronous factory outcomes and deferred closing acquisition. Both next and completion rotate; initial factory failure includes the source attempt with an already closed subscriber. Source/closer cleanup depends on generation.
- `withLatestFrom` accepts one to sixteen auxiliary Observables and tuple output. Optional projection, zero auxiliaries and synchronous setup are outside that canonical profile even when specifically characterized natively.

Window cancellation, terminal retention and handle invalidation differ by family and are not normalized to one policy. Native-only synchronous setup, finite synchronous closing or invalidated-handle cases do not silently expand the legal canonical event alphabet. Arbitrary reentrancy, throwing observer/producer teardown and universal infinite-trace liveness remain excluded. Resource-release actions describe connection teardown, not an independent proof that every external producer side effect stops.

## Committed verification and closure

The complete local result is not yet a claim about a GitHub-tested revision. Main generation verification, a separate read-only run with generation/publication skipped, exact checkout/tree provenance and final acceptance updates remain pending.

After those gates pass, the five selected exports will bring the accepted inventory to **110/113**, leaving **zip, zipAll and zipWith**. Both dated records must close the same Session 22; no sixth export belongs to this continuation.
