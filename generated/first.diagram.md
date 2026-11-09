# first-predicate-required: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : FIRST-INIT subscribe [fresh execution]
    s1 --> s3 : FIRST-DIRECT source.next [predicate omitted]
    s1 --> s2 : FIRST-CALL source.next [predicate supplied and index valid]
    s2 --> s3 : FIRST-MATCH callback.return [correlated truthy predicate result]
    s2 --> s1 : FIRST-MISS callback.return [correlated falsy predicate result]
    s2 --> s3 : FIRST-THROW callback.throw [correlated predicate throw]
    s1 --> s3 : FIRST-EMPTY-DEFAULT source.complete [no admissible value and explicit default supplied]
    s1 --> s3 : FIRST-EMPTY-ERROR source.complete [no admissible value and no default]
    s1 --> s3 : FIRST-SOURCE-ERROR source.error [source errors]
    s1 --> s3 : FIRST-CANCEL cancel [downstream closes]
```
