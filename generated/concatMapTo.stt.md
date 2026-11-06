# concatMapTo-constant-Observable: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| CONCATMAPTO-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the outer source | outer open with index zero and no active inners or queued values | S9-CONCATMAPTO-01 |
| CONCATMAPTO-ADMIT | Active | outer.next | a concurrency slot is available and the index can advance | request one projection with the input and admission index | one pending projection; index advanced once | S9-CONCATMAPTO-02 |
| CONCATMAPTO-QUEUE | Active | outer.next | all concurrency slots are occupied | no actions | append the raw outer value to the FIFO queue without changing the projection index | S9-CONCATMAPTO-03 |
| CONCATMAPTO-RETURN-ACTIVE | Calling | callback.return | matching invocation with resume=Active; returned source is identical to constant binding | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S9-CONCATMAPTO-04 |
| CONCATMAPTO-RETURN-DRAINING | Calling | callback.return | matching invocation with resume=Draining; returned source is identical to constant binding | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S9-CONCATMAPTO-04 |
| CONCATMAPTO-NEXT-ACTIVE | Active | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S9-CONCATMAPTO-06 |
| CONCATMAPTO-INNER-ERROR-ACTIVE | Active | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S9-CONCATMAPTO-07 |
| CONCATMAPTO-CANCEL-ACTIVE | Active | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S9-CONCATMAPTO-08 |
| CONCATMAPTO-DRAIN-ACTIVE | Active | inner.complete | matching inner; queue nonempty; projection index can advance | release the completed inner; dequeue the oldest value and request its projection | one slot reserved for the dequeued input; other inners remain active | S9-CONCATMAPTO-09 |
| CONCATMAPTO-INNER-END-ACTIVE | Active | inner.complete | matching inner and empty queue | release the completed inner | remove that inner and keep waiting | S9-CONCATMAPTO-10 |
| CONCATMAPTO-NEXT-DRAINING | Draining | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S9-CONCATMAPTO-06 |
| CONCATMAPTO-INNER-ERROR-DRAINING | Draining | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S9-CONCATMAPTO-07 |
| CONCATMAPTO-CANCEL-DRAINING | Draining | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S9-CONCATMAPTO-08 |
| CONCATMAPTO-DRAIN-DRAINING | Draining | inner.complete | matching inner; queue nonempty; projection index can advance | release the completed inner; dequeue the oldest value and request its projection | one slot reserved for the dequeued input; other inners remain active | S9-CONCATMAPTO-09 |
| CONCATMAPTO-LAST-INNER | Draining | inner.complete | matching final inner and empty queue | release the final inner; complete downstream | closed by successful completion | S9-CONCATMAPTO-11 |
| CONCATMAPTO-OUTER-WAIT | Active | outer.complete | at least one active inner | release the completed outer subscription | outer done; preserve active inners and queued values | S9-CONCATMAPTO-12 |
| CONCATMAPTO-OUTER-END | Active | outer.complete | no active inner and empty queue | complete downstream; release the outer subscription | closed by successful completion | S9-CONCATMAPTO-13 |
| CONCATMAPTO-OUTER-ERROR | Active | outer.error | outer still open | error downstream unchanged; release the outer and active inners; discard the queue | closed by outer error | S9-CONCATMAPTO-14 |
