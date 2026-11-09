# Session 12 — recursive expansion, finalization and first-match selection

**9 November 2026 · Europe/Zurich · pinned RxJS 7.8.2**

Exactly five pending exports are characterized: **expand, finalize, find, findIndex, first**. The pinned source revision remains `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. This session extends the existing canonical Mealy method; it does not introduce a second semantic framework.

## Intuition → Specification → Verification

Each operator remains a small machine:

[
M=(S,S_0,Z,A,T,G)
]

where state records only the information needed for later decisions, events describe source/callback/inner lifecycle inputs, and ordered actions describe downstream notifications plus resource ownership.

| Export | Cω-style shape | Core behavioral policy |
|---|---|---|
| **expand** | `(T! × Index! → T*) → T* → T*` | Emit every admitted value, project it to an inner stream, then feed inner values back into the same admission mechanism. Outer completion waits for recursive work. |
| **finalize** | `(() → Unit) → T* → T*` | Mirror the source. On completion, error, or explicit cancellation, execute one teardown callback; its return value never enters the stream. |
| **find** | `(T! × Index! → Boolean!) → T* → T?` | Test values in source order; first truthy match emits the original value and terminates. Finite no-match completion emits `undefined`. |
| **findIndex** | `(T! × Index! → Boolean!) → T* → Number!` | Same first-match state transition pattern as `find`, but the action policy emits the matching index; no match emits `-1`. |
| **first** | `first(P?,D?) : T* → (T ∪ D)?` | Without predicate, take first source value. With predicate, take first match. Successful exhaustion emits an explicitly supplied default or errors with `EmptyError`. |

## expand — recursion is an admission policy

The pinned implementation delegates to `mergeInternals(..., expand=true)`. Its distinctive rule is that an admitted value is forwarded **before** its projection is subscribed. An inner value is then routed back through the same admission function, so it becomes both output and a new candidate for projection.

The accepted canonical profiles are:
- scheduler omitted;
- default unbounded concurrency;
- concurrency exactly `1`.

For unbounded concurrency, every arriving outer or inner value is immediately admitted. For concurrency one, a busy slot causes values to queue. Importantly, the queued value is **not emitted yet**: output occurs only when it becomes admitted. Thus concurrency controls both projection admission and the timing of expand output.

State contains the projection index, active inner subscription occurrences, and the FIFO queue. Outer completion changes the machine to a draining state; completion is legal only when no active or queued recursive work remains.

## finalize — lifecycle side effect, not value transformation

`finalize` preserves source values and terminal notifications. The finalizer is registered on the result subscription and runs during teardown after completion/error notification, or on explicit unsubscribe.

The model therefore treats the callback as an ordered teardown action:
- complete → notify complete → release source → invoke finalizer;
- error → notify same error → release source → invoke finalizer;
- cancel → release source → invoke finalizer, with no downstream terminal notification.

The pure model deliberately does not execute the callback and does not model exceptions thrown by the finalizer.

## find and findIndex — same search machine, different output policy

Both operators share the same state-transition story:

1. receive source value at index `i`;
2. request predicate outcome for `(value,i)`;
3. falsy → increment index and continue;
4. truthy → terminate immediately.

Only the action policy differs:
- `find` emits the remembered original value;
- `findIndex` emits the remembered index.

At successful source completion with no match:
- `find` emits `undefined`;
- `findIndex` emits `-1`.

Predicate throws and source errors remain errors; cancellation never emits the no-match sentinel.

## first — selection plus terminal fallback policy

`first` combines two decisions:
- **selection**: first source value, or first predicate match;
- **successful exhaustion policy**: explicit default versus `EmptyError`.

Argument presence matters. An explicitly supplied `undefined` default is different from omitting the default argument. Predicate mode uses zero-based source indices and short-circuits on the first truthy outcome.

The model represents `EmptyError` structurally by name; native RxJS tests independently verify the actual runtime error.

## Policy dimensions

- **Value:** payloads remain opaque; `find`/`first` return original matched values. `findIndex` returns position. `finalize` adds no data value.
- **Cardinality:** `expand` can increase cardinality recursively; the three search operators emit at most one result; `finalize` preserves cardinality.
- **Time:** none of the accepted profiles creates a clock. The deprecated `expand` scheduler parameter is excluded.
- **Concurrency:** only `expand` owns inner concurrency; profile 1 queues, unbounded overlaps.
- **Cancellation:** silent downstream; `expand` releases recursive work; `finalize` still invokes its teardown callback.
- **Termination:** `expand` drains accepted recursion; `find`/`findIndex`/`first` short-circuit on success; `finalize` observes every teardown path.
- **Sharing:** none of these exports introduces sharing.

## Source inspection

Pinned source:
- `src/internal/operators/expand.ts` and `mergeInternals.ts`
- `src/internal/operators/finalize.ts`
- `src/internal/operators/find.ts`
- `src/internal/operators/findIndex.ts`
- `src/internal/operators/first.ts`

## Scope boundaries

Excluded from the accepted profiles: the deprecated `expand` scheduler argument, expand concurrency values other than 1/unbounded, arbitrary `ObservableInput` conversion details, deprecated predicate `thisArg` overloads, type-guard/BooleanConstructor overload specialization, callback/observer/finalizer reentrancy, throwing finalizers, and cancellation nested inside notification delivery.

Generated traces are **model predictions**, never native recordings. Acceptance also requires independent RxJS 7.8.2 execution and committed-file drift verification. See [Session 12 evidence](../evidence/SESSION-12.md).
