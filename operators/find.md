# find: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Emit the first source value whose indexed predicate is truthy; emit undefined if the source completes without a match.

**Scope:** Required predicate; deprecated thisArg and BooleanConstructor specialization excluded from the canonical profile.. One pending predicate outcome at a time; source events during Calling are outside the non-reentrant profile.

**Dataflow shape:** `find : (T! x Index! -> Boolean!) -> T* -> T?`. At most one source value is emitted; a finite no-match source emits one undefined value then completes. First truthy result short-circuits source work. Cω counts next values; terminal notifications, cancellation and resource release are separate obligations.

<!-- FIND-INIT -->
find evaluates each source value until the first match.

<!-- FIND-CALL -->
The pure model requests predicate outcome without executing user logic.

<!-- FIND-MATCH -->
The predicate result is control; the original input value is the output.

<!-- FIND-MISS -->
Rejected values are not retained.

<!-- FIND-THROW -->
Predicate throws are terminal errors, not a failed match.

<!-- FIND-NOT-FOUND -->
Unlike first, find succeeds with undefined when no match exists.

<!-- FIND-SOURCE-ERROR -->
Source error suppresses the not-found value.

<!-- FIND-CANCEL -->
Cancellation emits neither undefined nor completion.

**Time:** No timer; source order determines predicate index and first-match selection.

**Sharing:** No sharing is introduced; each result subscription owns independent state and resources.

**Callbacks:** One correlated predicate(value,index,source) outcome per tested value; source object identity is runtime-tested separately.

**Excluded:** Deprecated thisArg overload, arbitrary predicate reentry, observer/finalizer exceptions.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-12.md) is reported separately from this specification.
