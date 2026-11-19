# Session 22 — withLatestFrom: source-triggered latest-value gating

**RxJS 7.8.2** pinned upstream source revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. [Implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/withLatestFrom.ts); [canonical model](../src/models/session22-withLatestFrom.ts).

## Intuition: values moving in time

The source stream acts as **the trigger**; supplied auxiliary streams act as **memory updates**. Each auxiliary must emit at least once before a source value may produce output. A source value arriving too early is dropped (not queued). Once ready, each subsequent source next combines its value with the most recent auxiliary values. An auxiliary update alone never emits.

If an auxiliary emits `undefined`, that still counts as a value. When an auxiliary completes, its last value remains remembered. An auxiliary that completes **without emitting** permanently blocks readiness, but does not stop the source. Source completion ends the output regardless of auxiliary state. Error in either source or auxiliary ends output and releases all connections.

`withLatestFrom(a$, b$)` subscribes `a$`, then `b$`, then source. Construction of the dataflow does not connect or produce effects; all acquisition takes place on subscription. Each result subscription maintains its own independent memory and connections.

## Specification

The scoped shape, using the course's Cω convention, is:

`withLatestFrom : (U₀*, U₁*, …, Uₙ*) → T* → (T × U₀ × U₁ × … × Uₙ)*`

The result is at most one output per source next; outputs happen only once all auxiliary presence flags are true. A tuple is fresh but its members preserve reference identity.

### Mealy six-tuple

| Element | Meaning |
|---|---|
| `S` | `Unsubscribed`, `Active(latest[],hasValue[],live[],ready)`, `Closed(reason)` |
| `S₀` | `Unsubscribed` |
| `Z` | `subscribe`; `source.next/complete/error`; indexed `aux.next/complete/error`; `cancel` |
| `A` | Ordered source/auxiliary connection and teardown actions, plus outer `next/complete/error` |
| `T` | Named and guarded rules `S22-WITHLATESTFROM-*` in canonical TypeScript |
| `G` | Ordered actions: acquire every auxiliary before source; emit only when source next occurs in ready state; propagate errors; release all owned inputs |

### Named state policies and legality

`START` creates false presence flags, empty latest memory and live subscriptions. `AUX-NEXT` stores the provided opaque value, sets its presence bit and recomputes `ready`, but never emits. `AUX-COMPLETE` releases only its connection, retaining the last value and whether it ever produced a value. `AUX-ERROR` propagates the same error and closes every input.

`SOURCE-BLOCKED` discards a source value whenever `ready = false`. `SOURCE-READY` emits `[sourceValue, ...latest]` once for the current source value when `ready = true`. `SOURCE-COMPLETE` completes without waiting for auxiliaries; `SOURCE-ERROR` fails with the original error, and `CANCEL` silently tears down.

A numbered auxiliary may emit, complete, or error only while `live[index] = true`; its index must be a safe integer from zero through `inputCount - 1`. Closed executions accept no further source/auxiliary events. The memory arrays must all match the configured input count; `ready` must equal `hasValue.every(Boolean)`, distinguishing the presence of an `undefined` value from absence.

### Time, cancellation, sharing

No scheduler or clock is introduced. Source notifications determine the times of output; all input notifications supply their own times. Equal-time ordering must be explicit (for example, whether auxiliary `next` precedes source `next` at the same virtual timestamp).

All subscriptions are independent by default; the operator does **not** multicast, replay or retain auxiliary connections on behalf of other result subscribers. Outer cancellation releases source and all live auxiliaries and emits no terminal notification. Completion/error release resources, including incomplete auxiliary streams.

### Declared scope and exclusions

This model covers **1–16 auxiliary Observables**, tuple output without a user result-selector, post-setup atomic non-reentrant input notifications, finite safe-index identities and subscription-local memory. The pinned zero-auxiliary implementation has `ready=false` and is deliberately excluded. Deprecated projector overloads, synchronous setup-time notifications (separately native-characterized), arbitrary ObservableInput conversions, observer exceptions, reentrant callbacks and unrestricted infinite-run equivalence are not implied.

## Independent verification and generated teaching views

The [model tests](../tests/session22-withLatestFrom-model.test.mjs) assert guards, input ordering, the two readiness states, identity, completion, errors, cancellation, invalid states and rule witnesses. [Native RxJS tests](../tests/session22-withLatestFrom-rxjs.test.mjs) independently execute the actual operator, using Subject/Observable lifetimes, completion, explicit error objects, cold resubscription and TestScheduler. [Strict TypeScript tests](../tests/types/session22-withLatestFrom.ts) assert the supported event/state types.

The generator projects two model histories into BDD, STT, state diagram, obligations, JSON manifest, JSON trace, four-lane trace and plain-language page. The required [eleven-step inspection index](../operators/withLatestFrom-index.md) groups both histories under one distinct RxJS export. Projected traces are **model predictions**, not actual RxJS runtime observations; acceptance requires independent runtime tests and committed read-only drift evidence in [Session 22 ledger](../evidence/SESSION-22.md).
