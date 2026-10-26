# Formal Method

## Purpose

The purpose of the RxJS Formal Way is to make operator behavior:

- explicit,
- traceable,
- readable,
- testable,
- comparable with the actual RxJS runtime.

The method separates **specification** from **evidence**.

A model predicts behavior. A runtime test observes behavior. Agreement increases confidence; it is not a mathematical proof of the implementation.

## 1. Pin the subject

Before analysis, record:

- RxJS version
- source file / revision
- operator configuration
- scheduler assumptions
- sharing assumptions
- scope exclusions

The baseline for this repository is RxJS 7.8.2.

## 2. State the behavioral contract

Start in plain language.

Ask:

- What flows over time?
- What happens when a new value arrives?
- What happens on complete?
- What happens on error?
- What happens on cancellation?
- What state must be remembered?
- Does time create new input events?
- Does the operator own subscriptions, timers, queues, or buffers?
- Is execution cold, shared, or otherwise connection-sensitive?

## 3. Build the six-component model

```text
M = (S, S₀, Z, A, T, G)
```

### S — State space

Keep only information that can change future observable behavior.

Examples:

- seen count
- previous value/key
- accumulator
- pending value
- buffer
- active inner subscription identity
- queue of projected inners
- outer-completed flag
- timer identity / deadline
- connection/refCount/reset state

### S₀ — Initial state

State immediately after execution begins, including any initialization that happens before the first source notification.

### Z — Input alphabet

Events that can cause a reaction.

Typical categories:

```text
Lifecycle
  subscribe
  unsubscribe

Source
  next(value)
  error(error)
  complete

Higher-order
  outer.next(value)
  inner.next(id, value)
  inner.complete(id)
  ...

Time
  timer.fire(id)

User callback
  callback.return(value)
  callback.throw(error)
```

Do not confuse operator actions with external input events. For example, “unsubscribe old inner” is normally an Action Policy of `switchMap`, not an independent input.

### A — Output / observation alphabet

Possible observable responses:

- downstream `next`
- downstream `error`
- downstream `complete`
- subscribe/unsubscribe resource observations
- timer scheduling/cancellation observations
- connection/reset observations where relevant

Outputs are ordered. One input can produce zero or many outputs.

### T — Transition function

```text
T(state, event) = nextState
```

### G — Action / output function

```text
G(state, event) = ordered outputs/effects
```

`T` and `G` use the same pre-event state.

## 4. Use symbolic models honestly

RxJS operators often do not form small finite automata.

Examples:

- arbitrary JavaScript payloads
- unbounded counters
- arbitrary buffers
- queues
- sets of active inner subscriptions
- deadlines

Call these **symbolic extended Mealy-style models** when that is what they are.

A finite control-state projection may still be useful for diagrams.

## 5. Add guards and partitions

A single event type may behave differently under different conditions.

Examples:

```text
take:
  seen < n - 1
  seen = n - 1

distinctUntilChanged:
  first value
  comparator says equal
  comparator says different

switchMap:
  no active inner
  active inner
  outer already completed
```

Guards should be mutually exclusive and sufficiently complete for the declared scope.

## 6. Derive the State Transition Table

Minimum row:

```text
ID
Current state
Input event
Guard
Actions / outputs
Next state
```

Conformance row:

```text
ID
Current state + stored data
Input + origin
Guard / precondition
Ordered notifications
Lifecycle/resource observations
Next state + data update
State-reaching prefix
Optional distinguishing suffix
Test IDs
Evidence status
Exclusions
```

Only reachable/admissible combinations are semantic obligations. Impossible environment events can be excluded or modeled via an explicit sink, but the choice must be stated.

## 7. Produce BDD from the same row

Canonical form:

```text
Given <current state>
When <event>
Then <action>
Then <action>
And <next state>
```

The words are a projection:

| BDD | Formal role |
|---|---|
| Given | current state / precondition |
| When | input event |
| Then | Action Policy / observable response |
| And | next state |

This representation is intended for human reading and documentation.

## 8. Produce traces

Drive the STT with concrete event sequences.

Trace entry:

```text
time
input
row fired
state before
ordered outputs/effects
state after
```

The row ID provides direct traceability back to the formal specification.

## 9. Produce the four-lane timeline when useful

```text
Lane 1  Time / scheduler
Lane 2  Inputs
Lane 3  State / control policy
Lane 4  Outputs
```

Use it especially for:

- debounce/audit/throttle/sample
- buffering/windowing
- flattening/concurrency
- delayed/repeated/retried work
- connection/refCount/reset behavior

## 10. Derive test obligations

Rule:

> Every reachable, behaviorally distinct transition creates a minimum test obligation.

A concrete test should:

1. establish a fresh execution
2. reach the target state through the public protocol
3. deliver the target event
4. assert ordered notifications
5. assert lifecycle/resource consequences
6. optionally continue with a suffix that distinguishes the resulting state

One row can require multiple tests when its guard contains important partitions or execution-sensitive behavior.

## 11. Separate model tests and RxJS tests

### Model tests

Check that the formal artifact itself is internally consistent.

Examples:

- rule lookup
- state changes
- output words
- totality over declared reachable partitions
- conflicting guards
- generated artifact consistency

### RxJS runtime tests

Observe the real operator.

Use:

- `TestScheduler` for virtual-time traces
- subscription assertions
- imperative tests for synchronous producers and reentrancy
- explicit teardown/resource instrumentation
- independent expected values where possible

Do not generate both implementation and expected oracle from the same logic and call that independent evidence.

## 12. RxJS lifecycle invariants

At minimum consider:

### Notification protocol

```text
next* (error | complete)?
```

### Terminal exclusivity

Do not emit both error and complete downstream.

### Post-terminal silence

No further downstream notifications after termination.

### Cancellation is distinct

`unsubscribe()` is teardown, not a downstream `complete` notification.

### Resource ownership

Track when upstreams, inners, timers, queues, windows, and connections are acquired and released.

### Sharing

For `share`, `shareReplay`, `connect`, etc., name:

- who owns the shared execution
- when connection starts
- when it stops
- reset policy
- replay policy

## 13. Time and scheduling

Time-sensitive behavior must declare:

- scheduler
- timer/deadline events
- equal-time ordering assumptions
- cancellation of scheduled work

A scheduler is treated as a clock plus a mechanism for scheduling work against that clock.

Time orders events across time points; scheduling determines the execution order of work that is ready at the same or comparable time point.

## 14. Reentrancy boundary

A simple atomic transition model assumes an event is processed to quiescence before the next event.

Synchronous callbacks may re-enter during notification delivery.

Where reentrancy matters, either:

- refine the state machine with delivery phases / nested-entry events, or
- state the boundary and add separate runtime characterization tests.

Marble diagrams alone do not establish call-stack nesting.

## 15. Static cardinality companion

Cω cardinality notation gives a compact static lens:

```text
T!  exactly one
T?  zero or one
T+  one or more
T*  zero or more
```

This can be placed at the top of an operator page.

The cardinality signature is descriptive, not a replacement for temporal/lifecycle semantics.

## 16. Documentation is a projection, not an independent source

The final operator description should be generated or reviewed against:

- states
- guards
- transitions
- outputs
- lifecycle effects
- test evidence

The plain-language section should answer what the operator does without requiring knowledge of Mealy machines.

## 17. Acceptance principle

An operator analysis is strong when:

- its scope is explicit
- the necessary state is explicit
- input origins are explicit
- transitions are traceable
- cancellation and lifecycle are not hidden
- timed behavior has scheduler assumptions
- BDD and prose agree with the formal rows
- tests cover the reachable behavior partitions
- runtime evidence is recorded separately
- known limitations remain visible
