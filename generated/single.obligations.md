# single-indexed-predicate: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session19-rxjs.test.mjs.

## S19-SINGLE-START

Reach **Unsubscribed** with **first downstream subscriber**, then provide **subscribe**.

Expect, in order: subscribe source; initialize presence bits and index.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-START.

## S19-SINGLE-CANDIDATE

Reach **Active** with **no predicate and no previous candidate**, then provide **source.next**.

Expect, in order: retain first source value without notifying.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-CANDIDATE.

## S19-SINGLE-SECOND

Reach **Active** with **no predicate and candidate already stored**, then provide **source.next**.

Expect, in order: error with SequenceError; unsubscribe source.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-SECOND.

## S19-SINGLE-PREDICATE

Reach **Active** with **predicate selected and index safe**, then provide **source.next**.

Expect, in order: request indexed predicate for original source value.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-PREDICATE.

## S19-SINGLE-REJECT

Reach **Calling** with **correlated false predicate result**, then provide **callback.return**.

Expect, in order: advance predicate index; retain previous candidate if any.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-REJECT.

## S19-SINGLE-FIRST-MATCH

Reach **Calling** with **correlated true result and no prior match**, then provide **callback.return**.

Expect, in order: retain original source value; advance predicate index.

Resulting state: Retain precisely the state memory and resource ownership described by this rule.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-FIRST-MATCH.

## S19-SINGLE-DUPLICATE-MATCH

Reach **Calling** with **correlated true result and prior matching value exists**, then provide **callback.return**.

Expect, in order: error with SequenceError; release source immediately.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-DUPLICATE-MATCH.

## S19-SINGLE-PREDICATE-THROW

Reach **Calling** with **correlated predicate exception**, then provide **callback.throw**.

Expect, in order: propagate exact thrown object; release source.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-PREDICATE-THROW.

## S19-SINGLE-FOUND

Reach **Active** with **one matching candidate stored**, then provide **source.complete**.

Expect, in order: emit retained original value; complete; release source.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-FOUND.

## S19-SINGLE-EMPTY

Reach **Active** with **no source values ever observed**, then provide **source.complete**.

Expect, in order: emit EmptyError; release source.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-EMPTY.

## S19-SINGLE-NOT-FOUND

Reach **Active** with **source was non-empty but predicate matched nothing**, then provide **source.complete**.

Expect, in order: emit NotFoundError; release source.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-NOT-FOUND.

## S19-SINGLE-SOURCE-ERROR

Reach **Active** with **live source fails**, then provide **source.error**.

Expect, in order: forward exact source error; release source.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-SOURCE-ERROR.

## S19-SINGLE-CANCEL-ACTIVE

Reach **Active** with **consumer cancels**, then provide **cancel**.

Expect, in order: release source without a next/error/complete notification.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-CANCEL-ACTIVE.

## S19-SINGLE-CANCEL-CALLING

Reach **Calling** with **consumer cancels**, then provide **cancel**.

Expect, in order: release source without a next/error/complete notification.

Resulting state: Final terminal reason; state is no longer admissible for input.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SINGLE-CANCEL-CALLING.
