# single: operator behavior

> Generated from the canonical model by npm run generate. Do not edit this projection.

Assert exactly one matching source value, retaining candidate until successful completion; distinguish empty, no match, and duplicates.

**Scope:** Indexed boolean predicate; omitted BooleanConstructor and thisArg specialization.. A callback return/throw must resolve before another source notification.

**Dataflow shape:** `single(P?) : Cω(Predicate?) × T* → T?`. A successful finite source emits exactly one original value and complete. A second match fails immediately; an empty source fails with EmptyError; a non-empty predicate no-match fails with NotFoundError. Errors and cancellation discard retained state; no emission before uniqueness is known.

<!-- S19-SINGLE-START -->
The matching candidate is unknown until source completion; no speculative output.

<!-- S19-SINGLE-CANDIDATE -->
The first value may only be emitted after normal completion confirms uniqueness.

<!-- S19-SINGLE-SECOND -->
A second matching value immediately violates the single-value contract.

<!-- S19-SINGLE-PREDICATE -->
A predicate result is a separate correlated callback event; it never changes the source value.

<!-- S19-SINGLE-REJECT -->
Unmatched source values still establish that the source was non-empty, but are never emitted.

<!-- S19-SINGLE-FIRST-MATCH -->
Do not emit the first match until successful completion has ruled out a second match.

<!-- S19-SINGLE-DUPLICATE-MATCH -->
Two matching values violate single even if later source values would not match.

<!-- S19-SINGLE-PREDICATE-THROW -->
A thrown predicate is an error, not a false result or missing match.

<!-- S19-SINGLE-FOUND -->
Exactly one match is confirmed only at successful completion.

<!-- S19-SINGLE-EMPTY -->
EmptyError takes precedence over NotFoundError when the source is empty.

<!-- S19-SINGLE-NOT-FOUND -->
Only a supplied predicate can reject all values of a non-empty source.

<!-- S19-SINGLE-SOURCE-ERROR -->
No retained candidate is emitted on failure.

<!-- S19-SINGLE-CANCEL-ACTIVE -->
Cancellation discards a candidate and any unfinished callback, without selecting it.

<!-- S19-SINGLE-CANCEL-CALLING -->
Cancellation discards a candidate and any unfinished callback, without selecting it.

**Time:** Only source delivery order controls candidate storage; no new clock or scheduler.

**Sharing:** None introduced; each downstream subscription independently evaluates uniqueness.

**Callbacks:** Exactly one correlated request/outcome for every inspected source value (value,index,source).

**Excluded:** BooleanConstructor type-guard specialization, reentrant predicate/observer delivery and source initialization-time callbacks.

The runtime is not generated from these paragraphs. [Evidence](../evidence/SESSION-19.md) is reported separately from this specification.
