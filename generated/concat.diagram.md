# concat-2-observable-inputs: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : CONCAT-INIT subscribe [first downstream connection]
    s1 --> s1 : CONCAT-NEXT input.next [only active input]
    s1 --> s1 : CONCAT-COMPLETE-ADVANCE input.complete [next input exists]
    s1 --> s2 : CONCAT-COMPLETE-LAST input.complete [last input has completed]
    s1 --> s2 : CONCAT-ERROR input.error [currently subscribed input]
    s1 --> s2 : CONCAT-CANCEL cancel [downstream cancels]
```
