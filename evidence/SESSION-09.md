# Session 9 evidence — source-first combinations and sequential connections

**6 November 2026 · Europe/Zurich.** This continues the already-reserved five-name session: `combineLatest`, `combineLatestWith`, `concat`, `concatMapTo`, `concatWith`. No sixth export or second daily session was opened. The implementation and its generated views already existed on live main when the interactive continuation began; this continuation reviews scope, retrieves execution evidence and completes acceptance rather than claiming a second implementation batch.

## Version and scope

RxJS **7.8.2**, source revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. The two deprecated names `combineLatest` and `concat` refer to **pipeable exports from rxjs/operators**, not the creation functions. The supported profiles are Observable inputs, no optional projector or scheduler, non-reentrant delivery after atomic subscription setup, and constant-inner sequential subscriptions for `concatMapTo` without its deprecated result selector. The technical guide is [SESSION-09-JOINS-AND-CONSTANT-MAP.md](../docs/SESSION-09-JOINS-AND-CONSTANT-MAP.md).

Canonical modules `src/models/session09-joins.ts` and `src/models/concatMapTo.ts` reuse schema 1.1, the pure runner and all existing renderers. Five examples provide **40 new projections**, for **392 total**: manifest, BDD, STT, diagram, obligations, JSON trace, four-lane trace and readable operator page. Model traces are predictions, not native recordings. No accepted operator is counted again merely because its machinery is reused.

## Retrieved successful implementation run

| Role | Exact identity |
|---|---|
| Reviewed implementation branch head | `8d2f06d70638f7c801d0e35e4549cc080b3895b9` |
| **Actual main checkout tested by push CI** | **`597ba676568af18dfae69ef7a49d9fbfb14cd44a`** |
| Successful push run | [42181663215](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42181663215) |
| Retrieved push job | `127772452370` |
| Generated-artifact commit, created after tests | `5c250ebae93971a67657e4189809aced26a1344e` |

The decoded job log identifies the actual checkout with `git log -1 --format=%H`; it is the main merge commit above, **not** the implementation branch head. The run successfully installed pinned dependencies, generated projections, checked JavaScript syntax and strict TypeScript, ran the model and native tests, verified projection drift, then committed generated files.

The retrieved successful log records:

```text
# tests 797
# pass 797
# fail 0
Verified 392 deterministic projections.
```

The previous accepted suite had **758 named tests**. This session adds **39 named tests: 20 model/view tests and 19 actual RxJS tests**. `tests/types/session09.ts` contains **14 new negative TypeScript assertions**, giving **161 cumulative** from the prior 147. Session 9 adds targeted fixed runtime cases, **not a new bounded-enumeration comparison count**; existing bounded comparisons remain part of the full regression suite. Passing a finite suite does not establish universal equivalence.

Runtime observations cover lazy construction, source-first acquisition, all-input readiness, fresh latest arrays and payload identity, retained values from completed inputs, completion of an empty input while peers remain live, errors and cancellation, sequential source acquisition, repeated subscriptions to one constant inner Observable, and queue disposal. Selected synchronous cases characterize actual RxJS separately from the model's atomic-setup scope.

## Independent committed-file verification

The documentation-only [PR #12](https://github.com/hansschenker/rxjs-formal-way/pull/12) produced successful [read-only CI run 42259742601](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42259742601), job **128036228031**. Its retrieved job steps explicitly show **generation skipped** and **publication skipped**. The decoded execution log independently reports **797 tests passed, zero failures, and 392 deterministic projections verified** directly from the already-committed files.

| Role | Exact identity |
|---|---|
| Read-only PR head | `ee35ba02c5dc05ac4193d9ad1e20333f4b7fae3d` |
| Read-only PR base | `5c250ebae93971a67657e4189809aced26a1344e` |
| **Actual synthetic checkout, read from the job log** | **`5a917c99e604e74bb5defe8f2cb89afec21dbb6a`** |
| Checkout tree | `4097af0cecb60977f795c78b4ec2d8e6221ac6ff` |
| Independently verified identical PR-head tree | `4097af0cecb60977f795c78b4ec2d8e6221ac6ff` |
| Documentation PR merge | `e56fcff8ec5d5c8a44d0183c15d45eb840022e06` |

The synthetic merge checkout is not mislabeled as the branch head. Its Git object and the PR-head tree were independently inspected. The PR changed only this evidence document and the technical guide, correcting the meaning of Z in the six-tuple and making the runtime witness mapping explicit. The model implementation, generated projections, dependencies and validation workflow were unchanged.

The final closure edits only evidence, roadmap and planning records; its revision is not misidentified as the tested implementation. No new local runtime execution is claimed: runtime acceptance is based on the retrieved GitHub Actions executions above.

## Scope limits and interpretation

Excluded: arbitrary reentrancy, nested setup-time input delivery in the pure model, Promise/other ObservableInput conversion, optional deprecated projectors/schedulers/result selectors, cancellation inside observer/callback delivery, throwing observers/finalizers, and unbounded symbolic proof. Equal-time input ordering comes from the scenario; these operators add no scheduler and no sharing. A new subscription to the same inner Observable is not automatically a shared execution.

Generated obligation identifiers describe rule-level checks. The independent runtime tests in `tests/session09-rxjs.test.mjs` are named `S9-NATIVE ...` rather than literal rule-obligation IDs; the guide records their behavioral mapping. Rule coverage, runtime cases and artifact consistency are complementary checks, not interchangeable proof claims.

## Acceptance and next queue

**All five exports are accepted within their declared scopes. No carryovers or unresolved acceptance blockers.** The authoritative closure is [planning/sessions/2026-11-06.json](../planning/sessions/2026-11-06.json). The existing reservation was resumed, not duplicated; no sixth export was worked on.

Inventory: **45 of 113 distinct operator exports accepted; 68 pending**. The next eligible session is **Session 10**, not before **7 November 2026 Europe/Zurich**: `connect`, `debounce`, `defaultIfEmpty`, `delay`, `delayWhen`. The next batch has not been started.
