# mergeWith corrective evidence

**12 November 2026 · Europe/Zurich · scoped refinement, not a new generation session.**

Base repository commit: `be45d527667150a494626a422e9e570d097bbac5`. Pinned RxJS revision: `e5351d02e225e275ac0e497c7b66eaa5f0c88791` (7.8.2). Historical [Session 15 evidence](SESSION-15.md) remains unchanged; this record supersedes its mergeWith rule-specialization and physical final-completion-order claims only after the checks below are retrieved.

## Changes under verification

Remove unreachable REFILL, omit COMPLETE-WAIT for a one-input profile, enforce empty pending subscriptions, and specify actual next-state updates. For registered input teardown after setup, release the final input before completing the result. Other operator models are unchanged.

Add eighteen concrete scenarios with independent golden output expectations, a native RxJS runner that records ordered values/time/subscriptions/teardowns, named retained-rule witnesses, and bounded representative-state exploration for one through four total inputs. Classify all 22 pinned upstream test bodies: sixteen adapted model/native witnesses, four native-only characterizations and two mergeAll bodies excluded from mergeWith coverage. The upstream test file itself is not executed by this project.

Add three deterministic scenario projections to the existing generation and drift-check commands. Keep the eleven-entry operator inspection index, linking Rule BDD, Scenario BDD, coverage and this ledger. The canonical generator remains responsible for the normal nine mergeWith views.

## Execution status

**Pending.** No newly authored test or refinement is accepted solely because it is committed. Exact tested checkouts, CI run/job conclusions, test counts, generation checks and observed lifecycle logs will be recorded after retrieval. The implementation PR may fail its pre-generation drift gate until updated generated files are committed by the established main workflow; such a run will not be labeled successful.

## Scope and follow-up

Atomic source acquisition; externally delivered Observable notifications after teardown registration; no reentrant or throwing observers/finalizers. Arrays and synchronous acquisition/cancellation remain native-only. Equal-time ordering is fixture-specific. Silence tests observe finite windows. Bounded representative-state exploration is not a universal proof. The general merge base and other specialized profiles need their own cleanup-order/reachability review; this change does not silently certify or modify them.

See the [refinement guide](../docs/REFINEMENT-MERGEWITH.md), [scenario registry](../src/scenarios/mergeWith.ts), [comparison tests](../tests/mergeWith-refinement.test.mjs), and [coverage projection](../generated/mergeWith.coverage.md).
