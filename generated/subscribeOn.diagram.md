# subscribeOn-virtualFIFO-delay-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Pending" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s2 : S19-SUBSCRIBEON-SCHEDULE subscribe [downstream starts]
    s2 --> s1 : S19-SUBSCRIBEON-CONNECT timer.fire [matching scheduler action at/after due time]
    s2 --> s3 : S19-SUBSCRIBEON-PENDING-CANCEL cancel [unsubscribe before scheduled action runs]
    s1 --> s1 : S19-SUBSCRIBEON-NEXT source.next [scheduled source subscription is now live]
    s1 --> s3 : S19-SUBSCRIBEON-COMPLETE source.complete [live source completes]
    s1 --> s3 : S19-SUBSCRIBEON-ERROR source.error [live source fails]
    s1 --> s3 : S19-SUBSCRIBEON-ACTIVE-CANCEL cancel [consumer unsubscribes after source acquisition]
```
