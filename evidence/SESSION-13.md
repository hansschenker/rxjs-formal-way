# Session 13 evidence — keyed Subjects and scalar policies

**10 November 2026 · Europe/Zurich.** Five reserved distinct RxJS 7.8.2 operator exports: **groupBy, ignoreElements, isEmpty, last, mapTo**. All modeling is based on pinned upstream source at `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. Detailed model scope and six-tuples: [technical guide](../docs/SESSION-13-GROUPS-AND-SCALAR-POLICIES.md).

## Implementation

Pure canonical models:
- `src/models/session13-groupBy.ts`: key selection, Map SameValueZero lookup, group Subject announcement before first keyed payload, group subscriptions, source-lease ownership and outer cancellation.
- `src/models/session13-scalars.ts`: `ignoreElements`, `isEmpty`, `last` (plain and indexed predicate/default profiles) and `mapTo` using named guarded Mealy rules.
- `src/index.ts` and original `scripts/generate.mjs` extend the existing schema, runner and generator without replacing infrastructure or reducing validation.

All five examples produce **40 new deterministic artifacts** (8 representations each), taking the committed view total from 512 to **552**.

## Source implementation PR and observed CI

| Role | Exact reference |
|---|---|
| Session reservation on main | `51960f40353c3c5339285554344070c8f67f35d5` |
| Canonical scalar model | `8b76d877db71c9f35f52fbc55c856bb035529760` |
| Canonical group model and corrections | `be5bc9dbb40d5a199c80e193064976d8e18ea2a6` |
| Implementation PR | [#19](https://github.com/hansschenker/rxjs-formal-way/pull/19) |
| Final implementation PR head | `164d26af2401ac77979663d11eb35129a4a8628a` |
| Implementation merge / main tested-code revision | `42c1f180e5c6eb60a8b4106cffd363e16d4a307b` |
| Generated 40-file commit | `a565000fa31378b0a1eccdd3ae756723110cf33b` |

First PR CI [42776831455](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42776831455) failed strict TypeScript variance errors, including the generic Action callback-input branch. Corrections narrowed only source/terminal helper actions already known to have no callback invocation; no type or runtime assertions were relaxed.

Subsequent PR CI [42777120383](https://github.com/hansschenker/rxjs-formal-way/actions/runs/42777120383), job `129698119477`, **ran syntax and strict TypeScript successfully and passed 971 named tests with zero failures**. It failed **only** the generator drift check, listing precisely the 40 as-yet-uncommitted new projections. The existing main-branch generator subsequently committed those 40 files at `a565000fa31378b0a1eccdd3ae756723110cf33b`. The PR failure is not recorded as a full pass.

The previous regression suite had 919 tests. Session 13 adds **52 named tests: 24 canonical model/view and 28 independent actual RxJS**. `tests/types/session13.ts` adds **18 negative TypeScript assertions** (223 cumulative, from 205).

## Independent actual RxJS observations

- **groupBy:** group key discovery and reuse, grouped Observable multicast timing, Map SameValueZero for NaN and signed zeros, key selector and source error identity/fanout, outer-unsubscribe retaining a subscribed child, and source release after last child unsubscribe.
- **ignoreElements:** zero next notifications even with source values, exact source error, teardown and silent cancellation.
- **isEmpty:** early false + completion on first value, true + completion on empty success, error and cancellation distinctions, undefined counts as a value.
- **last:** candidate retention until source complete, indexed predicate with original source reference, EmptyError/no-match, literal undefined fallback, exact error and value identity, cancellation drops retained candidate.
- **mapTo:** constant capture/reference identity per event, source laziness, error identity, cancellation and independent consumer subscriptions.

All generated JSON traces and four-lane views are **canonical model predictions**, not native RxJS recordings. These separate independent runtime tests provide scoped supporting evidence. Finite test agreement is not universal proof.

## Read-only verification

Independent committed-file verification is intentionally performed on a separate documentation/evidence-only pull request, with generation and publication disabled by the repository's existing pull-request CI path. Its result and checkout identity will be recorded after retrieval; **not yet claimed passed in this draft**.

## Explicit exclusions and scope limits

The groupBy default Subject profile excludes optional element, duration, custom connectors, multiple simultaneous child subscribers per group, and observer/key callback reentrancy. The `last` profile excludes deprecated thisArg and BooleanConstructor type-level specializations as separate runtime semantics. All five exclude unbounded synchronous observer reentrancy. Tests are finite and no broader equivalence claims are made.
