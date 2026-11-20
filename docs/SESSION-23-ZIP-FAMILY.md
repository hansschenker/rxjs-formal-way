# Session 23 — Pairing values by position

**RxJS 7.8.2.** Session 23 covers the final three pending pipeable exports: **zip, zipAll and zipWith**. The [session record](../planning/sessions/2026-11-20-session-23.json) preserves the user's explicit **20 November 2026 Europe/Zurich** date exception after Session 22 closed. The [evidence ledger](../evidence/SESSION-23.md) owns executed results and acceptance.

## Intuition: each input supplies the next member of a tuple

These operators pair the first value from every connected input, then the second value from every input, and so on. Arrival times can differ. Each input has its own first-in, first-out queue, so an early value waits for the corresponding values from the other inputs. A new arrival emits one tuple when it makes every queue nonempty. The tuple follows input order and retains the original value references.

| Time | Incoming notification | Unmatched A values afterward | Unmatched B values afterward | Result |
|---:|---|---|---|---|
| 1 | A emits A1 | A1 | empty | none |
| 2 | A emits A2 | A1, A2 | empty | none |
| 3 | A completes | A1, A2 | empty | none; A's connection closes |
| 4 | B emits B1 | A2 | empty | [A1, B1] |
| 5 | B emits B2 | empty | empty | [A2, B2], then completion |

Completing A stops new A values. Its queued values can still participate in later tuples. Once a completed input's queue becomes empty, no further full tuple can be formed, so the result completes and releases the remaining connections. An input completing with an empty queue therefore ends the result immediately, even when another input has unmatched values.

The pairing follows **emission position**, not matching timestamps or equal payloads. No clock or scheduler is introduced. Fast input values accumulate; RxJS does not automatically slow their producer, overwrite them with a latest value, or drop excess values.

## The three connection policies

| Export | What is supplied | When inputs connect | What flows afterward |
|---|---|---|---|
| `zip` from `rxjs/operators` | Upstream source and additional rest-argument Observables | On result subscription: source first, then additional inputs in argument order | Fresh tuples pairing one queued value from every input |
| `zipWith` | The same source-plus-input arrangement | The same connection order; the pinned implementation delegates to pipeable `zip` | The same FIFO tuple policy, with a separate public export and independent native evidence |
| `zipAll` | An outer stream whose values describe inner Observables | Connect outer first, retain its descriptions, and connect the collected inners only when outer completes | Fresh arrays pairing one queued value from every collected inner |

This catalogue tracks exports from the pinned `src/operators/index.ts`. Its `zip` entry is the **deprecated pipeable operator**, not the separately exported static creation function named `zip`. The shared FIFO implementation ultimately uses that static function, but native tests call the correct public pipeable export. `zipWith` is the nondeprecated pipeable name.

`zipAll` has a collection barrier. An outer source that never completes never starts the collected inner connections. A live inner producer can emit before that barrier, and those values are missed unless that producer independently retains or replays them. An empty outer completes without emitting an empty array. Repeated references to the same inner Observable create separate subscription occurrences; reference equality does not combine them into one connection.

The operator descriptions remain inactive until subscribed. Each result subscription owns fresh queues, completion state and input subscriptions. None of these operators adds sharing or replay; the supplied producers can independently have their own sharing policy.

## Specification: explicit state and actions

| Export | Cω shape in this course | Detailed six-tuple and scope | Canonical rules | Inspection index |
|---|---|---|---|---|
| `zip` | `(U₁*, …, Uₙ*) → T* → (T × U₁ × … × Uₙ)*` | [Pipeable zip](SESSION-23-ZIP.md) | [Shared FIFO model](../src/models/session23-zip-common.ts) | [Inspect](../operators/zip-index.md) |
| `zipWith` | `(U₁*, …, Uₙ*) → T* → (T × U₁ × … × Uₙ)*` | [ZipWith](SESSION-23-ZIP-WITH.md) | [Shared FIFO model](../src/models/session23-zip-common.ts) | [Inspect](../operators/zipWith-index.md) |
| `zipAll` | `(T*)* → [T]*` | [Collected inner streams](SESSION-23-ZIP-ALL.md) | [Deferred-join model](../src/models/session23-zipAll.ts) | [Inspect](../operators/zipAll-index.md) |

Every detailed guide gives **M = (S, S₀, Z, A, T, G)**: state, initial state, legal input events, ordered actions, next-state function and action function. The type shapes describe value structure; the guards and action rules supply the connection barrier, ordering and termination behavior. In `zipAll`, each emitted array has the length of the completed outer collection. With no additional inputs, pipeable `zip` and `zipWith` wrap each source value in a singleton array.

The direct family shares one guarded FIFO kernel while keeping export-specific metadata, rule identifiers, examples and tests. The `zipAll` model adds the collection phase and its distinct connection lifecycle. Pure transition functions describe effects; they do not subscribe to producers, invoke business functions, or run a scheduler.

### Time, termination and cancellation

Input notifications supply time. Equal-time arrivals retain their explicit execution order. The canonical scope admits non-notifying acquisition and atomic notifications after setup; native tests separately characterize selected synchronous setup cases.

Individual completion with queued values releases that input connection and preserves its queue. Error propagates the same error value and discards pending tuples. Explicit downstream cancellation releases live inputs without emitting completion. All retained buffers belong to one result execution.

Ordered teardown is observable. Direct `zip` and `zipWith` notify successful downstream completion before releasing still-live input connections. After a deferred `zipAll` join has started, its internal join releases the remaining inner connections before downstream completion. The `zipAll` outer-completion reaction acquires collected inners before the outer producer teardown runs. The detailed guides and native action logs retain these differences; a shared tuple policy does not imply identical connection ownership.

### Scope bounds are analysis limits

The direct models admit one to sixteen total Observable inputs and an explicit retained-queue analysis bound. The `zipAll` model bounds the outer collection and retained inner queues. These bounds reject histories outside the selected model scope. They do not add a queue-capacity option, dropping rule, error policy or backpressure mechanism to RxJS.

Canonical output is a tuple/array of unchanged opaque values. Optional projectors, legacy overload normalization, arbitrary ObservableInput conversion, acquisition-time notification and arbitrary reentrancy are separately characterized or excluded as stated in each guide. Finite native examples outside the model scope do not enlarge the legal canonical event alphabet.

## Verification: predictions and observations

Nine configured examples produce **72 per-example projections plus three public indexes: 75 Session 23 projections**. The complete registry is **1,297 ordinary + 3 specialized projections**, verified by the checks recorded in the ledger. Each index exposes the same eleven-step path: Overview, Diagram, STT, BDD, Trace, Obligations, Manifest, Canonical Model, pinned RxJS source, Tests and Evidence.

Model tests check legal transitions, rejected histories, immutable state updates, payload identity and named rule witnesses. Independent native tests execute the installed RxJS 7.8.2 exports against literal expected outputs and connection logs. Differential adapters first execute actual RxJS, use actual subscriber state to determine which events occurred, and then replay that recorded history through the model. They compare ordered notifications, time and resource lifetimes. Model predictions do not choose native input admission.

The [scenario map](SESSION-23-SCENARIOS.md) links the obligations to those separate tests and compiler assertions. Normal generation and drift checking verify reproducible projections; navigation tests check exact example membership and the required links. A separate catalogue test checks all 113 actual pinned native operator exports against the inventory and their published model/runtime evidence. The ledger records actual local and committed CI outcomes, including independent read-only verification before acceptance.

Pinned implementation and upstream spec inspection are source evidence. They are not a claim that the upstream RxJS suite ran. Finite comparison executions can contain repeated histories and do not establish unrestricted equivalence, arbitrary reentrancy or universal infinite-trace liveness.
