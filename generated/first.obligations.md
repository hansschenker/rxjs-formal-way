# first-predicate-required: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session12-rxjs.test.mjs.

## FIRST-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe source.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIRST-INIT.

## FIRST-DIRECT

Reach **Active** with **predicate omitted**, then provide **source.next**.

Expect, in order: emit first source value; complete; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIRST-DIRECT.

## FIRST-CALL

Reach **Active** with **predicate supplied and index valid**, then provide **source.next**.

Expect, in order: invoke predicate.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIRST-CALL.

## FIRST-MATCH

Reach **Calling** with **correlated truthy predicate result**, then provide **callback.return**.

Expect, in order: emit original matched value; complete; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIRST-MATCH.

## FIRST-MISS

Reach **Calling** with **correlated falsy predicate result**, then provide **callback.return**.

Expect, in order: advance predicate index silently.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIRST-MISS.

## FIRST-THROW

Reach **Calling** with **correlated predicate throw**, then provide **callback.throw**.

Expect, in order: error downstream; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIRST-THROW.

## FIRST-EMPTY-DEFAULT

Reach **Active** with **no admissible value and explicit default supplied**, then provide **source.complete**.

Expect, in order: emit default; complete; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIRST-EMPTY-DEFAULT.

## FIRST-EMPTY-ERROR

Reach **Active** with **no admissible value and no default**, then provide **source.complete**.

Expect, in order: error with EmptyError; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIRST-EMPTY-ERROR.

## FIRST-SOURCE-ERROR

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: forward exact error; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIRST-SOURCE-ERROR.

## FIRST-CANCEL

Reach **Active** with **downstream closes**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIRST-CANCEL.
