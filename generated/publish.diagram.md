# publish-legacy-fixed-subject: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Ready" as s0
    state "Connected" as s1
    state "Stopped" as s2
    [*] --> s0
    s0 --> s0 : S16-PUBLISH-JOIN-READY observer.subscribe [new nonnegative observer id]
    s0 --> s0 : S16-PUBLISH-LEAVE-READY observer.cancel [observer is registered]
    s1 --> s1 : S16-PUBLISH-JOIN-CONNECTED observer.subscribe [new nonnegative observer id]
    s1 --> s1 : S16-PUBLISH-LEAVE-CONNECTED observer.cancel [observer is registered]
    s0 --> s1 : S16-PUBLISH-CONNECT connect [no active upstream source connection]
    s1 --> s1 : S16-PUBLISH-CONNECT-IDEMPOTENT connect [connection already live]
    s1 --> s0 : S16-PUBLISH-DISCONNECT disconnect [explicit upstream connection cancellation]
    s1 --> s1 : S16-PUBLISH-SOURCE-NEXT source.next [notification from current source generation]
    s1 --> s2 : S16-PUBLISH-SOURCE-COMPLETE source.complete [current source completed]
    s1 --> s2 : S16-PUBLISH-SOURCE-ERROR source.error [current source fails]
    s2 --> s2 : S16-PUBLISH-LATE-SUBSCRIBE observer.subscribe [new nonnegative observer id]
```
