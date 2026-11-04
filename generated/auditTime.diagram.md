# auditTime-3: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Idle" as s1
    state "Pending" as s2
    state "Waiting" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : AUDITTIME-INIT subscribe [fresh valid clock]
    s1 --> s2 : AUDITTIME-START source.next [valid clock, fresh generation and duration deadline]
    s2 --> s2 : AUDITTIME-REPLACE source.next [duration remains active]
    s1 --> s4 : AUDITTIME-COMPLETE-IDLE source.complete [no active duration]
    s2 --> s3 : AUDITTIME-COMPLETE-PENDING source.complete [duration active]
    s2 --> s1 : AUDITTIME-DURATION-NEXT timer.fire [matching timer identity at or after deadline]
    s3 --> s4 : AUDITTIME-WAITING-DURATION-NEXT timer.fire [matching timer identity at or after deadline]
    s1 --> s4 : AUDITTIME-SOURCE-ERROR-IDLE source.error [valid clock and live execution]
    s1 --> s4 : AUDITTIME-CANCEL-IDLE cancel [valid clock and live execution]
    s2 --> s4 : AUDITTIME-SOURCE-ERROR-PENDING source.error [valid clock and live execution]
    s2 --> s4 : AUDITTIME-CANCEL-PENDING cancel [valid clock and live execution]
    s3 --> s4 : AUDITTIME-CANCEL-WAITING cancel [valid clock and live execution]
```
