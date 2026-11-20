# Session 22 — windowCount: count-driven live multicast windows

**RxJS:** pinned 7.8.2, source revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. **Status:** scoped formal model and independent native tests; see [Session 22 evidence](../evidence/SESSION-22.md) for actual execution results before claiming acceptance.

## Intuition: what flows over time

`windowCount(windowSize, startWindowEvery)` emits **Observables**, not arrays. An output window is a live Subject-backed stream. A result connection publishes the initial window **before** it subscribes to the source. Each source `next` sends that unchanged value to every currently open window. After delivering that value, the operator may complete the oldest window and then publish a fresh window handle.

The effective stride is `startWindowEvery > 0 ? startWindowEvery : windowSize`. With a positive window size and positive stride:

| Relationship | Timing policy | Example with windowSize = 3 |
|---|---|---|
| stride = size | Adjacent windows | Initial window sees values 1–3; the next opens **after** value 3 |
| stride < size | Overlapping windows | With stride 1: window 0 sees 1–3, window 1 sees 2–4, etc. |
| stride > size | Gapped windows | With size 2, stride 3: window 0 sees 1–2, value 3 is omitted, window 1 sees 4–5 |

A window may be opened **empty** immediately after the last source value; source completion completes this empty window without emitting another handle. Observers attaching late to a completed window receive only `complete`, never replayed values.

## Specification: six-tuple

`(S,S₀,Z,A,T,G)` is explicit for one subscription-local execution.

| Element | Definition |
|---|---|
| `S` | `Unsubscribed`; `Active(seen,nextWindowId,windows,consumers,usedObservers)`; `Stopped(reason,seen,nextWindowId,windows,consumers,usedObservers)` |
| `S₀` | `Unsubscribed`, with no acquired source |
| `Z` | `subscribe`, `source.next(value)`, `source.complete`, `source.error(error)`, `cancel`, `window.subscribe(windowId,observerId)`, `window.unsubscribe(observerId)` |
| `A` | Ordered `subscribe`/`unsubscribe` resource changes and addressed `notify(N/E/C)` for outer or child observer |
| `T` | Pure rules `S × Z → S'` named `S22-WINDOWCOUNT-*` in [canonical model](../src/models/session22-windowCount.ts) |
| `G` | Guarded action words on each legal transition; the runner rejects missing or ambiguous guards and invalid states |

**Cω shape:** `windowCount : (windowSize: Count, startEvery: Count) → T* → Observable<T>*` with an initial handle before any input value. It is not a simple `T* → T**` buffer: child Observables and their consumer lifetimes are first-class resources. Every child stream can deliver at most `windowSize` source values (to a consumer attached for the entire window); outer cardinality is one plus the number of source counts divisible by the stride before termination.

### State-dependent legal behaviors

The initial state accepts only `subscribe`. While `Active`, source events and cancellation are legal. `window.subscribe` requires a never-before-used observer ID and an existing handle. `window.unsubscribe` requires an attached observer. A source value is legal only while count and next-window identity remain in safe-integer range. Window IDs are consecutive, starting at zero; each opened-at source count is a stride multiple; each open window can only remain open until it has received `windowSize` source values. Completed/errored windows do not retain active observers.

In the non-reentrant post-setup profile, the oldest closing condition for the next source value at zero-based index `i` is:

`i - windowSize + 1 >= 0 && (i - windowSize + 1) % startEvery === 0`

The operator sends the source payload to currently open consumers first, then completes the oldest due window, then increments the seen count, and finally emits a new handle when `seen % startEvery === 0`. This order is critical: a new window does **not** receive the value that opened it.

### Connection, time, cancellation and sharing

The outer Observable is cold: each subscription creates independent window Subjects and a fresh source subscription. Each emitted window is **live multicast** without replay; several child observers share that one window, and an observer unsubscribing does not cancel the source.

`windowCount` introduces no scheduler, timer or clock. Only source notification order controls openings and closures. Equal-time histories require an explicit input order in the trace.

On successful source completion, all still-open windows complete before the outer result. On source failure, all open windows fail with the same error object before the outer error. Previously completed Subjects retain their completion status even when a later source error occurs.

**Important contrast with `window(boundaries)`:** the pinned `windowCount` finalizer releases its internal array without unsubscribing or completing its child Subjects. Outer cancellation therefore stops upstream silently but leaves existing child subscriptions, and even later subscribers to the retained open Subject, alive and silent until they unsubscribe. This is intentionally modeled rather than normalizing all window operators to a single cancellation policy.

### Scope and excluded cases

The canonical profile covers positive safe-integer sizes/strides, count values below overflow, one source Observable, non-reentrant notifications after initial subscription setup, independent child consumers and late terminal-child subscriptions. The overloaded `startWindowEvery = 0` configuration is normalized to `windowSize`. Negative/fractional/NaN/infinite parameters, arbitrary reentrant callbacks, setup-time source emissions, physical Subject identity, throwing consumers/finalizers and universal infinite-trace equivalence are excluded. They are not implicitly accepted.

## Verification and navigation

The [model tests](../tests/session22-windowCount-model.test.mjs) exercise initial ordering, overlap, gaps, identity, late completion/error, cancellation, illegal inputs, state invariants and guarded-rule reachability. The [native RxJS tests](../tests/session22-windowCount-rxjs.test.mjs) use actual 7.8.2 Observables, Subject subscriptions, error identity, teardown logs and virtual-time scheduling; they do not import the canonical model. [Negative TypeScript assertions](../tests/types/session22-windowCount.ts) check event/state contracts.

The [differential test](../tests/session22-windowCount-differential.test.mjs) records native execution before model replay. Three sizes × four strides × three initial consumer counts × three commands at each of three positions × three endings give **2,916 finite comparison executions**. Commands attach/detach actual native subscriptions or send source values; completion, error and outer cancellation are followed by late observations of retained handles and explicit cleanup of orphan subscriptions. Notifications, identity, times, handle order and exact resource actions are compared. Repeated command choices can collapse to the same admitted history, so this is an execution count rather than a distinct-history or equivalence-proof count.

The count validator also requires one recorded handle for every reached stride boundary, each handle's exact opening count, and cancellation/error statuses consistent with the final source count. Existing invalid-state tests reject forged historical registries. Finite legal witnesses cover all twelve retained rule IDs; they do not establish universal guard totality.

Three deterministic histories—overlap, gaps and cancellation—feed the normal generator, each producing manifest, BDD, STT, state diagram, obligations, JSON trace, four-lane trace and prose page. The generated [export-level inspection index](../operators/windowCount-index.md) groups all three profiles under **one** operator export and provides the eleven-step learning path.

Source: [pinned implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowCount.ts); [pinned spec](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/windowCount-spec.ts).
