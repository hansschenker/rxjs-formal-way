# Session 5 — accepted scoped gating models and independent RxJS evidence

## Session identity and accepted names

The single **2 November 2026 Europe/Zurich** session completed exactly five distinct pending RxJS **7.8.2** operator export names: `skip`, `takeWhile`, `skipWhile`, `takeUntil`, and `skipUntil`. All five are **accepted within their declared scopes**. No sixth export or second daily batch was started, and no names carry over. The previous twenty accepted exports were retained, not counted again.

The live starting revision was `d8a7f07de80408714fe8a91df67b5f39bc5e6e57`. The source pin remains RxJS 7.8.2 at `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. See [the Session 5 guide](../docs/SESSION-05-GATING.md) for the inspected source URLs, five concrete six-tuples, Cω-style shapes, state-dependent legal behavior, time, cancellation, ownership and exclusions.

Each export has canonical guarded TypeScript rules and eight deterministic views: BDD, STT, state diagram, obligations, JSON manifest, JSON trace, four-lane Markdown trace and plain-language operator page. The existing schema 1.1, runner, renderer, earlier models/tests, dependency pins and workflow were retained.

## Revisions and retrieved CI evidence

| Role | Exact revision |
|---|---|
| Session reservation | `f561d4dd703c69813f50bf7cf18b84922b4e4a04` |
| **Implementation tested by push CI** | **`e0dd8aa2f04c766827fb1dabbb22d9ed1dcefaac`** |
| Forty generated artifacts committed by validated push CI | `7a8cd7cf8ce68eb9d590b340252461b994fc9ffa` |
| Read-only verification PR #4 head | `6ee5b66163e46c0dbeee6679b161c9654cbe7fe8` |
| Verification-head tree | `3d58b6d2ba90bae58692e57ef24b34b0e3305d53` |

**Push verification:** [run 41396195583](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41396195583), job `125117935553`, succeeded on implementation commit `e0dd8aa2f04c766827fb1dabbb22d9ed1dcefaac`. Its retrieved log confirms dependency installation, generation, JavaScript syntax, strict types, compilation, pure-model and actual RxJS tests, and generation consistency. CI then committed the forty new generated files. The previous 168 generated views were unchanged.

**Read-only committed-file verification:** [PR #4](https://github.com/hansschenker/rxjs-formal-way/pull/4), [run 41396580432](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41396580432), job `125119093547`, attempt 1, succeeded. Run metadata identifies head `6ee5b66163e46c0dbeee6679b161c9654cbe7fe8` against base `7a8cd7cf8ce68eb9d590b340252461b994fc9ffa`. The PR changes only this evidence document. The retrieved job steps and log show **generation skipped, publication skipped**, and the complete `npm run check` succeeding directly on committed projections.

The PR head is recorded as a **head**, not misidentified as the synthetic merge checkout used by pull_request CI. A durable independently verified synthetic-checkout SHA was not retained in this acceptance record; no claim of separately verified checkout/head tree equality is made. The exact push-tested implementation above and the immutable PR head/base plus successful run/job are the provenance anchors. In the progress tracker, `testedCommit` denotes the push-tested implementation; `readOnlyHeadCommit` denotes the verification head. The final closing commit changes documentation and planning only and is not claimed as either CI checkout.

Both retrieved successful logs report:

```text
# tests 631
# pass 631
# fail 0
# cancelled 0
# skipped 0
Session 5: 5784 unary + 994 notifier = 6778 bounded model/RxJS comparisons.
Verified 208 deterministic projections.
```

## Counts and coverage

| Category | Executed result |
|---|---:|
| Retained named tests | 561 passed |
| New pure-model / generated-view tests | 35 passed |
| New actual RxJS named cases | 35 passed |
| **All named tests** | **631 passed; zero failures** |
| New negative TypeScript assertions | 18 checked |
| Cumulative negative TypeScript assertions | 100 checked |
| New deterministic generated views | 40 |
| **Committed projections checked read-only** | **208** |
| New bounded unary model/native comparisons | 5,784 passed |
| New bounded notifier model/native comparisons | 994 passed |
| **New bounded model/native comparisons** | **6,778 passed** |
| Cumulative bounded model/native comparisons | 42,887 |

The bounded comparisons occur inside one named test, not as 6,778 extra named tests or a universal equivalence proof. They compare notifications, original value/error identities, predicate arguments and indices, virtual times, source/notifier acquisition and teardown order. Separate native literals and marble tests supply expectations independently of the pure model. Both equal-time and distinct-time schedules are exercised.

Every configured canonical rule has a legal input-prefix witness in the pure-model tests. The suite also rejects foreign/consumed predicate outcomes and notifier identities, illegal lifecycle inputs, ambiguous guards, corrupted payload/multiplicity and cleanup order. The generated examples are labeled as model predictions, not native recordings.

## Accepted scope per export

| Export | Accepted profile |
|---|---|
| `skip` | Nonnegative safe-integer counts and indices, zero-count source acquisition, count boundary and termination |
| `takeWhile` | Exclusive and inclusive profiles, indexed synchronous predicate outcomes, first-falsy completion and thrown-value errors |
| `skipWhile` | Indexed predicate gate that opens permanently on first falsy result; no later predicate invocations |
| `takeUntil` | Observable notifier, notifier-first setup, synchronous notifier signal/error preventing source acquisition, terminal cleanup |
| `skipUntil` | Observable notifier, one-way opening, notifier completion versus next, and closed-source attempt after synchronous notifier error |

An important independently checked boundary: after a synchronous notifier error, **takeUntil does not acquire the source**, whereas RxJS 7.8.2 **skipUntil still attempts source initialization with an already-closed subscriber** and immediately disposes its teardown. The native test checks the source subscriber's closed flag. That setup continuation does not reopen downstream or permit a second terminal notification.

The exact comparison domain is non-reentrant resolved reactions and post-setup source delivery, plus the explicitly represented synchronous notifier initialization. Native synchronous source/downstream-take cases are characterized separately. Arbitrary reentrancy, cancellation inside predicate execution/setup, throwing observers/finalizers, general ObservableInput conversion, unsupported numeric parameters, a production interpreter and physical producer-abort guarantees are outside acceptance. No operator introduces sharing, a clock or a timer; each result subscription owns its gate and resources.

## Environment and outcome

Local preparation used Node 22.16.0 and TypeScript 5.8.3 with byte-identical copies of the shared schema, runner, renderer and strict compiler configuration. Thirty-five pure-model tests and eighteen new negative type fixtures passed locally, and forty isolated projections were inspected. Direct cloning and package download were unavailable in the local container; **no local full-suite or native-RxJS success is claimed**. The complete native/full-repository execution occurred in GitHub Actions using Node 22.16.0, RxJS 7.8.2 and TypeScript 5.8.3.

There were no failed preliminary Session 5 CI runs and no checks were weakened. **No unresolved behavioral acceptance blockers remain within the declared scopes.** The synthetic-checkout provenance limitation above is retained explicitly rather than filled with an unverified SHA.

**25 of 113 exports are accepted; 88 remain pending.** Twenty-six configured examples produce 208 views; profiles and overloads are not extra operator names. The next batch is **reduce, count, toArray, min, max**, not before **3 November 2026 Europe/Zurich**. The planned inventory is not complete; recurring work should not be paused as though the catalogue were finished.
