# pairwise-reference: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : PAIRWISE-INIT subscribe [new execution]
    s1 --> s1 : PAIRWISE-FIRST source.next [no previous source value]
    s1 --> s1 : PAIRWISE-NEXT source.next [previous value remembered]
    s1 --> s2 : PAIRWISE-COMPLETE source.complete [source finishes with any number of values]
    s1 --> s2 : PAIRWISE-ERROR source.error [source errors]
    s1 --> s2 : PAIRWISE-CANCEL cancel [downstream unsubscribes]
```
