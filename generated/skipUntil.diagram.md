# skipUntil-Observable-notifier: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Unsubscribed" as s0
    state "Starting" as s1
    state "Active" as s2
    state "StoppedBeforeSource" as s3
    state "Closed" as s4
    [*] --> s0
    s0 --> s1 : SKIPUNTIL-INIT subscribe [fresh execution]
    s1 --> s2 : SKIPUNTIL-SOURCE-CONNECT setup.ready [notifier setup returned without terminating downstream]
    s1 --> s1 : SKIPUNTIL-SETUP-NOTIFIER-NEXT notifier.next [matching live notifier subscription]
    s1 --> s1 : SKIPUNTIL-SETUP-NOTIFIER-COMPLETE notifier.complete [matching live notifier subscription]
    s1 --> s3 : SKIPUNTIL-SETUP-NOTIFIER-ERROR notifier.error [matching live notifier subscription]
    s2 --> s2 : SKIPUNTIL-LIVE-NOTIFIER-NEXT notifier.next [matching live notifier subscription]
    s2 --> s2 : SKIPUNTIL-LIVE-NOTIFIER-COMPLETE notifier.complete [matching live notifier subscription]
    s2 --> s4 : SKIPUNTIL-LIVE-NOTIFIER-ERROR notifier.error [matching live notifier subscription]
    s3 --> s4 : SKIPUNTIL-CLOSED-SOURCE-ATTEMPT setup.ready [notifier setup returned after synchronous error]
    s2 --> s2 : SKIPUNTIL-DROP source.next [gate is closed]
    s2 --> s2 : SKIPUNTIL-PASS source.next [gate is open]
    s2 --> s4 : SKIPUNTIL-SOURCE-COMPLETE source.complete [source connected, regardless of gate state]
    s2 --> s4 : SKIPUNTIL-SOURCE-ERROR source.error [source connected, regardless of gate state]
    s2 --> s4 : SKIPUNTIL-CANCEL cancel [source connected, regardless of gate state]
```
