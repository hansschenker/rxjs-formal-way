# groupBy-default-subject-key-leases: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Calling" as s2
    state "Orphaned" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : S13-GROUPBY-INIT subscribe [fresh outer subscriber]
    s1 --> s2 : S13-GROUPBY-SELECT-Active source.next [shared source live; key index is safe]
    s1 --> s4 : S13-GROUPBY-DONE-Active source.complete [source ends normally]
    s1 --> s4 : S13-GROUPBY-ERROR-Active source.error [source errors]
    s1 --> s1 : S13-GROUPBY-ATTACH-Active group.subscribe [known group has no active subscriber]
    s1 --> s1 : S13-GROUPBY-DETACH-ACTIVE group.unsubscribe [known group has its one active subscriber]
    s3 --> s2 : S13-GROUPBY-SELECT-Orphaned source.next [shared source live; key index is safe]
    s3 --> s4 : S13-GROUPBY-DONE-Orphaned source.complete [source ends normally]
    s3 --> s4 : S13-GROUPBY-ERROR-Orphaned source.error [source errors]
    s3 --> s3 : S13-GROUPBY-ATTACH-Orphaned group.subscribe [known group has no active subscriber]
    s3 --> s3 : S13-GROUPBY-DETACH-RETAIN group.unsubscribe [another group remains subscribed]
    s3 --> s4 : S13-GROUPBY-DETACH-LAST group.unsubscribe [last live child lease released after outer cancellation]
    s2 --> s1 : S13-GROUPBY-KEY-EXISTING-Active callback.return [correlated key and Map has an existing subject]
    s2 --> s1 : S13-GROUPBY-KEY-NEW-Active callback.return [correlated key not yet in Map]
    s2 --> s4 : S13-GROUPBY-KEY-THROW-Active callback.throw [correlated key selector throws]
    s2 --> s3 : S13-GROUPBY-KEY-EXISTING-Orphaned callback.return [correlated key and Map has an existing subject]
    s2 --> s3 : S13-GROUPBY-KEY-NEW-Orphaned callback.return [correlated key not yet in Map]
    s2 --> s4 : S13-GROUPBY-KEY-THROW-Orphaned callback.throw [correlated key selector throws]
    s1 --> s4 : S13-GROUPBY-CANCEL-NO-CHILD cancel [outer unsubscribes with no active group subscribers]
    s1 --> s3 : S13-GROUPBY-CANCEL-WITH-CHILD cancel [at least one group subscriber remains]
```
