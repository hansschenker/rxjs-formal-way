# Session 15 evidence — Shared connections, scheduled delivery, recovery and split subscriptions

**Thursday, 12 November 2026 (Europe/Zurich).** Exactly five distinct RxJS 7.8.2 public export names: `mergeWith`, `multicast`, `observeOn`, `onErrorResumeNext`, and `partition`. The dated [session reservation](../planning/sessions/2026-11-12.json) was created on main after reading the live inventory and confirming no existing same-day log. The prior 70 accepted exports were not regenerated. Pinned upstream revision: `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.

## Source inspection and declared behavioral scope

All five exports were checked against [the version-pinned source export index](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/operators/index.ts) and their implementations. The [technical guide](../docs/SESSION-15-SHARING-SCHEDULING-AND-PARTITION.md) provides six-tuples, Cω shapes, guarded state constraints, time, cancellation and sharing.

- **mergeWith:** delegates to deprecated pipeable `merge(...others)` without concurrency or scheduler parameters. Scope: 0–32 valid Observable inputs, source-first setup, unbounded overlapping subscriptions, terminal and error identity. Reuses reviewed merge rules with distinct export provenance.
- **multicast:** deprecated **factory-plus-selector** overload: `multicast(() => new Subject(), shared$ => merge(shared$,shared$))`. Uses reviewed `connect` selector transition machine. Requires selected subscriptions before source, one underlying connection and duplicated values to two branches. **Fixed Subject, selector-less ConnectableObservable and refCount are excluded**, not silently equated.
- **observeOn:** one independently scheduled task per source next, error and completion; source scheduler remains unchanged. Virtual FIFO scheduler and nonnegative safe integer delay profile; queued values and terminal signals remain distinct, with downstream cancellation silencing scheduled actions. No claim for arbitrary scheduler ordering.
- **onErrorResumeNext:** pipeable deprecated alias of `onErrorResumeNextWith`; the root creation function of the same name is different. Serial input subscription, swallowing each source error, progressing on error **or** completion, final normal completion, silent cancellation. Observable-only selected profile.
- **partition:** literally returns two independent `filter` executions (pass and predicate-inverted), **not a single multicast dispatcher**. Each returned Observable has a separate source subscription and indexed predicate history; one subscription per branch is the modeled witness. Independent error/cancel lifetimes and externally hot source distinctions are explicit.

No new operator APIs or weakened validation. Three independent machines `session15-observeOn.ts`, `session15-onErrorResumeNext.ts`, `session15-partition.ts`; `session15-aliases.ts` composes previously reviewed merge/connect models for two strictly specified export profiles. The standard generator emitted canonical BDD, STT, state diagrams, obligations, manifests, predicted JSON traces, four-lane Markdown traces, readable pages, **and all five Session 15 required eleven-step export-level inspection indexes**. Model-predicted traces are not mislabeled as recordings of native RxJS.

## Commits and retrieved execution

| Role | Exact commit or workflow |
|---|---|
| Main dated-session reservation | [`eb82980226bcf6d0a10b169acc332e768b2ad763`](https://github.com/hansschenker/rxjs-formal-way/commit/eb82980226bcf6d0a10b169acc332e768b2ad763) |
| [Implementation PR #26](https://github.com/hansschenker/rxjs-formal-way/pull/26), corrected head | [`08436ad10c0910eee9c2c54f4eddf272aa739960`](https://github.com/hansschenker/rxjs-formal-way/commit/08436ad10c0910eee9c2c54f4eddf272aa739960) |
| Implementation PR merge and **main-tested** commit | [`d50ce4bfcef77117ca5d313da7ed5473d47633c3`](https://github.com/hansschenker/rxjs-formal-way/commit/d50ce4bfcef77117ca5d313da7ed5473d47633c3) |
| Generated-artifact commit (45 files) | [`cb1416e1125a8150f22ef9901990fcf9e75d2937`](https://github.com/hansschenker/rxjs-formal-way/commit/cb1416e1125a8150f22ef9901990fcf9e75d2937) |
| [Pre-generation PR run](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43174292944), job 131034673989 | **failed only generation drift** on 45 not-yet-committed projections. Syntax, strict TypeScript and all 1,053 named tests passed |
| [Main push run](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43174421942), job 131035100160 | **success**: 1,053 named tests, 0 failures; 707 generated and drift-verified projections; the 45 new files then committed by workflow |

Main push CI checked actual implementation commit `d50ce4bf...` after merging PR #26. Its log records `Generated 707 deterministic projections`, `# tests 1053`, `# pass 1053`, `# fail 0`, `Verified 707 deterministic projections`, and a generated commit adding 45 files, including five inspection indexes. This is an executed result, not an inferred count.

## Independent committed-file verification

[Read-only PR #27](https://github.com/hansschenker/rxjs-formal-way/pull/27) ran the unchanged validation workflow against the already committed artifacts. [Run 43174656466](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43174656466), job **131035863742**, completed with **success**. The retrieved job steps explicitly mark generation and publication **skipped**. Its execution log confirms syntax and strict TypeScript checks, **1,053 named tests passed with zero failures**, and **707 committed deterministic projections verified**.

| Provenance | Exact identity |
|---|---|
| Read-only PR head | `59c9ef58f67960926fb9486594a89cc41e9f4b53` |
| Read-only PR base | `cb1416e1125a8150f22ef9901990fcf9e75d2937` |
| Actual synthetic checkout from `git log -1 --format=%H` | `63f07c609a987fc7f63a1ab69c96e374ca6b47c3` |
| PR-head Git tree | `6f2c1ad0c61ef211ea19a8025ef9358f29db8958` |
| Tested-checkout Git tree | `6f2c1ad0c61ef211ea19a8025ef9358f29db8958` |
| Evidence PR merge | `f81331ac5a9801436b444d398f62a60140473b3e` |

The two tree identities were retrieved independently from GitHub's Git commit objects. The synthetic checkout is not mislabeled as the PR head; their checked file content is identical. The subsequent closure edits change documentation and planning only and are not represented as the implementation tested by this run.

All five required inspection indexes were included in the committed-file drift check: `operators/mergeWith-index.md`, `operators/multicast-index.md`, `operators/observeOn-index.md`, `operators/onErrorResumeNext-index.md`, and `operators/partition-index.md`. The session adds **45 generated artifacts**: forty standard profile projections and five export-level indexes.

## Test evidence and corrections

The 38 new named tests consist of **17 canonical model/view tests** and **21 independent actual RxJS 7.8.2 tests**. The model tests cover six-tuple validity, guarded late/stale events, scheduler due times, independent branch callback indices, subscription ownership and terminal/cancellation actions. Native tests directly exercise source-first subscriptions, hot/cold inputs, shared Subject delivery, independent cold `partition` subscriptions, TestScheduler notification timing and delayed errors, sequential error recovery, and source teardown. **17 new negative TypeScript assertions** validate action/event/state types. No additional exhaustive bounded scenario count was claimed.

Initial CI [43173849919](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43173849919) failed on a missing closing delimiter in `onErrorResumeNext` model rules; the malformed expression was corrected. The next CI [43174104105](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43174104105) reported 1,051/1,053 named tests passing; two **test harness expectations** were corrected without weakening checks: the TestScheduler example had prematurely snapshotted an empty events array before scheduled delivery, and an alias-identity assertion had tried to read `onErrorResumeNextWith` from `rxjs/operators` rather than from the **root RxJS export** where it is available. The corrected PR run passed all 1,053 tests and failed only the expected missing pre-generation artifacts. All 45 projections were subsequently generated via the existing main-branch workflow, rather than hand-written.

## Remaining scope limitations

Arbitrary reentrancy, source emissions during subscription acquisition, throwing observer/finalizer handlers, non-FIFO or custom schedulers, non-Observable input conversions, fixed-Subject/selector-less multicast overloads, multiple subscribers to one `partition` result and other explicitly excluded overloads remain **outside** the accepted behavioral claims. Actual tests plus finite traces do not provide a universal equivalence proof.

## Acceptance

The independent verification gate is satisfied. **All five exports are accepted within their declared scopes**, with **zero carryovers and no unresolved in-scope blockers**. Inventory: **75 of 113 exports accepted; 38 pending**. The existing dated Session 15 was resumed and closed; no duplicate session, sixth name, or catch-up batch was started.

The next pending batch is **Session 16**, not before **13 November 2026, Europe/Zurich**: `pluck`, `publish`, `publishBehavior`, `publishLast`, `publishReplay`.
