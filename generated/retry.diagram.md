# retry-bounded-restart-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S17-RETRY-START subscribe [first downstream subscription]
    s1 --> s1 : S17-RETRY-NEXT source.next [matching live source generation]
    s1 --> s2 : S17-RETRY-COMPLETE source.complete [successful source completion]
    s1 --> s1 : S17-RETRY-RETRY source.error [matching source and failureCount<count]
    s1 --> s2 : S17-RETRY-RETRY-EXHAUSTED source.error [matching error and retry budget exhausted]
    s1 --> s2 : S17-RETRY-CANCEL cancel [downstream cancels active subscription]
```
