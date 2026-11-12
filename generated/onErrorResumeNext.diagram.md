# onErrorResumeNext-pipeable-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S15-ONERRORRESUMENEXT-INIT subscribe [first subscription]
    s1 --> s1 : S15-ONERRORRESUMENEXT-NEXT input.next [matching current source]
    s1 --> s1 : S15-ONERRORRESUMENEXT-COMPLETE-ADVANCE input.complete [current input terminal and one later input remains]
    s1 --> s2 : S15-ONERRORRESUMENEXT-COMPLETE-LAST input.complete [final current input terminates]
    s1 --> s1 : S15-ONERRORRESUMENEXT-ERROR-ADVANCE input.error [current input terminal and one later input remains]
    s1 --> s2 : S15-ONERRORRESUMENEXT-ERROR-LAST input.error [final current input terminates]
    s1 --> s2 : S15-ONERRORRESUMENEXT-CANCEL cancel [downstream cancellation]
```
