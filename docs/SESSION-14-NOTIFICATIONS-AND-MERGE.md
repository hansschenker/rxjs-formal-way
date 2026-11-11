# Session 14 — Notification values and overlapping subscriptions

**11 November 2026 · RxJS 7.8.2 · Europe/Zurich**

The five public export names for this single session are `materialize`, `merge`, `flatMap`, `mergeMapTo`, and `mergeScan`. The source of truth is the pinned RxJS tree at `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. These five names remain distinct even where one is an exact alias or overloads describe the same operator.

Every export has a single generated [inspection index](../operators/materialize-index.md), alongside a canonical guarded machine, BDD, transition table, state diagram, obligations, manifest, predicted JSON trace, four-lane trace, and teaching page. The model does not execute the user's callback or producer; independent tests exercise actual RxJS.

## Intuition: what flows over time

| Export | Input over time | Decision on arrival | Result over time |
|---|---|---|---|
| `materialize` | source notifications | Turn each next/error/complete into a Notification **value** | N values for source nexts; E or C **value** then normal result completion |
| `merge` (pipeable) | several Observables | Subscribe to source first, then admit others up to concurrency; forward from any live input | Interleaved original values, complete after every source completes |
| `flatMap` | outer values naming inner streams | Exact deprecated alias of `mergeMap`; allow overlapping inner subscriptions | Values from all admitted inners as delivered |
| `mergeMapTo` | outer events | Each event requests one more subscription to the **same configured Observable** | Outputs of separate concurrent occurrences; queue if full |
| `mergeScan` | outer events, then inner results | Project with current accumulator at admission; replace it on every inner next | Inner accumulated results, not an initial seed emission |

Input time and scheduling belong to the sources. None of the supported profiles invent a scheduler or clock. Output value identity is preserved except where `materialize` deliberately creates a Notification wrapper.

## Formal specification: one Mealy six-tuple per exported behavior

The project uses the extended Mealy convention `M = (S, S₀, Z, A, T, G)`, with `T : S × Z → S` and `G : S × Z → A*`. `G` is an **ordered action word**: notifications, subscription acquisition/release, or an external callback request. Illegal state/event pairs are rejected, not silently ignored.

### `materialize`

- **Cω shape:** `T* → Notification<T>*`. Every successful source next produces one N-valued next; a source terminal adds exactly one E/C-valued next before completing the result. These qualifications do not apply after consumer cancellation.
- **S / S₀:** Unsubscribed, Active, Closed(reason); initial Unsubscribed.
- **Z:** subscribe, source.next(value), source.complete, source.error(error), cancel.
- **A:** acquire/release source, downstream next(Notification), downstream complete.
- **T/G rules:** INIT connects; NEXT retains Active and emits a semantic N wrapper; END emits C wrapper then output complete; FAIL emits E wrapper retaining **error identity**, then output complete (not error); CANCEL closes silently and releases the source.
- **Legality:** no source next/terminal before initialization or after closure; a cancellation never fabricates a terminal value. The canonical model represents the semantic Notification record, **not** the `Notification` prototype or cached complete instance.

### Pipeable `merge`

- **Cω shape:** `T₀* × T₁* × … × Tₙ* → (T₀ | T₁ | … | Tₙ)*`. The output can be infinite if any admitted source remains active indefinitely.
- **S / S₀:** Unsubscribed; Active(live input indices, FIFO pending indices, total); Closed(reason). Initial Unsubscribed.
- **Z:** subscribe, input.next(index,value), input.complete(index), input.error(index,error), cancel.
- **A:** acquire/release numbered input subscriptions, output next, output complete/error.
- **T/G rules:** INIT admits input 0 (piped source) first, then as many supplied inputs as the concurrency limit allows. NEXT forwards one original value. REFILL releases a completed input and subscribes the oldest pending input. COMPLETE-WAIT removes a finished source but retains other work; COMPLETE-LAST terminates only when no inputs remain. ERROR terminates with original error and releases all live resources. CANCEL is silent and never subscribes queued inputs.
- **Legality:** only a currently live input may notify. At most `concurrent` subscriptions may be live. Pending indices stay ordered; a still-pending input may not emit. The tested profile is unscheduled, valid Observable inputs, 0–32 other sources and positive integer/Infinity concurrency. This is the *deprecated pipeable export*, not the root creation function called `merge`.

### `flatMap`

- **Cω shape:** `(T × Index → U*) × T* → U*`; one source value is not one output guarantee.
- **S / S₀ / Z / A:** inherited exactly from the canonical `mergeMap` model: active inner tokens, optional FIFO queue and admission index; outer and inner notifications, correlated callback outcome and cancellation; subscribe/unsubscribe, callback request and output notification.
- **T/G rules:** every guarded mergeMap admission, queue, inner next, inner completion, outer completion, error and cancellation rule is reused with distinct `FLATMAP` rule identifiers.
- **Legality:** no inner event from a resource that has not been acquired; no more than the configured concurrency; projection index advances on admission, not on queue insertion. Alias identity `flatMap === mergeMap` is independently checked against RxJS 7.8.2.

### `mergeMapTo`

- **Cω shape:** `T* × U* → U*` for one configured inner Observable identity reused per admitted outer value.
- **S / S₀ / Z / A:** `mergeMap` flattening state and events, except the callback binding always resolves the configured constant Observable token; repeated occurrences have **distinct subscription generations**.
- **T/G rules:** INIT connects outer; ADMIT starts a new occurrence when a slot is available; QUEUE delays excess outer events; RETURN only accepts the exact constant binding; inner.next forwards values; completion waits for active/queued occurrences; any error or cancellation releases owned subscriptions.
- **Legality:** constant binding identity must match, and the deprecated result-selector overload is outside scope. A hot configured Subject can deliver one notification to multiple admitted subscriptions and therefore produce multiple output values. No multicast ownership is introduced by the operator itself.

### `mergeScan`

- **Cω shape:** `(R × T × Index → R*) × R × T* → R*`; `R` is a captured seed or latest inner result, not a guaranteed output.
- **S / S₀:** `mergeMap` state **augmented with** `accumulator : R`, initialized to the provided seed.
- **Z:** outer and inner notifications, correlated accumulator callback outcome, and consumer cancellation.
- **A:** callback request `{accumulator, value}` with zero-based admission index, inner subscriptions, direct output of inner next and teardown actions.
- **T/G rules:** mergeMap's guarded admission, buffering, inner error and completion rules are retained; before forwarding an `inner.next(r)`, update accumulator to `r`. A new projection receives the **current** accumulator at the instant that its callback is invoked. A queued outer value waits until an inner completes before the next accumulator snapshot is taken.
- **Legality:** no seed emission in itself, no update from an outer value alone, no serial-accumulator guarantee at concurrency greater than 1. Two overlapping projections can both receive the original seed and later inner values determine the memory. This is a policy of observable concurrency, not a conventional synchronous reduce.

## Scope, time, cancellation, sharing

All five use atomic non-reentrant transitions. Synchronous emission **during subscription acquisition**, arbitrary observer reentrancy, and throwing teardown handlers are explicit exclusions. The merge family covers valid Observable inner sources, not all Promise/Iterable conversions, and excludes deprecated result selectors and custom schedulers where documented. External delivery order, including equal-timestamp order, is an input to the model. Teardown cancels *subscriptions*; it cannot promise cancellation of unrelated external work absent a cooperative producer teardown. No model introduces sharing, even when multiple subscriptions happen to target the same externally hot source.

`flatMap` and `mergeMapTo` reuse established `mergeMap` transition machinery; `mergeScan` reuses admission and teardown while refining the callback argument and accumulator state. These are not five unrelated prose descriptions.

## Evidence and the eleven-step inspection path

The [Session 14 evidence ledger](../evidence/SESSION-14.md) records the exact implementation and generation commits, native RxJS checks, strict typing, and independent read-only verification. The five export-level navigation pages group all required outputs:

- [materialize](../operators/materialize-index.md)
- [merge](../operators/merge-index.md)
- [flatMap](../operators/flatMap-index.md)
- [mergeMapTo](../operators/mergeMapTo-index.md)
- [mergeScan](../operators/mergeScan-index.md)

Each index navigates Overview, Diagram, STT, BDD, Trace, Obligations, Manifest, Canonical Mealy Model, pinned source, tests, and Evidence Ledger. Predicted traces remain separate from observations of the actual RxJS implementation. Bounded tests support scoped characterization but cannot prove universal stream equivalence.
