# Implementation checkpoints

This is the current implementation tracker. The migration map preserves the original broader consolidation plan.

| Checkpoint | Scope | Status |
|---|---|---|
| M00 | Formal method and reviewed composition/ownership guidance | Retained |
| M01 | Canonical contract, pure runner and take end-to-end profile | Accepted within scope; [65-test evidence](../evidence/M01.md) |
| M02-A | Indexed map/filter, explicit callback outcomes, 16 additional projections | Accepted within scope; [119-test evidence](../evidence/M02.md) |
| M02-B | Seeded and unseeded scan, accumulator/index, seed aliasing and throw behavior | Implemented; acceptance recorded in [M02-B evidence](../evidence/M02-B.md) |
| M02-C | debounceTime, scheduler/timer identities and terminal policies | Next; not implemented |
| M02-D | switchMap, inner generations, replacement and completion | Planned; not implemented |
| M02-E | share, connection ownership, subscribers and reset profiles | Planned; not implemented |
| M03+ | Broader generation, catalogue migration, family comparisons and visualization | Planned; not implemented |

M02 is not complete merely because M02-A/B are present. Its reference set includes take from M01 plus map, filter, scan, debounceTime, switchMap and share.

## M02-B checkpoint

[M02-B](M02-B-SCAN.md) reuses schema 1.1 without changing earlier models, runner or renderer. The supplied seed is not automatically emitted; absent and explicit undefined seeds differ. Unseeded scan adopts its first value and invokes the reducer first at source index 1. Fresh bookkeeping does not imply cloned seed objects. The two scan profiles add 16 generated views, with scoped model/type/runtime checks.

## Next checkpoint: M02-C

Model debounceTime with explicit pending value, deadline and timer identity. Time and scheduled work come from a declared scheduler contract, not a hidden clock in a pure transition. Distinguish replacement, due-time delivery, completion flush, error discard and cancellation. State equal-time tie order and reentry limits explicitly. Verify source notifications, scheduled work and release independently against RxJS 7.8.2.

Preserve all existing model, type, runtime and generation checks. Do not silently replace actual scheduling behavior with FIFO dispatch or describe finite trace coverage as a universal proof.
