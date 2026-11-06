# Session 9 evidence — source-first combinations and sequential connections

**6 November 2026 · Europe/Zurich.** This continues the already-reserved five-name session: `combineLatest`, `combineLatestWith`, `concat`, `concatMapTo`, `concatWith`. No sixth export or second daily session was opened. The implementation and its generated views already existed on live main when the interactive continuation began; this continuation reviews scope, retrieves execution evidence and completes acceptance rather than claiming a second implementation batch.

## Version and scope

RxJS **7.8.2**, source revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. The two deprecated names `combineLatest` and `concat` refer to **pipeable exports from rxjs/operators**, not the creation functions. The supported profiles are Observable inputs, no optional projector or scheduler, non-reentrant delivery after atomic subscription setup, and constant-inner sequential subscriptions for `concatMapTo` without its deprecated result selector. The technical guide is [SESSION-09-JOINS-AND-CONSTANT-MAP.md](../docs/SESSION-09-JOINS-AND-CONSTANT-MAP.md).

Canonical modules `src/models/session09-joins.ts` and `src/models/concatMapTo.ts` reuse schema 1.1, the pure runner and all existing renderers. Five examples provide **40 new projections**, for **392 total**: manifest, BDD, STT, diagram, obligations, JSON trace, four-lane Markdown trace and readable operator page. Model traces are predictions, not native recordings. No accepted operator is counted again merely because its machinery is reused.

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

**Pending in this candidate evidence revision.** The documentation-only PR for this record will run the existing validation workflow on committed files, with generation/publication skipped. Acceptance is not yet asserted here. The final record must identify the retrieved run/job, actual checkout revision, test and drift results and any provenance limitations. No unexecuted check is labeled passed.

## Scope limits and interpretation

Excluded: arbitrary reentrancy, nested setup-time input delivery in the pure model, Promise/other ObservableInput conversion, optional deprecated projectors/schedulers/result selectors, cancellation inside observer/callback delivery, throwing observers/finalizers, and unbounded symbolic proof. Equal-time input ordering comes from the scenario; these operators add no scheduler and no sharing. A new subscription to the same inner Observable is not automatically a shared execution.

Generated obligation identifiers describe rule-level checks. The independent runtime tests in `tests/session09-rxjs.test.mjs` are named `S9-NATIVE ...` rather than literal rule-obligation IDs; the guide records their behavioral mapping. Rule coverage, runtime cases and artifact consistency are complementary checks, not interchangeable proof claims.

The authoritative dated session remains `planning/sessions/2026-11-06.json`. Closure must retain exactly these five worked names, report no carryovers only after all required checks pass, and advance the queue without beginning the next batch.
