# Session 21: timeout and timeoutWith

**RxJS:** 7.8.2, pinned revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). These are two exported names with one shared guarded watchdog kernel. The [canonical model](../src/models/session21-timeout.ts) describes scoped behavior; the [Session 21 evidence ledger](../evidence/SESSION-21.md) records actual execution and acceptance.

## Intuition: a deadline watches the original connection

Source values flow unchanged while their connection remains active. A watchdog waits for a value. When a value arrives, its current watchdog is cancelled before that value continues downstream. A configured `each` duration starts another watchdog after delivery. If a watchdog actually fires first, the original source is closed before an error is produced or a replacement Observable is connected.

| Configuration | What happens on a new source value | What the timeout watches |
|---|---|---|
| `first: duration` | First value removes the initial watchdog; later values pass without restarting it. | Time from connection until the first value. |
| `first: Date` | First value removes the absolute initial deadline. | Arrival of the first value before a scheduler-clock date. |
| `each: duration` | Every value cancels the current watchdog and starts a fresh one. | Initial silence and each later gap. |
| `first` and `each` | First config controls initialization; each config controls all gaps after values. | A possibly different first allowance and subsequent allowance. |
| `with: factory` | The factory remains uncalled while source values are timely. | On expiry, the factory supplies the replacement description or throws. |

Time is supplied by a scheduler. A deadline alone produces no action: a timer notification must be delivered. Equal-time ordering matters, and a source value can win if the timer is delivered late. Once the replacement is connected, it has **no further timeout watchdog from this operator**. It can emit, complete, error or remain silent for longer than the original duration. These policies follow [timeout.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/timeout.ts) and [executeSchedule.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/util/executeSchedule.ts).

`timeoutWith(number, replacement)` uses the number as `each`. `timeoutWith(Date, replacement)` uses the date as `first` only. The [deprecated alias implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/timeoutWith.ts) delegates to timeout with a closure returning the configured replacement. The same Observable object can be acquired separately by multiple result subscriptions. Capturing that object does not introduce sharing or replay.

### Qualified Cω shapes

| Export | Shape | Qualification |
|---|---|---|
| timeout | `Cω(First,Each,Scheduler,With,Meta) → T* → (T ∪ R)*` | A prefix of source values can be followed by replacement values. The default binding fails instead of producing replacement values. |
| timeoutWith | `Cω(Due,Replacement,Scheduler) → T* → (T ∪ R)*` | Numeric and date due configurations select different watchdog initialization/reset policies. |

The notation counts values, not terminals. It does not promise a timeout, a value, or eventual completion. A source may complete before expiry; a satisfied first-only source or a connected replacement may remain silent forever.

## Specification: explicit six-tuples

`M = (S,S₀,Z,A,T,G)` uses one guarded reaction to compute next state and the ordered action word. The model executes no producer, scheduler, Date constructor or user function. Callback outcomes are external input data with matching invocation identity. State phases are not input events.

### timeout

| Component | Scoped definition |
|---|---|
| `S` | `Unsubscribed`; `Source(clock,seen,lastValue,nextGeneration,timer)`; `Choosing(clock,seen)`; for a custom replacement binding, `Fallback(clock,token)`; `Closed(clock,reason)`. A timer is absent or `{generation,due}`. |
| `S₀` | `Unsubscribed`: no resource acquired and no clock read performed by the model. |
| `Z` | Supplied-time result subscribe/cancel; source next/error/complete; current watchdog fire; same-time matching factory return/throw; current replacement next/error/complete. Default-factory profiles admit throw only, not return to a replacement. |
| `A` | Source/replacement acquire and release; watchdog schedule/cancel; factory invocation request; downstream next/error/complete. Values and errors are opaque references. |
| `T` | Initialize Source and its first timer; on next increment seen and update retained value; reset timer if each is configured, otherwise remain unarmed. Expiry drops source memory and enters Choosing. A successful custom factory outcome enters Fallback; throw or final notification closes. |
| `G` | Acquire source before initial scheduling. On next cancel old timer, forward original value, then optionally schedule each. On expiry release source, cancel timer through source finalization, invoke factory. Return acquires replacement; throw errors. Source/fallback terminals notify before their resource cleanup; cancellation silently releases the currently owned connection. |

### timeoutWith

| Component | Scoped definition |
|---|---|
| `S` | The same Source/clock/counter/timer state and Fallback/Closed states, with a fixed replacement token. There is no Choosing state or user factory outcome. |
| `S₀` | `Unsubscribed`, with a captured replacement description but no active source, timer or replacement subscription. |
| `Z` | Supplied-time subscribe/cancel; source notifications; current watchdog fire; current replacement notifications. Numeric due maps to each; absolute due maps to first only. |
| `A` | Source/replacement acquire and release, watchdog schedule/cancel, downstream notifications. No user callback action. |
| `T` | Reuse the timeout watchdog transitions. Expiry goes directly from Source to Fallback, retaining the configured replacement token. |
| `G` | Apply the same timer and source policies, then acquire the configured replacement after source/timer cleanup. Replacement lifetime and final cleanup use the same shared rules. |

The alias does not maintain a second competing timeout specification: `createTimeoutWithModel` supplies constant-binding parameters to the same internal policy constructor. Separate metadata and `S21-TIMEOUTWITH-*` rule IDs preserve its exported-name provenance.

### Initial timing and state legality

Relative `first` and `each` are safe integers **1 through 1000**. An absolute first date is represented as `{at: number}`, a positive safe integer **strictly greater than the supplied subscription time**. The initial delay is `at − now`. Due-now and expired dates are excluded; the model does not silently clamp them or assume all schedulers handle them alike. All event times are nonnegative safe integers and nondecreasing.

Source setup must be nonemitting and must not advance the supplied clock. This makes the modeled subscribe action word—source acquisition followed by initial scheduling—an explicit post-setup profile. The actual implementation subscribes first, then decides whether its initial timer is still needed. Synchronous acquisition is separately characterized natively, rather than folded into an atomic acquisition step.

Every source value increments `seen`. `nextGeneration` is `seen + 1` when each is configured, otherwise 1. The active timer is the most recently allocated generation and its deadline exceeds the stored Source clock; a source with no values cannot be unarmed. A satisfied first-only profile must remain unarmed, while each profiles must remain armed. Presence is independent of payload: undefined and null are ordinary source values.

The current timer may fire at or after its deadline, but an old generation or early fire is rejected. A factory outcome must match generation zero and occur at exactly its invocation time; intervening cancellation or source events while Choosing are illegal in the synchronous profile. `runTimeoutTrace` additionally verifies that each event's `now` equals its trace-envelope time. A closed execution accepts no more model events.

### Guarded state/action policy

| State and input | Next state | Ordered action policy |
|---|---|---|
| Unsubscribed + connect | Source with seen 0 and timer 0 | Acquire source; schedule first if configured, otherwise each. |
| Source + next, watchdog armed | Source with advanced seen | Cancel current timer; forward exact value; schedule each if configured. |
| Source + next, first-only already satisfied | Source without timer | Forward exact value; do not create another watchdog. |
| Source + complete/error | Closed | Forward terminal; release source; cancel any remaining timer. Factory remains uncalled. |
| Source + cancel | Closed | Release source and timer; emit no terminal and acquire no fallback. |
| Source + valid watchdog fire | Choosing, or direct Fallback for timeoutWith | Release source; cancel timer; invoke factory or acquire fixed replacement. |
| Choosing + return | Fallback | Acquire returned Observable token; create no watchdog. |
| Choosing + throw | Closed | Forward exact thrown error; resources were already released. |
| Fallback + next | Fallback | Forward replacement value; do not schedule. |
| Fallback + complete/error | Closed | Forward replacement terminal; release replacement. |
| Fallback + cancel | Closed | Release replacement silently; do not release original source twice. |

### The RxJS 7.8.2 factory-info detail

At expiry the implementation first unsubscribes the original source. [OperatorSubscriber](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/OperatorSubscriber.ts) runs source teardown before the additional finalizer; the timeout finalizer cancels the watchdog and clears its retained value. **The factory therefore receives `{meta, seen, lastValue: null}` in this pinned implementation, even after source values have arrived.** This is an observed implementation fact, not an inference from the `TimeoutInfo.lastValue` name. Native tests assert the order, preserved metadata identity, count and null value.

The default factory throws a freshly constructed native TimeoutError carrying that information. The canonical default binding receives the corresponding opaque throw outcome; it neither constructs nor validates an Error prototype. Native tests check actual TimeoutError instances, fresh identity across connections and their info. Generated default examples complete normally, so they do not substitute a serialized token for a native default error.

## Verification: independent observations and rule witnesses

The [model tests](../tests/session21-timeout-model.test.mjs) contain **29 named tests**. Six small breadth-first searches find a legal prefix for every retained rule in the six generated configurations. They explore state prefixes at depth at most 6 and enqueue source states only while seen is at most 2; outgoing edges from a boundary state are still inspected. This establishes finite rule witnesses, not every possible state or universal guard totality. Rule obligation IDs map to these configured reachability tests, not to literal native test titles.

The [native file](../tests/session21-timeout-rxjs.test.mjs) contains **24 named tests** with literal expectations and imports no canonical model. The [differential file](../tests/session21-timeout-differential.test.mjs) contains two named tests. It records actual RxJS actions and accepted external events, then replays those events through the model. Runtime decisions are never selected by model output. The [type file](../tests/types/session21-timeout.ts) contains **16 negative TypeScript assertions**, counted separately from runtime tests. Passing execution and exact revisions belong in the ledger.

| Rule/scenario group | Named test entry point |
|---|---|
| Source acquisition and initial expiry | `S21 RX timeout: source acquisition precedes initial watchdog and missing first value switches after source teardown` |
| each reset and value identity | `S21 RX timeout: each cancels before value delivery and resets from every source value` |
| first-only, combined and Date timing | Native tests beginning `first-only deadline disappears`, `first overrides initial each`, and `absolute Date uses scheduler time` |
| Expiry info and cleanup order | `S21 RX timeout: factory info preserves meta and seen but lastValue is null after source finalization` |
| Default factory construction | `S21 RX timeout: default TimeoutError is fresh and its actual info reflects cleanup ordering` |
| Factory throw and replacement lifetime | Native tests beginning `throwing factory preserves exact error`, `replacement can remain silent`, and `replacement failure retains identity` |
| Source complete/error/cancel | `S21 RX timeout: source {C,E,X} bypasses factory and releases watchdog` |
| Numeric/date alias and repeated acquisitions | Native `timeoutWith` tests for number/Date handoff, Date-versus-number reset policy, and captured fallback acquisition per result subscription |
| Current generation, clock and callback legality | Model tests beginning `guards reject stale/early timers` and `default binding cannot return a fallback` |
| Every retained rule | `S21 TIMEOUT REACHABILITY {profile}: every retained rule has a legal prefix` |

**Bounded comparison counts:** 432 custom-factory timeout executions = 6 first/each configurations × 6 source words × 3 original endings × 4 replacement/factory outcomes. The 216 timeoutWith executions = 4 numeric/date due configurations × 6 words × 3 endings × 3 replacement outcomes. Total **648 comparison executions**, not 648 distinct histories or exhaustive traces. Subscription starts at frame 2; a final cancellation at frame 24 bounds silent cases. Native closed-source commands are ignored rather than passed as illegal model events.

Every instrumented scheduler run is also compared with an ordinary uninstrumented TestScheduler run for downstream output equality. Those second runs check observation transparency; they are not an additional 648 model/native comparisons. Default-factory prototype behavior is covered by dedicated native tests rather than a fabricated instrumented default-factory callback.

## Generated configurations and remaining scope

| Profile stem | Configuration / example |
|---|---|
| `timeout` | each 4, default factory; two timely values and successful completion. |
| `timeout-first` | first 4, default factory; first value removes deadline, later distant value still passes. |
| `timeout-first-each` | first 6, each 3, custom factory; value at 1, watchdog at 4, replacement handoff. |
| `timeout-absolute-fallback` | absolute first at 5, custom factory; connection at 2, expiry at 5. |
| `timeoutWith` | numeric due 4 and constant replacement; source value at 1 resets expiry to 5. |
| `timeoutWith-date` | absolute first at 5 and constant replacement; expiry switches directly. |

Start with [timeout inspection](../operators/timeout-index.md) or [timeoutWith inspection](../operators/timeoutWith-index.md). Generated traces predict the canonical model; they are not substitutes for native evidence. These six configurations remain exactly two exported operator names.

Pinned upstream [timeout specs](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/timeout-spec.ts) and [timeoutWith specs](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/timeoutWith-spec.ts) were inspected. They cover first/each/date policies, fallback acquisition intervals, cancellation and synchronous source behavior. Their suite was not executed here. Local native tests separately characterize synchronous first-value setup, synchronous downstream cancellation, zero each and construction-time errors; those named cases do not enlarge the canonical profile.

Excluded are nonpositive/fractional/nonfinite relative delays, due-now/past dates, synchronous queueScheduler, source/fallback notifications during acquisition, clock-advancing setup, throwing teardown/schedulers, Promise/Iterable fallback conversion, invalid fallback results and arbitrary reentrancy. Producer/source descriptions may themselves be live or shared, while watchdog state is local to each result connection. Unsubscribe requests release of that connection; it does not prove physical cancellation of every external operation. Progress depends on sources and scheduler delivery, and finite checks do not prove unrestricted equivalence or universal liveness.
