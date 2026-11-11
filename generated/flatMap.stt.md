# flatMap-exact-mergeMap-2: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| FLATMAP-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the outer source | outer open with index zero and no active inners or queued values | S14-FLATMAP-01 |
| FLATMAP-ADMIT | Active | outer.next | a concurrency slot is available and the index can advance | request one projection with the input and admission index | one pending projection; index advanced once | S14-FLATMAP-02 |
| FLATMAP-QUEUE | Active | outer.next | all concurrency slots are occupied | no actions | append the raw outer value to the FIFO queue without changing the projection index | S14-FLATMAP-03 |
| FLATMAP-RETURN-ACTIVE | Calling | callback.return | matching invocation with resume=Active | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S14-FLATMAP-04 |
| FLATMAP-RETURN-DRAINING | Calling | callback.return | matching invocation with resume=Draining | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S14-FLATMAP-04 |
| FLATMAP-THROW | Calling | callback.throw | matching projection invocation | error downstream with the thrown value; release the open outer and every remaining inner; discard the queue | closed by projection error | S14-FLATMAP-05 |
| FLATMAP-NEXT-ACTIVE | Active | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S14-FLATMAP-06 |
| FLATMAP-INNER-ERROR-ACTIVE | Active | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S14-FLATMAP-07 |
| FLATMAP-CANCEL-ACTIVE | Active | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S14-FLATMAP-08 |
| FLATMAP-DRAIN-ACTIVE | Active | inner.complete | matching inner; queue nonempty; projection index can advance | release the completed inner; dequeue the oldest value and request its projection | one slot reserved for the dequeued input; other inners remain active | S14-FLATMAP-09 |
| FLATMAP-INNER-END-ACTIVE | Active | inner.complete | matching inner and empty queue | release the completed inner | remove that inner and keep waiting | S14-FLATMAP-10 |
| FLATMAP-NEXT-DRAINING | Draining | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S14-FLATMAP-06 |
| FLATMAP-INNER-ERROR-DRAINING | Draining | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S14-FLATMAP-07 |
| FLATMAP-CANCEL-DRAINING | Draining | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S14-FLATMAP-08 |
| FLATMAP-DRAIN-DRAINING | Draining | inner.complete | matching inner; queue nonempty; projection index can advance | release the completed inner; dequeue the oldest value and request its projection | one slot reserved for the dequeued input; other inners remain active | S14-FLATMAP-09 |
| FLATMAP-INNER-END-DRAINING | Draining | inner.complete | matching inner, empty queue, and another inner remains | release the completed inner | remove that inner and keep waiting | S14-FLATMAP-10 |
| FLATMAP-LAST-INNER | Draining | inner.complete | matching final inner and empty queue | release the final inner; complete downstream | closed by successful completion | S14-FLATMAP-11 |
| FLATMAP-OUTER-WAIT | Active | outer.complete | at least one active inner | release the completed outer subscription | outer done; preserve active inners and queued values | S14-FLATMAP-12 |
| FLATMAP-OUTER-END | Active | outer.complete | no active inner and empty queue | complete downstream; release the outer subscription | closed by successful completion | S14-FLATMAP-13 |
| FLATMAP-OUTER-ERROR | Active | outer.error | outer still open | error downstream unchanged; release the outer and active inners; discard the queue | closed by outer error | S14-FLATMAP-14 |
