# single-indexed-predicate: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S19-SINGLE-START subscribe [first downstream subscriber]
    s1 --> s1 : S19-SINGLE-CANDIDATE source.next [no predicate and no previous candidate]
    s1 --> s3 : S19-SINGLE-SECOND source.next [no predicate and candidate already stored]
    s1 --> s2 : S19-SINGLE-PREDICATE source.next [predicate selected and index safe]
    s2 --> s1 : S19-SINGLE-REJECT callback.return [correlated false predicate result]
    s2 --> s1 : S19-SINGLE-FIRST-MATCH callback.return [correlated true result and no prior match]
    s2 --> s3 : S19-SINGLE-DUPLICATE-MATCH callback.return [correlated true result and prior matching value exists]
    s2 --> s3 : S19-SINGLE-PREDICATE-THROW callback.throw [correlated predicate exception]
    s1 --> s3 : S19-SINGLE-FOUND source.complete [one matching candidate stored]
    s1 --> s3 : S19-SINGLE-EMPTY source.complete [no source values ever observed]
    s1 --> s3 : S19-SINGLE-NOT-FOUND source.complete [source was non-empty but predicate matched nothing]
    s1 --> s3 : S19-SINGLE-SOURCE-ERROR source.error [live source fails]
    s1 --> s3 : S19-SINGLE-CANCEL-ACTIVE cancel [consumer cancels]
    s2 --> s3 : S19-SINGLE-CANCEL-CALLING cancel [consumer cancels]
```
