# publishLast-legacy-fixed-subject: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Ready" as s0
    state "Connected" as s1
    state "Stopped" as s2
    [*] --> s0
    s0 --> s0 : S16-PUBLISHLAST-JOIN-READY observer.subscribe [new nonnegative observer id]
    s0 --> s0 : S16-PUBLISHLAST-LEAVE-READY observer.cancel [observer is registered]
    s1 --> s1 : S16-PUBLISHLAST-JOIN-CONNECTED observer.subscribe [new nonnegative observer id]
    s1 --> s1 : S16-PUBLISHLAST-LEAVE-CONNECTED observer.cancel [observer is registered]
    s0 --> s1 : S16-PUBLISHLAST-CONNECT connect [no active upstream source connection]
    s1 --> s1 : S16-PUBLISHLAST-CONNECT-IDEMPOTENT connect [connection already live]
    s1 --> s0 : S16-PUBLISHLAST-DISCONNECT disconnect [explicit upstream connection cancellation]
    s1 --> s1 : S16-PUBLISHLAST-SOURCE-NEXT source.next [notification from current source generation]
    s1 --> s2 : S16-PUBLISHLAST-SOURCE-COMPLETE source.complete [current source completed]
    s1 --> s2 : S16-PUBLISHLAST-SOURCE-ERROR source.error [current source fails]
    s2 --> s2 : S16-PUBLISHLAST-LATE-SUBSCRIBE observer.subscribe [new nonnegative observer id]
```
