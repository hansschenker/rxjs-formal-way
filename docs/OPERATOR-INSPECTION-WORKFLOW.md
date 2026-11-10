# RxJS Operator Inspection Workflow

Every modeled public operator export now has a generated inspection index at:

`operators/<operator>-index.md`

The index is the navigation spine for the operator. It does not add a second specification; it links the existing projections of the canonical semantic model to the independent implementation and verification evidence.

## Three passes

### Pass 1 — Understand

1. Operator Overview
2. State Diagram
5. Concrete Trace

Question: **What is the behavioral story?**

### Pass 2 — Specify

3. State Transition Table
4. BDD Scenarios
7. Formal Manifest
8. Canonical Mealy Model

Question: **What exactly is the allowed behavior?**

### Pass 3 — Verify

9. Pinned RxJS 7.8.2 Source
10. Model and native RxJS Tests
6. Verification Obligations
11. Evidence Ledger

Question: **Why should I trust this characterization within its declared scope?**

## The eleven inspection steps

| # | Artifact | Question |
|---:|---|---|
| 1 | Operator Overview | What does this operator do? |
| 2 | State Diagram | What states can the operator be in? |
| 3 | State Transition Table | What happens for every legal state/event combination? |
| 4 | BDD Scenarios | How can the rules be read as Given–When–Then behavior? |
| 5 | Concrete Trace | How does one execution unfold over time? |
| 6 | Verification Obligations | What claims must be checked? |
| 7 | Formal Manifest | What is the complete machine-readable specification? |
| 8 | Canonical Mealy Model | How is the semantics encoded as executable guarded rules? |
| 9 | RxJS 7.8.2 Source | What does the pinned implementation actually do? |
| 10 | Tests | Does the model satisfy its rules, and does native RxJS exhibit the scoped behavior? |
| 11 | Evidence Ledger | What was actually executed, verified, accepted, and excluded? |

## Relationship to the project backbone

[
State \rightarrow Step \rightarrow Trace \rightarrow Behavior
\rightarrow Specification
\rightarrow Implementation \rightarrow Verification
]

The inspection workflow maps repository artifacts onto that chain. The intent is to make the formal material navigable without reducing its precision.

## Multiple profiles

One public export can have several modeled profiles. For example, `scan` has seeded and unseeded profiles. The generated `operators/scan-index.md` groups both profiles under one export-level navigation page and links the corresponding behavior, diagram, STT, BDD, trace, obligations and manifest artifacts.

## Reference example

Use [audit-index.md](../operators/audit-index.md) as the reference inspection page.


## Session integration rule

Beginning with **Session 14** and continuing through **Session 23**, the inspection index is generated and accepted **inside the same operator session**. For each selected export, the session is incomplete until `operators/<operator>-index.md` is present, points to the session's canonical model/tests/evidence, and passes the same committed-file drift verification as the other generated projections.

This does not change the five-export daily limit. The index is a navigation projection of the same canonical model, not an additional operator or specification.
