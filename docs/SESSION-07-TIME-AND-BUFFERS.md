# Session 7 — duration windows and buffered values

**4 November 2026 · Europe/Zurich · RxJS 7.8.2**. Five distinct exports:
`audit`, `auditTime`, `buffer`, `bufferCount`, `bufferTime`. Six
generated configurations count as **five** operators because `bufferTime`
has two explicit scheduling profiles. All models refer to the pinned RxJS
source revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.

## Source pins and contract

- [audit.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/audit.ts): latest-value retention, duration-subscription lifecycle and completion without a duration next.
- [auditTime.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/auditTime.ts): forwards to `audit(() => timer(duration, scheduler))`.
- [buffer.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/buffer.ts): source-first subscription and notifier-controlled buffer swaps.
- [bufferCount.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/bufferCount.ts): value-count-based opens, full-buffer removal and completion flushes.
- [bufferTime.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/bufferTime.ts): scheduler-owned opening/closing and max-size short-circuit.

All five operators use the canonical Mealy tuple `M = (S, S₀, Z, A, T, G)`:
`S` contains control phase and remembered values/windows; `S₀` is
`Unsubscribed`; `Z` is the typed source/inner/timer/callback event
alphabet; `A` consists of ordered subscribe, unsubscribe, notify,
schedule, cancel-timer and callback-invocation actions as applicable.
`T` and `G` come from named, disjoint, guarded TypeScript rules.
The runner never invokes user callbacks, and state-dependent invalid
events throw instead of silently continuing.

## Operator behavior and policy axes

| Export | Cω-style value shape | State policy | Trigger and output policy |
|---|---|---|---|
| `audit` | `(T! → U*) → T* → T*` | latest pending value, at most one active duration | first source next calls selector; later values replace; **duration next** emits latest; duration complete alone **does not emit** |
| `auditTime` | `auditTime(d) : T* → T*` | latest pending value and one scheduled duration | timer firing after the first source event emits latest; replacement does not restart window |
| `buffer` | `U* → T* → (T*)*` | one current array | notifier next emits old array even when empty, then starts a new one |
| `bufferCount` | `bufferCount(n,k) : T* → (T*)*` | ordered active arrays opened every `k` source values | every source next appends to all open arrays, emits every one reaching `n` |
| `bufferTime` | `bufferTime(span,creation?,max?) : T* → (T*)*` | active time windows and timer generations | time-expired or size-full window emits its array; optional interval can overlap windows |

**Time** comes from a duration Observable or a scheduler and is modeled as
an explicit ordered event; no deadline by itself produces an output.
`auditTime` has a positive safe-integer, deferred scheduler profile.
`bufferTime` has a positive safe-integer span, optional positive interval,
optional positive size cap, and a monotone externally supplied clock.
Equal-timestamp source/timer order is explicit rather than guessed.
`buffer` and `bufferCount` add no clock, scheduler or sharing.

**Termination and cancellation remain independent**. `audit` and
`auditTime` defer source completion while a duration is active.
When the active duration emits its next value, the latest pending source
value is emitted and the result completes; an `audit` duration that simply
completes instead does not flush that value. Errors and downstream
unsubscription discard pending values. Buffer operators flush open
arrays on successful source completion, but neither errors nor
cancellation flush. `buffer` notifier completion does not flush or
terminate the source.

**Sharing**: none is introduced. Every result subscription owns its
latest value, active duration or buffered arrays and timer generation
bookkeeping. External hot/shared inputs do not imply shared operator
state.

## Traceability and verification

Canonical models are in `src/models/audit.ts`,
`src/models/buffering.ts` and `src/models/bufferTime.ts`.
The unmodified generator/runner/renderer pipeline writes **eight**
deterministic projections for each configuration: JSON manifest,
state-transition table (STT), BDD rules, control-state diagram,
test obligations, JSON trace, four-lane trace and user-facing operator page.
Six configurations produce **48 new views**. Traces are
**model predictions**, not recordings of native RxJS.

The 45 new named model/native tests and 17 additional compile-time
negative TypeScript assertions cover all five exports: notifier next,
complete and error; overlapping/contiguous/gapped count buffers; timed
window expiration/overlap/size caps; duration-selector return and throw;
scheduler-managed subscription lifetimes; cancellation; empty flushes;
zero-emission terminal behavior; and per-subscription memory. The bounded
enumerations contain 363 buffer, 1,815 bufferCount and 45 auditTime cases
(**2,223** comparisons) in addition to named fixed boundary scenarios.
These finite checks are evidence, **not universal equivalence proofs**.

The same `npm run check` pipeline tests JavaScript syntax, strict
TypeScript, model and independent actual RxJS behavior, and checks
generated-file drift. Explicit GitHub Actions job IDs, tested SHAs and
read-only committed-view verification are recorded separately in
[evidence/SESSION-07.md](../evidence/SESSION-07.md).

## Explicit exclusions

- Arbitrary nested/reentrant notifications, output-delivery cancellation
  inside a callback, and throwing downstream observers/finalizers.
- Non-Observable duration or notifier conversion, Promise timing, custom
  synchronous schedulers, zero/invalid/unsafe timing and count parameters,
  and counter/clock overflow.
- Universal symbolic state-space equivalence, host timer-handle identity
  and wall-clock latency bounds.
- Mutation of user-provided object references or emitted arrays by
  downstream observers after delivery.

Acceptance of a named export means **only** its declared profiles and
constraints passed their recorded verification; it does not claim full
equivalence for every RxJS overload or interleaving.
