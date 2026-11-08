# exhaust-deprecated-exact-alias: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| EXHAUST-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the outer source | outer open with index zero and no active inners or queued values | S11-EXHAUST-01 |
| EXHAUST-ADMIT | Active | outer.next | a concurrency slot is available and the index can advance | request one projection with the input and admission index | one pending projection; index advanced once | S11-EXHAUST-02 |
| EXHAUST-IGNORE | Active | outer.next | an inner is active | no actions | retain the current inner and index; keep no queued copy | S11-EXHAUST-03 |
| EXHAUST-RETURN-ACTIVE | Calling | callback.return | matching invocation with resume=Active; result is identical to pending inner source | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S11-EXHAUST-04 |
| EXHAUST-NEXT-ACTIVE | Active | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S11-EXHAUST-06 |
| EXHAUST-INNER-ERROR-ACTIVE | Active | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S11-EXHAUST-07 |
| EXHAUST-CANCEL-ACTIVE | Active | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S11-EXHAUST-08 |
| EXHAUST-INNER-END-ACTIVE | Active | inner.complete | matching inner and empty queue | release the completed inner | remove that inner and keep waiting | S11-EXHAUST-10 |
| EXHAUST-NEXT-DRAINING | Draining | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S11-EXHAUST-06 |
| EXHAUST-INNER-ERROR-DRAINING | Draining | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S11-EXHAUST-07 |
| EXHAUST-CANCEL-DRAINING | Draining | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S11-EXHAUST-08 |
| EXHAUST-LAST-INNER | Draining | inner.complete | matching final inner and empty queue | complete downstream; release the final inner | closed by successful completion | S11-EXHAUST-11 |
| EXHAUST-OUTER-WAIT | Active | outer.complete | at least one active inner | release the completed outer subscription | outer done; preserve active inners and queued values | S11-EXHAUST-12 |
| EXHAUST-OUTER-END | Active | outer.complete | no active inner and empty queue | complete downstream; release the outer subscription | closed by successful completion | S11-EXHAUST-13 |
| EXHAUST-OUTER-ERROR | Active | outer.error | outer still open | error downstream unchanged; release the outer and active inners; discard the queue | closed by outer error | S11-EXHAUST-14 |
