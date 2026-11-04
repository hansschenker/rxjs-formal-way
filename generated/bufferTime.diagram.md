# bufferTime-3-restart: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : BUFFERTIME-INIT subscribe [fresh clock and representable initial deadlines]
    s1 --> s1 : BUFFERTIME-NEXT source.next [valid clock, window counter and capacity]
    s1 --> s1 : BUFFERTIME-WINDOW-FIRE window.fire [matching live window and due deadline]
    s1 --> s2 : BUFFERTIME-SOURCE-COMPLETE source.complete [valid clock]
    s1 --> s2 : BUFFERTIME-SOURCE-ERROR source.error [valid clock]
    s1 --> s2 : BUFFERTIME-CANCEL cancel [valid clock between reactions]
```
