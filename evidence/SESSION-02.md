# Session 2 — verified acceptance record

## Acceptance and session identity

**Accepted within the declared scopes: switchMap, mergeMap, concatMap, exhaustMap and share.** The existing **2026-10-29 Europe/Zurich** session is closed with five completed names and no carryovers. No sixth name or second daily batch was started. The earlier five accepted operators were retained, not counted again.

Baseline: RxJS 7.8.2 at source revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. Flattening profiles use valid Observable bindings, non-reentrant synchronous projections, and post-setup source/inner delivery for exact teardown comparisons. Share uses the default Subject connector and boolean reset policies. See the [higher-order guide](../docs/SESSION-02-HIGHER-ORDER.md) and [share guide](../docs/M02-E-SHARE.md).

## Exact revisions and retrieved CI evidence

| Role | Revision / result |
|---|---|
| Implementation | `b97b8c6cab720d903a1991e8551726b6558b3b8a` |
| Forty generated files committed by validated push workflow | `145438f0ea8bfaa85c19acb7eff8e502baa9eb1f` |
| Documentation-only verification PR head | `6e902fbb3de4c98d3f181ed3502f4b128dce62a8` |
| Actual read-only PR checkout | `508db99746644c60d06cbeb7b4729eea976f15ad` |
| Verified PR checkout and head tree | `1932bbb50ff6f8a2b37b8b603ec7d033257204e7` |

The Git API confirmed that the synthetic PR checkout and the documentation head have exactly the same tree. The final acceptance commit changes only documentation and planning records; it does not change the implementation, tests, dependencies, workflow or generated artifacts tested above.

### 1. Push run: generation and full validation

- [Run 40852571860](https://github.com/hansschenker/rxjs-formal-way/actions/runs/40852571860), attempt 1, on implementation commit `b97b8c6`.
- [Job 123375446205 — characterize](https://github.com/hansschenker/rxjs-formal-way/actions/runs/40852571860/job/123375446205).
- Retrieved and inspected job log confirms dependency installation, generation, syntax checks, strict type fixtures, compilation, all tests and generation consistency succeeded.
- The workflow committed exactly 40 new generated files as `145438f`; the previous generated files were unchanged.

### 2. Read-only run: committed-file verification

- [PR 1](https://github.com/hansschenker/rxjs-formal-way/pull/1), documentation-only verification branch.
- [Run 40853083582](https://github.com/hansschenker/rxjs-formal-way/actions/runs/40853083582), attempt 1.
- [Job 123377160945 — characterize](https://github.com/hansschenker/rxjs-formal-way/actions/runs/40853083582/job/123377160945).
- Retrieved checkout log identifies `508db99746644c60d06cbeb7b4729eea976f15ad`.
- **Generate projections: skipped. Commit generated projections: skipped.** The job ran `npm run check` directly on the committed files.
- Syntax, type fixtures, compilation, model/native tests and the read-only `--check` comparison all passed.

Both inspected logs report:

```text
1..415
# tests 415
# pass 415
# fail 0
# cancelled 0
# skipped 0
# todo 0
Verified 88 deterministic projections.
```

The connector exposed no manual workflow-dispatch action. The existing pull_request path supplied the no-regeneration verification instead; the workflow was not changed and no manual-dispatch execution is claimed.

## Verified counts

| Check | Result |
|---|---:|
| Retained named tests | 223 passed |
| New pure-model and view tests | 107 passed: 62 flattening, 40 share, 5 views |
| New actual RxJS cases | 85 passed: 69 flattening, 16 share |
| Total named tests | **415 passed; zero failures** |
| Negative TypeScript assertions | 48 checked: 32 retained and 16 new |
| Generated views | **88 verified; 40 new and 48 retained** |
| New flattening model/RxJS scenarios | 8100 passed |
| New share model/RxJS scenarios | 6248 passed |
| Total bounded model/RxJS scenarios | 22997 passed, including the retained 8649 |

The retained 5022 instrumented/native scheduler-transparency comparisons are a separate observation check, not extra model inputs. Bounded comparisons occur inside named tests, not as extra named-test counts. Eleven generated examples cover ten distinct accepted export names; seeded and unseeded scan remain one operator.

## Scope per accepted name

| Operator | Accepted profile |
|---|---|
| switchMap | Current-inner replacement, projection outcomes, generation identity, completion waiting and cancellation |
| mergeMap | Admission, active-set delivery and raw FIFO queue; concurrency 1, 2 and unbounded runtime configurations; generated example uses 2 |
| concatMap | Serial admission with FIFO projection timing and completion draining |
| exhaustMap | Ignore while busy without queueing, projection calls or consumed indices |
| share | Default Subject, addressed subscriber lifecycle and all eight boolean reset combinations; generated example uses defaults |

Every instantiated rule has a legal state-reaching witness in the model tests. Independent native observations cover projection calls, values, source/inner lifetimes, teardown order and shared connection generations. Synchronous characterizations are separate from the exact post-setup action-trace comparison domain.

## Preparation and environment

The earlier preparation used Node 22.16.0 and TypeScript 5.8.3 with byte-identical baseline schema, runner and renderer. Its strict compilation, sixteen negative type fixtures, 107 model/view tests, syntax checks and forty new generated views passed locally. Direct cloning failed because github.com could not resolve in that container, and RxJS was not installed locally. No local full-suite or native-RxJS success is claimed.

The uploaded Git tree survived the interrupted session and was verified before committing. GitHub Actions installed the unchanged lockfile and executed the complete repository. Both CI logs confirm Node 22.16.0 and npm 10.9.2; dependencies remain TypeScript 5.8.3, RxJS 7.8.2 and tslib 2.8.1.

## Limits and next session

No arbitrary reentry, deprecated resultSelector, general ObservableInput conversion, reset-notifier profile, producer-abort guarantee, production effect interpreter or universal equivalence proof is supplied. Generated manifests carry reviewed annotations, not serialized executable transition bodies.

There are no unresolved acceptance blockers for these scopes. The next pending names are **switchAll, mergeAll, concatAll, exhaustAll and shareReplay**, on the next eligible local date, not a second session on 29 October. The inventory still has 103 pending names; recurring work should not be paused as if the full catalogue were complete.

```sh
npm ci --ignore-scripts
npm run check
```

Future results must identify their own tested revision and retrieved CI log. The containing acceptance commit records prior verified execution; it does not retroactively label itself as the checkout used by those runs.
