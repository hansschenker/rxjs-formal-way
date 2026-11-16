# Session 19: uniqueness, trailing memory, deferred connection and switch-state policies

**Europe/Zurich:** 16 November 2026. **Pinned RxJS:** 7.8.2, source commit [e5351d02](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). Exactly five operator exports; overloads are profiles, not extra names.

## Intuition → Specification → Verification

Observable values arrive over time. Each operator changes a different admission, memory or connection policy. Domain values remain opaque, except when a user-supplied predicate or accumulator interprets them.

| Operator | Cω-style type | Six-tuple state/control and guarded behavior | Time, cancellation, sharing |
|---|---|---|---|
| `single` | `Cω(Predicate?) × T* → T?` | State: Unsubscribed → Active(seen,hasMatch,index,candidate) ↔ Calling(indexed predicate) → Closed. Guards distinguish first/no match, duplicate, empty and no-match completion. Exactly one match emits only at successful completion. | No timer. Cancel discards candidate. No sharing. |
| `skipLast` | `Cω(Count) × T* → T*` | State: Unsubscribed → Active(FIFO,seen) → Closed. Guards choose identity, filling FIFO or replacing/emitting oldest. Retained suffix never flushes. | Delay counted in subsequent `next` events, not milliseconds. Cancel silent. No sharing. |
| `subscribeOn` | `Cω(Scheduler,Duration) × T* → T*` | State: Unsubscribed → Pending(scheduled action) → Active(source acquired) → Closed. Correlated scheduler-fire guard determines producer connection. | Scheduler supplies start time; values subsequently flow at source time. Pending cancellation prevents acquisition. No sharing. |
| `switchMapTo` | `Cω(Observable) × T* → U*` | Reuses reviewed `switchMap` state/guard algebra. Outer next cancels previous inner before acquiring a new subscription occurrence to the same configured Observable. | Only latest. Outer completion waits for current inner. Configured producer may itself be shared. |
| `switchScan` | `Cω((R,T,Index)→R*,Seed) × T* → R*` | Reuses `switchMap` guards and adds accumulator memory. Callback receives latest delivered inner value (initially seed); current inner next replaces that memory. | Latest-wins cancellation. No timer or implicit sharing. Completed outer waits for current inner. |

Formally each canonical model has the Mealy tuple **(S,S₀,Z,A,T,G)**: state, initial state, external events, ordered actions, next-state function, action-output function. Named guards make admissible actions state-dependent and reject stale resource generations. A source notification, callback outcome, scheduler fire and consumer connection lifecycle are distinct input events. The model emits *predicted action words*; it never runs subscriptions.

## Pinned implementation distinctions

- [single.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/single.ts): `seenValue` and `hasValue` are independent. EmptyError is different from NotFoundError on a non-empty predicate miss. The second match immediately produces SequenceError. A stored value is not emitted until source completion.
- [skipLast.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/skipLast.ts): the ring buffer slot is replaced before forwarding its previous value. `skipCount <= 0` is an identity shortcut. Canonical memory is modeled for counts 0–8; negative-count identity is separately tested natively.
- [subscribeOn.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/subscribeOn.ts): a scheduler action owns the later `source.subscribe(subscriber)` call; it does not schedule each individual notification. Deferred virtual FIFO scheduling, including delay zero, is the declared profile; synchronous queueScheduler is excluded.
- [switchMapTo.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/switchMapTo.ts): delegates to `switchMap(() => innerObservable)` without the deprecated result selector. Fixed source identity is guarded, while inner subscription generations change.
- [switchScan.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/switchScan.ts): accumulator state is updated by the flattened inner **next**, not by the accumulator function returning an inner Observable. Switching cancels an older inner before the next accumulator call.

## State-dependent obligations and scope

**Safety:** no output after terminal state; `single` cannot emit before uniqueness is established; `skipLast` never exceeds its FIFO bound or emits retained values at completion; `subscribeOn` cannot acquire the source before scheduler fire; `switchMapTo` and `switchScan` reject stale inner events; only a current `switchScan` inner next updates accumulator. Original source and callback error objects retain identity; deliberate `single` contract failures synthesize their specified error classes.

**Conditional liveness:** a finite successfully completed `single` source emits exactly one match or fails according to presence/match counts; completed `skipLast` completes with no suffix flush; fired `subscribeOn` permits the connected producer to run; when the outer and latest inner complete, switching operators complete. Infinite or silent sources have no unconditional eventual-completion guarantee.

**Verification:** `src/models/session19.ts` contains canonical TypeScript guarded transition rules; `tests/session19-model.test.mjs` checks legal/illegal rules and model traces; `tests/session19-rxjs.test.mjs` independently observes real RxJS 7.8.2 next/error/complete, source acquisition, virtual scheduler and teardown; `tests/types/session19.ts` contains negative typing assertions. The existing generator creates, for each export, BDD, STT, state diagram, obligations, manifest, JSON trace, four-lane trace, plain-language behavior page and the required eleven-step `*-index.md` navigation.

**Exclusions:** arbitrary reentrancy, unusual custom schedulers and synchronous queueScheduler, Promise/Iterable inner conversion, deprecated result selectors, BooleanConstructor specialization, unbounded `skipLast` allocation and non-terminating correctness claims. Unsubscription is a connection teardown request, not a guarantee that all external work physically stops. Finite tests demonstrate the stated profiles, not universal equivalence.

See [Session 19 evidence](../evidence/SESSION-19.md) for the exact tested commit and retrieved CI conclusion.
