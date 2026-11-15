# retryWhen-persistent-errors-notifier: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Waiting" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S18-RETRYWHEN-START subscribe [first result subscription]
    s1 --> s1 : S18-RETRYWHEN-FORWARD source.next [current source generation sends a value]
    s1 --> s2 : S18-RETRYWHEN-FIRST-ERROR source.error [matching source error and notifier absent]
    s1 --> s2 : S18-RETRYWHEN-LATER-ERROR source.error [matching source error and notifier already open]
    s2 --> s1 : S18-RETRYWHEN-RETRY notifier.next [one notifier next while source is stopped]
    s1 --> s3 : S18-RETRYWHEN-NOTIFIER-COMPLETE-ACTIVE notifier.complete [open notifier completes]
    s1 --> s3 : S18-RETRYWHEN-NOTIFIER-ERROR-ACTIVE notifier.error [open notifier errors]
    s1 --> s3 : S18-RETRYWHEN-CANCEL-ACTIVE cancel [consumer cancels]
    s2 --> s3 : S18-RETRYWHEN-NOTIFIER-COMPLETE-WAITING notifier.complete [open notifier completes]
    s2 --> s3 : S18-RETRYWHEN-NOTIFIER-ERROR-WAITING notifier.error [open notifier errors]
    s2 --> s3 : S18-RETRYWHEN-CANCEL-WAITING cancel [consumer cancels]
    s1 --> s3 : S18-RETRYWHEN-SOURCE-COMPLETE source.complete [matching source generation completes]
```
