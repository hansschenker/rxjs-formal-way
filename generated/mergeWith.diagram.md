# mergeWith-unbounded-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S15-MERGEWITH-INIT subscribe [first consumer connection]
    s1 --> s1 : S15-MERGEWITH-NEXT input.next [input resource belongs to the current live-input set]
    s1 --> s1 : S15-MERGEWITH-COMPLETE-WAIT input.complete [the completing input is live and at least one other input remains live]
    s1 --> s2 : S15-MERGEWITH-COMPLETE-LAST input.complete [the completing input is the only live input]
    s1 --> s2 : S15-MERGEWITH-ERROR input.error [the failing input belongs to the live-input set]
    s1 --> s2 : S15-MERGEWITH-CANCEL cancel [the result is Active and the consumer unsubscribes]
```
