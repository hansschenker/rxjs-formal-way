# race-fixed-observables-atomic-subscription: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Racing" as s1
    state "Winner" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S17-RACE-SUBSCRIBE subscribe [first result subscription with valid fixed Observable inputs]
    s1 --> s2 : S17-RACE-FIRST-NEXT input.next [any live input emits the first value after connection setup]
    s2 --> s2 : S17-RACE-WINNER-NEXT input.next [value is from selected winner subscription]
    s1 --> s3 : S17-RACE-EARLY-COMPLETE input.complete [any racing input completes without a prior next]
    s1 --> s3 : S17-RACE-EARLY-ERROR input.error [any racing input errors before any first next]
    s2 --> s3 : S17-RACE-WINNER-COMPLETE input.complete [selected winner completes]
    s2 --> s3 : S17-RACE-WINNER-ERROR input.error [selected winner errors]
    s1 --> s3 : S17-RACE-CANCEL-RACE cancel [downstream cancels before a winner]
    s2 --> s3 : S17-RACE-CANCEL-WINNER cancel [downstream cancels selected source]
```
