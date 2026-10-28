# filter-predicate: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : FILTER-INIT subscribe [fresh execution]
    s1 --> s2 : FILTER-CALL source.next [index < Number.MAX_SAFE_INTEGER]
    s2 --> s1 : FILTER-PASS callback.return [matching invocation and truthy result]
    s2 --> s1 : FILTER-DROP callback.return [matching invocation and falsy result]
    s2 --> s3 : FILTER-THROW callback.throw [outcome identifies the pending invocation]
    s1 --> s3 : FILTER-COMPLETE source.complete [no unresolved callback]
    s1 --> s3 : FILTER-ERROR source.error [no unresolved callback]
    s1 --> s3 : FILTER-CANCEL cancel [between resolved value reactions]
```
