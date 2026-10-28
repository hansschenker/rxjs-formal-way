# map-project: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : MAP-INIT subscribe [fresh execution]
    s1 --> s2 : MAP-CALL source.next [index < Number.MAX_SAFE_INTEGER]
    s2 --> s1 : MAP-RETURN callback.return [outcome identifies the pending invocation]
    s2 --> s3 : MAP-THROW callback.throw [outcome identifies the pending invocation]
    s1 --> s3 : MAP-COMPLETE source.complete [no unresolved callback]
    s1 --> s3 : MAP-ERROR source.error [no unresolved callback]
    s1 --> s3 : MAP-CANCEL cancel [between resolved value reactions]
```
