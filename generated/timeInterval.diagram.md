# timeInterval-external-clock: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "ReadingStart" as s1
    state "Listening" as s2
    state "ReadingNext" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : S21-TIMEINTERVAL-START-READ subscribe [first result connection]
    s1 --> s2 : S21-TIMEINTERVAL-START-RETURN clock.return [matching initial read returns a finite number]
    s1 --> s4 : S21-TIMEINTERVAL-START-THROW clock.throw [matching initial read throws]
    s2 --> s3 : S21-TIMEINTERVAL-NEXT-READ source.next [source is live and next read index can advance safely]
    s3 --> s2 : S21-TIMEINTERVAL-NEXT-RETURN clock.return [matching read is finite and reading minus previous remains finite]
    s3 --> s4 : S21-TIMEINTERVAL-NEXT-THROW clock.throw [matching next-value read throws]
    s2 --> s4 : S21-TIMEINTERVAL-COMPLETE source.complete [source completes while no read is pending]
    s2 --> s4 : S21-TIMEINTERVAL-ERROR source.error [source fails while no read is pending]
    s2 --> s4 : S21-TIMEINTERVAL-CANCEL cancel [consumer cancels between source reactions]
```
