# count-predicate: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Collecting" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : AGG-COUNT-PREDICATE-INIT subscribe [fresh subscription]
    s1 --> s1 : AGG-COUNT-PREDICATE-FIRST source.next [no memory and a safe source index]
    s1 --> s1 : AGG-COUNT-PREDICATE-PLAIN-COUNT source.next [count without predicate; safe source index]
    s1 --> s1 : AGG-COUNT-PREDICATE-APPEND source.next [array profile; safe source index]
    s1 --> s2 : AGG-COUNT-PREDICATE-CALL source.next [memory exists and callback is required; safe index]
    s2 --> s1 : AGG-COUNT-PREDICATE-RETURN callback.return [matches pending callback identity]
    s2 --> s3 : AGG-COUNT-PREDICATE-THROW callback.throw [matches pending callback identity]
    s1 --> s3 : AGG-COUNT-PREDICATE-COMPLETE-SOME source.complete [aggregate memory is present]
    s1 --> s3 : AGG-COUNT-PREDICATE-COMPLETE-EMPTY source.complete [no seed and no source values]
    s1 --> s3 : AGG-COUNT-PREDICATE-ERROR source.error [no unresolved callback]
    s1 --> s3 : AGG-COUNT-PREDICATE-CANCEL cancel [between resolved notifications]
```
