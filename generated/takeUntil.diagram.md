# takeUntil-Observable-notifier: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Starting" as s1
    state "Active" as s2
    state "Closed" as s3
    [*] --> s0
    s0 --> s1 : TAKEUNTIL-INIT subscribe [fresh execution]
    s1 --> s2 : TAKEUNTIL-SOURCE-CONNECT setup.ready [notifier setup returned without terminating downstream]
    s1 --> s3 : TAKEUNTIL-SETUP-NOTIFIER-NEXT notifier.next [matching live notifier subscription]
    s1 --> s1 : TAKEUNTIL-SETUP-NOTIFIER-COMPLETE notifier.complete [matching live notifier subscription]
    s1 --> s3 : TAKEUNTIL-SETUP-NOTIFIER-ERROR notifier.error [matching live notifier subscription]
    s2 --> s3 : TAKEUNTIL-LIVE-NOTIFIER-NEXT notifier.next [matching live notifier subscription]
    s2 --> s2 : TAKEUNTIL-LIVE-NOTIFIER-COMPLETE notifier.complete [matching live notifier subscription]
    s2 --> s3 : TAKEUNTIL-LIVE-NOTIFIER-ERROR notifier.error [matching live notifier subscription]
    s2 --> s2 : TAKEUNTIL-PASS source.next [gate is open]
    s2 --> s3 : TAKEUNTIL-SOURCE-COMPLETE source.complete [source connected, regardless of gate state]
    s2 --> s3 : TAKEUNTIL-SOURCE-ERROR source.error [source connected, regardless of gate state]
    s2 --> s3 : TAKEUNTIL-CANCEL cancel [source connected, regardless of gate state]
```
