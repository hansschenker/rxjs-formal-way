# combineLatest-1-observable-inputs: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : COMBINELATEST-INIT subscribe [first downstream connection]
    s1 --> s1 : COMBINELATEST-WAIT input.next [live source; some other source unready]
    s1 --> s1 : COMBINELATEST-EMIT input.next [live source; every other source ready]
    s1 --> s1 : COMBINELATEST-COMPLETE-WAIT input.complete [live source; another source remains live]
    s1 --> s2 : COMBINELATEST-COMPLETE-LAST input.complete [final live input]
    s1 --> s2 : COMBINELATEST-ERROR input.error [currently subscribed input]
    s1 --> s2 : COMBINELATEST-CANCEL cancel [downstream cancels]
```
