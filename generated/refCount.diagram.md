# refCount-publish-Subject-legacy: state diagram

> Generated from the canonical model by npm run generate. Do not edit this projection.

Finite control-state projection; stored data and guards remain in the table. Edges are not timing assertions.

```mermaid
stateDiagram-v2
    state "Disconnected" as s0
    state "Connected" as s1
    state "Completed" as s2
    state "Errored" as s3
    [*] --> s0
    s0 --> s1 : S18-REFCOUNT-CONNECT subscriber.subscribe [fresh subscription ID and available connection generation]
    s1 --> s1 : S18-REFCOUNT-JOIN subscriber.subscribe [fresh subscription ID]
    s1 --> s1 : S18-REFCOUNT-NEXT source.next [current source generation]
    s1 --> s1 : S18-REFCOUNT-LEAVE subscriber.unsubscribe [registered subscriber and at least one other remains]
    s1 --> s0 : S18-REFCOUNT-LAST-RESET subscriber.unsubscribe [the last registered subscriber leaves; resetOnRefCountZero=true]
    s1 --> s2 : S18-REFCOUNT-COMPLETE-RETAIN source.complete [current generation; resetOnComplete=false]
    s2 --> s2 : S18-REFCOUNT-LATE-COMPLETE subscriber.subscribe [fresh subscription ID; retained terminal Subject]
    s1 --> s3 : S18-REFCOUNT-ERROR-RETAIN source.error [current generation; resetOnError=false]
    s3 --> s3 : S18-REFCOUNT-LATE-ERROR subscriber.subscribe [fresh subscription ID; retained terminal Subject]
```
