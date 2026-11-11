# mergeScan-accumulator-2: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session14-rxjs.test.mjs.

## MERGESCAN-INIT

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: subscribe to the outer source.

Resulting state: outer open with index zero and no active inners or queued values. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-01.

## MERGESCAN-ADMIT

Reach **Active** with **a concurrency slot is available and the index can advance**, then provide **outer.next**.

Expect, in order: request one accumulator callback with the input and admission index.

Resulting state: one pending projection; index advanced once. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-02.

## MERGESCAN-QUEUE

Reach **Active** with **all concurrency slots are occupied**, then provide **outer.next**.

Expect, in order: no actions.

Resulting state: append the raw outer value to the FIFO queue without changing the projection index. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-03.

## MERGESCAN-RETURN-ACTIVE

Reach **Calling** with **matching invocation with resume=Active**, then provide **callback.return**.

Expect, in order: subscribe the returned source under the pending invocation generation.

Resulting state: new inner admitted; no outer value emitted directly. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-04.

## MERGESCAN-RETURN-DRAINING

Reach **Calling** with **matching invocation with resume=Draining**, then provide **callback.return**.

Expect, in order: subscribe the returned source under the pending invocation generation.

Resulting state: new inner admitted; no outer value emitted directly. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-04.

## MERGESCAN-THROW

Reach **Calling** with **matching projection invocation**, then provide **callback.throw**.

Expect, in order: error downstream with the thrown value; release the open outer and every remaining inner; discard the queue.

Resulting state: closed by projection error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-05.

## MERGESCAN-NEXT-ACTIVE

Reach **Active** with **the notification belongs to an active inner generation**, then provide **inner.next**.

Expect, in order: forward the inner value unchanged.

Resulting state: retain the same active set and queue. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-06.

## MERGESCAN-INNER-ERROR-ACTIVE

Reach **Active** with **the error belongs to an active inner generation**, then provide **inner.error**.

Expect, in order: error downstream unchanged; release all owned subscriptions and discard queued values.

Resulting state: closed by inner error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-07.

## MERGESCAN-CANCEL-ACTIVE

Reach **Active** with **between resolved reactions**, then provide **cancel**.

Expect, in order: release the open outer and active inners; discard the queue without notifying downstream.

Resulting state: closed by cancellation. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-08.

## MERGESCAN-DRAIN-ACTIVE

Reach **Active** with **matching inner; queue nonempty; projection index can advance**, then provide **inner.complete**.

Expect, in order: release the completed inner; dequeue the oldest value and request its accumulator callback.

Resulting state: one slot reserved for the dequeued input; other inners remain active. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-09.

## MERGESCAN-INNER-END-ACTIVE

Reach **Active** with **matching inner and empty queue**, then provide **inner.complete**.

Expect, in order: release the completed inner.

Resulting state: remove that inner and keep waiting. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-10.

## MERGESCAN-NEXT-DRAINING

Reach **Draining** with **the notification belongs to an active inner generation**, then provide **inner.next**.

Expect, in order: forward the inner value unchanged.

Resulting state: retain the same active set and queue. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-06.

## MERGESCAN-INNER-ERROR-DRAINING

Reach **Draining** with **the error belongs to an active inner generation**, then provide **inner.error**.

Expect, in order: error downstream unchanged; release all owned subscriptions and discard queued values.

Resulting state: closed by inner error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-07.

## MERGESCAN-CANCEL-DRAINING

Reach **Draining** with **between resolved reactions**, then provide **cancel**.

Expect, in order: release the open outer and active inners; discard the queue without notifying downstream.

Resulting state: closed by cancellation. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-08.

## MERGESCAN-DRAIN-DRAINING

Reach **Draining** with **matching inner; queue nonempty; projection index can advance**, then provide **inner.complete**.

Expect, in order: release the completed inner; dequeue the oldest value and request its accumulator callback.

Resulting state: one slot reserved for the dequeued input; other inners remain active. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-09.

## MERGESCAN-INNER-END-DRAINING

Reach **Draining** with **matching inner, empty queue, and another inner remains**, then provide **inner.complete**.

Expect, in order: release the completed inner.

Resulting state: remove that inner and keep waiting. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-10.

## MERGESCAN-LAST-INNER

Reach **Draining** with **matching final inner and empty queue**, then provide **inner.complete**.

Expect, in order: release the final inner; complete downstream.

Resulting state: closed by successful completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-11.

## MERGESCAN-OUTER-WAIT

Reach **Active** with **at least one active inner**, then provide **outer.complete**.

Expect, in order: release the completed outer subscription.

Resulting state: outer done; preserve active inners and queued values. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-12.

## MERGESCAN-OUTER-END

Reach **Active** with **no active inner and empty queue**, then provide **outer.complete**.

Expect, in order: complete downstream; release the outer subscription.

Resulting state: closed by successful completion. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-13.

## MERGESCAN-OUTER-ERROR

Reach **Active** with **outer still open**, then provide **outer.error**.

Expect, in order: error downstream unchanged; release the outer and active inners; discard the queue.

Resulting state: closed by outer error. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S14-MERGESCAN-14.
