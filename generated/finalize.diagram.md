# finalize-teardown-callback: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : FINALIZE-INIT subscribe [fresh execution]
    s1 --> s1 : FINALIZE-PASS source.next [source live]
    s1 --> s2 : FINALIZE-COMPLETE source.complete [source completes]
    s1 --> s2 : FINALIZE-ERROR source.error [source errors]
    s1 --> s2 : FINALIZE-CANCEL cancel [explicit unsubscribe]
```
