# Session 16 — Property projection and legacy connectable Subjects

**Europe/Zurich local date:** 2026-11-13  
**Pinned runtime:** RxJS 7.8.2, commit `e5351d02e225e275ac0e497c7b66eaa5f0c88791`  
**Selected export names, exactly five:** `pluck`, `publish`, `publishBehavior`, `publishLast`, `publishReplay`.

This checkpoint uses the existing canonical `OperatorModel`, pure trace runner, renderers, generator and independent Node/RxJS test suites. The five export names are **not five renamed stubs**. They cover two behavioral families: pure property projection and long-lived manual multicasting with four different Subject memories. See [model source](../src/models/session16.ts) and the five [inspection indexes](../operators/README.md).

## Intuition: what flows over time

- **`pluck`** forwards each input as one value obtained by following a configured property path. Missing or nullish intermediate values yield `undefined`; the source still owns timing and cancellation. Internally the pinned implementation delegates to `map`.
- **`publish`** creates a legacy connectable stream using an ordinary `Subject`. Observers can subscribe before the producer connects; only live observers receive current values.
- **`publishBehavior`** uses a `BehaviorSubject`, so each newly attached live observer immediately receives the configured initial value or latest value.
- **`publishLast`** uses an `AsyncSubject`: no `next` before successful source completion; then each attached and late observer gets at most the final value.
- **`publishReplay`** uses a `ReplaySubject`, retaining an ordered bounded history for late observers, including after an error.

Unlike the source-local operators, these connectable outputs have **separate observer subscription and upstream connection lifecycles**. `connect()` acquires the producer; unsubscribing one downstream observer does **not** release the producer. `connection.unsubscribe()` releases the producer without manufacturing a completion and preserves the fixed Subject's current memory in this scope.

## Mealy six-tuple `(S, S₀, Z, A, T, G)`

### `pluck`

- `S = (phase, count, closeReason)`, with phases `Unsubscribed/Active/Closed`.
- `S₀ = (Unsubscribed, 0, none)`.
- `Z = {subscribe, source.next(T), source.complete, source.error(E), cancel}`.
- `A = {subscribe(source), unsubscribe(source), next(project(T)), complete, error(E)}`.
- `T`: after subscription, every value increments the count; any terminal source notification or cancellation moves to `Closed`.
- `G`: source values emit a single path result; completion and source error retain their ordinary terminal meanings; cancellation emits no notification.

Cω shape: `pluck(path) : T* → U*`, with exactly one output `next` for each source `next` during the active lifetime.

### Legacy `publish*` connectables

- `S = (phase, subscriberIds, connectionGeneration, retainedHistory, last, hasLast, terminalReason, error)` with phases `Ready/Connected/Stopped`. The external instance owns this state.
- `S₀ = (Ready, [], 0, [], variantSeed, variantHasSeed, null, undefined)`.
- `Z = {observer.subscribe(id), observer.cancel(id), connect, disconnect, source.next(id,T), source.complete(id), source.error(id,E)}`.
- `A = {subscribe(observer), unsubscribe(observer), subscribe(sourceGeneration), unsubscribe(sourceGeneration), notify(observer, next/complete/error)}`.
- `T`: observer membership changes independently of source connection; `connect` makes one live source; `disconnect` releases the source and advances the generation; source termination closes the Subject. Only the ReplaySubject variant holds a bounded FIFO cache.
- `G`: ordinary Subject forwards only to registered current observers; BehaviorSubject also replays its current value on each live observer attachment; AsyncSubject stores without forwarding until successful completion; ReplaySubject replays its retained FIFO memory when an observer joins, even after terminal error.

Cω-style shapes:

| Export | Shape per observer | Memory |
|---|---|---|
| `publish` | `T* → T*` (connection- and presence-gated) | none |
| `publishBehavior(seed)` | `T* → T*` (live join prepends current value) | one current value, seeded |
| `publishLast()` | `T* → T?` on successful completion | optional last |
| `publishReplay(size)` | `T* → T*` (late join gets retained suffix) | bounded FIFO, min effective size 1 |

A single `publish` export also supports a selector overload, and `publishReplay` supports selector and time-window overloads. **These are explicitly excluded from the accepted models**, rather than counted as additional exported operators.

## State-dependent legality and key properties

The canonical rules are guarded and checked for a unique legal reaction. A source notification is legal only during `Connected` and only for the current connection generation. There is no source notification while `Ready` or after `Stopped`. Duplicate observer IDs, expired source generations, excess replay history and unknown cancellation targets are illegal. A second `connect` while connected returns the existing connection without a second producer subscription. A standalone observer cancellation does not alter the producer's connection.

A source error preserves object identity, terminates the upstream connection and notifies current observers. After termination a `ReplaySubject` supplies retained history *before* error to a late observer, whereas `BehaviorSubject`, `Subject` and `AsyncSubject` do not replay cached values after error. `publishLast` flushes its final value **only on successful completion**, including for later subscribers.

No timer is introduced. For replay, the accepted model uses **count-only** retention with an unbounded time window; clock-based expiration is not claimed. The pure model returns action descriptions; it does not itself subscribe to an Observable.

## Included profiles and exclusions

The pinned `pluck` profile uses a non-empty string path of up to three keys through plain non-effectful data. Getter/proxy side effects, symbol paths, path mutation and synchronous observer reentrancy are outside scope.

The four `publish*` models use selector-less fixed-Subject `ConnectableObservable` variants. `publishBehavior` includes an explicit seed; `publishLast` includes empty/nonnull completion; `publishReplay` includes count bounds and count-zero clamping. Explicit disconnect/reconnect is modeled while the source has not terminated; reconnection after a terminal source notification, selector forms, window-time expiration, refCount, arbitrary ObservableInput conversion and synchronous emissions during `connect()` registration remain outside the scoped model.

## Intuition → Specification → Verification

For every export, the deterministic generator publishes the operator overview, BDD rules, state-transition table, Mermaid state diagram, obligations, manifest, JSON trace, four-lane trace and export-level eleven-step inspection index. The trace is explicitly a **model prediction**, never falsely labeled a native RxJS recording.

Independent tests execute the *actual RxJS 7.8.2 exports*, checking exact output notifications, error identity, explicit resource lifetime, manual `connect` and `disconnect`, replay ordering, terminal late subscribers, AsyncSubject empty behavior, cancellation, and repeated subscription ownership. Negative TypeScript assertions cover invalid event payloads, missing resource identity, missing state fields and unsupported event variants.

The exact tested implementation commit, resulting generated projections and CI conclusions are recorded in [Session 16 evidence](../evidence/SESSION-16.md). Finite observations establish useful scoped confidence, not universal mathematical equivalence or a proof about every RxJS overload.
