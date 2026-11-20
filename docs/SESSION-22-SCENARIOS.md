# Session 22 — Scenario and verification map

The [teaching guide](SESSION-22-WINDOW-POLICIES.md) explains the policies; the [evidence ledger](../evidence/SESSION-22.md) owns executed results, exact revisions and acceptance. All models target RxJS 7.8.2 at pinned revision `e5351d02e225e275ac0e497c7b66eaa5f0c88791`. Generated traces are predictions, while native tests observe the installed runtime independently.

## Required behavior and its evidence

| Export | Required scenarios | Model tests | Independent runtime observations | Direct comparisons |
|---|---|---|---|---|
| `windowCount` | Initial handle; count/stride overlap and gaps; deliver-close-open order; no replay; source terminals; late completed/failed handles; orphan consumers on outer cancellation. | [Guards and witnesses](../tests/session22-windowCount-model.test.mjs) | [Native tests](../tests/session22-windowCount-rxjs.test.mjs) | [2,916 executions](../tests/session22-windowCount-differential.test.mjs) |
| `windowTime` | Sequential restart; periodic overlap/adjacency/gaps; maximum-size closure; deadlines and timer generations; both same-time enqueue orders; initial versus later timer ownership; retained handles. | [Guards and witnesses](../tests/session22-windowTime-model.test.mjs) | [Native tests](../tests/session22-windowTime-rxjs.test.mjs) | [432 executions](../tests/session22-windowTime-differential.test.mjs) |
| `windowToggle` | Opening and selector outcomes; independent overlapping closers; empty closer completion; opening completion; source/closing/selector error versus opening error; current-handle disposal and independent child cleanup. | [Guards and witnesses](../tests/session22-windowToggle-model.test.mjs) | [Native tests](../tests/session22-windowToggle-rxjs.test.mjs) | [2,592 executions](../tests/session22-windowToggle-differential.test.mjs) |
| `windowWhen` | Initial and replacement factory outcomes; next/complete rotation; old closer before old-window completion; generation-dependent cleanup; initial factory error and closed source attempt; orphaned versus terminal handles. | [Guards and witnesses](../tests/session22-windowWhen-model.test.mjs) | [Native tests](../tests/session22-windowWhen-rxjs.test.mjs) | [1,876 executions](../tests/session22-windowWhen-differential.test.mjs) |
| `withLatestFrom` | Auxiliary-before-source acquisition; readiness including undefined; early source discard; auxiliary-only updates; cached completion; empty auxiliary; source-only output; ordered cleanup; independent subscriptions. | [Guards and witnesses](../tests/session22-withLatestFrom-model.test.mjs) | [Native tests](../tests/session22-withLatestFrom-rxjs.test.mjs) | [4,500 executions](../tests/session22-withLatestFrom-differential.test.mjs) |

The five differential definitions enumerate **12,316 finite model/native comparison executions**. Their adapters record actual RxJS first and use actual subscriber/handle state for command admission, then replay that history through the model. They compare supported ordered actions and times, not only final values. Some combinations yield repeated histories. The additional plain-TestScheduler runs for `windowTime` check instrumentation transparency and are not counted again as model/native comparisons.

## Timing, cancellation and scope

`windowTime` inputs carry supplied scheduler time, and its wrapper enforces agreement with the trace envelope. The external scheduler supplies FIFO ordering; the model checks current identities, deadlines, time and generation/tick consistency. The `windowToggle` and `windowWhen` wrappers require correlated factory outcomes at the same envelope time as their invocation. No user function or scheduler runs inside a pure model transition.

Window consumer subscriptions are independently owned. Cancellation can release inputs without completing children; invalidated handles, open orphaned handles and terminal historical handles are distinct cases. The family guides document these distinctions. Scalar latest-value gating owns its auxiliary subscriptions and releases live auxiliaries in argument order before the source.

Native-only tests can characterize synchronous setup, finite synchronous closing behavior, optional projector overloads or invalidated handle subscription without extending the canonical model's legal event alphabet. Read each guide's exclusions before treating a result as an accepted profile. All models exclude arbitrary reentrancy, throwing producer/observer teardown and unrestricted infinite-run equivalence.

## Type and inspection contracts

Negative compiler assertions are separate from runtime test counts: [count](../tests/types/session22-windowCount.ts), [time](../tests/types/session22-windowTime.ts), [toggle](../tests/types/session22-windowToggle.ts), [when](../tests/types/session22-windowWhen.ts), and [latest](../tests/types/session22-withLatestFrom.ts). The unchanged project compiler checks them with strict settings.

Two [artifact tests](../tests/session22-artifacts.test.mjs) verify all five public inspection indexes, exact membership of fifteen examples, all eleven navigation steps, correct pinned source/spec links, native/model/differential test links, and nonempty local targets. The normal generation drift check owns byte-for-byte projection consistency and canonical trace replay.

Fifteen examples × eight views plus five indexes give **125 Session 22 projections**. Multiple configured histories remain part of the same operator export. The original partial work committed 42; the continuation contributes 83 new files and updates affected earlier projections after corrections. Successful committed CI and a separate read-only run are required for final acceptance.
