# zipWith-3-fifo-8: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session23-zipWith-rxjs.test.mjs, tests/session23-zipWith-differential.test.mjs.

## S23-ZIPWITH-START

Reach **Unsubscribed** with **no connection yet**, then provide **subscribe**.

Expect, in order: acquire source input zero, then each auxiliary in argument order.

Resulting state: Every FIFO is empty, every input is live, and received/emitted counts are zero.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPWITH-START.

## S23-ZIPWITH-BUFFER

Reach **Active** with **addressed input live; within FIFO/count scope; another FIFO remains empty**, then provide **input.next**.

Expect, in order: append the opaque value to its input FIFO; emit nothing.

Resulting state: Only that FIFO and its received count change.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPWITH-BUFFER.

## S23-ZIPWITH-EMIT

Reach **Active** with **addressed input live; every FIFO becomes nonempty; no completed FIFO is exhausted**, then provide **input.next**.

Expect, in order: append input value; remove one oldest value from every FIFO; emit one fresh tuple in input order.

Resulting state: Received count advances for arriving input; emitted count advances once; unmatched values remain queued.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPWITH-EMIT.

## S23-ZIPWITH-EMIT-LAST

Reach **Active** with **addressed input live; tuple ready; removing it exhausts a previously completed FIFO**, then provide **input.next**.

Expect, in order: emit one final tuple in input order; complete downstream; release remaining live inputs in subscription order.

Resulting state: Closed and all queued values released.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPWITH-EMIT-LAST.

## S23-ZIPWITH-COMPLETE-BUFFERED

Reach **Active** with **addressed input live and its FIFO is nonempty**, then provide **input.complete**.

Expect, in order: release this completed input connection only.

Resulting state: Input becomes non-live; its FIFO remains available for later tuples.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPWITH-COMPLETE-BUFFERED.

## S23-ZIPWITH-COMPLETE-EMPTY

Reach **Active** with **addressed input live and its FIFO is empty**, then provide **input.complete**.

Expect, in order: complete downstream; release all remaining live inputs in subscription order.

Resulting state: Closed; unmatched values in other FIFOs are discarded.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPWITH-COMPLETE-EMPTY.

## S23-ZIPWITH-ERROR

Reach **Active** with **addressed input live**, then provide **input.error**.

Expect, in order: error downstream with the same opaque payload; release every remaining live input in subscription order.

Resulting state: Closed; queued values are discarded without a final tuple.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPWITH-ERROR.

## S23-ZIPWITH-CANCEL

Reach **Active** with **result connection remains active**, then provide **cancel**.

Expect, in order: release remaining live input connections without a notification.

Resulting state: Closed; queued values are released.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPWITH-CANCEL.
