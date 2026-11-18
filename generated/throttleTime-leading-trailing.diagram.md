# throttleTime-11-4: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Open" as s1
    state "Throttled" as s2
    state "Waiting" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : S20-THROTTLETIME-START subscribe [first result connection; valid nondecreasing supplied time]
    s1 --> s2 : S20-THROTTLETIME-OPEN-NEXT source.next [no active duration; leading=true; valid nondecreasing supplied time]
    s2 --> s2 : S20-THROTTLETIME-REMEMBER source.next [a duration is active; valid nondecreasing supplied time]
    s2 --> s2 : S20-THROTTLETIME-END-EMIT-RESTART timer.fire [current duration ends with a pending value and trailing=true; valid nondecreasing supplied time]
    s2 --> s1 : S20-THROTTLETIME-END-OPEN timer.fire [current duration ends without a pending value; valid nondecreasing supplied time]
    s1 --> s4 : S20-THROTTLETIME-COMPLETE-OPEN source.complete [source completes with no active duration; valid nondecreasing supplied time]
    s2 --> s3 : S20-THROTTLETIME-COMPLETE-WAIT source.complete [trailing=true and a value is pending behind a live duration; valid nondecreasing supplied time]
    s3 --> s4 : S20-THROTTLETIME-WAIT-END timer.fire [current duration ends after source completion; valid nondecreasing supplied time]
    s2 --> s4 : S20-THROTTLETIME-COMPLETE-NOW source.complete [there is no pending value; valid nondecreasing supplied time]
    s1 --> s4 : S20-THROTTLETIME-SOURCE-ERROR-OPEN source.error [source fails; valid nondecreasing supplied time]
    s2 --> s4 : S20-THROTTLETIME-SOURCE-ERROR-THROTTLED source.error [source fails; valid nondecreasing supplied time]
    s1 --> s4 : S20-THROTTLETIME-CANCEL-OPEN cancel [consumer cancels this execution; valid nondecreasing supplied time]
    s2 --> s4 : S20-THROTTLETIME-CANCEL-THROTTLED cancel [consumer cancels this execution; valid nondecreasing supplied time]
    s3 --> s4 : S20-THROTTLETIME-CANCEL-WAITING cancel [consumer cancels this execution; valid nondecreasing supplied time]
```
