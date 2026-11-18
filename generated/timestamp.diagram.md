# timestamp-external-clock: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Listening" as s1
    state "ReadingNext" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S21-TIMESTAMP-START subscribe [first result connection]
    s1 --> s2 : S21-TIMESTAMP-NEXT-READ source.next [source is live and next read index can advance safely]
    s2 --> s1 : S21-TIMESTAMP-NEXT-RETURN clock.return [matching read is finite]
    s2 --> s3 : S21-TIMESTAMP-NEXT-THROW clock.throw [matching next-value read throws]
    s1 --> s3 : S21-TIMESTAMP-COMPLETE source.complete [source completes while no read is pending]
    s1 --> s3 : S21-TIMESTAMP-ERROR source.error [source fails while no read is pending]
    s1 --> s3 : S21-TIMESTAMP-CANCEL cancel [consumer cancels between source reactions]
```
