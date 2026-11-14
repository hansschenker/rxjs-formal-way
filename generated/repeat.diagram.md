# repeat-bounded-restart-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S17-REPEAT-START subscribe [first downstream subscription]
    s1 --> s1 : S17-REPEAT-NEXT source.next [matching live source generation]
    s1 --> s1 : S17-REPEAT-RESTART source.complete [matching source and attempts<count]
    s1 --> s2 : S17-REPEAT-FINAL-COMPLETE source.complete [matching source and attempts=count]
    s1 --> s2 : S17-REPEAT-ERROR source.error [any matching source error]
    s1 --> s2 : S17-REPEAT-CANCEL cancel [downstream cancels active subscription]
```
