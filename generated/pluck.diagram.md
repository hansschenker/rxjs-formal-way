# pluck-plain-data-path: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S16-PLUCK-INIT subscribe [first downstream connection]
    s1 --> s1 : S16-PLUCK-NEXT source.next [plain-data property path can be read]
    s1 --> s2 : S16-PLUCK-COMPLETE source.complete [source completes]
    s1 --> s2 : S16-PLUCK-ERROR source.error [source errors]
    s1 --> s2 : S16-PLUCK-CANCEL cancel [downstream cancels]
```
