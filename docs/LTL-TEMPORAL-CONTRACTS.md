# LTL Temporal Contracts for RxJS Operator Behavior

## Purpose

Linear Temporal Logic (LTL) adds a **global behavior layer** to the existing RxJS Formal Way.

The canonical Mealy-style model answers:

> Given this state and this input event, what state and ordered actions follow?

An LTL temporal contract answers:

> Across every behavior permitted by that model, what must always hold, what must eventually hold, and what progress assumptions are required?

The intended division of responsibility is:

```text
Mealy / guarded rules
  local reaction semantics

LTL temporal contract
  global properties of complete behaviors

Test obligations
  executable witnesses for important properties

TLA+
  optional system-level temporal specification/model checking
```

The key rule is:

> **Mealy describes transitions. LTL describes behaviors.**

LTL is a complementary specification view. It does not replace the canonical model, guarded rules, STT, BDD, traces, or runtime evidence.

---

## 1. Behavior domain

A model execution produces a state sequence:

```text
b = s0, s1, s2, s3, ...
```

An operator temporal contract is interpreted over these behaviors.

Let:

```text
Behaviors(Op)
```

be all behaviors admitted by the scoped operator model, and let:

```text
TemporalContract(Op)
```

be the conjunction of its temporal properties.

Then the intended correctness statement is:

```text
for every behavior b in Behaviors(Op):
  b satisfies TemporalContract(Op)
```

or:

```text
Op ⊨ TemporalContract(Op)
```

In this repository that is a **specification criterion**, not yet a mechanically proved theorem about RxJS.

---

## 2. Finite RxJS executions and infinite LTL behaviors

Ordinary LTL is interpreted over infinite sequences.

RxJS executions may terminate by:

- downstream complete,
- downstream error,
- cancellation / unsubscribe.

For temporal reasoning, a terminated execution is extended by repeating its final quiescent state forever:

```text
s0, s1, ..., sN, sN, sN, sN, ...
```

This **terminal stutter extension** lets finite operator traces participate in the same temporal semantics as nonterminating executions.

Consequences:

- post-terminal silence is naturally expressible as an invariant;
- completed/error executions remain infinite for LTL interpretation;
- cancellation can be modeled as a closed quiescent state without inventing a downstream completion notification.

The repeated terminal state is an analysis convention. It is not an additional RxJS runtime action.

---

## 3. Minimal RxJS-LTL profile

Use a deliberately small subset unless a stronger formula is necessary:

```text
G P          always P
F P          eventually P
P U Q        P holds until Q

P -> Q       implication
!P           negation
P && Q       conjunction
P || Q       disjunction
```

### About X (next)

```text
X P
```

is intentionally non-primary.

`X` is sensitive to insertion of stuttering states. Since this project also uses Lamport-style behavior reasoning, prefer properties stated with state predicates, actions, `G`, `F`, and `U` when practical.

Use `X` only when the exact immediately-following modeled state is intentionally part of the contract.

---

## 4. Atomic propositions come from the canonical model

LTL does not intrinsically know about Observables, subscribers, timers, inners, queues, or values.

Atomic propositions must be derived from the canonical state/event/action vocabulary.

Representative propositions:

### Source / outer

```text
sourceNext(x)
sourceCompleted
sourceErrored(e)

outerNext(x)
outerCompleted
outerErrored(e)
```

### Inner

```text
innerActive(i)
innerCompleted(i)
innerErrored(i,e)
innerValue(i,x)
latestInner(i)
queued(i)
obsolete(i)
```

### Downstream

```text
output(x)
outputFrom(i)
outputCompleted
outputErrored(e)
```

### Lifecycle / resources

```text
subscribed(r)
released(r)
cancelled
closed
```

### Time

```text
timerArmed(id)
timerFired(id)
deadlineReached(id)
```

These predicates are projections of existing formal state and observations. They must not introduce behavior absent from the canonical model.

---

## 5. Safety

A safety property says that a prohibited behavior never occurs.

Typical form:

```text
G(P)
```

Examples:

### take(n)

```text
G(outputCount <= n)
```

### filter(predicate)

Within a scoped callback-result abstraction:

```text
G(output(x) -> accepted(x))
```

### switchMap

```text
G(outputFrom(i) -> innerActive(i))
```

and more specifically:

```text
G(outputFrom(i) -> latestInner(i))
```

### lifecycle

```text
G(closed -> !downstreamNotification)
```

where the proposition is interpreted at subsequent reaction points in the stutter-extended behavior.

Safety properties are especially useful because a violation normally has a finite counterexample prefix.

---

## 6. Liveness

A liveness property says that required progress eventually occurs.

Typical form:

```text
G(P -> F(Q))
```

Example:

```text
G(
  outerCompleted && noActiveInner && queueEmpty
  ->
  F(outputCompleted)
)
```

Liveness claims must not hide assumptions about sources, schedulers, or projected inners.

For example, this is too strong for concatMap:

```text
G(queued(i) -> F(innerActive(i)))
```

because the currently active inner may be `NEVER`.

The useful form is assumption/guarantee reasoning.

---

## 7. Assumptions and guarantees

Separate environmental progress assumptions from operator guarantees.

Example for concatMap:

```text
ASSUMPTION
Every active predecessor of queued item i eventually terminates.

GUARANTEE
Queued item i eventually becomes active.
```

Conceptually:

```text
EnvironmentAssumptions -> OperatorGuarantees
```

Typical assumptions can involve:

- source eventually emitting or terminating,
- active inner eventually terminating,
- scheduler eventually running eligible scheduled work,
- teardown actually stopping producer work when such a guarantee is claimed.

Do not turn an environment assumption into an operator guarantee.

---

## 8. Time-sensitive operators

Plain LTL gives temporal ordering, not metric duration.

A formula does not inherently know what `300 ms` means.

For operators such as:

- debounceTime,
- auditTime,
- throttleTime,
- delay,
- timeout,

the existing canonical model continues to own:

- clock readings,
- deadlines,
- timer identities,
- scheduler events,
- equal-time ordering.

LTL reasons over propositions derived from those events.

Example:

```text
G(
  pending(x) && timerFired(timerFor(x)) && deadlineReached(timerFor(x))
  ->
  F(output(x))
)
```

If quantitative-time formulas become necessary, evaluate Metric Temporal Logic separately rather than silently extending ordinary LTL syntax.

---

## 9. switchMap temporal fingerprint

The existing switchMap canonical model already provides the required state and resource identities.

A useful temporal contract includes:

### Current-inner safety

```text
G(outputFrom(i) -> innerActive(i))
```

### Latest-inner safety

```text
G(outputFrom(i) -> latestInner(i))
```

### Single-current-inner policy

```text
G(activeInnerCount <= 1)
```

### Obsolete-inner silence

```text
G(obsolete(i) -> !outputFrom(i))
```

### Completion progress

```text
G(
  outerCompleted && noActiveInner
  ->
  F(outputCompleted)
)
```

The local rule explains **why** an old inner is released. The LTL property states **what must never be observable afterward**.

---

## 10. Flattening policies as temporal contracts

The four higher-order policies can be contrasted by temporal invariants.

### mergeMap — allow overlap

```text
G(outputFrom(i) -> innerActive(i))
```

No general `activeInnerCount <= 1` property is imposed.

### concatMap — queue

```text
G(activeInnerCount <= 1)
```

Progress of queued items is conditional on predecessor termination.

### switchMap — only latest

```text
G(activeInnerCount <= 1)

G(outputFrom(i) -> latestInner(i))
```

### exhaustMap — ignore while busy

```text
G(activeInnerCount <= 1)

G(
  busy && outerNext(x)
  ->
  !projectionStartedFor(x)
)
```

These formulas are compact semantic fingerprints, not replacement implementations.

---

## 11. Temporal contract categories

For each operator, include only categories that add information.

### Safety
What must never happen?

### Preservation
Which accepted values/events must be preserved?

### Ordering
Which relative ordering constraints must hold?

### Concurrency
Which work may overlap?

### Cancellation
What becomes impossible after invalidation or teardown?

### Termination
Under which state conditions must completion/error occur?

### Liveness
What progress is eventually guaranteed?

### Assumptions
What environmental progress is required for those liveness claims?

Not every operator needs every category.

---

## 12. From temporal property to test obligation

A high-value integration path is:

```text
plain-language requirement
        ↓
LTL property
        ↓
test obligation
```

Example:

Plain language:

```text
An obsolete switchMap inner must never contribute downstream.
```

Temporal property:

```text
G(obsolete(i) -> !outputFrom(i))
```

Test obligation:

```text
Given inner A is active
And outer input B replaces A
When A's producer attempts another value
Then no downstream value from A is observed
```

The runtime test remains independent evidence. The LTL formula does not prove the implementation.

---

## 13. Relationship to invariants

Not every temporal property should be called an invariant.

A state invariant is typically an always-true state predicate:

```text
G(activeInnerCount <= 1)
```

Liveness is different:

```text
G(P -> F(Q))
```

The repository should keep these distinctions visible:

```text
State invariant
  always-valid state relation

Safety property
  prohibited behavior never occurs

Liveness property
  required progress eventually occurs
```

Some safety properties can be reduced to state invariants after enriching the model state. That is useful, but not mandatory.

---

## 14. Relationship to TLA+

LTL is the compact temporal-contract layer.

TLA+ is the stronger system-specification environment already being explored separately.

The intended relationship is:

```text
canonical state/action model
          ↓
LTL temporal contract
          ↓
TLA+ temporal formula / invariant / fairness condition
          ↓
optional model checking
```

Typical mapping:

- `G(P)` safety/state property -> candidate TLA+ invariant or temporal safety formula;
- `G(P -> F(Q))` -> temporal liveness property;
- environmental progress assumption -> candidate fairness assumption where justified.

Do not add fairness merely to make a desired liveness property pass. Fairness must correspond to an explicitly justified scheduler/environment assumption.

---

## 15. Integration rule for generated operator artifacts

At present, LTL is a documented formal layer, not a ninth generated projection.

Do **not** hand-edit files under `generated/`.

Until the generator has a canonical temporal-contract field, use the operator document/template and milestone guides to record temporal contracts.

A future generator extension should derive an artifact such as:

```text
generated/<operator>.ltl.md
```

only when:

1. propositions are derived from canonical model fields/actions,
2. formulas have stable identifiers,
3. assumptions are represented explicitly,
4. temporal properties can link to test obligations,
5. generation drift is checked like the other projections.

This preserves the repository rule that generated documents come from one canonical source rather than hand-maintained duplicates.

---

## 16. Recommended place in the formal workflow

The useful integration point is:

```text
Cω-style shape
      ↓
Mealy 6-tuple
      ↓
guarded rules
      ↓
BDD / STT / diagram
      ↓
invariants
      ↓
LTL temporal contract
      ↓
test obligations
      ↓
runtime evidence
      ↓
TLA+ / model-checking experiments where useful
      ↓
plain-language documentation
```

The ordering is conceptual rather than a requirement that every artifact be generated serially from the previous one.

---

## 17. Adoption criteria

An LTL property belongs in `rxjs-formal-way` when it:

- states a global behavior not already clear from one transition row,
- exposes safety, liveness, cancellation, ordering, or concurrency semantics,
- names assumptions instead of hiding them,
- can be traced back to canonical model state/events/actions,
- can motivate a concrete test obligation or formal check,
- does not duplicate implementation prose without adding precision.

The standalone study repository remains the place for broader LTL experimentation:

```text
hansschenker/rxjs-ltl
```

This repository adopts only the pieces that strengthen the canonical formal workflow.
