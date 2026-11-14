# Session 17 — Race and Source-Restart Policies (14 November 2026)

Version-pinned contract: **RxJS 7.8.2**, source revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. This document specifies the **five distinct exports** worked in this Europe/Zurich generation session: `race`, `raceWith`, `repeat`, `repeatWhen`, `retry`. The original source and downstream delivery events constitute inputs; no timekeeping is invented by the modeled operators. Examples are predictions, not native execution recordings.

## Mental model

A single new packet or terminal notification makes a race decision. The race's active source subscriptions are **competing producers**. Once a source emits a first `next`, the operator cancels every other producer and keeps forwarding the winning producer's subsequent values, including its eventual completion or error. A candidate that `complete`s or `error`s before *any* first `next` terminates the entire result rather than choosing a value-producing winner.

A restart is different from a race: there is always **one currently connected source generation** in these accepted profiles. Its termination determines whether a fresh source execution is started. `repeat` restarts on **successful completion**, `retry` restarts on **error**, and `repeatWhen` starts a fresh generation **after the source completes and an external notifier subsequently emits**. The operator does not duplicate messages; the new source execution produces them.

## Scope and Cω-style shapes

| Export | Shape | Accepted profiles |
|---|---|---|
| `race` | `Cω(inputs) → (T₀*, T₁*, …, Tₙ*) → (T₀ ∪ … ∪ Tₙ)*` | Deprecated pipeable alias of `raceWith`, array and variadic forms normalized to fixed input order; 0–32 other Observables |
| `raceWith` | `Cω(inputs) → (T₀*, T₁*, …, Tₙ*) → (T₀ ∪ … ∪ Tₙ)*` | Source-first, non-reentrant, all inputs connected before first delivery; identity when no others |
| `repeat` | `Cω(totalCount) → T* → T*` | Finite `totalCount` 0–8, no delay; `repeat(0)` gives empty completion |
| `repeatWhen` | `Cω(completions$ → notifier$) → T* → T*` | One persistent notifier selected at first completion, asynchronous/post-subscription notifier events, no reentrant notifier triggers |
| `retry` | `Cω(retryCount,resetOnSuccess) → T* → T*` | 0–8 **additional retries**, immediate, `resetOnSuccess` false/true, no notifier delay |

`race` is the **pipeable** export (not the same as the static `race` creation function exported from `rxjs`). Its native tests import `race` from `rxjs/operators`; `raceWith` is imported from `rxjs`. The distinction is enforced in the independent actual-RxJS tests. The first unsuccessful CI run exposed this distinction rather than a machine-semantic failure.

## Canonical Mealy six-tuples

Each implementation constructs `(S,S₀,Z,A,T,G)`; its `rules[]` array encodes named guards and pure `react()` functions. `stepModel` requires **exactly one** enabled guard and validates both the resulting state and its ordered action word. Notifications, subscriptions and cancellations are *data*, not executed side effects.

### `race` and `raceWith`

- `S`: `Unsubscribed`, `Racing(live, winner=null)`, `Winner(live=[winner])`, or `Closed(reason)`.
- `S₀`: no subscription, no winner.
- `Z`: `subscribe`, `input.next`, `input.complete`, `input.error`, `cancel`, with input generation.
- `A`: acquire or release candidate subscriptions; downstream N/C/E notifications.
- `T`: on first `next`, select source and remove all others; on early `complete`/`error`, close; after winner selection, only winner events are legal.
- `G`: subscribe source 0 first, then others; cancel losers **before** forwarding winner's first value; errors retain object identity.

**Legality invariant:** in `Racing`, all source indices are active and winner is absent. In `Winner`, *exactly* the winning source remains. In `Closed`, no resources remain, no later notifications are legal. There is no Subject or multicast boundary created.

### `repeat`

- `S`: `Unsubscribed`, `Active(generation,attempts)`, `Closed(reason)`.
- `S₀`: generation zero; no attempts.
- `Z`: source `next`, `complete`, `error` and downstream subscribe/cancel.
- `A`: forward N/C/E, unsubscribe completed generation, acquire next generation if quota allows.
- `T/G`: `complete` with `attempts < count` starts next generation; final completion completes downstream. Any error fails immediately. `count=0` skips producer acquisition entirely.

**Legality invariant:** active `attempts = generation+1`; total attempts cannot exceed count; no retry on error. `count` counts **total subscriptions**, not extra repeats.

### `retry`

- `S`: `Unsubscribed`, `Active(generation,attempts,failures)`, `Closed(reason)`.
- `S₀`: zero retries/failures and no producer connection.
- `Z/A`: matching generation's value, complete or error; new generation acquire; downstream N/C/E.
- `T/G`: when `failures < count`, source error triggers another connection; otherwise forward the final error. Any successful complete ends normally. With `resetOnSuccess`, each forwarded value clears the failure counter.

**Legality invariant:** at most one producer generation active; `attempts` tracks lifetime source subscriptions, whereas `failures` is the *current* retry-budget counter. With resets, total attempts may exceed `count + 1`, even though failure count does not.

### `repeatWhen`

- `S`: `Unsubscribed`, `Active(generation,notifierState)`, `Waiting(generation,notifier=open)`, `Closed(reason)`.
- `S₀`: no notifier object and no source connection.
- `Z`: source notifications, notifier `next`/`complete`/`error` and cancellation.
- `A`: subscribe/teardown source and notifier, void `N` into internal `completionsSubject`, downstream N/C/E.
- `T/G`: first source completion creates notifier and sends completion Subject signal. Later source completions reuse notifier. `notifier.next` in `Waiting` starts next generation. `notifier.complete` in `Waiting` closes immediately; in `Active` it closes only after the current source finishes. Notifier or source errors fail the result immediately.

**Legality invariant:** `Waiting` requires an already constructed, open notifier. The completion Subject is owned by the current downstream subscription; it is neither a public output nor globally shared.

## Time, cancellation, sharing, and exclusions

All native tests compare notifications and observable subscription lifetimes, not just values. The `raceWith` marble test uses `TestScheduler` to compare winner selection in virtual time. `repeatWhen` uses a controlled notifier Subject to verify its lifetime across separate source generations, even after all values have been forwarded. `retry` independently verifies both reset modes.

Atomic-setup profiles exclude synchronous subscription-time winner/terminal delivery, reentrant observer actions, throwing teardown, scheduler-dependent alias conversions, Promise/Iterable inputs, and unrestricted infinite restart behavior. Actual RxJS tests include one explicitly **out-of-scope synchronous `raceWith` case** to document that `raceInit` can stop acquiring later inputs after source zero synchronously wins. This is not mislabeled as model equivalence. The contract also excludes notifier next while an active `repeatWhen` generation is still running because that behavior may create overlapping source subscriptions.

`repeat` and `retry` cover finite immediate retries/repeats, not numeric/callback delay forms or `Infinity`; `repeatWhen` excludes synchronous notifier and selector-throw cases. These exclusions are explicit constraints, not a claim about broader RxJS.

## Verification artifacts

For each export, the generator creates eight deterministic views—manifest, BDD, STT, state diagram, obligations, JSON trace, four-lane trace, and operator page—plus the **required public export inspection index**. Each index links Overview, Diagram, STT, BDD, Trace, Obligations, Manifest, Canonical Mealy Model, pinned RxJS source, model/native tests and the Evidence Ledger.

- Canonical source: `src/models/session17-race.ts`, `src/models/session17-restart.ts`, `src/models/session17-repeatWhen.ts`.
- Pure guarded tests: `tests/session17-model.test.mjs`.
- Independently executable pinned RxJS tests: `tests/session17-rxjs.test.mjs`.
- Strict negative TypeScript assertions: `tests/types/session17.ts`.
- Regeneration: `npm run generate`; drift verification: `npm run check:generated`; complete verification: `npm run check`.
- Exact recorded tested SHA, CI run/job IDs, preliminary failures and independently verified checkout: [Session 17 evidence](../evidence/SESSION-17.md).

Finite tests and generated traces establish bounded evidence for these declared profiles; they are not a universal RxJS equivalence proof.
