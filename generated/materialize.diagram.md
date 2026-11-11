# materialize-notifications: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S14-MATERIALIZE-INIT subscribe [first consumer subscription]
    s1 --> s1 : S14-MATERIALIZE-NEXT source.next [source next value, including undefined]
    s1 --> s2 : S14-MATERIALIZE-END source.complete [source completes normally]
    s1 --> s2 : S14-MATERIALIZE-FAIL source.error [source errors]
    s1 --> s2 : S14-MATERIALIZE-CANCEL cancel [consumer cancels]
```
