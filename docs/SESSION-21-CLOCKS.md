# Session 21: values annotated by an external clock

**Exports:** `timeInterval` and `timestamp`. **Runtime:** RxJS 7.8.2, pinned revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). These are two profiles within Session 21's five-export batch. The [session evidence ledger](../evidence/SESSION-21.md) owns acceptance and exact executed revision claims.

## Intuition: decorate a value when it arrives

Both operators forward a fresh record containing the original value and a number supplied by an external clock. They do not create a timer, schedule a notification, or make the source emit. Construction describes the dataflow; a result connection starts its execution.

| Operator | What flows on each source value | Why this policy is useful |
|---|---|---|
| `timeInterval(clock)` | `{ value, interval: currentReading − previousReading }`. The initial previous reading is taken when this result connects. | Measure the clock difference from connection to the first value, then between successive values. |
| `timestamp(provider)` | `{ value, timestamp: currentReading }`. There is no initial provider read. | Associate each value with the clock reading taken during its reaction. |

The source payload remains the same reference. A fresh outer record does not clone the object inside it. Two connections own independent bookkeeping even if they observe one live Subject. Neither operator introduces sharing or replay.

The pinned implementations matter here: [timeInterval](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/timeInterval.ts) uses its scheduler's `now()` method and defaults to `asyncScheduler`; [timestamp](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/timestamp.ts) maps each value using a `TimestampProvider`, defaulting to `dateTimestampProvider`. Supplying a scheduler as the provider does not cause these operators to call its scheduling methods.

### Two different notions of time

**Trace-envelope time orders the execution. Provider readings are data returned by `now()`.** The model requires chronological, finite, nonnegative envelope times. It permits finite provider readings that are negative, fractional, equal, or decreasing. For `timeInterval`, differences must also remain finite. A provider that moves backwards produces a negative interval; the operator does not repair the clock.

| Envelope time | External event | Provider reading | `timeInterval` output | `timestamp` output |
|---:|---|---:|---|---|
| 0 | Connect result | 100, for `timeInterval` only | None; establish baseline | None; do not read yet |
| 2 | Source next A | 103 | `{value: A, interval: 3}` | `{value: A, timestamp: 103}` |
| 5 | Source next B | 101 | `{value: B, interval: −2}` | `{value: B, timestamp: 101}` |
| 6 | Source complete | No read | Complete | Complete |

The examples are model-predicted traces. Independent native fixtures below check corresponding policies against actual RxJS.

## Specification: one explicit read boundary

The [canonical TypeScript](../src/models/session21-clock.ts) shares a small policy kernel. A provider read is represented by an `invoke-callback` action with no argument and a resource such as `{id: 'timeInterval.now', generation: 0}`. Its correlated `clock.return(reading)` or `clock.throw(error)` is an external event. The pure model does not execute the provider.

The read and its outcome are synchronous microsteps at the same envelope time. `runClockTrace` checks that equality in addition to the generic runner's chronological envelope checks. Only the currently pending read identity is legal. A source event or cancellation cannot interleave inside a pending read in this nonreentrant profile. A trace may end at an unfinished microstep as an explicitly partial input prefix; that is not a completed native reaction.

### Cω-style shapes

| Export | Shape | Qualification |
|---|---|---|
| `timeInterval` | `Cω(SchedulerClock) → T* → {value:T,interval:number}*` | One output for each source value whose provider read succeeds. Initial read failure prevents source acquisition. |
| `timestamp` | `Cω(TimestampProvider) → T* → {value:T,timestamp:number}*` | One output for each source value whose provider read succeeds; no read at connection. |

Errors are terminal notifications, not output values. These shapes describe qualified value cardinality, not native TypeScript overloads or complete notification protocols.

### `timeInterval`: six-tuple

| Component | Scoped definition |
|---|---|
| **S** | `Unsubscribed`; `ReadingStart(read=0)`; `Listening(previous,nextRead)`; `ReadingNext(previous,read,value)`; `Closed(reason)`. Previous readings are finite numbers; active read indices are nonnegative safe integers, with next-value reads starting at 1. |
| **S₀** | `Unsubscribed`, with no source connection, baseline or pending read. |
| **Z** | Result subscribe/cancel; source next/error/complete; correlated clock return/throw. Envelope time is supplied separately. |
| **A** | Request provider read; acquire/release source; notify downstream with next/error/complete. There are no timer actions. |
| **T** | Subscribe requests baseline. Its return enters Listening and stores the reading. Source next retains the value while awaiting its read. Successful next read replaces the baseline and advances the read counter. Failure or termination closes and drops memory. |
| **G** | Request baseline before acquiring source. Each successful next read emits `{value, interval: reading − previous}`. Initial read throw emits its exact error without source acquisition. Later read throw emits error then releases source. Source terminals forward then release; cancel only releases. |

The implementation constructs a native `TimeInterval` instance. The model deliberately observes its **structural value/interval projection**, preserving the payload reference and number. A separate native test checks the actual `TimeInterval` prototype and fresh wrapper identity. Generated plain records are not a claim that RxJS returns a plain object.

### `timestamp`: six-tuple

| Component | Scoped definition |
|---|---|
| **S** | `Unsubscribed`; `Listening(previous=null,nextRead)`; `ReadingNext(previous=null,read,value)`; `Closed(reason)`. There is no ReadingStart state or historical reading. Next-value read indices start at 0. |
| **S₀** | `Unsubscribed`, with no source connection or pending read. |
| **Z** | Result subscribe/cancel; source next/error/complete; correlated clock return/throw. |
| **A** | Source acquisition/release; provider-read request; downstream notification. No scheduling or cancellation of timers. |
| **T** | Subscribe enters Listening immediately. Source next enters ReadingNext with its exact value. A successful read returns to Listening with incremented read counter, retaining no previous timestamp. Failure or termination closes. |
| **G** | Acquire source without reading time. For each successful read emit fresh `{value, timestamp: reading}`. A read throw replaces that pending value with its exact error and releases source. Source terminals and cancellation perform no clock read. |

### Named transition policy

Rule IDs begin `S21-TIMEINTERVAL-` or `S21-TIMESTAMP-`. The following suffixes expose their relationship to the state/action policy.

| Rule group | State/event and ordered action policy |
|---|---|
| `START-READ`, `START-RETURN`, `START-THROW` | Interval only: request initial clock; on return acquire source; on throw error without any source acquisition or release. |
| `START` | Timestamp only: acquire source with no initial read. |
| `NEXT-READ` | Listening + source next: retain value; request the next correlated clock reading. |
| `NEXT-RETURN` | ReadingNext + matching finite return: update bookkeeping and emit the configured fresh wrapper. |
| `NEXT-THROW` | ReadingNext + matching throw: error with the exact thrown payload, then release source. |
| `COMPLETE`, `ERROR` | Listening + source terminal: forward its unchanged terminal notification, then release source. No provider read. |
| `CANCEL` | Listening + consumer close: release source silently, with no provider read or downstream terminal. |

Guards reject stale identities, unsupported states, malformed counters, nonfinite readings, overflow differences and events after closure. A model invocation counter correlates observations; it is not a physical scheduler task ID. Rejected examples and explicit witnesses do not prove universal guard totality over arbitrary JavaScript objects.

## Verification: observations independent of the model

| Layer | Checked-in tests | Scope |
|---|---|---|
| Model | [19 tests](../tests/session21-clock-model.test.mjs) | Initialization, configured state legality, interval differences, timestamp history absence, exact error identity, source termination/cancellation, same-time read outcomes, and an explicit legal witness for every retained rule. |
| Native RxJS | [17 tests](../tests/session21-clock-rxjs.test.mjs) | Literal expectations for read order, acquisition/teardown, positive/negative/fractional differences, fresh wrappers, payload identity, clock errors, empty/never streams, cancellation, virtual-time subscriptions and separate live connections. No canonical-model import. |
| Differential | [2 tests](../tests/session21-clock-differential.test.mjs) | **288 finite comparison executions per export; 576 total**, comparing complete ordered timestamped action observations with the model under the stated structural abstraction. |
| Static rejection | [12 negative assertions](../tests/types/session21-clock.ts) | Invalid operator names, value types, readings, identities, missing error/value/counter fields, timer events, initial indices, output types and unsupported clock bindings. |

The differential grid is six value words × four reading sequences × three endings × four throwing-read choices = 288 configurations for each operator. Words contain zero through three values, including `undefined`, `null` and repeated object references. Readings include ordinary, backward, fractional and equal readings. Endings are completion, source error and cancellation. Failure indices are no throw, 0, 1 or 2.

The native provider records its actual call and return/throw; real RxJS decides acquisition, outputs and teardown. The model is replayed only afterward from those recorded external events. The observer copies the native wrapper's documented fields for the explicit structural comparison, retaining the original inner value reference. Model predictions do not drive native delivery or select expected results.

These are **comparison executions, not necessarily distinct histories**. Some selected throwing indices are never reached; attempted commands after native closure are omitted from the accepted input history. Explicit model witness sequences exercise all retained rules in the two configured machines, not all states, values or histories. All execution and acceptance claims require the [session ledger](../evidence/SESSION-21.md).

### Scenario-to-test entry points

| Scenario or obligation | Named test entry point |
|---|---|
| Interval baseline, first difference and backward reading | `S21 CLOCK RX timeInterval: baseline precedes source acquisition and each interval uses the preceding read` |
| Timestamp reads only on next and retains no history | `S21 CLOCK RX timestamp: reads only at next, uses the exact provider reading and emits fresh plain records` |
| Failed initial read | `S21 CLOCK RX timeInterval: failed initial reading errors before any producer acquisition` |
| Failed next read | `S21 CLOCK RX {operator}: provider throw replaces a pending value and tears down exactly once` |
| Cancellation and source failure | The corresponding native titles `explicit cancellation is silent and stops subsequent reads` and `source failure preserves its error and does not read time`. |
| Each retained rule ID | `S21 CLOCK MODEL {operator}: every retained rule has an explicit legal witness` |
| Same-time provider outcomes versus independent reading data | `S21 CLOCK MODEL: trace wrapper distinguishes chronological envelopes from provider readings and validates synchronous return` |

Rule obligation IDs and literal test titles are distinct; this table and the witness-set assertion define the mapping. Generated views are consistent projections of the canonical rules, not independent runtime oracles.

## Scope and pinned upstream inspection

The upstream [timeInterval specs](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/timeInterval-spec.ts) and [timestamp specs](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/timestamp-spec.ts) were inspected. They include literal value/time expectations, empty/never/error streams, early unsubscription, subscription intervals and cooperative synchronous producers. The upstream suite itself was not executed here. Provider-failure and backward-reading fixtures are additional local characterizations grounded in the pinned implementations.

The canonical profiles exclude nonfinite numeric readings, overflowing differences, receiver/getter mutations, arbitrary provider/observer reentrancy, cancellation while a read is pending, and source delivery during acquisition. Native tests separately characterize synchronous producers stopping when downstream `take(2)` closes; those tests do not enlarge the atomic setup model. Source teardown ordering assumes setup has returned. Throwing producer/observer teardown and universal infinite-trace liveness are also excluded.

Provider errors are included, with exact error-channel payload identity; no assumption that an error payload is an `Error` instance is needed. Conditional progress depends on source events and the synchronous provider outcome. An empty or silent source does not acquire a timer merely because the operator's name mentions time.
