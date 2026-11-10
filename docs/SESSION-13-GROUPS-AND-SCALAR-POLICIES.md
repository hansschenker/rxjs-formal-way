# Session 13 — keyed groups and terminal/scalar policies

**10 November 2026 · Europe/Zurich · pinned RxJS 7.8.2**

Five distinct export names: **groupBy, ignoreElements, isEmpty, last, mapTo**. All source references resolve to revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. Five profile-bearing models correspond to **five export names**, not more.

## Intuition → Specification → Verification

The same local Mealy contract applies to all five:

\[
M=(S,S_0,Z,A,T,G),\qquad (S',A)=T/G(S,Z).
\]

`S` remembers only state relevant to future behavior, `Z` is a source, callback or subscription-lifecycle event, and `A` is an **ordered** word of notifications and resource commands. Timestamps belong to the supplied trace and source execution, not to the operators.

| Export | Cω-style shape | State and output decision |
|---|---|---|
| `groupBy` | `(T! → K!) → T* → GroupedObservable<K,T>*` | Registry of Map keys/Subject instances; first occurrence announces a group, then delivers the first value to its Subject |
| `ignoreElements` | `T* → ∅*` | No output next, even when the source has values; forward complete/error |
| `isEmpty` | `T* → Boolean?` | First next emits false and terminates; empty normal completion emits true |
| `last` | `(Predicate?,Default?) → T* → (T∪D)?` | Remember the latest matching value; only emit it at successful completion; empty result uses default or EmptyError |
| `mapTo` | `R! → T* → R*` | Emit the identical captured constant at each original source next time |

## groupBy — live keyed Subjects with an upstream lifetime lease

Pinned `src/internal/operators/groupBy.ts` constructs a `Map<K, SubjectLike<T>>` and provides each new group as a `GroupedObservable` with a `key` property. For a newly seen key, the **outer group announcement occurs before the first value is pushed into its Subject**. A synchronous observer of the outer stream can subscribe to the new group in time to receive that value. Subsequent source values with that key use the same Subject. The key selector is an external application function, invoked once per source value. Map key comparison uses **SameValueZero**: NaN equals NaN and -0 equals +0 for grouping purposes.

The accepted canonical model is deliberately scoped to **default Subject connector, no element selector and no duration selector**, with at most one concurrently active subscriber per group. Its actions addressed to `group:<id>` represent Subject notifications. `GroupToken<K>` is a pure, trace-serializable stand-in for the public GroupedObservable; it is not claimed to be an actual Observable instance. Native RxJS tests use real grouped Observables.

The six-tuple includes:

- **S:** Unsubscribed, Active, Calling, Orphaned, Closed; registry `(key,groupId,subscribers)`, source key index and next group ID
- **S₀:** Unsubscribed, no live source or group records
- **Z:** subscribe, source.next/error/complete, correlated key callback return/throw, group subscribe/unsubscribe, outer cancel
- **A:** source connection/release, key callback request, outer group announcement, keyed Subject notifications, child lease acquisition/release
- **T:** guarded key discovery/reuse, child counts and retained-source transition
- **G:** ordered group announcement before first keyed payload; group terminal notifications before outer terminal; cancellation produces no synthetic terminal

An outer unsubscribe disconnects upstream **only when no grouped child remains subscribed**. Otherwise the model enters Orphaned: the outer no longer receives groups, but already subscribed child groups keep receiving values. The last child unsubscribe releases the original source. This is a genuine sharing/lifetime policy specific to `groupBy`, unlike the other four operators.

Excluded profiles include custom connectors, projected elements, duration-based group closing/reopening, multiple concurrent subscribers to one group, callback/observer reentrancy, and late subscriptions after source teardown. Those remain pending scope extensions, not silently asserted equivalent.

## ignoreElements — selection of the terminal protocol only

`S=\{Unsubscribed,Active,Closed\}`; source.next leaves Active unchanged with **no actions**. Source completion/error yields one terminal notification, followed by source release. Cancellation releases the upstream subscription silently. This is a cardinality transformation, not an alteration of clock or producer. Values and errors remain opaque; source values are never examined.

## isEmpty — a bounded existential test

`S=\{Unsubscribed,Active,Closed\}`. The first source.next produces downstream `next(false)`, `complete`, then upstream teardown. Normal source.complete with no preceding value produces `next(true)`, `complete`. Source.error forwards the original error; cancellation has no result. Presence includes `undefined`. The operator can decide false without waiting for source completion. Source completion and first next are mutually exclusive transition guards from Active.

## last — delay the one retained candidate until completion

The plain profile overwrites a single candidate on each source.next. The predicate profile enters Calling on each value, requests the original value/index predicate, and updates the candidate only on correlated truthy outcomes. Falsy outcomes leave the previous candidate unchanged; exceptions forward the identical error and release upstream. No source.next yields a downstream next before completion.

At source.complete: if a candidate exists, emit the original candidate and complete; otherwise emit an explicitly supplied default (including `undefined`) or raise an `EmptyError`. Source error and cancellation discard any candidate without a fallback. The constructor profile `createLastModel(true, {value:D})` distinguishes default presence using an **explicit wrapper object**, avoiding ambiguity between an omitted default and literal `undefined`. The native operator's predicate receives the original source reference and zero-based index. The pinned implementation composes `filter → takeLast(1) → (defaultIfEmpty | throwIfEmpty)`.

## mapTo — a constant projection without a new clock

Pinned `mapTo` delegates directly to `map(() => value)` and is deprecated in RxJS 7.8.2. The canonical result retains the captured constant's **reference identity**, emits it exactly once per source.next, and forwards completion/error unchanged. There is no new scheduler, timer, multicast connection or replay buffer.

## Independent verification obligations

The pure models are stored in `src/models/session13-groupBy.ts` and `src/models/session13-scalars.ts` and integrated into the original canonical generator. `tests/session13-model.test.mjs` checks guard uniqueness at transitions, illegal late events, Cω shape, six-tuple metadata, rendered BDD/STT/diagram/obligations/trace, callback correlation, child lease behavior, error identity and state legality.

`tests/session13-rxjs.test.mjs` independently exercises the **real RxJS 7.8.2 operators**: actual grouped Observable subscription timing, SameValueZero keys, group error fanout, upstream retention/release after outer unsubscribe, short-circuiting, undefined as a source value versus a missing candidate, predicate indices, object reference identity, lazy subscription, source completion/error and silent cancellation.

Type boundaries use `tests/types/session13.ts` with negative assertions for intentionally unsupported parameter domains and impossible event/state combinations. Generator drift checks must verify all committed projections after generation. Model-produced traces are **predictions**, distinct from the native runtime tests. Finite agreement never establishes unrestricted observational equivalence.

See [Session 13 evidence](../evidence/SESSION-13.md) for exact checkouts, checks, CI status and remaining acceptance limitations.
