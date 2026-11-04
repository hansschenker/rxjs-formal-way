# buffer-Observable-closing-notifier: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : BUFFER-INIT subscribe [fresh execution]
    s1 --> s1 : BUFFER-NEXT source.next [connected with valid counter]
    s1 --> s2 : BUFFER-SOURCE-COMPLETE source.complete [connected]
    s1 --> s2 : BUFFER-SOURCE-ERROR source.error [connected]
    s1 --> s2 : BUFFER-CANCEL cancel [connected between reactions]
    s1 --> s1 : BUFFER-NOTIFIER-NEXT notifier.next [closing notifier still active]
    s1 --> s1 : BUFFER-NOTIFIER-COMPLETE notifier.complete [closing notifier still active]
    s1 --> s2 : BUFFER-NOTIFIER-ERROR notifier.error [closing notifier still active]
```
