# Session 7 — accepted duration and buffer operators with independent committed-file verification

**4 November 2026 · Europe/Zurich.** Exactly five distinct RxJS 7.8.2 operator export names selected, modeled and accepted: \`audit\`, \`auditTime\`, \`buffer\`, \`bufferCount\`, \`bufferTime\`. The 3 November session had no carryovers. There was no sixth operator, second batch or reuse of an already accepted name. Six generator examples count under these **five names** because two represent \`bufferTime\` profiles.

## Pinned semantics and deliverables

The pinned RxJS source at revision \`e5351d02e225e275ac0e497c7b66eaa5f0c88791\` was inspected separately for all five exports. See [the technical guide](../docs/SESSION-07-TIME-AND-BUFFERS.md) for source URLs and a policy-by-policy comparison of Cω shape, Mealy tuple, state-dependent legality, time, cancellation and sharing.

Three new canonical TypeScript modules implement all five named operators with deterministic guarded state and action rules:

- \`src/models/audit.ts\`: the \`audit\` Observable selector and \`auditTime\` scheduler profiles; duration-next flushes latest; duration completion without next drops it; source completion waits for the active duration; canceled or errored operations do not flush.
- \`src/models/buffering.ts\`: \`buffer\` notifier-controlled empty/nonempty array emission and \`bufferCount\` count/stride policies with overlap, gaps and residual completion flush.
- \`src/models/bufferTime.ts\`: timer-owned windows, creation-interval overlap and max-size early closes.

No alternative ad hoc schema or generator was introduced. Existing schema 1.1, pure runner, renderers, dependencies and validation workflow were retained. Six configurations generated **48 deterministic projections**: JSON manifest, STT, BDD, diagram, obligations, JSON trace, four-lane trace and human-facing operator documentation. Existing 264 views remain; total **312**. All traces are **model predictions**, not native RxJS recordings.

## Retrieved implementation CI and generated commit

| Role | Exact revision or GitHub run |
|---|---|
| Starting main | \`c4736db6e3ae424f402c3f1c4f0b79c272acfa43\` |
| Reserved daily session commit | \`608a02953f66bb2b59fae9a68f1b554d75d32b83\` |
| **Successful, tested implementation** | **\`72a97eb86aedd703f394f79fa3fbf4967cbd12aa\`** |
| Generated-view commit (created by push CI **after** tests) | \`b005bbafd15e1c47fa6dc8056d19ee4ed11fb662\` |
| Successful [push run 41792399467](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41792399467) | Job **126448562927** |

The push run's retrieved job log and completed step statuses establish that dependencies installed; 312 projections were generated; syntax, strict TypeScript, all native and pure-model tests, and generation drift checks passed; and GitHub Actions committed all 48 new projections onto \`main\`.

\`\`\`text
Generated 312 deterministic projections.
# tests 715
# pass 715
# fail 0
Verified 312 deterministic projections.
\`\`\`

The previous accepted suite had 670 tests. **45 new named tests** are present (model/view and independent actual RxJS), and **17 new \`@ts-expect-error\` negative TypeScript assertions** were compiled (129 total). Inside the independent native tests, the bounded comparisons enumerate 363 \`buffer\` notifier/source schedules, 1,815 \`bufferCount\` value/stride schedules and 45 \`auditTime\` scheduler schedules: **2,223 new comparisons** in addition to fixed timing and error/cancel cases. These are not counted as individual named tests and do not prove universal equivalence.

Preliminary draft PR run [41791985429](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41791985429) failed a TypeScript discriminated-union narrowing check; it was corrected without weakening strictness. Subsequent candidate PR runs [41792067414](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41792067414) and [41792147332](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41792147332) passed syntax, types and tests but failed the expected generation-drift check because the 48 new projections had not yet been committed. **Those candidate runs are not the acceptance record**; successful push and read-only runs are.

## Independent read-only committed-file verification

[Documentation-only PR #8](https://github.com/hansschenker/rxjs-formal-way/pull/8), [read-only run 41792585389](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41792585389), job **126449171258**, completed successfully. The retrieved GitHub Actions job steps explicitly show **generation skipped and publication skipped**. Existing, committed files alone passed:

\`\`\`text
# tests 715
# pass 715
# fail 0
Verified 312 deterministic projections.
\`\`\`

The PR head \`f2eb6931fcf1ddd4eebf4af42ab39cbb20890804\` is a documentation-only addition on generated commit \`b005bbafd15e1c47fa6dc8056d19ee4ed11fb662\`. The actual read-only synthetic checkout was \`3b96d3edab70f0510cf676dc06ba31484c7625e2\`. Independent Git-object reads verified that checkout and PR head share tree \`80879f99f29f00a73a8236e9746b508470263d8a\`. This avoids falsely reporting the synthetic checkout as an ordinary branch-head commit.

Closure updates the tracker, evidence, roadmap and dated log, but is **not** reported as the implementation checkout.

## Constraints, ownership and limitations

All five operators use explicit named guarded Mealy transition/action policies. The \`audit\` selector is requested as a callback action and resolved by correlated return/throw; the pure model never invokes it. Clock and scheduler fire events are externally supplied. Timer deadlines do not automatically emit; equal-time order is part of the scenario. Resources, source completion waiting, source/notifier errors, silent cancellation and per-subscription buffer identities are explicitly represented.

The scoped acceptance excludes arbitrary nested/reentrant delivery, cancellation during a callback, throwing downstream observers/finalizers, non-Observable duration conversion, arbitrary custom synchronous schedulers, unsafe clock/count parameters and full symbolic verification. These finite comparisons provide **bounded evidence**, not a universal proof of equivalence for all RxJS programs or all parameter overloads.

**Accepted in scope: 35 of 113 distinct exports. Pending: 78. Carryovers: none.** The next eligible queue, not before **5 November 2026 Europe/Zurich**, is \`bufferToggle\`, \`bufferWhen\`, \`catchError\`, \`combineAll\`, \`combineLatestAll\`.
