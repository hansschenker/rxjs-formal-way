# switchAll-1: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| SWITCHALL-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the outer source | outer open with index zero and no active inners or queued values | S3-SWITCHALL-01 |
| SWITCHALL-ADMIT | Active | outer.next | a concurrency slot is available and the index can advance | request one projection with the input and admission index | one pending projection; index advanced once | S3-SWITCHALL-02 |
| SWITCHALL-REPLACE | Active | outer.next | an inner is active and the index can advance | unsubscribe the previous inner; request the new projection | previous inner removed before the new projection | S3-SWITCHALL-03 |
| SWITCHALL-RETURN-ACTIVE | Calling | callback.return | matching invocation with resume=Active; result is identical to pending inner source | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S3-SWITCHALL-04 |
| SWITCHALL-NEXT-ACTIVE | Active | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S3-SWITCHALL-06 |
| SWITCHALL-INNER-ERROR-ACTIVE | Active | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S3-SWITCHALL-07 |
| SWITCHALL-CANCEL-ACTIVE | Active | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S3-SWITCHALL-08 |
| SWITCHALL-INNER-END-ACTIVE | Active | inner.complete | matching inner and empty queue | release the completed inner | remove that inner and keep waiting | S3-SWITCHALL-10 |
| SWITCHALL-NEXT-DRAINING | Draining | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S3-SWITCHALL-06 |
| SWITCHALL-INNER-ERROR-DRAINING | Draining | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S3-SWITCHALL-07 |
| SWITCHALL-CANCEL-DRAINING | Draining | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S3-SWITCHALL-08 |
| SWITCHALL-LAST-INNER | Draining | inner.complete | matching final inner and empty queue | complete downstream; release the final inner | closed by successful completion | S3-SWITCHALL-11 |
| SWITCHALL-OUTER-WAIT | Active | outer.complete | at least one active inner | release the completed outer subscription | outer done; preserve active inners and queued values | S3-SWITCHALL-12 |
| SWITCHALL-OUTER-END | Active | outer.complete | no active inner and empty queue | complete downstream; release the outer subscription | closed by successful completion | S3-SWITCHALL-13 |
| SWITCHALL-OUTER-ERROR | Active | outer.error | outer still open | error downstream unchanged; release the outer and active inners; discard the queue | closed by outer error | S3-SWITCHALL-14 |
