# sampleTime-source-first-3: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Listening" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S18-SAMPLETIME-START subscribe [first result subscription]
    s1 --> s1 : S18-SAMPLETIME-REMEMBER source.next [live source emission (any payload)]
    s1 --> s1 : S18-SAMPLETIME-TICK-EMIT timer.fire [current scheduled tick reaches due time; hasValue=true]
    s1 --> s1 : S18-SAMPLETIME-TICK-EMPTY timer.fire [current scheduled tick reaches due time; hasValue=false]
    s1 --> s2 : S18-SAMPLETIME-COMPLETE source.complete [source completes]
    s1 --> s2 : S18-SAMPLETIME-ERROR source.error [source fails]
    s1 --> s2 : S18-SAMPLETIME-CANCEL cancel [consumer cancels]
```
