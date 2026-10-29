# Session 2 — validation record

## Scope and session identity

Resumption of the existing **2026-10-29 Europe/Zurich** session, originally started at 08:25:41. No second daily session is created. Exactly five export names are worked on: switchMap, mergeMap, concatMap, exhaustMap and share. The earlier five accepted operators are retained, not counted again.

RxJS 7.8.2, source revision e5351d02e225e275ac0e497c7b66eaa5f0c88791. Flattening profiles use valid Observable bindings, non-reentrant synchronous projections, and post-setup source/inner delivery for exact teardown comparisons. Share uses the default Subject connector and boolean resets. See the [higher-order guide](../docs/SESSION-02-HIGHER-ORDER.md) and [share guide](../docs/M02-E-SHARE.md).

## Preparation checks actually executed

Node 22.16.0 and TypeScript 5.8.3. The local preparation subset uses the byte-identical existing schema and runner, verified against their Git blob hashes. Strict compilation passed. Sixteen new negative TypeScript assertions passed. All 107 new model tests passed (62 flattening, 40 share, 5 generated-view tests). New JavaScript modules passed syntax checks. Forty new projections were generated with the unchanged renderer and checked byte-for-byte locally.

Direct Git cloning failed because github.com could not resolve in the preparation container. RxJS is not installed locally. **No local actual-RxJS success or full baseline-suite success is claimed.** The live repository's existing CI workflow installs dependencies, generates views, runs checks, then commits generated artifacts on main. That workflow is retained unchanged.

## Runtime acceptance pending retrieved CI

Expected total: 223 retained + 107 new pure-model + 85 new native-RxJS cases = 415 named tests. Sixteen new negative type assertions give 48 total. Five new configured examples produce 40 new views for 88 overall; seeded/unseeded scan remain two profiles of one already-accepted operator.

The new differential experiments contain 8100 flattening scenarios and 6248 share scenarios. Together with the retained 8649 comparisons, the expected model/RxJS domain totals 22997 scenarios. The prior 5022 scheduler-transparency comparisons remain a separate observation check, not extra model inputs.

Authored expectations are not passing evidence. Record the exact implementation commit, generated-artifact commit, retrieved CI run/job/log, and a read-only workflow_dispatch validation of the committed tree before acceptance. The existing push workflow regenerates before checking; the second run checks committed artifacts without regeneration and establishes genuine drift validation.

## Acceptance boundaries

No arbitrary reentry, deprecated resultSelector, general ObservableInput conversion, reset-notifier profile, producer-abort guarantee, production effect interpreter or universal equivalence proof is supplied. Native synchronous characterizations are separate from the post-setup action-trace equivalence domain. Generated manifests contain reviewed annotations, not serialized executable transition functions.

Carryovers remain all five selected names until verified runtime acceptance is recorded. Do not select a sixth name in this session.
