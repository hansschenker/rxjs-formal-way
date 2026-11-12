# observeOn-virtual-fifo-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S15-OBSERVEON-INIT subscribe [first subscription]
    s1 --> s1 : S15-OBSERVEON-QUEUE-NEXT source.next [source live and time is valid]
    s1 --> s1 : S15-OBSERVEON-QUEUE-COMPLETE source.complete [source live and time valid]
    s1 --> s1 : S15-OBSERVEON-QUEUE-ERROR source.error [source live and time valid]
    s1 --> s1 : S15-OBSERVEON-FIRE-NEXT timer.fire [head scheduled notification is next and due]
    s1 --> s2 : S15-OBSERVEON-FIRE-COMPLETE timer.fire [head scheduled completion is due]
    s1 --> s2 : S15-OBSERVEON-FIRE-ERROR timer.fire [head scheduled source error is due]
    s1 --> s2 : S15-OBSERVEON-CANCEL cancel [downstream unsubscribed]
```
