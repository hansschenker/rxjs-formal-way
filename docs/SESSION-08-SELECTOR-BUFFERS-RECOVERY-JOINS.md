# Session 8 — opening/closing buffers, error recovery, deferred latest joins

**5 November 2026 · Europe/Zurich · RxJS 7.8.2**. Five distinct pending exports: `bufferToggle`, `bufferWhen`, `catchError`, `combineAll` and `combineLatestAll`. The deprecated `combineAll` export is an **exact function alias** of `combineLatestAll`; retaining its own export-level manifest is deliberate. Neither overload nor a separate generated view increases the five-name session quota.

## Why these are distinct behavioral decisions

An RxJS operator is a state transition **plus an action policy**, not just an API category. Source values remain opaque; the operators decide when to retain, forward, release, join or replace subscriptions and values.

| Export | Key policy | Temporal policy (explicit time/trigger) | Termination and cancellation |
|---|---|---|---|
| `bufferToggle` | Independent buffers are opened by one stream and closed by their own selected streams; overlaps allowed | Each opening creates one identity; only that closing stream's **next** closes | Closing **complete** does not flush; source completion emits all open buffers in opening order; errors/cancel discard |
| `bufferWhen` | Exactly one active buffer with a fresh closing-selector subscription after each closure | Initial selector executes before source connection; each closing **next** starts next cycle | Closing **complete** without next leaves buffer for source completion; error/cancel do not flush |
| `catchError` | Switch from original source to one selected replacement **only after source error** | Replacement provides timing; source teardown precedes replacement connection, including synchronous error | Original completion passes through; replacement error is not caught again by the same selector; cancellation silent |
| `combineLatestAll` | Accumulate all inner-source identities, then join the latest values only after outer completion | Outer **complete** is the subscription barrier; all inner first values are the emission barrier | Empty outer completes without value; after joining, completion waits for all active inner sources; errors/cancel release |
| `combineAll` | The identical deferred-latest join machine: `combineAll === combineLatestAll` in RxJS 7.8.2 | Exactly the same temporal policy | Exactly the same termination policy |

**Important pinned-source edge case:** `combineLatestInit` decrements `active` on each inner completion and completes only when `active === 0`. If one inner completes without ever producing a value, no result tuple is possible, but another still-live inner can keep the result **open**. Do not silently substitute the more aggressive prose claim that an empty inner necessarily completes the result immediately.

## Semantic objects and six-tuples

Each canonical model has the same signature:

`M = (S, S₀, Z, A, T, G)`

`S` is the exact state space; `S₀` its unsubscribed initial snapshot; `Z` is the complete typed event vocabulary; `A` is the ordered resource/notification/callback action vocabulary; `T` derives next state; `G` produces ordered actions. Each named rule is a guarded pair `(T,G)`, and `stepModel` rejects both no enabled rule and ambiguous multiple enabled rules.

### bufferToggle

- **Cω shape:** `O* × T* → (T*)*`, with independent closing notifications as control events.
- **State:** `Unsubscribed | Active(sourceLive, openingsLive, nextId, records) | Calling(pending, records) | Closed(reason)`. A record stores `(id, values, closingLive)`.
- **Initial:** lazy. On subscribe, connect openings **before** the source. No buffer exists yet.
- **While** openings are live, **when** `openings.next(o)`, append an empty identified buffer, request `closingSelector(o)`, and connect the selected closing Observable only when its correlated return arrives.
- **While** the source is live, **when** `source.next(v)`, append the same opaque `v` reference to *every* open buffer.
- **While** a specific closing subscription is live, **when** its first `next` occurs, remove its buffer from the live set *before* emitting its fresh array snapshot. Release that closing resource. Other buffers are unaffected.
- Closing subscription `complete` does **not** close its buffer. Source `complete` flushes each still-open buffer, even one whose closer ended silently, in opening order, and completes. Any source/openings/closing error or selector throw propagates without flushing. Explicit cancellation silently releases all owned resources.
- **Ownership:** fresh buffer identities and closing generations per result subscription; no sharing, replay, or independent clock.

### bufferWhen

- **Cω shape:** `T* → (T*)*` controlled by a sequence of selected closing streams.
- **State:** the same control alphabet but always **exactly one** buffer in Active/Calling. `pending` correlates a selector invocation with its returned closing stream.
- **Initial:** open an empty buffer and request `closingSelector()` before the source subscribes.
- **While** active, **when** the selected closer sends `next`, unsubscribe that closer, replace the current buffer with a fresh empty one, emit the old array and request the *next* selector.
- Closing `complete` without `next` stops that closer but does **not** flush, select again or complete the source.
- Source completion flushes the current array (possibly empty), then completes. Errors and cancellation discard pending values; callback throw prevents first source acquisition if it happens during setup.
- **Time:** no timer is introduced by this operator. Closing streams provide the actual schedule.

### catchError

- **Cω shape:** `T* × (E → R*) → (T|R)*`; `E` is error-channel input, not a normal next value.
- **State:** `Unsubscribed | Source | Calling(originalError) | Replacement | Closed(reason)`. Exactly one selector invocation is modeled.
- **On** ordinary source `next`, forward the identical payload. On source `complete`, forward completion without selecting recovery.
- **On** source `error(e)`, retain `e` and request `selector(e, caught)` as a correlated callback action; do not notify downstream with this original error.
- **On** successful callback return, release the source and subscribe the replacement, preserving their ordering. From then on forward replacement next/complete/error directly. The same selector does not intercept a replacement error.
- **On** selector throw, forward the exact thrown error and release the source. Downstream cancellation releases whichever source is currently owned without synthesizing completion.
- **Scope:** one Observable-valued recovery stream, without recursive `caught` resubscription, arbitrary ObservableInput conversions or synchronous reentrant user effects.

### combineLatestAll and combineAll

- **Cω shape:** `(T*)* → (T[])*`. Outer next values are **source tokens**. Joined output is a fresh ordered array.
- **State:** `Unsubscribed | Collecting(sources[]) | Joining(slots[]) | Closed(reason)`.
- **Initial:** acquire the outer Observable only. Every `outer.next(inner)` appends its source identity to the ordered list without subscribing to it.
- **When** outer completes, if no sources exist, output `complete` with no array. Otherwise connect the collected sources in order. Each slot has `source`, `ready`, `value` and `live`; a real payload of `undefined` is distinct from an unready slot.
- **When** any live inner emits, update its latest slot. If every slot is ready, emit a new ordered array. Before that barrier, emit nothing.
- **When** an inner completes, mark it not live, retaining its last value. Complete only when every inner has completed. Inner error short-circuits and releases all live resources. Cancellation is silent.
- **Alias:** `combineAll` directly reexports `combineLatestAll` in the pinned implementation, not merely a similarly behaving function. The separate model identity and trace retain that evidence without claiming a distinct machine.

## Source-fixed references

The version-pinned source revision is `e5351d02e225e275ac0e497c7b66eaa5f0c88791`, which the repository identifies as RxJS 7.8.2:

- [bufferToggle.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/bufferToggle.ts)
- [bufferWhen.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/bufferWhen.ts)
- [catchError.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/catchError.ts)
- [combineAll.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/combineAll.ts)
- [combineLatestAll.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/combineLatestAll.ts)
- [joinAllInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/joinAllInternals.ts)
- [combineLatest.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/combineLatest.ts)

## Evidence, limitations and projection lineage

The canonical source lives in `src/models/bufferSelectors.ts`, `catchError.ts` and `combineLatestAll.ts`; `src/index.ts` exports all five. `scripts/generate.mjs` uses the unchanged renderer and runner to produce the eight deterministic views per configured profile: manifest, BDD, STT, diagram, obligations, JSON trace, four-lane trace and readable operator page.

The two groups of independent tests are `tests/session08-model.test.mjs` (rule reachability, explicit state memory, identity, guards and deterministic views) and `tests/session08-rxjs.test.mjs` (native RxJS behavior, source ordering, error identity, subscription lifetime, cancellation, equality of deprecated alias and bounded predictions). Negative type tests are in `tests/types/session08.ts`.

**Scope boundaries are part of the specification.** The post-setup models deliberately exclude arbitrary same-stack reentrancy, notifier next during subscription setup, observer/finalizer throws, arbitrary Promise inputs and optional `combineLatestAll(project)`. No equality between model-predicted trace and a native production trace is assumed without a test. Finite differential comparisons are evidence for bounded cases, not a universal bisimulation proof or full formal verification of all RxJS pipelines.

CI acceptance revisions, exact drift-check outcomes, scenario counts and any remaining gaps are recorded in [Session 8 evidence](../evidence/SESSION-08.md). Unverified cases remain open rather than being silently counted as accepted.
