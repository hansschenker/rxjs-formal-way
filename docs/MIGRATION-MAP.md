# Migration Map

This file records which ideas should be preserved from the existing Mealy-related repositories and how they fit into `rxjs-formal-way`.

The goal is **conceptual consolidation**, not blind file copying.

## 1. rxjs-mealy-analysis

### Preserve

- notification-complete analysis
- explicit `subscribe` / `unsubscribe`
- distinction between notifications and lifecycle/control events
- symbolic-vs-finite modeling honesty
- structured ordered response records
- guarded STT methodology
- state-reaching prefixes and distinguishing suffixes
- lifecycle assertions
- coverage/evidence terminology
- reentrancy boundary
- official-test-suite auditing methodology

### Destination

- `docs/FORMAL-METHOD.md`
- future `docs/TESTING.md`
- future `evidence/`
- canonical operator schema

### Important correction retained

“Every row = one test” is too strong.

Canonical rule:

> Every reachable, behaviorally distinct row creates a minimum test obligation; one obligation may require multiple concrete tests.

---

## 2. rxjs-operator-mealy-analysis

### Preserve

- broad RxJS 7.x operator catalogue
- per-operator artifacts
- plain-language-first treatment
- six components
- category organization
- per-operator test plans
- custom operator checklist/template
- source pinning

### Destination

- `operators/`
- `docs/OPERATOR-DOCUMENT-TEMPLATE.md`
- operator migration catalogue

### Migration strategy

Do not initially copy all 136 analyses unchanged.

First migrate a small reference set and normalize the semantic schema:

- `map`
- `filter`
- `take`
- `scan`
- `debounceTime`
- `switchMap`
- `share`

These cover stateless transformation, filtering, bounded state, accumulation, time, higher-order cancellation, and sharing.

---

## 3. rxjs-operator-mealy-tuples

### Preserve

- rigorous extended six-tuple vocabulary
- `G : S × Z → A*`
- same pre-input state for `T` and `G`
- distinction between fixed parameters and machine state
- Model → Observe → Classify discipline
- execution contract
- generated tables/diagrams/traces
- family-level organization
- validation/evidence discipline
- model-vs-runtime separation

### Destination

- canonical semantic schema
- `model/`
- `generated/`
- `evidence/`
- family classification docs

### Strong idea to retain

The six-tuple is the **semantic microscope**, not necessarily the user-facing notation.

---

## 4. rxjs-mealy-to-testcase

### Preserve

- reachable state × admissible event
- behaviorally distinct rows
- minimum test obligations
- test naming derived from behavior
- clear distinction between input events and operator actions
- `switchMap` worked example

### Destination

- future `docs/TESTING.md`
- generated test plans
- per-operator test traceability

### Canonical pipeline

```text
Formal model
  → STT
  → obligation
  → concrete state-reaching scenario
  → RxJS assertion
```

---

## 5. bdd-to-mealy

### Preserve

- Convertible BDD
- Mealy-DSL
- deterministic parser direction
- shared semantic `MealyRule`-like intermediate model
- machine validation
- reachability/completeness analysis
- RxJS runtime experiment
- Action Policy terminology

### Destination

- BDD projection/generator
- future parser/generator package under `src/`
- canonical semantic schema

### Important architectural adjustment

In `rxjs-formal-way`, BDD should usually be treated as a **projection of the canonical operator model**.

For domain-first workflows, BDD may still be an input that parses into the same model.

Therefore both directions remain useful:

```text
BDD → semantic model
semantic model → BDD
```

Round-trip consistency becomes testable.

---

## 6. rxjs-comega-type-notation-and-mealy-machine-tuples

### Preserve

- Cω stream cardinality notation
- static-vs-dynamic semantic distinction
- state transition tables
- concrete execution traces
- four-lane timeline
- test derivation examples
- worked time/concurrency operators

### Destination

- operator header/type section
- timeline generator
- teaching diagrams

### Important limitation

Do not claim a simple universal theorem that stream cardinality is fully determined by per-input `|G|`. Higher-order operators, completion-dependent operators, errors, cancellation, timing, and nonlocal state require richer reasoning.

Cω remains a useful compact **static lens**, while the formal model describes dynamic execution.

---

## 7. rxjs-from-mealy-to-documentation-claude

### Preserve

- final “Operator Behavior in Plain Language” outcome
- emphasis on user-readable operator descriptions
- full operator documentation catalogue as a target

### Destination

- final section of each canonical operator page
- generated documentation views

### Principle

The formal machinery should disappear from the reader's path when they only want to know what an operator does.

---

# Unified ownership of truth

The final repository should have one direction of authority:

```text
Pinned behavior/source evidence
          ↓
Canonical semantic model
          ↓
Derived views
```

Derived views:

```text
Cω signature
BDD scenarios
STT
state diagram
trace
timeline
test plan
plain-language description
```

Runtime tests are not another derived truth. They are **evidence compared against the model**.

```text
model prediction  ↔  RxJS observation
```

# Migration phases

## M00 — Foundation

- README
- formal method
- migration map
- operator document template

## M01 — Canonical schema

Define TypeScript types / JSON schema for:

- operator identity/configuration
- state description
- input alphabet
- output/action alphabet
- guarded transitions
- lifecycle effects
- timing assumptions
- source references
- evidence links

## M02 — Reference operators

Migrate end-to-end:

1. map
2. filter
3. take
4. scan
5. debounceTime
6. switchMap
7. share

## M03 — Generators

Generate:

- BDD
- STT Markdown
- Mermaid state diagram
- execution traces
- test-obligation Markdown
- operator plain-language skeleton

## M04 — Runtime conformance

Add RxJS 7.8.2 tests and evidence records.

## M05 — Full catalogue migration

Normalize remaining operator analyses into the canonical schema.

## M06 — Family classification

Group reusable machine patterns:

- stateless transform
- value gate
- prefix/bounded selection
- adjacent-value memory
- accumulation
- completion-triggered aggregate
- timing gate
- buffering/windowing
- higher-order concurrency
- join/readiness
- error/retry/repeat
- multicasting/connection

# Repositories remain as provenance

The previous repositories should not be deleted merely because this repository exists. They document how the method evolved and preserve source-specific authorship and experiments.

`rxjs-formal-way` becomes the maintained synthesis.
