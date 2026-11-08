# elementAt-2-default: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : ELEMENTAT-INIT subscribe [valid index]
    s1 --> s1 : ELEMENTAT-SKIP source.next [current index differs from requested index]
    s1 --> s2 : ELEMENTAT-HIT source.next [current index equals requested index]
    s1 --> s2 : ELEMENTAT-MISSING-DEFAULT source.complete [index not reached and default supplied]
    s1 --> s2 : ELEMENTAT-MISSING-ERROR source.complete [index not reached and no default]
    s1 --> s2 : ELEMENTAT-SOURCE-ERROR source.error [source fails before indexed value]
    s1 --> s2 : ELEMENTAT-CANCEL cancel [downstream closes early]
```
