# skip-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : SKIP-INIT subscribe [fresh execution]
    s1 --> s1 : SKIP-DROP source.next [index < count and index < MAX_SAFE_INTEGER]
    s1 --> s1 : SKIP-PASS source.next [count <= index < MAX_SAFE_INTEGER]
    s1 --> s2 : SKIP-COMPLETE source.complete [active source connection]
    s1 --> s2 : SKIP-ERROR source.error [active source connection]
    s1 --> s2 : SKIP-CANCEL cancel [active source connection]
```
