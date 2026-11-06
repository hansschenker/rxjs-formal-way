# concatMapTo-constant-Observable: state diagram

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
    s0 --> s1 : CONCATMAPTO-INIT subscribe [fresh execution]
    s1 --> s2 : CONCATMAPTO-ADMIT outer.next [a concurrency slot is available and the index can advance]
    s1 --> s1 : CONCATMAPTO-QUEUE outer.next [all concurrency slots are occupied]
    s2 --> s1 : CONCATMAPTO-RETURN-ACTIVE callback.return [matching invocation with resume=Active; returned source is identical to constant binding]
    s2 --> s3 : CONCATMAPTO-RETURN-DRAINING callback.return [matching invocation with resume=Draining; returned source is identical to constant binding]
    s1 --> s1 : CONCATMAPTO-NEXT-ACTIVE inner.next [the notification belongs to an active inner generation]
    s1 --> s4 : CONCATMAPTO-INNER-ERROR-ACTIVE inner.error [the error belongs to an active inner generation]
    s1 --> s4 : CONCATMAPTO-CANCEL-ACTIVE cancel [between resolved reactions]
    s1 --> s2 : CONCATMAPTO-DRAIN-ACTIVE inner.complete [matching inner; queue nonempty; projection index can advance]
    s1 --> s1 : CONCATMAPTO-INNER-END-ACTIVE inner.complete [matching inner and empty queue]
    s3 --> s3 : CONCATMAPTO-NEXT-DRAINING inner.next [the notification belongs to an active inner generation]
    s3 --> s4 : CONCATMAPTO-INNER-ERROR-DRAINING inner.error [the error belongs to an active inner generation]
    s3 --> s4 : CONCATMAPTO-CANCEL-DRAINING cancel [between resolved reactions]
    s3 --> s2 : CONCATMAPTO-DRAIN-DRAINING inner.complete [matching inner; queue nonempty; projection index can advance]
    s3 --> s4 : CONCATMAPTO-LAST-INNER inner.complete [matching final inner and empty queue]
    s1 --> s3 : CONCATMAPTO-OUTER-WAIT outer.complete [at least one active inner]
    s1 --> s4 : CONCATMAPTO-OUTER-END outer.complete [no active inner and empty queue]
    s1 --> s4 : CONCATMAPTO-OUTER-ERROR outer.error [outer still open]
```
