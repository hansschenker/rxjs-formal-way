# find-first-match: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session12-rxjs.test.mjs.

## FIND-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe source with predicate index zero.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIND-INIT.

## FIND-CALL

Reach **Active** with **valid zero-based index**, then provide **source.next**.

Expect, in order: invoke predicate with original value/index.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIND-CALL.

## FIND-MATCH

Reach **Calling** with **correlated truthy result**, then provide **callback.return**.

Expect, in order: emit original matched value; complete; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIND-MATCH.

## FIND-MISS

Reach **Calling** with **correlated falsy result**, then provide **callback.return**.

Expect, in order: advance predicate index silently.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIND-MISS.

## FIND-THROW

Reach **Calling** with **correlated predicate throw**, then provide **callback.throw**.

Expect, in order: error downstream; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIND-THROW.

## FIND-NOT-FOUND

Reach **Active** with **no value matched**, then provide **source.complete**.

Expect, in order: emit undefined; complete; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIND-NOT-FOUND.

## FIND-SOURCE-ERROR

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: forward exact error; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIND-SOURCE-ERROR.

## FIND-CANCEL

Reach **Active** with **downstream closes**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FIND-CANCEL.
