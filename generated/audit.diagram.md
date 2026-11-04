# audit-Observable-duration: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Idle" as s1
    state "Calling" as s2
    state "Pending" as s3
    state "Waiting" as s4
    state "Closed" as s5
    [*] --> s0
    s0 --> s1 : AUDIT-INIT subscribe [fresh valid clock]
    s1 --> s2 : AUDIT-START source.next [valid clock, fresh generation and duration deadline]
    s3 --> s3 : AUDIT-REPLACE source.next [duration remains active]
    s1 --> s5 : AUDIT-COMPLETE-IDLE source.complete [no active duration]
    s3 --> s4 : AUDIT-COMPLETE-PENDING source.complete [duration active]
    s2 --> s3 : AUDIT-CALL-RETURN callback.return [matching selector invocation]
    s2 --> s5 : AUDIT-CALL-THROW callback.throw [matching selector invocation]
    s3 --> s1 : AUDIT-DURATION-NEXT duration.next [matching live duration next]
    s3 --> s1 : AUDIT-DURATION-COMPLETE duration.complete [matching duration completion without next]
    s3 --> s5 : AUDIT-DURATION-ERROR duration.error [matching live duration error]
    s4 --> s5 : AUDIT-WAITING-DURATION-NEXT duration.next [matching live duration next]
    s4 --> s5 : AUDIT-WAITING-DURATION-COMPLETE duration.complete [matching duration completion without next]
    s4 --> s5 : AUDIT-WAITING-DURATION-ERROR duration.error [matching live duration error]
    s1 --> s5 : AUDIT-SOURCE-ERROR-IDLE source.error [valid clock and live execution]
    s1 --> s5 : AUDIT-CANCEL-IDLE cancel [valid clock and live execution]
    s2 --> s5 : AUDIT-SOURCE-ERROR-CALLING source.error [valid clock and live execution]
    s2 --> s5 : AUDIT-CANCEL-CALLING cancel [valid clock and live execution]
    s3 --> s5 : AUDIT-SOURCE-ERROR-PENDING source.error [valid clock and live execution]
    s3 --> s5 : AUDIT-CANCEL-PENDING cancel [valid clock and live execution]
    s4 --> s5 : AUDIT-CANCEL-WAITING cancel [valid clock and live execution]
```
