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

**Pending separate read-only PR run.** This staging document does not assert read-only success until job outcome, actual checkout SHA, matching Git tree and skipped generation/publication are independently retrieved. Acceptance and the dated closing record will be updated only after that verification.

## Scope, evidence and acceptance policy

The JSON trace and four-lane trace are **model predictions**, not captured native RxJS recordings. Native tests compare independently executed RxJS 7.8.2 notifications, object identity, subscription setup, virtual time, teardown and cancellation. The finite suite does not constitute universal proof. The initial generation PR did not alter the framework's strict TS, model, runtime or drift checks.

**Current status:** implementation CI succeeded, committed 432 views exist; independent read-only verification and formal progress closure pending. The next five untouched export names in the authoritative queue are dematerialize, elementAt, endWith, every, exhaust, not eligible as a second batch today.
