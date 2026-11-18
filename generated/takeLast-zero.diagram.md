# takeLast-0: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Closed" as s1
    [*] --> s0
    s0 --> s1 : S20-TAKELAST-START-EMPTY subscribe [configured count is nonpositive]
```
