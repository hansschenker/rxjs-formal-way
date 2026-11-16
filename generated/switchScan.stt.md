# switchScan-latest-inner-seed: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| SWITCHSCAN-INIT | Unsubscribed | subscribe | fresh execution | subscribe to the outer source | outer open with index zero and no active inners or queued values | S19-SWITCHSCAN-01 |
| SWITCHSCAN-ADMIT | Active | outer.next | a concurrency slot is available and the index can advance | request one projection with the input and admission index | one pending projection; index advanced once | S19-SWITCHSCAN-02 |
| SWITCHSCAN-REPLACE | Active | outer.next | an inner is active and the index can advance | unsubscribe the previous inner; request the new projection | previous inner removed before the new projection | S19-SWITCHSCAN-03 |
| SWITCHSCAN-RETURN-ACTIVE | Calling | callback.return | matching invocation with resume=Active | subscribe the returned source under the pending invocation generation | new inner admitted; no outer value emitted directly | S19-SWITCHSCAN-04 |
| SWITCHSCAN-THROW | Calling | callback.throw | matching projection invocation | error downstream with the thrown value; release the open outer and every remaining inner; discard the queue | closed by projection error | S19-SWITCHSCAN-05 |
| SWITCHSCAN-NEXT-ACTIVE | Active | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S19-SWITCHSCAN-06 |
| SWITCHSCAN-INNER-ERROR-ACTIVE | Active | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S19-SWITCHSCAN-07 |
| SWITCHSCAN-CANCEL-ACTIVE | Active | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S19-SWITCHSCAN-08 |
| SWITCHSCAN-INNER-END-ACTIVE | Active | inner.complete | matching inner and empty queue | release the completed inner | remove that inner and keep waiting | S19-SWITCHSCAN-10 |
| SWITCHSCAN-NEXT-DRAINING | Draining | inner.next | the notification belongs to an active inner generation | forward the inner value unchanged | retain the same active set and queue | S19-SWITCHSCAN-06 |
| SWITCHSCAN-INNER-ERROR-DRAINING | Draining | inner.error | the error belongs to an active inner generation | error downstream unchanged; release all owned subscriptions and discard queued values | closed by inner error | S19-SWITCHSCAN-07 |
| SWITCHSCAN-CANCEL-DRAINING | Draining | cancel | between resolved reactions | release the open outer and active inners; discard the queue without notifying downstream | closed by cancellation | S19-SWITCHSCAN-08 |
| SWITCHSCAN-LAST-INNER | Draining | inner.complete | matching final inner and empty queue | complete downstream; release the final inner | closed by successful completion | S19-SWITCHSCAN-11 |
| SWITCHSCAN-OUTER-WAIT | Active | outer.complete | at least one active inner | release the completed outer subscription | outer done; preserve active inners and queued values | S19-SWITCHSCAN-12 |
| SWITCHSCAN-OUTER-END | Active | outer.complete | no active inner and empty queue | complete downstream; release the outer subscription | closed by successful completion | S19-SWITCHSCAN-13 |
| SWITCHSCAN-OUTER-ERROR | Active | outer.error | outer still open | error downstream unchanged; release the outer and active inners; discard the queue | closed by outer error | S19-SWITCHSCAN-14 |
