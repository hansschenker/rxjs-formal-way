# mergeScan-accumulator-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| MERGESCAN-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the outer source | outer open with index zero and no active inners or queued values | S14-MERGESCAN-01 |
| MERGESCAN-ADMIT | Active | outer.next | a concurrency slot is available and the index can advance | request one accumulator callback with the input and admission index | one pending projection; index advanced once | S14-MERGESCAN-02 |
| MERGESCAN-QUEUE | Active | outer.next | all concurrency slots are occupied | no actions | append the raw outer value to the FIFO queue without changing the projection index | S14-MERGESCAN-03 |
| MERGESCAN-RETURN-ACTIVE | Calling | callback.return | matching invocation with resume=Active | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S14-MERGESCAN-04 |
| MERGESCAN-RETURN-DRAINING | Calling | callback.return | matching invocation with resume=Draining | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S14-MERGESCAN-04 |
| MERGESCAN-THROW | Calling | callback.throw | matching projection invocation | error downstream with the thrown value; release the open outer and every remaining inner; discard the queue | closed by projection error | S14-MERGESCAN-05 |
| MERGESCAN-NEXT-ACTIVE | Active | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S14-MERGESCAN-06 |
| MERGESCAN-INNER-ERROR-ACTIVE | Active | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S14-MERGESCAN-07 |
| MERGESCAN-CANCEL-ACTIVE | Active | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S14-MERGESCAN-08 |
| MERGESCAN-DRAIN-ACTIVE | Active | inner.complete | matching inner; queue nonempty; projection index can advance | release the completed inner; dequeue the oldest value and request its accumulator callback | one slot reserved for the dequeued input; other inners remain active | S14-MERGESCAN-09 |
| MERGESCAN-INNER-END-ACTIVE | Active | inner.complete | matching inner and empty queue | release the completed inner | remove that inner and keep waiting | S14-MERGESCAN-10 |
| MERGESCAN-NEXT-DRAINING | Draining | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S14-MERGESCAN-06 |
| MERGESCAN-INNER-ERROR-DRAINING | Draining | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S14-MERGESCAN-07 |
| MERGESCAN-CANCEL-DRAINING | Draining | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S14-MERGESCAN-08 |
| MERGESCAN-DRAIN-DRAINING | Draining | inner.complete | matching inner; queue nonempty; projection index can advance | release the completed inner; dequeue the oldest value and request its accumulator callback | one slot reserved for the dequeued input; other inners remain active | S14-MERGESCAN-09 |
| MERGESCAN-INNER-END-DRAINING | Draining | inner.complete | matching inner, empty queue, and another inner remains | release the completed inner | remove that inner and keep waiting | S14-MERGESCAN-10 |
| MERGESCAN-LAST-INNER | Draining | inner.complete | matching final inner and empty queue | release the final inner; complete downstream | closed by successful completion | S14-MERGESCAN-11 |
| MERGESCAN-OUTER-WAIT | Active | outer.complete | at least one active inner | release the completed outer subscription | outer done; preserve active inners and queued values | S14-MERGESCAN-12 |
| MERGESCAN-OUTER-END | Active | outer.complete | no active inner and empty queue | complete downstream; release the outer subscription | closed by successful completion | S14-MERGESCAN-13 |
| MERGESCAN-OUTER-ERROR | Active | outer.error | outer still open | error downstream unchanged; release the outer and active inners; discard the queue | closed by outer error | S14-MERGESCAN-14 |
