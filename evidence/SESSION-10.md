# Session 10 evidence — connection, latest-duration policy, defaults and delayed delivery

**7 November 2026 · Europe/Zurich.** Exactly five pending RxJS 7.8.2 export names reserved, with no carryovers from Session 9: **connect**, **debounce**, **defaultIfEmpty**, **delay**, **delayWhen**. A single dated session was reserved at 08:26:18 local time; no sixth name and no second daily batch. Pinned RxJS source revision: e5351d02e225e275ac0e497c7b66eaa5f0c88791.

## Scoped semantic profiles

- **connect:** default Subject plus selector equivalent to two merged subscriptions to that Subject. Selector output is subscribed before the original source, including synchronous source input; this is not a universal model of arbitrary selectors, custom connectors, or synchronous selected-result termination.
- **debounce:** Observable duration selectors and correlated callback outcomes. Each source next replaces pending value and duration; duration next emits, empty duration completion alone does not; source completion flushes pending; error/cancel discard.
- **defaultIfEmpty:** opaque configured fallback only on successful empty source completion. A source next carrying undefined is not empty.
- **delay:** nonnegative safe-integer relative delay; separate timer resource and deadline per source next. Scheduler clock supplied by the environment; source completion waits for all timers.
- **delayWhen:** Observable-valued indexed duration selector, independent concurrent subscriptions. First inner next emits bound source value; empty duration completion discards; source completion waits for pending durations.

The [technical guide](../docs/SESSION-10-CONNECTION-AND-DURATIONS.md) gives each scoped Cω shape, six-tuple (S,S₀,Z,A,T,G), named guarded rules, state legality, time, cancellation, teardown and sharing. The canonical models are in src/models/connect.ts, debounce.ts, defaultIfEmpty.ts and delayPolicy.ts, with shared metadata/action utilities in session10-common.ts. No schema, runner, renderer or validation policy was weakened.

**Scope exclusions:** arbitrary reentrancy, Promise/iterable input conversion, custom SubjectLike connector and unconstrained selected graphs, absolute Date/custom delay scheduler, deprecated delayWhen subscriptionDelay, observer/finalizer exceptions and cancellation during nested callbacks. The five accepted-profile candidates are not a universal RxJS implementation.

## Implementation execution and results (retrieved)

| Role | Exact identity |
|---|---|
| Session reservation | 592e2300d929a255412a5ae8415d901d20892afb |
| Source implementation PR | [#13](https://github.com/hansschenker/rxjs-formal-way/pull/13) |
| **Exact main checkout tested by push CI** | **fe5b2871545f2b9022f7427973d02533089ba06c** |
| Successful push CI run | [42352229850](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42352229850) |
| Retrieved CI job | **128342625388** |
| **Generated files commit after tests** | **951b4dacf71408c0de3aa5b4b58f0030f89a6a91** |

The retrieved push job shows generation on main, syntax checking, strict TypeScript, all pure-model and actual RxJS tests, and generation-drift verification successful. It then committed **40 new generated files**, bringing the total from 392 to **432 deterministic views**. Eight views per export remain: JSON manifest, BDD, STT, state diagram, obligations, JSON predicted trace, four-lane predicted trace, and readable operator behavior page.

Exact successful log excerpt:

    Generated 432 deterministic projections.
    # tests 832
    # pass 832
    # fail 0
    Verified 432 deterministic projections.
    [main 951b4da] docs: update verified generated operator projections
    40 files changed

The prior accepted suite had **797 named tests**. Session 10 contributes **35 new named tests**: **16 pure-model/view tests** and **19 independent native RxJS 7.8.2 cases**. A new tests/types/session10.ts file has **15 negative TypeScript assertions**, bringing the total to **176**. No new bounded-enumeration scenario count was introduced: existing bounded comparisons still run in the full regression suite.

The pre-merge read-only draft PR checked syntax/types/models/native tests successfully with **832 passing**, but failed its generation-drift step because its 40 generated views had not yet been committed. That expected gap was resolved by the unchanged main push workflow; it was not counted as accepted read-only verification. One preliminary TypeScript syntax error in duration rule mapping was corrected before the successful push run, without relaxing checks.

## Independent committed-file check

[Independent read-only PR #14](https://github.com/hansschenker/rxjs-formal-way/pull/14) completed successfully as [CI run 42352354713](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42352354713), job **128343006855**. Retrieved job steps prove both **generation and publication skipped**. The decoded execution log recorded **832 named tests passed, zero failures, 432 committed projections verified**. The checked synthetic merge commit was **f834a9487ca55ba1d75e3d8ca5f5796077aee495**, distinct from PR head **73dedfb4bff9ea905c62e66f3d3da3146f63e097**; their independently inspected Git trees are identical: **fe386e693087e460f601438c2e16e4b135ce7c3f**. The evidence PR was merged into main at **976b0cb96fbafb5a0ee7fe6e86233b74a401a4e9**.

## Scope, evidence and acceptance policy

The JSON trace and four-lane trace are **model predictions**, not captured native RxJS recordings. Native tests compare independently executed RxJS 7.8.2 notifications, object identity, subscription setup, virtual time, teardown and cancellation. The finite suite does not constitute universal proof. The initial generation PR did not alter the framework's strict TS, model, runtime or drift checks.

**Final acceptance:** all five distinct exports accepted within the declared scopes; independent committed-file verification passed. Zero carryovers or blockers within scope. The next batch, not before 8 November 2026 Europe/Zurich, is dematerialize, elementAt, endWith, every, exhaust. Inventory: **50 of 113 accepted; 63 pending**. The closure record is planning/sessions/2026-11-07.json.
