# first: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Emit the first source value, or first predicate match; on successful exhaustion emit an explicit default or error with EmptyError.

**Scope:** predicate supplied; no default supplied. One pending predicate outcome at a time.

**Dataflow shape:** `first(P?,D?) : T* -> (T|D)?`. At most one next value is emitted. Predicate mode short-circuits on first truthy result; direct mode short-circuits on first source value. Cω counts next values; terminal notifications, cancellation and resource release are separate obligations.

<!-- FIRST-INIT -->
First waits for the first admissible value.

<!-- FIRST-DIRECT -->
Without a predicate, the first source value terminates immediately.

<!-- FIRST-CALL -->
With a predicate, first tests values until the first truthy result.

<!-- FIRST-MATCH -->
The first matching source value is forwarded unchanged.

<!-- FIRST-MISS -->
Rejected values are skipped but consume their source index.

<!-- FIRST-THROW -->
Predicate exceptions remain errors.

<!-- FIRST-EMPTY-DEFAULT -->
Explicit undefined is still a supplied default when argument two exists.

<!-- FIRST-EMPTY-ERROR -->
Unlike find, first has an error policy for no matching value unless a default was supplied.

<!-- FIRST-SOURCE-ERROR -->
Source failure suppresses default and EmptyError synthesis.

<!-- FIRST-CANCEL -->
Cancellation emits no default and no EmptyError.

**Time:** No timer; first admissible source position controls output.

**Sharing:** No sharing is introduced; each result subscription owns independent state and resources.

**Callbacks:** One correlated predicate outcome per tested value.

**Excluded:** Type-guard/BooleanConstructor specialization, deprecated overload nuances, callback/observer/finalizer reentry.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-12.md) is reported separately from this specification.
