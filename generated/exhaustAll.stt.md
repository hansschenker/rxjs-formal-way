# exhaustAll-1: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| EXHAUSTALL-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the outer source | outer open with index zero and no active inners or queued values | S3-EXHAUSTALL-01 |
| EXHAUSTALL-ADMIT | Active | outer.next | a concurrency slot is available and the index can advance | request one projection with the input and admission index | one pending projection; index advanced once | S3-EXHAUSTALL-02 |
| EXHAUSTALL-IGNORE | Active | outer.next | an inner is active | no actions | retain the current inner and index; keep no queued copy | S3-EXHAUSTALL-03 |
| EXHAUSTALL-RETURN-ACTIVE | Calling | callback.return | matching invocation with resume=Active; result is identical to pending inner source | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S3-EXHAUSTALL-04 |
| EXHAUSTALL-NEXT-ACTIVE | Active | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S3-EXHAUSTALL-06 |
| EXHAUSTALL-INNER-ERROR-ACTIVE | Active | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S3-EXHAUSTALL-07 |
| EXHAUSTALL-CANCEL-ACTIVE | Active | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S3-EXHAUSTALL-08 |
| EXHAUSTALL-INNER-END-ACTIVE | Active | inner.complete | matching inner and empty queue | release the completed inner | remove that inner and keep waiting | S3-EXHAUSTALL-10 |
| EXHAUSTALL-NEXT-DRAINING | Draining | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S3-EXHAUSTALL-06 |
| EXHAUSTALL-INNER-ERROR-DRAINING | Draining | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S3-EXHAUSTALL-07 |
| EXHAUSTALL-CANCEL-DRAINING | Draining | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S3-EXHAUSTALL-08 |
| EXHAUSTALL-LAST-INNER | Draining | inner.complete | matching final inner and empty queue | complete downstream; release the final inner | closed by successful completion | S3-EXHAUSTALL-11 |
| EXHAUSTALL-OUTER-WAIT | Active | outer.complete | at least one active inner | release the completed outer subscription | outer done; preserve active inners and queued values | S3-EXHAUSTALL-12 |
| EXHAUSTALL-OUTER-END | Active | outer.complete | no active inner and empty queue | complete downstream; release the outer subscription | closed by successful completion | S3-EXHAUSTALL-13 |
| EXHAUSTALL-OUTER-ERROR | Active | outer.error | outer still open | error downstream unchanged; release the outer and active inners; discard the queue | closed by outer error | S3-EXHAUSTALL-14 |
