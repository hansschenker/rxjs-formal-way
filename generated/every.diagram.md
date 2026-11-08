# every-indexed-predicate: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : EVERY-INIT subscribe [fresh execution]
    s1 --> s2 : EVERY-CALL source.next [source next at valid index]
    s2 --> s1 : EVERY-TRUE callback.return [correlated truthy predicate outcome]
    s2 --> s3 : EVERY-FALSE callback.return [correlated falsy predicate outcome]
    s2 --> s3 : EVERY-THROW callback.throw [correlated throwing predicate]
    s1 --> s3 : EVERY-SOURCE-COMPLETE source.complete [no falsy predicate occurred]
    s1 --> s3 : EVERY-SOURCE-ERROR source.error [upstream errors]
    s1 --> s3 : EVERY-CANCEL cancel [explicit cancellation]
```
