# windowTime-2-4-max-unbounded: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Stopped" as s2
    [*] --> s0
    s0 --> s1 : S22-WINDOWTIME-START subscribe [first connection; safe supplied scheduler time]
    s1 --> s1 : S22-WINDOWTIME-NEXT source.next [source is live; counts and possible new window identity remain safe]
    s1 --> s1 : S22-WINDOWTIME-WINDOW-TIMER timer.window [current live window timer generation; now is at or after its deadline]
    s1 --> s1 : S22-WINDOWTIME-CREATION-TIMER timer.creation [configured recurring creation timer, matching tick and generation, now at or after due]
    s1 --> s2 : S22-WINDOWTIME-SOURCE-COMPLETE source.complete [source is live]
    s1 --> s2 : S22-WINDOWTIME-SOURCE-ERROR source.error [source is live]
    s1 --> s2 : S22-WINDOWTIME-CANCEL cancel [outer connection is live]
    s1 --> s1 : S22-WINDOWTIME-OBSERVE-OPEN-ACTIVE window.subscribe [fresh observer identity names an open window]
    s1 --> s1 : S22-WINDOWTIME-OBSERVE-COMPLETE-ACTIVE window.subscribe [fresh observer identity names a completed window]
    s1 --> s1 : S22-WINDOWTIME-DETACH-ACTIVE window.unsubscribe [named child observer is attached]
    s2 --> s2 : S22-WINDOWTIME-OBSERVE-OPEN-STOPPED window.subscribe [fresh observer identity names an open window]
    s2 --> s2 : S22-WINDOWTIME-OBSERVE-COMPLETE-STOPPED window.subscribe [fresh observer identity names a completed window]
    s2 --> s2 : S22-WINDOWTIME-DETACH-STOPPED window.unsubscribe [named child observer is attached]
    s2 --> s2 : S22-WINDOWTIME-OBSERVE-ERROR-STOPPED window.subscribe [fresh observer names a window failed by the source]
```
