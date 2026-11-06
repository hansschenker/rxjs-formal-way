# combineLatestWith-1-observable-inputs: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : COMBINELATESTWITH-INIT subscribe [first downstream connection]
    s1 --> s1 : COMBINELATESTWITH-WAIT input.next [live source; some other source unready]
    s1 --> s1 : COMBINELATESTWITH-EMIT input.next [live source; every other source ready]
    s1 --> s1 : COMBINELATESTWITH-COMPLETE-WAIT input.complete [live source; another source remains live]
    s1 --> s2 : COMBINELATESTWITH-COMPLETE-LAST input.complete [final live input]
    s1 --> s2 : COMBINELATESTWITH-ERROR input.error [currently subscribed input]
    s1 --> s2 : COMBINELATESTWITH-CANCEL cancel [downstream cancels]
```
