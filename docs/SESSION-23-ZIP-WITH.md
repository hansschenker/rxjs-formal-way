# Session 23 — zipWith: pair each input's next unmatched value

**Export:** `zipWith`. **Runtime:** RxJS **7.8.2**, pinned revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). The [shared canonical FIFO kernel](../src/models/session23-zip-common.ts) contains the executable rules and guards; the [zipWith wrapper](../src/models/session23-zipWith.ts) selects this export's identity and supplies its examples. Executed integration checks and acceptance are recorded in the [Session 23 evidence ledger](../evidence/SESSION-23.md).

## Intuition

`zipWith` pairs values by their arrival position within each input. It remembers unmatched values in one queue per connection. When every queue contains a value, it removes the oldest value from each queue and emits a fresh tuple in source-and-argument order. The value that fills the final empty queue triggers that tuple; it can arrive from any input.

Suppose the source supplies A1 and A2 before its two companions can form a tuple:

| Time | Arriving notification | Result |
|---:|---|---|
| 0 | Connect the result | Connect source, first companion, second companion, in that order. |
| 1 | Source: A1 | Remember A1. |
| 2 | Source: A2 | Remember A2 behind A1. |
| 3 | First companion: B1 | Still waiting for the second companion. |
| 4 | Second companion: C1 | Emit `[A1, B1, C1]`. |
| 5 | Second companion: C2 | Remember C2. |
| 6 | First companion: B2 | Emit `[A2, B2, C2]`. |
| 7 | Source completes with an empty queue | Complete the result and release remaining connections. |

The source's A2 does not replace A1. Faster producers keep supplying values, so unmatched queues can grow. `zipWith` introduces no backpressure, rate matching, timer, or scheduler. Source and companion notifications determine when tuples become available.

Completion is about whether another full tuple remains possible. A completed input with a nonempty queue releases its producer connection but keeps those values available. When its last queued value joins a tuple, the result emits that tuple and completes immediately. An input completing with an empty queue ends the result at once. An input error discards every queue and fails the result. Closing the result connection also discards the queues, silently.

With no companion arguments, the source is still one input: each source value becomes a **singleton array**. `source.pipe(zipWith())` therefore emits `[value]`, including `[undefined]` or `[null]`.

## Specification

### Stream shape and export identity

Using the course's Cω notation, with `*` denoting a possibly unbounded sequence of values over time:

```text
zipWith : (U₁*, …, Uₙ*) → T* → (T × U₁ × … × Uₙ)*
```

The nth output tuple uses the nth value from every input. An input value contributes to at most one tuple, and no partial tuple is emitted. In the ordinary finite, successful case where all required values arrive, the number of tuples is the shortest input's length. Earlier error or cancellation can end the execution before that count.

The pinned [`zipWith` implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/zipWith.ts) delegates to the [pipeable `zip` implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/zip.ts), which connects the upstream source followed by the supplied inputs through [static `zip`](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/zip.ts). The two pipeable exports share the canonical FIFO rules, while retaining separate export names, model metadata, rule IDs, tests and public inspection indexes. The deprecated pipeable `zip` exposes legacy overloads; `zipWith`'s TypeScript signature takes rest `ObservableInput` arguments and does not expose a result-selector argument.

### The six-tuple

The machine is **`M = (S, S₀, Z, A, T, G)`**. It describes one result connection; constructing it executes no producer.

| Component | Explicit definition |
|---|---|
| **S** | `Unsubscribed`; `Active(queues, live, received, emitted)`; or `Closed(reason)`. Each input has its own FIFO, liveness bit and received count. `emitted` counts complete tuples. Close reasons are exhausted input, error or cancellation. |
| **S₀** | `Unsubscribed`, with no input connections, queues or execution counters yet acquired. |
| **Z** | `subscribe`; indexed `input.next(value)`, `input.complete`, `input.error(error)`; and `cancel`. Input index zero identifies the upstream source. |
| **A** | Ordered connection acquisition/release actions and downstream next/error/complete notifications. A next contains one fresh tuple of unchanged input values. No timer, user-function invocation, or hidden producer execution occurs in the model. |
| **T** | The eight named guarded transitions in the shared kernel update FIFO contents, input liveness and counters, or enter a closed state. |
| **G** | The same reaction supplies its ordered action word: acquire source then companions; emit one tuple when ready; release a completed producer while retaining its queue; terminate and release remaining live connections when pairing becomes impossible. |

The pure transition and action components are evaluated together by the existing runner. Their returned actions are predictions, not subscriptions performed by the model.

### State-dependent legality

The constructor is `createZipWithModel(inputCount = 3, bufferLimit = 8)`. `inputCount` is the **total** number of inputs, including the source, and ranges from 1 through 16. The FIFO analysis bound ranges from 1 through 32. **This bound restricts the histories admitted to the model; it is not an RxJS argument, overflow error, dropping policy, or native queue limit.**

While active:

- All three input-indexed arrays have exactly `inputCount` entries. Liveness entries are boolean; received and emitted counts are nonnegative safe integers.
- An input's FIFO length equals its received count minus the emitted tuple count. Original value references remain in their arrival order.
- At least one FIFO is empty after every atomic reaction. Consequently, one subsequent arrival can form at most one tuple.
- A non-live input retains a nonempty queue. A completed empty queue would already have closed the result.
- Indexed notifications are legal only for a currently live input with a valid safe integer index. Further notifications to completed inputs or the stopped result are outside the admitted alphabet.
- A next notification must remain within the declared queue bound and safe counter range. Source construction and input acquisition must not synchronously notify or advance time in this canonical profile.

Closed states retain only the termination reason; they admit no further input or cancellation event. Native Subscribers ignore attempted late delivery, which is characterized separately from admitting such an event into the model.

### Ordered reactions

All rule IDs below have prefix `S23-ZIPWITH-`.

| Rule | When it applies | Action policy |
|---|---|---|
| `START` | First result connection | Acquire input 0, then the companions in argument order; initialize empty queues. |
| `BUFFER` | An arrival still leaves another FIFO empty | Append the opaque value to its input queue; emit nothing. |
| `EMIT` | Every FIFO is ready and pairing leaves no completed FIFO empty | Remove one value from each FIFO and emit their tuple. |
| `EMIT-LAST` | Pairing consumes a completed input's last queued value | Emit the final tuple, complete downstream, then release remaining live inputs in registration order. |
| `COMPLETE-BUFFERED` | A live input completes with queued values | Mark it non-live and release only its producer connection; retain its queue. |
| `COMPLETE-EMPTY` | A live input completes with an empty queue | Complete downstream and release all remaining live inputs in registration order. |
| `ERROR` | A live input fails | Forward the identical error, discard queues and release remaining live inputs. |
| `CANCEL` | The result connection is closed | Discard queues and release remaining live inputs, without a notification. |

The result does not wait for every input to complete. For example, a source may have completed after two values while a companion is still live; the companion's second arrival drains that source's last value and closes both the result and the companion connection.

### Time, cancellation and sharing

Time is supplied by source and companion events. Equal timestamps retain an explicit event order. Completing a buffered input before a same-time companion arrival releases that producer before the tuple; reversing the events can place the tuple before that release. The model preserves those ordered actions.

The canonical profile allows cancellation between atomic reactions. Downstream cancellation during synchronous tuple delivery or while source setup is still executing is characterized by selected native tests, with its physical teardown ordering kept outside the canonical contract.

Every result connection owns separate FIFO state and separate input subscriptions. `zipWith` adds no sharing or replay. Passing the same Observable description in two positions creates two input connections; whether that producer already shares execution is a property of the supplied Observable. Closing one result connection does not close an independent result's connections.

## Verification

### Independent checks

| Evidence | Coverage |
|---|---|
| [Model tests](../tests/session23-zipWith-model.test.mjs) | **16 tests**: parameter scope, metadata, exact action order, FIFO preservation, completed-buffer draining, singleton tuples, invalid inputs and forged states, counter/buffer invariants, immutable snapshots, independent executions, examples, and witnesses for all eight rules. |
| [Native RxJS tests](../tests/session23-zipWith-rxjs.test.mjs) | **18 tests**, importing actual RxJS without importing the canonical model. Literal expectations observe tuples, exact errors, connection order/lifetimes, source/companion symmetry, duplicate descriptions, separate result connections, virtual time, same-time ordering and selected native-only setup cases. |
| [Differential tests](../tests/session23-zipWith-differential.test.mjs) | **One named test with 10,368 finite native-first comparison executions**, matching complete ordered actions and supplied times. |
| [Type assertions](../tests/types/session23-zipWith.ts) | **15 negative assertions**, plus positive heterogeneous tuple and singleton-array inference checks against native `zipWith`. |

The focused build, strict TypeScript checks and all **35 named zipWith tests** passed locally. The complete committed integration and CI outcome are recorded separately in the [session ledger](../evidence/SESSION-23.md).

The differential adapter first creates actual RxJS subscriptions. Their observed closed state determines which indexed notifications can still occur. It records that admitted event history and all resulting notifications/acquisitions/releases, then replays the history through the canonical model. Model state never decides native admission.

The execution count is:

```text
3 total-input counts × 4 initial arrangements × 6³ command sequences × 4 endings = 10,368
```

Counts are 1, 2 and 3 inputs. Initial arrangements include no queued values, either endpoint running ahead, and a completed source with queued values. Commands vary next/completion at first, middle and last positions; endings include both endpoint completions, a live-input error and cancellation. At most five unmatched values arise in these schedules, within the model bound of eight. Equivalent or already stopped histories may repeat across schedules: the count is executions, not unique behaviors. Eight legal rule witnesses demonstrate exercised rule IDs without proving universal guard totality.

### Source inspection and native-only cases

The pinned implementation bodies for `zipWith`, pipeable `zip` and static `zip` were fetched, read and byte-matched against the installed 7.8.2 source. The complete [upstream zipWith spec body](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/zipWith-spec.ts) was inspected. The upstream RxJS suite itself was **not executed**.

Native-only tests distinguish three behaviors from the canonical post-setup, valid-Observable scope:

1. A synchronously empty source can stop result setup before companions are acquired.
2. Synchronously buffered inputs and downstream `take(1)` retain physical producer setup/teardown order, including immediate disposal after a producer returns its teardown.
3. An array argument is one iterable input. An array containing two Observable descriptions supplies those descriptions as **values**; it does not connect to those descriptions as two companions.

The canonical model excludes arbitrary ObservableInput conversion, projection overloads, unbounded queues, unsafe counter overflow, acquisition-time notifications, arbitrary reentrancy, throwing observers/producer teardown and universal infinite-trace liveness. A recorded unsubscribe action describes connection teardown, not a proof that every external producer side effect stops.

### Generated teaching examples

The [inspection index](../operators/zipWith-index.md) groups three histories of the shared FIFO profile:

- `zipWith`: three inputs arriving at different rates, retaining FIFO order.
- `zipWith-drain`: completed inputs release their producers while their queued values await final pairing.
- `zipWith-cancel`: unmatched values are discarded on silent result cancellation.

The normal generator produces eight views per history plus one export-level index: **25 projections**. Generated traces are model predictions. Independent native observations and the recorded CI checks establish the scoped evidence supporting them.
