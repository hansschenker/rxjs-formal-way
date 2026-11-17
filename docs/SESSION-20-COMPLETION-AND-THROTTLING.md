# Session 20 — Completion memory, transparent effects and duration-gated admission

**Europe/Zurich:** 17 November 2026. **Exactly five pinned RxJS 7.8.2 exports:** `takeLast`, `tap`, `throttle`, `throttleTime`, `throwIfEmpty`. The session reservation already exists and is continued, not restarted.

Pinned upstream revision: [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791), inspected at `src/internal/operators/<name>.ts`, and for `throttleTime` also `throttle.ts` and `src/internal/observable/timer.ts`. All five are pipeable exports, not global source constructors.

## Behavioral policies before code

| Export | Value/dataflow policy | Cω-style shape | When output occurs | Resource owner |
|---|---|---|---|---|
| `takeLast(n)` | Bounded FIFO retains last at most n values | `Cω(Count) → T* → T{0..n}` | Only on **successful source completion** | One source subscription; no timer |
| `tap(next)` | Observe then forward exact unmodified value | `Cω(Effect) → T* → T*` | After successful next callback | Per-connection source and correlated callback occurrence |
| `throttle(selector)` | First/last candidate across duration windows | `Cω(Signal,Policy) → T* → T*` | Leading, or on duration **next**, depending on policy | Source + currently selected duration |
| `throttleTime(d,s,c)` | Same throttle policy with a timer-based duration | `Cω(Time,Policy) → T* → T*` | Scheduler-owned duration tick | Source + one scheduled timer generation |
| `throwIfEmpty(factory?)` | Pass existing values; fail only if none arrived | `Cω(ErrorFactory) → T* → T*` | Values immediately; empty check at completion | One source; factory only at empty completion |

Time is a property of input events, duration Observables, and schedulers. The models do not read `Date.now()` or create real timers. They represent commands and changes of ownership. Cold subscriptions are independent: none of the five operators creates a shared source.

## Mealy six-tuples: S, S₀, Z, A, T, G

### takeLast

- **S:** `Unsubscribed`, `Active{pending:FIFO}`, `Closed{reason}`.
- **S₀:** `Unsubscribed` with no producer connection.
- **Z:** subscribe, source next/complete/error, downstream cancellation.
- **A:** upstream subscribe/unsubscribe, downstream next/error/complete.
- **T/G:** start with `n=0` immediately completes without subscribing; `n>0` acquires source; append until full, then replace FIFO head; completion drains FIFO in order and completes; error/cancel discard the FIFO without flushing. No `next` before `complete`.

A zero count is a *different connection policy*, not merely an empty buffer. The pinned code returns `EMPTY` and does not even subscribe upstream.

### tap

- **S:** `Unsubscribed`, `Active{index}`, `Calling{index,value}`, `Closed{reason}`.
- **S₀:** `Unsubscribed`.
- **Z:** source notifications and cancellation, plus exactly correlated `callback.return`/`callback.throw`.
- **A:** invoke-callback, original downstream notification, source teardown.
- **T/G:** each source next invokes the provided next handler; a correlated successful outcome forwards the *same source reference*, not the handler's return. A synchronous throw errors and releases the upstream. Source complete/error pass through without next invocation; a missing handler is identity.

**Scope:** the executable formal model covers the next-only observer/function and no-observer identity forms. It deliberately does *not* claim the `TapObserver` lifecycle hooks `subscribe`, `unsubscribe`, `finalize`, error/complete handlers, deprecated positional callback overloads, or arbitrary reentrancy. These must be separately modeled/tested before broadening acceptance. Native RxJS verification does not turn an excluded profile into a verified one.

### throttle and throttleTime

Both are one configurable transition algebra with `mode`, `leading` and `trailing`; `throttleTime` adds a positive integer virtual duration and a scheduler.

- **S:** `Unsubscribed`; `Active{pending,latest,windowGeneration,nextWindow,due}`; `Waiting{...}` after source completion with pending trailing output; `Closed{reason}`.
- **S₀:** `Unsubscribed`.
- **Z:** source next/complete/error and cancel; for `throttle` the current duration's next/complete/error; for `throttleTime`, a virtual scheduled timer firing at exactly `due`.
- **A:** acquire source, subscribe/unsubscribe duration or schedule/cancel timer, downstream next/error/complete.
- **T/G:** an unlocked source value either emits immediately (leading) or becomes pending (no leading), then begins a duration. Later source values overwrite the latest pending candidate but cannot open additional durations. When the correct duration **emits a next**, it unlocks; if `trailing && pending`, the latest value is sent and starts *another* duration if the source remains active. An empty duration **completion** only cleans up the duration; it does **not** flush the candidate. A duration error fails immediately with exact error identity. Source completion only waits if a trailing candidate is pending inside an active duration. A waiting duration-next flushes and then completes **without reopening a new duration**. Cancellation never flushes.

The model's guards include **resource generation**, scheduler due time, and source/duration phase; stale or early timer notifications are illegal. `throttleTime` is not an unrelated machine: the pinned implementation calls `throttle(() => timer(duration,scheduler), config)`.

**Scope:** non-reentrant ordinary Observable duration selector with no synchronous duration emission during subscription-assignment; for the timed variant, a virtual FIFO TestScheduler and a positive safe-integer duration 1..1000. Custom schedulers, throwing duration selectors and non-Observable conversion are excluded. Default settings are `leading=true, trailing=false`; both leading and trailing options are modeled and independently characterized.

### throwIfEmpty

- **S:** `Unsubscribed`, `Active{seen}`, `CallingFactory` (only custom factory on empty completion), `Closed{reason}`.
- **S₀:** `Unsubscribed`.
- **Z:** source next/complete/error and cancel; correlated custom factory return/throw.
- **A:** pass original next/complete/error; on empty completion emit `EmptyError` or invoke custom factory once, then use its exact return/throw as the error; release source.
- **T/G:** `seen` is a presence flag independent of value contents, so `undefined` is not empty. A non-empty completion completes normally; source error/cancel cannot run the factory.

## Specification and verification

Every transition description has an executable pure guard and an action-producing reaction. The existing runner checks unique enabled guards, validates state before and after each step, validates action words and rejects late/stale events. The generator projects the same model into BDD, STT, state diagram, temporal and ownership obligations, machine-readable manifest, JSON trace, four-lane timeline, plain-language operator page and the mandatory export inspection index.

Actual RxJS 7.8.2 tests are separate from model-predicted traces; they characterize synchronous notification order, error identity, cold upstream acquisition, teardown, and TestScheduler-driven due times. The `tap` handler's callback effects are executed *only by native tests*, not by the pure Mealy model. Finite tests establish scoped confidence, not universal observational equivalence.

See [the Session 20 evidence ledger](../evidence/SESSION-20.md) for exact commits, CI outcomes, preliminary failures, and acceptance status. No acceptance is granted by this document alone.
