# Session 23 — zipAll: collect descriptions, then pair queued values

**Export:** `zipAll`. **Runtime:** RxJS 7.8.2 at pinned revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791). The [canonical model](../src/models/session23-zipAll.ts) describes one tuple-output profile through three histories. The [Session 23 evidence ledger](../evidence/SESSION-23.md) records integration checks and final acceptance; the [inspection index](../operators/zipAll-index.md) connects the generated views.

## Intuition

An outer stream supplies descriptions of inner streams. `zipAll` remembers those descriptions in their arrival order. It connects to them **only when the outer stream completes**. While the outer remains open, no inner value can contribute to an output.

After that collection barrier, each connected inner has a queue. A value enters its input's queue. Whenever every queue has a value, the operator removes the oldest value from each queue and emits a fresh tuple in collection order. Faster inputs can accumulate unmatched values; they do not replace older values, and this buffering does not slow their producers.

Suppose the outer supplies `letters$`, then `digits$`, and completes at time 3. After connection, letters supplies A at time 4 and B at time 5, then completes at time 6. Digits supplies 1 at time 7 and 2 at time 8. The result emits `[A, 1]` at 7, then `[B, 2]` at 8 and completes. Letters' completed producer has already been released, but its queued values remained available. Once its final queued value is used, no third tuple is possible, so the result releases digits without waiting for it to complete. This is the [main generated example](../src/models/session23-zipAll.ts).

An inner description is not an execution. If an inner refers to a live, shared producer, values emitted before the collection barrier can be missed. `zipAll` adds neither replay nor an early connection to recover them. An outer that never completes never activates the descriptions it has collected. The [native barrier tests](../tests/session23-zipAll-rxjs.test.mjs) demonstrate both cases.

| What arrives | What happens |
|---|---|
| An outer value | Remember one inner description occurrence; connect nothing. |
| Outer completion with no descriptions | Complete without emitting an empty tuple. |
| Outer completion with descriptions | Connect all occurrences in order, then release the outer producer. |
| An inner value, while another queue is empty | Append and wait. |
| An inner value that makes every queue nonempty | Remove one oldest member from every queue and emit one tuple. |
| Inner completion with queued values | Release that producer and retain its FIFO until consumed. |
| Inner completion with an empty queue, or consumption of a completed queue's final value | Release the remaining inputs and complete. |
| An outer or inner error | Forward that error and release owned connections; do not flush partial tuples. |
| Consumer cancellation | Release owned connections silently; do not activate collected descriptions or flush queues. |

The pinned [zipAll implementation](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/zipAll.ts) delegates to [joinAllInternals](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/joinAllInternals.ts): collect with `toArray`, join with static `zip` inside `mergeMap`, and apply an optional projection if supplied. The canonical profile here uses tuple output without that optional projection.

## Specification

### Shape and scope

Using the course's Cω shorthand:

```text
zipAll : (T*)* → [T]*
```

The outer values are stream descriptions. After it successfully collects a finite number n of them, each result value is an n-element tuple. With heterogeneous inputs collected as A*, B*, …, the joined shape is `(A × B × …)*`. An empty outer produces no tuple, and a single collected stream produces singleton arrays rather than passing its values through unchanged.

For finite normally completing inner streams, the result can form the minimum of their value counts in tuples. That statement assumes every value needed for those tuples actually arrives after connection and that no earlier error or cancellation intervenes. The shape alone does not express the outer completion barrier, FIFO order, connection lifetime or early exhaustion.

`createZipAllModel<T>(maxInners = 8, bufferLimit = 8)` describes valid Observable occurrences with no optional projector. `maxInners` is an integer in **0..16**; `bufferLimit` is an integer in **1..16**. These are **model scope limits**, not native capacities, overflow strategies or backpressure. A history exceeding a limit is rejected by the model. RxJS itself does not apply these limits or silently drop excess queued values. Safe-integer received/emitted counters also bound admitted histories.

### Explicit Mealy six-tuple

The pure canonical definition is `M = (S, S₀, Z, A, T, G)`:

| Component | Definition |
|---|---|
| **S** | `Unsubscribed`; `Collecting(sources)`; `Joining(slots, emitted)`; `Closed(reason)`. A joining slot retains an opaque source token, its FIFO, a Boolean connection-liveness bit, and its received-value count. Slots are occurrence indexed, so the same source token may occur more than once. |
| **S₀** | `Unsubscribed`. No source, inner connection, queue, timer or output exists. |
| **Z** | `subscribe`, `cancel`, outer `next(value)`, `complete`, `error(error)`, and indexed inner `next(value)`, `complete`, `error(error)`. Inner values are legal only for an existing live slot in `Joining`. |
| **A** | Ordered `subscribe`/`unsubscribe` resource actions and downstream `next(tuple)`/`complete`/`error(error)` notifications. The outer resource has generation 0; each inner resource's generation is its collected occurrence index. No timer or user-function action belongs to this profile. |
| **T** | Thirteen named guarded rules in the [canonical TypeScript file](../src/models/session23-zipAll.ts) update collection, counters, FIFO suffixes, liveness and terminal reason. Closed state retains no queues or owned connections. |
| **G** | The same rule produces an ordered action word from the same pre-event state. Collecting a description emits no action. Joining acquires inputs in order; a pairable value emits one fresh tuple; lifecycle outcomes use the exact action orders below. |

### State-dependent constraints

- Only `subscribe` is admitted in `Unsubscribed`. Only outer notifications and cancellation are admitted during collection. No outer notification is admitted after the collection barrier.
- The collection cannot exceed `maxInners`. A joining state has between one and `maxInners` slots in the same occurrence order.
- An inner event needs a nonnegative safe-integer index of a live slot. An already completed input cannot supply a later value, completion or error.
- Each slot obeys `queue.length = received − emitted`, with nonnegative safe counters. Completed slots retain a nonempty FIFO while the join remains active.
- At least one queue is empty in every stable joining state. If all queues became nonempty, that same atomic reaction would already consume a tuple.
- A value cannot exceed the configured FIFO scope or counter range. There is no overflow action, replacement policy or synthetic notification.
- Reaction validation checks resource ownership before and after each action word: an acquisition cannot duplicate a live connection, a release must own its connection, and next-state ownership must match the action results.
- A tuple's members preserve their original references, including `undefined` and `null`. A fresh tuple array is produced for each result; input payloads and source tokens are not cloned.

These checks reject specific malformed states and illegal transitions. They are not a proof that every state satisfying the checks is reachable in an arbitrary native execution.

### Ordered actions and termination

| Trigger | Ordered externally observed actions |
|---|---|
| First result connection | Acquire outer. |
| Nonempty outer completion | Acquire inner 0, inner 1, … → release outer. |
| Empty outer completion | Complete downstream → release outer. |
| Inner completion with buffered values | Release that inner only; retain its FIFO. |
| Inner completion with no queued value | Release still-live inner producers in collection order → complete downstream. |
| Arrival draining the final value of a completed queue | Emit last tuple → release still-live inner producers in collection order → complete downstream. |
| Inner error | Error downstream with the identical payload → release still-live inner producers in collection order. |
| Outer error before activation | Error downstream → release outer; acquire no inner. |
| Cancellation while collecting / joining | Release outer / remaining live inners; no notification. |

Two implementation details matter here. `toArray` forwards the collected list during outer completion, so deferred inner acquisition occurs before outer producer teardown. For a successful joined termination, `mergeMap` observes the joined subscription's finalization before completing downstream, so the remaining inner producers are released **before** downstream completion. Error forwarding occurs **before** cleanup. These orders were independently observed in [literal native tests](../tests/session23-zipAll-rxjs.test.mjs) and all admitted [differential executions](../tests/session23-zipAll-differential.test.mjs); they are not inferred from notification marbles alone.

### Time, cancellation and sharing

No clock or timer is introduced. The outer and inner sources supply event times, and equal timestamps retain explicit event order. A tuple is emitted at the arrival that supplies its final missing member. The generic runner checks finite nonnegative, nondecreasing envelope time.

Each result connection owns separate collection and FIFO memory. Collecting the same Observable twice creates two input subscriptions; whether that Observable describes independent work or an already shared producer is external to `zipAll`. Cancellation closes owned subscriptions and discards unmatched values. A release action describes connection teardown; it is not a separate proof that every external producer side effect stops.

Canonical outer and inner acquisition is non-notifying and returns before later notifications. Reactions are atomic and non-reentrant; cancellation is admitted between reactions. Native tests separately characterize synchronous outer/inner production, synchronous empty-inner setup that prevents later acquisition, and optional projector return/throw behavior. Non-Observable input conversion, arbitrary reentrancy, throwing observers/finalizers, mutation of producer descriptions, unsafe counters, and unbounded infinite-trace claims remain outside the canonical scope.

## Verification

| Evidence | What it checks |
|---|---|
| [20 model tests](../tests/session23-zipAll-model.test.mjs) | Collection barrier, action order, FIFO drain, token/payload identity, empty/singleton joins, cancellation, guards, invalid-state accounting, immutable updates and all thirteen rule witnesses. |
| [20 independent native RxJS tests](../tests/session23-zipAll-rxjs.test.mjs) | Literal notifications, producer acquisition/release order, deferred and synchronous cases, live-inner values missed before connection, duplicate occurrences, virtual-time subscriptions, optional projection return/throw. This file imports no model or generated prediction. |
| [One differential test](../tests/session23-zipAll-differential.test.mjs) | **9,024 finite native-first model/runtime comparison executions**, including times, ordered actions, terminal/error identity and resource lifetimes. |
| [16 negative TypeScript assertions](../tests/types/session23-zipAll.ts) | Event payload/index presence and types, source-token presence, state fields, FIFO element types and immutability, and exclusion of timer/projector events. |

The differential test first executes real RxJS. Actual `Subscriber.closed` state decides whether an input can still emit or terminate. Only afterward does it replay the observed admitted history through the model and compare full ordered actions with their supplied times. No model readiness calculation or predicted lifecycle controls the native experiment.

The corpus consists of **24 collection-ending executions** (0–3 collected occurrences × distinct/duplicate producer arrangements × outer completion/error/cancellation), plus **9,000 joining executions** (1–3 occurrences × two arrangements × three initial FIFO/completion patterns × 5³ command sequences × four endings). A final cancellation closes any surviving result. Some parameter combinations yield the same admitted history; the count denotes comparison **executions**, not necessarily unique histories or a universal equivalence proof. The maximum supplied arrival count fits within the declared default model bounds.

The 41 focused model/native/differential tests and the strict TypeScript check passed locally. The normal generator, repository-wide checks and independent committed verification are recorded separately in the [session ledger](../evidence/SESSION-23.md).

### Scenario-to-rule map

All rule IDs have prefix `S23-ZIPALL-`.

| Rule suffix | Behavioral obligation | Evidence |
|---|---|---|
| `START`, `COLLECT` | Description-only construction, one outer connection, no early inner acquisition, ordered repeated occurrences | Model lifecycle and duplicate tests; native cold/barrier/shared-producer tests; collection corpus |
| `OUTER-EMPTY`, `OUTER-JOIN` | Empty outer emits no tuple; nonempty barrier acquires inner occurrences before outer teardown | Model literal actions; native empty and ordered acquisition tests; collection corpus |
| `OUTER-ERROR`, `CANCEL-COLLECT` | Discard descriptions without activation; error and cancellation differ | Model/native failure and cancellation tests; collection corpus |
| `INNER-BUFFER`, `INNER-EMIT` | Retain FIFO order and opaque values; consume one item per input and emit one fresh array | Model/native uneven arrivals and identity tests; joining corpus |
| `INNER-COMPLETE-BUFFERED`, `INNER-DRAIN` | Completed producer releases immediately; queued suffix remains useful until exhausted | Model/native drain tests; completed-first differential seeds |
| `INNER-COMPLETE-EMPTY` | No tuple remains possible; release live inputs before downstream success | Model/native empty completion tests; joining corpus |
| `INNER-ERROR`, `CANCEL-JOIN` | Error precedes cleanup; cancellation is silent; completed producers are not released twice | Model/native failure/cancellation tests; joining endings |

### Provenance and generated histories

The pinned `zipAll`, `joinAllInternals` and static `zip` implementation bodies were fetched and byte-compared with the installed RxJS 7.8.2 source; all three match. The [upstream zipAll spec body](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/spec/operators/zipAll-spec.ts) was inspected, including paired arrivals, deferred activation, FIFO exhaustion, error, synchronous and iterable scenarios. The upstream RxJS suite was **not executed**. Upstream scenarios outside the canonical profile are not silently promoted into its supported scope.

`zipAllExample`, `zipAllEmptyExample` and `zipAllCancelExample` are three histories of this one semantic profile. The standard generator creates eight views per history plus the export-level eleven-step inspection index, **25 projections**. Generated traces are predictions from the canonical model; independent native observations remain separate evidence.
