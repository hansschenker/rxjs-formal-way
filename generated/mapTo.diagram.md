# mapTo-constant: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S13-MAPTO-INIT subscribe [new subscription]
    s1 --> s1 : S13-MAPTO-REPLACE source.next [every input next]
    s1 --> s2 : S13-MAPTO-COMPLETE source.complete [source completes]
    s1 --> s2 : S13-MAPTO-ERROR source.error [source errors]
    s1 --> s2 : S13-MAPTO-CANCEL cancel [downstream cancels]
```
