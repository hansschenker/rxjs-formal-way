# Session 19 — Uniqueness, trailing memory, deferred acquisition and latest-connection state

**Europe/Zurich local date:** 2026-11-16. **Five and only five RxJS 7.8.2 exports:** `single`, `skipLast`, `subscribeOn`, `switchMapTo`, `switchScan`. Session was reserved at 08:31:13 CET on already accepted main commit `486a8086e43679974b9719c306d11870086329d4`; the reservation itself was committed as `8ec12e698bf7ac7c37e5d5e4d6d3ed419a45532e`.

**Pinned source:** [RxJS 7.8.2 revision e5351d02e225e275ac0e497c7b66eaa5f0c88791](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). Read all five operator sources before implementation. Scope, six-tuples, Cω shapes, guarded state-dependent legality, time, cancellation and sharing are documented in [the Session 19 technical guide](../docs/SESSION-19-SELECTION-TRAILING-AND-SWITCHING.md).

## Independent policies and precise scopes

| Export | Canonical TypeScript model | Actual-RxJS characterization |
|---|---|---|
| `single` | [session19.ts](../src/models/session19.ts) (`createSingleModel`, direct and indexed-predicate modes) | Pending unique candidate until successful source completion; immediate SequenceError on a second match; EmptyError vs NotFoundError; callback indices, errors and teardown |
| `skipLast` | `createSkipLastModel` (bounded FIFO 0–8 and identity mode) | Count is *number of subsequent source emissions*, not time; FIFO replacement before downstream output; no suffix flush on completion or cancellation; negative-count identity characterized natively outside bounded model |
| `subscribeOn` | `createSubscribeOnModel` (deferred virtual FIFO scheduler, delays 0–8) | Source connection happens *when scheduled*, not at initial downstream subscribe; cancellation before action prevents source subscription; subsequent next/error/complete are not separately scheduled |
| `switchMapTo` | `createSwitchMapToModel` (reuse reviewed `switchMap` guarded transitions) | New inner subscription to exactly the **same configured Observable object** per outer next, with predecessor cancellation and current-inner completion waiting; deprecated result selector excluded |
| `switchScan` | `createSwitchScanModel` (reuse `switchMap` with accumulator memory) | Callback sees latest emitted inner value, initial seed; cancelled stale inner cannot update state; outer complete waits for current inner |

All five have guarded named canonical transition rules and tests; the implementation reuses the existing schema, runner, renderers, and generator, with no validation relaxation. `single` models callback invocation as an independently correlated event rather than concealing it in a prose predicate. `switchMapTo` and `switchScan` reuse the reviewed switching machinery rather than implement competing semantics.

## Checks and exact version provenance

- Main implementation PR [#36](https://github.com/hansschenker/rxjs-formal-way/pull/36), merged without force as **[ef4e64e9dba045fa1c66cfe9622b82a3619b5776](https://github.com/hansschenker/rxjs-formal-way/commit/ef4e64e9dba045fa1c66cfe9622b82a3619b5776)**. This is the **exact main push CI-tested implementation commit**.
- Preliminary PR runs [43826372515](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43826372515) and [43826692362](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43826692362) **failed overall** solely because the 45 new generated views were not yet committed. Logs explicitly show syntax and strict TypeScript passed and 1,308 tests passed, zero failed. These runs are **not** labeled overall successes.
- [Main push run 43826821532](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43826821532), job **133162520191**, **retrieved success** on the exact implementation commit: JavaScript syntax, strict TypeScript, **1,308 named tests passed, zero failures**, generation and drift-check of **887 ordinary projections + 3 specialized mergeWith scenario projections**.
- The unchanged GitHub Actions workflow committed **45 new session files** (8 generated views + 1 required eleven-step inspection index for each of the five exports) at **[7766b83be771ec644ad710659737743cae22e887](https://github.com/hansschenker/rxjs-formal-way/commit/7766b83be771ec644ad710659737743cae22e887)**. Retrieved GitHub commit lists exactly 45 added files.
- The baseline suite had 1,246 named tests; Session 19 added **62** (guarded model and independent native RxJS); **19 new negative TypeScript assertions** were strictly checked. No new exhaustive bounded-enumeration count is claimed.
- Independent read-only PR validation is pending at the time this evidence ledger was first committed. The accepted-status tracker and session log must **not** be closed until that validation passes and the exact checkout provenance is recorded.

## Verification sources and limitations

[Model tests](../tests/session19-model.test.mjs) inspect mutually exclusive guards, transition legality, callback indices, required action order, no stale resource emissions, explicit time and cancellation; predicted traces are distinguished from actual RxJS behavior. [Native RxJS tests](../tests/session19-rxjs.test.mjs) execute real RxJS 7.8.2 Observables, Subjects, source teardown, synchronous streams and TestScheduler. [Negative type assertions](../tests/types/session19.ts) reject illegal model event/state configurations. Each export has a [public inspection index](../operators/single-index.md) and the other four corresponding indexes, navigating overview, diagram, STT, BDD, trace, obligations, manifest, canonical model, pinned sources, tests and evidence.

Intentionally **excluded** are arbitrary observer/callback reentrancy, `single(BooleanConstructor)` type-guard specialization, unlimited `skipLast` counts, synchronous `queueScheduler` scheduling semantics, Promise/Iterable inner-source conversions, deprecated `switchMapTo` result selectors and infinite-trace universal liveness. An unsubscription requests resource teardown; it does not by itself prove physical producer cancellation. Finite tests are not an unrestricted equivalence proof.

**Queue after this batch, provided independent acceptance succeeds:** `takeLast`, `tap`, `throttle`, `throttleTime`, `throwIfEmpty`. No sixth name and no second local-date session are allowed.
