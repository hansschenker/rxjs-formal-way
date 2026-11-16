# skipLast-FIFO-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S19-SKIPLAST-START subscribe [first subscription]
    s1 --> s1 : S19-SKIPLAST-IDENTITY source.next [count is zero]
    s1 --> s1 : S19-SKIPLAST-BUFFER source.next [nonzero count and FIFO is not full]
    s1 --> s1 : S19-SKIPLAST-RELEASE-OLDEST source.next [positive count and FIFO already full]
    s1 --> s2 : S19-SKIPLAST-COMPLETE source.complete [source completes successfully]
    s1 --> s2 : S19-SKIPLAST-ERROR source.error [source fails]
    s1 --> s2 : S19-SKIPLAST-CANCEL cancel [consumer cancels]
```
