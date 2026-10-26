# Canonical RxJS Operator Document Template

Use this template for the canonical operator artifact.

The formal sections are for specification and derivation. The final plain-language section is the primary teaching outcome.

---

# `operatorName`

## 1. Purpose

One short paragraph: what flows over time, and what policy this operator applies.

## 2. Cω-style stream type

```text
operatorName : ...
```

Cardinality notes:

- `T!` exactly one
- `T?` zero or one
- `T+` one or more
- `T*` zero or more
- `(T*)*` nested streams when relevant

State explicitly where the signature is only an approximation.

## 3. Source and scope

- RxJS version: 7.8.2
- source file:
- source revision:
- configuration:
- scheduler:
- sharing:
- exclusions:

## 4. Behavior in one sentence

> ...

## 5. What flows over time

Describe the input values/notifications and the output values/notifications.

## 6. Input Controller

List the events that can make this operator react.

Example:

```text
source.next(value)
source.error(error)
source.complete
unsubscribe
timer.fire(id)
```

For higher-order operators identify outer/inner origin.

## 7. Remembered state

What information must survive from one event to the next?

Keep domain/business meaning out of the machine unless the operator itself owns it.

## 8. Action Policy

Describe what the operator may do when an event arrives.

Examples:

- emit value
- emit nothing
- complete
- error
- subscribe inner
- unsubscribe inner
- schedule timer
- cancel timer
- enqueue
- dequeue
- connect
- disconnect/reset

## 9. Formal six-component model

```text
M = (S, S₀, Z, A, T, G)
```

### S — State space

```text
...
```

### S₀ — Initial state

```text
...
```

### Z — Input alphabet

```text
...
```

### A — Output / observation alphabet

```text
...
```

### T — Transition function

```text
...
```

### G — Action/output function

```text
...
```

## 10. BDD behavior rules

```text
Given ...
When ...
Then ...
And ...
```

Repeat for each behaviorally distinct guarded transition or grouped equivalent rule.

## 11. State Transition Table

| ID | Current state | Input | Guard | Action / output | Next state |
|---|---|---|---|---|---|
| R1 | | | | | |

For detailed conformance work include lifecycle observations, state-reaching prefix, distinguishing suffix, and test IDs.

## 12. State diagram

Use a finite control-state projection if the full symbolic state is too large.

## 13. Representative execution trace

| t/frame | Input | Rule | State before | Output/effect | State after |
|---:|---|---|---|---|---|

## 14. Four-lane timeline

When useful:

```text
TIME
INPUT
CONTROL / STATE
OUTPUT
```

## 15. Time policy

Answer:

- Does the operator introduce or observe time?
- Which scheduler supplies it?
- Which timers/deadlines exist?
- What is cancelled/restarted?
- What assumptions exist for equal-time work?

If not time-sensitive, say so.

## 16. Concurrency policy

For flattening/orchestration operators identify the policy explicitly.

Examples:

- `mergeMap` — allow overlap
- `switchMap` — only latest
- `concatMap` — queue
- `exhaustMap` — ignore while busy

If not applicable, say so.

## 17. Cancellation and teardown

Describe:

- downstream unsubscribe
- upstream unsubscribe
- inner unsubscribe
- scheduled work cancellation
- resource cleanup
- stale emissions

## 18. Completion and error

Cover each origin separately where relevant:

- source/outer complete
- inner complete
- source/outer error
- inner error
- callback throw

## 19. Sharing / connection

For operators such as `share`, `shareReplay`, `connect`:

- execution owner
- connection trigger
- disconnect trigger
- replay
- reset policy
- refCount behavior

Otherwise: not applicable.

## 20. Invariants

List operator-specific and protocol invariants.

## 21. Test obligations

| Rule | State-reaching prefix | Event | Expected notifications | Expected lifecycle | Test ID |
|---|---|---|---|---|---|

## 22. Runtime evidence

Record:

- model test status
- RxJS test status
- comparison counts
- gaps
- reentrancy/timing limits
- source revision

## 23. Implementation intuition

Explain the minimum state + policy in practical RxJS terms.

Example form:

```text
Values arrive over time.
The operator remembers ...
When a new value arrives ...
The operator uses ... because ...
```

## 24. Operator Behavior in Plain Language

This is the final user-facing description.

It must stand alone and should not require knowledge of Mealy notation, BDD, STTs, or the implementation.

Include:

- initial condition
- behavior on values
- behavior while special state is active
- completion
- error
- cancellation where important
- time/concurrency policy where central

---

## Traceability rule

Every claim in the final plain-language behavior should be traceable to one or more formal transition rules and, where practical, to runtime evidence.
