# window-observable-boundaries: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Stopped" as s2
    [*] --> s0
    s0 --> s1 : S21-WINDOW-START subscribe [first result connection]
    s1 --> s1 : S21-WINDOW-SOURCE-NEXT source.next [source is live]
    s1 --> s1 : S21-WINDOW-BOUNDARY-NEXT boundary.next [boundary is live and next window identity is a safe integer]
    s1 --> s1 : S21-WINDOW-BOUNDARY-COMPLETE boundary.complete [boundary is live]
    s1 --> s2 : S21-WINDOW-SOURCE-COMPLETE source.complete [source completes successfully]
    s1 --> s2 : S21-WINDOW-SOURCE-ERROR source.error [source is live]
    s1 --> s2 : S21-WINDOW-BOUNDARY-ERROR boundary.error [boundary is live]
    s1 --> s2 : S21-WINDOW-CANCEL cancel [outer consumer cancels the result]
    s1 --> s1 : S21-WINDOW-OBSERVER-LIVE window.subscribe [fresh observer identity names the current open window]
    s1 --> s1 : S21-WINDOW-OBSERVER-COMPLETE-ACTIVE window.subscribe [fresh observer identity names a previously rotated completed handle]
    s1 --> s1 : S21-WINDOW-OBSERVER-UNSUBSCRIBE-ACTIVE window.unsubscribe [addressed consumer subscription remains open]
    s2 --> s2 : S21-WINDOW-OBSERVER-COMPLETE-STOPPED window.subscribe [fresh observer identity names a previously rotated completed handle]
    s2 --> s2 : S21-WINDOW-OBSERVER-UNSUBSCRIBE-STOPPED window.unsubscribe [addressed consumer subscription remains open]
```
