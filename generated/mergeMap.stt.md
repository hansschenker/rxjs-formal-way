# mergeMap-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| MERGEMAP-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the outer source | outer open with index zero and no active inners or queued values | S2-MERGEMAP-01 |
| MERGEMAP-ADMIT | Active | outer.next | a concurrency slot is available and the index can advance | request one projection with the input and admission index | one pending projection; index advanced once | S2-MERGEMAP-02 |
| MERGEMAP-QUEUE | Active | outer.next | all concurrency slots are occupied | no actions | append the raw outer value to the FIFO queue without changing the projection index | S2-MERGEMAP-03 |
| MERGEMAP-RETURN-ACTIVE | Calling | callback.return | matching invocation with resume=Active | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S2-MERGEMAP-04 |
| MERGEMAP-RETURN-DRAINING | Calling | callback.return | matching invocation with resume=Draining | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S2-MERGEMAP-04 |
| MERGEMAP-THROW | Calling | callback.throw | matching projection invocation | error downstream with the thrown value; release the open outer and every remaining inner; discard the queue | closed by projection error | S2-MERGEMAP-05 |
| MERGEMAP-NEXT-ACTIVE | Active | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S2-MERGEMAP-06 |
| MERGEMAP-INNER-ERROR-ACTIVE | Active | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S2-MERGEMAP-07 |
| MERGEMAP-CANCEL-ACTIVE | Active | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S2-MERGEMAP-08 |
| MERGEMAP-DRAIN-ACTIVE | Active | inner.complete | matching inner; queue nonempty; projection index can advance | release the completed inner; dequeue the oldest value and request its projection | one slot reserved for the dequeued input; other inners remain active | S2-MERGEMAP-09 |
| MERGEMAP-INNER-END-ACTIVE | Active | inner.complete | matching inner and empty queue | release the completed inner | remove that inner and keep waiting | S2-MERGEMAP-10 |
| MERGEMAP-NEXT-DRAINING | Draining | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S2-MERGEMAP-06 |
| MERGEMAP-INNER-ERROR-DRAINING | Draining | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S2-MERGEMAP-07 |
| MERGEMAP-CANCEL-DRAINING | Draining | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S2-MERGEMAP-08 |
| MERGEMAP-DRAIN-DRAINING | Draining | inner.complete | matching inner; queue nonempty; projection index can advance | release the completed inner; dequeue the oldest value and request its projection | one slot reserved for the dequeued input; other inners remain active | S2-MERGEMAP-09 |
| MERGEMAP-INNER-END-DRAINING | Draining | inner.complete | matching inner, empty queue, and another inner remains | release the completed inner | remove that inner and keep waiting | S2-MERGEMAP-10 |
| MERGEMAP-LAST-INNER | Draining | inner.complete | matching final inner and empty queue | release the final inner; complete downstream | closed by successful completion | S2-MERGEMAP-11 |
| MERGEMAP-OUTER-WAIT | Active | outer.complete | at least one active inner | release the completed outer subscription | outer done; preserve active inners and queued values | S2-MERGEMAP-12 |
| MERGEMAP-OUTER-END | Active | outer.complete | no active inner and empty queue | complete downstream; release the outer subscription | closed by successful completion | S2-MERGEMAP-13 |
| MERGEMAP-OUTER-ERROR | Active | outer.error | outer still open | error downstream unchanged; release the outer and active inners; discard the queue | closed by outer error | S2-MERGEMAP-14 |
