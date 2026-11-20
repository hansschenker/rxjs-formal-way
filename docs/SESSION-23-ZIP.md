# Session 23 — zip: pair the next unmatched values

**Export:** the deprecated **pipeable `zip` from `rxjs/operators`**, rather than the static creation function named `zip` from `rxjs`. **Pinned runtime:** RxJS 7.8.2, revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). The [shared canonical kernel](../src/models/session23-zip-common.ts) holds the rules; the [zip wrapper and examples](../src/models/session23-zip.ts) bind this export. Acceptance and committed CI belong to the [Session 23 ledger](../evidence/SESSION-23.md).

## Intuition — what moves over time

Each input supplies a sequence of values. `zip` keeps an ordered queue for each input. When every queue contains a value, it removes the oldest value from each and sends one fresh tuple downstream. The first tuple contains the first value of each input, the second tuple contains their second values, and so on. Any input can supply the last missing member and trigger the tuple.

Suppose the upstream source supplies A1 then A2 before either companion has supplied anything. Both values wait. When B1 and C1 arrive, the result sends `[A1, B1, C1]`; A2 remains queued for B2 and C2. Values are never replaced by a more recent value. The operator does not inspect their contents or slow a fast producer automatically.

A completed input may still have useful queued values. Its connection closes immediately, but its queue can contribute to later tuples. The result completes as soon as one completed input's queue is empty. This can happen on the completion notification itself, or immediately after a later arrival consumes the completed input's last value.

| New event | Action policy |
|---|---|
| First result connection | Connect source input zero, then the supplied auxiliary inputs in argument order. |
| Input value; another queue still empty | Remember the value at the end of its queue. |
| Input value; every queue now nonempty | Emit one tuple of the oldest queued values. |
| Input completes with queued values | Close that input connection and retain its queue. |
| Input completes with an empty queue | Complete the result and close remaining input connections. |
| Tuple consumes a completed input's final queued value | Emit that tuple, complete, then close remaining input connections. |
| Any input errors | Forward the same error and close remaining input connections; no queued tuple is flushed. |
| Consumer closes the result connection | Release remaining connections and queued values without a terminal notification. |

Time comes from the input notifications. There is no timer, clock or new scheduler in this policy. Within the admitted post-setup histories, a tuple appears at the arrival that supplies its final missing member. Equal timestamps retain their explicit event order.

Each result connection owns independent queues and input subscriptions. Inputs may themselves be shared producers, but this operator introduces no sharing or replay. Passing the same Observable twice still creates two subscription occurrences. Payload references are retained unchanged inside each new tuple.

## Specification — explicit six-tuple

The scoped Cω shape is:

```text
zip : (U₁*, …, Uₙ*) → T* → (T × U₁ × … × Uₙ)*
```

The upstream source is input zero; `n` auxiliary Observable arguments supply the other inputs. Tuple position is determined by argument position, not arrival order. With zero auxiliaries, each source value becomes a **singleton array**, rather than an unchanged source value. Output cardinality is bounded by the number of values available from the shortest participating input. Completion and failure policies refine this shape.

The pure machine is **M = (S, S₀, Z, A, T, G)**. The same guarded FIFO kernel is used by `zipWith`, whose pinned implementation delegates to this pipeable export. Metadata, rule IDs, native tests and public inspection indexes retain the identity of each export.

| Component | Explicit definition |
|---|---|
| **S** | `Unsubscribed`; `Active(queues, live, received, emitted)`; or `Closed(reason)`, with reason `exhausted`, `error`, or `cancel`. Each input has a FIFO, a connection-liveness bit and a received-value count. `emitted` counts completed output tuples. |
| **S₀** | `Unsubscribed`, with no input connections and no retained payloads. |
| **Z** | `subscribe`, `cancel`, and indexed `input.next(value)`, `input.complete`, `input.error(error)`. Index zero is the upstream source. There are no timer or projector-outcome events in this profile. |
| **A** | Ordered input acquire/release actions and downstream next/error/complete notifications. A next notification contains one new array of unchanged input payloads. |
| **T** | The eight named guarded rules below update FIFO contents, liveness and safe counters, or discard all memory when the result closes. |
| **G** | The same reaction returns the ordered action word: acquire in argument order; emit at most one tuple per input arrival; distinguish retained completion from result exhaustion; preserve exact error identity; release live connections in registration order. |

The model emits descriptions of actions. It never connects a producer or calls a business function. The native adapter supplies actual input notifications and observes actual subscriptions independently.

### Parameters and legal state-dependent behavior

`createZipModel(inputCount = 3, bufferLimit = 8)` counts **all inputs, including the source**. Its canonical scope admits 1–16 valid Observable inputs and an analysis bound of 1–32 retained values per FIFO. This bound is a restriction on modeled histories: **RxJS itself has no corresponding overflow error, dropping rule or backpressure mechanism**. Histories exceeding the bound must be excluded from this model, rather than interpreted as native rejection.

An active state must satisfy all of the following constraints:

- Queue, liveness and received-count arrays have exactly `inputCount` entries.
- Queues are arrays of opaque values; no queue exceeds the selected analysis bound.
- Liveness entries are Boolean; received and emitted counters are nonnegative safe integers.
- For every input `i`, `queues[i].length = received[i] − emitted`.
- At least one queue is empty in a stable active state. Otherwise a tuple would already have been emitted.
- Every completed input has a nonempty queue while the result remains active. A completed empty queue requires termination.
- An input event addresses a valid, currently live subscription. New values also require room within the selected FIFO bound and safe counter range.
- `Closed` admits no further input, cancellation or connection events. A new result connection uses a new initial state.

A next value can make all queues nonempty, but one tuple immediately restores the empty-queue invariant. This is why an admitted atomic arrival emits at most one tuple. TypeScript discriminated unions and runtime guards enforce the represented contract; they are not a dependent-type proof of every RxJS execution.

### Guarded transitions

All rule IDs have prefix `S23-ZIP-`.

| Rule | Guard | State and ordered actions |
|---|---|---|
| `START` | First connection | Empty queues and zero counts; acquire inputs 0 through N−1. |
| `BUFFER` | Live input; within scope; another queue remains empty | Append one value and advance that input's received count; no output. |
| `EMIT` | All queues ready after append; no completed queue exhausted by removal | Remove one value from each queue; emit one tuple; advance emitted count. |
| `EMIT-LAST` | Removing the ready tuple exhausts a completed queue | Emit final tuple → complete → release remaining live inputs → closed. |
| `COMPLETE-BUFFERED` | Live input completes with queued values | Release that input only; retain its FIFO and mark it non-live. |
| `COMPLETE-EMPTY` | Live input completes with empty queue | Complete → release live inputs in registration order → closed. |
| `ERROR` | Addressed input is live | Error with unchanged payload → release live inputs → closed. |
| `CANCEL` | Result remains active | Release live inputs silently → closed. |

The direct pipeable result completes **before** its remaining input teardown actions. An input that previously completed with queued values was already released and must not be released again. This ordering is independently observed; a composed operator such as `zipAll` has additional outer/join machinery whose finalization order is described separately.

### Given–When–Then obligation

**Given** input zero has queued A1 and A2 and then completed, while inputs one and two remain connected, **when** B1 and C1 arrive, **then** emit `[A1, B1, C1]` and keep the result open. **When** B2 and C2 later arrive, **then** emit `[A2, B2, C2]`, complete the result and close the two remaining input connections. Never reconnect input zero, reuse A1, or flush an unmatched partial tuple.

## Verification — model predictions and native observations

| Evidence | What it checks |
|---|---|
| [18 model tests](../tests/session23-zip-model.test.mjs) | Initial acquisition, FIFO pairing, any-input trigger, singleton tuple behavior, buffered completion, terminal/cleanup order, opaque identity, purity, legal/illegal events and states, analysis bounds, safe counters, three examples and all eight rule witnesses. |
| [19 native RxJS tests](../tests/session23-zip-rxjs.test.mjs) | Literal runtime expectations independent of model imports; actual connection order, complete/error/cancel lifetimes, payload identity, duplicate producer occurrences, TestScheduler timing, and selected overload/setup cases. |
| [One differential test](../tests/session23-zip-differential.test.mjs) | **7,776** finite executions compare ordered actions, notification times, error identity and connection lifetimes after native execution determines the admitted input history. |
| [16 negative TypeScript assertions](../tests/types/session23-zip.ts) | Event discriminants, required input indexes/payloads, immutable FIFO state, required counts/bounds, closed reasons and tuple-only configuration. |

The differential matrix uses three total input counts (1, 2, 3), three seeds (empty, an input-zero burst, or that burst followed by its completion), three commands chosen from a six-command alphabet, and four ending policies: **3 × 3 × 6³ × 4 = 7,776 executions**. Some selections produce the same history, especially for one input or after early termination; the count is executions, not distinct histories. Schedules provide at most five unmatched arrivals per input, so bound eight does not decide which native notifications are sent. Actual native subscribers' closed states govern admission. The model runs only afterward.

The native TestScheduler case verifies an input completing with a retained value at the same virtual time that another input supplies the final tuple member. Both original producer lifetimes are asserted. The operator itself does not schedule those events.

Focused build, strict type checks and all 38 zip model/native/differential named tests passed, with zero failures or skips. Full-session integration and exact committed CI revisions are recorded by the [evidence ledger](../evidence/SESSION-23.md).

### Source and overload boundaries

The [pipeable wrapper](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/zip.ts) and [static FIFO implementation it invokes](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/zip.ts) were fetched at the pinned revision and exactly matched the installed source files. The complete [pipeable spec](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/zip-spec.ts) and [static zip spec](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/observables/zip-spec.ts) bodies were inspected. That inspection is not execution of the upstream RxJS suite.

The canonical tuple profile admits rest **Observable** arguments and non-notifying acquisition followed by atomic, non-reentrant notifications. Native-only tests additionally characterize:

- Synchronous empty-source termination that prevents later auxiliary connections.
- A synchronously completed source whose queued values remain available after auxiliary connection.
- The optional projector returning a value or throwing an exact error payload.
- Downstream `take(1)` cancellation during delivery.
- The legacy array argument: `source.pipe(zip([a$, b$]))` passes that array as **one iterable input** in the pinned implementation. It yields the Observable objects as tuple members and does not connect them. This differs from passing two rest Observable arguments and is not silently flattened in the canonical model.

These cases do not enlarge the canonical event alphabet. Other ObservableInput conversions, arbitrary reentrancy, throwing observer/producer teardown, unsafe count overflow, histories exceeding the declared FIFO bound and unrestricted infinite-trace liveness remain outside the profile. A recorded release is evidence of connection teardown, not a proof that every external producer side effect stops.

## Generated inspection path

The [zip inspection index](../operators/zip-index.md) groups three histories of this one canonical tuple profile:

| Example | Purpose | Configuration |
|---|---|---|
| `zip` | Uneven arrival pace and FIFO pairing | 3 total inputs, bound 8 |
| `zip-drain` | Retain completed input values until final tuple exhaustion | 3 total inputs, bound 8 |
| `zip-cancel` | Release a completed input early, then silently cancel the remaining inputs | 3 total inputs, bound 8 |

Each history generates eight views: prose, manifest, BDD, state-transition table, state diagram, test obligations, JSON trace and four-lane Markdown trace. Together with the export-level eleven-step index, this is **25 projections**. Generated traces are predictions from the canonical model; independent native observations remain separately recorded evidence.
