# Session 4 — accepted scoped operator models and independent RxJS evidence

## Session identity and accepted names

The single **1 November 2026 Europe/Zurich** session completed exactly five distinct pending RxJS **7.8.2** exported operator names: `distinctUntilChanged`, `distinctUntilKeyChanged`, `distinct`, `pairwise`, and `startWith`. All five are **accepted within their declared scopes**. No carryovers remain; no sixth export or extra session was started. The previously accepted 15 exports were retained without being counted again.

The source pin is [RxJS 7.8.2 at e5351d02](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). See the detailed [Session 4 analysis](../docs/SESSION-04-MEMORY-AND-ADJACENCY.md) for pinned source URLs, six-tuple and Cω-style signatures, transition/state-dependent constraints, time, cancellation, sharing and exact exclusions.

Each of the five has canonical guarded TypeScript rules, readable operator page, BDD, state-transition table, state diagram, obligations, manifest, JSON example trace and four-lane Markdown trace. These are **40 new deterministic projections**, bringing the total to **168** across 21 configured examples and **20 distinct exports**. Profiles and overloads count under their export name.

## Exact commits and independently retrieved CI

| Role | Revision / evidence |
|---|---|
| Initial session reservation | [678cd47](https://github.com/hansschenker/rxjs-formal-way/commit/678cd47f5851ade64db130f91b08afacd240afa5) |
| Implementation and differential test correction used by successful CI | [002eec6](https://github.com/hansschenker/rxjs-formal-way/commit/002eec6d3e98ac8bde491357c74389a88d9acbf7) |
| Generated files committed by push CI | [7433dbc](https://github.com/hansschenker/rxjs-formal-way/commit/7433dbc94c6e2e9a01d1a9fc0d05b54a1f923be6) |
| Final detailed guide added | [7deb451](https://github.com/hansschenker/rxjs-formal-way/commit/7deb4510e99f1f1733ef2dade7fbb17177b167e7) |
| Read-only PR #3 verification-head revision | [4f95f72](https://github.com/hansschenker/rxjs-formal-way/commit/4f95f72d62971c58b3e0dba2e589606e1c8d5e50) |
| **Actual read-only tested checkout** | **[9f25254](https://github.com/hansschenker/rxjs-formal-way/commit/9f25254cb7909f1f557acaccebb14f467a4b2b38)** |
| Identical PR-head / checkout Git tree | `999a753d8fee9b4a9f01bb2d307e650e78e91986` |
| PR merged to main, docs only | [3de82c](https://github.com/hansschenker/rxjs-formal-way/commit/3de82c78095b15dd78c4126bc080acaa51f9166d) |

**Generated push CI:** [run 41286286090](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41286286090), [job 124788143011](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41286286090/job/124788143011), checkout `002eec6d3e98ac8bde491357c74389a88d9acbf7`. Retrieved job log confirms dependency installation, generation, JavaScript syntax, strict TypeScript, compilation, model/native tests and deterministic projection check **passed**.

**Guide-inclusive push CI:** [run 41286380454](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41286380454), job `124788412568`, checkout `7deb4510e99f1f1733ef2dade7fbb17177b167e7`. Complete pipeline again **passed**.

**Independent read-only committed-file check:** [PR #3](https://github.com/hansschenker/rxjs-formal-way/pull/3), [run 41286526038](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41286526038), [job 124788839236](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41286526038/job/124788839236), checkout `9f25254cb7909f1f557acaccebb14f467a4b2b38`. Retrieved CI job steps explicitly show **generation skipped, publication skipped**, and `npm run check` **passed directly on committed files**. The Git API verified that this synthetic merge checkout and the PR head share exactly the same tree.

All three successful retrieved CI logs report:

```text
# tests 561
# pass 561
# fail 0
Verified 168 deterministic projections.
```

## Counts and coverage

| Test/evidence category | Executed result |
|---|---:|
| Retained named tests from Sessions 1–3 | 511 |
| New pure-model and projection named tests | 29 |
| New independent actual RxJS named tests | 21 |
| **Total named tests** | **561 passed, zero failures** |
| New negative TypeScript assertions | 18 |
| Cumulative negative TypeScript assertions | 82 |
| New generated projections | 40 (8 for each new export) |
| **Total deterministic projections** | **168 verified without regeneration** |
| New bounded model-versus-native RxJS traces | 2,004 |
| Cumulative bounded model/native comparisons | 36,109 (34,105 previously retained) |

The **2,004 bounded comparisons occur inside one named test**, not 2,004 additional named tests. They enumerate admissible words of length at most four over nine operator/profile configurations, retaining source and optional flush subscription lifetimes, callback invocation outcomes, downstream notification values, cancellation, and terminal handling. Finite enumeration is **not a universal equivalence proof**.

Every model has named guarded transitions with structural validation and independent native test witnesses. Other native tests cover same-time ordering, `NaN`/SameValueZero versus strict equality, emitted-key memory, custom comparator calls and throws, Set flush-notifier next/complete/error, object identity, pairwise array allocation, prefix-before-source subscription and cancellation before source acquisition.

## Scope per accepted export

| Export | Accepted scope |
|---|---|
| `distinctUntilChanged` | Default strict comparison, optional key selection and custom equality, first/changed/equal decisions and selector/comparator errors |
| `distinctUntilKeyChanged` | Stable plain-property selection, default equality and custom comparator; mutable previous-object getter/proxy semantics excluded |
| `distinct` | Set membership via SameValueZero, direct and selected keys, optional Observable flush notifier and its full next/complete/error lifecycle |
| `pairwise` | Previous-value presence, original payload identity, fresh adjacent arrays, zero/singleton behavior |
| `startWith` | No-SchedulerLike synchronous prefix and zero-prefix behavior, source connection only after prefix, early cancellation |

All canonical profiles use non-reentrant, post-setup delivery where required. They do not guarantee physical producer abort, arbitrary reentrancy, production user-function effect interpretation, or behavior of the deprecated `startWith` SchedulerLike overload. Model-predicted example traces are labeled separately from actual RxJS observations. Source time, notifier time and equal-time event order are external to these operators.

## Interim corrections and remaining blockers

Earlier failed CI runs exposed a strict TypeScript `exactOptionalPropertyTypes` mistake in model-memory fields and a **test-counting mistake**, where the expected bounded-word cardinality incorrectly included words continuing after a terminal notification. Memory types were corrected, the enumeration formula was corrected to count only admissible words, and the depth was **increased to four**, giving 2,004 actual comparisons. No strict validation, model assertions or native conformance checks were disabled or relaxed. Failed preliminary runs are **not** acceptance evidence.

Direct local npm dependency installation was unavailable in the isolated container. Actual RxJS installation and full execution occurred through GitHub Actions using Node 22.16.0 with pinned RxJS 7.8.2 and TypeScript 5.8.3. The final acceptance commit modifies **documentation, contributor and planning records only**; it is not falsely presented as the checkout actually exercised by CI.

**No unresolved acceptance blockers exist within declared scopes.** No names carry over. Next eligible local-date session: **2 November 2026**, with `skip`, `takeWhile`, `skipWhile`, `takeUntil`, `skipUntil`. The inventory has **20 of 113 accepted** exports, **93 pending**. Keep the recurring generation process active.
