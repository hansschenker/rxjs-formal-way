# Session 2 — validation record

## Scope and session identity

Resumption of the existing **2026-10-29 Europe/Zurich** session, originally started at 08:25:41. No second daily session is created. Exactly five export names are worked on: switchMap, mergeMap, concatMap, exhaustMap and share. The earlier five accepted operators are retained, not counted again.

RxJS 7.8.2, source revision e5351d02e225e275ac0e497c7b66eaa5f0c88791. Flattening profiles use valid Observable bindings, non-reentrant synchronous projections, and post-setup source/inner delivery for exact teardown comparisons. Share uses the default Subject connector and boolean resets. See the [higher-order guide](../docs/SESSION-02-HIGHER-ORDER.md) and [share guide](../docs/M02-E-SHARE.md).

## Verified push-run result

**415 passed, 0 failed, 0 cancelled, 0 skipped, 0 TODO.**

- Implementation commit: `b97b8c6cab720d903a1991e8551726b6558b3b8a`.
- Workflow run: [40852571860](https://github.com/hansschenker/rxjs-formal-way/actions/runs/40852571860), attempt 1, push on main.
- Job: [123375446205 — characterize](https://github.com/hansschenker/rxjs-formal-way/actions/runs/40852571860/job/123375446205).
- Retrieved log confirms successful dependency installation, generation, syntax checks, strict type fixtures, compilation, all tests and exact generated-file consistency.
- The workflow committed exactly 40 new generated files as `145438f0ea8bfaa85c19acb7eff8e502baa9eb1f`; the prior generated views were not changed.
- Environment: Node 22.16.0, npm 10.9.2; unchanged lockfile pins TypeScript 5.8.3, RxJS 7.8.2 and tslib 2.8.1.

Inspected log summaries:

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

The push workflow regenerates before checking. Therefore a separate **read-only pull-request run** will validate the already-committed generated files before acceptance is recorded. The connector exposes no manual workflow-dispatch action; the existing pull_request path provides the same no-regeneration check without changing the workflow. No manual-dispatch execution is claimed.

## Preparation checks actually executed

Node 22.16.0 and TypeScript 5.8.3. The earlier local preparation subset used the byte-identical existing schema, runner and renderer, verified against their Git blob hashes. Strict compilation passed. Sixteen new negative TypeScript assertions passed. All 107 new model tests passed (62 flattening, 40 share, 5 generated-view tests). New JavaScript modules passed syntax checks. Forty new projections were generated and checked byte-for-byte locally.

Direct Git cloning failed because github.com could not resolve in that preparation container, and RxJS was not installed locally. No local actual-RxJS or full-baseline success is claimed. GitHub Actions subsequently verified the complete committed implementation as recorded above. The interrupted conversation's local workspace was no longer mounted when work resumed; its already-uploaded Git tree was verified and committed rather than rebuilding or inventing local results.

## Counts verified by the push run

223 retained + 107 new pure-model + 85 new native-RxJS cases = **415 named tests**. Sixteen new negative type assertions give 48 total. Five new configured examples produce 40 new views for 88 overall; seeded/unseeded scan remain two profiles of one already-accepted operator.

The new differential experiments contain 8100 flattening scenarios and 6248 share scenarios. Together with the retained 8649 comparisons, the model/RxJS domain totals 22997 scenarios. The prior 5022 scheduler-transparency comparisons remain a separate observation check, not extra model inputs. These comparisons occur inside named tests and are not extra named-test counts.

## Acceptance boundaries

No arbitrary reentry, deprecated resultSelector, general ObservableInput conversion, reset-notifier profile, producer-abort guarantee, production effect interpreter or universal equivalence proof is supplied. Native synchronous characterizations are separate from the post-setup action-trace equivalence domain. Generated manifests contain reviewed annotations, not serialized executable transition functions.

The five names remain pending final acceptance until the read-only committed-tree check is retrieved. Do not select a sixth name in this session.
