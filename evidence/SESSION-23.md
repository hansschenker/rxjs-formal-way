# Session 23 — Final zip-family exports

**Date:** 20 November 2026, Europe/Zurich. **Status: closed and accepted within documented scopes.** Complete implementation PR, main generation CI and independent read-only verification passed. Exactly **zip, zipAll and zipWith** are selected. The final three exports bring the accepted inventory to **113/113**, with zero pending names and zero carryovers.

## Reservation and authorization

The user requested **“lets do this final session 23 today as planned on 20.11.2026 Zurich Time”** after Session 22 closed. The [separate numbered record](../planning/sessions/2026-11-20-session-23.json) preserves this explicit date exception and the already closed [Session 22 continuation](../planning/sessions/2026-11-20.json). The specific instruction supersedes the ordinary 21 November start for Session 23 only. The maximum-five-export limit and all verification gates remain in force; the final batch contains only the three remaining names.

Live main was `d739fcfad8c054065b4cc22fa7224fb49699b1cd`. The reservation was recorded without force at [`a9cc9d559e8588e9cd95d307e616fd0dbd45d9d5`](https://github.com/hansschenker/rxjs-formal-way/commit/a9cc9d559e8588e9cd95d307e616fd0dbd45d9d5), after checking the live inventory, roadmap, daily plan and dated records. The unrelated open PR #29 is outside this session.

## Required scope and artifacts

The [teaching guide](../docs/SESSION-23-ZIP-FAMILY.md) follows Intuition → Specification → Verification; the [scenario map](../docs/SESSION-23-SCENARIOS.md) connects behavior to independent evidence. The inventory's `zip` entry is the deprecated **pipeable** export from `rxjs/operators`, not the static creation function.

| Export | Detailed six-tuple and Cω guide | Canonical rules | Public index |
|---|---|---|---|
| `zip` | [Pipeable zip](../docs/SESSION-23-ZIP.md) | [Shared FIFO model](../src/models/session23-zip-common.ts) | [Inspect](../operators/zip-index.md) |
| `zipAll` | [Collected inner streams](../docs/SESSION-23-ZIP-ALL.md) | [Deferred join](../src/models/session23-zipAll.ts) | [Inspect](../operators/zipAll-index.md) |
| `zipWith` | [ZipWith](../docs/SESSION-23-ZIP-WITH.md) | [Shared FIFO model](../src/models/session23-zip-common.ts) | [Inspect](../operators/zipWith-index.md) |

Nine configured examples are registered for **75 new projections**, including all three required eleven-step indexes. The committed and verified complete registry is **1,297 ordinary + 3 specialized projections**. Model definitions and example histories are distinct from independent actual RxJS observations. Detailed parameter, setup, queue-bound, cancellation and sharing scopes remain explicit.

## Source inspection and model scope

RxJS remains pinned to **7.8.2**, revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). All three operator implementation and upstream spec bodies were fetched and inspected, together with the static zip kernel, joinAllInternals and relevant completion/finalization code. Retrieved zip, zipWith, zipAll, static zip and joinAllInternals bodies byte-match the installed package; root independently confirmed the three public operator blob hashes. The upstream RxJS suite was **not executed**.

The direct models share one pure FIFO kernel and retain separate export metadata, rule identifiers, wrappers, examples and native tests. Their scope admits **1–16 total Observable inputs**, including the source, and retained-queue analysis bounds **1–32**. Zero auxiliaries produce singleton tuples. ZipAll admits **0–16 collected Observable occurrences** and retained-queue bounds **1–16**. These are canonical analysis limits, not native queue capacities, dropping policies or backpressure.

All canonical inputs are valid Observable descriptions with non-notifying acquisition and atomic notifications after setup. Tuple/array output preserves payload identity. Time comes from supplied source events; no clock, timer, implicit sharing or replay is added. ZipAll's completion barrier and its successful-release-before-downstream-completion ordering are independently observed and modeled explicitly.

## Tests and direct comparisons

| Export | Model tests | Native RxJS tests | Differential tests | Negative TypeScript assertions | Comparison executions | Concrete rule witnesses |
|---|---:|---:|---:|---:|---:|---:|
| `zip` | 18 | 19 | 1 | 16 | 7,776 | 8 |
| `zipAll` | 20 | 20 | 1 | 16 | 9,024 | 13 |
| `zipWith` | 16 | 18 | 1 | 15 | 10,368 | 8 |
| **Family totals** | **54** | **57** | **3** | **47** | **27,168** | **29** |

Two [navigation tests](../tests/session23-artifacts.test.mjs) verify the three required indexes, nine-example grouping and all eleven inspection steps. One independent [catalogue test](../tests/session23-catalogue.test.mjs) compares the inventory with all **113 actual function exports from rxjs/operators** and requires a published index, canonical rules, model/runtime test files and an evidence record for every export. The final three are the only previously missing indexes.

Thus Session 23 adds **117 named tests** over Session 22's **1,728**, bringing the complete suite to **1,845**. The 47 negative compiler assertions are separate from runtime counts. Nine examples × eight views plus three indexes give **75 new projection files**, increasing the complete registry from **1,222 ordinary + 3 specialized** to **1,297 ordinary + 3 specialized**, or **1,300 total**.

Native literal-expectation tests execute actual RxJS independently of the canonical models. Differential adapters run native RxJS first and use actual Subscriber liveness for event admission; they replay that recorded history through the model afterward. Ordered notifications, supplied times, opaque value/error identity and connection lifetimes are compared. Model state does not control the native execution. The finite counts are execution counts and can include repeated histories.

The direct zip matrix is 3 input counts × 3 seeds × 6³ command choices × 4 endings = **7,776**. ZipWith independently uses four seeds for **10,368**. ZipAll includes 24 collection-ending cases plus 3 counts × 2 source arrangements × 3 seeds × 5³ commands × 4 endings = **9,024**. Duplicate producer occurrences remain separate subscriptions. Queued histories fit the declared bounds without model-driven filtering of native events.

## Executed local checks and corrections

On **Node v24.22.3**, `npm run generate` produced **1,297 ordinary + 3 specialized projections**. The unchanged complete `npm run check` then passed syntax, strict TypeScript, **1,845 tests with zero failures or skips**, all **27,168** Session 23 comparisons, and byte-for-byte generation drift verification. All local links in the six Session 23 guide/evidence documents resolved. The three generated indexes group exactly nine examples. All 113 native exports have index and evidence coverage.

The first full run passed 1,844 tests and failed one newly written navigation assertion: it assumed the detailed operator guide must be the step-10 coverage link. The shared zip model correctly links the common scenario map there and the detailed guide at step 4. The test was corrected to require each export's declared coverage path, with an additional manifest coverage assertion. The complete rerun passed all 1,845 tests. No model, renderer or verification gate was relaxed.

Peer review corrected one overbroad zipAll metadata statement that had grouped non-Observable conversions with native-characterized cases. Conversions remain excluded; only actually executed projector/setup cases are characterized. No canonical scope was expanded. Independent reviews found no remaining concrete mismatch in FIFO guards, native-first admission, source/inner acquisition or successful/error cleanup ordering.

A native-only legacy overload test confirms that `source.pipe(zip([a$, b$]))` supplies one iterable input whose values are the Observable objects; it does not subscribe to a$ and b$. The canonical pipeable model therefore explicitly covers rest Observable arguments. Optional projector return/throw, synchronous acquisition and cancellation during output are characterized separately where tested. They do not silently enlarge the canonical alphabet.

Existing schema, runner, renderers, validation workflow, strict compiler settings and dependency pins are unchanged. The unrelated open PR #29 remains untouched.

## Evidence limits

Generated histories are predictions, not native recordings. Concrete rule witnesses show that each retained rule has a legal exercised case; they do not prove all guard combinations. The finite differential corpus does not prove unrestricted equivalence, unbounded queue behavior, arbitrary reentrancy or universal infinite-trace liveness. Throwing observers/producer teardown and unsupported ObservableInput conversions remain excluded. Resource-release actions record connection cleanup and do not independently prove that every external producer side effect stops.

The **113-export catalogue** concerns the pinned pipeable operator export index and the declared reference profiles. It is not the whole RxJS public API, every overload, a replacement runtime, or a universal interpreter. Broader pipeline verification remains a distinct project goal.

## Committed implementation verification

The complete implementation and all 75 new projections were committed at `cf8d58b91bd9a02d4047b8b52071738c3e3744c0` in [PR #48](https://github.com/hansschenker/rxjs-formal-way/pull/48). [Implementation PR CI 44688399407](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44688399407), job `136128101122`, passed on **Node v22.16.0**: syntax, strict types, **1,845 tests passed, zero failures/skips**, all **27,168** Session 23 comparisons, and **1,297 ordinary + 3 specialized committed projections** drift-verified. Generation and publication were skipped. The actual synthetic checkout in the full retrieved log was `21fdbc087bac5d97520f82e21a167b34aca02594`. Independently fetched head and checkout Git objects have identical tree `78f1e2f39887b473d7fe2402b65f6be8d1ff968b`.

PR #48 merged as `4281e314656fe56c5638b287c87c3be07de29618`. [Main CI 44688585605](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44688585605), job `136128700055`, checked out that exact merge and passed the same complete results on **Node v22.16.0**. Generation before checking and the publication step succeeded. Regeneration produced no additional artifact commit: all projections were already committed, and live main remained `4281e314656fe56c5638b287c87c3be07de29618` after the completed successful run. Both jobs' full logs were retrieved and actual checkout, test totals, comparison markers and projection counts checked.

## Independent read-only verification

The evidence-only [PR #49](https://github.com/hansschenker/rxjs-formal-way/pull/49) changed only this ledger. [Read-only CI 44688789140](https://github.com/hansschenker/rxjs-formal-way/actions/runs/44688789140), job `136129347375`, passed on **Node v22.16.0**: syntax, strict types, **1,845 tests passed, zero failures/skips**, all **27,168** Session 23 comparisons, and **1,297 ordinary + 3 specialized committed projections**. Both generation and publication were explicitly **skipped**. The full job log was retrieved and checked.

| Provenance item | Exact value |
|---|---|
| Read-only PR head | `0f437315b92cf58cd3bd8ca4014d630f01234ed2` |
| Actual synthetic checkout in CI log | `24e5fef8672509bb22914fbd55a9177842996627` |
| Independently fetched identical Git tree | `654976bebe9fe6faf30ef07b1e66d9309828c248` |
| Read-only PR merge | `df163cf53066f69102ff9f4bd0f3fcfc42bc9f8d` |

The head and actual checkout Git commit objects were fetched independently before merging. Identical tree SHAs establish that the files checked by CI match the reviewed head. Acceptance rests on these complete successful committed checks, not on the earlier locally failed navigation assertion.

## Final catalogue closure

**Session 23 closed on 20 November 2026 Europe/Zurich.** The [inventory](../planning/operator-generation.json), [roadmap](../docs/ROADMAP.md), [daily plan](../docs/DAILY-GENERATION-PLAN.md) and [separate numbered session record](../planning/sessions/2026-11-20-session-23.json) record **113/113 accepted pipeable exports, zero pending names, zero carryovers and no unresolved in-scope blockers**. All three final eleven-step inspection indexes are committed and independently drift-verified. The catalogue test matches every pinned native operator export to published model/runtime evidence.

The user-authorized 20 November exception remains explicit. Both closed Session 22 records are preserved unchanged. Exactly three names were worked in this final batch; the queue is empty and no additional catalogue session is selected.

The existing **RxJS operator generation session** recurring task was **paused**, with disabled state confirmed at **20 November 2026, 07:36:36 Europe/Zurich**, after the acceptance checks passed. Its existing prompt explicitly required pausing when the planned inventory was accepted. Only its enabled state changed; its prompt, title and schedule were preserved.

Catalogue generation is complete within the declared reference scopes. Broader overload coverage, arbitrary reentrancy, universal proofs, a general effect interpreter and composed-pipeline verification remain distinct work; this closure does not claim those goals are complete.
