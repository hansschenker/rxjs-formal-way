# raceWith: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Race source and other Observables, cancel losing sources on the first next; early error/complete terminates.

**Scope:** 0..32 additional ordinary Observable inputs; race legacy array/variadic overloads normalized to same candidate order.. Atomic non-reentrant post-setup notifications; every input subscribed in source-first argument order before delivery.

**Dataflow shape:** `raceWith : (T0*, T1*, ..., Tn*) -> (T0 | ... | Tn)*`. The first next from any input elects exactly one winner and the winner contributes all later next values. An error or completion before any next terminates immediately even if another input may have produced a value later. After first next, only the winning source may complete or error the result.

<!-- S17-RACEWITH-SUBSCRIBE -->
Each observer owns one independent race; no producer is shared.

<!-- S17-RACEWITH-FIRST-NEXT -->
Only a next notification elects a winner. Losing subscriptions are cancelled synchronously and never resume.

<!-- S17-RACEWITH-WINNER-NEXT -->
Once a winner is chosen all its subsequent values are forwarded; first value is not the end of the race subscription.

<!-- S17-RACEWITH-EARLY-COMPLETE -->
A completion before any first next closes the downstream subscriber. It does not select a continuing winner.

<!-- S17-RACEWITH-EARLY-ERROR -->
A failure before a first value fails the result and tears down every live candidate.

<!-- S17-RACEWITH-WINNER-COMPLETE -->
Completion from the selected winner terminates the result.

<!-- S17-RACEWITH-WINNER-ERROR -->
The winner is not protected from subsequent errors.

<!-- S17-RACEWITH-CANCEL-RACE -->
Downstream owns the subscriptions and may cancel them all.

<!-- S17-RACEWITH-CANCEL-WINNER -->
Cancellation is distinct from successful or failed termination.

**Time:** Notifications are ordered by source/scheduler arrival. Race itself creates no timers or scheduler.

**Sharing:** No sharing; each downstream subscription creates a new race across inputs.

**Callbacks:** No user callbacks or result selectors; opaque input values preserve identity.

**Excluded:** Synchronous emission/completion/error during subscription acquisition, which may prevent later candidate subscriptions. Promises/iterables, errors during input conversion, observer reentrancy, throwing teardown and scheduler-specific interleavings.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-17.md) is reported separately from this specification.
