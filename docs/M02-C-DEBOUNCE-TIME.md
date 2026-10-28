# M02-C — Silence, scheduled work and debounceTime

**Baseline:** RxJS 7.8.2, revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.
**Contract:** existing schema 1.1, runner and renderers retained unchanged.
**Acceptance:** [executed evidence](../evidence/M02-C.md). This is one scoped temporal profile, not all schedulers or the rest of M02.

## Intuition: what flows over time

Source values arrive over time. The operator keeps only the latest pending value. A scheduler wake-up checks whether enough silence has elapsed since the latest source value. If so, the pending value leaves unchanged. If not, the task schedules another wake-up for the remaining duration.

Completion flushes a pending value immediately, then completes. Error discards it and errors. Cancellation discards it without a terminal notification. None of these paths inspects the business content of a value; undefined, null, objects and repeated identical values are all valid packages.

The imported **RxJS Operators as Mealy Machines** discussion, under “Temporal & Higher-Order Operators,” supplied the useful idea of treating a timer firing as an input and scheduling as an output command. Its simplified Pending/Idle account is inspiration, not the exact scheduling specification. M02-C distinguishes that source-derived idea from the following source-inspected refinement; see the existing [review and provenance](reviews/2026-10-28-gemini-mealy.md).

## The crucial refinement: deadline is not scheduled wake-up

RxJS 7.8.2 remembers `lastValue`, `lastTime` and `activeTask`. A new source value always updates the first two, but schedules a task only if none exists. The task later compares `scheduler.now()` with `lastTime + dueTime`. Before that target it calls `this.schedule` for the remaining duration; otherwise it releases its task and emits.

For dueTime = 3:

| Time | Input | Latest deadline | Scheduled invocation | Result |
|---:|---|---:|---|---|
| 1 | next(a) | 4 | generation 0 at 4 | Schedule once; emit nothing |
| 3 | next(b) | 6 | still generation 0 at 4 | Replace value/time; no scheduling command |
| 4 | timer.fire(0) | 6 | generation 1 at 6 | Rearm for 2; emit nothing |
| 6 | timer.fire(1) | none | none | Release task, emit b |
| 7 | next(c) | 10 | generation 2 at 10 | Schedule once |
| 8 | complete | none | none | Release timer, emit c, complete, release source |

The phrase “restart the silence window” is useful for teaching, but does not mean a physical timer is cancelled and allocated at every next in this pinned implementation. A model that asserted those commands would disagree with its scheduling interface even when value marbles matched.

## Specification: six components and eleven rules

Canonical declaration: [src/models/debounceTime.ts](../src/models/debounceTime.ts).

| Component | Temporal profile |
|---|---|
| S | Unsubscribed, Idle(now,nextTimer), Pending(value,lastTime,deadline,scheduledFor,timer,nextTimer,now), Closed(now,reason) |
| S0 | Fresh Unsubscribed bookkeeping |
| Z | subscribe, source next/complete/error, cancel, generation-qualified timer.fire; each carries a clock reading |
| A | Source acquire/release, timer schedule/release, addressed next/error/complete |
| T | Remember or replace pending data, move deadline, rearm identity, become idle or close |
| G | One ordered action word; replacement is silent |

There are eleven rules: initialization, first value, replacement, rearm, due-time emission, and complete/error/cancel from each of Idle and Pending. All eleven have legal state-reaching witnesses. A bare elapsed duration is not an input: no work happens until the environment supplies a timer firing or another event.

Example BDD:

```text
Given Pending and a matching invocation fires before the latest deadline
When the scheduler delivers that timer event
Then schedule another invocation for deadline minus now
And remain pending with the same latest value
```

The generated BDD, STT, diagram and obligations use the canonical rule IDs. English is reviewed annotation beside code, not a theorem inferred from it.

## Time and identity contract

The parameters, clock readings, computed deadlines and generation counters are nonnegative safe integers. A clock is monotone, and zero-delay work is **deferred**, not invoked inline from schedule. These assumptions include the exercised virtual scheduler behavior; they do not claim every SchedulerLike implements the same dispatch.

Every timer event names `{ id: 'debounce-timer', generation }`. A generation identifies one **scheduled invocation**, not a JavaScript Action instance or a browser/Node timer handle. A rearm consumes the old invocation and creates a new generation; RxJS may reuse an Action object. Old, foreign, duplicated and too-early timer events are outside this legal-domain model and are rejected. Actual schedulers should prevent cancelled tasks from reaching the machine; model rejection is not a claim that RxJS throws for a synthetic stale event.

An eligible firing can be late. A new source value processed before that late firing replaces the pending value even if an older deadline has passed. A deadline is therefore a condition checked when work executes, not a guarantee that the event loop ran at that timestamp.

The model owns no clock. `event.now` is supplied by the environment. The generic runner's envelope also contains `time`; `runDebounceTimeTrace` rejects contradictory envelope/event timestamps before evaluating transitions. The generation registry uses that clock-aware runner for this profile. Plain `runTrace` remains operator-neutral and does not infer clock-field semantics.

## Equal timestamps do not determine execution order

For a value a at 1, a new value b at 4, and dueTime 3:

```text
source b first at 4 -> replace a -> wake-up rearms -> b at 7
old timer first at 4 -> a at 4 -> b schedules a new task -> b at 7
```

Both are coherent traces with the same source timestamps. The ordering of ready work determines which one occurs. Tests exercise two insertion strategies: pre-enqueue all source events, or enqueue the next one only after processing its predecessor. The pure adapter orders its finite priority queue by time and insertion sequence; the RxJS path uses TestScheduler's own ordering.

At dueTime zero, a pre-enqueued same-frame burst can coalesce while separately chained same-frame tasks can each emit. This is not a statement that zero delay is always identity or always coalesces. Inline zero-delay schedulers, including queueScheduler behavior, are excluded rather than silently mapped to deferred work.

## Termination and resource order

| Input/state | Ordered model actions |
|---|---|
| Due timer / Pending | Release timer; next(value) |
| Complete / Pending | Release timer; next(value); complete; release source |
| Complete / Idle | Complete; release source |
| Error / Pending | Error; release source; release timer; discard pending memory |
| Cancel / Pending | Release source; release timer; discard pending memory |

The error/cancel cleanup ordering is the characterized **post-subscription-setup** lifecycle. Synchronous producer termination before source teardown is attached can have different internal finalizer ordering; its completion-flush value behavior is checked separately, not claimed as full action-trace equivalence. Nested delivery, throwing finalizers and cancellation inside observer calls require a refined execution model.

Completion also invalidates an unqualified minimum-gap claim: after emitting a at 4, b can arrive at 5 and be flushed by completion at 6 with dueTime 3. The two output values are only two units apart. The silent-window policy and the completion exception must both be stated.

## Ownership and sharing

Pending value, clock bookkeeping and timer counter belong to each result subscription. A hot producer does not by itself share these. Explicit share after debounceTime can share the debounced execution. Native tests cover subscription independence, explicit sharing and downstream take cancellation; these are not implementations of a share machine or a general pipeline composer.

Closed state drops pending references. Ordinary payloads and trace entries are not deep-cloned snapshots. These examples use JSON-safe values; the manifests/traces are not a lossless loader for all possible JavaScript objects.

## Verification

30 new pure-model tests cover literal reactions, clock validation, timer identity, stale events, overflow boundaries, late firing, tie order, rule reachability, generated identities and corrupted implementations. Eight negative TypeScript assertions supplement the previous 24.

22 new RxJS test cases include independently stated marbles, source subscription assertions, deferred zero-delay behavior, completion/error/cancellation, repeated values, payload identity, late scheduler execution, hot input and sharing/cancellation interactions.

The final case enumerates:

```text
3 durations {0,2,4}
× 31 binary words of length 0..4
× 3 source spacings {0,2,5}
× 3 endings {complete,error,cancel}
× 3 final offsets {0,1,6}
× 2 insertion strategies {eager,chained}
= 5022 bounded scenarios
```

For each, an independent array-priority-queue model adapter is compared with the actual RxJS operator using an instrumented SchedulerLike backed by TestScheduler. The ordered observations include schedule requests, firing identities, timer release, downstream notifications and source acquisition/release. The instrumentation assigns logical invocation generations, not physical host IDs.

Each scenario additionally compares that instrumented RxJS path with the **unwrapped native TestScheduler**, projecting away timer instrumentation and checking notifications and source lifetime. This checks the adapter's observable transparency within the finite domain, not equivalence of every scheduler implementation. Deliberately delayed scheduler cases are separate tests; their added lateness is an explicit environment input.

The expected combined baseline is **223 named tests**, **32 negative type assertions**, **48 generated projections**, and **8649 bounded model/RxJS scenarios** across the four experiments. Only the [evidence record](../evidence/M02-C.md) establishes executed results. Finite comparisons and literal tests do not prove universal equivalence.

## Artifacts and commands

[Behavior](../operators/debounceTime.md), [BDD](../generated/debounceTime.bdd.md), [STT](../generated/debounceTime.stt.md), [STD](../generated/debounceTime.diagram.md), [obligations](../generated/debounceTime.obligations.md), [four lanes](../generated/debounceTime.trace.md), [manifest](../generated/debounceTime.manifest.json), [JSON trace](../generated/debounceTime.trace.json).

```sh
npm ci --ignore-scripts
npm run check
npm run test:model
npm run generate
npm run check:generated
```

Six configured profiles now cover five operators. Earlier models, shared schema, runner, renderer, tests, dependencies and 40 projections remain unchanged. M02-D, switchMap, is next: outer/inner origins, generation-qualified subscriptions, replacement, completion waiting and cancellation.

## Pinned primary sources

- [debounceTime: pending value, latest time, rescheduling and completion flush](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/debounceTime.ts)
- [VirtualTimeScheduler: same-frame action order](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/scheduler/VirtualTimeScheduler.ts)
- [Subscriber: terminal notification and teardown](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscriber.ts)
- [Subscription: finalizer registration and release](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/Subscription.ts)
