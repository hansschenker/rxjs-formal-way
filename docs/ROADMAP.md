# Implementation checkpoints

This is the current implementation tracker. The migration map preserves the original broader consolidation plan.

| Checkpoint | Scope | Status |
|---|---|---|
| M00 | Formal method and reviewed composition/ownership guidance | Retained |
| M01 | Canonical contract, pure runner and take end-to-end profile | Accepted within scope; [65-test evidence](../evidence/M01.md) |
| M02-A | Indexed map/filter, explicit callback outcomes, 16 additional projections | Accepted within scope; [119-test evidence](../evidence/M02.md) |
| M02-B | Seeded and unseeded scan, accumulator/index, seed aliasing and throw behavior | Accepted within scope; [171-test evidence](../evidence/M02-B.md) |
| M02-C | debounceTime, clock/deadline/wake-up distinction, timer identities and terminal policies | Implemented; acceptance recorded in [M02-C evidence](../evidence/M02-C.md) |
| M02-D | switchMap, inner generations, replacement and completion | Next; not implemented |
| M02-E | share, connection ownership, subscribers and reset profiles | Planned; not implemented |
| M03+ | Broader generation, catalogue migration, family comparisons and visualization | Planned; not implemented |

M02 is not complete merely because M02-A/B/C are present. Its reference set includes take from M01 plus map, filter, scan, debounceTime, switchMap and share.

## M02-B checkpoint

[M02-B](M02-B-SCAN.md) reuses schema 1.1 without changing earlier models, runner or renderer. The supplied seed is not automatically emitted; absent and explicit undefined seeds differ. Unseeded scan adopts its first value and invokes the reducer first at source index 1. Fresh bookkeeping does not imply cloned seed objects. The two scan profiles add 16 generated views, with scoped model/type/runtime checks.

## M02-C checkpoint

[M02-C](M02-C-DEBOUNCE-TIME.md) distinguishes the latest silence deadline from the already scheduled wake-up. New values replace memory; an early wake-up rearms for the remaining duration. Completion flushes; error and cancellation discard. Timer generations identify scheduled invocations, not physical Action objects. Equal-time order, deferred zero-delay scheduling and cleanup scope are explicit. A clock-aware trace wrapper checks timestamp consistency. Eight new views bring the total to 48.

## Next checkpoint: M02-D

Model switchMap using outer/inner origins, generation-qualified subscriptions, projection outcomes, replacement cancellation and completion waiting. Preserve the current clock/callback/resource distinctions. Determine the boundary for synchronous inner emissions and reentrancy before claiming equivalence; do not quietly substitute a FIFO execution policy.

Preserve all existing model, type, runtime and generation checks. Verify both notification sequences and subscription lifetimes. Finite coverage remains evidence, not a universal proof.
