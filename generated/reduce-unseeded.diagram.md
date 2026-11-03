# reduce-unseeded: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Collecting" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : AGG-REDUCE-UNSEEDED-INIT subscribe [fresh subscription]
    s1 --> s1 : AGG-REDUCE-UNSEEDED-FIRST source.next [no memory and a safe source index]
    s1 --> s1 : AGG-REDUCE-UNSEEDED-PLAIN-COUNT source.next [count without predicate; safe source index]
    s1 --> s1 : AGG-REDUCE-UNSEEDED-APPEND source.next [array profile; safe source index]
    s1 --> s2 : AGG-REDUCE-UNSEEDED-CALL source.next [memory exists and callback is required; safe index]
    s2 --> s1 : AGG-REDUCE-UNSEEDED-RETURN callback.return [matches pending callback identity]
    s2 --> s3 : AGG-REDUCE-UNSEEDED-THROW callback.throw [matches pending callback identity]
    s1 --> s3 : AGG-REDUCE-UNSEEDED-COMPLETE-SOME source.complete [aggregate memory is present]
    s1 --> s3 : AGG-REDUCE-UNSEEDED-COMPLETE-EMPTY source.complete [no seed and no source values]
    s1 --> s3 : AGG-REDUCE-UNSEEDED-ERROR source.error [no unresolved callback]
    s1 --> s3 : AGG-REDUCE-UNSEEDED-CANCEL cancel [between resolved notifications]
```
