# Session 9 — Source-first latest joins, serial concatenation, constant-inner queues

**6 November 2026 · Europe/Zurich · RxJS 7.8.2**, pinned source revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`.

One batch of five distinct exports: `combineLatest`, `combineLatestWith`, `concat`, `concatMapTo`, `concatWith`. The names `combineLatest` and `concat` here mean the **deprecated pipeable exports**, not the creation functions. The corresponding With operators delegate to their older counterparts within the declared no-projector/unscheduled profiles. Each is independently tracked as an export. Reusing `concatMap` mechanics does not re-accept or count `concatMap` as new work.

## Intuition → specification → verification

An Observable describes a flow of values and lifecycle notifications. Subscription starts the operator execution. These five operators specify connection policies; none introduces sharing or its own clock.

| Operator | What flows over time | What new values cause | Why this policy exists |
|---|---|---|---|
| `combineLatest` | Piped source first plus supplied sources | Remember that source's latest value; once every source has supplied a value, emit a fresh tuple | Expose a current multi-source snapshot |
| `combineLatestWith` | Same stream protocol as pipeable `combineLatest` within this profile | Same | Nondeprecated pipeable name |
| `concat` | Piped source, then supplied sources in argument order | Forward values from the one currently subscribed source | Defer later subscriptions until earlier completion |
| `concatMapTo` | A new subscription occurrence to one configured inner Observable for each outer value | Queue while busy; subscribe when admitted; forward inner values | Sequential repetition without using outer payloads in a projection |
| `concatWith` | Same stream protocol as pipeable `concat` within this profile | Same | Nondeprecated pipeable name |

## Six-tuple convention

Every canonical model uses **M = (S, S₀, Z, A, T, G)**. **Z is the input-event alphabet**, not a list of control states. The finite control labels are a projection of **S**, which also includes remembered values, counters and resource identities.

`T : S × Z → S` determines the next state. `G : S × Z → A*` determines the ordered action word from the same pre-event state and input. A combined reaction computes both once. BDD, STT and diagrams are views of named guarded rules, not separately maintained implementations.

Cω-inspired `T*` below counts zero or more **values**, not terminal/control events. Cardinalities are conditional on the execution remaining active and user functions, where applicable, returning successfully.

### Latest combinations — `combineLatest`, `combineLatestWith`

- **Shape:** `T₀* × T₁* × ... × Tₙ* → (T₀ × T₁ × ... × Tₙ)*`.
- **S:** `Unsubscribed | Active { slots: [{ready, live, value?}], current } | Closed {reason}`. Readiness distinguishes no first value from a genuine `undefined` payload. Controls: Unsubscribed, Active, Closed.
- **S₀:** Unsubscribed.
- **Z:** subscribe; input.next(resource,value); input.complete(resource); input.error(resource,error); cancel.
- **A:** source-indexed subscribe/unsubscribe actions and downstream N(tuple), C, E(original).
- **T/G:** Acquire sources in source-first argument order. A live input updates its slot; emit a fresh array only after all slots are ready. Completion marks its input non-live but retains a supplied last value. Complete downstream only after every live input finishes. An empty completed input prevents readiness without itself forcing early completion of still-live peers. Errors preserve identity and release live inputs; cancellation releases silently.
- **Legality:** Resource generations identify valid source positions. Notifications from completed or unconnected resources are outside the model domain; Closed accepts no further input. Each eligible input.next produces one tuple.
- **Scope:** Valid Observable inputs, no result-selector overload, atomic non-reentrant acquisition, no observer/finalizer throws or cancellation during delivery.

### Sequential concatenations — `concat`, `concatWith`

- **Shape:** `T₀* × ... × Tₙ* → (T₀ + ... + Tₙ)*`; values preserve payload identity.
- **S:** Unsubscribed, Active {current, slots}, or Closed {reason}. While Active, current identifies the sole live input.
- **S₀:** Unsubscribed.
- **Z:** The same source-indexed input notifications and subscribe/cancel lifecycle events as above.
- **A:** Subscribe/unsubscribe an indexed source; notify downstream with its original value, completion or original error.
- **T/G:** Acquire input 0 only. Forward its values. On completion, release it and acquire the next input, if any. Final completion releases the last input and completes downstream. Error and cancellation prevent all future source acquisitions; cancellation sends no terminal notification.
- **Legality:** Future inputs cannot deliver before acquisition. Exactly one input is live in Active. No input is legal after Closed.
- **Scope:** Unscheduled pipeable concat/concatWith, Observable inputs, atomic non-reentrant acquisition; no general ObservableInput conversion, nested setup delivery or throwing observers/finalizers.

### Constant-inner sequential mapper — `concatMapTo`

- **Shape:** A configured inner source `U*` and outer `T*` yield `U*`, with a distinct inner subscription occurrence per admitted outer value. The output count depends on inner emissions, not simply outer count.
- **S:** The previously reviewed concatMap state and FIFO queue, with controls Unsubscribed, Active, Calling, Draining and Closed. Distinct inner occurrence identities bind to one constant source token.
- **S₀:** Unsubscribed.
- **Z:** Outer and identified inner notifications, downstream subscribe/cancel, and the correlated constant-binding return microstep used by the reused model.
- **A:** Outer/inner acquisition and release, constant-binding request, downstream next/error/complete.
- **T/G:** Admit one occurrence at a time; queue later outer values. Resolve the constant binding to the same configured source token, acquire a fresh inner subscription, and forward its values. Inner completion releases the occurrence and admits the next queued occurrence. Outer completion waits for active and queued work. Errors discard queued work; cancellation silently releases owned subscriptions.
- **Legality:** At most one active inner; FIFO admission; only the exact constant token can resolve the binding. No callback.throw transition exists for that constant binding.
- **Scope:** No deprecated result selector or arbitrary reentrancy. Calling/return is a synchronous **model-binding microstep**, not a user projection, timer or asynchronous pause. A configured Observable can itself be hot/shared, but concatMapTo introduces no sharing.

## Time, cancellation and sharing

Time and equal-time order are supplied by sources and scenarios; none of these operators schedules work. Concat policies change **when subscriptions are acquired**, not by installing clocks. Cancellation is a control event, distinct from completion, and releases the resources owned by that execution. Each result subscription has its own latest-value memory or queue unless sharing is explicitly introduced elsewhere.

## Source provenance

The following paths were inspected at the pinned revision in [ReactiveX/rxjs](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791):

- `src/internal/operators/combineLatest.ts`, `combineLatestWith.ts`, and `src/internal/observable/combineLatest.ts`.
- `src/internal/operators/concat.ts`, `concatWith.ts`, and the reused serial-flattening machinery.
- `src/internal/operators/concatMapTo.ts`, `concatMap.ts`, and the existing reviewed `src/models/flatten.ts` in this project.

Canonical models: `src/models/session09-joins.ts`, `src/models/concatMapTo.ts`. Five configurations supply eight deterministic views each: manifest, BDD, STT, state diagram, obligations, JSON trace, four-lane trace and operator page. Traces are **model predictions**, not recordings of actual RxJS.

## Independent runtime witnesses

`tests/session09-model.test.mjs` checks the pure models and views; `tests/session09-rxjs.test.mjs` independently observes RxJS. `tests/types/session09.ts` adds invalid type examples. Rule-obligation identifiers are semantic labels; native test titles use the `S9-NATIVE` prefix. Their mapping is behavioral:

| Rule family / obligation | Native witnesses for the corresponding export |
|---|---|
| Latest initialization | Lazy construction and source-first acquisition |
| Latest wait/emit | First-value barrier, fresh snapshots, retained completed values |
| Latest completion | Empty input and all-input completion cases |
| Latest error/cancel | Error identity, peer teardown, silent cancellation |
| Serial init/next/advance/final | Sequential delayed acquisition and output-order cases |
| Serial error/cancel | No future acquisition after error or cancellation |
| Constant-inner bind/admit/drain | Repeated subscriptions to the same token and queued outer occurrences |
| Constant-inner terminal/cancel | Completion waiting, error propagation and queue disposal |

The successful full suite and exact revisions are recorded in [Session 9 evidence](../evidence/SESSION-09.md). Native synchronous cases also characterize RxJS outside the pure model's atomic-setup event representation; those cases are not a claim that arbitrary reentrancy is modeled. This session adds fixed targeted comparisons, not a new enumerated bounded-search count.

## Formal verification direction

Source-indexed resource actions form a compositional interface for M03. State legality suggests pipeline invariants such as at most one live concat input and no notification after termination. Progress claims require environment assumptions: concatenation cannot advance while its current source never completes. No universal proof or full pipeline model-checking acceptance is claimed by these finite operator tests.
