# mergeAll-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| MERGEALL-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the outer source | outer open with index zero and no active inners or queued values | S3-MERGEALL-01 |
| MERGEALL-ADMIT | Active | outer.next | a concurrency slot is available and the index can advance | request one projection with the input and admission index | one pending projection; index advanced once | S3-MERGEALL-02 |
| MERGEALL-QUEUE | Active | outer.next | all concurrency slots are occupied | no actions | append the raw outer value to the FIFO queue without changing the projection index | S3-MERGEALL-03 |
| MERGEALL-RETURN-ACTIVE | Calling | callback.return | matching invocation with resume=Active; result is identical to pending inner source | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S3-MERGEALL-04 |
| MERGEALL-RETURN-DRAINING | Calling | callback.return | matching invocation with resume=Draining; result is identical to pending inner source | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S3-MERGEALL-04 |
| MERGEALL-NEXT-ACTIVE | Active | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S3-MERGEALL-06 |
| MERGEALL-INNER-ERROR-ACTIVE | Active | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S3-MERGEALL-07 |
| MERGEALL-CANCEL-ACTIVE | Active | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S3-MERGEALL-08 |
| MERGEALL-DRAIN-ACTIVE | Active | inner.complete | matching inner; queue nonempty; projection index can advance | release the completed inner; dequeue the oldest value and request its projection | one slot reserved for the dequeued input; other inners remain active | S3-MERGEALL-09 |
| MERGEALL-INNER-END-ACTIVE | Active | inner.complete | matching inner and empty queue | release the completed inner | remove that inner and keep waiting | S3-MERGEALL-10 |
| MERGEALL-NEXT-DRAINING | Draining | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S3-MERGEALL-06 |
| MERGEALL-INNER-ERROR-DRAINING | Draining | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S3-MERGEALL-07 |
| MERGEALL-CANCEL-DRAINING | Draining | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S3-MERGEALL-08 |
| MERGEALL-DRAIN-DRAINING | Draining | inner.complete | matching inner; queue nonempty; projection index can advance | release the completed inner; dequeue the oldest value and request its projection | one slot reserved for the dequeued input; other inners remain active | S3-MERGEALL-09 |
| MERGEALL-INNER-END-DRAINING | Draining | inner.complete | matching inner, empty queue, and another inner remains | release the completed inner | remove that inner and keep waiting | S3-MERGEALL-10 |
| MERGEALL-LAST-INNER | Draining | inner.complete | matching final inner and empty queue | release the final inner; complete downstream | closed by successful completion | S3-MERGEALL-11 |
| MERGEALL-OUTER-WAIT | Active | outer.complete | at least one active inner | release the completed outer subscription | outer done; preserve active inners and queued values | S3-MERGEALL-12 |
| MERGEALL-OUTER-END | Active | outer.complete | no active inner and empty queue | complete downstream; release the outer subscription | closed by successful completion | S3-MERGEALL-13 |
| MERGEALL-OUTER-ERROR | Active | outer.error | outer still open | error downstream unchanged; release the outer and active inners; discard the queue | closed by outer error | S3-MERGEALL-14 |
