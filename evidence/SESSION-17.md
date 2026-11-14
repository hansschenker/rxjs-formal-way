# Session 17 — five RxJS 7.8.2 export profiles

**Local session date:** 2026-11-14, Europe/Zurich. **Exactly five distinct export names:** `race`, `raceWith`, `repeat`, `repeatWhen`, `retry`. **Starting inventory:** 80/113 accepted, 33 pending. **Pinned RxJS 7.8.2 source revision:** [e5351d02e225e275ac0e497c7b66eaa5f0c88791](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791).

## Source-inspected canonical machines

All five names were read from version-pinned RxJS 7.8.2 source; the deprecated pipeable `race` delegates to `raceWith`, whose `raceInit` implements the candidate subscription and winner behavior. `repeat` and `retry` have different count meanings; `repeatWhen` retains one lazily-created completion Subject and notifier. Detailed six-tuples, Cω shapes, legal state constraints, time, cancellation and sharing are documented in [Session 17 technical guide](../docs/SESSION-17-RACE-RESTARTS.md).

- [`src/models/session17-race.ts`](../src/models/session17-race.ts) — two distinct exports, shared winner-selection algebra, first value versus terminal event, loser cancellation order, separate lifetime.
- [`src/models/session17-restart.ts`](../src/models/session17-restart.ts) — `repeat` counts *total source subscriptions*, `retry` counts *additional resubscriptions*, `resetOnSuccess` clears failure counter, no-delay finite bounds.
- [`src/models/session17-repeatWhen.ts`](../src/models/session17-repeatWhen.ts) — one persistent notifier and internal completion Subject, wait versus active, source/notifier error and cancellation policies.
- [`tests/session17-model.test.mjs`](../tests/session17-model.test.mjs) — guarded transitions, legality invariants, exact action ordering and model-predicted traces.
- [`tests/session17-rxjs.test.mjs`](../tests/session17-rxjs.test.mjs) — **independent actual RxJS**, Subject-controlled lifetimes, marble time comparisons, exact error/value identity and both retry reset profiles.
- [`tests/types/session17.ts`](../tests/types/session17.ts) — **21 negative TypeScript assertions** retaining strict types.

The imported `race` in native tests is the **pipeable export** from `rxjs/operators`, not the similarly named `rxjs` creation function. An initial native test incorrectly imported the creation function; a real failing CI case caught this, and the import was repaired without deleting tests or weakening validation.

## Retrieved test and generated evidence

| Check | Outcome and exact revision |
|---|---|
| Implementation PR [#32](https://github.com/hansschenker/rxjs-formal-way/pull/32) | Merged as [`83c4ff3b02973f03c7f91db0e2a7a133c67b0188`](https://github.com/hansschenker/rxjs-formal-way/commit/83c4ff3b02973f03c7f91db0e2a7a133c67b0188). This is the exact tested source commit. |
| Initial PR run [43573704996](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43573704996) | Failed strict TypeScript on phase union narrowing; corrected with explicit guarded state construction. **Not** represented as passing. |
| Intermediate PR run [43573795498](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43573795498) | Syntax and TypeScript passed; **1184/1186** tests passed. Two native tests revealed incorrect creation-function `race` import; fixed. **Not** represented as passing. |
| Latest pre-generation PR run [43573996080](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43573996080) | Syntax and strict types passed, all **1186 named tests passed**, zero failures. Failed **only** on 45 new files absent before main-branch generation; expected drift, not a passing full check. |
| Main push CI [43574059211](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43574059211), job `132384343859` | **Succeeded**. Executed `npm run generate`, syntax, strict types, all **1186 named tests**, 0 failures, and drift checks for **797 ordinary generated projections plus 3 specialized mergeWith projections**. |
| Generated files commit [`78251f5565c38a1de9dc7ee8ad886ee49ac03003`](https://github.com/hansschenker/rxjs-formal-way/commit/78251f5565c38a1de9dc7ee8ad886ee49ac03003) | The existing main push generator committed **45 new artifacts**, eight model projections plus the required public `operators/*-index.md` for each of the five exports. |
| Independent read-only verification | **Succeeded**: [PR #33](https://github.com/hansschenker/rxjs-formal-way/pull/33), [run 43574318538](https://github.com/hansschenker/rxjs-formal-way/actions/runs/43574318538), job `132385116372`, **1186 tests passed / 0 failed**, syntax + strict types passed, **797 ordinary + 3 mergeWith scenario projections drift-verified**, generation/publication skipped. |

The full test-suite count increased from 1129 to **1186**, adding **57 named tests**. Tests are independent of the pure Mealy models and check actual RxJS subscription lifetime and outputs; the latter are never represented as machine-predicted traces. Strict types added **21 negative assertions**. **No new exhaustive bounded comparison count** is claimed. Exact source and generated SHA checks form part of the already executed push workflow.

## Exclusions

- `race` / `raceWith`: 0–32 additional ordinary Observable sources with post-setup notifications. Synchronous subscription-time winning/terminal events, Promise/Iterable input conversion, observer reentrancy and throwing teardown are excluded. A separate **actual RxJS** native test documents the synchronous case without treating it as model equivalence.
- `repeat`: count 0–8 *total* runs, immediate restart, no time delay/selector and no infinite subscription count. Early errors terminate; repeat never retries errors.
- `retry`: 0–8 *additional* attempts with optional `resetOnSuccess`, no delay or custom notifier. Across attempts values retain original identity and order.
- `repeatWhen`: one lazily constructed, persistent notifier from a successful selector, only post-subscription notifier notifications; source errors, notifier errors and cancellation are checked. Synchronous reentrancy, notifier-next while a current source is already active, notifier selector throws and Promise conversion are explicitly excluded.

The checked state space is finite and scoped. Generated JSON traces encode **predicted model observations**, not a recording of actual RxJS 7.8.2 source execution. Acceptance, once independent verification succeeds, is for these declared profiles only; it is not a universal equivalence proof.

## Verified independent checkout identity

- Independent read-only PR head: `0b1ddf37f35d124976fd6f995c4c462a78d70745`.
- Actual GitHub Actions synthetic checkout: `380f17209f1c9a958d429901057b17d9fb4b19e6`.
- GitHub commit object inspection independently reports **matching Git tree** `3e37b412487f25d67ab0c16c9017f5492b4ff3d8` for both; checked content therefore corresponds to recorded PR head.
- [Read-only PR #33](https://github.com/hansschenker/rxjs-formal-way/pull/33) merged as [`d3bdd4b1176627e8bb9b67eea89f8695d92a57d3`](https://github.com/hansschenker/rxjs-formal-way/commit/d3bdd4b1176627e8bb9b67eea89f8695d92a57d3).
- Both the **Generate projections on main before checking** and **Commit validated generated projections** steps were skipped, demonstrating checks against already-committed generated views, including all five export indexes.
- The following tracker/log/roadmap closure is metadata documentation after verification; it is not misrepresented as the CI-tested implementation commit.

## Session accounting

Selected and worked exports: `race`, `raceWith`, `repeat`, `repeatWhen`, `retry`. No sixth operator. No second daily batch. Independent checks passed: these five are formally accepted within their declared scopes, leaving **85/113 accepted, 28 pending** and **zero carryovers**. The next untouched queue is `retryWhen`, `refCount`, `sample`, `sampleTime`, `sequenceEqual`.
