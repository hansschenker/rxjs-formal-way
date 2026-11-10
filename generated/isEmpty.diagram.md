# isEmpty-short-circuit: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S13-ISEMPTY-INIT subscribe [new result subscription]
    s1 --> s2 : S13-ISEMPTY-NONEMPTY source.next [first next value]
    s1 --> s2 : S13-ISEMPTY-EMPTY source.complete [source completed before next]
    s1 --> s2 : S13-ISEMPTY-ERROR source.error [error before first next]
    s1 --> s2 : S13-ISEMPTY-CANCEL cancel [consumer closes before result]
```
