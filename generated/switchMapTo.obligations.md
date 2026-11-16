# switchMapTo-constant: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session19-rxjs.test.mjs.

## SWITCHMAPTO-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe to the outer source.

Resulting state: outer open with index zero and no active inners or queued values. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-01.

## SWITCHMAPTO-ADMIT

Reach **Active** with **a concurrency slot is available and the index can advance**, then provide **outer.next**.

Expect, in order: request one projection with the input and admission index.

Resulting state: one pending projection; index advanced once. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-02.

## SWITCHMAPTO-REPLACE

Reach **Active** with **an inner is active and the index can advance**, then provide **outer.next**.

Expect, in order: unsubscribe the previous inner; request the new projection.

Resulting state: previous inner removed before the new projection. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-03.

## SWITCHMAPTO-RETURN-ACTIVE

Reach **Calling** with **matching invocation with resume=Active**, then provide **callback.return**.

Expect, in order: subscribe the returned source under the pending invocation generation.

Resulting state: new inner admitted; no outer value emitted directly. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-04.

## SWITCHMAPTO-NEXT-ACTIVE

Reach **Active** with **the notification belongs to an active inner generation**, then provide **inner.next**.

Expect, in order: forward the inner value unchanged.

Resulting state: retain the same active set and queue. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-06.

## SWITCHMAPTO-INNER-ERROR-ACTIVE

Reach **Active** with **the error belongs to an active inner generation**, then provide **inner.error**.

Expect, in order: error downstream unchanged; release all owned subscriptions and discard queued values.

Resulting state: closed by inner error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-07.

## SWITCHMAPTO-CANCEL-ACTIVE

Reach **Active** with **between resolved reactions**, then provide **cancel**.

Expect, in order: release the open outer and active inners; discard the queue without notifying downstream.

Resulting state: closed by cancellation. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-08.

## SWITCHMAPTO-INNER-END-ACTIVE

Reach **Active** with **matching inner and empty queue**, then provide **inner.complete**.

Expect, in order: release the completed inner.

Resulting state: remove that inner and keep waiting. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-10.

## SWITCHMAPTO-NEXT-DRAINING

Reach **Draining** with **the notification belongs to an active inner generation**, then provide **inner.next**.

Expect, in order: forward the inner value unchanged.

Resulting state: retain the same active set and queue. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-06.

## SWITCHMAPTO-INNER-ERROR-DRAINING

Reach **Draining** with **the error belongs to an active inner generation**, then provide **inner.error**.

Expect, in order: error downstream unchanged; release all owned subscriptions and discard queued values.

Resulting state: closed by inner error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-07.

## SWITCHMAPTO-CANCEL-DRAINING

Reach **Draining** with **between resolved reactions**, then provide **cancel**.

Expect, in order: release the open outer and active inners; discard the queue without notifying downstream.

Resulting state: closed by cancellation. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-08.

## SWITCHMAPTO-LAST-INNER

Reach **Draining** with **matching final inner and empty queue**, then provide **inner.complete**.

Expect, in order: complete downstream; release the final inner.

Resulting state: closed by successful completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-11.

## SWITCHMAPTO-OUTER-WAIT

Reach **Active** with **at least one active inner**, then provide **outer.complete**.

Expect, in order: release the completed outer subscription.

Resulting state: outer done; preserve active inners and queued values. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-12.

## SWITCHMAPTO-OUTER-END

Reach **Active** with **no active inner and empty queue**, then provide **outer.complete**.

Expect, in order: complete downstream; release the outer subscription.

Resulting state: closed by successful completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-13.

## SWITCHMAPTO-OUTER-ERROR

Reach **Active** with **outer still open**, then provide **outer.error**.

Expect, in order: error downstream unchanged; release the outer and active inners; discard the queue.

Resulting state: closed by outer error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S19-SWITCHMAPTO-14.
