# findIndex-first-match: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session12-rxjs.test.mjs.

## FINDINDEX-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe source with index zero.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINDINDEX-INIT.

## FINDINDEX-CALL

Reach **Active** with **valid zero-based index**, then provide **source.next**.

Expect, in order: invoke predicate.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINDINDEX-CALL.

## FINDINDEX-MATCH

Reach **Calling** with **correlated truthy result**, then provide **callback.return**.

Expect, in order: emit current index; complete; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINDINDEX-MATCH.

## FINDINDEX-MISS

Reach **Calling** with **correlated falsy result**, then provide **callback.return**.

Expect, in order: advance index silently.

Resulting state: updated control and memory. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINDINDEX-MISS.

## FINDINDEX-THROW

Reach **Calling** with **correlated predicate throw**, then provide **callback.throw**.

Expect, in order: error downstream; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINDINDEX-THROW.

## FINDINDEX-NOT-FOUND

Reach **Active** with **no value matched**, then provide **source.complete**.

Expect, in order: emit -1; complete; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINDINDEX-NOT-FOUND.

## FINDINDEX-SOURCE-ERROR

Reach **Active** with **source errors**, then provide **source.error**.

Expect, in order: forward exact error; release source.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINDINDEX-SOURCE-ERROR.

## FINDINDEX-CANCEL

Reach **Active** with **downstream closes**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: terminal state with no owned live work. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S12-FINDINDEX-CANCEL.
