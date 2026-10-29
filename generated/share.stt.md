# share-111: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| SHARE-CONNECT | Disconnected | subscriber.subscribe | fresh subscription ID and available connection generation | subscribe to the source under a fresh connection generation | one registered subscriber and one connection | S2-SHARE-01 |
| SHARE-JOIN | Connected | subscriber.subscribe | fresh subscription ID | no actions | append subscriber to the existing connection, without replay | S2-SHARE-02 |
| SHARE-NEXT | Connected | source.next | current source generation | forward the value to each currently registered subscriber in registration order | retain the connection and registry | S2-SHARE-03 |
| SHARE-LEAVE | Connected | subscriber.unsubscribe | registered subscriber and at least one other remains | no actions | remove only this subscriber | S2-SHARE-04 |
| SHARE-LAST-RESET | Connected | subscriber.unsubscribe | the last registered subscriber leaves; resetOnRefCountZero=true | unsubscribe the source | reset the connection with no live subscribers | S2-SHARE-05 |
| SHARE-COMPLETE-RESET | Connected | source.complete | current generation; resetOnComplete=true | send complete to each current subscriber; release the source connection | reset for a later fresh subscription | S2-SHARE-07 |
| SHARE-ERROR-RESET | Connected | source.error | current generation; resetOnError=true | send error to each current subscriber; release the source connection | reset for a later fresh subscription | S2-SHARE-08 |
