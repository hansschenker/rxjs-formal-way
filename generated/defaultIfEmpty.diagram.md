# defaultIfEmpty-opaque-fallback: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : DEFAULTIFEMPTY-INIT subscribe [new subscription]
    s1 --> s1 : DEFAULTIFEMPTY-NEXT source.next [source live]
    s1 --> s2 : DEFAULTIFEMPTY-EMPTY source.complete [no source value was seen]
    s1 --> s2 : DEFAULTIFEMPTY-NONEMPTY source.complete [some source next was seen]
    s1 --> s2 : DEFAULTIFEMPTY-ERROR source.error [source errored]
    s1 --> s2 : DEFAULTIFEMPTY-CANCEL cancel [downstream unsubscribed]
```
