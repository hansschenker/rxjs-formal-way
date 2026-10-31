# Session 3 — verified acceptance record

## Session and scope

**Accepted within declared scopes:** `switchAll`, `mergeAll`, `concatAll`, `exhaustAll`, `shareReplay`.
The **31 October 2026 Europe/Zurich** session completed only these five
previously unworked carryovers from the 30 October reservation. Zero
carryovers remain. Ten previously accepted exports were retained, not
regenerated. The source pin is [RxJS 7.8.2, e5351d02](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791).
Read [the Session 3 guide](../docs/SESSION-03-FLATTEN-AND-REPLAY.md)
for the six-tuple, Cω, identity-passing rules, time, cancellation,
sharing, and exact exclusions.

## Tested revisions and retrieved CI outcome

| Role | Exact commit |
|---|---|
| Initial implementation | `1ff3ac88b05e0fe5e84b402850e4a51fa969b40c` |
| TypeScript correction | `48a315fbda61078acbe77f85f9b923b055b785fd` |
| **Tested implementation** | **`e0e2691d33145ffbc51c7b2893f714da92edab7b`** |
| Forty generated artifacts committed by CI | `42e233c274cef5a8233428e2b6fcfa2cfbe27b81` |
| Documentation-only PR head | `04eda593a15ac36dc9c181668f147cc5269aa606` |
| **Read-only tested checkout** | **`8935af283b0db4d1a662f31872f5948407b3d141`** |
| Verified identical PR-head and checkout tree | `1809ad8acdce40a9a460ae23605959dc0dafdf11` |
| PR merged (documentation only) | `3e60aefb4ff676ee84bb818b9f27a3d5287cafbe` |

The successful implementation [push run 41182538761](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41182538761)
([job 124482712054](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41182538761/job/124482712054))
ran dependency installation, code generation, syntax, strict TypeScript,
model/native RxJS tests and deterministic drift checks on the implementation
commit, then committed 40 new generated files.

The separate **read-only** [PR #2](https://github.com/hansschenker/rxjs-formal-way/pull/2)
[run 41182614115](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41182614115)
([job 124482941168](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41182614115/job/124482941168))
checked out `8935af283b0db4d1a662f31872f5948407b3d141`.
Retrieved job steps confirm **generation skipped, publication skipped**,
and `npm run check` passed on committed files. The Git API verified
the checked-out tree is byte-identical to the PR head tree.

Both successful retrieved CI logs contain:

```text
# tests 511
# pass 511
# fail 0
# skipped 0
Verified 128 deterministic projections.
```

### Counted evidence

| Test or artifact | Checked |
|---|---:|
| Retained named tests | 415 passed |
| New All-family pure model tests | 22 passed |
| New shareReplay pure model tests | 23 passed |
| New All-family actual RxJS tests | 40 passed |
| New shareReplay actual RxJS tests | 11 passed |
| **All named tests** | **511 passed** |
| Negative TypeScript assertions | **64**, 16 new |
| Deterministic generated views | **128**, 40 new |
| New bounded All-family native/model comparisons | **4860 passed** |
| New bounded shareReplay comparisons | **6248 passed** |
| **New bounded comparisons** | **11,108 passed** |
| Previous plus new bounded comparisons | 34,105 |

These bounded comparisons run *inside* named tests and are not a
universal correctness proof or extra named-test counts.

### Corrected preliminary CI failures

[Run 41182407922](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41182407922)
failed a TypeScript narrowing error. [Run 41182447297](https://github.com/hansschenker/rxjs-formal-way/actions/runs/41182447297)
had four incorrect assertions about final-inner teardown order: for
mergeAll/concatAll the native final-inner unsubscribe **precedes**
downstream completion, whereas switchAll/exhaustAll complete first.
Both errors were corrected without changing the pinned operators or
weakening the test, generation, or type-check commands. Neither failed
run is claimed as acceptance evidence.

### Scope and limits

The four All operators reuse the reviewed flattened guarded machine
with a synthetic, synchronous, identity-only microstep. The returned
inner token must be `Object.is`-identical to the incoming source token;
the microstep is **not** a user callback. The native independent tests
deliver actual Observable instances. Their exact model/native traces
compare notifications, source/inner generations and teardown in the
declared non-reentrant, post-setup scope. Synchronous behavior has
separate native checks.

shareReplay models ReplaySubject count/window cache, externally supplied
clock/expiry, FIFO replay, error reset, completed retention and both
refCount policies. It creates no eviction timer. Arbitrary reentrancy,
custom clock/scheduler behavior not expressed as input time, throwing
observers/finalizers, invalid fractional/negative config, a production
effect interpreter, physical producer abort guarantees and universal
equivalence are out of scope.

GitHub could not be cloned directly in the container; real dependency
installation and execution were performed by GitHub Actions with Node
22.16.0, RxJS 7.8.2 and TypeScript 5.8.3. This acceptance update changes
**documentation and planning only**, so it is not falsely described as
the checkout actually used for those checks.

**Next pending exports (not before 1 November 2026 Europe/Zurich):**
`distinctUntilChanged`, `distinctUntilKeyChanged`, `distinct`,
`pairwise`, `startWith`. **98 of 113 remain pending**; do not stop the
recurring inventory work.
