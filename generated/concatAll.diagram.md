# concatAll-1: state diagram

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
    s0 --> s1 : CONCATALL-INIT subscribe [fresh execution]
    s1 --> s2 : CONCATALL-ADMIT outer.next [a concurrency slot is available and the index can advance]
    s1 --> s1 : CONCATALL-QUEUE outer.next [all concurrency slots are occupied]
    s2 --> s1 : CONCATALL-RETURN-ACTIVE callback.return [matching invocation with resume=Active; result is identical to pending inner source]
    s2 --> s3 : CONCATALL-RETURN-DRAINING callback.return [matching invocation with resume=Draining; result is identical to pending inner source]
    s1 --> s1 : CONCATALL-NEXT-ACTIVE inner.next [the notification belongs to an active inner generation]
    s1 --> s4 : CONCATALL-INNER-ERROR-ACTIVE inner.error [the error belongs to an active inner generation]
    s1 --> s4 : CONCATALL-CANCEL-ACTIVE cancel [between resolved reactions]
    s1 --> s2 : CONCATALL-DRAIN-ACTIVE inner.complete [matching inner; queue nonempty; projection index can advance]
    s1 --> s1 : CONCATALL-INNER-END-ACTIVE inner.complete [matching inner and empty queue]
    s3 --> s3 : CONCATALL-NEXT-DRAINING inner.next [the notification belongs to an active inner generation]
    s3 --> s4 : CONCATALL-INNER-ERROR-DRAINING inner.error [the error belongs to an active inner generation]
    s3 --> s4 : CONCATALL-CANCEL-DRAINING cancel [between resolved reactions]
    s3 --> s2 : CONCATALL-DRAIN-DRAINING inner.complete [matching inner; queue nonempty; projection index can advance]
    s3 --> s4 : CONCATALL-LAST-INNER inner.complete [matching final inner and empty queue]
    s1 --> s3 : CONCATALL-OUTER-WAIT outer.complete [at least one active inner]
    s1 --> s4 : CONCATALL-OUTER-END outer.complete [no active inner and empty queue]
    s1 --> s4 : CONCATALL-OUTER-ERROR outer.error [outer still open]
```
