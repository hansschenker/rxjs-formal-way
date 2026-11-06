# Session 9 — Source-first latest joins, serial concatenation, constant-inner queues

**6 November 2026 · Europe/Zurich · RxJS 7.8.2**, pinned source revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.

One batch of five distinct exports: `combineLatest`, `combineLatestWith`, `concat`, `concatMapTo`, `concatWith`. Four of them are two pairs of implementation-level aliases in RxJS 7.8.2, but each is an independently tracked export. This work does **not** re-accept `concatMap` or `combineLatestAll`.

## Intuition → specification → verification

An Observable is a deferred description of a flow of values and lifecycle notifications. These five operators make different connection policies explicit. None creates sharing or its own clock.

| Operator | What flows over time | What new values cause | Why this policy exists |
|---|---|---|---|
| `combineLatest` | Piped source first plus supplied sources | Replace that source's remembered latest; after all first values, emit one copied tuple | Materialize a current multi-source snapshot |
| `combineLatestWith` | Exactly the same stream protocol as pipeable `combineLatest` in the no-projector profile | Same | Preferred nondeprecated name |
| `concat` | Source first, then supplied sources in argument order | Forward values of the sole subscribed source | Defer connection to later sources |
| `concatMapTo` | Each outer value licenses a *new subscription* to the same configured inner Observable | If busy, queue the occurrence; otherwise subscribe; forward inner values | Sequential repetition, without mapping outer payloads |
| `concatWith` | Exactly the same stream protocol as pipeable `concat` in the unscheduled profile | Same | Preferred nondeprecated name |

## Mealy machines and Cω shapes

The canonical machine shape remains `(S, S₀, Z, A, T, G)`. The state determines both transition `T` and ordered action policy `G`. Generated STTs and BDDs are projections of guarded named rules, not a second implementation of the semantics.

### Latest combinations — `combineLatest`, `combineLatestWith`

- **Cω-inspired shape:** `T₀* × T₁* × ... × Tₙ* → (T₀ × T₁ × ... × Tₙ)*`, where `*` permits zero or more notifications and omits terminal events.
- **S:** `Unsubscribed | Active { slots: [{ready, live, value?}], current } | Closed {reason}`. `ready` distinguishes no first value from a genuine `undefined` value.
- **S₀:** `Unsubscribed`. **Z:** `Unsubscribed, Active, Closed`.
- **E:** `subscribe`, `input.next(resource,value)`, `input.complete(resource)`, `input.error(resource,error)`, `cancel`.
- **A:** source-indexed `subscribe`/`unsubscribe`, downstream `N(tuple)`, `C`, `E(original)`.
- **T/G:** Subscribe to all sources in source-first argument order, with source index 0 the piped source. Each live input next updates its slot. Emit a *fresh* snapshot iff all slots have a first value; neither an incomplete set of first values nor a completed unready source can produce a tuple. Completing an input marks it non-live without discarding its last value. Only the final live completion completes output. Error propagates unchanged and cancels all live sources; cancellation silently releases active subscriptions.
- **State legality:** Every resource generation is a valid source index; events from completed or unconnected resources are illegal; closed states reject all inputs. There is at most one tuple per next event. A completed source with no first value does not induce early completion.
- **Scope:** no pipeable `combineLatest` result selector. Only valid Observable sources; no synchronous/reentrant acquisition effects, custom finalizer throws, or observer cancellation within delivery.

### Sequential concatenations — `concat`, `concatWith`

- **Cω-inspired shape:** `T₀* × ... × Tₙ* → (T₀ | ... | Tₙ)*`. Values preserve payload identity.
- **S:** `Unsubscribed | Active { current, slots } | Closed {reason}`; the only live slot in Active is `current`. **S₀:** `Unsubscribed`. **Z:** the same three controls.
- **E/A:** the same source-indexed notification and connection alphabets as the latest models.
- **T/G:** Subscribe only to index 0. Each value emits unchanged. Completion releases that source and subscribes to index `current+1`, if present; the last completion emits `C`. Errors stop the sequence and prevent any later subscriptions. Cancellation releases the current source with no downstream terminal notification.
- **State legality:** no future source is live or ready while an earlier source is active. Exactly one live input exists while Active; input notifications from later sources are illegal.
- **Scope:** pipeable deprecated `concat` without scheduler, and `concatWith` without scheduler. No synchronous setup-time reentrancy, arbitrary ObservableInput conversion or observer throws.

### Constant-inner sequential mapper — `concatMapTo`

- **Cω-inspired shape:** `T* × U* → U*`, where each accepted outer value represents one subscription occurrence of the configured `U*` source.
- **S/S₀/Z/A/T/G:** reuse the previously verified `concatMap` machine with concurrency 1: `Unsubscribed, Active, Calling, Draining, Closed`. Distinct occurrence generations share *one constant inner source token*. `outer.next` either reserves a slot or queues the outer value. The `Calling`/correlated `callback.return` pair is an **instantaneous model-binding microstep**, not a user-supplied callback or actual scheduler tick; only the predetermined source token is legal. The active occurrence can emit multiple values. Its completion releases the current inner subscription and, if queued, activates the next occurrence and binds that same source token again. Outer completion waits for every admitted occurrence to complete. Inner error propagates unchanged and discards queued work; cancellation is silent.
- **State legality:** one active inner occurrence maximum; the queue is FIFO; a queued occurrence is not subscribed until its predecessor completes; only the exact constant binding can resolve `callback.return`; `callback.throw` is not an available transition in this profile.
- **Scope:** no deprecated result-selector overload; no invalid ObservableInput, arbitrary synchronous/reentrant notification during subscription, or cancellation inside callbacks. The implementation of RxJS `concatMapTo` delegates to `concatMap(() => innerObservable)`; a single Observable object may still be externally hot/shared, but the operator introduces no sharing.

## Actual source provenance and verification boundary

Sources inspected at the pinned revision:

- `src/internal/operators/combineLatest.ts` and `combineLatestWith.ts` (the latter delegates to the former); `src/internal/observable/combineLatest.ts` (initial subscription sequence, first-value barrier, completion after *all* inputs).
- `src/internal/operators/concat.ts` and `concatWith.ts` (the latter delegates to `concat`); `concatAll.ts` / `mergeAll.ts` (serial concurrency).
- `src/internal/operators/concatMapTo.ts` and `concatMap.ts`, plus existing `src/models/flatten.ts`.

Canonical models: `src/models/session09-joins.ts`, `src/models/concatMapTo.ts`. The unchanged schema, runner and renderers generate **eight deterministic projections per configuration**: manifest, BDD, STT, state diagram, test obligations, JSON trace, four-lane Markdown trace, and user-facing operator page. Traces are model predictions, not native execution recordings.

Independent native tests are in `tests/session09-rxjs.test.mjs`, separate from model/view tests in `tests/session09-model.test.mjs`. Type-level invalid states/events are recorded in `tests/types/session09.ts`. The session evidence record holds exact commits, GitHub Actions results and limitations once checks have actually executed.

### Formal verification direction

The same source-indexed `subscribe` and `unsubscribe` actions provide a compositional interface for M03. Policy-specific state legality supplies candidate pipeline invariants; user-visible safety (`no next after completion/error`, `at most one current concat subscription`) can be checked on bounded traces. Liveness claims require explicit environmental assumptions (e.g. that the current source eventually completes); no operator can guarantee that a never-ending input completes.
