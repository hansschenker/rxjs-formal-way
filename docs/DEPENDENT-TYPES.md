# Dependent Types: Typing the RxJS Operator Mealy Machine

## Core statement

> **Dependent Types in this project are used to type the Mealy machine of an RxJS operator.**

They do not merely type the operator's state. They type the whole legal behavioral relation:

```text
Behavior :
  (state : S) ->
  (event : E state) ->
  Σ (nextState : S).
    Actions state event nextState
```

Read left to right:

```text
state
  ↓ constrains
event
  ↓ constrains
next state
  ↓ constrains
actions
```

This gives a typed behavior space rather than a flat collection of unrelated state, event, and action types.

## Ordinary Mealy vs dependent Mealy

Ordinary form:

```text
S × E -> S × A
```

Dependent form:

```text
(state : S) ->
(event : E state) ->
Σ (nextState : S).
  Actions state event nextState
```

The dependent form can express that:

- not every event is legal in every state,
- not every next state is legal after every event,
- not every action is legal for every transition,
- invariants must remain true across transitions.

## Example: switchMap

Broad state space:

```text
Idle
Active(inner)
OuterCompleted(inner)
Done
```

State-indexed event families:

```text
Event Idle =
    OuterNext T
  + OuterComplete
  + OuterError Error

Event (Active inner) =
    OuterNext T
  + OuterComplete
  + OuterError Error
  + InnerNext inner R
  + InnerComplete inner
  + InnerError inner Error
```

This makes `InnerNext` unavailable when there is no active inner.

The key replacement transition is:

```text
Active(oldInner)
+
OuterNext(value)
        ↓
Active(newInner)
+
Unsubscribe(oldInner)
Subscribe(newInner)
```

and the invariant can be stated as:

```text
activeInners <= 1
```

A next state containing two active inners is therefore not a legal inhabitant of the behavior type.

## Position in the formal method

```text
Cω
= shape/cardinality of the dataflow

Dependent Types
= typing discipline for the operator Mealy machine

Mealy
= operational transition semantics

BDD
= human-readable transition projection

Four-lane diagram
= execution trace across time/input/state/output

Test cases
= executable conformance evidence
```

## Six-method view

```text
                 RxJS Operator
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
      Cω Type     Dependent Type    Mealy
        │              │              │
 dataflow shape    typed legal      operational
 & cardinality      behavior        semantics
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                      BDD
                       ↓
             human-readable behavior
                       ↓
             Four-lane diagram
                       ↓
                   Test cases
```

The methods are intentionally complementary. One semantic truth should produce multiple projections rather than multiple independent specifications.
