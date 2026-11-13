# Session 16 — RxJS 7.8.2 operator generation evidence

**Local date:** Friday, 2026-11-13 (Europe/Zurich).  
**Selected distinct exports:** `pluck`, `publish`, `publishBehavior`, `publishLast`, `publishReplay` (exactly five).  
**Prior inventory:** 75 of 113 accepted, 38 pending.  
**Pinned source:** [RxJS source revision](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791) (`7.8.2`).

## Model and native runtime implementation

- [Implementation PR #30](https://github.com/hansschenker/rxjs-formal-way/pull/30) merged as [`2df3fe326487b8c27e84614791d9cac36bb0e1df`](https://github.com/hansschenker/rxjs-formal-way/commit/2df3fe326487b8c27e84614791d9cac36bb0e1df).
- Five export models with guarded Mealy transition/action rules, cardinality, source provenance, time, cancellation and sharing: [`src/models/session16.ts`](../src/models/session16.ts).
- Independent native RxJS tests [`tests/session16-rxjs.test.mjs`](../tests/session16-rxjs.test.mjs), canonical model tests [`tests/session16-model.test.mjs`](../tests/session16-model.test.mjs), and strict TypeScript negative assertions [`tests/types/session16.ts`](../tests/types/session16.ts). No mocked implementation substituted for native RxJS.
- Existing mergeWith malformed-state negative test repaired to assert the actual invariant in `Error.message`; it still rejects the malformed state and was not disabled.

## Actually retrieved CI evidence

| Check | Exact recorded outcome |
|---|---|
| Implementation PR [run 43385793248](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43385793248), head `1e106228c589f17907fb0904cbfa5a704d1a066f` | Syntax and strict TypeScript passed; 1,129 named tests passed, 0 failed; failed generation drift because projections were not yet committed |
| [Main push run 43386110883](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43386110883), job `131754887292`, tested implementation merge `2df3fe326487b8c27e84614791d9cac36bb0e1df` | **Succeeded**. `npm run generate`, syntax, strict types, all **1,129 named model/native tests** (0 failures), and deterministic generation-drift checks passed |
| Main generated files commit [`adf2f591e8790a49f8592306e45ef11a80179261`](https://github.com/hansschenker/rxjs-formal-way/commit/adf2f591e8790a49f8592306e45ef11a80179261) | CI-generated, committed and pushed projections; existing pipeline generated 752 ordinary projections and three specialized mergeWith scenario projections |

**Generation detail:** five additional operator profiles each generated eight projections (manifest, BDD, STT, Mermaid state diagram, obligations, JSON trace, four-lane Markdown trace, plain-language operator page) plus five required, public export-level `operators/*-index.md` inspection indexes. 45 newly generated projections. The main CI also refreshed older projections stale after a previous unrelated renderer/mergeWith refinement, and validated them without weakening the checks. The totals 752+3 include **existing** generated artifacts and must not be described as new tests.

## Independent read-only verification

[Independent verification PR #31](https://github.com/hansschenker/rxjs-formal-way/pull/31) was opened **after** generation and merged after the read-only checks passed.

- [CI run 43386508048](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43386508048), job `131756137024`: **success**, exactly 1,129 named tests passed with 0 failures, syntax and strict TypeScript passed, **752 ordinary deterministic projections** and **3 dedicated mergeWith scenario projections** drift-verified.
- The read-only job's `Generate projections on main before checking` and `Commit validated generated projections` steps were **both skipped**, proving committed files (not newly generated replacements) were checked.
- PR head **`b7352f51dcebda85dce4415e3e932a66e436037a`**; actual GitHub synthetic PR merge checkout **`25af0c794ab4abc51e62aa15a6bd1cd011bd5f31`**. GitHub source commit inspection independently confirms both have the identical Git tree **`167d0c949615d3417de2311000510c6b9a93ed3c`**, so the checked content matches the recorded PR head exactly.
- Read-only evidence/guide merge: [`a2fcf290a1dccd4922943185f6af8b05ba2df10d`](https://github.com/hansschenker/rxjs-formal-way/commit/a2fcf290a1dccd4922943185f6af8b05ba2df10d). This documentation merge is **not** represented as the implementation checkout used for runtime tests.

All five `operators/*-index.md` inspection pages are present in the 752 committed projections and were drift-verified. **36 new named tests** (model and independent RxJS) were included in the 1,129-test suite; **15 negative strict TypeScript assertions** were added. No new exhaustive bounded-comparison count is claimed.

## Declared verification scope and limitations

- `pluck`: non-empty one-to-three plain-data string key path, missing properties, source errors/cancellation, independent cold subscriptions. Getter/proxy effects and zero-key return-value streams excluded (zero-key configuration throws).
- `publish`: selector-less fixed ordinary Subject, explicit connection and observer ownership.
- `publishBehavior`: selector-less fixed BehaviorSubject with seed and live-join latest value.
- `publishLast`: selector-less fixed AsyncSubject; final optional value emits only on successful completion.
- `publishReplay`: selector-less fixed ReplaySubject with count-bounded FIFO cache and infinite time window (count zero clamps to one).
- No selector overload for `publish`/`publishReplay`, custom timestamp/time window, automatic refCount, arbitrary reentrancy, source notifications while subscribe/connect teardown is being registered, postterminal source reconnection, throwing observer/finalizer or other explicitly excluded parameter profiles.
- Model-predicted traces are not native RxJS execution recordings; finite tests are not a universal equivalence proof.

**Accepted names:** `pluck`, `publish`, `publishBehavior`, `publishLast`, `publishReplay`, all within their explicit source-inspected profiles. **Carryovers:** none. **Inventory:** 80/113 accepted, 33 pending. No sixth export, second session or catch-up batch was attempted.  
**Next untouched queue:** `race`, `raceWith`, `repeat`, `repeatWhen`, `retry`.
