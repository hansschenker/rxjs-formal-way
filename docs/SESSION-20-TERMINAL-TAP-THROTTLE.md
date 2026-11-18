# Session 20: completion, observation and throttle policies

**Original session:** 17 November 2026, Europe/Zurich. **Pinned RxJS:** 7.8.2, source revision [e5351d02e225e275ac0e497c7b66eaa5f0c88791](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). This batch contains exactly five exported operator names: `takeLast`, `tap`, `throttle`, `throttleTime`, and `throwIfEmpty`. Fourteen configurations describe their declared profiles; they do not count as fourteen exports. Executed checks, tested commits and acceptance belong in the [evidence ledger](../evidence/SESSION-20.md).

## Intuition

An Observable describes values and terminal events moving over time. Constructing these pipelines acquires no producer. A result subscription creates its own memory and applies the configured connection policy. These five operators make different decisions about what passes through that connection:

| Operator | What flows and when | Why this policy is useful |
|---|---|---|
| `takeLast(k)` | Retain the newest `k` source values. Successful completion releases that suffix in arrival order. | The final values become knowable only when the source completes. |
| `tap(hooks)` | A configured hook observes a notification before the original notification continues. A hook failure becomes an error. | Observe values and lifecycle without defining a value transformation. |
| `throttle(selector, flags)` | An admitted source value starts a duration Observable. While it is active, remember the latest source value; flags decide leading and trailing delivery. | A separate stream determines when another delivery is allowed. |
| `throttleTime(d, scheduler, flags)` | Apply the same leading/trailing policy with duration notifications supplied by a scheduled timer. | Use scheduler time to define the delivery intervals. |
| `throwIfEmpty(factory)` | Forward each value. If successful completion arrives before any value, obtain an error from the factory. | Distinguish an empty successful source from one that supplied a value. |

Payloads remain opaque references. Only supplied hooks, the duration selector and the error factory interpret domain information. A duration notification carries a control signal: its payload never becomes an output value. None of these operators introduces sharing or replay. A supplied source or duration may already be shared, but each result subscription still owns independent bookkeeping. These claims are implemented in the [terminal models](../src/models/session20-terminal.ts), [tap model](../src/models/session20-tap.ts), and [throttle models](../src/models/session20-throttle.ts).

### Cω-style value shapes

The notation follows the project's [Cω-inspired convention](../README.md): `V*` describes a sequence of values of type `V`; configuration is written separately as `Cω(...)`. These are qualified value-count shapes, not complete notification protocols or native TypeScript types. In particular, an error is not a `next` value, and `V≤k` is the project's bounded-cardinality notation.

| Operator | Configured shape | Qualification |
|---|---|---|
| `takeLast` | `Cω(Count) → V* → V≤max(0,Count)` | For a positive count and a finite successfully completed source with `n` values, emit exactly `min(n,Count)`. Error or cancellation emits no retained suffix. |
| `tap` | `Cω(ObserverHooks) → V* → V*` | Successful notification hooks preserve original notification order and payload identity. A throwing hook can end the output early. |
| `throttle` | `Cω(DurationSignal,Leading,Trailing) → V* → V*` | Output values are selected source values. Neither flag enabled means zero output `next` notifications. |
| `throttleTime` | `Cω(Duration,Scheduler,Leading,Trailing) → V* → V*` | The throttle policy is unchanged; timer delivery supplies the duration-ending event. |
| `throwIfEmpty` | `Cω(() → unknown) → V* → V*` | Every observed source value passes through. Empty successful completion changes the terminal channel to error; even `undefined` can be that error payload. |

## Specification: the shared contract

Each canonical machine is **`M = (S, S₀, Z, A, T, G)`**. `S` is the full typed state, including memory; `S₀` is its initial state; `Z` is the external event alphabet; `A` is the action alphabet; `T` selects the next state; and `G` produces an **ordered action word** in `A*`. `T` and `G` are defined only for state/event pairs accepted by exactly one named guard. Control labels such as `Waiting` are projections of `S`, not elements of `Z`. Illegal events, stale callback outcomes and stale duration generations are rejected by the model runner. See [the common definitions](../src/models/session20-common.ts) and [formal method](FORMAL-METHOD.md).

The canonical model predicts actions; it never executes a subscription, hook or scheduler. A callback request and its correlated return/throw are separate microsteps describing one synchronous reaction. The outcome must be supplied at the same logical time as invocation, with no intervening source event or cancellation. For `tap` and `throwIfEmpty`, this timing requirement is a **caller precondition**: generic `runTrace` does not enforce equality of the two trace-envelope times. Their native comparison harness supplies same-time outcomes. Signal `throttle` checks the selector outcome's `now` against invocation time; `runThrottleTrace` also checks event time against trace-envelope time.

All profiles use atomic, nonreentrant reactions. The stated source-teardown ordering assumes source setup has returned. Downstream cancellation can occur between external reactions. Cancellation during an atomic multi-action delivery, throwing producer/observer teardown and arbitrary reentrancy are outside this model. Native characterization tests can describe such cases without extending the model's scope.

### `takeLast`: keep a suffix until successful completion

The profile accepts safe integer counts from **−8 through 8**. Nonpositive counts choose the empty-result branch and do not acquire the source. The pinned [implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/takeLast.ts) retains a FIFO, shifts the oldest value when necessary, and flushes only in its completion handler.

| Component | Scoped definition |
|---|---|
| `S` | `Unsubscribed`; for positive counts, `Collecting(buffer: readonly V[])`, with `0 ≤ buffer.length ≤ count`; `Closed(reason)`, where reason is complete, error or cancel. Nonpositive profiles omit unreachable collection rules. |
| `S₀` | `Unsubscribed`, no source resource and no buffer. |
| `Z` | Result `subscribe`/`cancel`; source `next(value)`, `complete`, `error(error)`, admissible only in their declared lifecycle states. |
| `A` | Acquire/release source; downstream `next`, `complete`, `error`. No callback or timer actions. |
| `T` | Subscription starts collection or closes the nonpositive branch. A value appends to the FIFO, removing its oldest reference when full. Completion, failure and cancellation close and discard memory. |
| `G` | Positive subscription acquires source. Value events emit nothing. Successful completion emits the FIFO, then complete, then source release. Failure emits its original error then releases source. Cancellation only releases source. Nonpositive subscription only completes. |

For `A@1, B@2, C@4, complete@6`, `takeLast(2)` produces `B@6, C@6, complete@6`. Time comes from source completion; the count is not a duration. A source that never completes does not establish a final suffix. Payload references are retained without cloning. The model treats the flush as one action word; the native `takeLast(3), take(1)` test separately demonstrates downstream cancellation during synchronous delivery.

### `tap`: observe before forwarding

The profile selects a subset of `subscribe`, `next`, `error`, `complete`, `unsubscribe`, and `finalize`. Generated profiles use all six hooks or only `next`. Notification hooks may return or throw. Lifecycle hooks are explicitly nonthrowing in this scope. The pinned [tap implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/tap.ts) and [OperatorSubscriber cleanup](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) explain the different terminal and cancellation paths.

| Component | Scoped definition |
|---|---|
| `S` | `Unsubscribed`; `Listening(invocation)`; `Calling(invocation, hook, pendingNotification)`; `Closed(reason)`. `Calling` exists only when a notification hook is configured. Invocation indices are nonnegative safe integers. |
| `S₀` | `Unsubscribed`, with no callback request or source resource. |
| `Z` | Result subscription/cancellation; source notifications; correlated `callback.return(resource)` and `callback.throw(resource,error)` for the currently pending notification hook. |
| `A` | Source acquisition/release; callback requests; downstream notifications. Hook identities and invocation generations correlate outcomes and are not subscription handles. |
| `T` | Subscription enters `Listening(0)`. A configured notification hook enters `Calling` and retains the original notification. A successful next-hook outcome returns to `Listening` with an incremented index. Terminal outcomes and any notification-hook throw close the execution. Missing hooks bypass `Calling`. |
| `G` | Invoke `subscribe` before source acquisition. Invoke a configured notification hook before forwarding the retained notification. Ignore its return value. On throw, send the exact thrown value as error instead of the pending notification. Release source and invoke configured lifecycle hooks according to the table below. |

| Termination path | Ordered actions after any notification-hook invocation |
|---|---|
| Source complete; complete hook succeeds or is absent | Downstream complete; source release; `finalize`. |
| Source error; error hook succeeds or is absent | Original downstream error; source release; `finalize`. |
| Next hook throws | Thrown downstream error; source release; `unsubscribe`; `finalize`. |
| Error or complete hook throws | Thrown downstream error; source release; `finalize`. |
| Consumer cancels between notifications | Source release; `unsubscribe`; `finalize`; no downstream terminal. |

Only configured lifecycle hooks appear in those action words. The terminal handlers clear the implementation's unsubscription flag before calling the user hook, so even a throwing error/complete hook does not run the `unsubscribe` hook. `finalize` runs after source teardown for the acquired-source paths in scope.

`tap` introduces no clock or rescheduling. Returning a replacement value from `next` does not transform the output. Preserving reference identity does not promise a deep immutable snapshot: a user hook can mutate a referenced object, and that mutation is not simulated here. The native no-handler `tap()` identity test characterizes the public API; the canonical abstraction specifies notifications and resource actions rather than object identity of the returned Observable.

### `throttle`: a duration stream controls the gate

The profile accepts a synchronous selector returning a valid Observable description, represented by a nonempty token. Each invocation/subscription has a new generation even when the returned token is reused. The pinned [implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throttle.ts) distinguishes duration `next` from duration `complete`, and starts another duration after a trailing emission while the source remains live.

Let `memory = (clock, nextGeneration, hasValue, value)`. `hasValue` is a separate presence bit, so real `null` and `undefined` values are not mistaken for missing values. All supplied times and generation counters are nonnegative safe integers. Every accepted event has nondecreasing `now`.

| Component | Scoped definition |
|---|---|
| `S` | `Unsubscribed`; `Open(memory)`; `Selecting(memory,generation,argument)`; `Throttled(memory,generation,token,due=null)`; when trailing is enabled, `Waiting` with the same gate memory; `Closed(clock,reason)`. An active generation is `nextGeneration − 1`; waiting requires a pending value. |
| `S₀` | `Unsubscribed`, with no source or duration. Subscription initializes clock, generation zero and absent pending value. |
| `Z` | Timed result lifecycle and source notifications; same-time selector return/throw; current-generation duration `next`, `complete` or `error`. Duration payload is irrelevant. |
| `A` | Acquire/release source or duration; invoke selector; notify downstream. No timer action or internal advancement of time. |
| `T` | The guarded policy table below: `Open` begins selection, `Selecting` resolves acquisition, busy nexts replace memory, duration events reopen/restart, and source completion either closes or enters `Waiting`. |
| `G` | Apply leading/trailing flags, invoke selector with the value that starts a duration, acquire that duration, and order release/notification/restart as specified below. Errors preserve identity; cancellation releases only resources still owned. |

### `throttleTime`: the same gate with scheduled duration events

The timed profile accepts integer duration **1 through 1000** and a deferred FIFO virtual scheduler. RxJS itself defaults to `asyncScheduler`; this verification profile deliberately uses controlled scheduler delivery. Pinned [throttleTime](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throttleTime.ts) constructs [a timer](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/timer.ts) and delegates to `throttle`.

| Component | Scoped definition |
|---|---|
| `S` | `Unsubscribed`; `Open(memory)`; `Throttled(memory,generation,due,token=null)`; when trailing is enabled, `Waiting` with the same timer memory; `Closed(clock,reason)`. There is no `Selecting` state. The positive-duration deadline is a safe integer. |
| `S₀` | `Unsubscribed`, with no source or scheduled action. Subscription initializes empty memory and next generation zero. |
| `Z` | Timed result lifecycle/source notifications and `timer.fire(now,resource)` for the current generation at or after its deadline. Selector and signal-duration events are not legal in this profile. |
| `A` | Acquire/release source; schedule/cancel the current timer; downstream notifications. No user callback. |
| `T` | Use the same policy table, replacing duration selection with immediate transition to `Throttled`, and duration next with a valid timer fire. Each new gate sets `due = now + duration`. |
| `G` | Schedule the generation after a configured leading or trailing delivery, or after the first suppressed value when leading is false. Ending/cancelling a gate releases its timer action. Completion/error/cancellation follows the shared policy. |

A deadline is not an event. If a timer due at 15 is delivered at 20, output occurs at 20; a restarted four-unit duration is due at 24. No model step occurs merely because a deadline exists. Equal-time order comes from the supplied scheduler/event order. The model checks current generation, nondecreasing time, `now ≥ due`, and agreement between event `now` and the trace-envelope time.

### The four flag profiles

Both operators default to **leading=true, trailing=false**. For a source `A@1, B@2, complete@3`, suppose the first duration's next/timer fire occurs at 5. The two values belong to the same active duration.

| Leading | Trailing | Generated suffix | Output in this history |
|---|---|---|---|
| true | false | Base profile | `A@1`, complete at 3. |
| true | true | `-leading-trailing` | `A@1`, `B@5`, complete at 5. |
| false | true | `-trailing` | `B@5`, complete at 5. |
| false | false | `-silent` | Complete at 3; no next values. |

The silent profile still connects to the source and starts durations when values arrive. Busy values never restart a duration or postpone its deadline. With both flags enabled, a lone leading value is not emitted again at the trailing edge: its presence bit was cleared by the leading delivery.

### Guarded throttle transition and action policy

Here “end” means current duration **next** for `throttle`, or valid current **timer fire** for `throttleTime`. “Start duration” means invoke/resolve the selector in the signal profile, or schedule the next timer generation in the timed profile.

| State and event | Guard / next state (`T`) | Ordered policy (`G`) |
|---|---|---|
| Unsubscribed + subscribe | Open, absent pending value | Acquire source; create no duration yet. |
| Open + source next | Begin new generation | If leading, clear presence and emit incoming value; otherwise remember it. Start duration from that value. |
| Selecting + matching return | Throttled with returned token | Acquire current duration. |
| Selecting + matching throw | Closed error | Emit exact selector error; release source. A leading value may already have been delivered. |
| Throttled + source next | Same gate; newest value pending | Replace the pending reference; no output, selector call or timer restart. |
| Throttled + end | Trailing and pending: begin new generation | Release old duration; clear presence; emit latest; start fresh duration from the emitted value. |
| Throttled + end | No pending value, or trailing disabled: Open | Release old duration; emit nothing. Unemitted internal memory may remain until replaced. |
| Throttled + duration complete | Signal profile only: Open | Release duration; do not flush the pending value. Internal presence/reference is retained. |
| Open + source complete | Closed complete | Complete; release source; discard any retained memory. |
| Throttled + source complete | Trailing, pending and active gate: Waiting | Release the completed source; retain pending value and current duration. |
| Throttled + source complete | Otherwise: Closed complete | Complete immediately; release source and duration. |
| Waiting + end | Closed complete | Release duration; emit pending value; complete. Do not restart. |
| Waiting + duration complete | Signal profile only: Closed complete | Complete without a trailing value; then release duration. |
| Live source + source error | Closed error | Emit original error; release source and any duration; discard pending value. |
| Active duration + duration error | Signal profile: Closed error | Emit exact duration error; release source if still live, then duration. |
| Open, Throttled or Waiting + cancel | Closed cancel | Release only currently owned resources; discard memory; no downstream notification. |

Duration completion is therefore not a synonym for the end event. While source is live, an empty completed duration reopens the gate without flushing; a later source next replaces retained memory. If source completes while the gate is already open, that memory is discarded. During completion waiting, a duration next releases its subscription **before** trailing delivery, whereas an empty duration completion notifies result completion **before** that duration's final teardown. The native tests assert both action orders.

### `throwIfEmpty`: presence decides the terminal channel

The factory binding is either the pinned default `EmptyError` factory or a custom synchronous function. The pinned [operator](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/throwIfEmpty.ts) sets its presence bit before forwarding each value and calls the factory only at empty completion.

| Component | Scoped definition |
|---|---|
| `S` | `Unsubscribed`; `Listening(hasValue:boolean)`; `CreatingError`; `Closed(reason)`. |
| `S₀` | `Unsubscribed`, no source or factory invocation. |
| `Z` | Result lifecycle/source notifications; correlated factory return, and custom-factory throw, for `errorFactory` generation zero. |
| `A` | Source acquisition/release; one factory invocation request; downstream notifications. No timer. |
| `T` | Subscription enters `Listening(false)`. Any next sets presence true. Nonempty completion closes normally; empty completion enters `CreatingError`; a matching factory outcome closes with error. Source failure and cancellation close directly. |
| `G` | Forward exact next values. Nonempty completion emits complete then releases source. Empty completion requests the factory once; its returned or thrown value becomes the exact error payload, followed by source release. Source failure preserves its error; cancellation is silent. Neither invokes the factory. |

`undefined` and `null` each count as a value. A custom factory returning `undefined` produces `error(undefined)`, not completion. The model does not instantiate or prove the prototype of `EmptyError`: a default-factory outcome is assumed to be the valid pinned constructor result. Independent native tests check an actual fresh `EmptyError` for each empty subscription. The default generated trace uses a nonempty source; the custom generated trace demonstrates empty completion and factory return. A silent source supplies no completion time, so the factory is never called merely because no value has arrived yet.

## Ownership, safety and conditional progress

| Owned item | Acquisition and release obligation |
|---|---|
| Source subscription | Acquired once on result connection, except nonpositive `takeLast`. Released on source/result termination; throttle waiting has already released it. |
| FIFO or pending value | Local to one result subscription. Error/cancellation clears it without producing a final value. Payload objects themselves are not cloned. |
| Duration subscription | At most one acquired signal duration per result at a time. Release old generation before starting the next; waiting retains only this duration and one pending value. |
| Timer action | At most one active scheduled generation. Release it on end/error/cancellation; a stale generation cannot produce output. |
| Callback request | Correlated invocation identity, not a resource that owns producer work. Only the pending outcome can advance the reaction. |

Closed executions cannot acquire resources or accept more modeled notifications. Cancellation does not emit complete/error and never flushes memory. An unsubscribe action requests teardown of the owned connection; it does not prove that every external side effect physically stops.

Progress claims are conditional on input events. Positive `takeLast` flushes when the source successfully completes. `throwIfEmpty` decides emptiness only on completion. A pending trailing throttle result finishes when its active duration supplies a terminating signal; a duration that remains silent can keep it waiting. Timed progress additionally requires the scheduler to deliver its scheduled event. These are finite-profile safety and conditional-progress claims, not universal liveness proofs.

## Verification and limits

The [scenario map](SESSION-20-SCENARIOS.md) connects rules, source/spec inspection, and independent observations. The checked-in verification design comprises **56 model tests**, **47 native RxJS tests**, **3 bounded differential tests**, **2 artifact integration tests**, and **23 negative TypeScript assertions**. That is **108 new runtime tests**; compiler assertions are counted separately. The differential tests perform **198 + 720 + 144 = 1,062 comparison executions**; their parameter combinations are not a claim of 1,062 distinct legal histories. Each generated BDD, STT, diagram, obligation list, manifest, JSON trace, four-lane trace and behavior page is a projection of a canonical model, not an independent runtime oracle.

The 14 configured profiles produce 112 profile artifacts and five export-level indexes, **117 Session 20 projection files**. Begin with [takeLast](../operators/takeLast-index.md), [tap](../operators/tap-index.md), [throttle](../operators/throttle-index.md), [throttleTime](../operators/throttleTime-index.md), or [throwIfEmpty](../operators/throwIfEmpty-index.md). The evidence ledger records which revisions actually passed regeneration, type, syntax and runtime checks.

Additional scope limits are explicit: counts outside −8..8; noninteger/nonfinite counts; zero/negative/fractional throttle durations in the canonical timed model; synchronous `queueScheduler`; scheduler exceptions and platform precision; Promise/Iterable or invalid selector-result conversion; synchronous source/duration delivery during acquisition; throwing `tap` lifecycle hooks; deprecated positional `tap` parsing and receiver binding; and arbitrary reentrancy. Native tests of zero deferred duration, synchronous acquisition and mid-flush cancellation are characterization evidence for those named cases only. Pinned upstream operator/spec bodies were inspected; the upstream RxJS suite is not claimed to have been executed.
