# Session 18 — Retry control, connection reference counts, sampling and sequence comparison

**Date:** 2026-11-15 (Europe/Zurich) · **Source:** RxJS **7.8.2**, pinned revision
[`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791).

Exactly five exported operator names are modeled: `retryWhen`, `refCount`, `sample`, `sampleTime`, `sequenceEqual`.
Each public name receives one inspection index. Scope profiles and scheduler settings do not consume extra names.

## Intuition — what moves over time?

| Export | Source values | Control and outcome |
|---|---|---|
| `retryWhen` | Every successful `next` is forwarded | Source errors are *control signals* published to a persistent errors Subject. Notifier `next` restarts, `complete` finishes, `error` fails |
| `refCount` | A single published producer multicasts to the current observers | First subscriber connects; other subscribers join; last departure disconnects; completion/error resets the connection generation |
| `sample` | Only the most recent *unsampled* source value is retained | Notifier `next` releases the retained value once; notifier completion is a no-op; source termination does not flush |
| `sampleTime` | Same sampled-value policy as `sample` | A virtual scheduled interval supplies ticks at periods `p,2p,3p,…`; a tick without a new value emits nothing |
| `sequenceEqual` | Two streams of opaque values compared in ordinal positions | Buffer unmatched arrivals in FIFO queues; inequality is decided immediately on a mismatch, excess value, or final length mismatch; equal streams finish with `true` |

**Value, time and ownership are separate.** A source supplies values, a notifier or scheduler supplies sampling/retry triggers, and a subscription/connection policy owns resource teardown.

## Specification — explicit Mealy six-tuples

The following `(S,S₀,Z,A,T,G)` contracts describe the finite declared profiles. `T` is a guarded state transition and `G` emits a sequence of ordered notification/resource actions. The executable source of truth is in `src/models/session18-*.ts`.

### retryWhen — persistent notifier, error-driven restarts

- **`S`**: `Unsubscribed`; `Active(g, notifier∈{absent,open})`; `Waiting(g,open)`; `Closed(reason)`.
- **`S₀`**: `Unsubscribed`, source generation 0 not yet connected.
- **`Z`**: subscribe/cancel; matching source `next/complete/error`; notifier `next/complete/error`.
- **`A`**: `subscribe(source[g])`, `unsubscribe(source[g])`, `subscribe(notifier)`, `unsubscribe(notifier)`, `notify(errorsSubject,N(error))`, `notify(downstream,N/C/E)`.
- **`T/G`**: first source error creates one errors Subject/notifier subscription, releases the failed source, and emits the **original error identity internally**, not to downstream. Later source errors reuse this notifier. A notifier next while waiting acquires generation `g+1`. Notifier completion immediately completes even if a retried source is active. Source completion completes immediately. Notifier error fails with its own error object. Cancel emits no notification.
- **Cω-style shape**: `retryWhen(errors$ → notifier$) : Cω(Signal) → T* → T*`. Arbitrarily many source executions are *possible*, but the finite trace example does not claim liveness or bound the real stream.
- **Constraints**: notifier activity is admitted only after a source error while waiting (except terminal notifier events while active). Synchronous resubscription through `syncResub`, reentrant notifier emissions and arbitrary `ObservableInput` conversions remain unmodeled.
- **Pinned source**: [retryWhen.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/retryWhen.ts).

### refCount — connect only while a subscriber requires it

- **`S`**: disconnected registry with a connection-generation counter; connected registry with one live generation and multiple unique subscriber occurrences.
- **`S₀`**: disconnected, no subscribers, generation 0.
- **`Z`**: subscriber join/leave and source next/complete/error on the **current generation**.
- **`A`**: connect/disconnect source; send individual notification to each registered observer.
- **`T/G`**: first join connects; another join does not duplicate the source subscription; one leave with other observers does not disconnect; last leave disconnects silently; source terminal broadcasts to current subscribers and resets its connection. Old connection generations cannot continue producing values.
- **Cω-style shape**: `refCount() : Cω(Connection) → Connectable(T*) → Shared(T*)`. `Shared` is teaching notation for a shared execution, not a native RxJS type.
- **Scope**: legacy `publish()`/`ConnectableObservable` with the default Subject and no external manual connection. Reuse the previously reviewed **share with three immediate boolean resets** guarded algebra, but with independent refCount metadata/source provenance. Do **not** generalize this equivalence to arbitrary connectable types, manual `connect()`, different Subjects, or synchronous connection-time reentrancy.
- **Pinned sources**: [refCount.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/refCount.ts), [ConnectableObservable.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/ConnectableObservable.ts).

### sample and sampleTime — one retention algebra, two trigger policies

- **`S`**: `Unsubscribed`; `Listening(hasValue,lastValue,notifierStatus,tick,due)`; `Closed(reason)`.
- **`S₀`**: no source, notifier or timer subscription.
- **`Z`**: source next/complete/error, notifier next/complete/error for `sample`, or scheduler `timer.fire(now,generation)` for `sampleTime`; subscribe/cancel.
- **`A`**: subscribe/unsubscribe source and notifier, schedule/cancel next periodic tick, notify downstream.
- **`T/G`**: source next **only remembers** the latest opaque payload. Notifier next or valid periodic tick emits it once iff `hasValue`, then clears presence. Repeated empty ticks do not emit. Source complete/error terminates immediately; no hidden final flush.
- **Cω-style shapes**: `sample(notifier$) : Cω(Signal) → T* → T*`; `sampleTime(p,scheduler) : Cω(Time) → T* → T*`.
- **Time**: `sample` receives notifier times externally; `sampleTime` receives ticks from a virtual scheduler starting at the subscription instant. The model does not invent timer wall time.
- **Constraints**: `hasValue` distinguishes true `undefined`/`null` values from absence; notifier completion is **not** a sample event in pinned 7.8.2 (`noop`). The `sampleTime` model covers positive integer period 1…1000 and ordered virtual ticks; not arbitrary custom schedulers, same-instant race permutations, or invalid periods.
- **Pinned sources**: [sample.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/sample.ts), [sampleTime.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/sampleTime.ts), [interval.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/observable/interval.ts).

### sequenceEqual — buffer until equality is decided

- **`S`**: `Unsubscribed`, `Comparing(leftFIFO,rightFIFO,leftDone,rightDone)`, `Closed(equal/unequal/error/cancel)`.
- **`S₀`**: both FIFO queues empty, both completion flags false, no subscriptions.
- **`Z`**: `left.next/right.next`, `left.complete/right.complete`, `left.error/right.error`, subscribe/cancel.
- **`A`**: acquire/release each source, output exactly `N(boolean), C` on decision; propagate a genuine error unchanged; silent cancel.
- **`T/G`**: a new value consumes the oldest opposite queued value if available. `===` mismatch ends `false` immediately. If the other stream is complete with no unmatched values, an additional next ends `false`. On completion of both sources, output `true` iff both queues are empty; otherwise `false`.
- **Cω-style shape**: `sequenceEqual(compareTo,===) : Cω(Comparison) → T* → Bool?`. The `?` denotes the possibility that infinite/silent input prevents a decision; on a normal decision the output cardinality is exactly one Boolean.
- **Constraints**: default JavaScript strict equality only, with queue length at most the declared `maxPending`. `NaN !== NaN`; object equality uses reference identity. User-defined comparator callbacks are supported by RxJS but need an *additional callback-request/result* model and are not accepted here. A consumer cancellation does not mean `false`.
- **Pinned source**: [sequenceEqual.ts](https://github.com/ReactiveX/rxjs/blob/e5351d02e225e275ac0e497c7b66eaa5f0c88791/src/internal/operators/sequenceEqual.ts).

## Verification — tests and future obligations

The session uses the unchanged `npm run check` chain: syntax, strict types including negative assertions, compilation, canonical model and independent actual RxJS tests, and deterministic projection drift checks. `npm run generate` uses the existing generator, and the mandatory `operators/<export>-index.md` pages are themselves generated outputs.

Native tests deliberately include source/subject observer lifetime, exact error identity, notifier completion behavior, synchronous teardown after decisive mismatch, and virtual-time sampling. Predicted model traces and actual RxJS observations are **separate** test evidence; agreement on finite cases does not establish a general proof.

Representative safety obligations for later temporal checking:

- **Retry signal routing**: `G(source.error → ¬downstream.error)` while a valid notifier remains open and no notifier terminal has occurred.
- **Refcount ownership**: `G(subscriberCount > 0 → atMostOneSourceConnection)` within the published Subject profile.
- **Sampling freshness**: `G(sampleOutput(v) → previouslySeenUnconsumed(v))` with a defined tick/notification order.
- **Sequence equality**: `G(decide(true) → bothComplete ∧ queuesEmpty)`; `G(decide(false) → mismatchWitness)`.
- **All models**: `G(Closed → no further downstream next)`; `G(cancel → no downstream completion)`.

These formulas are illustrative obligations, not claims of automatically discharged proofs. See the executable guarded rules and generated obligations for precise event alphabets and bounded scopes.
