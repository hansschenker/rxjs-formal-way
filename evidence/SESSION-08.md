# Session 8 evidence — selector buffers, recovery and deferred latest joins

**5 November 2026 · Europe/Zurich.** Five distinct RxJS 7.8.2 operator exports were selected from the live queue and worked in one reserved session: `bufferToggle`, `bufferWhen`, `catchError`, `combineAll`, `combineLatestAll`. Previous session 7 had no carryovers. No sixth operator or second session was started; alias `combineAll` counts once as its own distinct export and reuses the exact machine of `combineLatestAll`.

## Source-fixed scope

The pinned RxJS revision was `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. Original source code was inspected for each export as well as join internals and `combineLatestInit`. The detailed [technical guide](../docs/SESSION-08-SELECTOR-BUFFERS-RECOVERY-JOINS.md) records the six-tuple and Cω behavior, state legality, time, cancellation, sharing and deliberate exclusions.

Three canonical TypeScript modules define five named models:

- `src/models/bufferSelectors.ts`: independent overlapping buffers with opening/closing selectors; one-current-buffer successor policy with closing selection before source subscription.
- `src/models/catchError.ts`: original source failure invokes one correlated selector, releases original before replacement connection; replacement errors are not re-caught in this scope.
- `src/models/combineLatestAll.ts`: deferred subscription to collected inners, all-first-values barrier, latest tuple emission and wait-for-all-inner-completion; exact deprecated alias `combineAll`.

The unchanged schema, pure runner and renderers generate all eight views from each model: manifest, BDD, STT, diagram, obligations, JSON trace, four-lane Markdown trace and plain-language operator page. **Five configurations generated 40 new files**, bringing the committed inventory from **312 to 352 views**. Generated traces are predictions of the canonical models, not native recordings.

## Retrieved main-branch validation

| Role | Revision / outcome |
|---|---|
| Starting main, before session reservation | `6e63ab2fdbc2e6b03311308be02b53161caceb19` |
| Dated reservation on main | `d96b68b41e61a72ae7d286fdbc2c40ac288566be` |
| Implementation merge (tested) | `67830b3db286665ebe85ad860d384dac967cc1a8` |
| Main push CI | [run 41986983309](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41986983309), job `127109927508`, **success** |
| Generated file commit | `4cc6ae38702becdef3821f9fbc86b687fac2ac2e` |

The retrieved main-branch job log states:

```text
Generated 352 deterministic projections.
# tests 758
# pass 758
# fail 0
Verified 352 deterministic projections.
[main 4cc6ae3] docs: update verified generated operator projections
40 files changed, 5734 insertions(+)
```

The previous suite contained 715 named tests, so **43 new named tests** now exercise model behavior and independent actual RxJS 7.8.2 notifications, ordering, source subscription lifetime, cancellation and error identity. A new set of **18 TypeScript negative assertions** is compiled in `tests/types/session08.ts`, giving 147 cumulative (previous 129). The bounded test `S8-BOUNDED-DIFF` enumerates **161 model/native comparisons**: 121 bufferWhen sequences and 40 deferred join sequences. These are scenarios inside one named test, not 161 named tests. Additional independent fixed tests characterize bufferToggle, catchError and both deferred join exports.

Preliminary PR runs [41986599814](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41986599814) and [41986678069](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41986678069) failed strict TypeScript errors. These were corrected using precise subscription-action discriminants and omission of an expired optional selector binding—not by disabling type checks. Later PR checks ran all 758 tests but correctly failed the generation-drift check while new views had not yet been committed. The **successful main push run** is the implementation acceptance evidence.

## Independent committed-file verification

[Documentation-only PR #10](https://github.com/hansschenker/rxjs-formal-way/pull/10) produced an **independent successful read-only validation**: [run 41987175479](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41987175479), job `127110549673`. Retrieved job steps explicitly report **generation skipped** and **publication skipped**. Its decoded log records `# tests 758`, `# pass 758`, `# fail 0`, and `Verified 352 deterministic projections.`

The read-only PR head was `9a417251e9804450d6e7c86a37e23aec8dbf6747`, based solely on generated commit `4cc6ae38702becdef3821f9fbc86b687fac2ac2e` plus this evidence document. GitHub Actions checked out synthetic merge commit `2de72f3953ccffa639359a9f933f43a4d0911eff`; independent Git object reads establish its tree `0652373f37fc9bc255a5ab503ccb0e1ea49cc36a` is exactly the same as the PR head tree. The synthetic checkout is not misreported as a branch-head SHA. PR #10 was merged as `df3749b93c038854887c8966d0883b1060909562`.

**Acceptance evidence therefore includes two different successful executions:** a main-branch push run that generated/tests/committed the views and an independent PR run that only tested the already-committed views.

## Scope limitations

The finite model focuses on Observable inputs after atomic setup, bounded nonreentrant execution and at most one catchError replacement. It deliberately excludes Promise conversion, synchronous/reentrant close during subscription setup, arbitrary downstream/finalizer throws, cancellation in a callback, recursive `caught` resubscription and the optional `combineLatestAll(project)` projector overload. In particular, an empty inner need not complete the combined result while other inners remain active. No universal equivalence proof or full pipeline model checking is claimed.

**All five export names accepted within the declared profiles.** Inventory: **40 of 113 accepted; 73 pending**. There are no unfinished carryovers and no unresolved acceptance blockers inside the declared scopes. The separate dated session log is the authoritative final closure record.
