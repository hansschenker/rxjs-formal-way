# last-predicate-required: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S13-LAST-INIT subscribe [fresh subscription]
    s1 --> s1 : S13-LAST-TAKE source.next [no predicate configured]
    s1 --> s2 : S13-LAST-CHECK source.next [predicate configured and source value arrives]
    s2 --> s1 : S13-LAST-MATCH callback.return [correlated callback returned truthy]
    s2 --> s1 : S13-LAST-REJECT callback.return [correlated callback returned falsy]
    s2 --> s3 : S13-LAST-PREDICATE-ERROR callback.throw [correlated callback throws]
    s1 --> s3 : S13-LAST-EMIT-LAST source.complete [candidate exists]
    s1 --> s3 : S13-LAST-EMIT-DEFAULT source.complete [no candidate and default was explicitly supplied]
    s1 --> s3 : S13-LAST-EMPTY-ERROR source.complete [no candidate and default absent]
    s1 --> s3 : S13-LAST-SOURCE-ERROR source.error [source errors]
    s1 --> s3 : S13-LAST-CANCEL cancel [consumer closes]
```
