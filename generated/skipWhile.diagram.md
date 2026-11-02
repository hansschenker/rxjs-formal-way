# skipWhile-predicate: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Testing" as s1
    state "Calling" as s2
    state "Open" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : SKIPWHILE-INIT subscribe [fresh execution]
    s1 --> s2 : SKIPWHILE-CALL source.next [index < MAX_SAFE_INTEGER]
    s2 --> s1 : SKIPWHILE-TRUE callback.return [matching invocation and truthy result]
    s2 --> s3 : SKIPWHILE-FALSE callback.return [matching invocation and falsy result]
    s3 --> s3 : SKIPWHILE-OPEN-PASS source.next [gate has opened]
    s2 --> s4 : SKIPWHILE-THROW callback.throw [matching pending invocation]
    s1 --> s4 : SKIPWHILE-TESTING-COMPLETE source.complete [no unresolved predicate invocation]
    s1 --> s4 : SKIPWHILE-TESTING-ERROR source.error [no unresolved predicate invocation]
    s1 --> s4 : SKIPWHILE-TESTING-CANCEL cancel [no unresolved predicate invocation]
    s3 --> s4 : SKIPWHILE-OPEN-COMPLETE source.complete [no unresolved predicate invocation]
    s3 --> s4 : SKIPWHILE-OPEN-ERROR source.error [no unresolved predicate invocation]
    s3 --> s4 : SKIPWHILE-OPEN-CANCEL cancel [no unresolved predicate invocation]
```
