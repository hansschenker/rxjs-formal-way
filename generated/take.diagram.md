# take-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored counters and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s2 : TAKE-INIT-ZERO subscribe [count = 0]
    s0 --> s1 : TAKE-INIT-POSITIVE subscribe [count > 0]
    s1 --> s1 : TAKE-NEXT-PASS source.next [seen + 1 < count]
    s1 --> s2 : TAKE-NEXT-LAST source.next [seen + 1 = count]
    s1 --> s2 : TAKE-SOURCE-COMPLETE source.complete [source completes before the quota]
    s1 --> s2 : TAKE-SOURCE-ERROR source.error [source errors before the quota]
    s1 --> s2 : TAKE-CANCEL cancel [downstream cancels before termination]
```
