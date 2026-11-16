# switchMapTo-constant: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Draining" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : SWITCHMAPTO-INIT subscribe [fresh execution]
    s1 --> s2 : SWITCHMAPTO-ADMIT outer.next [a concurrency slot is available and the index can advance]
    s1 --> s2 : SWITCHMAPTO-REPLACE outer.next [an inner is active and the index can advance]
    s2 --> s1 : SWITCHMAPTO-RETURN-ACTIVE callback.return [matching invocation with resume=Active]
    s1 --> s1 : SWITCHMAPTO-NEXT-ACTIVE inner.next [the notification belongs to an active inner generation]
    s1 --> s4 : SWITCHMAPTO-INNER-ERROR-ACTIVE inner.error [the error belongs to an active inner generation]
    s1 --> s4 : SWITCHMAPTO-CANCEL-ACTIVE cancel [between resolved reactions]
    s1 --> s1 : SWITCHMAPTO-INNER-END-ACTIVE inner.complete [matching inner and empty queue]
    s3 --> s3 : SWITCHMAPTO-NEXT-DRAINING inner.next [the notification belongs to an active inner generation]
    s3 --> s4 : SWITCHMAPTO-INNER-ERROR-DRAINING inner.error [the error belongs to an active inner generation]
    s3 --> s4 : SWITCHMAPTO-CANCEL-DRAINING cancel [between resolved reactions]
    s3 --> s4 : SWITCHMAPTO-LAST-INNER inner.complete [matching final inner and empty queue]
    s1 --> s3 : SWITCHMAPTO-OUTER-WAIT outer.complete [at least one active inner]
    s1 --> s4 : SWITCHMAPTO-OUTER-END outer.complete [no active inner and empty queue]
    s1 --> s4 : SWITCHMAPTO-OUTER-ERROR outer.error [outer still open]
```
