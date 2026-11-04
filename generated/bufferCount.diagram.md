# bufferCount-3-every-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : BUFFERCOUNT-INIT subscribe [fresh execution]
    s1 --> s1 : BUFFERCOUNT-NEXT source.next [connected with valid counter]
    s1 --> s2 : BUFFERCOUNT-SOURCE-COMPLETE source.complete [connected]
    s1 --> s2 : BUFFERCOUNT-SOURCE-ERROR source.error [connected]
    s1 --> s2 : BUFFERCOUNT-CANCEL cancel [connected between reactions]
```
