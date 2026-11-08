# every-indexed-predicate: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session11-rxjs.test.mjs.

## EVERY-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe source with index zero.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-EVERY-INIT.

## EVERY-CALL

Reach **Active** with **source next at valid index**, then provide **source.next**.

Expect, in order: invoke predicate with original value and index.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-EVERY-CALL.

## EVERY-TRUE

Reach **Calling** with **correlated truthy predicate outcome**, then provide **callback.return**.

Expect, in order: advance index, no output.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-EVERY-TRUE.

## EVERY-FALSE

Reach **Calling** with **correlated falsy predicate outcome**, then provide **callback.return**.

Expect, in order: emit false once; complete; unsubscribe.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-EVERY-FALSE.

## EVERY-THROW

Reach **Calling** with **correlated throwing predicate**, then provide **callback.throw**.

Expect, in order: forward exact thrown identity; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-EVERY-THROW.

## EVERY-SOURCE-COMPLETE

Reach **Active** with **no falsy predicate occurred**, then provide **source.complete**.

Expect, in order: emit true once; complete; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-EVERY-SOURCE-COMPLETE.

## EVERY-SOURCE-ERROR

Reach **Active** with **upstream errors**, then provide **source.error**.

Expect, in order: forward error without boolean; release source.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-EVERY-SOURCE-ERROR.

## EVERY-CANCEL

Reach **Active** with **explicit cancellation**, then provide **cancel**.

Expect, in order: release source silently.

Resulting state: control and memory updated atomically; resource lifetime follows ordered actions. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S11-EVERY-CANCEL.
