# Session 14 evidence — Notification data and merge-family state

**11 November 2026, Europe/Zurich.** Exactly five public RxJS 7.8.2 operator export names: **materialize, merge, flatMap, mergeMapTo, mergeScan**. The live daily log was absent before this session was reserved on main; no other operator export was selected. The prior 65 accepted names were not regenerated.

## Pinned implementation and semantic scope

The pinned upstream RxJS source revision is **`e5351d02e225e275ac0e497c7b66eaa5f0c88791`**, with operator files under `src/internal/operators/` and supporting `Notification.ts` and `mergeInternals.ts`. Each has a guarded TypeScript Mealy machine and Cω-style dataflow shape. The models reuse the existing schema, runner, flattening engine and projection generator. See the [technical specification](../docs/SESSION-14-NOTIFICATIONS-AND-MERGE.md).

- **materialize:** wraps each source next in a semantic N value, source terminal in C/E value followed by normal result completion; preserves opaque payload/error identity. Scope excludes Notification class instance/prototype or cached terminal object identity.
- **merge:** deprecated *pipeable* export, source-first subscription, unscheduled valid Observable inputs, optional bounded concurrency and FIFO admission, shared termination policy only when all inputs complete. No sharing introduced.
- **flatMap:** exact deprecated alias `flatMap === mergeMap`, reusing the overlapping inner state machine and cancellation semantics with its own export-level provenance.
- **mergeMapTo:** constant Observable object is subscribed separately for every admitted occurrence, supporting overlap, queueing, hot bindings, and per-subscription teardown.
- **mergeScan:** merge-family state plus latest inner-emitted accumulator. Correlated callbacks receive the accumulator snapshot at actual admission; concurrent projections can observe the same older seed. Inner values update the accumulator before downstream notification.

External source/scheduler time, cancellation, subscription ownership, state-dependent legal events and sharing boundaries are explicit. The generated traces are **model predictions**, not claimed recordings of native RxJS.

## Implementation and generated artifacts

| Role | Commit / link |
|---|---|
| Dated session reservation on main | [`8388b770`](https://github.com/hansschenker/rxjs-formal-way/commit/8388b7704c6f9d99ae6a81affbd8602a4626e5df) |
| Implementation pull request | [#24](https://github.com/hansschenker/rxjs-formal-way/pull/24) |
| Implementation PR head | [`08d56427`](https://github.com/hansschenker/rxjs-formal-way/commit/08d564276e5a2a213e1f9ef8fa5e2127aafdd009) |
| Merged and main-push-tested implementation | [`6aada9aa`](https://github.com/hansschenker/rxjs-formal-way/commit/6aada9aaab62e48f46ff36da0c7a9b101b82fe80) |
| Generated and committed projections | [`566ff6e0`](https://github.com/hansschenker/rxjs-formal-way/commit/566ff6e00805cb671a020f73844905ff54e2a672) |
| Read-only documentation verification PR | [#25](https://github.com/hansschenker/rxjs-formal-way/pull/25) |
| Read-only PR head | [`06c9c516`](https://github.com/hansschenker/rxjs-formal-way/commit/06c9c516da2869d4ba7117fd53202ddb6d19d2f0) |
| Read-only tested synthetic merge checkout | `1d17bbc3ca07e959cf3e943e98e93ba5b4698292` |
| Read-only documentation merge | [`707a8874`](https://github.com/hansschenker/rxjs-formal-way/commit/707a887495a0307c6f327163ab170f2871139c12) |

The five examples generated **45 new deterministic projections**: 8 standard representations and one **export-level inspection index** for each name. Each new `operators/<operator>-index.md` links all eleven required inspection steps. After the prior 65 export-level indexes were added, the baseline was 617 projections, increasing to **662**. The 45 generated files were committed by the existing main-branch generator, not manually crafted.

## Independently executed checks

**Pre-generation implementation PR #24:** [run 42980343008](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42980343008), job `130389040215`. Syntax, strict TypeScript, **1,015 tests** and compilation passed. The overall PR CI was **failed** only because 45 new generated projections and indexes were not yet committed. This result is **not** mislabeled as a full success.

**Main push generation and verification:** [run 42980571840](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42980571840), job `130389761778`, tested merge commit `6aada9aaab62e48f46ff36da0c7a9b101b82fe80`. Retrieved job conclusion: **success**. Log records `Generated 662 deterministic projections`, **1,015 named tests passed, 0 failed**, and `Verified 662 deterministic projections` before committing the 45 new files at `566ff6e0`.

**Independent read-only PR #25:** [run 42980757675](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42980757675), job `130390355972`. Retrieved job conclusion: **success**. The `Generate projections on main before checking` and `Commit validated generated projections` steps were explicitly **skipped**. On already-committed files, syntax, strict types, complete model and actual RxJS tests and generation drift passed: **1,015 named tests, zero failures, 662 verified deterministic projections**. The actual checkout, observed from the job checkout log, was synthetic merge `1d17bbc3ca07e959cf3e943e98e93ba5b4698292`. GitHub commit comparison PR head `06c9c516...` versus this checkout showed **zero changed files** (one synthetic merge commit ahead), confirming identical checked content.

Session 14 itself added **41 named tests**: **20 pure model/view tests** and **21 independent native RxJS tests**. It also introduced **15 negative TypeScript assertions** for source and event value shapes, Notification variants and state requirements. New bounded exhaustive-scenario comparisons: **none recorded** (do not infer an enumeration count). The native runtime tests exercise Notification values, virtual time, source subscription order, finite and hot/cold inner subscriptions, concurrency, queueing, error identity, silent cancellation and downstream teardowns.

## Acceptance and limits

All five names are **accepted only within their documented scopes**. There are **zero carryovers**. The public inventory is now **70/113 accepted**, **43 pending**.

Remaining exclusions: arbitrary subscription-time or observer reentrancy, throwing finalizers, Promise/Iterable conversion, deprecated result selectors and custom schedulers outside the selected profiles, and Notification prototype/cached-instance identity. Finite model/runtime comparisons and generated descriptions do not prove universal equivalence to all RxJS executions. Time and notification ordering are supplied by the source environment; the models do not impose an independent clock. The current status makes no claim about unexecuted checks.
