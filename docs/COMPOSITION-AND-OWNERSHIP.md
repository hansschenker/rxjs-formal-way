# From isolated operators to connected machines

**Status:** adopted design guidance; not an implemented universal runtime or proof of RxJS equivalence.
**Baseline:** RxJS 7.8.2. Derived from the [source-attributed transcript review](reviews/2026-10-28-gemini-mealy.md).

## 1. The practical extension

Our six-tuple still explains one operator. The additional question is:

> What happens when several operator machines share notifications, subscriptions, timers, and state owners?

Keep three connected levels:

| Level | Describes | Does not establish by itself |
|---|---|---|
| Transition model | A state and an event determine a next state and ordered actions | JavaScript callback nesting or resource attachment order |
| Execution contract | When actions execute, which events they cause, and who owns resources | That the real RxJS operator conforms |
| Runtime evidence | Observed notifications, times, subscription lifetimes and callback order | Exhaustive equivalence for every possible trace |

A pure step is an excellent specification unit. It is not a reason to hide the interpreter.

```text
input event
    ↓
pure transition: (state, event) → (nextState, ordered actions)
    ↓
execution contract / interpreter
    ├─ deliver downstream notifications
    ├─ subscribe or cancel resources
    ├─ schedule or cancel work
    └─ route resulting events back to their machine
```

Business meaning remains in supplied functions. The machine owns delivery policy. The interpreter owns resource execution. A callback with external effects is not made pure merely by placing its invocation inside a function called `step`.

## 2. Cascade composition: the useful restricted law

First restrict the subject to deterministic transducers that return finite words, have no hidden effects, and process one external event to completion before the next. Their intermediate alphabets must match.

```text
M: S₁ × E → S₁ × B*
N: S₂ × B → S₂ × C*
```

Extend N from one input to a finite input word:

```text
runN(q, []) = (q, [])

stepN(q, b)       = (q₁, outputs₁)
runN(q₁, rest)    = (q₂, outputs₂)
runN(q, [b, ...rest]) = (q₂, outputs₁ ++ outputs₂)
```

Then:

```text
stepM(s, e) = (s′, intermediate)
runN(q, intermediate) = (q′, output)

stepCompose((s, q), e) = ((s′, q′), output)
```

No intermediate output means that N does not react. Multiple intermediate symbols are processed in order, with N retaining its updated state between symbols. This is why a `next` followed by `complete` cannot be treated as one unstructured value.

Under those assumptions, a pass-through transducer is an identity, and cascade composition is associative up to rebracketing product states. This follows by folding the same intermediate symbols in the same order. It is not a claim that arbitrary effectful RxJS implementations can be fused without further obligations.

For a notification protocol, define terminal behavior explicitly. For an action alphabet containing `subscribe`, `cancel` and `schedule`, route commands to their owners; do not blindly feed every action to the next value-processing operator.

## 3. RxJS pipelines have a reverse lifecycle path

```text
notifications: source → filter → take → observer
cancellation: source ← filter ← take ← observer
```

`filter(isEven)` followed by `take(2)` must both emit the selected values and stop the upstream subscription after the second accepted value. Matching output arrays alone does not establish that cancellation occurred. `CAS-01` checks both notification marbles and source subscription marbles.

A pipeline model therefore needs a connection/resource graph in addition to the product of local operator states. In a scoped, non-reentrant abstraction, that graph may be summarized by ordered lifecycle actions. For exact synchronous behavior, model the relevant intermediate phases.

Initialization is a reaction too: `take(0)` completes without subscribing upstream (`TAK-01`). A wrapper driven only by upstream notifications cannot express that behavior unless it adds initialization semantics.

## 4. Feedback is an explicit execution policy

The useful idea is a feedback port, not an unqualified claim that all operators form a traced monoidal category.

Distinguish:

- **Subscription feedback:** `retry` and `repeat` request a new subscription.
- **Value expansion:** `expand` projects accepted values into new inner sources and routes their emissions through its admission policy.

A reset of a stored model variable is not a new source subscription. A source factory must actually execute, allocate fresh subscription-local state, and possibly emit synchronously. A shared or external producer might not restart at all.

For the numeric overloads with nonnegative integer counts:

| Operator | Count means | Boundary |
|---|---|---|
| `retry(k)` | Up to k retries after the initial attempt | `retry(0)` still subscribes once |
| `repeat(k)` | Up to k total subscriptions following successful completions | `repeat(0)` does not subscribe |

Do not reuse an identical counter convention for both. Delay notifiers, notifier completion/errors, and `resetOnSuccess` require their own profiles.

A feedback simulator must declare immediate/reentrant versus FIFO versus scheduler-driven dispatch, termination assumptions, and a step budget. Exceeding a budget means **inconclusive within the budget**, not a proof of divergence. A finite synchronous computation can exceed any fixed chosen budget.

Categorical trace laws remain a research direction: first define the morphisms, tensor, observable equivalence, and treatment of nontermination, then establish the laws. No such theorem is claimed here.

## 5. Corrected expand admission rule

The imported transcript proposes emitting a value immediately and queuing only its projection when concurrency is full. RxJS 7.8.2 does not do that. `mergeInternals` calls `doInnerSub(value)` only below the concurrency limit; otherwise it buffers the value. In expansion mode, downstream emission is inside `doInnerSub`.

For a positive integer concurrency limit, no deprecated scheduler argument, and non-reentrant external observations:

```text
Given the active inner count has reached the concurrency limit
When an outer or active-inner value arrives
Then append that value to the FIFO pending queue
Then emit no downstream notification
And the active inner set is unchanged
```

When a completed inner is finalized, available capacity admits queued work. Admission emits the value and invokes the projection to subscribe to its result. Completion requires outer completion, an empty queue, and no active inner work.

| Rule | Condition/event | Result | Evidence |
|---|---|---|---|
| EXP-A | Value arrives below the limit | Emit and begin projection/subscription | EXP-01 |
| EXP-B | Value arrives at the limit | Queue; neither emit nor project yet | EXP-01, EXP-02 |
| EXP-C | Inner completion releases capacity | Admit queued values in FIFO order | EXP-01, EXP-05 |
| EXP-D | Outer completes with work outstanding | Wait; do not complete yet | EXP-05 |
| EXP-E | Downstream cancels | Release subscriptions; no synthetic completion | EXP-03 |
| EXP-F | Projection throws | Error downstream; release owned subscriptions | EXP-06 |

This table is a selected rule set, not a complete six-tuple or an implementation recipe. In particular, RxJS emits the admitted value before incrementing the active count and invoking the projection; a reentrant observer may act between those microsteps. A model that commits all bookkeeping before running actions can disagree under reentry.

Synchronous unbounded expansion of `1 → [2,3]`, `2 → [4]` yields `1,2,4,3` in the characterized example. With concurrency one it yields `1,2,3,4` (`EXP-04`). Do not turn these examples into a universal DFS/BFS guarantee: order depends on source emissions, inner timing, concurrency and scheduling.

## 6. State ownership is per node, not one hot/cold label

A hot input can still feed a separate `scan` accumulator for each downstream subscription. Sharing a producer does not automatically share every operator's state.

Record an owner for each state-bearing node:

```text
subscription-local
shared connection generation
external producer / subject instance
```

Also record what recreates it. Default `share()` resets on source error, completion, and ref-count zero. Thus `source.pipe(scan(...), share(), retry(1))` can recreate upstream `scan` on retry (`SHR-01`). With `resetOnError: false`, a failed subject can instead repeat its cached terminal error without restarting the producer (`SHR-02`). Placement and reset configuration both matter.

For shared machines use subscriber-addressed actions:

```text
send(subscriberId, notification)
connect(connectionGeneration)
disconnect(connectionGeneration)
```

Generation IDs distinguish old connections and stale inner/timer events. Classify illegal events as excluded by the legal-domain model or handled by explicit robustness rules; do not silently switch interpretations.

## 7. Replay and connection state are separate

For the scoped count-only `shareReplay` model, distinguish subscribers, replay contents, terminal status, and connection generation. RxJS 7.8.2 configures it through `share` with:

```text
resetOnError        = true
resetOnComplete     = false
resetOnRefCountZero = refCount
```

`SR-01` to `SR-04` characterize active-source disconnection, retained connection, completed-cache reuse, and error reset. New subscription is lazy: assembling a pipeline does not connect its producer.

Two additional boundaries matter:

1. `ReplaySubject(0)` is not plain `Subject`: RxJS clamps replay capacity to at least one (`SUB-01`). A conceptual no-replay mode needs its own explicit mode flag.
2. A completed replay buffer is not necessarily frozen forever. With finite `windowTime`, expired entries are trimmed on later subscription, including after completion (`SUB-02`). The timestamp provider supplies `now()`; it does not imply a timer callback at every expiry.

For Subject, an ordered subscriber registry plus a broadcast snapshot/delivery position may be needed. Reentrant delivery can produce `A(1), A(2), B(2), B(1)` (`SUB-03`). Replacing it with a FIFO event queue changes this behavior.

## 8. What belongs in M01 schema design

Extend the planned schema with these fields before declaring M01 complete:

| Field | Required information |
|---|---|
| `scope` | Version, overload, parameters, callback assumptions, scheduler and reentry boundary |
| `initialization` | Fresh-state factory, initial ordered actions, whether source subscription occurs |
| `ownership` | State owner, resource graph, connection generation, reset conditions |
| `inputs` | Origin, identity/generation, notification/control distinction, legal-domain rules |
| `actions` | One ordered sequence of tagged notification and resource commands |
| `dispatch` | Immediate/reentrant, FIFO, or scheduled; cancellation checkpoints |
| `trace` | Sequence number, time/frame, machine ID, rule ID, before/after state, ordered actions |
| `evidence` | Obligation IDs, literal scenarios, test status, source links, exclusions |

Separate notifications and effects by tags **inside one ordered action list**. Two independent arrays lose ordering between `unsubscribe(old)`, `project(new)`, and `subscribe(new)`.

Keep the four-lane view: time, input, control state, output. Let traces carry machine and subscriber identities so the same view can show a selected operator, an entire pipeline, or one subscriber. This is a design for a future simulator, not a shipped visualizer.

## 9. Dependent types and evidence

Retain the existing dependent relation:

```text
Behavior :
  (state : S) →
  (event : E state) →
  Σ (nextState : S). Actions state event nextState
```

Ownership, active IDs and resource generations can constrain legal actions too. This types the model's behavior; it does not prove the interpreter or RxJS implementation correct. TypeScript discriminated unions can approximate some constraints, but are not a dependent proof assistant.

Likewise a Cω-style `reduce : T* → A!` needs the condition of successful source completion, a successful reducer, and no early cancellation. Error, cancellation, or a never-completing source may yield no accumulated value (`CAR-01` to `CAR-03`). Count next notifications, not all action symbols.

## 10. Acceptance gate

An imported model should be labelled **inspiration**, **specified**, **source-inspected**, or **runtime-checked**, with its scope. Do not promote polished prose, generated diagrams, or passing pure-model tests directly to full conformance.

Before a reusable interpreter is accepted, test initialization, callback throws, synchronous cancellation, terminal exclusivity, subscription-local state, state ownership, nested delivery, timer identity, shared resets and resource release. Use `ObservableNotification<T>` for notification object literals rather than the `Notification<T>` class type.

The next implementation milestone remains M01: one canonical schema and one end-to-end reference operator. This review supplies requirements and concrete counterexamples, not a replacement for that milestone.
