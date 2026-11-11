# merge-static-2-concurrency-2: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S14-MERGE-INIT subscribe [first consumer connection]
    s1 --> s1 : S14-MERGE-NEXT input.next [resource is currently subscribed]
    s1 --> s1 : S14-MERGE-REFILL input.complete [live input complete and pending FIFO is nonempty]
    s1 --> s1 : S14-MERGE-COMPLETE-WAIT input.complete [pending empty and other inputs live]
    s1 --> s2 : S14-MERGE-COMPLETE-LAST input.complete [pending empty, final live input]
    s1 --> s2 : S14-MERGE-ERROR input.error [any live source fails]
    s1 --> s2 : S14-MERGE-CANCEL cancel [consumer unsubscribe]
```
