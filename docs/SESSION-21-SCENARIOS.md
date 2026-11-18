# Session 21 — Scenario and verification map

This map connects the five exports' canonical rules with independently observed RxJS behavior. It is read with the [teaching guide](SESSION-21-TIME-AND-WINDOWS.md) and [evidence ledger](../evidence/SESSION-21.md). The implementation baseline is RxJS 7.8.2, pinned source revision [`e5351d02e225e275ac0e497c7b66eaa5f0c88791`](https://github.com/ReactiveX/rxjs/tree/e5351d02e225e275ac0e497c7b66eaa5f0c88791).

## Scenario ownership

| Family | Detailed scenarios and six-tuples | Model checks | Native expectations | Differential comparisons |
|---|---|---|---|---|
| Clock readings | [timeInterval and timestamp](SESSION-21-CLOCKS.md) | [Clock model tests](../tests/session21-clock-model.test.mjs) | [Clock RxJS tests](../tests/session21-clock-rxjs.test.mjs) | [Clock comparisons](../tests/session21-clock-differential.test.mjs) |
| Deadlines and replacement | [timeout and timeoutWith](SESSION-21-TIMEOUTS.md) | [Timeout model tests](../tests/session21-timeout-model.test.mjs) | [Timeout RxJS tests](../tests/session21-timeout-rxjs.test.mjs) | [Timeout comparisons](../tests/session21-timeout-differential.test.mjs) |
| Window routing and ownership | [window](SESSION-21-WINDOW.md) | [Window model tests](../tests/session21-window-model.test.mjs) | [Window RxJS tests](../tests/session21-window-rxjs.test.mjs) | [Window comparisons](../tests/session21-window-differential.test.mjs) |

The family guides map individual scenario obligations to named tests and state their domains. Rule identifiers in generated obligation lists identify canonical guarded transitions; they are not automatically literal native test titles. Use the family mappings and witnessed-rule assertions to resolve that relationship.

## What is checked

| Evidence layer | Supported claim | Boundary |
|---|---|---|
| Pinned source/spec inspection | Which implementation branches and upstream expectations informed the models. | Reading upstream specs does not mean executing the upstream RxJS suite. |
| Model tests | Selected state invariants, mutually exclusive guards, legal actions, rejection of stale or invalid events, and reachable rules. | Structural consistency is separate from native agreement. Finite witnesses do not enumerate every state. |
| Native tests | Actual notification values/identities, event order, clock reads, deadline behavior and resource lifetimes under independent expectations. | Each expectation applies to its declared scenario and execution assumptions. |
| Differential tests | Agreement between independently captured native actions and model predictions for finite scenario sets. | Execution counts need not count distinct histories and are not unrestricted equivalence proofs. |
| [Negative type assertions](../tests/types/session21-clock.ts) and [timeout](../tests/types/session21-timeout.ts) / [window](../tests/types/session21-window.ts) assertions | Selected malformed configurations, states and events fail strict TypeScript checking. | Compiler checks are counted separately from named runtime tests. |
| [Artifact navigation tests](../tests/session21-artifacts.test.mjs) | Exactly five indexes group the eleven configured examples and resolve the required local evidence/model/test/artifact links. | Navigation consistency does not substitute for execution evidence. |
| Normal generation drift check | All committed projections equal the deterministic outputs of the current canonical models and examples. | Generated traces remain model predictions. |

## Generated examples and reading order

Begin at [timeInterval](../operators/timeInterval-index.md), [timestamp](../operators/timestamp-index.md), [timeout](../operators/timeout-index.md), [timeoutWith](../operators/timeoutWith-index.md), or [window](../operators/window-index.md). The first two have one generated example each; timeout has four; timeoutWith has two; window has three histories of the same semantic profile. All five use the standard eleven-step inspection path.

Time, cancellation and ownership must be read together. A provider read does not schedule delivery. A cancelled timer's generation cannot authorize a later model event. A replacement stream has its own connection lifetime. Window boundary completion does not act like a boundary next, and outer disposal does not imply that an inner observer received completion. The detailed native scenarios check those distinctions directly.

Actual named-test counts, comparison-execution counts, initial corrections, accepted profiles and exact local/CI revision provenance are maintained in [the evidence ledger](../evidence/SESSION-21.md), rather than inferred from the number of generated pages.

## Test and finite comparison counts

| Family | Named model/native/differential tests | Finite comparison executions | Negative type assertions |
|---|---:|---:|---:|
| Clock readings | 19 + 17 + 2 = 38 | 288 per export; 576 total | 12 |
| Deadlines and replacement | 29 + 24 + 2 = 55 | 432 timeout + 216 timeoutWith = 648 | 16 |
| Window routing | 15 + 17 + 1 = 33 | 1,500 | 12 |

Together with two artifact-navigation tests, these add **128 named tests** and **40 compiler rejection assertions**. The finite differential total is **2,724 comparison executions**. The complete repository suite is **1,544 named tests**. These inventories are tied to executed results and exact revisions in the ledger; comparison count does not mean unique-history count or exhaustive equivalence.
