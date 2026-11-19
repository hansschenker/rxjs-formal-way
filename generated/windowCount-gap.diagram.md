# windowCount-2-stride-3: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Stopped" as s2
    [*] --> s0
    s0 --> s1 : S22-WINDOWCOUNT-START subscribe [no upstream connection exists]
    s1 --> s1 : S22-WINDOWCOUNT-NEXT source.next [safe source count and window identity]
    s1 --> s2 : S22-WINDOWCOUNT-SOURCE-COMPLETE source.complete [source is live]
    s1 --> s2 : S22-WINDOWCOUNT-SOURCE-ERROR source.error [source is live]
    s1 --> s2 : S22-WINDOWCOUNT-CANCEL cancel [outer subscriber cancels between events]
    s1 --> s1 : S22-WINDOWCOUNT-OBSERVE-OPEN-ACTIVE window.subscribe [fresh observer ID names an open window; after stop, only cancelled windows stay open]
    s1 --> s1 : S22-WINDOWCOUNT-OBSERVE-COMPLETE-ACTIVE window.subscribe [fresh observer ID names a completed window]
    s1 --> s1 : S22-WINDOWCOUNT-OBSERVER-UNSUBSCRIBE-ACTIVE window.unsubscribe [addressed observer owns an open window subscription]
    s2 --> s2 : S22-WINDOWCOUNT-OBSERVE-OPEN-STOPPED window.subscribe [fresh observer ID names an open window; after stop, only cancelled windows stay open]
    s2 --> s2 : S22-WINDOWCOUNT-OBSERVE-COMPLETE-STOPPED window.subscribe [fresh observer ID names a completed window]
    s2 --> s2 : S22-WINDOWCOUNT-OBSERVE-ERROR-STOPPED window.subscribe [fresh observer names a failed window, which can occur only after source error]
    s2 --> s2 : S22-WINDOWCOUNT-OBSERVER-UNSUBSCRIBE-STOPPED window.unsubscribe [addressed observer owns an open window subscription]
```
