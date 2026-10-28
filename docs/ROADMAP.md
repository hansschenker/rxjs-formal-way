# Implementation checkpoints

This is the current implementation tracker. The migration map preserves the original broader consolidation plan.

| Checkpoint | Scope | Status |
|---|---|---|
| M00 | Formal method and reviewed composition/ownership guidance | Retained |
| M01 | Canonical contract, pure runner and take end-to-end profile | Accepted within scope; [65-test evidence](../evidence/M01.md) |
| M02-A | Indexed map/filter, explicit callback outcomes, 16 additional projections | Implemented; acceptance recorded in [M02 evidence](../evidence/M02.md) |
| M02-B | Seeded and unseeded scan, accumulator/index and throw behavior | Next; not implemented |
| M02-C | debounceTime, scheduler/timer identities and terminal policies | Planned; not implemented |
| M02-D | switchMap, inner generations, replacement and completion | Planned; not implemented |
| M02-E | share, connection ownership, subscribers and reset profiles | Planned; not implemented |
| M03+ | Broader generation, catalogue migration, family comparisons and visualization | Planned; not implemented |

M02 is not complete merely because M02-A is present. Its reference set includes take from M01 plus map, filter, scan, debounceTime, switchMap and share.

## Next checkpoint: M02-B

Reuse the callback-outcome protocol without evaluating a reducer in guards. Specify seeded and unseeded scan separately: the seed is not an automatic initial output, and unseeded scan's first source value is an initialization case. Verify reducer index conventions against the pinned implementation before encoding them.

Preserve the preexisting model, type, runtime and generation checks. Add literal expectations, rule reachability and independent source/subscription observations. Scope reentrancy and accumulator mutation explicitly rather than silently extending the atomic profile.
