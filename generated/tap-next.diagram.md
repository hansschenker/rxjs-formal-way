# tap-next: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Listening" as s1
    state "Calling" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S20-TAP-START subscribe [first consumer connection]
    s1 --> s2 : S20-TAP-NEXT-CALL source.next [source is live; matching hook is configured]
    s2 --> s1 : S20-TAP-NEXT-RETURN callback.return [return matches the pending next invocation]
    s2 --> s3 : S20-TAP-NEXT-THROW callback.throw [throw matches the pending next invocation]
    s1 --> s3 : S20-TAP-ERROR-PASS source.error [source is live; matching hook is absent]
    s1 --> s3 : S20-TAP-COMPLETE-PASS source.complete [source is live; matching hook is absent]
    s1 --> s3 : S20-TAP-CANCEL cancel [consumer cancels between source notifications]
```
