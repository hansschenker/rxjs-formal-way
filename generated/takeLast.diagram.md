# takeLast-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Collecting" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S20-TAKELAST-START subscribe [first consumer connection and count > 0]
    s1 --> s1 : S20-TAKELAST-APPEND source.next [buffer has fewer than count values]
    s1 --> s1 : S20-TAKELAST-REPLACE-OLDEST source.next [buffer has count values]
    s1 --> s2 : S20-TAKELAST-COMPLETE-FLUSH source.complete [source completes successfully]
    s1 --> s2 : S20-TAKELAST-ERROR source.error [source fails]
    s1 --> s2 : S20-TAKELAST-CANCEL cancel [consumer closes the connection]
```
