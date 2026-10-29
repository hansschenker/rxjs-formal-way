# concatMap-1: state diagram

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
    s0 --> s1 : CONCATMAP-INIT subscribe [fresh execution]
    s1 --> s2 : CONCATMAP-ADMIT outer.next [a concurrency slot is available and the index can advance]
    s1 --> s1 : CONCATMAP-QUEUE outer.next [all concurrency slots are occupied]
    s2 --> s1 : CONCATMAP-RETURN-ACTIVE callback.return [matching invocation with resume=Active]
    s2 --> s3 : CONCATMAP-RETURN-DRAINING callback.return [matching invocation with resume=Draining]
    s2 --> s4 : CONCATMAP-THROW callback.throw [matching projection invocation]
    s1 --> s1 : CONCATMAP-NEXT-ACTIVE inner.next [the notification belongs to an active inner generation]
    s1 --> s4 : CONCATMAP-INNER-ERROR-ACTIVE inner.error [the error belongs to an active inner generation]
    s1 --> s4 : CONCATMAP-CANCEL-ACTIVE cancel [between resolved reactions]
    s1 --> s2 : CONCATMAP-DRAIN-ACTIVE inner.complete [matching inner; queue nonempty; projection index can advance]
    s1 --> s1 : CONCATMAP-INNER-END-ACTIVE inner.complete [matching inner and empty queue]
    s3 --> s3 : CONCATMAP-NEXT-DRAINING inner.next [the notification belongs to an active inner generation]
    s3 --> s4 : CONCATMAP-INNER-ERROR-DRAINING inner.error [the error belongs to an active inner generation]
    s3 --> s4 : CONCATMAP-CANCEL-DRAINING cancel [between resolved reactions]
    s3 --> s2 : CONCATMAP-DRAIN-DRAINING inner.complete [matching inner; queue nonempty; projection index can advance]
    s3 --> s4 : CONCATMAP-LAST-INNER inner.complete [matching final inner and empty queue]
    s1 --> s3 : CONCATMAP-OUTER-WAIT outer.complete [at least one active inner]
    s1 --> s4 : CONCATMAP-OUTER-END outer.complete [no active inner and empty queue]
    s1 --> s4 : CONCATMAP-OUTER-ERROR outer.error [outer still open]
```
