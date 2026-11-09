# findIndex-first-match: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : FINDINDEX-INIT subscribe [fresh execution]
    s1 --> s2 : FINDINDEX-CALL source.next [valid zero-based index]
    s2 --> s3 : FINDINDEX-MATCH callback.return [correlated truthy result]
    s2 --> s1 : FINDINDEX-MISS callback.return [correlated falsy result]
    s2 --> s3 : FINDINDEX-THROW callback.throw [correlated predicate throw]
    s1 --> s3 : FINDINDEX-NOT-FOUND source.complete [no value matched]
    s1 --> s3 : FINDINDEX-SOURCE-ERROR source.error [source errors]
    s1 --> s3 : FINDINDEX-CANCEL cancel [downstream closes]
```
