# sample-source-first-notifier: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Listening" as s1
    state "Closed" as s2
    [*] --> s0
    s0 --> s1 : S18-SAMPLE-START subscribe [first result subscription]
    s1 --> s1 : S18-SAMPLE-REMEMBER source.next [live source emission (any payload)]
    s1 --> s1 : S18-SAMPLE-NOTIFIER-EMIT notifier.next [notifier next with pending value]
    s1 --> s1 : S18-SAMPLE-NOTIFIER-EMPTY notifier.next [notifier next with no value since last sample]
    s1 --> s1 : S18-SAMPLE-NOTIFIER-COMPLETE notifier.complete [notifier is open; completion is not a sampling notification]
    s1 --> s2 : S18-SAMPLE-NOTIFIER-ERROR notifier.error [notifier is open]
    s1 --> s2 : S18-SAMPLE-COMPLETE source.complete [source completes]
    s1 --> s2 : S18-SAMPLE-ERROR source.error [source fails]
    s1 --> s2 : S18-SAMPLE-CANCEL cancel [consumer cancels]
```
