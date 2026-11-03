# Session 6 — terminal aggregation and extrema (RxJS 7.8.2)

**Session date:** 3 November 2026, Europe/Zurich. **Distinct exports:** `reduce`, `count`, `toArray`, `min`, `max`. This is one five-name quota; `reduce` seeded/unseeded and `count` optional predicate are profiles, not additional exports.

## Pinned source inspected

The exact implementation revision is `e5351d02e225e275ac0e497c7b66eaa5f0c88791`:

- [reduce.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/reduce.ts) delegates to [scanInternals.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/scanInternals.ts) with `emitOnNext=false` and `emitBeforeComplete=true`. Seed presence uses `arguments.length >= 2`, not `seed !== undefined`. The callback index advances on *every* source emission, including the first unseeded value, which bypasses the reducer.
- [count.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/count.ts) uses seeded `reduce` with seed 0 and optionally applies a predicate to the original source value and source index.
- [toArray.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/toArray.ts) creates the mutable array *inside each subscription* and reduces by pushing incoming values. The canonical pure model instead retains immutable snapshots, observationally equivalent for the accepted non-reentrant scope because the native array is not exposed before completion.
- [min.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/min.ts) and [max.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/max.ts) reduce without a seed, using the former candidate as the first comparer argument and the new value second. A strict negative (for `min`) or positive (for `max`) result retains the old candidate; ties, zero and `NaN` comparator results select the incoming value.

## Shared six-tuple and state-dependent contract

Each configured profile is an executable guarded **Mealy 6-tuple** `(S, S₀, Z, A, T, G)`. `S` includes `Unsubscribed`, `Collecting(index, memory)`, `Calling(index, callId, memory, input)`, and `Closed(reason)`. Presence of an aggregate is stored independently of its value, so an explicit `undefined` seed is not mistaken for an absent seed. `S₀ = Unsubscribed`. `Z` includes subscription, source next/complete/error, cancellation, and correlated callback return/throw. `A` is a sequence of addressed downstream notifications and source lifecycle commands, with an optional request to a named external callback. `T` changes the aggregate and lifecycle state; `G` emits the ordered action sequence.

**Rules:** subscription creates local memory and connects the source; a source next changes memory or requests a correlated synchronous calculation without emitting downstream; the matching return updates memory, while a throw sends an error and releases the source. Source completion is the **only** normal flush: if memory exists, send `next(final)`, `complete`, unsubscribe in that order; otherwise send `complete`, unsubscribe. Source error forwards the exact error and cancels without flushing; downstream cancellation releases the source silently. Any source event during a pending user callback, stale/foreign callback outcome or post-termination event is illegal within this non-reentrant model. Callbacks are never executed in guards or by artifact generation.

### Individual shapes and state decisions

| Export | Cω-style value shape | Initial aggregate at subscription | Source value decision | Normal completion |
|---|---|---|---|---|
| `reduce` | `T* -> A?` | supplied seed, even `undefined`, or absent | first value primes unseeded; otherwise reducer(previous, value, index) | seeded emits exactly one; unseeded zero or one |
| `count` | `T* -> Number?` | `0` | increment each value, or invoke `predicate(value,index)` and increment for truthy result | exactly one number, including zero |
| `toArray` | `T* -> (T[])?` | new `[]` per subscription | append original value reference to ordered private buffer | exactly one array, including empty |
| `min` | `T* -> T?` | absent | first value primes; later strict negative comparison retains prior candidate | one candidate if nonempty |
| `max` | `T* -> T?` | absent | first value primes; later strict positive comparison retains prior candidate | one candidate if nonempty |

The `?` marker describes possible values over the stream lifecycle, **not** a promise of eventual completion. All five can remain silent forever for a never-completing source. A normal finite completion produces the cardinality specified in the final column.

**Time:** the operators introduce no scheduler or clock; source notification times and same-frame ordering come from the environment. The final output is delivered synchronously on source completion. **Cancellation:** no partial result is emitted on unsubscribe or error; a throwing callback terminates with an error and releases owned resources. **Sharing:** the operators do not multicast. Every result subscription owns separate indexes, state and buffers; an externally shared source is still independently accumulated per downstream subscriber. Caller-supplied seed objects retain their original reference and are not deep-cloned.

## Implementation and evidence workflow

The canonical source is `src/models/aggregate.ts`; entry points are exported from `src/index.ts`. The existing schema 1.1, pure runner and projection renderers are reused unchanged. `scripts/generate.mjs` adds configured examples and generates BDD, STT, state diagram, obligations, JSON manifest, JSON model-predicted trace, Markdown four-lane trace and readable operator page from those named rules.

`tests/session06-model.test.mjs` exercises rule identity, state validation, seed presence, indexing, callback correlation, equality/ties, terminal policy and deterministic projections. `tests/session06-rxjs.test.mjs` records *actual RxJS* callback arguments, notifications, explicit virtual time, resource lifetimes, cancellation, synchronous flows, and independent expected cases. `tests/helpers/session06-driver.mjs` keeps the model driver separate from native observations. The bounded differential test enumerates legal finite schedules; its scope is finite evidence, not a theorem. `tests/types/session06.ts` adds negative type assertions. Retrieve final CI results in [Session 6 evidence](../evidence/SESSION-06.md), which distinguishes tested implementation, generated commit and any read-only verification.

**Exclusions:** arbitrary reentrancy/cancellation within user functions or downstream observer callbacks, throwing finalizers, overflow beyond safe integer precision, mutation of array payload objects, pathological getters/proxies, and universal equivalence. `min`/`max` default comparisons are tested on numeric values; custom comparer behavior and error propagation have independent tests. A model return/throw is an environment action, never a call made during deterministic artifact generation.

## Compositional relevance

These are **terminal aggregators**. In composed pipelines, an upstream early completion (for example `take(n)`) becomes a completion input here, triggering their final output; errors and cancellations do not. This separates local Mealy state rules from pipeline-level action routing introduced by M03-P. No new formal notation or unverified temporal-projection format is needed for this batch.
