# Session 18 — Retry control, refcount, sampling and FIFO equality

**Local date:** 2026-11-15 (Europe/Zurich). **Exactly five distinct RxJS 7.8.2 export names:** `retryWhen`, `refCount`, `sample`, `sampleTime`, `sequenceEqual`.

**Starting inventory:** 85/113 accepted, 28 pending. **Pinned source:** [RxJS commit `e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791).

## Canonical model and scope evidence

The source-checked six-tuples, Cω notation, state-dependent legal behavior, source/scheduler timing, cancellation, sharing, and formal obligations are described in the [technical specification](../docs/SESSION-18-RETRY-SAMPLING-SEQUENCE.md).

| Export | Canonical TypeScript | Key semantics under test |
|---|---|---|
| `retryWhen` | [session18-retryWhen.ts](../src/models/session18-retryWhen.ts) | One lazy, persistent errors Subject and notifier; original errors are inner signals, not downstream values; notifier next retries; notifier completion immediately ends |
| `refCount` | [session18-refCount.ts](../src/models/session18-refCount.ts) | Legacy `publish()`/fixed Subject only; first join connects, last leave disconnects; fixed published Subject retains terminal complete/error for late subscribers |
| `sample` | [session18-sampling.ts](../src/models/session18-sampling.ts) | Source overwrite with presence bit, notifier-next-only release, notifier-complete `noop`, no flush at source completion |
| `sampleTime` | [session18-sampling.ts](../src/models/session18-sampling.ts) | Same sampling memory, with externally supplied virtual scheduler ticks and source-first subscription |
| `sequenceEqual` | [session18-sequenceEqual.ts](../src/models/session18-sequenceEqual.ts) | Two FIFO buffers, strict `===`, completion bits, immediate false on mismatch or excess, no result on cancellation |

The five export-level [inspection indexes](../operators/retryWhen-index.md) (and corresponding indexes for the other four exports) provide 11-step navigation, linking manifest, BDD, STT, state diagram, obligations, JSON trace, four-lane trace, operator page, source and tests. **The JSON trace is a deterministic canonical-model prediction, not an empirical native-RxJS capture.**

## Independent actual RxJS tests and negative type assertions

- [session18-model.test.mjs](../tests/session18-model.test.mjs): guarded transitions, stale resources, cancellation, value identity, nondelivery policy, FIFO matching, timer generations and malformed states.
- [session18-rxjs.test.mjs](../tests/session18-rxjs.test.mjs): native RxJS 7.8.2 `Observable`/`Subject` behavior and subscription teardown, persistent retry notifier, fixed published Subject's *retained terminal* behavior, marble-scheduled `sampleTime`, strict equality and terminal decisions.
- [session18.ts](../tests/types/session18.ts): **21 negative TypeScript assertions**, preserving strict typing for legal operator events/state/configurations.

One native `refCount` test exposed a semantic scope mistake in the initial model: a **fixed** `publish()` Subject retains completed/errored status for later subscribers rather than supplying a fresh Subject after terminal notification. The test was not weakened; the canonical model was corrected to use the previously verified `share` guarded transitions with **`resetOnRefCountZero: true`** but **`resetOnComplete: false`** and **`resetOnError: false`**, and the test independently verifies no new source connection after terminal events. `publish()`/fixed Subject must not be conflated with generic share policies or other `connectable` factory profiles.

## Exact retrieved GitHub verification evidence

| Gate | Recorded result |
|---|---|
| Source implementation PR | [#34](https://github.com/hansschenker/rxjs-formal-way/pull/34); merged to `main` as [`01188f29b9933bb5b9c046703fa686eca045487c`](https://github.com/hansschenker/rxjs-formal-way/commit/01188f29b9933bb5b9c046703fa686eca045487c) |
| Initial PR validation | [run 43689503027](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43689503027) **failed strict TypeScript**; nullable sample period and narrowed event names were fixed without relaxing validation |
| Intermediate PR validation | [run 43689734472](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43689734472) **failed one native `refCount` test**; the model's fixed-Subject terminal behavior was corrected |
| Latest pre-generation PR run | [run 43689929052](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43689929052): **1246 tests passed, 0 failed**, syntax and strict types passed, but **45 generated artifacts not yet committed** caused the expected drift failure. This run is **not** a passing overall check |
| Exact tested implementation | `01188f29b9933bb5b9c046703fa686eca045487c` |
| Main push CI | [run 43689996403](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43689996403), job `132738442692`: **succeeded**; generated new artifacts, syntax, strict types and all **1246 named tests** passed, 0 failures; **842 ordinary deterministic projections plus 3 specialized mergeWith scenario projections** verified |
| Generated artifacts commit | [`e32c5a29bc6b6f26e3a57875386c7297802b514c`](https://github.com/hansschenker/rxjs-formal-way/commit/e32c5a29bc6b6f26e3a57875386c7297802b514c): **45 generated files**, eight views plus one inspection index per five exports |
| Independent read-only PR verification | [PR #35](https://github.com/hansschenker/rxjs-formal-way/pull/35); [run 43690173511](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43690173511), job `132738988344`, **succeeded**: syntax, strict types, all **1246 tests** and **842+3 committed projections** verified, generation/publication both **skipped** |

From the prior accepted baseline of 1186 tests, this session added **60 named tests**. Total tracked projections rose from 800 to **845** (842 ordinary and three specialized). No new exhaustive bounded-equivalence count or general proof is claimed.

## Declared limitations

- `retryWhen`: synchronous retry/notifier reentrancy, errors Subject recursive emissions, Promise input conversions, notifier selector exceptions and overlapping source generations are outside scope.
- `refCount`: only legacy `publish()` fixed Subject, no external manual `connect()`, no custom Subject factory and no synchronous connect-time race. Terminal Subject retention **is** part of the verified profile.
- `sample`: a live notifier Observable, notifier.next triggers sampling; notifier completion never flushes. No observer reentrancy or arbitrary input conversion.
- `sampleTime`: positive integral virtual periods (1..1000), FIFO externally scheduled ticks; arbitrary scheduler behavior, invalid periods and same-instant setup races excluded.
- `sequenceEqual`: strict `===` comparator only, finite unmatched FIFO cap, post-setup notification order; custom callback comparator, unbounded queue and infinite-input liveness excluded.

## Independent checkout identity and acceptance

- Independent PR head **`82b7675c26f1914d08bf3c45b3345582ff8f3e8c`**.
- Actual CI synthetic merge checkout **`b6a556ef179046300001a2a5e6841420449af663`**; retrieved from workflow job log.
- GitHub commit objects independently report **identical Git tree `94ffbd5d9ef0b0a68c1a6d12c9908c31bb884d41`** for the PR head and synthetic checkout. Checked content is therefore identical at the tree level despite different commit SHAs.
- Read-only evidence PR [#35](https://github.com/hansschenker/rxjs-formal-way/pull/35) merged as [`a24d2c2cd1b92cf35c134cce9b69d718cec6a9a5`](https://github.com/hansschenker/rxjs-formal-way/commit/a24d2c2cd1b92cf35c134cce9b69d718cec6a9a5).
- Both **Generate projections on main before checking** and **Commit validated generated projections** steps were **skipped** on the independent pull-request run. All 45 generated session views were therefore checked as committed, not regenerated.
- **Accepted within declared scopes:** all five; **90/113 accepted, 23 pending, no carryovers**. Metadata/roadmap/session-log closure commits follow the tested implementation and are not represented as the exact implementation-tested revision.
- No sixth export and no second session on 2026-11-15. Next untouched five: `single`, `skipLast`, `subscribeOn`, `switchMapTo`, `switchScan` (not before the next Europe/Zurich local date).
