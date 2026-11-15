# refCount-publish-Subject-legacy: state transition table

> Generated from the canonical model by npm run generate. Do not edit this projection.

Symbolic rules for the declared parameter domain. Guarded rows may be unreachable for a particular configuration.

| Rule | Current control | Event | Guard | Ordered actions | Next state | Obligations |
|---|---|---|---|---|---|---|
| S18-REFCOUNT-CONNECT | Disconnected | subscriber.subscribe | fresh subscription ID and available connection generation | subscribe to the source under a fresh connection generation | one registered subscriber and one connection | S18-REFCOUNT-01 |
| S18-REFCOUNT-JOIN | Connected | subscriber.subscribe | fresh subscription ID | no actions | append subscriber to the existing connection, without replay | S18-REFCOUNT-02 |
| S18-REFCOUNT-NEXT | Connected | source.next | current source generation | forward the value to each currently registered subscriber in registration order | retain the connection and registry | S18-REFCOUNT-03 |
| S18-REFCOUNT-LEAVE | Connected | subscriber.unsubscribe | registered subscriber and at least one other remains | no actions | remove only this subscriber | S18-REFCOUNT-04 |
| S18-REFCOUNT-LAST-RESET | Connected | subscriber.unsubscribe | the last registered subscriber leaves; resetOnRefCountZero=true | unsubscribe the source | reset the connection with no live subscribers | S18-REFCOUNT-05 |
| S18-REFCOUNT-COMPLETE-RETAIN | Connected | source.complete | current generation; resetOnComplete=false | send complete to each current subscriber; release the source connection | retain terminal status with no live connection or registered subscribers | S18-REFCOUNT-07 |
| S18-REFCOUNT-LATE-COMPLETE | Completed | subscriber.subscribe | fresh subscription ID; retained terminal Subject | send the cached complete to this subscriber only | remain terminated without connecting or retaining the new subscriber | S18-REFCOUNT-09 |
| S18-REFCOUNT-ERROR-RETAIN | Connected | source.error | current generation; resetOnError=false | send error to each current subscriber; release the source connection | retain terminal status with no live connection or registered subscribers | S18-REFCOUNT-08 |
| S18-REFCOUNT-LATE-ERROR | Errored | subscriber.subscribe | fresh subscription ID; retained terminal Subject | send the cached error to this subscriber only | remain terminated without connecting or retaining the new subscriber | S18-REFCOUNT-09 |
