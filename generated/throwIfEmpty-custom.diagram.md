# throwIfEmpty-custom: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Listening" as s1
    state "CreatingError" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S20-THROWIFEMPTY-START subscribe [first consumer connection]
    s1 --> s1 : S20-THROWIFEMPTY-NEXT source.next [source subscription is live]
    s1 --> s3 : S20-THROWIFEMPTY-COMPLETE-NONEMPTY source.complete [at least one value has arrived]
    s1 --> s2 : S20-THROWIFEMPTY-COMPLETE-EMPTY source.complete [no value has arrived]
    s2 --> s3 : S20-THROWIFEMPTY-FACTORY-RETURN callback.return [outcome belongs to errorFactory invocation zero]
    s2 --> s3 : S20-THROWIFEMPTY-FACTORY-THROW callback.throw [outcome belongs to errorFactory invocation zero]
    s1 --> s3 : S20-THROWIFEMPTY-SOURCE-ERROR source.error [source fails, regardless of value presence]
    s1 --> s3 : S20-THROWIFEMPTY-CANCEL cancel [consumer cancels before source termination]
```
