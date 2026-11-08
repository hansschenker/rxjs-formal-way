# Session 11 evidence — notification, index, suffix, quantifier and alias policies

**8 November 2026 · Europe/Zurich.** Exactly five distinct queued RxJS **7.8.2** exports: **dematerialize, elementAt, endWith, every, exhaust**. No extra profile counts as an export; previously accepted 50 names were not regenerated. Reservation: `91d03c84ca94dd9d64833a59fa3ee6a0d0325501`. Version-pinned source: `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.

## Scoped models and representations

Four explicit guarded TypeScript models live in `src/models/session11-scalar.ts`; `src/models/exhaust.ts` reuses the already-reviewed `exhaustAll` Mealy transducer because pinned source declares `exhaust = exhaustAll`. This preserves the existing schema 1.1, state/transition runner, renderer and generation infrastructure.

The [technical guide](../docs/SESSION-11-NOTIFICATIONS-SELECTION-QUANTIFIERS.md) records Cω shapes, typed six-tuples, guarded legal inputs, value/cardinality/time/concurrency/cancellation/termination/sharing policies and source provenance. Five models contribute **40 deterministic generated projections**: manifest, BDD, STT, diagram, obligations, predicted JSON trace, predicted four-lane trace and readable operator page. The inventory is now **472 generated projections**. These traces are **model predictions**, never described as recordings of native RxJS.

## Successful implementation push and exact checkout

| Role | Exact identity |
|---|---|
| Implementation code PR | [#15](https://github.com/hansschenker/rxjs-formal-way/pull/15) |
| **Actual checkout tested by main push** | **`9a95129960efef0157ac826a66bf66104add73c0`** |
| Successful push CI | [run 42458245679](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42458245679) |
| Retrieved job | **128661758627** |
| Generated files commit after passing checks | **`f5578df41466eda0fde5b7c7ed638a8bf83ab082`** |

The retrieved job log confirms the actual checkout through `git log -1 --format=%H`, and confirms on that checkout:

```text
Generated 472 deterministic projections.
# tests 873
# pass 873
# fail 0
Verified 472 deterministic projections.
[main f5578df] docs: update verified generated operator projections
40 files changed
```

Compared with the accepted Session 10 baseline (832 tests), the session adds **41 named tests**: **20 pure model/view tests and 21 independent actual RxJS 7.8.2 cases**. Fourteen new negative TypeScript assertions raise the cumulative total to **190**. No new bounded enumeration count was introduced; earlier bounded differential checks remained in the full suite.

The first PR CI correctly caught a generic action-union TypeScript mismatch in the typed predicate model. This was corrected with typed callback-specific action constructors. The second PR CI passed syntax, strict TypeScript, all 873 tests, but failed the expected generation-drift check because its 40 new projections had not yet been committed. The unchanged main push workflow generated, tested, verified and committed those exact 40. No validation gate, schema, existing model or dependency was weakened.

## Independent committed-file acceptance

**Pending independent read-only pull-request result.** This document revision creates a documentation-only verification candidate. GitHub Actions must check the committed files with generation and publication steps *skipped*. The PR's head revision and its synthetic merge checkout must be identified separately, including Git tree provenance; never infer that the synthetic checkout equals the head SHA.

## Scope and proof boundary

Native tests independently cover materialized terminal short-circuit, opaque error/payload identity, indexed early teardown and missing-default behavior, successful-only suffix order, empty-source vacuous truth, predicate callback index, exact exhaust alias identity, busy suppression, active-inner ownership, cancellation and error. The legal model profiles exclude malformed notifications, arbitrary reentrancy, throwing observers/finalizers, numeric index values outside nonnegative safe integers, scheduled endWith, every(thisArg), unrestricted ObservableInput conversion and callback-time cancellation. The modeled missing-index error is a named abstraction; native tests inspect actual RxJS ArgumentOutOfRangeError.

The finite test suite and generated views do not constitute universal proof of equivalence. **Acceptance is withheld until the independently retrieved committed-file CI check succeeds.**
