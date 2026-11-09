# expand-unbounded: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Draining" as s2
    state "Calling" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : EXPAND-INIT subscribe [fresh execution]
    s1 --> s3 : EXPAND-OUTER-ADMIT outer.next [capacity available]
    s1 --> s3 : EXPAND-INNER-ADMIT-ACTIVE inner.next [known inner and expansion capacity available]
    s2 --> s3 : EXPAND-INNER-ADMIT-DRAINING inner.next [known inner and expansion capacity available]
    s3 --> s1 : EXPAND-PROJECT-RETURN callback.return [correlated projection return while outer open]
    s3 --> s2 : EXPAND-PROJECT-RETURN-DRAINING callback.return [correlated projection return after outer completion]
    s3 --> s4 : EXPAND-PROJECT-THROW callback.throw [correlated projection throws]
    s1 --> s1 : EXPAND-INNER-COMPLETE-ACTIVE inner.complete [known inner completes with no queued value]
    s2 --> s2 : EXPAND-INNER-COMPLETE-DRAINING-MORE inner.complete [known inner completes but other recursive work remains]
    s2 --> s4 : EXPAND-INNER-COMPLETE-DRAINING-LAST inner.complete [last known inner completes and no queue remains]
    s1 --> s4 : EXPAND-INNER-ERROR-ACTIVE inner.error [known inner errors]
    s2 --> s4 : EXPAND-INNER-ERROR-DRAINING inner.error [known inner errors]
    s1 --> s2 : EXPAND-OUTER-COMPLETE outer.complete [recursive work remains active or queued]
    s1 --> s4 : EXPAND-OUTER-COMPLETE-IDLE outer.complete [no recursive work remains]
    s1 --> s4 : EXPAND-OUTER-ERROR outer.error [outer errors]
    s1 --> s4 : EXPAND-CANCEL-ACTIVE cancel [downstream closes]
    s2 --> s4 : EXPAND-CANCEL-DRAINING cancel [downstream closes]
    s3 --> s4 : EXPAND-CANCEL-CALLING cancel [downstream closes between callback request and outcome]
```
