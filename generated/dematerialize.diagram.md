# dematerialize-notification-values: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : DEMATERIALIZE-INIT subscribe [fresh subscription]
    s1 --> s1 : DEMATERIALIZE-NEXT source.next [notification.kind=N]
    s1 --> s2 : DEMATERIALIZE-EMBEDDED-COMPLETE source.next [notification.kind=C]
    s1 --> s2 : DEMATERIALIZE-EMBEDDED-ERROR source.next [notification.kind=E]
    s1 --> s2 : DEMATERIALIZE-SOURCE-COMPLETE source.complete [source completes without embedded terminal]
    s1 --> s2 : DEMATERIALIZE-SOURCE-ERROR source.error [outer errors]
    s1 --> s2 : DEMATERIALIZE-CANCEL cancel [downstream closes]
```
