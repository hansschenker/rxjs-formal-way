# throttle-00: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Open" as s1
    state "Selecting" as s2
    state "Throttled" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : S20-THROTTLE-START subscribe [first result connection; valid nondecreasing supplied time]
    s1 --> s2 : S20-THROTTLE-OPEN-NEXT source.next [no active duration; leading=false; valid nondecreasing supplied time]
    s2 --> s3 : S20-THROTTLE-SELECTOR-RETURN callback.return [current selector invocation returns a valid Observable token at the same time; valid nondecreasing supplied time]
    s2 --> s4 : S20-THROTTLE-SELECTOR-THROW callback.throw [current selector invocation throws at the same time; valid nondecreasing supplied time]
    s3 --> s3 : S20-THROTTLE-REMEMBER source.next [a duration is active; valid nondecreasing supplied time]
    s3 --> s1 : S20-THROTTLE-END-OPEN duration.next [current duration ends; trailing=false; valid nondecreasing supplied time]
    s3 --> s1 : S20-THROTTLE-DURATION-EMPTY duration.complete [current duration completes without a next; valid nondecreasing supplied time]
    s1 --> s4 : S20-THROTTLE-COMPLETE-OPEN source.complete [source completes with no active duration; valid nondecreasing supplied time]
    s3 --> s4 : S20-THROTTLE-COMPLETE-NOW source.complete [trailing=false; valid nondecreasing supplied time]
    s1 --> s4 : S20-THROTTLE-SOURCE-ERROR-OPEN source.error [source fails; valid nondecreasing supplied time]
    s3 --> s4 : S20-THROTTLE-SOURCE-ERROR-THROTTLED source.error [source fails; valid nondecreasing supplied time]
    s1 --> s4 : S20-THROTTLE-CANCEL-OPEN cancel [consumer cancels this execution; valid nondecreasing supplied time]
    s3 --> s4 : S20-THROTTLE-CANCEL-THROTTLED cancel [consumer cancels this execution; valid nondecreasing supplied time]
    s3 --> s4 : S20-THROTTLE-DURATION-ERROR-THROTTLED duration.error [currently owned duration fails; valid nondecreasing supplied time]
```
