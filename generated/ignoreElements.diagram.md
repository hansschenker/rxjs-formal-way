# ignoreElements-discard-next: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S13-IGNOREELEMENTS-INIT subscribe [new result subscription]
    s1 --> s1 : S13-IGNOREELEMENTS-DROP source.next [every source value]
    s1 --> s2 : S13-IGNOREELEMENTS-COMPLETE source.complete [normal termination]
    s1 --> s2 : S13-IGNOREELEMENTS-ERROR source.error [failure]
    s1 --> s2 : S13-IGNOREELEMENTS-CANCEL cancel [downstream unsubscribed]
```
