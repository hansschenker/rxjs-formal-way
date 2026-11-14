# repeatWhen-persistent-notifier-post-setup: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Active" as s1
    state "Waiting" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : S17-REPEATWHEN-START subscribe [first downstream connection]
    s1 --> s1 : S17-REPEATWHEN-VALUE source.next [source generation is current]
    s1 --> s2 : S17-REPEATWHEN-FIRST-SOURCE-COMPLETE source.complete [current source completes, and notifier has never been constructed]
    s1 --> s2 : S17-REPEATWHEN-SOURCE-COMPLETE-WAIT source.complete [current source completes and notifier is still open]
    s1 --> s3 : S17-REPEATWHEN-SOURCE-COMPLETE-STOP source.complete [current source completes after notifier has completed]
    s2 --> s1 : S17-REPEATWHEN-RESTART notifier.next [notifier is open and source has completed]
    s2 --> s3 : S17-REPEATWHEN-NOTIFIER-COMPLETE-WAIT notifier.complete [notifier completes with main source finished]
    s1 --> s1 : S17-REPEATWHEN-NOTIFIER-COMPLETE-ACTIVE notifier.complete [notifier completes while restarted source is still active]
    s1 --> s3 : S17-REPEATWHEN-NOTIFIER-ERROR-ACTIVE notifier.error [notifier is open]
    s1 --> s3 : S17-REPEATWHEN-CANCEL-ACTIVE cancel [downstream cancellation]
    s2 --> s3 : S17-REPEATWHEN-NOTIFIER-ERROR-WAITING notifier.error [notifier is open]
    s2 --> s3 : S17-REPEATWHEN-CANCEL-WAITING cancel [downstream cancellation]
    s1 --> s3 : S17-REPEATWHEN-SOURCE-ERROR source.error [current source generation fails]
```
