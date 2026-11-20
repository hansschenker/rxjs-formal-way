# Session 22: timed live windows

**Export:** `windowTime`. **Runtime:** RxJS 7.8.2 at pinned revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). The [Session 22 ledger](../evidence/SESSION-22.md) records executed checks and acceptance. The [canonical model](../src/models/session22-windowTime.ts) describes the scoped policy, and the [inspection index](../operators/windowTime-index.md) connects its generated views.

## Intuition: a stream of live streams

Source values flow into every window that is currently open. A new outer subscription announces one empty window before acquiring the source. Each emitted handle is a live multicast Observable: a child receives only values delivered after it connects. Values remain opaque and retain their identity; the operator never collects them into a buffer array.

| Configuration | What opens a window | What closes it | What follows closure |
|---|---|---|---|
| Span only | Connection, then every preceding closure | Its close timer, maxSize if configured, or source terminal | A successor opens immediately after a normal time/count closure |
| Span + creation interval | Connection and recurring creation firings | Its own close timer, maxSize, or source terminal | Creation continues independently; closure does not immediately open a successor |
| Interval smaller than span | Recurring creation | Per-window time/count policy | Windows can overlap |
| Interval larger than span | Recurring creation | Per-window time/count policy | Source values in an uncovered gap are dropped |

A size limit counts source deliveries to each window, even when that window currently has no child observers. On a source next, RxJS snapshots its current window records, then processes one window at a time: deliver the value, increment its count, and close it if full. Consequently an earlier overlapping window can complete before a later window receives that same source value. A sequential successor does not receive the value that closed its predecessor.

Time comes from the supplied scheduler. A stored deadline does not act by itself: a timer firing is a separate input. Equal-time creation, source delivery and closure follow the supplied event order. A delayed closure starts a sequential successor's duration from the actual firing time, not from the old nominal deadline.

### Ownership and stopping

Each outer subscription owns its source connection and timers. Inner windows introduce multicast only inside that execution. Inner consumers have independent subscriptions and do not keep the source or timers alive after the outer subscription closes.

Source completion or error terminates each current window before terminating the outer observer. Historical windows that already completed keep their completion. Failed current windows retain the exact error for late observers; none of these handles replay source values.

Outer cancellation does **not** complete, error or unsubscribe the window Subjects. It cancels timers and disconnects the source. Existing child subscriptions and late subscriptions to the orphaned current handles remain open and silent until individually closed. This differs from the disposed-current-handle behavior of `window(boundaries)`.

Resource cleanup follows actual registration order: the recurring creation task, the initial window's close timer if still live, the source connection, and then close timers belonging to later windows. Later windows are created after the source was acquired. The model therefore does not put every timer cancellation before source teardown.

## Specification

### Cω shape and supported parameters

`windowTime : (Span, Interval?, Count?) → T* → (T*)*`

The outer sequence contains live inner sequences. Inner sequences can be empty; different inner sequences can contain the same opaque source value when their windows overlap. Lifecycle events and connection ownership supplement this value shape.

The constructor is `createWindowTimeModel(span, creationInterval = null, maxSize = null)`. Finite spans, intervals and counts are integers from 1 through 1,000. Null interval selects sequential restart; null maxSize selects unbounded counting. Supplied time and counters are nonnegative safe integers with sufficient room for the next configured deadline. This is an explicit finite-parameter scope, not a replacement for every public overload normalization.

### Mealy six-tuple

| Component | Definition |
|---|---|
| **S** | `Unsubscribed`; `Active` with supplied `now`, consecutive window identities, historical window records, open child consumers, used observer identities, and optional recurring creation tick/deadline; or `Stopped` with retained handles/consumers and a completion, error or cancellation reason. |
| **S₀** | `Unsubscribed`; no source, window, consumer or timer resources have been acquired. |
| **Z** | `subscribe`, `cancel`, source next/error/complete, addressed child subscribe/unsubscribe, per-window timer firing, and recurring creation firing. Every event carries supplied `now`; window timers name a generation and creation firings name a tick. |
| **A** | Ordered outer/child notifications; source/child acquire and release; timer scheduling and cancellation. An outer next contains `{windowId}`, an explicit normalization of the actual emitted Observable handle. |
| **T** | Pure guarded updates to window state/counts/deadlines, recurring tick, child ownership and terminal history. Source next iterates the pre-reaction live window list; timer closure invalidates only its current window generation. |
| **G** | Emit initial/new handles before scheduling their close timers; deliver source values in window order; complete/count-close windows where required; send inner terminals before outer; release resources in registration order. Cancellation sends no terminal notification. |

`Stopped` is deliberately not marked fully terminal in the canonical control metadata. The outer execution has stopped, but historical handles and orphan child subscriptions still admit their own lifecycle events.

### State-dependent guards

- Time must be finite, integral, nonnegative, nondecreasing and safe for configured deadline arithmetic. `runWindowTimeTrace` additionally requires every event's `now` to equal its trace-envelope time.
- A window timer must name an open active window generation and arrive at or after that record's exact deadline. A stale generation, unknown window or early delivery is illegal.
- Periodic creation requires its configured logical timer, generation zero, current tick and due time. The next tick and deadline are derived from the actual firing time. Sequential mode admits no creation-timer event.
- Active sequential mode has exactly one open window and no recurring creator. An open active window has `deadline = openedAt + span` and a count below a finite size limit.
- Window identities are consecutive; opening times are ordered; consumer identities are nonempty and never reused. Every attached consumer belongs to an open recorded window.
- A stopped outer execution has no active timers. Complete/error leave no live consumers; cancellation can retain silent open consumers. Source and timer events are illegal after stopping.

The recurring creator is one **logical timer resource**, with an explicit tick identifying each delivered occurrence. Per-window timer generations equal window identities. This normalizes scheduler-specific allocation and reuse of physical Action objects; it does not claim to reproduce a particular scheduler's internal object graph.

The external driver supplies the declared FIFO scheduling order. Model guards check current timer identity, tick, deadline and supplied time; they do not reconstruct or validate the scheduler's entire pending queue. A locally admissible input sequence still has to satisfy that driver precondition to represent an execution of the declared scheduler profile.

### Generated examples

| Stem | Parameters | Demonstration |
|---|---|---|
| `windowTime` | `(4, null, null)` | Sequential time closure and a successor receiving later values |
| `windowTime-overlap` | `(5, 2, 2)` | Periodic overlap with an early size closure |
| `windowTime-gap` | `(2, 4, null)` | Values dropped during a gap between windows |
| `windowTime-cancel` | `(5, null, null)` | Silent orphaning and later independent child disposal |

These four configured histories generate 32 example projections plus one export-level inspection index. They do not add four public exports.

## Verification

| Evidence | What it checks |
|---|---|
| [Model tests](../tests/session22-windowTime-model.test.mjs) | Literal action order, legal and illegal time/timer/observer events, state invariants, payload identity, pure updates and finite witnesses for all 14 retained periodic-profile rules |
| [Independent native tests](../tests/session22-windowTime-rxjs.test.mjs) | Actual RxJS notifications and source/child lifetimes across sequential, overlap, gaps, count limits, terminals, cancellation, equal-time ordering and cold execution ownership |
| [Differential tests](../tests/session22-windowTime-differential.test.mjs) | Native-first execution, then exact model comparison of ordered notifications, schedules/cancellations and source/child acquisition/release |
| [Strict TypeScript assertions](../tests/types/session22-windowTime.ts) | Sixteen intentionally invalid calls/events/states rejected by the compiler |

The focused suite contributes **20 model tests, 18 native tests and one differential test**. The differential test performs **432 finite comparison executions**: six parameter sets × four source schedules × three endings × three child-consumer counts × two command-enqueue orders. The parameters cover sequential time windows, sequential size restart, periodic overlap with and without size limits, equal interval/span, and gaps. Schedules include no source values, `undefined`, `null`, opaque object identity, and equal-time arrivals.

The adapter executes RxJS before constructing a model trace. Actual emitted handles determine window identities, actual scheduler callbacks determine timer inputs, and native subscription state controls consumer cleanup. A supplied scheduler records requests through real RxJS Subscription objects and normalizes the recurring task to one logical resource. Every measured execution is also run with an ordinary TestScheduler, and their notifications and connection lifetimes must match. These second runs establish observation transparency; they are not counted as another 432 model/native comparisons.

The adapter observes current and historical handles after the outer has completed, failed or been cancelled, then independently closes orphaned consumers. The generated trace is a prediction from the canonical model; it is never used to decide which native input should occur.

### Source basis and limits

The pinned [implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/windowTime.ts), [upstream spec bodies](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/windowTime-spec.ts), [executeSchedule](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/executeSchedule.ts) and ownership machinery were inspected. The upstream suite itself was not executed.

Canonical setup is non-notifying and non-reentrant; source subscription and timer scheduling do not advance supplied time synchronously. Consumers attach between reactions. Native tests separately characterize synchronous source setup, synchronous outer `take(1)` disposal, Observable-wrapper exposure, and zero maxSize normalization. These tests do not enlarge the canonical profile.

Zero/negative/fractional/non-finite durations, arbitrary reentrancy, scheduler exceptions, throwing teardown, Subject mutation, physical scheduler Action allocation and overflow are excluded. Native differential runs use punctual TestScheduler delivery; delayed firing is guarded and witnessed in model tests, without claiming exhaustive runtime coverage of every scheduler. Finite executions can collapse to the same history. Rule witnesses are not a universal guard-totality proof, and no unrestricted equivalence or infinite-trace liveness theorem is claimed.
