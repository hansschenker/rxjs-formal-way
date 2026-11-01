# startWith-unscheduled-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Prefix" as s1
    state "Active" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s2 : STARTWITH-INIT-EMPTY subscribe [zero supplied values]
    s0 --> s1 : STARTWITH-INIT-PREFIX subscribe [one or more prefix values]
    s1 --> s1 : STARTWITH-EMIT prefix.next [prefix index < configured length]
    s1 --> s2 : STARTWITH-CONNECT prefix.complete [every prefix value emitted]
    s1 --> s3 : STARTWITH-CANCEL-PREFIX cancel [cancel before source acquisition]
    s2 --> s2 : STARTWITH-NEXT source.next [source connected]
    s2 --> s3 : STARTWITH-COMPLETE source.complete [source completed after prefix]
    s2 --> s3 : STARTWITH-ERROR source.error [source errored after prefix]
    s2 --> s3 : STARTWITH-CANCEL-ACTIVE cancel [source already subscribed]
```
