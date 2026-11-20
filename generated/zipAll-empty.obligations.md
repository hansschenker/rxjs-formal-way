# zipAll-deferred-fifo-8-8: test obligations

> Generated from the canonical model by npm run generate. Do not edit this projection.

A rule creates an obligation, not a proof of exhaustive behavior. Test identifiers below resolve in tests/session23-zipAll-rxjs.test.mjs, tests/session23-zipAll-differential.test.mjs.

## S23-ZIPALL-START

Reach **Unsubscribed** with **fresh execution**, then provide **subscribe**.

Expect, in order: acquire outer only.

Resulting state: Empty ordered source collection.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-START.

## S23-ZIPALL-COLLECT

Reach **Collecting** with **collected count is below maxInners**, then provide **outer.next**.

Expect, in order: retain the opaque inner description; do not connect it.

Resulting state: Append one source occurrence in outer arrival order.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-COLLECT.

## S23-ZIPALL-OUTER-EMPTY

Reach **Collecting** with **no collected source occurrences**, then provide **outer.complete**.

Expect, in order: complete downstream without an empty tuple; release outer.

Resulting state: Closed complete; discard collection.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-OUTER-EMPTY.

## S23-ZIPALL-OUTER-JOIN

Reach **Collecting** with **at least one collected source occurrence**, then provide **outer.complete**.

Expect, in order: acquire all inners in collection order; release outer after inner acquisition.

Resulting state: One empty FIFO and live connection for each occurrence; emitted count zero.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-OUTER-JOIN.

## S23-ZIPALL-OUTER-ERROR

Reach **Collecting** with **outer is live**, then provide **outer.error**.

Expect, in order: error downstream with the same payload; release outer without connecting inners.

Resulting state: Closed outer-error; discard descriptions.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-OUTER-ERROR.

## S23-ZIPALL-CANCEL-COLLECT

Reach **Collecting** with **outer connection is active**, then provide **cancel**.

Expect, in order: release outer silently.

Resulting state: Closed cancel; discard descriptions.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-CANCEL-COLLECT.

## S23-ZIPALL-INNER-BUFFER

Reach **Joining** with **live addressed inner, room in bounded scope, another FIFO empty**, then provide **inner.next**.

Expect, in order: append value to addressed FIFO; emit nothing.

Resulting state: Increase that occurrence's received count; retain all other queues.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-INNER-BUFFER.

## S23-ZIPALL-INNER-EMIT

Reach **Joining** with **live addressed inner, all FIFOs ready after append, no completed FIFO exhausted**, then provide **inner.next**.

Expect, in order: append value; remove the oldest value from every FIFO; emit one fresh tuple in collection order.

Resulting state: Increment emitted count and retain each unconsumed FIFO suffix.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-INNER-EMIT.

## S23-ZIPALL-INNER-DRAIN

Reach **Joining** with **all FIFOs ready after append; a completed FIFO has its final value**, then provide **inner.next**.

Expect, in order: emit the last pairable tuple; release still-live inners in collection order; complete downstream after releases.

Resulting state: Closed complete; no unmatched suffix retained.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-INNER-DRAIN.

## S23-ZIPALL-INNER-COMPLETE-BUFFERED

Reach **Joining** with **live addressed inner has queued values**, then provide **inner.complete**.

Expect, in order: release only the completed inner producer.

Resulting state: Mark slot no longer live, retaining its FIFO suffix.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-INNER-COMPLETE-BUFFERED.

## S23-ZIPALL-INNER-COMPLETE-EMPTY

Reach **Joining** with **live addressed inner has no queued values**, then provide **inner.complete**.

Expect, in order: release all still-live inners in collection order; complete downstream after releases.

Resulting state: Closed complete; discard unmatched suffixes.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-INNER-COMPLETE-EMPTY.

## S23-ZIPALL-INNER-ERROR

Reach **Joining** with **addressed inner is still live**, then provide **inner.error**.

Expect, in order: error downstream with original payload; release all live inner producers in collection order.

Resulting state: Closed inner-error; discard all FIFO values.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-INNER-ERROR.

## S23-ZIPALL-CANCEL-JOIN

Reach **Joining** with **join owns live inputs**, then provide **cancel**.

Expect, in order: release live inners in collection order without notification.

Resulting state: Closed cancel; discard queues.. Verify future silence after termination and source lifetime independently of value assertions.

Runtime witnesses: S23-ZIPALL-CANCEL-JOIN.
