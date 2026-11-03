# Session 6 — accepted scoped terminal aggregation with independent committed-file verification

**3 November 2026 · Europe/Zurich.** The one daily session selected exactly five RxJS 7.8.2 export names: `reduce`, `count`, `toArray`, `min`, `max`. There were no carryovers from Session 5. This evidence record tracks seven generated configurations under **five** distinct operator names.

## Pinned semantics and deliverables

All five pinned implementations were inspected at RxJS revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`; [the technical guide](../docs/SESSION-06-AGGREGATION.md) documents source URLs, six-tuples, Cω shapes, behavioral guards, time, cancellation, memory ownership and exclusions. `reduce` is represented with both seed-presence profiles. `count` covers plain and indexed predicate profiles. `toArray` uses a fresh private buffer; `min` and `max` cover default numeric and custom comparer behavior.

The canonical guarded model `src/models/aggregate.ts` supplies all eight existing projections per configured example: BDD, STT, state diagram, obligations, JSON manifest, JSON trace, four-lane trace and readable operator page. This introduced **56 files** across seven configured examples. Schema 1.1, pure runner, renderers, workflow, dependencies and previously accepted operator models were not modified.

## Verified push run

| Role | Exact revision |
|---|---|
| Session reservation | `2a953a91bd3af942b1b6ce1d514ecc40a24a008d` |
| Initial candidate (failed a test harness issue) | `7aee3114660a2e9ff4dacc7ed8ad71b8ad862b58` |
| **Tested successful implementation** | **`70bc96e51f46c616e44fcb2a93ddb6172962d050`** |
| Generated artifacts committed by successful push CI | `df53eb7816a4f68e7ac0ad6e0f95f9713aadf05e` |

[Successful push run 41597414740](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41597414740), job **125787901271**, was retrieved and its steps/log examined. It installed pinned dependencies, generated the projections, ran JavaScript syntax checks and strict TypeScript checks (including negative assertions), compiled source, executed the pure and actual-RxJS tests, verified generation drift and committed 56 projection files onto main.

The initial push run [41597304898](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41597304898), job **125787552221**, failed **four** tests because the new test adapter eagerly constructed a callback for `toArray`, which has none. The adapter was corrected in implementation `70bc96e`. No model behavior, checks, strictness, dependency pin or workflow was weakened. That initial run is *not* acceptance evidence.

The **successful** run reports:

```text
# tests 670
# pass 670
# fail 0
Session 6: 1422 bounded model/native schedule comparisons.
Verified 264 deterministic projections.
```

Of the 670 named tests, **36 new named tests** belong to Session 6 (**23** model/view and **13** actual RxJS), while three further tests were added by unrelated M03 compositional pipeline work after the earlier 631-test baseline. The Session 6 driver separately enumerated **1,422** bounded model/native comparisons inside one named test; these are not extra named tests or a universal proof. Twelve new `@ts-expect-error` negative type assertions were checked, bringing the prior 100 to 112.

The 264 deterministic projections comprise **208 retained** and **56 new**. The successful push tested implementation `70bc96e`; the final generated-artifact commit `df53eb7` was created *after* the test step. These identities must not be conflated.

## Read-only committed-file verification

[Documentation-only PR #6](https://github.com/hansschenker/rxjs-formal-way/pull/6), [run 41597635014](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41597635014), job **125788609255**, completed successfully. The retrieved job steps show **generation skipped** and **publication skipped**; it ran the complete `npm run check` directly on committed files. The retrieved log reports **670 named tests passed, zero failures, 1,422 Session 6 bounded comparisons and 264 deterministic views verified**.

The PR head is `503789711db9a7fdf2421b82af52675a8e01ea57`, based on generated commit `df53eb7816a4f68e7ac0ad6e0f95f9713aadf05e`. The **actual synthetic PR checkout** was read from the job log: `693325757bea224f27a3b945cb193d9b07fb402e`. Independent Git-object reads confirmed both the synthetic checkout and PR head share **tree SHA `64741bd0279ce7599f6e4c8be8c206c5d3706715`**. This check did not regenerate views.

Final closure changes evidence, roadmap, operator index and session/progress planning only; its commit SHA is not misidentified as the tested implementation or read-only checkout.

## Scope and limitations

The tests cover seed presence, empty sources, predicate indices and truthiness, external reducer/comparer returns and exceptions, array payload identity/order, tie selection, synchronous and scheduled completion, source errors, cancellation, hot input with independent subscription-local aggregation, and source resource lifetimes.

**Excluded:** arbitrary reentrant user functions or observers, cancellation during callbacks, throwing finalizers, general coercion/getter side effects and unsafe numeric overflows. Default extrema comparisons are characterized for numeric input; custom comparers are tested independently. Model-predicted traces are not labeled as native recordings. The finite comparisons do not prove universal RxJS equivalence.

**All five exports are accepted within their declared scopes; no carryovers.** Inventory: **30 of 113 accepted, 83 pending**. The next eligible five-name queue is `audit`, `auditTime`, `buffer`, `bufferCount`, `bufferTime` not before **4 November 2026 Europe/Zurich**. Finite evidence is not universal proof.
