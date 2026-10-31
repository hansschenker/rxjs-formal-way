# Session 3 — Flatten an Observable of Observables and replay shared values

## Scope and source of truth

This is one **five-export-name** session: `switchAll`, `mergeAll`,
`concatAll`, `exhaustAll`, and `shareReplay`. They were reserved
on 30 October 2026, left unworked, and carried into the single
31 October 2026 Europe/Zurich session. The five export names are distinct.
Each generated profile is a scope, not an additional operator.

The source is RxJS **7.8.2**, pinned at commit
[`e5351d02`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791).
The actual 7.8.2 implementations are:

- [switchAll](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/switchAll.ts) = `switchMap(identity)`
- [mergeAll](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/mergeAll.ts) = `mergeMap(identity, concurrent)`
- [concatAll](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/concatAll.ts) = `mergeAll(1)`
- [exhaustAll](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/exhaustAll.ts) = `exhaustMap(identity)`
- [shareReplay](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/shareReplay.ts) = `share` with a `ReplaySubject`, reset on error, never reset on completion, and reset at subscriber count zero only if `refCount`.
- [ReplaySubject](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/ReplaySubject.ts) clamps zero count/time to one, replays oldest-to-newest, and drops entries whose expiry time is **less than or equal to** the source-clock reading on `next` or `subscribe`. It has no separate eviction timer.

## What flows over time

An All operator takes an outer sequence whose values **are inner sources**.
Each accepted inner produces its own stream of zero or more values:

```text
(T*)*   -- policy -- >   T*
```

| Export | Incoming inner while busy | Active subscriptions | When does downstream complete? |
|---|---|---|---|
| switchAll | replace: unsubscribe old inner before subscribing to latest | 0 or 1 | outer closed and latest inner closed |
| mergeAll | overlap until capacity; queue extra inner sources | 0 to capacity | outer closed, all active and queued inners closed |
| concatAll | queue; subscribe in FIFO order after prior inner closes | 0 or 1 | outer closed, queue empty and current inner closed |
| exhaustAll | ignore new sources while inner active, without queuing | 0 or 1 | outer closed and admitted inner closed |

Time is supplied by the outer/inner sources. Equal timestamps retain explicit
event-delivery order. The All operator creates no scheduler and never opens a
connection until the result is subscribed.

The four implementations use the *same* previously reviewed guarded
transition engine as their corresponding Map family. No new or less strict
semantics replaces that engine. Their source identities pass through a pure,
synchronous `identity` microstep in the model: the input token and returned
token must be `Object.is`-identical. This microstep is **not a user callback**,
a separate RxJS notification, or an asynchronous turn. The model rejects
`callback.throw` because the identity function cannot throw for accepted
source tokens. Its internal `invoke-callback` action is an implementation
device for connecting the existing model driver, not a claimed physical action
in `switchAll` or its peers. Independent RxJS tests emit actual inner
Observables without invoking a projection. They compare only observable
notifications, order, and resource lifetimes—not synthetic identity actions.

## Six-tuple and state-dependent legal behavior — All family

The canonical extended Mealy tuple remains `(S,S₀,Z,A,T,G)`.

- `S`: unsubscribed, active, calling (synchronous identity refinement),
  draining, or closed; with accepted-inner generations and optional FIFO queue
- `S₀`: unsubscribed, zero inner subscriptions
- `Z`: connection/cancellation; outer next/complete/error; accepted
  inner next/complete/error; the correlated identity return
- `A`: source/inner subscribe and unsubscribe, downstream N/C/E, synthetic
  identity request (pure model only)
- `T`: the single enabled named transition changes control and resources
- `G`: the ordered side-effect description produced by that same transition

Legal transitions are state-indexed: `outer.next` must carry an inner
source token; `callback.return` must match both the pending identity
generation **and the identical token**; inner notifications require the
currently active subscription generation; cancelled or replaced inner
generations cannot contribute downstream. A completed outer does not cancel
accepted inner work. `mergeAll(1)`, `mergeAll(2)`, and unbounded capacity
are configurations of **one export name**. No source value is flattened by
creating a new `Observable` in the model; it uses an external source binding.

## Six-tuple and state-dependent legal behavior — shareReplay

`shareReplay` has Cω-style shape `T* → SharedReplay(T*)`; `SharedReplay`
is a project notation for connection ownership and replay, not part of Cω.
Each observer receives its own `T*` view.

- `S`: existing `share` connection/subscriber registry, ReplaySubject
  buffer of `(opaque value, optional expiry)` entries, and last clock reading
- `S₀`: disconnected, empty buffer, no subscribers, logical clock zero
- `Z`: subscriber subscribe/unsubscribe and current source
  next/complete/error, with externally supplied `now` on every event
- `A`: source subscribe/unsubscribe, addressed N/C/E notifications
- `T`: connection and replay state transition, with count/window pruning
- `G`: live broadcast or synchronous FIFO replay to the joining subscriber,
  followed by terminal C for a late completed-subject subscription

No buffer is replayed before first source emission. A live join obtains
only the not-yet-expired cached suffix plus future emissions. On completion,
the source disconnects but the cache is **retained**; late subscribers replay
eligible values and then complete, with no reconnect. On source error, the
cache is **discarded**, so later subscribers reconnect. With
`refCount=true`, last departure from a still-live source disconnects and
clears the buffer; with false, the source continues and caches new values
even with no subscribers.

`windowTime` expiry uses the **external timestamp provider**; the operator
does not create time. `expiresAt <= now` is expired, including at the exact
tie boundary. Expired records need not be physically removed until the next
source emission or a new subscription causes the ReplaySubject to trim.
The model rejects event clocks moving backwards; the trace wrapper also
rejects mismatches between trace envelopes and event clock readings.
Payload and error identities are opaque and preserved.

## Scope limitations and evidence policy

The generated example uses `shareReplay({ bufferSize:2, windowTime:6,
refCount:false })`; separate tests cover count 1/2, finite and infinite
windows, both refCount values, and zero-bound normalization. Negative sizes,
fractional sizes, throwing observers, arbitrary reentrancy, non-Observable
inner conversions and custom schedulers beyond an explicitly provided
clock are outside the declared exact-trace comparison.

The re-used All models exclude arbitrary producer reentrancy and synchronous
nested teardown from exact post-setup action-word comparisons; native
synchronous behavior is checked independently. Their terminal ordering
depends on the underlying RxJS implementation. Source teardown is **not**
a promise that the producer can abort all physical work.

Each selected export produces a JSON manifest, BDD, STT, diagram, obligations,
JSON trace, four-lane Markdown trace and plain-language operator page from
its **canonical named rules**. Generated files are deterministic projections;
they do not serialize executable rule bodies or prove universal equivalence.

Read [Session 3 evidence](../evidence/SESSION-03.md) for actual CI results,
tested commit, bounded comparison counts, drift verification and declared
unresolved boundaries. Do not infer acceptance from these specifications
alone.
