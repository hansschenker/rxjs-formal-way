# takeWhile-predicate-inclusive: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Testing" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : TAKEWHILE-INIT subscribe [fresh execution]
    s1 --> s2 : TAKEWHILE-CALL source.next [index < MAX_SAFE_INTEGER]
    s2 --> s1 : TAKEWHILE-TRUE callback.return [matching invocation and truthy result]
    s2 --> s3 : TAKEWHILE-FALSE callback.return [matching invocation and falsy result]
    s2 --> s3 : TAKEWHILE-THROW callback.throw [matching pending invocation]
    s1 --> s3 : TAKEWHILE-TESTING-COMPLETE source.complete [no unresolved predicate invocation]
    s1 --> s3 : TAKEWHILE-TESTING-ERROR source.error [no unresolved predicate invocation]
    s1 --> s3 : TAKEWHILE-TESTING-CANCEL cancel [no unresolved predicate invocation]
```
