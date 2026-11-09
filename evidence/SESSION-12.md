# Session 12 evidence — recursive expansion, finalization and first-match selection

**9 November 2026 · Europe/Zurich.** Exactly five queued names: **expand, finalize, find, findIndex, first**. Session 11 had zero carryovers. Pinned RxJS revision: `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.

## Scope

The technical specification is [SESSION-12-RECURSION-FINALIZATION-SEARCH.md](../docs/SESSION-12-RECURSION-FINALIZATION-SEARCH.md). Canonical rules live in `src/models/session12.ts` and retain schema 1.1, the existing pure runner, renderers, strict TypeScript checks and generation workflow.

Five configured examples add **40 deterministic projections**, taking the total from 472 to **512**.

## Implementation and push verification

| Role | Identity |
|---|---|
| Session reservation | `eb7f3de5360cdf4f14aaeb03c05382ddb292581d` |
| Source implementation PR | #17 |
| Implementation merge / exact push-CI checkout | `9c6358b1f5db26e2e4059177186ae7d2b42bffe4` |
| Successful push run | 42573265945 |
| Push job | 129015255046 |
| Generated projection commit | `7fbd3b7f35940a6fec42d4a6da95089e3ec52b41` |

Before merge, PR run **42573150529** passed **919 named tests with zero failures**; its only failure was the expected drift check reporting the 40 new projections as not yet committed. Validation was not weakened.

The successful main push then generated those views and ran the complete checks:

```text
# tests 919
# pass 919
# fail 0
Verified 512 deterministic projections.
[main 7fbd3b7] docs: update verified generated operator projections
40 files changed
```

The previous accepted suite had 873 named tests. Session 12 contributes **46 new named tests: 24 model/view tests and 22 independent native RxJS tests**. `tests/types/session12.ts` adds **15 negative TypeScript assertions**, taking the cumulative total from 190 to **205**. No new bounded-enumeration count was introduced; retained bounded comparisons continue to run in the full regression suite.

## Behavioral evidence

Native tests independently cover:
- `expand`: laziness, recursive emission/projection indices, emit-before-project ordering, concurrency-one queuing, completion waiting, projection/inner error identity, and cancellation teardown;
- `finalize`: complete/error/unsubscribe execution, terminal-before-finalizer ordering, and downstream cancellation through `take`;
- `find`: original payload identity, source/index predicate arguments, undefined no-match result, short-circuiting, errors and cancellation;
- `findIndex`: zero-based match index, -1 no-match result, errors and cancellation;
- `first`: direct and predicate modes, `EmptyError`, explicit/default `undefined`, short-circuiting and error/cancellation distinctions.

## Independent committed-file verification

Documentation-only PR **#18** produced successful read-only CI run **42573479269**, job **129015901191**. Retrieved job steps show **generation skipped** and **publication skipped**. The execution log independently reports **919 tests passed, zero failures, and 512 committed projections verified**.

| Role | Exact identity |
|---|---|
| Read-only PR head | `3c35a22c6c134ce6813b9d6bc3b2a32fcc812fc7` |
| Read-only PR base | `7fbd3b7f35940a6fec42d4a6da95089e3ec52b41` |
| Actual synthetic checkout from job log | `4e5d90495aca0a6b8365e37c9a5e76e8bf83e053` |
| Read-only PR-head tree | `49ddd9112c09505696750872227d8b7af8d21adf` |
| Synthetic checkout tree | `49ddd9112c09505696750872227d8b7af8d21adf` |
| Evidence/guide merge | `e763b9af4ad4ccf3c8b8b5f60dafdf05c3ef4bdc` |

The synthetic merge SHA is deliberately not called the PR-head SHA; their Git trees were inspected separately and are identical.

## Acceptance status

**All five exports are accepted within their declared scopes.** There are zero carryovers and no unresolved blockers within scope. Inventory after Session 12: **60 of 113 accepted; 53 pending**. The next eligible Session 13 batch, not before **10 November 2026 Europe/Zurich**, is `groupBy`, `ignoreElements`, `isEmpty`, `last`, `mapTo`. Finite tests and declared profiles remain evidence, not a universal proof.
